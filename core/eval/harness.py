"""Evaluation harness coordinating policies, guardrails, and scenarios."""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from ..audit.store import AuditStore
from ..guardrails.base import Guardrail, apply_guardrails
from ..guardrails.verdict import VerdictType
from ..policies.base import Policy
from ..policies.do_nothing import DoNothingPolicy
from ..sim.costs import DEFAULT_COSTS, CostModel
from ..sim.rng import RngStreams
from ..sim.scenarios import Scenario, SyntheticTransactionScenario
from ..sim.types import Action, Hidden, Observable
from ..sim.world import resolve

# Guardrails need a timestamp. Fixed epoch + event index keeps runs deterministic.
_CLOCK_START = datetime(2026, 1, 1, tzinfo=UTC)


@dataclass(frozen=True)
class RunResult:
    events_digest: str
    records: list[dict[str, Any]]
    seed: int = 0
    policy: str = ""


def _digest(events: list[tuple[Observable, Hidden]]) -> str:
    """Hash of the events ONLY. Never includes actions or outcomes."""
    h = hashlib.sha256()
    for obs, hidden in events:
        row = {
            "id": obs.id,
            "features": obs.features,
            "is_positive": hidden.is_positive,
            "true_label": hidden.true_label,
            "metadata": hidden.metadata,
        }
        h.update(json.dumps(row, sort_keys=True, separators=(",", ":"), allow_nan=False).encode())
        h.update(b"\n")
    return "sha256:" + h.hexdigest()


def _as_rails(guardrail: Any) -> list[Any]:
    if guardrail is None:
        return []
    if isinstance(guardrail, list | tuple):
        return list(guardrail)
    return [guardrail]


class EvalHarness:
    """Coordinates simulation runs and logs evaluation steps."""

    def __init__(
        self,
        policy: Policy | None = None,
        guardrail: Guardrail | list[Guardrail] | None = None,
        scenario: Scenario | None = None,
        audit_store: AuditStore | None = None,
        costs: CostModel = DEFAULT_COSTS,
    ):
        self.policy = policy
        self.rails = _as_rails(guardrail)
        self.scenario: Scenario = scenario if scenario is not None else SyntheticTransactionScenario()
        self.audit_store = audit_store
        self.costs = costs

    def _execute(
        self,
        policy: Any,
        seed: int,
        rails: list[Any],
        audit: AuditStore | None,
    ) -> RunResult:
        events = list(self.scenario.with_seed(seed).generate())
        digest = _digest(events)
        outcome_rng = RngStreams(seed).stream("outcomes")
        name = str(getattr(policy, "name", type(policy).__name__))
        records: list[dict[str, Any]] = []

        for i, (obs, hidden) in enumerate(events):
            proposed = policy.decide(obs)  # policy only ever receives the Observable
            if not isinstance(proposed, Action):
                raise TypeError(f"{name}.decide must return Action, got {type(proposed).__name__}")
            now = _CLOCK_START + timedelta(seconds=i)
            guarded = apply_guardrails(proposed, rails, obs, now)
            outcome = resolve(guarded.final, hidden, outcome_rng, self.costs)
            details = outcome.details or {}
            vetoes = [
                v.reason
                for v in guarded.verdicts
                if v.verdict == VerdictType.BLOCK and not (v.metadata or {}).get("ignored")
            ]
            records.append(
                {
                    "id": obs.id,
                    "proposed": proposed.decision,
                    "final": guarded.final.decision,
                    "overridden": guarded.final.decision != proposed.decision,
                    "vetoes": vetoes,
                    "is_fraud": hidden.is_positive,
                    "amount": hidden.metadata["amount"],
                    "actual_loss": outcome.actual_loss,
                    "counterfactual_loss": outcome.counterfactual_loss,
                    "review_hours": float(details.get("review_hours", 0.0)),
                }
            )
            if audit is not None:
                audit.append(
                    {
                        "seed": seed,
                        "policy": name,
                        "tx": obs.id,
                        "proposed": proposed.decision,
                        "final": guarded.final.decision,
                        "vetoes": vetoes,
                        "actual_loss": outcome.actual_loss,
                        "counterfactual_loss": outcome.counterfactual_loss,
                    }
                )
        return RunResult(events_digest=digest, records=records, seed=seed, policy=name)

    def run(self, policy: Any | None = None, seed: int = 42) -> RunResult:
        chosen = policy if policy is not None else self.policy
        if chosen is None:
            chosen = DoNothingPolicy()
        return self._execute(chosen, seed, self.rails, self.audit_store)

    def generate_paired_batches(self, seed: int) -> tuple[list[Any], list[Any]]:
        """Two batches built from the same events: baseline and candidate."""
        events = list(self.scenario.with_seed(seed).generate())
        return events, list(events)

    def compute_lift_and_attribution(self, seed: int) -> tuple[float, float]:
        """Return (lift, attributed) in USD, by two independent routes.

        lift: baseline (DoNothing, no guardrails) run vs candidate run,
              per-event difference of ACTUAL losses.
        attributed: candidate run only; sum of positive (counterfactual - actual).
        Invariant: lift <= attributed. lift = gross benefit - gross harm, so this
        breaks only if one route miscounts.
        """
        candidate = self.policy if self.policy is not None else DoNothingPolicy()
        base = self._execute(DoNothingPolicy(), seed, [], None)
        cand = self._execute(candidate, seed, self.rails, None)
        lift = math.fsum(
            b["actual_loss"] - c["actual_loss"]
            for b, c in zip(base.records, cand.records, strict=True)
        )
        attributed = math.fsum(
            max(0.0, c["counterfactual_loss"] - c["actual_loss"]) for c in cand.records
        )
        return lift, attributed
