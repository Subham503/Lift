## 0. Approved fix list (owner-approved)
This list overrides AGENTS.md section 3 "never delete tests" for the files named here only.

DELETE
- reports/generated/payments_fraud/REPORT.md
- reports/phases/PHASE_00_REPORT.md
- docs/phases/PHASE_01.md
- packs/payments_fraud/data/download.py   (duplicate of scripts/download_data.py)
- tests/unit/test_audit.py, test_eval.py, test_sim.py
- packs/_template/tests/test_pack.py, packs/payments_fraud/tests/test_fraud_pack.py
  (they test behaviour that Phase 0 removes; they return with the phase that builds it)

REWRITE
- README.md: title, one sentence, "Results: not yet measured.", a Status table
  (feature | status: Planned, phase XX), quickstart, license. No benchmark table. No
  "cryptographically", "compile-time", "counterfactual", "guarantees". Badge: Python 3.12+.
- dashboard/app/page.tsx: every value shown as "—". Remove all hardcoded text with numbers.
- .gitignore: change `lib/` to `/lib/` and `lib64/` to `/lib64/` (they hide dashboard/lib).
- pyproject.toml:
  requires-python ">=3.12"; classifiers 3.12 and 3.13; ruff target py312, select E,F,I,UP,B;
  author "Subham"; neutral description; runtime deps ONLY numpy, pydantic, pyyaml, typer, jinja2
  (pandas, scikit-learn, xgboost, shap are added in the model phase; this amends section 1);
  dev deps pytest, ruff, mypy; remove rich, scipy, pytest-cov.
- Add __init__.py to core/, packs/, packs/_template/, packs/payments_fraud/ so install works.

STUB EVERYTHING ELSE
- Keep only data types with no behaviour: Observable, Hidden, Action, Outcome, Verdict,
  VerdictType (frozen dataclasses / enums).
- Every function and method body raises NotImplementedError("phase XX").
- Required names and signatures (match core/RULES.md):
  RngStreams(seed:int).stream(name:str) -> numpy Generator
  Policy.decide(obs: Observable) -> Action        (rename predict -> decide)
  Guardrail.evaluate(action, obs, now: datetime) -> Verdict
  resolve(action, hidden, rng) -> Outcome
  AuditStore(path).append(event) / read_all()
  paired_bootstrap_ci(diffs, n_resamples=10_000, seed) -> (mean, lo, hi)
- Replace core/cli/main.py bodies, pack policies, scenarios, features, guardrails,
  scripts/download_data.py the same way. Do not keep their current logic.

TESTS
- Replace tests/invariants/test_invariants.py entirely: the 11 names from core/RULES.md
  section 12, real assertions, each fails with NotImplementedError. Old tests are discarded.
- Keep tests/integration/test_cli.py only if rewritten to expect exit code 2 and
  "not implemented".

ADD
- scripts/dev.py with targets install, lint, types, test, guard, check, phase0-check
  (Windows has no make). The Makefile stays for CI.
- FROZEN.sha256 with these hashes (normalise CRLF to LF and strip trailing newlines first):
  EB3C3C536C45D473031C9C02D8E17BD9AB90D7AA6166AF80778ECCC250930AAD  AGENTS.md
  7161DC38213A7FFF3ABAA01B7B51F7BDBB9FE4625639300ED42E9077940447E5  core/RULES.md
  50481C49F5E358DD4276FFA012D5B449D4661A0B94740FCEAEEA9DC51BB4A51E  docs/HONESTY.md
  phase0-check fails if any hash differs.
- Guard also flags unit-less money: `$`, `₹`, `±` followed by a number, without a tag
  (REAL-DATA / SIMULATED / ASSUMPTION), in README, reports/generated, dashboard/app.