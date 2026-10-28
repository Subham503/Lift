"""Core evaluation metrics calculation."""

from typing import Any


def compute_confusion_matrix(records: list[dict[str, Any]]) -> dict[str, int]:
    raise NotImplementedError("phase 01")


def compute_rates(matrix: dict[str, int]) -> dict[str, float]:
    raise NotImplementedError("phase 01")
