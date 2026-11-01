"""Rule-based baseline fraud policy."""

from __future__ import annotations

import math
import numbers

from core.policies.base import Policy
from core.sim.types import Action, Observable

from ..features import read_number


class RuleBasedFraudPolicy(Policy):
    """Heuristic rule flags elevated velocity and high amounts.

    The default thresholds come from the pack stub and are ASSUMPTIONS.
    A threshold above the largest possible amount switches the amount rule off.
    """

    def __init__(self, amount_threshold: float = 2000.0, velocity_threshold: int = 5) -> None:
        super().__init__("rule_based")
        if (
            isinstance(amount_threshold, bool)
            or not isinstance(amount_threshold, numbers.Real)
            or not math.isfinite(amount_threshold)
            or amount_threshold < 0
        ):
            raise ValueError("amount_threshold must be a finite number >= 0")
        if (
            isinstance(velocity_threshold, bool)
            or not isinstance(velocity_threshold, int)
            or velocity_threshold < 0
        ):
            raise ValueError("velocity_threshold must be an int >= 0")
        self.amount_threshold: float = float(amount_threshold)
        self.velocity_threshold: int = velocity_threshold

    def decide(self, obs: Observable) -> Action:
        amount = read_number(obs.features, "amount")
        velocity = read_number(obs.features, "velocity_1h")
        if velocity >= self.velocity_threshold:
            return Action(decision="BLOCK", confidence=1.0, metadata={"rule": "velocity"})
        if amount >= self.amount_threshold:
            return Action(decision="BLOCK", confidence=1.0, metadata={"rule": "amount"})
        return Action(decision="ALLOW", confidence=1.0)
