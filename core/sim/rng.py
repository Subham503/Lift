"""Deterministic RNG stream management for Lift simulations."""

import numpy as np


class RngStreams:
    """Manages named, deterministic RNG streams."""

    def __init__(self, seed: int):
        raise NotImplementedError("phase 01")

    def stream(self, name: str) -> np.random.Generator:
        raise NotImplementedError("phase 01")


class SeededRNG:
    """Legacy RNG helper."""

    def __init__(self, seed: int):
        raise NotImplementedError("phase 01")

    def uniform(self, low: float = 0.0, high: float = 1.0) -> float:
        raise NotImplementedError("phase 01")

    def randint(self, a: int, b: int) -> int:
        raise NotImplementedError("phase 01")
