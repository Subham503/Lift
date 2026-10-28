"""Guardrails for payments fraud pack."""

from datetime import datetime

from core.guardrails.base import Guardrail
from core.guardrails.verdict import Verdict
from core.sim.types import Action, Observable


class HighValueGuardrail(Guardrail):
    """Requires manual block or step-up authentication on transactions above threshold."""

    def __init__(self, max_allowed_amount: float = 4000.0) -> None:
        raise NotImplementedError("phase 01")

    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        raise NotImplementedError("phase 01")
