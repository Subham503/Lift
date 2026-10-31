"""Base guardrail interface and evaluation logic."""

from abc import ABC, abstractmethod
from dataclasses import replace
from datetime import datetime
from typing import Any

from ..sim.types import Action, Observable
from .verdict import GuardedDecision, Verdict, VerdictType

# Safe defaults are never vetoed or changed. A rail may still say BLOCK about
# them; that verdict is recorded and marked ignored.
SAFE_DEFAULTS = frozenset({"ALLOW", "GIVE_UP"})

# What a vetoed BLOCK becomes. Assumption: escalate to human review.
VETO_FALLBACK = "REVIEW"


class Guardrail(ABC):
    """Inspects proposed actions and returns an explicit Verdict."""

    def __init__(self, name: str = "base"):
        self.name = name

    @abstractmethod
    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        """Inspect proposed action given observable state and decision timestamp."""
        ...


BaseGuardrail = Guardrail


def _with_decision(proposed: Action, decision: str, note: dict[str, Any]) -> Action:
    meta = dict(proposed.metadata or {})
    meta.update(note)
    return Action(decision=decision, confidence=proposed.confidence, metadata=meta)


def apply_guardrails(
    proposed: Action,
    rails: list[Any],
    obs: Observable,
    now: datetime,
) -> GuardedDecision:
    """Apply a chain of guardrails to a proposed action and return GuardedDecision.

    Every rail is evaluated and every verdict is recorded, in order.
    Resolution: any BLOCK verdict beats any OVERRIDE. Safe defaults never change.
    There is deliberately no override or bypass parameter.
    """
    verdicts: list[Verdict] = []
    for rail in rails:
        try:
            verdict = rail.evaluate(proposed, obs, now)
        except Exception as exc:  # fail closed, and leave a trace
            verdict = Verdict(
                verdict=VerdictType.BLOCK,
                reason=f"RAIL_ERROR:{type(exc).__name__}",
                metadata={"rail": type(rail).__name__},
            )
        if not isinstance(verdict, Verdict):
            raise TypeError(f"{type(rail).__name__}.evaluate must return Verdict")
        verdicts.append(verdict)

    if proposed.decision in SAFE_DEFAULTS:
        recorded = [
            replace(v, metadata={**(v.metadata or {}), "ignored": True})
            if v.verdict != VerdictType.ALLOW
            else v
            for v in verdicts
        ]
        return GuardedDecision(final=proposed, verdicts=recorded)

    blocks = [v for v in verdicts if v.verdict == VerdictType.BLOCK]
    if blocks:
        final = _with_decision(
            proposed,
            VETO_FALLBACK,
            {"vetoed_from": str(proposed.decision), "veto_reason": blocks[0].reason},
        )
        return GuardedDecision(final=final, verdicts=verdicts)

    for v in verdicts:
        if v.verdict == VerdictType.OVERRIDE:
            if v.modified_action is None:
                raise ValueError("OVERRIDE verdict requires modified_action")
            return GuardedDecision(final=v.modified_action, verdicts=verdicts)

    return GuardedDecision(final=proposed, verdicts=verdicts)
