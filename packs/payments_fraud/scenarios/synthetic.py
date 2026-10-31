"""Synthetic payments fraud scenario generator."""

from typing import Any

from core.sim.scenarios import SyntheticTransactionScenario


class PaymentsFraudSyntheticScenario(SyntheticTransactionScenario):
    """Simulates card transactions with velocity and amount features.

    All parameters are ASSUMPTIONS. See packs/payments_fraud/LIMITS.md.
    """

    def __init__(
        self,
        name: str = "payments_fraud_synthetic",
        seed: int = 42,
        **kwargs: Any,
    ) -> None:
        super().__init__(name=name, seed=seed, **kwargs)
