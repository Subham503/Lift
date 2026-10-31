"""World environment simulator and outcome resolution."""

import math
import numbers
from collections.abc import Generator
from typing import Any

import numpy as np

from .costs import DEFAULT_COSTS, CostModel
from .scenarios import Scenario
from .types import Action, Hidden, Observable, Outcome

DECISIONS = frozenset({"ALLOW", "BLOCK", "REVIEW", "GIVE_UP"})


def _amount(hidden: Hidden) -> float:
    meta = hidden.metadata
    if not isinstance(meta, dict) or "amount" not in meta:
        raise ValueError("hidden.metadata['amount'] is required")
    raw = meta["amount"]
    if isinstance(raw, bool) or not isinstance(raw, numbers.Real):
        raise ValueError("amount must be a real number")
    amount = float(raw)
    if not math.isfinite(amount) or amount < 0:
        raise ValueError("amount must be finite and >= 0")
    return amount


def resolve(
    action: Action,
    hidden: Hidden,
    rng: np.random.Generator,
    costs: CostModel = DEFAULT_COSTS,
) -> Outcome:
    """Resolve physical outcome from preconditions, action, and hidden ground truth.

    Uses only is_positive and amount. true_label is never read, so a label
    cannot leak into the outcome. Exactly ONE rng draw is consumed per call,
    whatever the decision, so paired runs of different policies stay aligned.
    """
    decision = action.decision
    if decision not in DECISIONS:
        raise ValueError(f"unknown decision: {decision!r}")
    amount = _amount(hidden)
    fraud = bool(hidden.is_positive)
    draw = float(rng.random())

    counterfactual = costs.allow_loss(amount, fraud)
    details: dict[str, Any] = {"decision": decision}

    if decision in ("ALLOW", "GIVE_UP"):
        loss = counterfactual
    elif decision == "BLOCK":
        loss = 0.0 if fraud else costs.block_legit_loss(amount)
    else:  # REVIEW
        missed = fraud and draw >= costs.review_catch_rate
        loss = costs.review_cost + (counterfactual if missed else 0.0)
        details["review_hours"] = costs.review_hours
        details["review_missed_fraud"] = missed

    return Outcome(actual_loss=loss, counterfactual_loss=counterfactual, details=details)


class World:
    """Manages the environment simulation loop."""

    def __init__(self, scenario: Scenario):
        raise NotImplementedError("phase 01")

    def run(self) -> Generator[tuple[Observable, Hidden], Action, None]:
        """Yields (observable, hidden) and receives Action."""
        raise NotImplementedError("phase 01")
