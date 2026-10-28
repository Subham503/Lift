"""Parameter and seed sweep coordinator."""

from collections.abc import Callable
from typing import Any


def run_seed_sweep(seeds: list[int], harness_factory: Callable[[int], Any]) -> list[dict[str, Any]]:
    """Runs harness across multiple seeds."""
    raise NotImplementedError("phase 01")
