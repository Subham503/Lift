"""Developer automation script for Lift.

Targets:
  install      - Install package and dev dependencies
  lint         - Run ruff linter and format checks
  types        - Run mypy type checker
  test         - Run all test suites
  guard        - Check banned phrases and untagged figures via scripts.check_banned_phrases
  phase0-check - Run lint, types, guard, unit tests, invariants junitxml check, and hash verification
  check        - Alias for phase0-check
"""

import argparse
import hashlib
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

# Ensure scripts directory is importable
scripts_dir = Path(__file__).resolve().parent
if str(scripts_dir) not in sys.path:
    sys.path.insert(0, str(scripts_dir))
if str(scripts_dir.parent) not in sys.path:
    sys.path.insert(0, str(scripts_dir.parent))

try:
    from scripts.check_banned_phrases import scan
except ImportError:
    from check_banned_phrases import scan  # type: ignore[no-redef]


def target_install() -> int:
    """Install package and dev dependencies in editable mode."""
    cmd = [sys.executable, "-m", "pip", "install", "-e", ".[dev]"]
    print(f"Running: {' '.join(cmd)}")
    return subprocess.run(cmd).returncode


def target_lint() -> int:
    """Run ruff linting and formatting checks."""
    print("Running ruff lint and format checks...")
    r1 = subprocess.run([sys.executable, "-m", "ruff", "check", "."]).returncode
    if r1 != 0:
        return r1
    r2 = subprocess.run([sys.executable, "-m", "ruff", "format", "--check", "."]).returncode
    return r2


def target_types() -> int:
    """Run mypy static type checking."""
    print("Running mypy...")
    cmd = [sys.executable, "-m", "mypy", "core", "packs", "tests"]
    return subprocess.run(cmd).returncode


def target_guard() -> int:
    """Run banned phrases and untagged figures scanner."""
    print("Running guard check via check_banned_phrases.scan...")
    violations = scan(".")
    if violations:
        print(f"Guard check failed with {len(violations)} violation(s):")
        for v in violations:
            print(f"  - {v}")
        return 1
    print("Guard check passed: no violations detected.")
    return 0


def target_unit_tests() -> int:
    """Run unit and integration tests (must pass)."""
    print("Running unit and integration tests...")
    cmd = [sys.executable, "-m", "pytest", "tests/unit", "tests/integration", "-v"]
    return subprocess.run(cmd).returncode


def target_test() -> int:
    """Run all tests."""
    print("Running all test suites...")
    cmd = [sys.executable, "-m", "pytest", "tests/", "-v"]
    return subprocess.run(cmd).returncode


def _verify_frozen_hashes() -> bool:
    """Verify SHA256 hashes of frozen files against FROZEN.sha256."""
    frozen_file = Path("FROZEN.sha256")
    if not frozen_file.exists():
        print("ERROR: FROZEN.sha256 not found.")
        return False

    lines = [
        line.strip()
        for line in frozen_file.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    all_matched = True
    for line in lines:
        parts = line.split(maxsplit=1)
        if len(parts) != 2:
            continue
        expected_hash, rel_path = parts[0].strip().upper(), parts[1].strip()
        target = Path(rel_path)
        if not target.exists():
            print(f"ERROR: Frozen file not found: {rel_path}")
            all_matched = False
            continue

        raw = target.read_text(encoding="utf-8")
        normalized = raw.replace("\r\n", "\n").rstrip("\r\n")
        actual_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest().upper()

        if actual_hash != expected_hash:
            print(f"FAIL: {rel_path} SHA256 mismatch!")
            print(f"  Expected: {expected_hash}")
            print(f"  Actual:   {actual_hash}")
            all_matched = False
        else:
            print(f"OK:   {rel_path} matches {expected_hash[:12]}...")

    return all_matched


def target_phase0_check() -> int:
    """Execute phase0 verification in strict order.

    Order:
      1. lint
      2. types
      3. guard
      4. unit tests (tests/unit and tests/integration)
      5. invariant tests with --junitxml (must be exactly 11 failed, 0 passed, 0 skipped, 0 errors, with NotImplementedError)
      6. frozen files SHA256 hash check
    """
    # Stage 1: Lint
    print("\n=== Stage 1: Lint ===")
    code = target_lint()
    if code != 0:
        print(f"Stage 1 (Lint) failed with exit code {code}.")
        return code
    print("Stage 1 (Lint) passed.")

    # Stage 2: Types
    print("\n=== Stage 2: Types ===")
    code = target_types()
    if code != 0:
        print(f"Stage 2 (Types) failed with exit code {code}.")
        return code
    print("Stage 2 (Types) passed.")

    # Stage 3: Guard
    print("\n=== Stage 3: Guard ===")
    code = target_guard()
    if code != 0:
        print(f"Stage 3 (Guard) failed with exit code {code}.")
        return code
    print("Stage 3 (Guard) passed.")

    # Stage 4: Unit tests
    print("\n=== Stage 4: Unit Tests (tests/unit, tests/integration) ===")
    code = target_unit_tests()
    if code != 0:
        print(f"Stage 4 (Unit tests) failed with exit code {code}.")
        return code
    print("Stage 4 (Unit tests) passed.")

    # Stage 5: Invariant tests with --junitxml
    print("\n=== Stage 5: Invariant Tests with JUnit XML ===")
    junit_xml = Path("reports") / "junit_invariants.xml"
    junit_xml.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "tests/invariants",
        "-v",
        f"--junitxml={junit_xml}",
    ]
    # Invariant tests must fail with NotImplementedError; pytest command will have non-zero exit code
    subprocess.run(cmd)

    if not junit_xml.exists():
        print(f"ERROR: JUnit XML report not generated at {junit_xml}")
        return 1

    try:
        tree = ET.parse(junit_xml)
        root = tree.getroot()
        testcases = root.findall(".//testcase")
    except Exception as exc:
        print(f"ERROR: Failed to parse JUnit XML report: {exc}")
        return 1

    total = len(testcases)
    failures = 0
    passed = 0
    skipped = 0
    errors = 0
    all_not_implemented = True

    for tc in testcases:
        tc_name = tc.attrib.get("name", "unknown")
        fail = tc.find("failure")
        err = tc.find("error")
        skip = tc.find("skipped")

        if skip is not None:
            skipped += 1
            print(f"UNEXPECTED: Test {tc_name} was skipped.")
        elif err is not None:
            errors += 1
            print(f"UNEXPECTED: Test {tc_name} had error instead of failure.")
        elif fail is not None:
            failures += 1
            fail_text = (fail.text or "") + " " + (fail.attrib.get("message") or "")
            if "NotImplementedError" not in fail_text:
                print(f"UNEXPECTED: Test {tc_name} failed without NotImplementedError.")
                all_not_implemented = False
        else:
            passed += 1
            print(f"UNEXPECTED: Test {tc_name} passed.")

    print(
        f"Invariant tests tally: total={total}, failures={failures}, passed={passed}, skipped={skipped}, errors={errors}"
    )

    if total != 11 or failures != 11 or passed != 0 or skipped != 0 or errors != 0:
        print(
            f"FAIL: Invariant tests requirement not met (expected exactly 11 failed, 0 passed, 0 skipped, 0 errors; got {failures} failed, {passed} passed, {skipped} skipped, {errors} errors)."
        )
        return 1

    if not all_not_implemented:
        print("FAIL: One or more invariant test failures did not contain 'NotImplementedError'.")
        return 1

    print("Stage 5 (Invariant tests: exactly 11 failed with NotImplementedError) passed.")

    # Stage 6: Hash check
    print("\n=== Stage 6: Frozen Files Hash Verification ===")
    if not _verify_frozen_hashes():
        print("FAIL: Frozen files SHA256 integrity check failed.")
        return 1
    print("Stage 6 (Frozen files hash verification) passed.")

    print("\nPhase 0 acceptance check passed: all 6 stages succeeded.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Lift dev automation")
    parser.add_argument(
        "target",
        choices=["install", "lint", "types", "test", "guard", "check", "phase0-check"],
        help="Command target to execute",
    )
    args = parser.parse_args()

    dispatch = {
        "install": target_install,
        "lint": target_lint,
        "types": target_types,
        "test": target_test,
        "guard": target_guard,
        "phase0-check": target_phase0_check,
        "check": target_phase0_check,
    }

    exit_code = dispatch[args.target]()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
