# ADR 0001: Separation of Observable and Hidden State

## Context
In evaluation and simulation frameworks, ground truth state often accidentally leaks into policies during feature engineering or metric calculation, invalidating experimental rigor.

## Decision
We enforce strict type-level isolation between `Observable` and `Hidden` states. Decision policies may only accept instances of `Observable`.

## Status
Accepted.
