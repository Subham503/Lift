# Dashboard Fixtures & Result Schemas

This directory contains static evaluation fixtures mirroring Lift's simulation results and append-only audit event outputs.

## Purpose
- Powers the Lift Console UI when running offline or in preview mode.
- Every screen backed by these fixtures displays a persistent **Demo data** badge.
- Never presented as real production results.

## Data Schema Assumptions

### 1. Run Summary (`runs.json`)
- `run_id`: Unique identifier (e.g. `run_20261028_01`).
- `pack`: Domain pack name (`payments_fraud`).
- `scenario`: Scenario name (`payments_fraud_synthetic` or `payments_fraud_stress_ring`).
- `seed`: Primary RNG seed integer.
- `seeds_evaluated`: Total paired seeds evaluated (minimum 20 per `core/RULES.md`).
- `sample_size_n`: Total transactions evaluated per policy (e.g. 2,000).
- `created_at`: ISO timestamp.
- `events_digest`: Cryptographic SHA-256 digest of serialized event inputs.
- `policies`: Array of policy evaluation outcomes. Each policy includes:
  - `policy_id`: Identifier (`do_nothing`, `rules`, `ml_threshold`, `ml_guarded`).
  - `name`: Display name.
  - `is_baseline`: Boolean indicating baseline status.
  - `net_benefit`: Float with 95% bootstrap CI `[lo, hi]` and sample size `n`. Tagged `SIMULATED`.
  - `fraud_caught_rate`: Percentage of true fraud identified `[lo, hi]`.
  - `false_positive_rate`: Percentage of good transactions delayed `[lo, hi]`.
  - `review_load_hours`: Human queue hours required `[lo, hi]`.
  - `lift_vs_baseline`: Net difference relative to `do_nothing` baseline `[lo, hi]`.
  - `guardrail_overrides`: Count of proposed actions vetoed/modified by active guardrails.
  - `p95_harm_ratio`: Tail harm metric on worst-off customer cohort.

### 2. Transaction Audit Logs (`transactions.json`)
~2,000 simulated transaction records containing:
- `id`: Transaction ID (`tx_0001` - `tx_2000`).
- `timestamp`: Event ISO timestamp.
- `amount`: Transaction amount in USD.
- `currency`: Currency code (`USD`).
- `customer_id`: Simulated customer ID.
- `customer_tier`: Demographic slice (`new`, `established`, `vip`).
- `payment_method`: Channel (`card`, `wire`, `ach`, `instant`).
- `ip_country`: Two-letter country code.
- `observable`: Observable feature dictionary seen by policy (`amount`, `velocity_1h`, etc.).
- `hidden`: Ground-truth hidden dictionary (`is_positive`, `true_label`).
- `policy_decisions`: Decisions proposed by each policy.
- `guardrail`:
  - `override`: Boolean indicating whether a guardrail modified the proposed action.
  - `rule_name`: Guardrail identifier (e.g. `HighValueGuardrail`).
  - `reason`: Reason string for veto/modification.
  - `verdict`: `ALLOW`, `BLOCK`, or `OVERRIDE`.
- `final_decision`: Executed system decision (`ALLOW`, `BLOCK`, `REVIEW`).
- `outcome`: Ground-truth outcome (`actual_loss`, `review_hours`, `customer_delayed`).
- `audit_steps`: Array of 6 chronological trace events corresponding to `core/RULES.md` section 8.

### 3. Evaluation Reports (`reports/*.md`)
Static Markdown evaluation reports matching `lift report` outputs with metadata headers (commit hash, seeds, config hash, library versions).

