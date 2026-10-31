from datetime import UTC, datetime

import pytest

from core.guardrails.base import apply_guardrails
from core.guardrails.verdict import Verdict, VerdictType
from core.sim.types import Action, Observable

OBS = Observable(id="1", features={"amount": 1.0})
NOW = datetime(2026, 10, 31, tzinfo=UTC)


class Rail:
    def __init__(self, verdict, modified=None):
        self._v, self._m = verdict, modified

    def evaluate(self, action, obs, now):
        return Verdict(verdict=self._v, reason="T", modified_action=self._m)


class BrokenRail:
    def evaluate(self, action, obs, now):
        raise RuntimeError("boom")


def test_no_rails_unchanged():
    a = Action(decision="BLOCK", confidence=0.9)
    g = apply_guardrails(a, [], OBS, NOW)
    assert g.final == a and g.verdicts == []


def test_allow_verdict_keeps_action():
    a = Action(decision="BLOCK", confidence=0.9)
    g = apply_guardrails(a, [Rail(VerdictType.ALLOW)], OBS, NOW)
    assert g.final == a


def test_block_veto_changes_decision_and_keeps_confidence():
    a = Action(decision="BLOCK", confidence=0.9)
    g = apply_guardrails(a, [Rail(VerdictType.BLOCK)], OBS, NOW)
    assert g.final.decision != "BLOCK"
    assert g.final.confidence == 0.9
    assert a.decision == "BLOCK"


def test_block_beats_override():
    a = Action(decision="BLOCK")
    other = Action(decision="ALLOW")
    g = apply_guardrails(a, [Rail(VerdictType.OVERRIDE, other), Rail(VerdictType.BLOCK)], OBS, NOW)
    assert g.final.decision not in ("BLOCK", "ALLOW")


def test_override_applies_when_no_block():
    a = Action(decision="BLOCK")
    other = Action(decision="REVIEW")
    g = apply_guardrails(a, [Rail(VerdictType.OVERRIDE, other)], OBS, NOW)
    assert g.final == other


def test_override_without_action_raises():
    with pytest.raises(ValueError):
        apply_guardrails(Action(decision="BLOCK"), [Rail(VerdictType.OVERRIDE)], OBS, NOW)


def test_safe_default_veto_marked_ignored():
    g = apply_guardrails(Action(decision="GIVE_UP"), [Rail(VerdictType.BLOCK)], OBS, NOW)
    assert g.final.decision == "GIVE_UP"
    assert g.verdicts[0].metadata == {"ignored": True}


def test_broken_rail_fails_closed_and_is_recorded():
    g = apply_guardrails(Action(decision="BLOCK"), [BrokenRail()], OBS, NOW)
    assert g.final.decision != "BLOCK"
    assert g.verdicts[0].reason.startswith("RAIL_ERROR")


def test_all_verdicts_recorded_in_order():
    g = apply_guardrails(
        Action(decision="BLOCK"),
        [Rail(VerdictType.ALLOW), Rail(VerdictType.BLOCK)],
        OBS,
        NOW,
    )
    assert [v.verdict for v in g.verdicts] == [VerdictType.ALLOW, VerdictType.BLOCK]


def test_no_override_parameter():
    with pytest.raises(TypeError):
        apply_guardrails(Action(decision="BLOCK"), [], OBS, NOW, override=True)  # type: ignore[call-arg]
