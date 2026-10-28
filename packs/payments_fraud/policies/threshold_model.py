"""Threshold scoring model policy."""

from core.policies.base import Policy
from core.sim.types import Action, Observable


class ThresholdModelFraudPolicy(Policy):
    """Linear risk score model with configurable decision threshold."""

    def __init__(self, score_threshold: float = 0.5) -> None:
        raise NotImplementedError("phase 01")

    def decide(self, obs: Observable) -> Action:
        raise NotImplementedError("phase 01")
