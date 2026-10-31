# Payments Fraud Simulation Limits & Known Caveats

## Simulation Boundaries
- **Synthetic Distribution**: Transaction amounts are log-uniformly modeled, which may underestimate real-world long-tail merchant distributions.
- **Feedback Loops**: Assumes cardholder chargebacks happen deterministically; does not model chargeback lag or friendly fraud disputes.

## Untested Regimes
- Coordinated botnet credential stuffing.
- Zero-day merchant ID token compromises.

## Assumed cost model (NOT measured)
Every dollar in simulated results comes from these assumptions. Results are valid only under them.
- Fraud allowed through: loss = amount + $15 chargeback fee.
- Legit transaction blocked: loss = 3% of amount + $5 customer friction.
- Manual review: $4 per transaction (6 minutes at $40/hour).
- Review catches 90% of fraud. A missed fraud then costs the same as an allowed one.
- GIVE_UP is treated as ALLOW.
- Defined in `core/sim/costs.py`. Change them there and results change with them.
