import math
from datetime import UTC, datetime

import pytest

from core.eval.harness import EvalHarness
from core.guardrails.base import apply_guardrails
from core.guardrails.verdict import VerdictType
from core.policies.base import Policy
from core.sim.scenarios import SyntheticTransactionScenario
from core.sim.types import Action, Hidden, Observable
from packs.payments_fraud.features import (
    FEATURE_ORDER,
    extract_transaction_features,
    feature_vector,
)
from packs.payments_fraud.guardrails import HighValueGuardrail
from packs.payments_fraud.policies import RuleBasedFraudPolicy, ThresholdModelFraudPolicy

NOW = datetime(2026, 11, 1, tzinfo=UTC)


def tx(amount=100.0, velocity=0, trust=0.8, age=200, cross=False):
    return Observable(
        id="tx_1",
        features={
            "amount": amount,
            "currency": "USD",
            "customer_age_days": age,
            "velocity_1h": velocity,
            "device_trust": trust,
            "cross_border": cross,
        },
    )


class AlwaysBlock(Policy):
    def __init__(self):
        super().__init__("always_block")

    def decide(self, obs):
        return Action(decision="BLOCK")


def dev_data(seed=1000, n=20000):
    events = list(SyntheticTransactionScenario(n_events=n).with_seed(seed).generate())
    return [o for o, _ in events], [h.is_positive for _, h in events]


# ---- features ----
def test_features_known_values_and_order():
    f = extract_transaction_features(
        tx(amount=100.0, velocity=4, trust=0.5, age=30, cross=True).features
    )
    assert list(f) == list(FEATURE_ORDER)
    assert f["log_amount"] == pytest.approx(math.log1p(100.0) / math.log1p(5000.0))
    assert f["log_age"] == pytest.approx(math.log1p(30) / math.log1p(2000.0))
    assert f["velocity"] == pytest.approx(0.5)
    assert f["device_trust"] == 0.5
    assert f["cross_border"] == 1.0
    assert feature_vector(f) == [f[k] for k in FEATURE_ORDER]


@pytest.mark.parametrize(
    "change",
    [
        {"amount": -1.0},
        {"amount": float("nan")},
        {"amount": "5"},
        {"amount": True},
        {"device_trust": 1.5},
        {"cross_border": "yes"},
        {"velocity_1h": float("inf")},
    ],
)
def test_bad_features_raise(change):
    raw = {**tx().features, **change}
    with pytest.raises(ValueError):
        extract_transaction_features(raw)


@pytest.mark.parametrize(
    "key", ["amount", "customer_age_days", "velocity_1h", "device_trust", "cross_border"]
)
def test_missing_feature_raises(key):
    raw = dict(tx().features)
    del raw[key]
    with pytest.raises(ValueError):
        extract_transaction_features(raw)


# ---- guardrail ----
def test_guardrail_name_and_default_limit():
    g = HighValueGuardrail()
    assert g.name == "high_value" and g.max_allowed_amount == 4000.0


def test_high_value_block_is_vetoed_to_review():
    g = apply_guardrails(Action(decision="BLOCK"), [HighValueGuardrail()], tx(amount=4001.0), NOW)
    assert g.final.decision == "REVIEW"
    assert g.verdicts[0].verdict == VerdictType.BLOCK
    assert g.verdicts[0].reason == "HIGH_VALUE_AUTO_BLOCK"


@pytest.mark.parametrize("amount", [4000.0, 3999.99, 5.0])
def test_block_at_or_below_limit_passes(amount):
    g = apply_guardrails(Action(decision="BLOCK"), [HighValueGuardrail()], tx(amount=amount), NOW)
    assert g.final.decision == "BLOCK"
    assert g.verdicts[0].verdict == VerdictType.ALLOW


@pytest.mark.parametrize("decision", ["ALLOW", "REVIEW", "GIVE_UP"])
def test_only_auto_block_is_touched(decision):
    g = apply_guardrails(Action(decision=decision), [HighValueGuardrail()], tx(amount=5000.0), NOW)
    assert g.final.decision == decision


def test_bad_amount_fails_closed_for_block_only():
    empty = Observable(id="x", features={})
    blocked = apply_guardrails(Action(decision="BLOCK"), [HighValueGuardrail()], empty, NOW)
    assert blocked.final.decision == "REVIEW"
    assert blocked.verdicts[0].reason.startswith("RAIL_ERROR")
    allowed = apply_guardrails(Action(decision="ALLOW"), [HighValueGuardrail()], empty, NOW)
    assert allowed.final.decision == "ALLOW"


@pytest.mark.parametrize("bad", [0, -1, float("nan"), float("inf"), True, "x"])
def test_guardrail_rejects_bad_limit(bad):
    with pytest.raises(ValueError):
        HighValueGuardrail(bad)


def test_guardrail_in_harness_matches_rule():
    recs = EvalHarness(guardrail=HighValueGuardrail()).run(AlwaysBlock(), seed=42).records
    assert any(r["amount"] > 4000.0 for r in recs)
    for r in recs:
        if r["amount"] > 4000.0:
            assert r["final"] == "REVIEW" and r["overridden"]
            assert r["vetoes"] == ["HIGH_VALUE_AUTO_BLOCK"]
        else:
            assert r["final"] == "BLOCK" and not r["overridden"]


# ---- rule-based policy ----
def test_rule_defaults():
    p = RuleBasedFraudPolicy()
    assert p.decide(tx(velocity=5)).decision == "BLOCK"
    assert p.decide(tx(velocity=4, amount=100.0)).decision == "ALLOW"
    assert p.decide(tx(amount=2000.0)).decision == "BLOCK"
    assert p.decide(tx(amount=1999.99)).decision == "ALLOW"


def test_rule_custom_and_amount_rule_off():
    p = RuleBasedFraudPolicy(amount_threshold=5001.0, velocity_threshold=3)
    assert p.decide(tx(amount=5000.0)).decision == "ALLOW"
    assert p.decide(tx(velocity=3)).decision == "BLOCK"


def test_rule_reports_which_rule_fired():
    p = RuleBasedFraudPolicy()
    assert p.decide(tx(velocity=6)).metadata == {"rule": "velocity"}
    assert p.decide(tx(amount=3000.0)).metadata == {"rule": "amount"}


def test_rule_rejects_hidden_and_missing_features():
    p = RuleBasedFraudPolicy()
    with pytest.raises(TypeError):
        p.decide(Hidden(is_positive=True, true_label="x", metadata={}))
    with pytest.raises(ValueError):
        p.decide(Observable(id="x", features={"amount": 10.0}))


@pytest.mark.parametrize(
    "kwargs",
    [
        {"amount_threshold": -1},
        {"amount_threshold": float("nan")},
        {"amount_threshold": True},
        {"velocity_threshold": -1},
        {"velocity_threshold": 2.5},
        {"velocity_threshold": True},
    ],
)
def test_rule_rejects_bad_thresholds(kwargs):
    with pytest.raises(ValueError):
        RuleBasedFraudPolicy(**kwargs)


# ---- threshold model ----
def test_untrained_model_refuses_to_decide():
    with pytest.raises(RuntimeError):
        ThresholdModelFraudPolicy().decide(tx())


def test_manual_weights_hand_checked():
    p = ThresholdModelFraudPolicy(weights=[0, 0, 10, 0, 0], bias=-5.0)
    assert p.score(tx(velocity=4)) == pytest.approx(0.5)
    assert p.decide(tx(velocity=4)).decision == "BLOCK"  # score >= threshold
    low = p.decide(tx(velocity=3))
    assert low.decision == "ALLOW"
    assert p.score(tx(velocity=3)) == pytest.approx(1.0 / (1.0 + math.exp(1.25)))


def test_extreme_weights_stay_finite():
    p = ThresholdModelFraudPolicy(weights=[0, 0, 1000, 0, 0])
    assert 0.0 < p.score(tx(velocity=8)) <= 1.0


def test_model_rejects_hidden():
    p = ThresholdModelFraudPolicy(weights=[0, 0, 1, 0, 0])
    with pytest.raises(TypeError):
        p.decide(Hidden(is_positive=True, true_label="x", metadata={}))


@pytest.mark.parametrize(
    "kwargs",
    [
        {"score_threshold": 0.0},
        {"score_threshold": 1.5},
        {"score_threshold": True},
        {"weights": [1, 2]},
        {"weights": [0, 0, float("nan"), 0, 0]},
        {"weights": [0, 0, 1, 0, 0], "bias": float("inf")},
    ],
)
def test_model_rejects_bad_params(kwargs):
    with pytest.raises(ValueError):
        ThresholdModelFraudPolicy(**kwargs)


def test_fit_learns_the_signal_and_is_deterministic():
    obs, labels = dev_data()
    a = ThresholdModelFraudPolicy.fit(obs, labels)
    b = ThresholdModelFraudPolicy.fit(obs, labels)
    assert a.params() == b.params()
    w = dict(zip(FEATURE_ORDER, a.params()["weights"], strict=True))
    assert w["velocity"] > 0
    assert w["device_trust"] < 0
    assert w["cross_border"] > 0
    assert w["log_age"] < 0
    assert abs(w["log_amount"]) < abs(w["velocity"])


def test_fit_rejects_bad_data():
    obs, labels = dev_data(n=200)
    with pytest.raises(ValueError):
        ThresholdModelFraudPolicy.fit(obs, labels[:-1])
    with pytest.raises(ValueError):
        ThresholdModelFraudPolicy.fit([], [])
    with pytest.raises(ValueError):
        ThresholdModelFraudPolicy.fit(obs, [False] * len(obs))


def test_trained_model_beats_do_nothing_on_unseen_seed_and_keeps_invariant():
    obs, labels = dev_data()
    model = ThresholdModelFraudPolicy.fit(obs, labels, score_threshold=0.3)
    lift, attributed = EvalHarness(policy=model).compute_lift_and_attribution(42)
    assert lift > 0
    assert lift <= attributed
