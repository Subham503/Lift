# AUDIT_00 — Read-only audit of the skeleton

Read `AGENTS.md`, `core/RULES.md`, `docs/HONESTY.md` first.

## Mode
- READ-ONLY. Do not fix, create, move, or delete anything except the one report file below.
- Output file: `reports/phases/AUDIT_00_REPORT.md`
- Use the report format from `AGENTS.md` section 6, plus the findings table in section K.
- Paste raw command output verbatim. Never summarise a command you did not run. Write `NOT RUN` instead.
- When done, STOP. Do not start Phase 0.

## A. Structure vs spec
1. Run `find . -path ./node_modules -prune -o -path ./.git -prune -o -type f -print | sort`.
2. Compare with the expected list below. Report MISSING and EXTRA paths.

Expected (files or directories):
```
AGENTS.md README.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md Makefile pyproject.toml
.env.example .gitignore docker-compose.yml
.github/workflows/ci.yml .github/ISSUE_TEMPLATE/ (bug, new-pack, new-policy, new-scenario)
.github/pull_request_template.md
docs/HONESTY.md docs/ARCHITECTURE.md docs/PACK_GUIDE.md docs/phases/ docs/decisions/
reports/phases/ reports/generated/
core/RULES.md
core/sim/{types,rng,world,scenarios}.py
core/policies/{base,do_nothing}.py
core/guardrails/{base,verdict}.py
core/eval/{harness,metrics,bootstrap,harm,slices,sweeps}.py
core/audit/store.py
core/report/generate.py core/report/templates/
core/cli/main.py
packs/_template/{pack.yaml,scenarios/,features.py,policies/,guardrails.py,LIMITS.md,brief_checklist.md,tests/}
packs/payments_fraud/ (same layout + data/ + models/)
packs/logistics/
dashboard/app/ dashboard/lib/
tests/invariants/ tests/unit/ tests/integration/
scripts/{download_data.py,check_banned_phrases.py}
results/
```

## B. Frozen files intact
Run and paste:
```
sha256sum AGENTS.md core/RULES.md docs/HONESTY.md
git log --oneline -- AGENTS.md core/RULES.md docs/HONESTY.md
```
The owner compares hashes with the originals. Do not claim they match.

## C. Invented-number scan (most important)
Run and paste each:
```
grep -rnE "[0-9]+([.,][0-9]+)? ?(%|x|L|lakh|cr|crore|ms|seconds|hours)" README.md docs reports dashboard packs core scripts --include="*.md" --include="*.ts" --include="*.tsx" --include="*.py" --include="*.yaml" --include="*.j2" --include="*.css"
grep -rnE "₹ ?[0-9]" . --include="*.md" --include="*.ts" --include="*.tsx" --include="*.py" --include="*.j2"
grep -rnE "Math\.random|faker|mock|dummy|placeholder|lorem|TODO: fill" dashboard core packs scripts
```
For EVERY hit, classify in the findings table as:
- `RULE-TEXT` (a number inside a frozen rules file or a rule description)
- `CONFIG` (a real parameter, not a result)
- `INVENTED-RESULT` (any benchmark, lift, accuracy, count, or KPI shown as a result)
- `MOCK-UI` (hardcoded demo value in the dashboard)

## D. Pre-written results (must not exist yet)
Run and paste:
```
ls -la reports/phases reports/generated reports/generated/*
wc -l reports/phases/*.md reports/generated/*/*.md
head -40 README.md
head -40 reports/generated/payments_fraud/REPORT.md
head -40 reports/phases/PHASE_00_REPORT.md
grep -n "REPORT\|Generated\|commit" reports/generated/*/*.md | head -20
```
Flag as `FAKE-RESULT`: any REPORT.md or PHASE report written before its command ran; any `REPORT.md` without a generated header (commit hash, command, seeds, config hash). README "benchmarks" with numbers.

## E. Test stubs
Run and paste:
```
grep -nE "^def test_|^    def test_" tests/invariants/*.py
grep -rnE "assert True|pytest\.skip|pytest\.mark\.(skip|xfail|skipif)|@unittest\.skip|pass$" tests
python -m pytest tests/invariants -q 2>&1 | tail -30
```
Required names (exactly these 11, no more, no fewer):
```
test_policy_never_receives_hidden
test_outcome_independent_of_label_shortcut
test_same_seed_same_hash
test_paired_batches_identical_across_policies
test_extra_action_does_not_shift_rng
test_lift_not_above_attributed
test_guardrail_veto_cannot_be_bypassed
test_safe_default_never_vetoed
test_audit_log_append_only
test_report_matches_fresh_run
test_min_seeds_flag_underpowered
```
Report: which names are missing or extra; which tests pass trivially; whether each fails because of `NotImplementedError` (good) or an unrelated error (bad). Expected state now: 11 failing, 0 passing, 0 skipped.

## F. Import boundary
```
grep -rnE "^(from|import) +packs" core
grep -rnE "^(from|import) +(requests|httpx|urllib|socket|aiohttp)" core
```
Expected: no output.

## G. Banned phrases and tags
Open `docs/HONESTY.md` section 2. Run `python scripts/check_banned_phrases.py` if it exists, else:
```
grep -rniE "saves|prevents|proves|guarantee|certif|real-world impact|production-ready|deployable|state-of-the-art" README.md docs core packs dashboard --include="*.md" --include="*.tsx" --include="*.ts"
```
Classify each hit: `RULES-QUOTE` (inside HONESTY.md or rules listing) or `VIOLATION`.

## H. Build sanity
Run and paste raw output of each, even if it fails:
```
python --version
pip install -e . 2>&1 | tail -20
lift --help
make lint
make check
```
Report exit codes with `echo "exit=$?"` after each.

## I. Dependencies
Paste `[project.dependencies]` and dev dependencies from `pyproject.toml`. Flag anything outside the allowed list in `AGENTS.md` section 3 (standard library, numpy, pandas, scikit-learn, xgboost, shap, fastapi, pydantic, pytest). Tooling (ruff, mypy, jinja2, typer or click, pyyaml) is allowed; flag anything else.

## J. Repo hygiene
```
cat .gitignore
cat .env.example
grep -rnE "(sk-|AIza|rzp_(test|live)_|api[_-]?key *= *['\"][A-Za-z0-9]{8,})" . --include="*" 2>/dev/null | grep -v node_modules | head
ls dashboard
```
Check `results/`, model files, raw datasets are gitignored. Check `.env.example` holds placeholders only. Check the dashboard reads `results/` or `reports/generated/` only (paste `dashboard/lib/results.ts`).

## K. Findings table (required)
| # | Severity | Section | Path:line | Finding | Class | Proposed fix |
|---|---|---|---|---|---|---|
Severity: `BLOCKER` (breaks a frozen rule or fakes a result), `MAJOR`, `MINOR`.

End the report with:
- Count of BLOCKER / MAJOR / MINOR
- A proposed fix list (not applied)
- `AUDIT COMPLETE. Awaiting owner approval.`