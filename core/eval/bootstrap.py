"""Non-parametric bootstrap confidence interval estimation."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class LiftResult:
    mean: float
    lo: float
    hi: float
    n_seeds: int
    underpowered: bool


def paired_bootstrap_ci(
    diffs: Any,
    n_resamples: int = 10_000,
    seed: int = 42,
) -> tuple[float, float, float]:
    """Returns (mean, lo, hi) confidence intervals via paired bootstrap."""
    raise NotImplementedError("phase 01")


def evaluate_lift(
    diffs: list[float],
    n_resamples: int = 10_000,
    seed: int = 42,
) -> LiftResult:
    """Evaluate lift with bootstrap CI and underpowered status."""
    raise NotImplementedError("phase 01")


def bootstrap_ci(
    values: Any,
    stat_fn: Any = None,
    confidence_level: float = 0.95,
    n_resamples: int = 10_000,
    seed: int = 42,
) -> tuple[float, float, float]:
    """Legacy bootstrap helper."""
    raise NotImplementedError("phase 01")
