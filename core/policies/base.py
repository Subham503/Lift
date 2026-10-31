"""Base decision policy class."""

from __future__ import annotations

import functools
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

from ..sim.types import Action, Observable


def _guard(fn: Callable[[Any, Observable], Action]) -> Callable[[Any, Observable], Action]:
    """Wrap decide(): input must be Observable, output must be Action."""

    @functools.wraps(fn)
    def wrapper(self: Any, obs: Observable) -> Action:
        if not isinstance(obs, Observable):
            raise TypeError(
                f"{type(self).__name__}.decide accepts Observable only, got {type(obs).__name__}"
            )
        action = fn(self, obs)
        if not isinstance(action, Action):
            raise TypeError(
                f"{type(self).__name__}.decide must return Action, got {type(action).__name__}"
            )
        return action

    return wrapper


class Policy(ABC):
    """Abstract base decision policy.

    Subclasses are guarded automatically: decide() cannot receive hidden
    state, and cannot return anything but an Action.
    """

    def __init__(self, name: str = "base"):
        self.name = name

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        fn = cls.__dict__.get("decide")
        if fn is not None:
            cls.decide = _guard(fn)  # type: ignore[assignment]

    @abstractmethod
    def decide(self, obs: Observable) -> Action:
        """Produce an action based strictly on observable features."""


BasePolicy = Policy


