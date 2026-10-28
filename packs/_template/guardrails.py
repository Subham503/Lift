"""Template guardrail implementation."""

from datetime import datetime

from core.guardrails.base import Guardrail
from core.guardrails.verdict import Verdict
from core.sim.types import Action, Observable


class DefaultTemplateGuardrail(Guardrail):
    """Default passthrough guardrail."""

    def __init__(self) -> None:
        raise NotImplementedError("phase 01")

    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        raise NotImplementedError("phase 01")
