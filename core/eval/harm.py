"""Harm and fairness evaluation."""

from typing import Any


def compute_harm_metrics(records: list[dict[str, Any]]) -> dict[str, float]:
    """Computes harm ratio and false positive burden."""
    raise NotImplementedError("phase 01")
