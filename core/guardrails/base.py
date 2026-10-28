"""Base guardrail interface and evaluation logic."""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from ..sim.types import Action, Observable
from .verdict import GuardedDecision, Verdict


class Guardrail(ABC):
    """Inspects proposed actions and returns an explicit Verdict."""

    def __init__(self, name: str = "base"):
        raise NotImplementedError("phase 01")

    @abstractmethod
    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        """Inspect proposed action given observable state and decision timestamp."""
        raise NotImplementedError("phase 01")


BaseGuardrail = Guardrail


def apply_guardrails(
    proposed: Action,
    rails: list[Any],
    obs: Observable,
    now: datetime,
) -> GuardedDecision:
    """Apply a chain of guardrails to a proposed action and return GuardedDecision."""
    raise NotImplementedError("phase 01")
