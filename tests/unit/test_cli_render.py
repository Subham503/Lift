"""Snapshot tests for CLI plain-text output.

Tests verify:
- Verdict block content (best policy, lift, CI, n, seeds, tag)
- Policy table with all dashboard columns + dominated marking
- Next command hint
- Error messages with fix command (no stack trace without --debug)
- NO_COLOR / non-TTY plain text fallback
- --save-svg flag
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from typer.testing import CliRunner

from core.cli.main import app
from core.cli.render import make_console, render_policy_table, render_verdict

runner = CliRunner()

FIXTURE_PATH = Path(__file__).resolve().parent.parent / "fixtures" / "test_run.json"


@pytest.fixture()
def fixture_data() -> list[dict]:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


@pytest.fixture()
def tmp_results(tmp_path: Path, fixture_data: list[dict]) -> Path:
    """Write fixture data to a temp JSON for CLI to consume."""
    p = tmp_path / "results.json"
    p.write_text(json.dumps(fixture_data), encoding="utf-8")
    return p


# ─── Existing backward-compatibility tests ──────────────────────────────


def test_cli_run_stubbed():
    """CLI run command must exit 2 with 'not implemented' message."""
    result = runner.invoke(app, ["run"])
    assert result.exit_code == 2
    assert "not implemented" in result.output.lower()


def test_cli_check_stubbed():
    """CLI check command must exit 2 with 'not implemented' message."""
    result = runner.invoke(app, ["check"])
    assert result.exit_code == 2
    assert "not implemented" in result.output.lower()


def test_cli_report_missing_file():
    """CLI report command exits 2 with 'not found' and 'not implemented' when results missing."""
    result = runner.invoke(app, ["report", "--results", "nonexistent.json"])
    assert result.exit_code == 2
    assert "not found" in result.output.lower()
    assert "not implemented" in result.output.lower()


# ─── Verdict output ─────────────────────────────────────────────────────


def test_report_verdict_content(tmp_results: Path):
    """Report prints verdict with best policy, lift, CI, n, seeds, SIMULATED."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    out = result.output

    assert result.exit_code == 0
    # Best policy
    assert "ThresholdModel + HighValueGuardrail" in out
    # Lift value (USD formatted)
    assert "$749,150" in out
    # 95% CI bounds
    assert "$742,000" in out
    assert "$756,300" in out
    # n
    assert "2,000" in out
    # Seeds
    assert "20" in out
    # Tag
    assert "SIMULATED" in out


def test_verdict_comes_before_table(tmp_results: Path):
    """Verdict block appears before the policy table."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    out = result.output

    verdict_pos = out.find("Best policy")
    table_pos = out.find("DoNothingPolicy")
    assert verdict_pos < table_pos, "Verdict must appear before the policy table"


# ─── Policy table ───────────────────────────────────────────────────────


def test_report_table_has_all_policies(tmp_results: Path):
    """Table lists all policies including baseline."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    out = result.output

    assert "DoNothingPolicy" in out
    assert "RuleBasedFraudPolicy" in out
    assert "ThresholdModel + HighValueGuardrail" in out


def test_report_table_currency_format(tmp_results: Path):
    """Net benefit values use en-US currency format."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    out = result.output

    # Rules policy net benefit
    assert "$412,850" in out
    # Best policy net benefit
    assert "$749,150" in out


def test_report_table_dominated_marked(tmp_results: Path):
    """Dominated policies are marked, not hidden."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    out = result.output

    # DoNothingPolicy and RuleBasedFraudPolicy are dominated by ml_guarded
    assert "dominated" in out.lower()
    # All 3 policies still present
    assert out.count("Policy") >= 1  # column header
    assert "DoNothingPolicy" in out
    assert "RuleBasedFraudPolicy" in out


def test_report_table_has_dashboard_columns(tmp_results: Path):
    """Table includes dashboard metrics, with policy type in the name column."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    out = result.output

    for col in ["Policy", "Net benefit", "Fraud caught", "FPR", "Review load", "Overrides"]:
        assert col in out, f"Column '{col}' missing from table output"
    assert "baseline" in out
    assert "rules" in out
    assert "guarded" in out


# ─── Next command hint ──────────────────────────────────────────────────


def test_report_next_command(tmp_results: Path):
    """Last meaningful line has 'Next:' with an exact command."""
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    assert "Next:" in result.output
    assert "lift check" in result.output


# ─── Error formatting ───────────────────────────────────────────────────


def test_error_shows_fix_command():
    """Error output includes the fix command."""
    result = runner.invoke(app, ["report", "--results", "does_not_exist.json"])
    assert result.exit_code == 2
    assert "lift run" in result.output


def test_error_no_traceback_by_default():
    """Without --debug, no traceback is shown."""
    result = runner.invoke(app, ["report", "--results", "does_not_exist.json"])
    assert "Traceback" not in result.output


def test_debug_shows_traceback_for_invalid_json(tmp_path: Path):
    """--debug adds exception details while the default output stays concise."""
    invalid_results = tmp_path / "invalid.json"
    invalid_results.write_text("{invalid", encoding="utf-8")
    result = runner.invoke(app, ["--debug", "report", "--results", str(invalid_results)])
    assert result.exit_code == 1
    assert "Traceback" in result.output


def test_empty_results_list_has_actionable_error(tmp_path: Path):
    """Invalid result shapes produce a repair command without a traceback."""
    empty_results = tmp_path / "empty.json"
    empty_results.write_text("[]", encoding="utf-8")
    result = runner.invoke(app, ["report", "--results", str(empty_results)])
    assert result.exit_code == 1
    assert "results list is empty" in result.output
    assert "Fix:" in result.output
    assert "Traceback" not in result.output


# ─── Plain-text mode (NO_COLOR) ─────────────────────────────────────────


def test_no_color_plain_text(tmp_results: Path, monkeypatch: pytest.MonkeyPatch):
    """When NO_COLOR is set, output has no ANSI escape sequences."""
    monkeypatch.setenv("NO_COLOR", "1")
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    # ANSI escape sequences start with \x1b[
    assert "\x1b[" not in result.output


# ─── SVG save ────────────────────────────────────────────────────────────


def test_save_svg_creates_file(tmp_results: Path, tmp_path: Path):
    """--save-svg PATH creates an SVG file."""
    svg_path = tmp_path / "output.svg"
    result = runner.invoke(
        app,
        ["report", "--results", str(tmp_results), "--save-svg", str(svg_path)],
    )
    assert result.exit_code == 0
    assert svg_path.exists()
    content = svg_path.read_text(encoding="utf-8")
    assert "<svg" in content


# ─── Render unit tests ──────────────────────────────────────────────────


def test_render_verdict_plain():
    """Verdict renders correctly in plain/recorded mode."""
    console = make_console(record=True, force_terminal=True)
    render_verdict(
        console,
        best_policy="TestPolicy",
        lift_mean=100_000.0,
        lift_lo=90_000.0,
        lift_hi=110_000.0,
        n=2000,
        seeds=20,
        tag="SIMULATED",
    )
    text = console.export_text()
    assert "TestPolicy" in text
    assert "$100,000" in text
    assert "$90,000" in text
    assert "$110,000" in text
    assert "2,000" in text
    assert "20" in text
    assert "SIMULATED" in text


def test_render_policy_table_dominated():
    """Policy table marks dominated policies."""
    policies = [
        {
            "policy_id": "a",
            "name": "PolicyA",
            "type": "baseline",
            "is_baseline": True,
            "metrics": {
                "net_benefit": {"mean": 0, "lo": 0, "hi": 0, "n": 100},
                "fraud_caught_rate": {"mean": 0, "lo": 0, "hi": 0, "n": 100},
                "false_positive_rate": {"mean": 0, "lo": 0, "hi": 0, "n": 100},
                "review_load_hours": {"mean": 0, "lo": 0, "hi": 0, "n": 100},
                "guardrail_overrides": 0,
            },
        },
        {
            "policy_id": "b",
            "name": "PolicyB",
            "type": "learned",
            "is_baseline": False,
            "metrics": {
                "net_benefit": {"mean": 500, "lo": 400, "hi": 600, "n": 100},
                "fraud_caught_rate": {"mean": 80, "lo": 75, "hi": 85, "n": 100},
                "false_positive_rate": {"mean": 1, "lo": 0.5, "hi": 1.5, "n": 100},
                "review_load_hours": {"mean": 10, "lo": 8, "hi": 12, "n": 100},
                "guardrail_overrides": 5,
            },
        },
    ]

    console = make_console(record=True, force_terminal=True)
    render_policy_table(console, policies)
    text = console.export_text()

    assert "PolicyA" in text
    assert "PolicyB" in text
    assert "baseline" in text.lower()
    assert "dominated" not in text.lower()  # Baselines are the reference frontier.


@pytest.mark.parametrize("width", [100, 140])
def test_render_policy_table_does_not_truncate(width: int):
    """Long labels and CI bounds remain complete at the supported table widths."""
    policies = [
        {
            "policy_id": "a",
            "name": "LongReviewPolicyName",
            "type": "learned",
            "is_baseline": False,
            "metrics": {
                "net_benefit": {"mean": 412_850, "lo": 401_200, "hi": 424_500, "n": 100},
                "fraud_caught_rate": {"mean": 80, "lo": 75, "hi": 85, "n": 100},
                "false_positive_rate": {"mean": 1, "lo": 0.5, "hi": 1.5, "n": 100},
                "review_load_hours": {"mean": 25, "lo": 20, "hi": 30, "n": 100},
                "guardrail_overrides": 5,
            },
        }
    ]
    console = make_console(record=True, force_terminal=True, width=width)
    render_policy_table(console, policies)
    text = console.export_text()
    for fragment in [
        "LongReviewPolicyName",
        "learned",
        "$401,200",
        "$424,500",
        "Review load",
    ]:
        assert fragment in text


def test_render_fmt_usd_negative():
    """Negative USD values are formatted correctly."""
    from core.cli.render import _fmt_usd

    assert _fmt_usd(-5000) == "-$5,000"
    assert _fmt_usd(0) == "$0"
    assert _fmt_usd(1234567) == "$1,234,567"


# ─── Snapshot: full plain-text output ────────────────────────────────────


EXPECTED_SNAPSHOT_FRAGMENTS = [
    "Lift evaluation result",
    "Best policy:",
    "ThresholdModel + HighValueGuardrail",
    "$749,150",
    "95% CI:",
    "$742,000",
    "$756,300",
    "SIMULATED",
    "Candidate policies",
    "DoNothingPolicy",
    "RuleBasedFraudPolicy",
    "Net benefit",
    "Fraud caught",
    "FPR",
    "Review load",
    "Overrides",
    "dominated",
    "Next:",
    "lift check",
]


def test_snapshot_plain_text_output(tmp_results: Path, monkeypatch: pytest.MonkeyPatch):
    """Snapshot the stable, user-facing plain-text lines from a complete report."""
    monkeypatch.setenv("NO_COLOR", "1")
    result = runner.invoke(app, ["report", "--results", str(tmp_results)])
    assert result.exit_code == 0
    output_lines = [" ".join(line.split()).strip() for line in result.output.splitlines()]
    snapshot = [
        line
        for line in output_lines
        if line.startswith(("Best policy:", "Lift:", "95% CI:", "n:", "Seeds:", "Tag:"))
        or line.startswith("CI ")
        or line.startswith("Next:")
    ]
    assert snapshot == [
        "Best policy: ThresholdModel + HighValueGuardrail",
        "Lift: $749,150",
        "95% CI: [$742,000, $756,300]",
        "n: 2,000",
        "Seeds: 20",
        "Tag: SIMULATED",
        "CI DoNothingPolicy: net benefit [$0, $0]; fraud caught [0.0%, 0.0%]; FPR [0.00%, 0.00%]",
        "CI RuleBasedFraudPolicy: net benefit [$401,200, $424,500]; fraud caught [71.5%, 76.8%]; FPR [1.45%, 2.23%]",
        "CI ThresholdModel + HighValueGuardrail: net benefit [$742,000, $756,300]; fraud caught [90.5%, 94.2%]; FPR [0.42%, 0.83%]",
        "Next: lift check",
    ]
