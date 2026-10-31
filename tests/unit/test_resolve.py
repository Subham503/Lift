import dataclasses

import numpy as np
import pytest

from core.sim.costs import DEFAULT_COSTS, CostModel
from core.sim.types import Action, Hidden
from core.sim.world import resolve

AMT = 100.0
ALWAYS_CAUGHT = CostModel(review_catch_rate=1.0)
NEVER_CAUGHT = CostModel(review_catch_rate=0.0)


def hid(fraud, amount=AMT, label="x"):
    return Hidden(is_positive=fraud, true_label=label, metadata={"amount": amount})


def run(decision, fraud, costs=DEFAULT_COSTS, amount=AMT, seed=1):
    return resolve(Action(decision=decision), hid(fraud, amount), np.random.default_rng(seed), costs)


@pytest.mark.parametrize(
    ("decision", "fraud", "costs", "expected"),
    [
        ("ALLOW", False, DEFAULT_COSTS, 0.0),
        ("ALLOW", True, DEFAULT_COSTS, 115.0),  # 100 + 15 fee
        ("GIVE_UP", True, DEFAULT_COSTS, 115.0),
        ("GIVE_UP", False, DEFAULT_COSTS, 0.0),
        ("BLOCK", True, DEFAULT_COSTS, 0.0),
        ("BLOCK", False, DEFAULT_COSTS, 8.0),  # 3% of 100 + 5
        ("REVIEW", False, DEFAULT_COSTS, 4.0),  # 6 min * 40/hr
        ("REVIEW", True, ALWAYS_CAUGHT, 4.0),
        ("REVIEW", True, NEVER_CAUGHT, 119.0),  # 4 + 115
    ],
)
def test_actual_loss_table(decision, fraud, costs, expected):
    assert run(decision, fraud, costs).actual_loss == pytest.approx(expected)


@pytest.mark.parametrize("decision", ["ALLOW", "BLOCK", "REVIEW", "GIVE_UP"])
def test_counterfactual_is_allow_loss(decision):
    assert run(decision, True).counterfactual_loss == pytest.approx(115.0)
    assert run(decision, False).counterfactual_loss == 0.0


def test_review_details():
    d = run("REVIEW", True, NEVER_CAUGHT).details
    assert d["review_hours"] == pytest.approx(0.1)
    assert d["review_missed_fraud"] is True
    assert run("REVIEW", True, ALWAYS_CAUGHT).details["review_missed_fraud"] is False
    assert run("REVIEW", False, NEVER_CAUGHT).details["review_missed_fraud"] is False


@pytest.mark.parametrize("decision", ["ALLOW", "BLOCK", "REVIEW", "GIVE_UP"])
@pytest.mark.parametrize("fraud", [True, False])
def test_label_text_never_changes_outcome(decision, fraud):
    a = resolve(Action(decision=decision), hid(fraud, label="phishing"), np.random.default_rng(3))
    b = resolve(Action(decision=decision), hid(fraud, label="card_stolen"), np.random.default_rng(3))
    assert a == b
    assert "phishing" not in repr(a)


@pytest.mark.parametrize("decision", ["ALLOW", "BLOCK", "REVIEW", "GIVE_UP"])
@pytest.mark.parametrize("fraud", [True, False])
def test_exactly_one_draw(decision, fraud):
    used = np.random.default_rng(5)
    resolve(Action(decision=decision), hid(fraud), used)
    ref = np.random.default_rng(5)
    ref.random()
    assert used.bit_generator.state == ref.bit_generator.state


def test_paired_alignment_across_decisions():
    c = CostModel(review_catch_rate=0.5)
    outs = []
    for first in ("ALLOW", "BLOCK", "REVIEW", "GIVE_UP"):
        rng = np.random.default_rng(7)
        resolve(Action(decision=first), hid(False), rng, c)
        outs.append(resolve(Action(decision="REVIEW"), hid(True), rng, c))
    assert all(o == outs[0] for o in outs)


def test_review_catch_rate_is_statistically_right():
    rng = np.random.default_rng(11)
    n = 20000
    missed = sum(
        resolve(Action(decision="REVIEW"), hid(True), rng).details["review_missed_fraud"]
        for _ in range(n)
    )
    assert abs(missed / n - 0.10) < 0.01


def test_same_seed_same_outcome():
    assert run("REVIEW", True, seed=9) == run("REVIEW", True, seed=9)


@pytest.mark.parametrize(
    "meta",
    [{}, {"amount": -1}, {"amount": float("nan")}, {"amount": float("inf")}, {"amount": True}, {"amount": "5"}],
)
def test_bad_amount_raises(meta):
    h = Hidden(is_positive=True, true_label="x", metadata=meta)
    with pytest.raises(ValueError):
        resolve(Action(decision="ALLOW"), h, np.random.default_rng(1))


def test_unknown_decision_raises():
    with pytest.raises(ValueError):
        run("DENY", True)


def test_numpy_amount_accepted():
    assert run("ALLOW", True, amount=np.float64(100.0)).actual_loss == pytest.approx(115.0)
    assert run("ALLOW", True, amount=np.int64(100)).actual_loss == pytest.approx(115.0)


def test_zero_amount_fraud_still_pays_fee():
    assert run("ALLOW", True, amount=0.0).actual_loss == pytest.approx(15.0)


def test_cost_model_is_frozen_and_validated():
    with pytest.raises(dataclasses.FrozenInstanceError):
        DEFAULT_COSTS.chargeback_fee = 1.0  # type: ignore[misc]
    for bad in ({"chargeback_fee": -1}, {"margin_rate": 1.5}, {"review_catch_rate": 2}, {"analyst_hourly": float("nan")}):
        with pytest.raises(ValueError):
            CostModel(**bad)


def test_default_review_cost_is_four_dollars():
    assert DEFAULT_COSTS.review_cost == pytest.approx(4.0)
    assert DEFAULT_COSTS.review_hours == pytest.approx(0.1)
