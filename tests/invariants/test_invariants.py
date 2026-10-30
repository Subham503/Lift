"""Core invariant tests defined in core/RULES.md section 12.

All 11 tests contain real assertions against engine interfaces and
fail with NotImplementedError until their respective phases are built.
No test subclasses or reimplements the engine components under test.
"""

from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pytest

from core.audit.store import AuditStore
from core.eval.bootstrap import evaluate_lift
from core.eval.harness import EvalHarness
from core.guardrails.base import apply_guardrails
from core.guardrails.verdict import Verdict, VerdictType
from core.policies.do_nothing import DoNothingPolicy
from core.report.generate import generate_report
from core.sim.rng import RngStreams
from core.sim.types import Action, Hidden, Observable
from core.sim.world import resolve


class BlockAllPolicy:
    """Test double policy used as input."""

    def decide(self, obs: Observable) -> Action:
        return Action(decision="BLOCK", confidence=1.0)


class StrictRail:
    """Test double guardrail used as input."""

    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        return Verdict(verdict=VerdictType.BLOCK, reason="STRICT_VETO")


class BlockEverythingRail:
    """Test double guardrail used as input."""

    def evaluate(self, action: Action, obs: Observable, now: datetime) -> Verdict:
        return Verdict(verdict=VerdictType.BLOCK, reason="BLOCK_ALL")


def test_policy_never_receives_hidden():
    """Policy must only accept Observable; passing Hidden raises TypeError."""
    policy = DoNothingPolicy()
    obs = Observable(id="tx_1", features={"amount": 100.0})
    action = policy.decide(obs)
    assert isinstance(action, Action)

    hidden = Hidden(is_positive=True, true_label=True, metadata={})
    with pytest.raises(TypeError):
        policy.decide(hidden)  # type: ignore[arg-type]


def test_outcome_independent_of_label_shortcut():
    """Two Hidden with same is_positive but different true_label -> equal Outcome.

    Also: is_positive True vs False on ALLOW -> actual_loss strictly greater for True.
    """
    rng1 = np.random.default_rng(42)
    rng2 = np.random.default_rng(42)
    action = Action(decision="ALLOW", confidence=1.0)

    hidden_a = Hidden(is_positive=True, true_label="phishing", metadata={"amount": 100.0})
    hidden_b = Hidden(is_positive=True, true_label="card_stolen", metadata={"amount": 100.0})

    out_a = resolve(action, hidden_a, rng1)
    out_b = resolve(action, hidden_b, rng2)
    assert out_a == out_b

    rng3 = np.random.default_rng(42)
    rng4 = np.random.default_rng(42)
    hidden_pos = Hidden(is_positive=True, true_label=True, metadata={"amount": 100.0})
    hidden_neg = Hidden(is_positive=False, true_label=False, metadata={"amount": 100.0})

    out_pos = resolve(action, hidden_pos, rng3)
    out_neg = resolve(action, hidden_neg, rng4)
    assert out_pos.actual_loss > out_neg.actual_loss


def test_same_seed_same_hash():
    """Identical seed and config must produce byte-identical RNG streams."""
    streams1 = RngStreams(seed=42)
    streams2 = RngStreams(seed=42)
    s1 = streams1.stream("arrivals").uniform(size=100)
    s2 = streams2.stream("arrivals").uniform(size=100)
    assert np.array_equal(s1, s2)


def test_paired_batches_identical_across_policies():
    """EvalHarness.run(policy, seed) -> RunResult with events_digest.

    DoNothing and block-all double, same seed -> equal digest. Different seed -> different digest.
    """
    harness = EvalHarness()
    policy_dn = DoNothingPolicy()
    policy_block = BlockAllPolicy()

    res_dn = harness.run(policy_dn, seed=42)
    res_block = harness.run(policy_block, seed=42)
    assert res_dn.events_digest == res_block.events_digest

    res_diff_seed = harness.run(policy_dn, seed=43)
    assert res_dn.events_digest != res_diff_seed.events_digest


def test_extra_action_does_not_shift_rng():
    """Taking an extra action must never shift luck/draws for subsequent events."""
    streams = RngStreams(seed=123)
    arrivals = streams.stream("arrivals")
    actions = streams.stream("actions")

    _ = arrivals.uniform()
    _ = actions.uniform()
    next_arrival_with_action = arrivals.uniform()

    streams_control = RngStreams(seed=123)
    arrivals_control = streams_control.stream("arrivals")
    _ = arrivals_control.uniform()
    next_arrival_control = arrivals_control.uniform()

    assert next_arrival_with_action == next_arrival_control


def test_lift_not_above_attributed():
    """Invariant: lift <= attributed per run."""
    harness = EvalHarness()
    lift, attributed = harness.compute_lift_and_attribution(seed=42)
    assert lift <= attributed


def test_guardrail_veto_cannot_be_bypassed():
    """apply_guardrails(proposed, rails, obs, now) -> GuardedDecision(final, verdicts).

    Strict rail, proposed BLOCK -> final is not BLOCK, verdict recorded.
    apply_guardrails(..., override=True) raises TypeError.
    """
    proposed = Action(decision="BLOCK", confidence=1.0)
    rail = StrictRail()
    obs = Observable(id="1", features={"amount": 1000.0})
    now = datetime.now(UTC)

    guarded = apply_guardrails(proposed, [rail], obs, now)
    assert guarded.final.decision != "BLOCK"
    assert len(guarded.verdicts) > 0
    assert any(v.verdict == VerdictType.BLOCK for v in guarded.verdicts)

    with pytest.raises(TypeError):
        apply_guardrails(proposed, [rail], obs, now, override=True)  # type: ignore[call-arg]


def test_safe_default_never_vetoed():
    """Block-everything rail: proposed GIVE_UP and ALLOW -> final unchanged, ignored veto recorded."""
    rail = BlockEverythingRail()
    obs = Observable(id="1", features={})
    now = datetime.now(UTC)

    proposed_giveup = Action(decision="GIVE_UP")
    guarded_giveup = apply_guardrails(proposed_giveup, [rail], obs, now)
    assert guarded_giveup.final.decision == "GIVE_UP"
    assert any(v.verdict == VerdictType.BLOCK for v in guarded_giveup.verdicts)

    proposed_allow = Action(decision="ALLOW")
    guarded_allow = apply_guardrails(proposed_allow, [rail], obs, now)
    assert guarded_allow.final.decision == "ALLOW"
    assert any(v.verdict == VerdictType.BLOCK for v in guarded_allow.verdicts)


def test_audit_log_append_only(tmp_path: Path):
    """After each append, earlier file bytes unchanged (new bytes startwith old bytes).

    Assert AuditStore has no delete or update.
    """
    log_path = tmp_path / "audit.jsonl"
    store = AuditStore(log_path)

    store.append({"event": "event_1"})
    bytes_1 = log_path.read_bytes()

    store.append({"event": "event_2"})
    bytes_2 = log_path.read_bytes()
    assert bytes_2.startswith(bytes_1)

    assert not hasattr(AuditStore, "delete")
    assert not hasattr(AuditStore, "update")


def test_report_matches_fresh_run(tmp_path: Path):
    """generate_report(results, path, *, generated_at: datetime).

    Same generated_at -> identical text.
    Different -> differ only in the line that starts with 'Generated at:'.
    """
    results = {"run_id": "fresh_run_1"}
    p1 = tmp_path / "report_1.md"
    p2 = tmp_path / "report_2.md"
    p3 = tmp_path / "report_3.md"

    t1 = datetime(2026, 10, 26, 12, 0, 0, tzinfo=UTC)
    t2 = datetime(2026, 10, 26, 13, 0, 0, tzinfo=UTC)

    generate_report(results, p1, generated_at=t1)
    generate_report(results, p2, generated_at=t1)
    assert p1.read_text(encoding="utf-8") == p2.read_text(encoding="utf-8")

    generate_report(results, p3, generated_at=t2)
    lines1 = p1.read_text(encoding="utf-8").splitlines()
    lines3 = p3.read_text(encoding="utf-8").splitlines()
    assert len(lines1) == len(lines3)

    diffs = [(l1, l3) for l1, l3 in zip(lines1, lines3, strict=True) if l1 != l3]
    assert len(diffs) == 1
    assert diffs[0][0].startswith("Generated at:")
    assert diffs[0][1].startswith("Generated at:")


def test_min_seeds_flag_underpowered():
    """evaluate_lift(diffs, n_resamples, seed) -> LiftResult(mean, lo, hi, n_seeds, underpowered).

    10 seeds -> True, 20 -> False.
    """
    diffs_10 = [1.5] * 10
    res_10 = evaluate_lift(diffs_10, n_resamples=10_000, seed=42)
    assert res_10.n_seeds == 10
    assert res_10.underpowered is True

    diffs_20 = [1.5] * 20
    res_20 = evaluate_lift(diffs_20, n_resamples=10_000, seed=42)
    assert res_20.n_seeds == 20
    assert res_20.underpowered is False
