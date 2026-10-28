## Description
Brief overview of changes made.

## Invariant Compliance Checklist
- [ ] Invariant 1: Observable state does not leak Hidden ground truth.
- [ ] Invariant 2: RNG is strictly deterministic with seeded sequences.
- [ ] Invariant 3: Decision policies do not mutate simulator environment state.
- [ ] Invariant 4: Guardrails produce explicit typed `Verdict` objects.
- [ ] Invariant 5: Audit logs are append-only.
- [ ] Invariant 6: Harm metrics are calculated strictly post-facto.
- [ ] Invariant 7: Results are bitwise reproducible given the seed.
- [ ] Invariant 8: Metric evaluations include bootstrap confidence intervals.
- [ ] Invariant 9: Pack configuration passes schema validation.
- [ ] Invariant 10: Cohort slices are clearly defined and tested.
- [ ] Invariant 11: No changes were made to `tests/invariants/` to silence failures.

## Test Results
- Output of `make check`:
- Evaluation diff summary:
