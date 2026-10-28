"""Evaluation harness coordinating policies, guardrails, and scenarios."""

from dataclasses import dataclass
from typing import Any

from ..audit.store import AuditStore
from ..guardrails.base import Guardrail
from ..policies.base import Policy
from ..sim.scenarios import Scenario


@dataclass(frozen=True)
class RunResult:
    events_digest: str
    records: list[dict[str, Any]]


class EvalHarness:
    """Coordinates simulation runs and logs evaluation steps."""

    def __init__(
        self,
        policy: Policy | None = None,
        guardrail: Guardrail | None = None,
        scenario: Scenario | None = None,
        audit_store: AuditStore | None = None,
    ):
        raise NotImplementedError("phase 01")

    def run(self, policy: Any | None = None, seed: int = 42) -> RunResult:
        raise NotImplementedError("phase 01")

    def generate_paired_batches(self, seed: int) -> tuple[list[Any], list[Any]]:
        raise NotImplementedError("phase 01")

    def compute_lift_and_attribution(self, seed: int) -> tuple[float, float]:
        raise NotImplementedError("phase 01")
