# Contributing to Lift

Thank you for your interest in contributing to Lift! We hold high standards for scientific integrity, reproducibility, and software craftsmanship.

## Development Workflow

1. **Fork & Branch**: Create a feature branch matching your proposal (e.g. `feature/new-pack-logistics` or `fix/bootstrap-confidence`).
2. **Adhere to Invariants**: Read and honor [core/RULES.md](core/RULES.md) and [docs/HONESTY.md](docs/HONESTY.md).
3. **Run Checks Locally**:
   ```bash
   make check
   ```
   This executes:
   - Format and lint checks (`ruff check .`)
   - The 11 core invariant verification tests (`pytest tests/invariants`)
   - Unit and integration tests (`pytest tests/unit tests/integration`)
   - Banned phrase scan (`python scripts/check_banned_phrases.py`)

## Adding a New Pack

Follow [docs/PACK_GUIDE.md](docs/PACK_GUIDE.md):
1. Copy `packs/_template/` to `packs/<your_pack>/` or run `lift new-pack <your_pack>`.
2. Define the schema, scenarios, observable features, baseline policies, and guardrails.
3. Complete `LIMITS.md` and the `brief_checklist.md`.
4. Add automated pack tests in `packs/<your_pack>/tests/`.

## Pull Request Requirements

- All CI checks must pass without exceptions or silenced warnings.
- Any change affecting simulation outcomes must include a reproducible report in `reports/` showing both mean and confidence interval diffs.
- Never modify tests in `tests/invariants/` to bypass a failed invariant.
