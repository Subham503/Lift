"""Rich rendering utilities for Lift CLI output.

Handles verdict banners, policy tables, error formatting,
NO_COLOR / non-TTY plain-text fallback, and --save-svg export.
"""

from __future__ import annotations

import os
import sys
from typing import Any

from rich.console import Console
from rich.table import Table
from rich.text import Text


def _is_plain() -> bool:
    """Return True when output should be plain text (NO_COLOR or piped)."""
    if os.environ.get("NO_COLOR") is not None:
        return True
    if not hasattr(sys.stdout, "isatty"):
        return True
    return not sys.stdout.isatty()


def make_console(
    *,
    record: bool = False,
    force_terminal: bool | None = None,
    width: int | None = None,
) -> Console:
    """Build a Console respecting NO_COLOR and non-TTY."""
    import shutil

    plain = _is_plain()
    if force_terminal is None:
        force_terminal = not plain
    if width is None:
        term_width = shutil.get_terminal_size((160, 24)).columns
        width = max(term_width, 160)
    return Console(
        no_color=plain,
        force_terminal=force_terminal,
        highlight=not plain,
        record=record,
        width=width,
    )


def _fmt_usd(value: float) -> str:
    """Format a USD value with en-US currency formatting."""
    negative = value < 0
    abs_val = abs(value)
    if abs_val == int(abs_val):
        formatted = f"{int(abs_val):,}"
    else:
        formatted = f"{abs_val:,.2f}"
    return f"-${formatted}" if negative else f"${formatted}"


def _fmt_pct(value: float, decimals: int = 1) -> str:
    """Format a percentage value."""
    return f"{value:.{decimals}f}%"


def render_verdict(
    console: Console,
    *,
    best_policy: str,
    lift_mean: float,
    lift_lo: float,
    lift_hi: float,
    n: int,
    seeds: int,
    tag: str = "SIMULATED",
) -> None:
    """Print the verdict headline block."""
    console.print()
    console.rule("[bold]Lift evaluation result[/bold]")
    console.print()
    console.print(f"  Best policy:  [bold cyan]{best_policy}[/bold cyan]")
    console.print(f"  Lift:         [bold green]{_fmt_usd(lift_mean)}[/bold green]")
    console.print(f"  95% CI:       [{_fmt_usd(lift_lo)}, {_fmt_usd(lift_hi)}]")
    console.print(f"  n:            {n:,}")
    console.print(f"  Seeds:        {seeds}")
    console.print(f"  Tag:          {tag}")
    console.print()


def _dominated_label(
    policy: dict[str, Any],
    all_policies: list[dict[str, Any]],
) -> str:
    """Mark a non-baseline policy dominated if another beats it on both outcomes."""
    if policy.get("is_baseline", False):
        return ""
    my_benefit = policy["metrics"]["net_benefit"]["mean"]
    my_fraud = policy["metrics"]["fraud_caught_rate"]["mean"]

    for other in all_policies:
        if other["policy_id"] == policy["policy_id"]:
            continue
        other_benefit = other["metrics"]["net_benefit"]["mean"]
        other_fraud = other["metrics"]["fraud_caught_rate"]["mean"]
        if other_benefit >= my_benefit and other_fraud >= my_fraud:
            if other_benefit > my_benefit or other_fraud > my_fraud:
                return "dominated"
    return ""


def render_policy_table(
    console: Console,
    policies: list[dict[str, Any]],
    *,
    scenario: str = "",
    sample_size: int = 0,
) -> None:
    """Render the policy comparison table matching dashboard columns."""
    table = Table(
        title=f"Candidate policies ({scenario})" if scenario else "Candidate policies",
        caption=f"n = {sample_size:,} transactions per seed" if sample_size else None,
        show_lines=False,
        pad_edge=False,
        padding=(0, 1),
    )

    table.add_column("Policy", style="bold", no_wrap=True, overflow="ignore", min_width=22)
    table.add_column("Net benefit", justify="right", no_wrap=True, overflow="ignore", min_width=12)
    table.add_column("Fraud caught", justify="right", no_wrap=True, overflow="ignore", min_width=12)
    table.add_column("FPR", justify="right", no_wrap=True, overflow="ignore", min_width=7)
    table.add_column("Review load", justify="right", no_wrap=True, overflow="ignore", min_width=11)
    table.add_column("Overrides", justify="right", no_wrap=True, overflow="ignore", min_width=8)

    for p in policies:
        m = p["metrics"]
        nb = m["net_benefit"]
        fr = m["fraud_caught_rate"]
        fpr = m["false_positive_rate"]
        rl = m["review_load_hours"]
        overrides = m.get("guardrail_overrides", 0)

        status = _dominated_label(p, policies)
        is_baseline = p.get("is_baseline", False)

        # Policy name with baseline tag
        name = p["name"]
        if p.get("type"):
            name_detail = p["type"]
        else:
            name_detail = ""
        if is_baseline:
            name_detail = f"{name_detail} | baseline" if name_detail else "baseline"
        elif status == "dominated":
            name_detail = f"{name_detail} | dominated" if name_detail else "dominated"
        name_cell = Text(name)
        if name_detail:
            name_cell.append(
                f"\n{name_detail}", style="dim red" if status == "dominated" else "dim"
            )

        nb_cell = _fmt_usd(nb["mean"])
        fr_cell = _fmt_pct(fr["mean"])
        fpr_cell = _fmt_pct(fpr["mean"], 2)

        # Review load
        rl_text = f"{rl['mean']:.1f} hrs"

        table.add_row(
            name_cell,
            nb_cell,
            fr_cell,
            fpr_cell,
            rl_text,
            str(overrides),
        )

    console.print(table)
    for p in policies:
        metrics = p["metrics"]
        benefit = metrics["net_benefit"]
        fraud = metrics["fraud_caught_rate"]
        fpr = metrics["false_positive_rate"]
        console.print(
            f"CI {p['name']}: net benefit [{_fmt_usd(benefit['lo'])}, {_fmt_usd(benefit['hi'])}]; "
            f"fraud caught [{_fmt_pct(fraud['lo'])}, {_fmt_pct(fraud['hi'])}]; "
            f"FPR [{_fmt_pct(fpr['lo'], 2)}, {_fmt_pct(fpr['hi'], 2)}]"
        )
    console.print()


def render_next_command(console: Console, command: str) -> None:
    """Print the 'Next:' hint line."""
    console.print(f"Next: [bold]{command}[/bold]")


def render_error(
    console: Console,
    *,
    what_failed: str,
    fix_command: str,
    exception: BaseException | None = None,
    debug: bool = False,
) -> None:
    """Print a user-friendly error. Show traceback only if --debug."""
    console.print()
    console.print(f"[bold red]Error:[/bold red] {what_failed}")
    console.print(f"Fix:   [bold]{fix_command}[/bold]")
    if debug and exception is not None:
        console.print()
        console.print_exception(show_locals=False)
    console.print()


def save_svg(console: Console, path: str) -> None:
    """Save recorded console output as SVG."""
    console.save_svg(path, title="lift")
