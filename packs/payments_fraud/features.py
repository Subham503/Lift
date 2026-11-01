"""Feature extraction for payments fraud.

One transform serves both training and decision time, so the model never sees
differently scaled inputs in the two places. The scale constants only bring
values into a similar range. They are not fitted to any data.
"""

from __future__ import annotations

import math
import numbers
from collections.abc import Mapping
from typing import Any

FEATURE_ORDER = ("log_amount", "log_age", "velocity", "device_trust", "cross_border")

_AMOUNT_SCALE = math.log1p(5000.0)
_AGE_SCALE = math.log1p(2000.0)
_VELOCITY_SCALE = 8.0


def read_number(raw: Mapping[str, Any], key: str) -> float:
    """Read one non-negative finite number. Missing or malformed values raise."""
    if key not in raw:
        raise ValueError(f"missing feature: {key}")
    value = raw[key]
    if isinstance(value, bool) or not isinstance(value, numbers.Real):
        raise ValueError(f"feature {key} must be a real number")
    out = float(value)
    if not math.isfinite(out) or out < 0:
        raise ValueError(f"feature {key} must be finite and >= 0")
    return out


def extract_transaction_features(raw_tx: dict[str, Any]) -> dict[str, Any]:
    """Validate a raw transaction and return the scaled model features."""
    amount = read_number(raw_tx, "amount")
    age = read_number(raw_tx, "customer_age_days")
    velocity = read_number(raw_tx, "velocity_1h")
    trust = read_number(raw_tx, "device_trust")
    if trust > 1.0:
        raise ValueError("feature device_trust must be <= 1")
    if "cross_border" not in raw_tx:
        raise ValueError("missing feature: cross_border")
    cross = raw_tx["cross_border"]
    if not (isinstance(cross, bool) or cross in (0, 1)):
        raise ValueError("feature cross_border must be a bool or 0/1")
    return {
        "log_amount": math.log1p(amount) / _AMOUNT_SCALE,
        "log_age": math.log1p(age) / _AGE_SCALE,
        "velocity": velocity / _VELOCITY_SCALE,
        "device_trust": trust,
        "cross_border": 1.0 if cross else 0.0,
    }


def feature_vector(features: Mapping[str, float]) -> list[float]:
    """Model input in the fixed FEATURE_ORDER."""
    return [float(features[name]) for name in FEATURE_ORDER]
