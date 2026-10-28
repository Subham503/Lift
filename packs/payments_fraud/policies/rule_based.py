"""Rule-based baseline fraud policy."""

from core.policies.base import Policy
from core.sim.types import Action, Observable


class RuleBasedFraudPolicy(Policy):
    """Heuristic rule flags high amounts and elevated velocity."""

    def __init__(self, amount_threshold: float = 2000.0, velocity_threshold: int = 5) -> None:
        raise NotImplementedError("phase 01")

    def decide(self, obs: Observable) -> Action:
        raise NotImplementedError("phase 01")
