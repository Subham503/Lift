"""Lift CLI entrypoint."""

import sys

import typer

app = typer.Typer(help="Lift: Simulation & Guardrail Evaluation Platform")


def _raise_not_implemented() -> None:
    sys.stderr.write("not implemented: phase 01\n")
    raise typer.Exit(code=2)


@app.command()
def run(
    pack: str = typer.Option("payments_fraud", help="Pack name to execute"),
    policy: str = typer.Option("do_nothing", help="Policy name"),
    guardrail: str = typer.Option("none", help="Guardrail name"),
    seed: int = typer.Option(42, help="Random seed"),
) -> None:
    """Run a simulation evaluation loop."""
    _raise_not_implemented()


@app.command()
def report(
    results: str = typer.Option("results/latest.json", help="Results JSON file"),
) -> None:
    """Generate evaluation report."""
    _raise_not_implemented()


@app.command()
def check() -> None:
    """Verify invariants and code quality."""
    _raise_not_implemented()


@app.command()
def dashboard(
    port: int = typer.Option(3000, help="Dashboard port"),
) -> None:
    """Launch the Next.js visual dashboard."""
    _raise_not_implemented()


@app.command("new-pack")
def new_pack(
    name: str = typer.Argument(..., help="Name of the new pack to create"),
) -> None:
    """Scaffold a new domain pack from _template."""
    _raise_not_implemented()


if __name__ == "__main__":
    app()
