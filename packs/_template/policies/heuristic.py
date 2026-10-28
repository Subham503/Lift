"""Template heuristic policy."""

from core.policies.base import Policy
from core.sim.types import Action, Observable


class HeuristicPolicy(Policy):
    """Simple threshold heuristic policy."""

    def __init__(self, threshold: float = 0.8) -> None:
        raise NotImplementedError("phase 01")

    def decide(self, obs: Observable) -> Action:
        raise NotImplementedError("phase 01")
