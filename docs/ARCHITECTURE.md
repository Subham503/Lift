# Architecture & System Design

## Overview

Lift is a simulation, safety guardrail, and counterfactual evaluation platform structured as follows:

```
                    ┌───────────────────────────┐
                    │     Scenario Generator    │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Simulation World                                                       │
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │    Hidden State     │                 │    Observable State    │   │
│   │ (Ground truth/fraud)│                 │  (Features for Policy) │   │
│   └─────────────────────┘                 └───────────┬────────────┘   │
└───────────────────────────────────────────────────────┼────────────────┘
                                                        │
                                                        ▼
                                            ┌────────────────────────┐
                                            │     Decision Policy    │
                                            └───────────┬────────────┘
                                                        │ proposed action
                                                        ▼
                                            ┌────────────────────────┐
                                            │    Safety Guardrail    │
                                            └───────────┬────────────┘
                                                        │ verdict / final action
                                                        ▼
                                            ┌────────────────────────┐
                                            │   Append-Only Audit    │
                                            └───────────┬────────────┘
                                                        │
                                                        ▼
                                            ┌────────────────────────┐
                                            │ Evaluator & Harm Slices│
                                            └───────────┬────────────┘
                                                        │
                                                        ▼
                                            ┌────────────────────────┐
                                            │   Results JSON & UI    │
                                            └────────────────────────┘
```

## Core Subsystems

1. **`core.sim`**: World runner, scenario generation, strictly isolated `Observable` and `Hidden` states.
2. **`core.policies`**: Policies make decisions using only `Observable` features.
3. **`core.guardrails`**: Deterministic or statistical guardrails that validate, allow, modify, or veto proposed actions.
4. **`core.audit`**: Cryptographically verifiable, append-only event store.
5. **`core.eval`**: Evaluation harness, non-parametric bootstrap confidence intervals, harm and fairness slices.
6. **`core.report`**: Automated Markdown and HTML evaluation reports.
7. **`dashboard`**: Next.js read-only visualization application consuming `results/`.
