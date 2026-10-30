# PHASE_01 — Engine core, 11 invariants green

Planner draft 2. Written against the real Phase 0 code (stubs and `scripts/dev.py` pasted by owner).
Agent: read `AGENTS.md`, `core/RULES.md`, `docs/HONESTY.md` first. Frozen. Never edit.
Do only what this file lists. Finish. Write report. STOP.

Phase 0 base commit: `2956cb8ad5bc94a864cb8ef2c6af2f80ee7e681e`.

---

## 0. Gates

| Gate | Status | Note |
|---|---|---|
| G1 veto test contradiction | CLEARED. Commit `0828be7`. Diff verified: 3 lines. | Section 1. |
| G2 Python 3.13.5 local, CI 3.12, AGENTS.md says 3.12 | Accepted | Pins must install on BOTH 3.12 and 3.13. See 7. |
| G3 baseline | CLEARED. `phase0-check` raw output seen: 6 stages pass, 13 unit/integration pass, 11 invariants fail with `NotImplementedError`, 3 frozen hashes OK. | |
| G4 pins | OPEN | Owner pastes pip output after install. Section 7. Only `pytest 9.1.1` seen so far. |

Agent: if G4 not stated cleared by owner, do everything except the pin edit. Write `BLOCKED: pins` for that item only.

---

## 1. G1 record

`test_guardrail_veto_cannot_be_bypassed` and `test_safe_default_never_vetoed` contradicted each other on a proposed `ALLOW`. RULES 7: `ALLOW` / `GIVE_UP` can never be vetoed. Veto test now proposes `BLOCK`. Deviation, listed in report.

---

## 2. Phase map (stub contract)

Every `raise NotImplementedError(...)` left in `core/`, `packs/`, `scripts/` after this phase must read exactly:

```
NOT IMPLEMENTED: <qualname> (planned PHASE_0N)
```

`<qualname>` = enclosing def as `Class.method` or `function`.

| Phase | Theme | Area |
|---|---|---|
| PHASE_01 | Engine core, 11 invariants | `core/sim`, `core/audit`, `core/guardrails`, `core/policies` base, `core/eval` bootstrap + harness, minimal report |
| PHASE_02 | Eval layer | `harm`, `metrics`, `slices`, `sweeps`, scenario sweeps, worst scenario, `HARM FLAG`, label-randomisation test (RULES 2), legacy helpers |
| PHASE_03 | Policy layer | `oracle`, tuned `rules`, `ml_*`, share-of-achievable, guardrail + audit wiring in harness, concrete rails, `OVERRIDE` verdict |
| PHASE_04 | Report + CLI | full REPORT header (RULES 11), `lift report`, `lift check`, LIMITS validation |
| PHASE_05 | Payments pack | `packs/_template`, `packs/payments_fraud`, `scripts/download_data.py`, real-data command |
| PHASE_06 | Surface | dashboard, README per HONESTY 7, demo, external review |
| PHASE_07 | Second pack | `packs/logistics` |

Area rule enforced by test: `core/eval` → 2, `core/policies` → 3, `core/guardrails` → 3, `core/report` → 4, `packs/` → 5, `scripts/` → 5. Other paths: any of 2..7.
`core/cli` exempt. It writes "not implemented: phase 01" to stderr and exits 2. `tests/integration/test_cli.py` asserts it. Relabel in PHASE_04 with owner's test edit. See Q4.

Relabel plan (agent confirms against code):

| Stub | New label |
|---|---|
| `core/eval/harm.py`, `metrics.py`, `slices.py`, `sweeps.py` | PHASE_02 |
| `core/eval/bootstrap.py::bootstrap_ci` (legacy) | PHASE_02 |
| `core/sim/rng.py::SeededRNG` (legacy) | PHASE_02 |
| `core/sim/world.py::World` | PHASE_02 |
| `EvalHarness.__init__` when `guardrail` or `audit_store` is passed | PHASE_03 |
| `packs/_template/*`, `packs/payments_fraud/*`, `scripts/download_data.py` | PHASE_05 |

---

## 3. Run protocol (agent cannot run Python)

1. Agent writes files. Never claims a command ran.
2. Owner runs commands with `--log`. Logs go to `reports/phases/raw/PHASE_01/`.
3. Failure: owner pastes raw output to agent unedited. Agent fixes. Repeat.
4. Report copies raw logs verbatim. No log → `NOT RUN`.
5. `make check` in AGENTS.md means `python scripts/dev.py check`. Declared deviation. Makefile exists, make does not on this machine.

---

## 4. Scope

In:
- sim core: canonical bytes, named RNG streams, `resolve`, one concrete toy scenario
- `DoNothingPolicy`, one reference policy for engine self-test
- `apply_guardrails`
- audit store
- `evaluate_lift` (paired bootstrap)
- harness: paired batches, digests, lift + attribution
- minimal `generate_report` (`test_report_matches_fresh_run` needs it)
- 11 invariants green
- hardening tests, one mutant per invariant, mutant runner
- pins, `dev.py` changes, smoke script, stub relabel

Out: packs logic, sweeps, harm, slices, oracle / rules / ml, guardrail + audit wiring in harness, full REPORT header, CLI, dashboard, real data.

README and the earlier Antigravity summary list `harness.py` and `generate_report` under later phases. The 11 tests import both. They land here.

### 4a. Retire the Phase 0 red baseline

Today `check` is an alias of `phase0-check`. Stage 5 passes only when EXACTLY 11 invariants fail with `NotImplementedError`. After this phase it fails by design. Agent, in `scripts/dev.py`:

1. Keep stages 1-4 and 6 (lint, types, guard, unit+integration, frozen hash).
2. Flip stage 5. Same junit parse. Pass only if `total == 11`, `passed == 11`, `failures == errors == skipped == 0`.
3. Remove `phase0-check` from `choices`, dispatch, docstring. `check` becomes the real target.
4. Add stage 7: `mutants`.
5. Add targets `mutants`, `smoke`. Add `--log` (section 8). `lint`, `types`, `test`, `guard`, `install` already exist. Keep them.
6. Makefile: `check` runs `python scripts/dev.py check`. Remove `phase0-check` from `.PHONY` and `help`. Add `mutants`.
7. `.github/workflows/ci.yml` (Python 3.12, ubuntu): delete steps "Unit tests" and "phase0 red baseline". Add step `python scripts/dev.py check`. Keep Lint, Types, Guard steps.
8. README: edit ONLY the Quickstart check command and the invariant status row. Full rewrite = PHASE_06. Guard scans README: no banned phrases, every figure tagged.

All new code passes `ruff format --check` (line-length 100, rules E, F, I, UP, B). mypy runs `mypy core packs tests` with no flags and no `[tool.mypy]`. `scripts/` is not type-checked.

---

## 5. Signature contract

Existing Phase 0 names, fields and import paths WIN. Add; do not rename. Every change goes in the report under Deviations.

| Symbol | Contract |
|---|---|
| `core.sim.types.Observable` | existing: `(id: str, features: dict[str, Any])`. Frozen. |
| `core.sim.types.Hidden` | existing: `(is_positive: bool, true_label: Any, metadata: dict[str, Any])`. Frozen. |
| `core.sim.types.Action` | existing: `(decision: str, confidence: float = 1.0, metadata: dict \| None = None)`. Add `__post_init__`: confidence outside `[0, 1]` → `ValueError`. Do NOT restrict `decision` strings (later phases add step-up, review). |
| `core.sim.types.Outcome` | existing: `(actual_loss=0.0, counterfactual_loss=0.0, details=None)`. ADD `false_block_amount: float = 0.0`. No label field, ever. |
| `core.sim.types` | ADD `SAFE_DEFAULTS = frozenset({"ALLOW", "GIVE_UP"})`, `SUPPORTED_DECISIONS = frozenset({"ALLOW", "BLOCK", "GIVE_UP"})`. |
| `core.sim.rng.RngStreams` | `RngStreams(seed: int)`, `.stream(name: str) -> np.random.Generator` |
| `core.sim.scenarios.Scenario` | existing ABC `(name: str, seed: int)`, abstract `generate() -> Generator[tuple[Observable, Hidden], None, None]`. ADD non-abstract `reseeded(seed) -> Scenario` = `type(self)(self.name, seed)`. |
| `core.sim.world.resolve` | `(action: Action, hidden: Hidden, rng: np.random.Generator) -> Outcome` |
| `core.policies.base.Policy` | existing ABC `__init__(name="base")`, abstract `decide(obs: Observable) -> Action`. ADD `require_observable(obj: object) -> Observable`. |
| `core.policies.do_nothing.DoNothingPolicy` | `DoNothingPolicy()`, `.decide(obs: Observable) -> Action` |
| `core.guardrails.verdict` | existing `VerdictType {ALLOW, BLOCK, OVERRIDE}` (StrEnum), `Verdict(verdict, reason, modified_action: Action \| None = None, metadata=None)`, `GuardedDecision(final: Action, verdicts: list[Verdict])`. |
| `core.guardrails.base` | existing `Guardrail(name="base")` ABC. `apply_guardrails(proposed: Action, rails: list[Any], obs: Observable, now: datetime) -> GuardedDecision`. NO `**kwargs`, NO `*args`. |
| `core.audit.store.AuditStore` | existing `AuditStore(path: Path \| str)`, `.append(event: dict[str, Any]) -> None`, `.read_all() -> list[dict[str, Any]]` |
| `core.eval.bootstrap` | existing `LiftResult(mean, lo, hi, n_seeds, underpowered)`, `paired_bootstrap_ci(diffs, n_resamples=10_000, seed=42) -> tuple[float, float, float]`, `evaluate_lift(diffs: list[float], n_resamples: int = 10_000, seed: int = 42) -> LiftResult` |
| `core.eval.harness.EvalHarness` | existing `EvalHarness(policy=None, guardrail=None, scenario=None, audit_store=None)`. ADD keyword-only `config: HarnessConfig \| None = None`. `.run(policy: Any \| None = None, seed: int = 42) -> RunResult`, `.generate_paired_batches(seed) -> tuple[list[Any], list[Any]]`, `.compute_lift_and_attribution(seed: int) -> tuple[float, float]` |
| `core.eval.harness.RunResult` | existing `(events_digest: str, records: list[dict[str, Any]])`. ADD fields: `seed`, `policy_name`, `n_events`, `results_digest`, `total_loss`, `false_block_total`, `metric`. Frozen. |
| `core.report.generate.generate_report` | existing `(results: dict[str, Any], output_path: Path, *, generated_at: datetime \| None = None) -> Path` |

Test doubles (`BlockAllPolicy`, `StrictRail`) do NOT subclass `Policy` / `Guardrail`. `run` takes `Any`, `rails` is `list[Any]`. Keep it that way.

---

## 6. Items

Dataclasses stay as in Phase 0 (`@dataclass(frozen=True)`). Type hints on every public function. Ruff clean. Abstract methods lose their `raise NotImplementedError`; docstring body only.

### P1-01 types — `core/sim/types.py`
Section 5 additions only. `GIVE_UP` = policy declines to act. Outcome-wise same as `ALLOW`. Audit keeps them distinct.

### P1-02 canonical bytes — `core/sim/canon.py` (new)
- `canonical_bytes(obj) -> bytes`: `json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False)`, UTF-8. numpy scalars → `float` / `int`. Dataclasses via `dataclasses.asdict`.
- `sha256_hex(data: bytes) -> str`.
- NaN or inf → `ValueError`.

### P1-03 RNG — `core/sim/rng.py`
- `RngStreams(seed)`: seed must be `int`, not `bool`, `>= 0`. Else `TypeError` / `ValueError`.
- `.stream(name)`: non-empty `str`. Cached. Same name → same Generator object.
- Key: `int.from_bytes(hashlib.sha256(name.encode("utf-8")).digest()[:8], "big")`. Generator: `np.random.Generator(np.random.PCG64(np.random.SeedSequence(entropy=seed, spawn_key=(key,))))`.
- NEVER Python `hash()` (varies with `PYTHONHASHSEED`). NEVER global `random`, `np.random.seed`, legacy `np.random.rand*`.
- `STREAM_NAMES = ("arrivals", "amounts", "fraud_injection", "outcomes", "noise")`. Not enforced. Tests also use `"actions"`.
- `SeededRNG` (legacy): keep, relabel PHASE_02.

### P1-04 scenario + resolve — `core/sim/scenarios.py`, `core/sim/world.py`
`Scenario.__init__(name, seed)`: store `self.name`, `self.seed`.

`WorldConfig` (frozen, in `scenarios.py`). Defaults are ASSUMPTION. Tag in report:

| Field | Default |
|---|---|
| `n_events` | 1000 |
| `fraud_rate` | 0.05 |
| `amount_log_mean` | 4.0 |
| `amount_log_sigma` | 0.6 |
| `fraud_amount_multiplier` | 4.0 |
| `mean_gap_seconds` | 30.0 |

`ToyScenario(Scenario)`: `__init__(name, seed, cfg: WorldConfig | None = None)`. Override `reseeded` to keep `cfg`. `generate()`:
- `streams = RngStreams(self.seed)`.
- `arrivals`: `exponential(mean_gap, size=n)`, `t = cumsum`.
- `amounts`: `lognormal(mean, sigma, size=n)`.
- `fraud_injection`: `uniform(size=n)`; positive if `u < fraud_rate`; amount × multiplier if positive.
- Every draw vectorised for all n events. Used or not. Never conditional. Never policy dependent.
- Yields `(Observable(id=f"tx_{i:06d}", features={"amount": a, "t": t}), Hidden(is_positive, true_label="fraud" or "legit", metadata={"amount": a}))`. Python `float`.

`resolve(action, hidden, rng)`:
- FIRST statement: `rng.uniform()`. Always. Exactly one draw. Unused this phase. Never skip on any branch.
- Reads only `hidden.is_positive` and `hidden.metadata["amount"]`. NEVER `true_label`. Missing amount → `KeyError`.
- Decision not in `SUPPORTED_DECISIONS` → `ValueError` (after the draw).
- `counterfactual_loss` = loss had the action been `ALLOW`.

| decision | `is_positive` | `actual_loss` | `counterfactual_loss` | `false_block_amount` |
|---|---|---|---|---|
| ALLOW / GIVE_UP | True | amount | amount | 0.0 |
| ALLOW / GIVE_UP | False | 0.0 | 0.0 | 0.0 |
| BLOCK | True | 0.0 | amount | 0.0 |
| BLOCK | False | 0.0 | 0.0 | amount |

`details` stays `None`. Docstring states the one documented precondition: a positive let through causes loss = amount. `is_positive` is the only label-like field read. See Q2.
`World` stub: relabel PHASE_02.

### P1-05 policies — `core/policies/`
- `base.py`: `Policy.__init__(name)` stores `self.name`. `require_observable(obj)`: non-`Observable` → `TypeError`.
- `do_nothing.py`: `__init__` calls `super().__init__("do_nothing")`. `decide` calls `require_observable`, returns `Action("ALLOW", 0.0)`.
- `reference.py` (new): `ReferenceThresholdPolicy(threshold: float = 150.0)`. `amount >= threshold` → `Action("BLOCK", 1.0)`, else `Action("ALLOW", 0.0)`. Observable only. Docstring: engine self-test fixture. Never a pack policy. Never a competitor.

### P1-06 guardrails — `core/guardrails/`
- `Guardrail.__init__(name)` stores `self.name`.
- `Verdict.__post_init__`: `reason` non-empty. `modified_action` set and its decision not in `SAFE_DEFAULTS` → `ValueError`.
- `apply_guardrails`:
  1. `now` naive → `ValueError`.
  2. Evaluate EVERY rail, in order. No short circuit. `verdicts` = list of all.
  3. Any verdict of type `OVERRIDE` → `ValueError("OVERRIDE unsupported until PHASE_03")`.
  4. Veto = any `VerdictType.BLOCK`.
  5. Veto and `proposed.decision` not in `SAFE_DEFAULTS`: `final = first veto's modified_action`, else `Action("GIVE_UP", 0.0)`.
  6. Else `final = proposed`. Ignored vetoes stay in `verdicts`.
- No clock, DB, network, file IO inside `core/guardrails/`.

### P1-07 audit — `core/audit/store.py`
- `__init__`: create parent dirs. Do not create or truncate the file.
- `append`: serialise FIRST (`canonical_bytes` + `b"\n"`). Unserialisable → `TypeError`, file untouched. Then open `"ab"`, write, flush, `os.fsync`.
- `read_all`, `path` property.
- Public names exactly `{append, read_all, path}`. No update, delete, truncate, clear, rewrite.
- Bytes only. Text mode would turn `\n` into `\r\n` on Windows.

### P1-08 eval — `core/eval/`
`bootstrap.py`:
- `MIN_SEEDS: Final[int] = 20`. `underpowered = n_seeds < MIN_SEEDS`, read as module global at call time (mutant M10 patches it).
- `paired_bootstrap_ci`: `rng = np.random.default_rng(seed)`; `idx = rng.integers(0, n, size=(n_resamples, n))`; `means = diffs[idx].mean(axis=1)`; `lo, hi = np.percentile(means, [2.5, 97.5])`; `mean = float(np.mean(diffs))`. Percentile method. NEVER a t-interval.
- `evaluate_lift` calls it, fills `LiftResult`.
- Empty diffs, NaN, inf, `n_resamples < 1` → `ValueError`.
- `bootstrap_ci` (legacy): relabel PHASE_02.

`digest.py` (new): `events_digest(events: Iterable[tuple[Observable, Hidden]]) -> str`: sha256 of canonical bytes, in order. Policy, action, outcome NEVER enter it.

`attribution.py` (new): `attributed_benefit(records: list[dict[str, Any]]) -> float` = `math.fsum(max(r["counterfactual_loss"] - r["actual_loss"], 0.0) for r in records)`. Computed from one run's own records. Harm excluded by design. Benefit that would have arrived anyway never counted.

`harness.py`:
- `HarnessConfig` (frozen): `false_block_cost_rate = 0.1`, `candidate_threshold = 150.0`, `bootstrap_seed = 1729`. All ASSUMPTION.
- `__init__`: `guardrail` or `audit_store` not `None` → `raise NotImplementedError("NOT IMPLEMENTED: EvalHarness.__init__ (planned PHASE_03)")`. Else store. Default scenario = `ToyScenario("toy", 0)`. Default config = `HarnessConfig()`.
- `generate_paired_batches(seed)`: two INDEPENDENT calls of `self.scenario.reseeded(seed).generate()`, each into a list. Returns both.
- `run(policy=None, seed=42)`: policy `None` → `self.policy` → else `DoNothingPolicy()`. Generates events (before any policy call), `events_digest`, then loop: `policy.decide(observable)` (Observable only) → `resolve(action, hidden, streams.stream("outcomes"))` with `streams = RngStreams(seed)`. Record dict keys: `id`, `decision`, `actual_loss`, `counterfactual_loss`, `false_block_amount`. `policy_name = getattr(policy, "name", None) or type(policy).__name__`. `metric = -(fsum(actual_loss) + false_block_cost_rate * fsum(false_block_amount))`. `results_digest` covers `events_digest`, `policy_name`, every record.
- `compute_lift_and_attribution(seed)`: `a, b = generate_paired_batches(seed)`. Digest of `a` != digest of `b` → `RuntimeError`. Baseline = `DoNothingPolicy` on `a`. Candidate = `self.policy` or `ReferenceThresholdPolicy(config.candidate_threshold)` on `b`. `lift = candidate.metric - baseline.metric`. `attributed = attributed_benefit(candidate.records)`. Return `(lift, attributed)`.
- Both routes read `resolve`. Independent aggregation, not independent simulator. Report states it under Known limits.

### P1-09 report — `core/report/generate.py`
Text, LF only:

```
# Lift report
Generated at: <generated_at.isoformat()>
Status: PHASE_01 minimal generator. RULES 11 header fields land in PHASE_04.

## Results
<json.dumps(results, sort_keys=True, indent=2, ensure_ascii=True)>
```

- Exactly one line starts with `Generated at:`.
- `generated_at` naive → `ValueError`. `None` → `datetime.now(UTC)`. Only place a clock is allowed.
- `write_bytes`. Create parent dirs. Return `output_path`.

### P1-10 tooling: 4a, 7, 8.
### P1-11 hardening tests and P1-12 mutants: 9.
### P1-13 stub relabel: 2 and 9.
Before relabel, grep `tests/` for `phase 01`. A test asserting old text → question in report. Do not edit that test.

---

## 7. Pins and Python

Owner, in the venv, after `python -m pip install -e ".[dev]"`:

```powershell
python -m pip list --format=freeze | Select-String -Pattern "^(ruff|mypy|pytest|numpy)=="
```

Agent edits `pyproject.toml`: runtime `numpy>=1.26.0` → `numpy==<x>`. Dev `pytest`, `ruff`, `mypy` `>=` → `==<x>`. Versions from pasted output only. pydantic, pyyaml, typer, jinja2 stay unpinned.
numpy pinned because digests depend on its bit-stream. Stable only for the pinned numpy.
CI runs Python 3.12, local is 3.13.5. Pinned versions must install on both. If one does not: `BLOCKED:` with pip error.
pyproject already has `requires-python = ">=3.12"` and ruff `py312`. Keep. AGENTS.md "Python 3.12" is a wording difference. Listed in report. Only owner edits AGENTS.md.
Do not loosen ruff or mypy config. No new `# noqa` or `# type: ignore`.

---

## 8. `dev.py` changes

- `--log <path>`: parent re-executes itself without `--log` with `PYTHONUTF8=1`, merges stdout+stderr, tees to console and file. UTF-8, LF. First line `$ python scripts/dev.py <target>`. Last line `EXIT_CODE=<n>`. Same exit code. Works on every target.
- `mutants` → `scripts/run_mutants.py`. `smoke` → `scripts/phase01_smoke.py`. Add both to argparse `choices`.
- `check` per 4a. Includes `mutants`. Stricter than AGENTS.md. Declared.

`scripts/phase01_smoke.py`, seeds 0..19, default harness. Prints only (no timestamps, no paths, full float `repr`):

```
ASSUMPTION <name>=<value>                      # every WorldConfig and HarnessConfig field
SIMULATED seed=<s> lift=<x> attributed=<y> false_block_total=<z> events_digest=<first 16 hex>
SIMULATED evaluate_lift mean=<> lo=<> hi=<> n_seeds=<> underpowered=<> resamples=10000 bootstrap_seed=<>
```

---

## 9. New tests (red first, commit before implementation)

Why `tests/unit/`: `check` stage 4 runs `tests/unit` and `tests/integration` only. Top-level `tests/test_*.py` would not gate `check`.
Fail-first evidence: owner runs `python scripts/dev.py test` after the tests-only commit. Log `01_red_tests.txt`.

`tests/unit/test_phase01_hardening.py`

| Test | Asserts |
|---|---|
| `test_digests_stable_across_hashseed` | subprocess runs with `PYTHONHASHSEED=0` and `12345` give identical `events_digest` and `results_digest` for seed 7 |
| `test_same_seed_same_results_digest` | two in-process runs equal. DoNothing vs BlockAll: `events_digest` equal, `results_digest` differ |
| `test_digest_changes_with_config` | `ToyScenario` with `n_events=500` vs default → different `events_digest` |
| `test_resolve_consumes_exactly_one_draw` | all 3 decisions × both labels: generator state after `resolve` equals state after one `uniform()` on a twin. Unknown decision → `ValueError` AND still one draw |
| `test_streams_cached_and_independent` | same name → same object. Different names → different first draw. Bad name or seed → error |
| `test_scenario_reseeded` | same seed twice → identical lists. `reseeded(s)` keeps `cfg` |
| `test_default_candidate_nonvacuous` | seeds 0..4: `lift > 0`, `false_block_total > 0`, `attributed > lift` strictly |
| `test_harness_rejects_unwired_args` | `EvalHarness(guardrail=...)` and `EvalHarness(audit_store=...)` raise `NotImplementedError` whose text matches the stub format |
| `test_bootstrap_deterministic_and_bounded` | same call twice equal. `lo <= mean <= hi`. Constant diffs → `lo == hi == mean`. Empty / zero resamples → `ValueError` |
| `test_bootstrap_is_percentile_not_t` | diffs `[0.0]*19 + [100.0]`: `lo == 0.0`, `hi == 15.0`. Hand-derived from binomial(20, 1/20). If it fails, owner checks the derivation first |
| `test_audit_store_surface` | public names `== {append, read_all, path}`. Reopen → appends, no truncate. One `\n` per event. Unserialisable → `TypeError`, bytes unchanged |
| `test_guardrails_run_all_rails_in_order` | no short circuit. `BLOCK` veto uses `modified_action` if given, else `GIVE_UP`. Naive `now` → `ValueError`. `OVERRIDE` verdict → `ValueError`. Bad `modified_action` → `ValueError` |
| `test_policy_rejects_non_observable` | `dict`, `None`, `str`, `Hidden` → `TypeError` |
| `test_report_lf_only_and_tz_required` | no `b"\r"`. Naive datetime → `ValueError` |

`tests/unit/test_static_rules.py` (AST scans)

| Test | Asserts |
|---|---|
| `test_no_global_rng_in_core` | no `import random`, no `np.random.seed`, no legacy `np.random.<fn>` except `default_rng`, `Generator`, `SeedSequence`, `PCG64` |
| `test_core_offline` | no import of `socket`, `urllib`, `http`, `requests`, `httpx`, `aiohttp` in `core/` |
| `test_core_never_imports_packs` | no `import packs` / `from packs` in `core/` |
| `test_guardrails_pure` | no `datetime.now`, `utcnow`, `time.time`, `date.today`, `sqlite3`, `open(` in `core/guardrails/` |

`tests/unit/test_stub_messages.py`
- Every `raise NotImplementedError(...)` under `core/`, `packs/`, `scripts/`: string constant matching `^NOT IMPLEMENTED: ([A-Za-z_][\w.]*) \(planned PHASE_0([2-7])\)$`. Symbol equals enclosing qualname. Area rule from section 2. `core/cli` exempt.
- These qualnames must contain NO `raise NotImplementedError`: `RngStreams.__init__`, `RngStreams.stream`, `Scenario.__init__`, `ToyScenario.generate`, `resolve`, `Policy.__init__`, `DoNothingPolicy.__init__`, `DoNothingPolicy.decide`, `Guardrail.__init__`, `apply_guardrails`, `AuditStore.__init__`, `AuditStore.append`, `AuditStore.read_all`, `paired_bootstrap_ci`, `evaluate_lift`, `EvalHarness.run`, `EvalHarness.generate_paired_batches`, `EvalHarness.compute_lift_and_attribution`, `generate_report`. (`EvalHarness.__init__` is the one allowed PHASE_03 stub.)

`tests/unit/test_pins.py`
- `pyproject.toml` has exactly one `==` pin each for `ruff`, `mypy`, `pytest`, `numpy`. No `>=`, `~=`, `^`, `<` on those four.
- `importlib.metadata.version` of each equals its pin.

### 9b. Mutants

Layout:
- `tests/mutants/__init__.py` (and `tests/__init__.py` if missing; check `tests/invariants`, `tests/unit` first)
- `_patch.py`: `replace_everywhere(orig, new)` walks `sys.modules`, rebinds every module attribute that `is orig` (functions and classes only). `set_attr(module, name, value)` for constants.
- `plugin.py`: pytest plugin. `pytest_configure` reads `LIFT_MUTANT`, imports `tests.mutants.<name>`, calls `apply()`. `pytest_report_header` returns `lift-mutant: <name>` (proof in raw log).
- `registry.py`: `MUTANTS = [(id, module_name, target_node_id), ...]`.
- One file per mutant, named `m01_...py`. Each has `TARGET`, `DESCRIPTION`, `apply()`. Not `test_*`, so not collected.

| ID | Target test | Break |
|---|---|---|
| M01 | `test_policy_never_receives_hidden` | `DoNothingPolicy.decide` skips `require_observable` |
| M02 | `test_outcome_independent_of_label_shortcut` | `resolve` doubles loss when `true_label == "phishing"` |
| M02b | same | `resolve` ignores `is_positive` (loss always 0) |
| M03 | `test_same_seed_same_hash` | `RngStreams.stream` returns unseeded `np.random.default_rng()` |
| M04 | `test_paired_batches_identical_across_policies` | `EvalHarness.run` generates events lazily from ONE shared Generator and draws an extra value when action is not `ALLOW`. Events then depend on the policy |
| M05 | `test_extra_action_does_not_shift_rng` | `stream()` returns one shared seeded Generator for every name |
| M06 | `test_guardrail_veto_cannot_be_bypassed` | `apply_guardrails` ignores vetoes, `final = proposed` |
| M06b | same | `apply_guardrails` gains `**kwargs`; `override=True` skips vetoes |
| M07 | `test_safe_default_never_vetoed` | `apply_guardrails` vetoes `GIVE_UP` / `ALLOW` too (final becomes `BLOCK`) |
| M08 | `test_audit_log_append_only` | `append` opens with `"wb"` |
| M08b | same | adds `AuditStore.delete` |
| M09 | `test_report_matches_fresh_run` | `generate_report` adds a `uuid4()` line |
| M10 | `test_min_seeds_flag_underpowered` | `bootstrap.MIN_SEEDS = 21` |
| M11 | `test_lift_not_above_attributed` | `attributed_benefit` returns `0.5 *` the true value |

Runner `scripts/run_mutants.py` (`python -m pytest` subprocesses, `cwd` = repo root, `COLUMNS=200`, `-p no:cacheprovider --tb=no -rfE`):
1. Parse the 11 names from `core/RULES.md` section 12 (backticked `test_*` lines). Registry must cover all 11. Missing → exit 1.
2. Baseline: run `tests/invariants/test_invariants.py` clean with `-rA`. All 11 `PASSED`, else exit 1. A kill means nothing if the clean run is red.
3. Each mutant: run only its `TARGET` with `-p tests.mutants.plugin`, `LIFT_MUTANT=<module>`.
   - KILLED: target `FAILED` with `AssertionError` or `Failed`.
   - INVALID: failed on `NotImplementedError`, `ImportError`, `AttributeError`, setup `ERROR`, anything else.
   - SURVIVED: target passed.
4. Print `id | target | verdict`. Exit 0 only if every mutant is KILLED.

---

## 10. Owner commands, in order

```powershell
$L = "reports/phases/raw/PHASE_01"
New-Item -ItemType Directory -Force $L | Out-Null

# after tests-only commit, BEFORE implementation
python scripts/dev.py test --log $L/01_red_tests.txt

# after all implementation commits
python scripts/dev.py lint     --log $L/02_lint.txt
python scripts/dev.py types    --log $L/03_types.txt
python scripts/dev.py test     --log $L/04_tests.txt
python scripts/dev.py guard    --log $L/05_guard.txt
python scripts/dev.py mutants  --log $L/06_mutants.txt
python scripts/dev.py check    --log $L/07_check.txt
python scripts/dev.py smoke    --log $L/08_smoke_a.txt
python scripts/dev.py smoke    --log $L/09_smoke_b.txt
(Get-FileHash $L/08_smoke_a.txt).Hash
(Get-FileHash $L/09_smoke_b.txt).Hash

python -m pip list --format=freeze | Select-String -Pattern "^(ruff|mypy|pytest|numpy)=="
Select-String -Path pyproject.toml -Pattern "=="
git log -1 --format=%H
git status --short
git diff --stat 2956cb8ad5bc94a864cb8ef2c6af2f80ee7e681e HEAD -- AGENTS.md core/RULES.md docs/HONESTY.md
git diff 2956cb8ad5bc94a864cb8ef2c6af2f80ee7e681e HEAD -- tests/invariants/test_invariants.py
```

If `lint` fails only on format: owner runs `python -m ruff format .`, commits `phase01: ruff format`, reruns.
Frozen diff must print nothing. Test file diff must show only the G1 hunk.
Then agent writes `reports/phases/PHASE_01_REPORT.md` in AGENTS.md section 6 format, copying from raw files. Owner pastes report + raw logs to planner.

---

## 11. Verifier checks (planner, raw output only)

| Claim | Needs |
|---|---|
| 11 invariants pass | `04_tests.txt` pytest summary, 0 skipped, 0 xfail |
| Tests were red first | `01_red_tests.txt` shows failures |
| Each invariant has a working broken twin | `06_mutants.txt`: 14 rows, all KILLED, baseline 11 PASSED, `lift-mutant:` header per run |
| Lint, types clean | `02`, `03` exit 0 |
| Guard clean | `05` |
| `check` green | `07` ends `EXIT_CODE=0`, stage 5 green, frozen-hash stage present, mutants stage present |
| Red stage retired, Makefile + CI + README synced | `git diff --stat` lists `scripts/dev.py`, `Makefile`, `.github/workflows/ci.yml`, `README.md` |
| Deterministic | `08` and `09` hashes equal |
| Default candidate has real lift and real harm | `08`: `lift > 0`, `false_block_total > 0` per seed |
| Pins real and installed | pin output matches `pyproject.toml`, `test_pins` passed |
| Frozen files untouched | empty frozen diff |
| Any number | verbatim from a log, tagged |

No log = NOT DONE. No inference from code reading.

---

## 12. Commit plan

1. DONE `0828be7` `phase01: veto test targets BLOCK per RULES 7`
2. `phase01: pins, dev.py (flip stage 5, drop phase0-check, mutants, smoke, --log), Makefile, CI, README sync`
3. `phase01: failing hardening tests and mutants` → owner runs red log
4. `phase01: canon, rng, types`
5. `phase01: scenario and resolve`
6. `phase01: policies and guardrails`
7. `phase01: audit store and report`
8. `phase01: bootstrap, attribution, harness`
9. `phase01: stub relabel per phase map`
10. `phase01: report`

After each implementation commit owner runs `python scripts/dev.py test` and pastes any failure.

---

## 13. Definition of done

AGENTS.md section 5, plus:
- 11 invariants green. 14 mutants killed. `check` exit 0 with mutants inside.
- No test edited except the owner's G1 patch.
- All numbers tagged. Defaults tagged ASSUMPTION.
- Every `NotImplementedError` left matches the phase map.
- Report lists deviations: make → dev.py, `phase0-check` retired, Python 3.13.5 local vs 3.12 CI and AGENTS.md wording, `mutants` inside `check`, G1 test patch, `generate_report` and harness pulled into this phase, `Outcome.false_block_amount` added, `Scenario.reseeded` added, `EvalHarness` gains `config` kwarg.

---

## 14. Risks and questions

Risks:
- Default config might give `lift <= 0` or zero false blocks. Then M11 survives and `test_default_candidate_nonvacuous` fails. Fix: change only `WorldConfig` / `candidate_threshold` values. Record each as ASSUMPTION. Never touch a test.
- `lift <= attributed` float equality. Strict margin from the false-block cost keeps it safe. `fsum` on both routes.
- Both lift routes read `resolve`. Weak independence. Logged, not fixed here.
- mypy has no flags: the two `# type: ignore` comments in the tests are not proven necessary. Runtime tests do the enforcing.
- Pinned numpy must install on CI 3.12 and local 3.13.
- Agent cannot run Python. Expect several fix loops.

Questions for owner:
- Q1: `GIVE_UP` = no-op equal to `ALLOW` in `resolve`. OK for now?
- Q2: `resolve` reads `is_positive`. RULES 2 bans label shortcuts. The test forces this one precondition. Label-randomisation test comes in PHASE_02. OK?
- Q3: Guardrail + audit wiring in harness deferred to PHASE_03. Harness raises a labelled `NotImplementedError` if either is passed. OK?
- Q4: CLI stubs say "phase 01" and `test_cli.py` asserts it. Leave now, relabel to PHASE_04 with your test edit later?
- Q5: Legacy `SeededRNG`, `bootstrap_ci`, `World` stay stubs relabelled PHASE_02. Delete as dead code instead?
- Q6: Add `[tool.mypy] warn_unused_ignores = true` to pyproject so the two test ignores are proven? Recommended. Say yes before the agent starts.
- Q7: Leave AGENTS.md wording "Python 3.12" as is?