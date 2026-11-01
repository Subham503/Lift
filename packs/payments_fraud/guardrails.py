"""Guardrails for payments fraud pack."""

from __future__ import annotations

import math
import numbers
from datetime import datetime

from core.guardrails.base import Guardrail
from core.guardrails.verdict import Verdict, VerdictType
from core.sim.types import Action, Observable

from .features import read_number


class HighValueGuardrail(Guardrail):
    """Vetoes an automatic BLOCK above an amount limit so a person decides instead.

    A veto turns the BLOCK into REVIEW (see core/guardrails/base.py). ALLOW and
    GIVE_UP are safe defaults and are never touched. The limit is an ASSUMPTION.
    """

    def __init__(self, max_allowed_amount: float = 4000.0) -> None:
        super().__init__("high_value")
        if (
            isinstance(max_allowed_amount, bool)
            or not isinstance(max_allowed_amount, numbers.Real)
            or not math.isfinite(max_allowed_amount)
            or max_allowed_amount <= 0
        ):
            raise ValueError("max_allowed_amount must be a finite number > 0")
        self.max_allowed_amount: float = float(max_allowed_amount)

    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        if action.decision != "BLOCK":
            return Verdict(verdict=VerdictType.ALLOW, reason="NOT_AN_AUTO_BLOCK")
        amount = read_number(obs.features, "amount")
        if amount > self.max_allowed_amount:
            return Verdict(
                verdict=VerdictType.BLOCK,
                reason="HIGH_VALUE_AUTO_BLOCK",
                metadata={"amount": amount, "limit": self.max_allowed_amount},
            )
        return Verdict(verdict=VerdictType.ALLOW, reason="WITHIN_LIMIT")
