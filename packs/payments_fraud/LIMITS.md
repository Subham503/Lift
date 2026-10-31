# Payments Fraud Simulation Limits & Known Caveats

## 1. Results measured on real data
None. No real transaction data has been used. Every figure from this pack is SIMULATED.

## 2. Results measured in the simulator
- The simulator produces a synthetic card-transaction stream with amount, velocity, device trust, cross-border and account-age features.
- Amounts are log-uniformly modeled, which may underestimate real-world long-tail merchant distributions.
- Chargebacks happen deterministically. Chargeback lag and friendly-fraud disputes are not modeled.
- Fraud and legit features overlap by design, so no policy can be perfect. The overlap is not calibrated to real data.

## 3. Assumptions
Every row below is an ASSUMPTION chosen by us, not measured.

| Name | Value | Tag | Reason |
|---|---|---|---|
| Fraud rate | 2.5% of events | ASSUMPTION | Round number, not measured |
| Events per seed | 2,000 | ASSUMPTION | Chosen for run speed |
| Amount range | $5 to $5,000, log-uniform | ASSUMPTION | Chosen by us |
| Feature generator | hand-set velocity, device trust, cross-border, account age | ASSUMPTION | Informative but overlapping |
| Chargeback fee | $15 | ASSUMPTION | Chosen by us |
| Blocked legit sale | 3% of amount + $5 friction | ASSUMPTION | Chosen by us |
| Manual review | $4 (6 min at $40/hour) | ASSUMPTION | Chosen by us |
| Review fraud catch rate | 90% | ASSUMPTION | Chosen by us |
| GIVE_UP | treated as ALLOW | ASSUMPTION | Chosen by us |
| Guardrail veto of a BLOCK | becomes REVIEW | ASSUMPTION | Chosen by us |
| Minimum seeds | 20 | ASSUMPTION | Underpowered flag below this |

Costs live in `core/sim/costs.py`. Scenario parameters live in `core/sim/scenarios.py`. Results are valid only under these values.

## 4. Evidence still needed before any deployment
- Real transaction logs and a held-out evaluation on them.
- A controlled A/B test.
- Privacy and regulator review.

Untested regimes the simulator cannot represent:
- Coordinated botnet credential stuffing.
- Zero-day merchant ID token compromises.
