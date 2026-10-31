"""Scenario definitions and base generator classes."""

from __future__ import annotations

import copy
import math
from abc import ABC, abstractmethod
from collections.abc import Generator

from .rng import RngStreams
from .types import Hidden, Observable

_FRAUD_LABELS = ("card_cloned", "account_takeover", "velocity_burst")


def _check_seed(seed: object) -> None:
    if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
        raise ValueError("seed must be a non-negative int")


class Scenario(ABC):
    """Abstract base scenario generator.

    generate() must derive ALL randomness from self.seed on every call, so the
    same seed always yields the same events.
    """

    def __init__(self, name: str, seed: int):
        _check_seed(seed)
        self.name = name
        self.seed = seed

    @abstractmethod
    def generate(self) -> Generator[tuple[Observable, Hidden], None, None]:
        """Yields paired (Observable, Hidden) events."""

    def with_seed(self, seed: int) -> Scenario:
        """Same scenario, different seed. Does not modify this object."""
        _check_seed(seed)
        clone = copy.copy(self)
        clone.seed = seed
        return clone


class SyntheticTransactionScenario(Scenario):
    """Synthetic card-payment stream.

    EVERY PARAMETER AND DISTRIBUTION HERE IS AN ASSUMPTION, not calibrated to
    real data. Features are informative but overlapping, so no policy can be
    perfect. Exactly the same number of random draws is used per event whether
    it is fraud or not, so streams never shift.
    """

    def __init__(
        self,
        name: str = "synthetic_transactions",
        seed: int = 42,
        *,
        n_events: int = 2000,
        fraud_rate: float = 0.025,
        amount_min: float = 5.0,
        amount_max: float = 5000.0,
    ):
        super().__init__(name, seed)
        if isinstance(n_events, bool) or not isinstance(n_events, int) or n_events < 1:
            raise ValueError("n_events must be an int >= 1")
        if not math.isfinite(fraud_rate) or not 0.0 <= fraud_rate <= 1.0:
            raise ValueError("fraud_rate must be in [0, 1]")
        if not (math.isfinite(amount_min) and math.isfinite(amount_max)):
            raise ValueError("amount bounds must be finite")
        if amount_min <= 0 or amount_max <= amount_min:
            raise ValueError("need 0 < amount_min < amount_max")
        self.n_events = n_events
        self.fraud_rate = fraud_rate
        self.amount_min = amount_min
        self.amount_max = amount_max

    def generate(self) -> Generator[tuple[Observable, Hidden], None, None]:
        n = self.n_events
        streams = RngStreams(self.seed)
        u_label = streams.stream("label").random(n)
        u_amount = streams.stream("amount").random(n)
        u_feat = streams.stream("features").random((n, 5))
        log_lo = math.log(self.amount_min)
        span = math.log(self.amount_max) - log_lo

        for i in range(n):
            fraud = bool(u_label[i] < self.fraud_rate)
            amount = round(math.exp(log_lo + float(u_amount[i]) * span), 2)
            uv, ud, ux, ua, uc = (float(x) for x in u_feat[i])
            if fraud:
                velocity = 1 + int(uv * 8)
                trust = round(0.7 * ud, 2)
                cross_border = ux < 0.45
                age_days = 1 + int(ua * 400)
                label = _FRAUD_LABELS[int(uc * 3)]
            else:
                velocity = int(uv * 3)
                trust = round(0.45 + 0.55 * ud, 2)
                cross_border = ux < 0.08
                age_days = 30 + int(ua * 1500)
                label = "legit"
            obs = Observable(
                id=f"tx_{i + 1:04d}",
                features={
                    "amount": amount,
                    "currency": "USD",
                    "customer_age_days": age_days,
                    "velocity_1h": velocity,
                    "device_trust": trust,
                    "cross_border": cross_border,
                },
            )
            hidden = Hidden(is_positive=fraud, true_label=label, metadata={"amount": amount})
            yield obs, hidden
