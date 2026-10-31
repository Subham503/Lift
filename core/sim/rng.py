"""Deterministic RNG stream management for Lift simulations."""

from __future__ import annotations

import hashlib

import numpy as np


def _name_key(name: str) -> tuple[int, ...]:
    """Stable spawn key from a stream name. Not Python hash() (salted per run)."""
    digest = hashlib.sha256(name.encode("utf-8")).digest()
    return tuple(int.from_bytes(digest[i : i + 4], "big") for i in range(0, 16, 4))


class RngStreams:
    """Named, independent, deterministic RNG streams.

    Each name gets its own stream, derived from (seed, name) only.
    Drawing from one stream never shifts another, and creation order
    does not matter.
    """

    def __init__(self, seed: int):
        if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
            raise ValueError("seed must be a non-negative int")
        self._seed = seed
        self._streams: dict[str, np.random.Generator] = {}

    def stream(self, name: str) -> np.random.Generator:
        """Return the stream for `name`. Same object on repeat calls, so draws continue."""
        if name not in self._streams:
            seq = np.random.SeedSequence(entropy=self._seed, spawn_key=_name_key(name))
            self._streams[name] = np.random.Generator(np.random.PCG64(seq))
        return self._streams[name]


class SeededRNG:
    """Legacy RNG helper. Prefer RngStreams."""

    def __init__(self, seed: int):
        self._rng = np.random.default_rng(seed)

    def uniform(self, low: float = 0.0, high: float = 1.0) -> float:
        return float(self._rng.uniform(low, high))

    def randint(self, a: int, b: int) -> int:
        """Inclusive on both ends, like random.randint."""
        return int(self._rng.integers(a, b + 1))