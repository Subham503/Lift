# Pack Verification Brief Checklist

- [ ] `pack.yaml` is syntactically valid and specifies all metrics.
- [ ] Observable features contain zero hidden state or labels.
- [ ] At least one baseline policy implemented.
- [ ] At least one guardrail implemented.
- [ ] Unit tests pass under `tests/test_pack.py`.
- [ ] `LIMITS.md` documents untested failure modes.
