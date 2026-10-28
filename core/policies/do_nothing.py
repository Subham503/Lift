"""Baseline Do-Nothing policy."""

from ..sim.types import Action, Observable
from .base import Policy


class DoNothingPolicy(Policy):
    """Default baseline policy that takes a neutral 'ALLOW' decision."""

    def __init__(self) -> None:
        raise NotImplementedError("phase 01")

    def decide(self, obs: Observable) -> Action:
        raise NotImplementedError("phase 01")
