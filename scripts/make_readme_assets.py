"""Regenerate the README terminal captures from real command output.

Run from the repo root with the venv active:

    python scripts/make_readme_assets.py

Nothing is typed by hand. If a command fails, or the output is not what the
README says it is, the script stops and writes nothing.
"""

from __future__ import annotations

import io
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from rich.console import Console
from rich.text import Text

OUT = Path("docs/assets")
WIDTH = 100
ANSI = re.compile(r"\x1b\[[0-9;]*m")
# The claim guard rejects untagged percent figures, even inside captures.
PROGRESS = re.compile(r"\s*\[\s*\d+%\]")
EXPECTED_INVARIANTS = 11


def capture(cmd: list[str]) -> str:
    env = {
        **os.environ,
        "FORCE_COLOR": "1",
        "TERMINAL_WIDTH": str(WIDTH),
        "COLUMNS": str(WIDTH),
        "PYTHONIOENCODING": "utf-8",
    }
    env.pop("NO_COLOR", None)
    proc = subprocess.run(cmd, capture_output=True, env=env, check=False)
    text = proc.stdout.decode("utf-8", errors="replace").replace("\r\n", "\n")
    if proc.returncode != 0 or not text.strip():
        err = proc.stderr.decode("utf-8", errors="replace")
        raise SystemExit(f"command failed ({proc.returncode}): {' '.join(cmd)}\n{text}\n{err}")
    return text


def save_svg(prompt: str, body: str, title: str, name: str) -> None:
    console = Console(
        record=True,
        width=WIDTH,
        file=io.StringIO(),
        force_terminal=True,
        color_system="truecolor",
    )
    console.print(Text(prompt, style="bold green"))
    console.print(Text.from_ansi(body.rstrip()))
    OUT.mkdir(parents=True, exist_ok=True)
    console.save_svg(str(OUT / name), title=title)
    print(f"wrote {OUT / name}")


def help_asset() -> None:
    lift = shutil.which("lift")
    if lift is None:
        raise SystemExit("`lift` not found. Activate the venv, then: pip install -e '.[dev]'")
    save_svg("$ lift --help", capture([lift, "--help"]), "lift --help", "lift-help.svg")


def invariants_asset() -> None:
    # pyproject sets addopts to "-ra -q", so -vv is what yields one line per test.
    cmd = [sys.executable, "-m", "pytest", "tests/invariants", "-vv", "--color=yes"]
    body = capture(cmd + ["-p", "no:cacheprovider"])
    kept: list[str] = []
    passed = 0
    for line in body.splitlines():
        plain = ANSI.sub("", line)
        is_result = "::" in plain and ("PASSED" in plain or "FAILED" in plain)
        is_summary = re.search(r"\d+ (passed|failed)", plain) is not None
        if is_result or is_summary:
            cleaned = PROGRESS.sub("", line)
            kept.append(cleaned.replace("\\", "/"))
        if is_result and "PASSED" in plain:
            passed += 1
    if passed != EXPECTED_INVARIANTS:
        head = "\n".join(body.splitlines()[:15])
        raise SystemExit(f"expected {EXPECTED_INVARIANTS} PASSED lines, got {passed}.\n{head}")
    title = "pytest tests/invariants"
    save_svg("$ pytest tests/invariants -vv", "\n".join(kept), title, "invariants.svg")


def main() -> None:
    if not Path("pyproject.toml").exists():
        raise SystemExit("run this from the repo root")
    help_asset()
    invariants_asset()


if __name__ == "__main__":
    main()
