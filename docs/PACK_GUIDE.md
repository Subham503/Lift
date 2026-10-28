# Guide: How to Add a Domain Pack

A Pack encapsulates a distinct decision domain (e.g. `payments_fraud`, `logistics`, `credit_underwriting`).

## Pack Layout
```
packs/<pack_name>/
├── pack.yaml               # Metadata, scenario list, metric configurations
├── scenarios/              # Synthetic or replay scenario generators
├── features.py             # Functions mapping world states to Observable
├── policies/               # Domain-specific baseline decision policies
├── guardrails.py           # Domain guardrails
├── LIMITS.md               # Untested boundaries and known assumptions
├── brief_checklist.md      # Pre-submission validation checklist
├── data/                   # Data downloaders and checksums
└── tests/                  # Invariant and pack test suite
```

## Quick Steps
1. Run `lift new-pack <pack_name>` or copy `packs/_template/`.
2. Define the domain types adhering to `Observable` and `Hidden`.
3. Implement at least one baseline policy (e.g. heuristic or do-nothing).
4. Run `make check` to verify invariants.
