"""Unit tests for scripts/check_banned_phrases.py guard scanner."""

from pathlib import Path

from scripts.check_banned_phrases import scan


def test_guard_clean_passes(tmp_path: Path):
    """Clean documentation produces 0 violations."""
    readme = tmp_path / "README.md"
    readme.write_text("This is an honest simulation platform.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 0


def test_guard_banned_phrase_flagged(tmp_path: Path):
    """Banned phrase is flagged as a violation."""
    readme = tmp_path / "README.md"
    readme.write_text("Our model achieves state-of-the-art accuracy.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "state-of-the-art" in violations[0]


def test_guard_bus_stops_not_flagged(tmp_path: Path):
    """The word 'stops' without fraud/loss/money context is not flagged."""
    readme = tmp_path / "README.md"
    readme.write_text("The express bus stops at City Center.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 0

    # Conversely, 'stops' in fraud/loss/money context must be flagged
    readme.write_text("This policy stops fraud transactions.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "stops" in violations[0]


def test_guard_untagged_dollar_flagged(tmp_path: Path):
    """Untagged dollar figure is flagged as a violation."""
    readme = tmp_path / "README.md"
    readme.write_text("Total net benefit is $500 for this run.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "Untagged figure" in violations[0]


def test_guard_untagged_rupee_flagged(tmp_path: Path):
    """Untagged rupee figure (\u20b9) is flagged as a violation."""
    readme = tmp_path / "README.md"
    # Using \u20b9 escape sequence per non-ASCII constraint
    readme.write_text("Average loss is \u20b91500 per customer.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "Untagged figure" in violations[0]


def test_guard_untagged_plus_minus_flagged(tmp_path: Path):
    """Untagged plus-minus figure (\u00b1) is flagged as a violation."""
    readme = tmp_path / "README.md"
    # Using \u00b1 escape sequence per non-ASCII constraint
    readme.write_text("Variance is \u00b125 across seeds.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "Untagged figure" in violations[0]


def test_guard_untagged_percentage_flagged(tmp_path: Path):
    """Untagged percentage figure like 88.6% is flagged as a violation."""
    readme = tmp_path / "README.md"
    readme.write_text("Catch rate reached 88.6% across testing batches.\n", encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "Untagged figure" in violations[0]


def test_guard_tagged_figures_pass(tmp_path: Path):
    """Figures tagged with REAL-DATA, SIMULATED, or ASSUMPTION pass without violation."""
    readme = tmp_path / "README.md"
    content = (
        "Lift achieved $450 (SIMULATED) across test scenarios.\n"
        "Baseline catch rate was 88.6% (REAL-DATA) on public dataset.\n"
        "Estimated friction penalty was \u20b950 (ASSUMPTION) per review.\n"
        "Confidence interval width was \u00b115 (SIMULATED).\n"
    )
    readme.write_text(content, encoding="utf-8")
    violations = scan(tmp_path)
    assert len(violations) == 0


def test_guard_exempt_paths_pass(tmp_path: Path):
    """Exempt paths (docs/HONESTY.md, docs/phases/, docs/decisions/, core/) are not flagged."""
    # docs/HONESTY.md
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir(parents=True)
    honesty = docs_dir / "HONESTY.md"
    honesty.write_text(
        "Banned words include saves and guarantees. Example: $100.\n", encoding="utf-8"
    )

    # docs/phases/
    phases_dir = docs_dir / "phases"
    phases_dir.mkdir(parents=True)
    phase_doc = phases_dir / "PHASE_00.md"
    phase_doc.write_text("Contains references to guarantees and 95%.\n", encoding="utf-8")

    # docs/decisions/
    decisions_dir = docs_dir / "decisions"
    decisions_dir.mkdir(parents=True)
    dec_doc = decisions_dir / "0001_decision.md"
    dec_doc.write_text("We will guarantees stability.\n", encoding="utf-8")

    # core/ source code
    core_dir = tmp_path / "core"
    core_dir.mkdir(parents=True)
    core_file = core_dir / "types.py"
    core_file.write_text("var = '$100'\n", encoding="utf-8")

    violations = scan(tmp_path)
    assert len(violations) == 0


def test_guard_unreadable_file_flagged(tmp_path: Path):
    """An unreadable file within scan scope produces a violation."""
    readme = tmp_path / "README.md"
    # Write invalid UTF-8 bytes to trigger decode error on read_text
    readme.write_bytes(b"\x80\x81\x82\x83")
    violations = scan(tmp_path)
    assert len(violations) == 1
    assert "Unreadable file" in violations[0]
