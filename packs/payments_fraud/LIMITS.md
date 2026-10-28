# Payments Fraud Simulation Limits & Known Caveats

## Simulation Boundaries
- **Synthetic Distribution**: Transaction amounts are log-uniformly modeled, which may underestimate real-world long-tail merchant distributions.
- **Feedback Loops**: Assumes cardholder chargebacks happen deterministically; does not model chargeback lag or friendly fraud disputes.

## Untested Regimes
- Coordinated botnet credential stuffing.
- Zero-day merchant ID token compromises.
