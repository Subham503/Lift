import dataclasses
import math

import pytest

from core.audit.store import AuditStore
from core.eval import harness as harness_mod
from core.eval.harness import EvalHarness
from core.guardrails.verdict import Verdict, VerdictType
from core.policies.do_nothing import DoNothingPolicy
from core.sim.costs import DEFAULT_COSTS
from core.sim.scenarios import SyntheticTransactionScenario
from core.sim.types import Action, Observable


class Fixed:
    def __init__(self, decision, name="fixed"):
        self.decision, self.name = decision, name

    def decide(self, obs):
        return Action(decision=self.decision)


class Oracle:
    """Test-only cheat: knows which ids are fraud. A real policy cannot."""

    name = "oracle"

    def __init__(self, ids):
        self.ids = ids

    def decide(self, obs):
        return Action(decision="BLOCK" if obs.id in self.ids else "ALLOW")


class Spy:
    name = "spy"

    def __init__(self):
        self.seen = []

    def decide(self, obs):
        self.seen.append(obs)
        return Action(decision="ALLOW")


class VetoAll:
    def evaluate(self, action, obs, now):
        return Verdict(verdict=VerdictType.BLOCK, reason="TEST")


def fraud_ids(seed):
    return {
        o.id for o, h in SyntheticTransactionScenario().with_seed(seed).generate() if h.is_positive
    }


def mean(xs):
    return sum(xs) / len(xs)


# ---- scenario ----
def test_scenario_same_seed_same_events_and_original_untouched():
    s = SyntheticTransactionScenario()
    assert list(s.generate()) == list(s.generate())
    other = s.with_seed(7)
    assert other.seed == 7 and s.seed == 42
    assert list(other.generate()) != list(s.generate())


def test_fraud_rate_near_assumption():
    ev = list(SyntheticTransactionScenario(n_events=20000).generate())
    assert abs(sum(h.is_positive for _, h in ev) / len(ev) - 0.025) < 0.005


def test_amounts_ids_and_count():
    ev = list(SyntheticTransactionScenario().generate())
    assert len(ev) == 2000
    assert ev[0][0].id == "tx_0001"
    assert len({o.id for o, _ in ev}) == 2000
    assert all(5.0 <= h.metadata["amount"] <= 5000.0 for _, h in ev)


def test_features_informative_but_overlapping():
    ev = list(SyntheticTransactionScenario(n_events=20000).generate())
    fr = [o.features for o, h in ev if h.is_positive]
    ok = [o.features for o, h in ev if not h.is_positive]
    assert mean([f["velocity_1h"] for f in fr]) > mean([f["velocity_1h"] for f in ok])
    assert mean([f["device_trust"] for f in fr]) < mean([f["device_trust"] for f in ok])
    assert any(f["velocity_1h"] <= 2 for f in fr)
    assert any(f["device_trust"] >= 0.5 for f in fr)


@pytest.mark.parametrize(
    "kwargs",
    [
        {"n_events": 0},
        {"fraud_rate": 1.5},
        {"fraud_rate": float("nan")},
        {"amount_min": 0.0},
        {"amount_min": 10.0, "amount_max": 5.0},
        {"seed": -1},
    ],
)
def test_scenario_validation(kwargs):
    with pytest.raises(ValueError):
        SyntheticTransactionScenario(**kwargs)


# ---- digest and pairing ----
def test_same_seed_same_digest_and_records():
    h = EvalHarness()
    a, b = h.run(DoNothingPolicy(), seed=42), h.run(DoNothingPolicy(), seed=42)
    assert a.events_digest == b.events_digest and a.records == b.records
    assert a.events_digest.startswith("sha256:")


def test_different_seed_different_digest():
    h = EvalHarness()
    assert (
        h.run(DoNothingPolicy(), seed=42).events_digest
        != h.run(DoNothingPolicy(), seed=43).events_digest
    )


@pytest.mark.parametrize("decision", ["ALLOW", "BLOCK", "REVIEW", "GIVE_UP"])
def test_digest_independent_of_policy(decision):
    h = EvalHarness()
    base = h.run(DoNothingPolicy(), seed=42)
    other = h.run(Fixed(decision), seed=42)
    assert other.events_digest == base.events_digest


def test_policies_differ_in_loss_even_with_same_digest():
    h = EvalHarness()
    a = math.fsum(r["actual_loss"] for r in h.run(DoNothingPolicy(), seed=42).records)
    b = math.fsum(r["actual_loss"] for r in h.run(Fixed("BLOCK"), seed=42).records)
    assert a != b


def test_paired_batches_same_events():
    a, b = EvalHarness().generate_paired_batches(42)
    assert len(a) == 2000 and a == b and a[0] is b[0]
    assert EvalHarness().generate_paired_batches(43)[0] != a


# ---- isolation ----
def test_policy_sees_observable_only():
    spy = Spy()
    EvalHarness().run(spy, seed=42)
    assert len(spy.seen) == 2000
    for o in spy.seen:
        assert isinstance(o, Observable)
        assert not ({"is_positive", "true_label", "label"} & set(o.features))
    blob = repr(spy.seen)
    for word in ("legit", "card_cloned", "account_takeover", "velocity_burst"):
        assert word not in blob


def test_non_action_return_rejected():
    class Bad:
        def decide(self, obs):
            return "ALLOW"

    with pytest.raises(TypeError):
        EvalHarness().run(Bad(), seed=1)


def test_negative_seed_rejected():
    with pytest.raises(ValueError):
        EvalHarness().run(DoNothingPolicy(), seed=-1)


# ---- losses match hand calculation ----
def test_do_nothing_loss_matches_hand_calc():
    sc = SyntheticTransactionScenario()
    expected = math.fsum(
        h.metadata["amount"] + DEFAULT_COSTS.chargeback_fee
        for _, h in sc.generate()
        if h.is_positive
    )
    res = EvalHarness().run(DoNothingPolicy(), seed=42)
    assert math.fsum(r["actual_loss"] for r in res.records) == pytest.approx(expected)
    assert not any(r["overridden"] for r in res.records)


def test_block_all_loss_matches_hand_calc():
    sc = SyntheticTransactionScenario()
    expected = math.fsum(
        DEFAULT_COSTS.block_legit_loss(h.metadata["amount"])
        for _, h in sc.generate()
        if not h.is_positive
    )
    res = EvalHarness().run(Fixed("BLOCK"), seed=42)
    assert math.fsum(r["actual_loss"] for r in res.records) == pytest.approx(expected)


# ---- guardrails and audit ----
def test_guardrail_veto_recorded_and_applied():
    res = EvalHarness(guardrail=VetoAll()).run(Fixed("BLOCK"), seed=42)
    assert all(
        r["final"] == "REVIEW" and r["overridden"] and r["vetoes"] == ["TEST"] for r in res.records
    )
    assert all(r["actual_loss"] == pytest.approx(4.0) for r in res.records if not r["is_fraud"])


def test_safe_default_not_overridden():
    res = EvalHarness(guardrail=VetoAll()).run(Fixed("ALLOW"), seed=42)
    assert not any(r["overridden"] or r["vetoes"] for r in res.records)


def test_single_and_list_guardrail_equal():
    a = EvalHarness(guardrail=VetoAll()).run(Fixed("BLOCK"), seed=3)
    b = EvalHarness(guardrail=[VetoAll()]).run(Fixed("BLOCK"), seed=3)
    assert a.records == b.records


def test_audit_written_without_hidden_truth(tmp_path):
    store = AuditStore(tmp_path / "a.jsonl", durable=False)
    EvalHarness(scenario=SyntheticTransactionScenario(n_events=50), audit_store=store).run(
        DoNothingPolicy(), seed=1
    )
    rows = store.read_all()
    assert len(rows) == 50 and rows[0]["tx"] == "tx_0001"
    assert not ({"is_fraud", "true_label", "is_positive"} & set(rows[0]))


# ---- lift invariant ----
def test_default_lift_is_vacuous_zero():
    assert EvalHarness().compute_lift_and_attribution(42) == (0.0, 0.0)


def test_oracle_lift_equals_attributed_and_positive():
    lift, attributed = EvalHarness(policy=Oracle(fraud_ids(42))).compute_lift_and_attribution(42)
    assert lift > 0
    assert lift <= attributed
    assert lift == pytest.approx(attributed)


@pytest.mark.parametrize("decision", ["BLOCK", "REVIEW"])
def test_lift_is_gross_benefit_minus_gross_harm(decision):
    h = EvalHarness(policy=Fixed(decision))
    lift, attributed = h.compute_lift_and_attribution(42)
    recs = h.run(Fixed(decision), seed=42).records
    harm = math.fsum(max(0.0, r["actual_loss"] - r["counterfactual_loss"]) for r in recs)
    assert lift <= attributed
    assert lift == pytest.approx(attributed - harm, rel=1e-9, abs=1e-6)


def test_invariant_catches_overcounted_lift(monkeypatch):
    real = harness_mod.resolve

    def broken(action, hidden, rng, costs=DEFAULT_COSTS):
        out = real(action, hidden, rng, costs)
        return dataclasses.replace(out, counterfactual_loss=out.counterfactual_loss / 2)

    ids = fraud_ids(42)
    monkeypatch.setattr(harness_mod, "resolve", broken)
    lift, attributed = EvalHarness(policy=Oracle(ids)).compute_lift_and_attribution(42)
    assert lift > attributed  # the real invariant test would fail here
