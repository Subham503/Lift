"""World environment simulator and outcome resolution."""

from collections.abc import Generator

import numpy as np

from .scenarios import Scenario
from .types import Action, Hidden, Observable, Outcome


def resolve(action: Action, hidden: Hidden, rng: np.random.Generator) -> Outcome:
    """Resolve physical outcome from preconditions, action, and hidden ground truth."""
    raise NotImplementedError("phase 01")


class World:
    """Manages the environment simulation loop."""

    def __init__(self, scenario: Scenario):
        raise NotImplementedError("phase 01")

    def run(self) -> Generator[tuple[Observable, Hidden], Action, None]:
        """Yields (observable, hidden) and receives Action."""
        raise NotImplementedError("phase 01")
