"""Evaluation report generator."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined

_TEMPLATE_DIR = Path(__file__).parent / "templates"
_UNKNOWN = "unknown"


def _env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        undefined=StrictUndefined,
        autoescape=False,  # markdown output, not HTML
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def _text(value: Any) -> str:
    if value is None or value == "":
        return _UNKNOWN
    return str(value).replace("\r", " ").replace("\n", " ")


def _seeds(value: Any) -> str:
    if isinstance(value, list | tuple):
        return ", ".join(str(s) for s in value) if value else _UNKNOWN
    return _text(value)


def _versions(value: Any) -> str:
    if isinstance(value, dict):
        return ", ".join(f"{k} {v}" for k, v in sorted(value.items())) if value else _UNKNOWN
    return _text(value)


def _usd(v: float) -> str:
    return f"-${abs(v):,.0f}" if v < 0 else f"${v:,.0f}"


def _pct(v: float) -> str:
    return f"{v:.1f}%"


def _pct2(v: float) -> str:
    return f"{v:.2f}%"


def _hrs(v: float) -> str:
    return f"{v:.1f} hrs"


def _ci(metric: dict[str, Any], fmt: Callable[[float], str]) -> str:
    return f"{fmt(metric['mean'])} [{fmt(metric['lo'])}, {fmt(metric['hi'])}]"


def _rows(policies: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for p in policies:
        try:
            m = p["metrics"]
            name = str(p.get("name") or p.get("policy_id") or _UNKNOWN).replace("|", "\\|")
            kind = "baseline" if p.get("is_baseline") else str(p.get("type") or "")
            rows.append(
                {
                    "name": name,
                    "kind": kind,
                    "net": _ci(m["net_benefit"], _usd),
                    "fraud": _ci(m["fraud_caught_rate"], _pct),
                    "fpr": _ci(m["false_positive_rate"], _pct2),
                    "review": _ci(m["review_load_hours"], _hrs),
                    "overrides": str(m.get("guardrail_overrides", 0)),
                }
            )
        except KeyError as exc:
            raise ValueError(f"policy entry is missing field {exc}") from exc
    return rows


def generate_report(
    results: dict[str, Any],
    output_path: Path,
    *,
    generated_at: datetime | None = None,
) -> Path:
    """Generates markdown report from simulation results.

    Pure function of (results, generated_at). Only the 'Generated at:' line
    depends on the clock, so unchanged results give an identical report.
    """
    if generated_at is None:
        generated_at = datetime.now(UTC)
    if generated_at.tzinfo is None:
        raise ValueError("generated_at must be timezone-aware")
    stamp = generated_at.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    policies = results.get("policies") or []
    if not isinstance(policies, list):
        raise ValueError("results['policies'] must be a list")

    run_id = _text(results.get("run_id"))
    scenario = _text(results.get("scenario"))
    context = {
        "title": scenario if scenario != _UNKNOWN else run_id,
        "generated_at": stamp,
        "run_id": run_id,
        "pack": _text(results.get("pack")),
        "scenario": scenario,
        "commit": _text(results.get("commit")),
        "command": _text(results.get("command")),
        "seeds": _seeds(results.get("seeds")),
        "config_hash": _text(results.get("config_hash")),
        "versions": _versions(results.get("versions")),
        "tag": _text(results.get("tag") or "SIMULATED"),
        "source_note": (
            "DEMO FIXTURE (not a real run)" if results.get("source") == "fixture" else ""
        ),
        "rows": _rows(policies),
    }

    text = _env().get_template("report.md.j2").render(**context)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8", newline="\n")
    return out
