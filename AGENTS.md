# AGENTS.md — Global rules for Lift

Read this file, `core/RULES.md`, and `docs/HONESTY.md` before every task.
These three files are FROZEN. The agent never edits them. Only the human owner edits them.

## 1. Roles
- Owner (human): decides scope, runs every command, verifies every number.
- Agent (Antigravity): writes code and tests for ONE phase file at a time.
- Verifier (Claude, separate chat): reads the phase report and checks it against these rules.

## 2. Phase workflow (mandatory order)
1. Read the phase file given by the owner (`docs/phases/PHASE_XX.md`). Do only what it lists.
2. Write failing tests first. Commit them.
3. Implement until tests pass.
4. Run `make check` (lint + types + tests + honesty tests). It must exit 0.
5. Write the phase report (format in section 6). Save as `reports/phases/PHASE_XX_REPORT.md`.
6. STOP. Do not start the next phase.

## 3. Scope control
- No task outside the phase file. No "while I'm here" refactors.
- No new dependency without listing it in the report with the reason. Prefer the standard library, numpy, pandas, scikit-learn, xgboost, shap, fastapi, pydantic, pytest.
- Python 3.12, type hints on every public function, `ruff` clean.
- Never delete, skip, xfail, or weaken a test. If a test seems wrong, report it as a question. Do not change it.
- Never edit generated files by hand (`REPORT.md`, `results/`, `reports/generated/`).
- No network calls inside `core/` or `eval/`. Evaluation must run offline.
- If blocked or unsure: stop, write `BLOCKED:` in the report with the exact reason. Do not guess.

## 4. No invented numbers (hard rule)
- Every number in any report, README, or dashboard comes from a command output.
- Paste that output verbatim into the phase report, with the command above it.
- If a command was not run, write `NOT RUN`. Never write a plausible result.
- Never round in a way that changes meaning. Keep CI bounds as produced.
- Never claim a test passed without pasting the pytest summary line.

## 5. Definition of done (per phase)
- All items in the phase file implemented, or listed under "Not done" with reasons.
- `make check` exit code 0, pasted.
- New behaviour has at least one test that fails if the behaviour breaks.
- Phase report complete, with every section filled.
- Repo state committed. Commit hash in the report.

## 6. Phase report format (copy exactly)

```
# PHASE_XX REPORT
## Meta
- Phase file: docs/phases/PHASE_XX.md
- Commit hash:
- Date:
- Python / key library versions:

## Done
- (one line per phase item, with file path)

## Not done
- (item, reason)

## Files changed
- (path: one-line purpose)

## Commands run (raw output pasted)
### Command
<command>
### Output
<verbatim output>

## Tests
- Total / passed / failed / skipped (must be 0 skipped):
- New tests added (names):
- Honesty tests status:

## Numbers produced (verbatim from commands)
- (label, value, source command, tag: REAL-DATA / SIMULATED / ASSUMPTION)

## Deviations from the phase file
- (what, why)

## Known issues and limits found
- 

## Honesty checklist
- [ ] No number written by hand
- [ ] Every number tagged REAL-DATA / SIMULATED / ASSUMPTION
- [ ] No test weakened or skipped
- [ ] No frozen file edited
- [ ] Re-run with same seed gives same numbers (command + output pasted)

## Questions for the verifier
- 
```

## 7. Commit rules
- One logical change per commit. Message format: `phaseXX: <what>`.
- Never commit secrets, API keys, or datasets over 5 MB. Use `.env.example`.
- Large data: download script plus checksum, not the file.

## 8. Verification handoff
- The owner pastes the phase report (and any raw outputs it references) to the verifier.
- The agent writes the report so the verifier can check it without opening the repo.
- A report missing raw output for a claimed result counts as NOT DONE.