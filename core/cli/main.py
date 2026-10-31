"""Lift CLI entrypoint.

Usage:
    lift run --pack payments_fraud --seed 42
    lift report --results results/latest.json
    lift check
    lift dashboard --port 3000
    lift new-pack my_domain
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Annotated

import typer

from .render import (
    make_console,
    render_error,
    render_next_command,
    render_policy_table,
    render_verdict,
    save_svg,
)

# Global --debug flag toggled by callback
_debug: bool = False


def _version_callback(value: bool) -> None:
    if value:
        from rich import print as rprint

        rprint("lift 0.1.0")
        raise typer.Exit()


def _main_callback(
    ctx: typer.Context,
    debug: Annotated[
        bool,
        typer.Option("--debug", help="Show full stack traces on errors."),
    ] = False,
    version: Annotated[
        bool | None,
        typer.Option("--version", callback=_version_callback, is_eager=True, help="Show version."),
    ] = None,
) -> None:
    global _debug  # noqa: PLW0603
    _debug = debug


app = typer.Typer(
    help="Lift: Simulation & Guardrail Evaluation Platform",
    callback=_main_callback,
    no_args_is_help=True,
)


def _raise_not_implemented(*, command: str, fix: str) -> None:
    """Abort with a friendly stub message instead of a raw traceback."""
    console = make_console()
    render_error(
        console,
        what_failed=f"'{command}' is not yet implemented (phase 01).",
        fix_command=fix,
    )
    # Also write to stderr for backward-compatible test assertions
    sys.stderr.write("not implemented: phase 01\n")
    raise typer.Exit(code=2)


@app.command()
def run(
    pack: Annotated[
        str,
        typer.Option(help="Pack name.  Example: payments_fraud"),
    ] = "payments_fraud",
    policy: Annotated[
        str,
        typer.Option(help="Policy name.  Example: ml_threshold"),
    ] = "do_nothing",
    guardrail: Annotated[
        str,
        typer.Option(help="Guardrail name.  Example: HighValueGuardrail"),
    ] = "none",
    seed: Annotated[
        int,
        typer.Option(help="Random seed.  Example: 42"),
    ] = 42,
    save_svg_path: Annotated[
        str | None,
        typer.Option("--save-svg", help="Save terminal output as SVG to PATH."),
    ] = None,
) -> None:
    """Run a simulation evaluation loop.

    Example:
        lift run --pack payments_fraud --seed 42
    """
    _raise_not_implemented(
        command="run",
        fix="lift run --pack payments_fraud --seed 42",
    )


@app.command()
def report(
    results: Annotated[
        str,
        typer.Option(help="Results JSON file.  Example: results/latest.json"),
    ] = "results/latest.json",
    save_svg_path: Annotated[
        str | None,
        typer.Option("--save-svg", help="Save terminal output as SVG to PATH."),
    ] = None,
) -> None:
    """Generate evaluation report from results JSON.

    Example:
        lift report --results results/latest.json
    """
    record = save_svg_path is not None
    console = make_console(record=record)

    results_path = Path(results)
    if not results_path.exists():
        render_error(
            console,
            what_failed=f"Results file not found: {results}  (not implemented: phase 01)",
            fix_command="lift run --pack payments_fraud --seed 42",
            debug=_debug,
        )
        sys.stderr.write("not implemented: phase 01\n")
        raise typer.Exit(code=2)

    try:
        data = json.loads(results_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        render_error(
            console,
            what_failed=f"Cannot parse results file: {results}",
            fix_command="lift run --pack payments_fraud --seed 42",
            exception=exc,
            debug=_debug,
        )
        raise typer.Exit(code=1) from exc

    try:
        # Accept both single-run dict and list-of-runs.
        if isinstance(data, list):
            if not data:
                raise ValueError("results list is empty")
            run_data = data[0]
        else:
            run_data = data
        if not isinstance(run_data, dict):
            raise ValueError("results must contain a run object")

        policies = run_data.get("policies", [])
        if not policies:
            raise ValueError("no policies found in results")

        # Find best non-baseline, non-oracle policy by net benefit.
        candidates = [
            p for p in policies if not p.get("is_baseline") and p.get("type") != "ceiling"
        ]
        best = (
            max(candidates, key=lambda p: p["metrics"]["net_benefit"]["mean"])
            if candidates
            else policies[0]
        )
        lift = best["metrics"]["lift_vs_baseline"]

        render_verdict(
            console,
            best_policy=best["name"],
            lift_mean=lift["mean"],
            lift_lo=lift["lo"],
            lift_hi=lift["hi"],
            n=lift["n"],
            seeds=run_data.get("seeds_evaluated", 0),
            tag="SIMULATED",
        )
        render_policy_table(
            console,
            policies,
            scenario=run_data.get("scenario", ""),
            sample_size=run_data.get("sample_size_n", 0),
        )
    except (IndexError, KeyError, TypeError, ValueError) as exc:
        render_error(
            console,
            what_failed=f"Invalid results data in {results}: {exc}",
            fix_command="lift run --pack payments_fraud --seed 42",
            exception=exc,
            debug=_debug,
        )
        raise typer.Exit(code=1) from exc

    render_next_command(console, "lift check")

    if save_svg_path:
        save_svg(console, save_svg_path)


@app.command()
def check(
    save_svg_path: Annotated[
        str | None,
        typer.Option("--save-svg", help="Save terminal output as SVG to PATH."),
    ] = None,
) -> None:
    """Verify invariants and code quality.

    Example:
        lift check
    """
    _raise_not_implemented(
        command="check",
        fix="lift check",
    )


@app.command()
def dashboard(
    port: Annotated[
        int,
        typer.Option(help="Dashboard port.  Example: 3000"),
    ] = 3000,
) -> None:
    """Launch the Next.js visual dashboard.

    Example:
        lift dashboard --port 3000
    """
    _raise_not_implemented(
        command="dashboard",
        fix="lift dashboard --port 3000",
    )


@app.command("new-pack")
def new_pack(
    name: Annotated[
        str,
        typer.Argument(help="Name of the new pack.  Example: lending"),
    ],
) -> None:
    """Scaffold a new domain pack from _template.

    Example:
        lift new-pack lending
    """
    _raise_not_implemented(
        command="new-pack",
        fix=f"lift new-pack {name}",
    )


if __name__ == "__main__":
    app()
