"""Baseline Do-Nothing policy."""

from ..sim.types import Action, Observable
from .base import Policy


class DoNothingPolicy(Policy):
    """Default baseline policy that takes a neutral 'ALLOW' decision."""

    def __init__(self) -> None:
        super().__init__("do_nothing")

    def decide(self, obs: Observable) -> Action:
        return Action(decision="ALLOW", confidence=1.0)
