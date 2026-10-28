"""Cohort slicing and demographic subgroup evaluation."""

from collections.abc import Callable
from typing import Any


def slice_records(
    records: list[dict[str, Any]],
    slice_fn: Callable[[dict[str, Any]], str],
) -> dict[str, list[dict[str, Any]]]:
    """Partitions records into distinct cohort slices."""
    raise NotImplementedError("phase 01")
