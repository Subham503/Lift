"""Scanner for banned phrases and untagged figures in documentation and outputs.

Scanned locations:
  - README.md
  - docs/ (excluding docs/HONESTY.md, docs/phases/, and docs/decisions/)
  - reports/generated/
  - dashboard/app/
  - packs/*/LIMITS.md
Does NOT scan core/ or packs source code.
"""

import re
import sys
from pathlib import Path

BANNED_PHRASES = [
    "saves",
    "prevents",
    "proves",
    "guarantees",
    "certifies safe",
    "real-world impact",
    "production-ready",
    "deployable",
    "state-of-the-art",
    "100% safe",
    "zero false positives",
    "unbreakable guardrail",
    "perfect policy",
]

HONESTY_TAGS = ["REAL-DATA", "SIMULATED", "ASSUMPTION"]

# Non-ASCII characters escaped per project rules: \u20b9 (Rupee), \u00b1 (Plus-Minus)
MONEY_PATTERN = re.compile(r"[\$\u20b9\u00b1]\s*\d+")
UNIT_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\s*(?:%|lakh\b|crore\b|cr\b|L\b)", re.IGNORECASE)

BANNED_REGEXES = [
    (phrase, re.compile(rf"\b{re.escape(phrase)}\b", re.IGNORECASE)) for phrase in BANNED_PHRASES
]
STOPS_REGEX = re.compile(r"\bstops\b", re.IGNORECASE)
STOPS_CONTEXT_REGEX = re.compile(r"\b(?:fraud|loss|money)\b", re.IGNORECASE)


def _collect_files(root_path: Path) -> list[Path]:
    """Collect only files within the authorized scan scope."""
    collected: list[Path] = []

    # If root_path itself is a file, handle directly
    if root_path.is_file():
        return [root_path]

    # 1. README.md
    readme = root_path / "README.md"
    if readme.is_file():
        collected.append(readme)

    # 2. docs/ (exclude HONESTY.md, phases/, decisions/)
    docs_dir = root_path / "docs"
    if docs_dir.is_dir():
        for p in docs_dir.rglob("*"):
            if not p.is_file():
                continue
            rel_parts = p.relative_to(docs_dir).parts
            if p.name == "HONESTY.md":
                continue
            if any(part in ("phases", "decisions") for part in rel_parts):
                continue
            collected.append(p)

    # 3. reports/generated/
    reports_gen = root_path / "reports" / "generated"
    if reports_gen.is_dir():
        for p in reports_gen.rglob("*"):
            if p.is_file():
                collected.append(p)

    # 4. dashboard/app/
    dashboard_app = root_path / "dashboard" / "app"
    if dashboard_app.is_dir():
        for p in dashboard_app.rglob("*"):
            if p.is_file():
                collected.append(p)

    # 5. packs/*/LIMITS.md
    packs_dir = root_path / "packs"
    if packs_dir.is_dir():
        for limits in packs_dir.glob("*/LIMITS.md"):
            if limits.is_file():
                collected.append(limits)

    return collected


def scan(root: Path | str = ".") -> list[str]:
    """Scan authorized paths and return a list of violation descriptions."""
    root_path = Path(root)
    violations: list[str] = []

    files = _collect_files(root_path)

    for file_path in files:
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as exc:
            violations.append(f"Unreadable file: {file_path} ({exc})")
            continue

        for line_no, line in enumerate(content.splitlines(), start=1):
            # Check banned phrases with word boundaries
            for phrase, regex in BANNED_REGEXES:
                if regex.search(line):
                    violations.append(
                        f"Banned phrase '{phrase}' in {file_path}:{line_no}: {line.strip()}"
                    )

            # Special check for 'stops': flag only if line also contains fraud, loss, or money
            if STOPS_REGEX.search(line) and STOPS_CONTEXT_REGEX.search(line):
                violations.append(
                    f"Banned phrase 'stops' with fraud/loss/money context in {file_path}:{line_no}: {line.strip()}"
                )

            # Check untagged money or units
            has_money = MONEY_PATTERN.search(line)
            has_unit = UNIT_PATTERN.search(line)
            if has_money or has_unit:
                has_tag = any(tag in line for tag in HONESTY_TAGS)
                if not has_tag:
                    violations.append(f"Untagged figure in {file_path}:{line_no}: {line.strip()}")

    return violations


def main() -> int:
    """CLI entrypoint for standalone banned phrase checks."""
    violations = scan(".")
    if violations:
        print(
            f"Banned phrases / untagged figures check failed with {len(violations)} violation(s):"
        )
        for v in violations:
            print(f"  - {v}")
        return 1
    print("Banned phrases and figures check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
