"""Synthetic payments fraud scenario generator."""

from collections.abc import Generator

from core.sim.scenarios import Scenario
from core.sim.types import Hidden, Observable


class PaymentsFraudSyntheticScenario(Scenario):
    """Simulates card transactions with velocity and amount features."""

    def __init__(self, name: str = "payments_fraud_synthetic", seed: int = 42) -> None:
        raise NotImplementedError("phase 01")

    def generate(self) -> Generator[tuple[Observable, Hidden], None, None]:
        raise NotImplementedError("phase 01")
