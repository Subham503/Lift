"""Non-parametric bootstrap confidence interval estimation."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import numpy as np

from core.sim.rng import RngStreams

MIN_SEEDS = 20
CONFIDENCE_LEVEL = 0.95
_BATCH = 1_000  # resamples per chunk, caps memory


@dataclass(frozen=True)
class LiftResult:
    mean: float
    lo: float
    hi: float
    n_seeds: int
    underpowered: bool


def _as_array(values: Any) -> np.ndarray:
    arr = np.asarray(values, dtype=float)
    if arr.ndim != 1:
        raise ValueError("values must be 1-D")
    if arr.size == 0:
        raise ValueError("values must not be empty")
    if not np.all(np.isfinite(arr)):
        raise ValueError("values must be finite (no NaN or inf)")
    return arr


def _percentile_ci(
    arr: np.ndarray,
    stat_fn: Callable[[np.ndarray], float] | None,
    confidence_level: float,
    n_resamples: int,
    seed: int,
) -> tuple[float, float, float]:
    if not 0.0 < confidence_level < 1.0:
        raise ValueError("confidence_level must be in (0, 1)")
    if isinstance(n_resamples, bool) or not isinstance(n_resamples, int) or n_resamples < 1:
        raise ValueError("n_resamples must be a positive int")

    n = arr.size
    rng = RngStreams(seed).stream("bootstrap")  # own stream, never global numpy state
    stats = np.empty(n_resamples, dtype=float)

    for start in range(0, n_resamples, _BATCH):
        stop = min(start + _BATCH, n_resamples)
        idx = rng.integers(0, n, size=(stop - start, n))
        samples = arr[idx]
        if stat_fn is None:
            stats[start:stop] = samples.mean(axis=1)
        else:
            stats[start:stop] = [stat_fn(row) for row in samples]

    point = float(arr.mean()) if stat_fn is None else float(stat_fn(arr))
    alpha = (1.0 - confidence_level) / 2.0
    lo, hi = np.percentile(stats, [100.0 * alpha, 100.0 * (1.0 - alpha)])
    return point, float(lo), float(hi)


def paired_bootstrap_ci(
    diffs: Any,
    n_resamples: int = 10_000,
    seed: int = 42,
) -> tuple[float, float, float]:
    """Returns (mean, lo, hi) 95% CI via paired bootstrap on per-seed differences."""
    arr = _as_array(diffs)
    return _percentile_ci(arr, None, CONFIDENCE_LEVEL, n_resamples, seed)


def evaluate_lift(
    diffs: list[float],
    n_resamples: int = 10_000,
    seed: int = 42,
) -> LiftResult:
    """Evaluate lift with bootstrap CI and underpowered status."""
    mean, lo, hi = paired_bootstrap_ci(diffs, n_resamples=n_resamples, seed=seed)
    n_seeds = len(diffs)
    return LiftResult(
        mean=mean,
        lo=lo,
        hi=hi,
        n_seeds=n_seeds,
        underpowered=n_seeds < MIN_SEEDS,
    )


def bootstrap_ci(
    values: Any,
    stat_fn: Any = None,
    confidence_level: float = 0.95,
    n_resamples: int = 10_000,
    seed: int = 42,
) -> tuple[float, float, float]:
    """Generic percentile bootstrap. Returns (point, lo, hi). Default stat = mean."""
    arr = _as_array(values)
    return _percentile_ci(arr, stat_fn, confidence_level, n_resamples, seed)
