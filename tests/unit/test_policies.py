import pytest

from core.policies.base import Policy
from core.policies.do_nothing import DoNothingPolicy
from core.sim.types import Action, Hidden, Observable

OBS = Observable(id="tx_1", features={"amount": 10.0})
HIDDEN = Hidden(is_positive=True, true_label="x", metadata={})


class Custom(Policy):
    def __init__(self):
        super().__init__("custom")

    def decide(self, obs):
        return Action(decision="BLOCK")


class ReturnsString(Policy):
    def decide(self, obs):
        return "ALLOW"


def test_do_nothing_allows():
    a = DoNothingPolicy().decide(OBS)
    assert a.decision == "ALLOW" and a.confidence == 1.0


def test_do_nothing_name():
    assert DoNothingPolicy().name == "do_nothing"


@pytest.mark.parametrize("bad", [HIDDEN, {"amount": 1}, None, "tx"])
def test_do_nothing_rejects_non_observable(bad):
    with pytest.raises(TypeError):
        DoNothingPolicy().decide(bad)


def test_guard_applies_to_any_subclass():
    assert Custom().decide(OBS).decision == "BLOCK"
    with pytest.raises(TypeError):
        Custom().decide(HIDDEN)


def test_non_action_return_rejected():
    with pytest.raises(TypeError):
        ReturnsString().decide(OBS)


def test_base_is_abstract():
    with pytest.raises(TypeError):
        Policy()  # type: ignore[abstract]
