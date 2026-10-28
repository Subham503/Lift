"""Base decision policy class."""

from abc import ABC, abstractmethod

from ..sim.types import Action, Observable


class Policy(ABC):
    """Abstract base decision policy."""

    def __init__(self, name: str = "base"):
        raise NotImplementedError("phase 01")

    @abstractmethod
    def decide(self, obs: Observable) -> Action:
        """Produce an action based strictly on observable features."""
        raise NotImplementedError("phase 01")


BasePolicy = Policy
