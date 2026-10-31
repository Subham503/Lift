from datetime import UTC, datetime

import pytest

from core.report.generate import generate_report

T1 = datetime(2026, 10, 26, 12, 0, tzinfo=UTC)
T2 = datetime(2026, 10, 26, 13, 0, tzinfo=UTC)


def _m(mean, lo, hi):
    return {"mean": mean, "lo": lo, "hi": hi}


RESULTS = {
    "run_id": "run_1",
    "pack": "payments_fraud",
    "scenario": "synthetic",
    "commit": "abc123",
    "command": "lift run --seed 42",
    "seeds": [1, 2, 3],
    "config_hash": "cfg1",
    "versions": {"python": "3.13", "numpy": "2.2"},
    "policies": [
        {
            "name": "Base|line",
            "is_baseline": True,
            "metrics": {
                "net_benefit": _m(0, 0, 0),
                "fraud_caught_rate": _m(0, 0, 0),
                "false_positive_rate": _m(0, 0, 0),
                "review_load_hours": _m(0, 0, 0),
            },
        },
        {
            "name": "Rules",
            "type": "rules",
            "metrics": {
                "net_benefit": _m(412850, 401200, 424500),
                "fraud_caught_rate": _m(74.2, 71.5, 76.8),
                "false_positive_rate": _m(1.84, 1.45, 2.23),
                "review_load_hours": _m(48.2, 44.1, 52.3),
                "guardrail_overrides": 18,
            },
        },
    ],
}


def read(p):
    return p.read_text(encoding="utf-8")


def test_same_input_same_text(tmp_path):
    generate_report(RESULTS, tmp_path / "a.md", generated_at=T1)
    generate_report(RESULTS, tmp_path / "b.md", generated_at=T1)
    assert read(tmp_path / "a.md") == read(tmp_path / "b.md")


def test_only_timestamp_line_differs(tmp_path):
    generate_report(RESULTS, tmp_path / "a.md", generated_at=T1)
    generate_report(RESULTS, tmp_path / "b.md", generated_at=T2)
    diffs = [
        (x, y)
        for x, y in zip(
            read(tmp_path / "a.md").splitlines(),
            read(tmp_path / "b.md").splitlines(),
            strict=True,
        )
        if x != y
    ]
    assert len(diffs) == 1 and diffs[0][0].startswith("Generated at:")


def test_header_fields_present(tmp_path):
    out = read(generate_report(RESULTS, tmp_path / "a.md", generated_at=T1))
    for frag in ["abc123", "lift run --seed 42", "1, 2, 3", "cfg1", "numpy 2.2", "SIMULATED"]:
        assert frag in out


def test_missing_fields_say_unknown_not_invented(tmp_path):
    out = read(generate_report({"run_id": "x"}, tmp_path / "a.md", generated_at=T1))
    assert "Commit hash: unknown" in out
    assert "Config hash: unknown" in out
    assert "| Policy |" not in out


def test_table_and_pipe_escape(tmp_path):
    out = read(generate_report(RESULTS, tmp_path / "a.md", generated_at=T1))
    assert "Base\\|line" in out
    assert "$412,850 [$401,200, $424,500]" in out
    assert "| 18 |" in out


def test_fixture_source_labeled(tmp_path):
    out = read(
        generate_report({**RESULTS, "source": "fixture"}, tmp_path / "a.md", generated_at=T1)
    )
    assert "DEMO FIXTURE" in out


def test_naive_datetime_rejected(tmp_path):
    with pytest.raises(ValueError):
        generate_report(RESULTS, tmp_path / "a.md", generated_at=datetime(2026, 1, 1))


def test_bad_policy_entry_rejected(tmp_path):
    with pytest.raises(ValueError):
        generate_report(
            {"policies": [{"name": "x", "metrics": {}}]}, tmp_path / "a.md", generated_at=T1
        )


def test_creates_parent_and_returns_path(tmp_path):
    p = tmp_path / "x" / "y" / "r.md"
    assert generate_report(RESULTS, p, generated_at=T1) == p and p.exists()


def test_unix_newlines(tmp_path):
    p = generate_report(RESULTS, tmp_path / "a.md", generated_at=T1)
    assert b"\r\n" not in p.read_bytes()
