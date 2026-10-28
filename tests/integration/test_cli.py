"""Integration tests for CLI commands in stubbed state."""

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


def test_cli_report_stubbed():
    """CLI report command must exit 2 with 'not implemented' message."""
    result = runner.invoke(app, ["report"])
    assert result.exit_code == 2
    assert "not implemented" in result.output.lower()
