"""Threshold scoring model policy."""

from __future__ import annotations

import math
import numbers
from collections.abc import Sequence
from typing import Any

import numpy as np

from core.policies.base import Policy
from core.sim.types import Action, Observable

from ..features import FEATURE_ORDER, extract_transaction_features, feature_vector


def _sigmoid(z: float) -> float:
    z = max(-30.0, min(30.0, z))
    return 1.0 / (1.0 + math.exp(-z))


def fit_logistic(
    X: np.ndarray, y: np.ndarray, l2: float = 1.0, max_iter: int = 50
) -> tuple[np.ndarray, float]:
    """Ridge logistic regression by Newton steps.

    No randomness, so the same data always gives the same weights.
    """
    n, d = X.shape
    xb = np.hstack([X, np.ones((n, 1))])
    w = np.zeros(d + 1)
    reg = np.eye(d + 1) * l2
    reg[-1, -1] = 0.0  # the bias is not penalized
    for _ in range(max_iter):
        z = np.clip(xb @ w, -30.0, 30.0)
        p = 1.0 / (1.0 + np.exp(-z))
        grad = xb.T @ (p - y) + reg @ w
        hess = (xb * (p * (1.0 - p))[:, None]).T @ xb + reg + 1e-9 * np.eye(d + 1)
        step = np.linalg.solve(hess, grad)
        w = w - step
        if float(np.max(np.abs(step))) < 1e-8:
            break
    return w[:d], float(w[d])


class ThresholdModelFraudPolicy(Policy):
    """Linear (logistic) risk score with a configurable decision threshold.

    The model form is our choice (an ASSUMPTION). An untrained instance refuses
    to decide. Build a trained one with fit().
    """

    def __init__(
        self,
        score_threshold: float = 0.5,
        weights: Sequence[float] | None = None,
        bias: float = 0.0,
    ) -> None:
        super().__init__("threshold_model")
        if (
            isinstance(score_threshold, bool)
            or not isinstance(score_threshold, numbers.Real)
            or not 0.0 < float(score_threshold) <= 1.0
        ):
            raise ValueError("score_threshold must be in (0, 1]")
        self.score_threshold: float = float(score_threshold)
        self._weights: tuple[float, ...] | None = None
        if weights is not None:
            w = tuple(float(x) for x in weights)
            if len(w) != len(FEATURE_ORDER):
                raise ValueError(f"weights must have {len(FEATURE_ORDER)} values")
            if not all(math.isfinite(x) for x in w) or not math.isfinite(bias):
                raise ValueError("weights and bias must be finite")
            self._weights = w
        self._bias: float = float(bias)

    def score(self, obs: Observable) -> float:
        """Probability-like risk score in (0, 1)."""
        if not isinstance(obs, Observable):
            raise TypeError("score accepts Observable only")
        if self._weights is None:
            raise RuntimeError("model is untrained: use ThresholdModelFraudPolicy.fit(...)")
        x = feature_vector(extract_transaction_features(obs.features))
        z = sum(w * v for w, v in zip(self._weights, x, strict=True)) + self._bias
        return _sigmoid(z)

    def decide(self, obs: Observable) -> Action:
        s = self.score(obs)
        if s >= self.score_threshold:
            return Action(decision="BLOCK", confidence=s, metadata={"score": s})
        return Action(decision="ALLOW", confidence=1.0 - s, metadata={"score": s})

    def params(self) -> dict[str, Any]:
        """Everything needed to rebuild this policy, for results files."""
        return {
            "score_threshold": self.score_threshold,
            "weights": None if self._weights is None else list(self._weights),
            "bias": self._bias,
            "feature_order": list(FEATURE_ORDER),
        }

    @classmethod
    def fit(
        cls,
        observables: Sequence[Observable],
        labels: Sequence[bool],
        *,
        score_threshold: float = 0.5,
        l2: float = 1.0,
    ) -> ThresholdModelFraudPolicy:
        """Fit on labeled development data. Labels are used here and nowhere else."""
        if len(observables) != len(labels):
            raise ValueError("observables and labels must have the same length")
        if not observables:
            raise ValueError("no training data")
        n_pos = sum(1 for v in labels if v)
        if n_pos == 0 or n_pos == len(labels):
            raise ValueError("training data needs both classes")
        rows = [feature_vector(extract_transaction_features(o.features)) for o in observables]
        w, b = fit_logistic(np.asarray(rows, dtype=float), np.asarray(labels, dtype=float), l2=l2)
        return cls(score_threshold=score_threshold, weights=[float(x) for x in w], bias=b)
