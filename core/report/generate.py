"""Evaluation report generator."""

from datetime import datetime
from pathlib import Path
from typing import Any


def generate_report(
    results: dict[str, Any],
    output_path: Path,
    *,
    generated_at: datetime | None = None,
) -> Path:
    """Generates markdown report from simulation results."""
    raise NotImplementedError("phase 01")
