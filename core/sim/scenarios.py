"""Scenario definitions and base generator classes."""

from abc import ABC, abstractmethod
from collections.abc import Generator

from .types import Hidden, Observable


class Scenario(ABC):
    """Abstract base scenario generator."""

    def __init__(self, name: str, seed: int):
        raise NotImplementedError("phase 01")

    @abstractmethod
    def generate(self) -> Generator[tuple[Observable, Hidden], None, None]:
        """Yields paired (Observable, Hidden) events."""
        raise NotImplementedError("phase 01")
