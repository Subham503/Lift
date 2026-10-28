"""Verdict definitions returned by safety guardrails."""

from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from ..sim.types import Action


class VerdictType(StrEnum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    OVERRIDE = "OVERRIDE"


@dataclass(frozen=True)
class Verdict:
    verdict: VerdictType
    reason: str
    modified_action: Action | None = None
    metadata: dict[str, Any] | None = None


@dataclass(frozen=True)
class GuardedDecision:
    final: Action
    verdicts: list[Verdict]
