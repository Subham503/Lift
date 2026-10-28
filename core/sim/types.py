"""Simulation types: Observable, Hidden, Action, and Outcome."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Observable:
    """State visible to decision policies and guardrails."""

    id: str
    features: dict[str, Any]


@dataclass(frozen=True)
class Hidden:
    """Hidden ground-truth state known only to the simulator."""

    is_positive: bool
    true_label: Any
    metadata: dict[str, Any]


@dataclass(frozen=True)
class Action:
    """Action proposed or executed."""

    decision: str
    confidence: float = 1.0
    metadata: dict[str, Any] | None = None


@dataclass(frozen=True)
class Outcome:
    """Outcome resolved from physical preconditions, action, and hidden state."""

    actual_loss: float = 0.0
    counterfactual_loss: float = 0.0
    details: dict[str, Any] | None = None
