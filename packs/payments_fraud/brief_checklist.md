# Payments Fraud Pack Brief Checklist

- [ ] Evaluated against `DoNothingPolicy` baseline.
- [ ] Evaluated `RuleBasedFraudPolicy` vs `ThresholdModelFraudPolicy`.
- [ ] Confirmed `HighValueGuardrail` catches extreme outliers.
- [ ] Verified synthetic transactions do not leak fraud label to `Observable`.
- [ ] Datasets and models correctly gitignored.
