"""Assumed cost model for Lift simulations.

EVERY NUMBER HERE IS AN ASSUMPTION, NOT A MEASUREMENT. Results computed with
it are only valid "under this assumed cost model". Packs may pass their own.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class CostModel:
    chargeback_fee: float = 15.0  # USD, paid when fraud gets through
    margin_rate: float = 0.03  # share of amount lost when a legit sale is blocked
    block_friction: float = 5.0  # USD, customer annoyance on a wrongly blocked sale
    review_minutes: float = 6.0  # analyst time per reviewed transaction
    analyst_hourly: float = 40.0  # USD per hour
    review_catch_rate: float = 0.90  # share of reviewed fraud that is caught

    def __post_init__(self) -> None:
        for name, value in asdict(self).items():
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"{name} must be finite and >= 0")
        if self.margin_rate > 1.0:
            raise ValueError("margin_rate must be <= 1")
        if self.review_catch_rate > 1.0:
            raise ValueError("review_catch_rate must be <= 1")

    @property
    def review_hours(self) -> float:
        return self.review_minutes / 60.0

    @property
    def review_cost(self) -> float:
        return self.review_minutes * self.analyst_hourly / 60.0

    def allow_loss(self, amount: float, is_fraud: bool) -> float:
        """Loss if the transaction is simply allowed. Also the counterfactual."""
        return amount + self.chargeback_fee if is_fraud else 0.0

    def block_legit_loss(self, amount: float) -> float:
        return self.margin_rate * amount + self.block_friction

    def to_dict(self) -> dict[str, float]:
        return asdict(self)


DEFAULT_COSTS = CostModel()
