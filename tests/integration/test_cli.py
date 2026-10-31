"""Integration tests for implemented and stubbed CLI commands."""

from typer.testing import CliRunner

from core.cli.main import app

runner = CliRunner()


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


def test_cli_report_renders_results():
    """CLI report processes a fixture and prints the verdict and next action."""
    result = runner.invoke(app, ["report", "--results", "tests/fixtures/test_run.json"])
    assert result.exit_code == 0
    assert "Best policy:  ThresholdModel + HighValueGuardrail" in result.output
    assert "Next: lift check" in result.output
