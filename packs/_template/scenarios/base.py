"""Template scenario generator."""

from collections.abc import Generator

from core.sim.scenarios import Scenario
from core.sim.types import Hidden, Observable


class TemplateScenario(Scenario):
    """Generates synthetic template events."""

    def __init__(self, name: str = "template", seed: int = 42) -> None:
        raise NotImplementedError("phase 01")

    def generate(self) -> Generator[tuple[Observable, Hidden], None, None]:
        raise NotImplementedError("phase 01")
