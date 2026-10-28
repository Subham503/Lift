# Lift

[![CI](https://github.com/Subham503/Lift/actions/workflows/ci.yml/badge.svg)](https://github.com/Subham503/Lift/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](pyproject.toml)
![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange.svg)

> Don't trust AI decisions. Measure them.

Lift is an open-source toolkit for testing decision policies, such as fraud flagging, against a do-nothing baseline and a tuned rules baseline. Every policy sees the same simulated events. Lift reports the measured difference with confidence intervals, the harm done to good customers, and the limits of the result.

**Status: pre-alpha.** The tooling and the rules are in place. The simulator and the first pack are not built yet, so there are no results to show.

## Why Lift exists

Many AI demos report model accuracy and stop there. A decision system needs more: better than what, at what cost to innocent users, and does it hold up under stress. Lift makes those questions the default output, not an afterthought.

## Results

No results yet.

When the first run exists, this section will show the headline lift with its confidence interval, the harm measured next to it, and the exact command to reproduce it. Every number will carry one tag: `REAL-DATA`, `SIMULATED`, or `ASSUMPTION`.

## How it will work

```
scenario -> simulator -> policy proposes action -> guardrails may veto
         -> outcome from hidden truth -> audit log -> report
```

- Policies see only observable state. Ground truth stays hidden from them.
- Every policy runs on identical event batches, with fixed seeds.
- Policies compared: do-nothing baseline, tuned rules, learned model, and an oracle used only as a ceiling.
- Benefit is always shown next to harm: wrongly blocked customers, friction, review load, and the worst-off group.

This is the design. Items are marked in the status table as they are built.

## Status

| Area | Status |
| :--- | :--- |
| Lint, type checks, CI workflow | Configured |
| Frozen rule files with hash verification | Done |
| Guard for banned claims and untagged figures | Done, with unit tests |
| CLI skeleton (`lift --help`) | Done, commands exit with "not implemented" |
| Invariant tests | Written, failing by design until implemented |
| Simulator, RNG streams, guardrails, audit log, bootstrap | Next |
| Payments fraud pack | Planned |
| Harm and fairness slices | Planned |
| Local dashboard | Planned |
| Second pack (logistics) | Planned |

## Design rules

The project is built under written rules that the code and tests must follow:

- [`core/RULES.md`](core/RULES.md): engine invariants, each backed by a test.
- [`docs/HONESTY.md`](docs/HONESTY.md): tagging, harm reporting, banned claims, and limits files.
- [`AGENTS.md`](AGENTS.md): how contributors and coding agents work, phase by phase.

These three files are frozen. A hash check fails the build if they change.

Lift measures decisions inside simulations and public datasets. A simulated result is not evidence of a real deployment outcome. Each pack will ship a `LIMITS.md` that says what is real, what is simulated, and what evidence is still missing.

## Quickstart

Requires Python 3.12 or newer.

Windows (PowerShell):

```powershell
git clone https://github.com/Subham503/Lift.git
cd Lift
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

Linux or macOS:

```bash
git clone https://github.com/Subham503/Lift.git
cd Lift
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Run the checks:

```bash
lift --help
python scripts/dev.py phase0-check
```

Expected today: lint, types, guard, and unit tests pass. The invariant stage reports 11 failed tests. That is the intended red baseline, and the stage passes only when exactly those 11 fail with `NotImplementedError`.

## Repository layout

```
core/        engine: sim, policies, guardrails, eval, audit, report, cli
packs/       domain packs, plus a template for new ones
dashboard/   local results viewer (reads result files only)
docs/        honesty rules, architecture, phase plans
reports/     phase reports and generated evaluation reports
tests/       invariants, unit, integration
scripts/     dev runner and the claim guard
```

## Contributing

The project is at an early stage and the engine is still moving. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and the design rules above first. Packs, policies, and scenarios are planned as the main contribution points once the core is stable.

## License

Distributed under the [MIT License](LICENSE).