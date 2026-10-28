# docs/HONESTY.md — Truth, harm, and claim rules

Applies to README, REPORT.md, dashboard text, demo scripts, pitch decks, and commit messages.

## 1. Three tags on every number
| Tag | Meaning |
|---|---|
| `REAL-DATA` | measured on a real public dataset, by a command anyone can rerun |
| `SIMULATED` | measured inside the Lift simulator |
| `ASSUMPTION` | an input chosen by us (fraud rate, cost of a review, block penalty) |

- A number with no tag is a defect.
- Tags are never merged in one figure. A REAL-DATA accuracy and a SIMULATED lift are separate lines.
- Every ASSUMPTION is listed in `LIMITS.md` with its value and why it was chosen.

## 2. Allowed and banned language
Allowed: "In simulation, policy X produced a lift of A (95% CI [B, C]) over do_nothing."
Allowed: "On <dataset>, the model reached <metric> (REAL-DATA)."

Banned unless a real-world controlled test backs it:
- "saves", "prevents", "stops" (any money or fraud amount)
- "proves", "guarantees", "certifies safe"
- "real-world impact", "production-ready", "deployable"
- "state-of-the-art", "best" (without naming the compared set and metric)
- any rupee/crore claim stated as a real saving

Banned always: rounding up, dropping the CI, quoting the best seed or scenario alone.

## 3. Baseline honesty
- `rules` baseline gets the same tuning effort as the learned policy. Record the effort (trials, time) in the report.
- Report where the new policy loses or ties, not only where it wins.
- Report share of achievable = lift / oracle lift, with the oracle labelled as a ceiling.

## 4. Stress and sensitivity (required in every pack report)
- At least 3 scenarios not used for tuning (example: festival spike, fraud ring, bank outage).
- Worst scenario shown next to the average.
- Sensitivity runs: key assumption x0.5 and x2 (example: fraud rate, review cost). State whether the ranking of policies survives.
- Tuning on a scenario and reporting on the same scenario is forbidden. Tune on a dev scenario set, report on a held-out set.

## 5. Harm and fairness slices
Required next to every benefit number:
- false blocks: count, share of good customers, amount delayed
- friction: step-ups and reviews per 1,000 good customers
- queue load: human review hours
- slices (pack defines exact fields, minimum 3): amount band, new vs established customer, payment method, region or tier. For each slice report benefit, false-block rate, and friction.
- worst slice and the gap between best and worst slice, with CI.
- If the worst slice is more than 2x the average false-block rate, the report prints `HARM FLAG` at the top.

## 6. LIMITS.md (one per pack, required)
Four sections, in this order:
1. Results measured on real data (what, where, how to rerun)
2. Results measured in the simulator (what the simulator does and does not model)
3. Assumptions (table: name, value, reason)
4. Evidence still needed before any deployment (for example: real logs, A/B test, privacy review, regulator constraints)

Also list known failure modes the simulator cannot represent.

## 7. README structure
1. One sentence on what Lift does.
2. Headline result with tag, CI, and the exact command to reproduce.
3. Harm result next to it.
4. What is real and what is simulated (table).
5. Known limitations.
6. Quickstart.
7. Architecture (last, not first).

## 8. Pre-submission honesty test (all must be yes)
- Can a stranger clone, run one command, and match every number?
- Is every number tagged?
- Does the report show at least one result that looks bad for our policy?
- Do harm and slice results appear beside benefit?
- Were held-out scenarios used for reporting?
- Does the README contain none of the banned phrases? (`lift check` greps for them.)

## 9. Outside review
Before any public launch or submission, one outsider (senior, professor, or maintainer) tries to break the result. Their findings go in the README under "External review", including ones we could not fix.