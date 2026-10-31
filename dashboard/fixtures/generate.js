import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple deterministic PRNG
function createRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rng = createRng(42);

// Generate runs.json
const runs = [
  {
    run_id: "run_20261028_01",
    pack: "payments_fraud",
    scenario: "payments_fraud_synthetic",
    scenario_description: "Synthetic baseline evaluation with 2.5% base fraud rate across standard payment channels",
    created_at: "2026-10-28T14:30:00Z",
    seed: 42,
    seeds_evaluated: 20,
    sample_size_n: 2000,
    events_digest: "sha256:7c9e1208af81bbd9319e7a4b8dfec8192a6c3f098d6f12089c25d7ef01ab32cf",
    config: {
      pack: "payments_fraud",
      scenario: "synthetic",
      base_fraud_rate: 0.025,
      currency: "USD",
      guardrail: "HighValueGuardrail",
      bootstrap_resamples: 10000,
      confidence_level: 0.95,
      min_seeds: 20,
    },
    pareto_frontier: [
      { policy_id: "do_nothing", cost: 0, fraud_caught: 0, label: "Do Nothing Baseline" },
      { policy_id: "rules", cost: 1840, fraud_caught: 74.2, label: "Rule-Based Policy" },
      { policy_id: "ml_threshold", cost: 910, fraud_caught: 88.6, label: "Threshold Model Policy" },
      { policy_id: "ml_guarded", cost: 620, fraud_caught: 92.4, label: "Threshold Model + HighValueGuardrail" },
    ],
    policies: [
      {
        policy_id: "do_nothing",
        name: "DoNothingPolicy",
        type: "baseline",
        is_baseline: true,
        description: "Zero intervention baseline. Allows all transactions unconditionally.",
        metrics: {
          net_benefit: { mean: 0, lo: 0, hi: 0, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 0, lo: 0, hi: 0, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 0.0, lo: 0.0, hi: 0.0, n: 2000, unit: "%" },
          false_positive_rate: { mean: 0.0, lo: 0.0, hi: 0.0, n: 2000, unit: "%" },
          review_load_hours: { mean: 0.0, lo: 0.0, hi: 0.0, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 1.0, lo: 1.0, hi: 1.0, n: 2000, unit: "ratio" },
          guardrail_overrides: 0,
          attributed_benefit: 0,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 1.0, tpr: 1.0 },
        ],
      },
      {
        policy_id: "rules",
        name: "RuleBasedFraudPolicy",
        type: "rules",
        is_baseline: false,
        description: "Hand-tuned incumbent rule engine checking velocity, cross-border tags, and amount thresholds.",
        metrics: {
          net_benefit: { mean: 412850, lo: 401200, hi: 424500, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 412850, lo: 401200, hi: 424500, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 74.2, lo: 71.5, hi: 76.8, n: 2000, unit: "%" },
          false_positive_rate: { mean: 1.84, lo: 1.45, hi: 2.23, n: 2000, unit: "%" },
          review_load_hours: { mean: 48.2, lo: 44.1, hi: 52.3, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 0.285, lo: 0.24, hi: 0.33, n: 2000, unit: "ratio" },
          guardrail_overrides: 18,
          attributed_benefit: 420000,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 0.5, tpr: 32.0 },
          { fpr: 1.0, tpr: 54.0 },
          { fpr: 1.84, tpr: 74.2 },
          { fpr: 5.0, tpr: 81.0 },
          { fpr: 10.0, tpr: 86.5 },
          { fpr: 100.0, tpr: 100.0 },
        ],
      },
      {
        policy_id: "ml_threshold",
        name: "ThresholdModelFraudPolicy",
        type: "learned",
        is_baseline: false,
        description: "Gradient-boosted decision model operating on 14 observable features with static threshold 0.70.",
        metrics: {
          net_benefit: { mean: 684200, lo: 675100, hi: 693300, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 684200, lo: 675100, hi: 693300, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 88.6, lo: 86.4, hi: 90.7, n: 2000, unit: "%" },
          false_positive_rate: { mean: 0.91, lo: 0.65, hi: 1.18, n: 2000, unit: "%" },
          review_load_hours: { mean: 24.5, lo: 21.8, hi: 27.2, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 0.124, lo: 0.09, hi: 0.16, n: 2000, unit: "ratio" },
          guardrail_overrides: 32,
          attributed_benefit: 692000,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 0.2, tpr: 45.0 },
          { fpr: 0.5, tpr: 72.0 },
          { fpr: 0.91, tpr: 88.6 },
          { fpr: 2.0, tpr: 94.0 },
          { fpr: 5.0, tpr: 97.2 },
          { fpr: 100.0, tpr: 100.0 },
        ],
      },
      {
        policy_id: "ml_guarded",
        name: "ThresholdModel + HighValueGuardrail",
        type: "guarded",
        is_baseline: false,
        description: "Threshold model combined with pure deterministic HighValueGuardrail vetoing unverified transfers > $5,000.",
        metrics: {
          net_benefit: { mean: 749150, lo: 742000, hi: 756300, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 749150, lo: 742000, hi: 756300, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 92.4, lo: 90.5, hi: 94.2, n: 2000, unit: "%" },
          false_positive_rate: { mean: 0.62, lo: 0.42, hi: 0.83, n: 2000, unit: "%" },
          review_load_hours: { mean: 14.8, lo: 12.6, hi: 17.0, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 0.078, lo: 0.05, hi: 0.11, n: 2000, unit: "ratio" },
          guardrail_overrides: 47,
          attributed_benefit: 755000,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 0.15, tpr: 52.0 },
          { fpr: 0.35, tpr: 78.5 },
          { fpr: 0.62, tpr: 92.4 },
          { fpr: 1.5, tpr: 96.8 },
          { fpr: 4.0, tpr: 98.9 },
          { fpr: 100.0, tpr: 100.0 },
        ],
      },
    ],
  },
  {
    run_id: "run_20261029_02",
    pack: "payments_fraud",
    scenario: "payments_fraud_stress_ring",
    scenario_description: "Adversarial stress test simulating an organized fraud ring with distributed bot networks and rotating proxies",
    created_at: "2026-10-29T09:15:00Z",
    seed: 101,
    seeds_evaluated: 20,
    sample_size_n: 2000,
    events_digest: "sha256:4b22c810f92a3ee045a198cfb784918e920ad511c7904b8b603d40857b320ef4",
    config: {
      pack: "payments_fraud",
      scenario: "stress_ring",
      base_fraud_rate: 0.082,
      currency: "USD",
      guardrail: "HighValueGuardrail",
      bootstrap_resamples: 10000,
      confidence_level: 0.95,
      min_seeds: 20,
    },
    pareto_frontier: [
      { policy_id: "do_nothing", cost: 0, fraud_caught: 0, label: "Do Nothing Baseline" },
      { policy_id: "rules", cost: 3200, fraud_caught: 59.1, label: "Rule-Based Policy" },
      { policy_id: "ml_threshold", cost: 1850, fraud_caught: 78.4, label: "Threshold Model Policy" },
      { policy_id: "ml_guarded", cost: 1220, fraud_caught: 85.2, label: "Threshold Model + HighValueGuardrail" },
    ],
    policies: [
      {
        policy_id: "do_nothing",
        name: "DoNothingPolicy",
        type: "baseline",
        is_baseline: true,
        description: "Zero intervention baseline. Allows all transactions unconditionally.",
        metrics: {
          net_benefit: { mean: 0, lo: 0, hi: 0, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 0, lo: 0, hi: 0, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 0.0, lo: 0.0, hi: 0.0, n: 2000, unit: "%" },
          false_positive_rate: { mean: 0.0, lo: 0.0, hi: 0.0, n: 2000, unit: "%" },
          review_load_hours: { mean: 0.0, lo: 0.0, hi: 0.0, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 1.0, lo: 1.0, hi: 1.0, n: 2000, unit: "ratio" },
          guardrail_overrides: 0,
          attributed_benefit: 0,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 1.0, tpr: 1.0 },
        ],
      },
      {
        policy_id: "rules",
        name: "RuleBasedFraudPolicy",
        type: "rules",
        is_baseline: false,
        description: "Hand-tuned incumbent rule engine under coordinated adversarial attack.",
        metrics: {
          net_benefit: { mean: 310500, lo: 295000, hi: 326000, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 310500, lo: 295000, hi: 326000, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 59.1, lo: 55.4, hi: 62.8, n: 2000, unit: "%" },
          false_positive_rate: { mean: 3.20, lo: 2.75, hi: 3.65, n: 2000, unit: "%" },
          review_load_hours: { mean: 84.1, lo: 78.5, hi: 89.7, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 0.442, lo: 0.39, hi: 0.50, n: 2000, unit: "ratio" },
          guardrail_overrides: 38,
          attributed_benefit: 318000,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 1.0, tpr: 28.0 },
          { fpr: 3.2, tpr: 59.1 },
          { fpr: 6.0, tpr: 68.0 },
          { fpr: 100.0, tpr: 100.0 },
        ],
      },
      {
        policy_id: "ml_threshold",
        name: "ThresholdModelFraudPolicy",
        type: "learned",
        is_baseline: false,
        description: "Gradient-boosted decision model operating under domain shift.",
        metrics: {
          net_benefit: { mean: 542000, lo: 528000, hi: 556000, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 542000, lo: 528000, hi: 556000, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 78.4, lo: 75.2, hi: 81.6, n: 2000, unit: "%" },
          false_positive_rate: { mean: 1.85, lo: 1.48, hi: 2.22, n: 2000, unit: "%" },
          review_load_hours: { mean: 46.2, lo: 41.5, hi: 50.9, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 0.215, lo: 0.17, hi: 0.26, n: 2000, unit: "ratio" },
          guardrail_overrides: 64,
          attributed_benefit: 551000,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 0.5, tpr: 42.0 },
          { fpr: 1.85, tpr: 78.4 },
          { fpr: 4.0, tpr: 86.0 },
          { fpr: 100.0, tpr: 100.0 },
        ],
      },
      {
        policy_id: "ml_guarded",
        name: "ThresholdModel + HighValueGuardrail",
        type: "guarded",
        is_baseline: false,
        description: "Threshold model with HighValueGuardrail constraining rapid bursts of large value attempts.",
        metrics: {
          net_benefit: { mean: 628900, lo: 618500, hi: 639300, n: 2000, unit: "USD" },
          lift_vs_baseline: { mean: 628900, lo: 618500, hi: 639300, n: 2000, unit: "USD" },
          fraud_caught_rate: { mean: 85.2, lo: 82.6, hi: 87.8, n: 2000, unit: "%" },
          false_positive_rate: { mean: 1.22, lo: 0.92, hi: 1.52, n: 2000, unit: "%" },
          review_load_hours: { mean: 29.4, lo: 25.8, hi: 33.0, n: 2000, unit: "hrs" },
          p95_harm_ratio: { mean: 0.138, lo: 0.10, hi: 0.18, n: 2000, unit: "ratio" },
          guardrail_overrides: 89,
          attributed_benefit: 635000,
        },
        roc_curve: [
          { fpr: 0.0, tpr: 0.0 },
          { fpr: 0.4, tpr: 58.0 },
          { fpr: 1.22, tpr: 85.2 },
          { fpr: 3.0, tpr: 91.5 },
          { fpr: 100.0, tpr: 100.0 },
        ],
      },
    ],
  },
];

// Generate 2000 transactions
const tiers = ["new", "established", "vip"];
const paymentMethods = ["card", "wire", "ach", "instant"];
const countries = ["US", "CA", "GB", "DE", "FR", "SG", "AU"];
const fraudTypes = ["account_takeover", "card_cloned", "phishing_bot", "synthetic_id"];

const transactions = [];

for (let i = 1; i <= 2000; i++) {
  const padId = String(i).padStart(4, "0");
  const id = `tx_${padId}`;

  const isFraud = rng() < 0.038; // ~3.8% fraud in sample
  const tier = tiers[Math.floor(rng() * tiers.length)];
  const method = paymentMethods[Math.floor(rng() * paymentMethods.length)];
  const country = countries[Math.floor(rng() * countries.length)];

  let baseAmount = Math.exp(rng() * 4.5 + 2.5); // log-normal amount
  if (baseAmount > 9800) baseAmount = 9800;
  const amount = Math.round(baseAmount * 100) / 100;

  const velocity1h = Math.floor(rng() * (isFraud ? 12 : 3));
  const deviceTrust = isFraud ? Math.round(rng() * 0.45 * 100) / 100 : Math.round((0.55 + rng() * 0.45) * 100) / 100;
  const riskScore = isFraud ? Math.round((0.68 + rng() * 0.3) * 100) / 100 : Math.round((rng() * 0.38) * 100) / 100;

  const observable = {
    amount,
    currency: "USD",
    customer_age_days: tier === "new" ? Math.floor(rng() * 30 + 1) : Math.floor(rng() * 1200 + 60),
    velocity_1h: velocity1h,
    device_trust: deviceTrust,
    cross_border: country !== "US",
  };

  const hidden = {
    is_positive: isFraud,
    true_label: isFraud ? fraudTypes[Math.floor(rng() * fraudTypes.length)] : "legitimate_customer",
    metadata: {
      account_tenure_months: tier === "new" ? 1 : 24,
      historical_dispute_count: isFraud ? Math.floor(rng() * 3 + 1) : 0,
    },
  };

  // Policy decisions
  const doNothingDecision = { decision: "ALLOW", confidence: 1.0 };
  
  let ruleDecision = { decision: "ALLOW", confidence: 0.85 };
  if (amount > 3000 || velocity1h > 4 || (observable.cross_border && amount > 1500)) {
    ruleDecision = { decision: isFraud ? "BLOCK" : (rng() < 0.4 ? "BLOCK" : "REVIEW"), confidence: 0.90 };
  }

  let mlDecision = { decision: "ALLOW", confidence: 1.0 - riskScore, score: riskScore };
  if (riskScore > 0.70) {
    mlDecision = { decision: "BLOCK", confidence: riskScore, score: riskScore };
  } else if (riskScore > 0.45) {
    mlDecision = { decision: "REVIEW", confidence: riskScore, score: riskScore };
  }

  // Guardrail check: HighValueGuardrail
  let guardrailOverride = false;
  let guardrailVerdict = null;
  let finalDecision = mlDecision.decision;

  if (amount > 5000 && mlDecision.decision === "ALLOW") {
    // High-value check: cannot silently allow > $5,000 without stepped up review
    guardrailOverride = true;
    guardrailVerdict = {
      verdict: "OVERRIDE",
      rule_name: "HighValueGuardrail",
      reason: "HIGH_VALUE_THRESHOLD: Single transfer exceeds $5,000 ceiling. Mandatory step-up review required.",
      modified_action: "REVIEW",
    };
    finalDecision = "REVIEW";
  } else if (amount > 4000 && tier === "vip" && mlDecision.decision === "BLOCK" && !isFraud) {
    // VIP protection rule: do not outright block established VIP without secondary review
    guardrailOverride = true;
    guardrailVerdict = {
      verdict: "OVERRIDE",
      rule_name: "HighValueGuardrail",
      reason: "VIP_RETENTION_RULE: Block downgraded to priority review to prevent good customer disruption.",
      modified_action: "REVIEW",
    };
    finalDecision = "REVIEW";
  }

  // Outcome
  let actualLoss = 0.0;
  let reviewHours = 0.0;
  let customerDelayed = false;

  if (finalDecision === "ALLOW" && isFraud) {
    actualLoss = amount;
  } else if (finalDecision === "REVIEW") {
    reviewHours = 0.25;
    if (!isFraud) customerDelayed = true;
  } else if (finalDecision === "BLOCK" && !isFraud) {
    customerDelayed = true;
  }

  const timestamp = new Date(Date.parse("2026-10-28T08:00:00Z") + i * 18000).toISOString();

  // 6 Audit steps
  const auditSteps = [
    {
      step: 1,
      phase: "INPUT_RECEIVED",
      title: "Input received at API gateway",
      detail: `Transaction payload ${id} received via ${method.toUpperCase()} channel from ${country}.`,
      data: { amount, customer_tier: tier, ip_country: country },
    },
    {
      step: 2,
      phase: "FEATURES_EXTRACTED",
      title: "Observable state features derived",
      detail: `Derived 14 features. 1h velocity=${velocity1h}, device_trust=${deviceTrust}. Hidden ground truth masked.`,
      data: observable,
    },
    {
      step: 3,
      phase: "POLICY_EVALUATED",
      title: `Policy evaluated: proposed ${mlDecision.decision}`,
      detail: `ML threshold model assigned risk score ${riskScore} (confidence ${mlDecision.confidence}). Proposed action: ${mlDecision.decision}.`,
      data: mlDecision,
    },
    {
      step: 4,
      phase: "GUARDRAIL_APPLIED",
      title: guardrailOverride ? "Guardrail issued veto override" : "Guardrail passed without veto",
      detail: guardrailOverride
        ? `HighValueGuardrail intercepted: ${guardrailVerdict.reason} (Action modified: ${mlDecision.decision} \u2192 ${guardrailVerdict.modified_action})`
        : "Pure deterministic guardrails evaluated preconditions: no veto triggered. Safe-default preserved.",
      data: guardrailVerdict || { verdict: "ALLOW", rule_name: "HighValueGuardrail", reason: "PRECONDITIONS_SATISFIED" },
      override: guardrailOverride,
    },
    {
      step: 5,
      phase: "FINAL_ACTION",
      title: `Final action resolved: ${finalDecision}`,
      detail: `Action executed in environment: ${finalDecision}. State record written to append-only store.`,
      data: { decision: finalDecision },
    },
    {
      step: 6,
      phase: "OUTCOME_RESOLVED",
      title: "Outcome evaluated against hidden ground truth",
      detail: isFraud
        ? (finalDecision === "ALLOW" ? `Uncaught fraud loss: -$${amount.toFixed(2)}` : `Fraud caught: loss prevented`)
        : (finalDecision === "ALLOW" ? `Frictionless customer clearance ($0 loss)` : `Review friction: ${reviewHours}h delay incurred`),
      data: { actual_loss: actualLoss, review_hours: reviewHours, is_fraud: isFraud },
    },
  ];

  transactions.push({
    id,
    timestamp,
    amount,
    currency: "USD",
    customer_id: `cust_${1000 + (i % 380)}`,
    customer_tier: tier,
    payment_method: method,
    ip_country: country,
    observable,
    hidden,
    policies: {
      do_nothing: doNothingDecision,
      rules: ruleDecision,
      ml_threshold: mlDecision,
      ml_guarded: {
        proposed: mlDecision,
        final: { decision: finalDecision },
        guardrail_override: guardrailOverride,
        verdict: guardrailVerdict,
      },
    },
    guardrail: {
      override: guardrailOverride,
      rule_name: guardrailVerdict ? guardrailVerdict.rule_name : "HighValueGuardrail",
      reason: guardrailVerdict ? guardrailVerdict.reason : "PASS",
      verdict: guardrailVerdict ? guardrailVerdict.verdict : "ALLOW",
    },
    final_decision: finalDecision,
    outcome: {
      actual_loss: actualLoss,
      review_hours: reviewHours,
      customer_delayed: customerDelayed,
      is_positive: isFraud,
    },
    audit_steps: auditSteps,
  });
}

// Write runs.json
fs.writeFileSync(path.join(__dirname, "runs.json"), JSON.stringify(runs, null, 2));
console.log(`Generated runs.json (${runs.length} runs)`);

// Write transactions.json
fs.writeFileSync(path.join(__dirname, "transactions.json"), JSON.stringify(transactions, null, 2));
console.log(`Generated transactions.json (${transactions.length} transactions)`);

// Generate Markdown reports
const reportsDir = path.join(__dirname, "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const baselineReportMd = `# EVALUATION REPORT: payments_fraud_synthetic

## Meta
- Pack: packs/payments_fraud
- Scenario: payments_fraud_synthetic
- Commit hash: 21cccf137840c59cc617a3ce9129fa016a02eb33
- Date: 2026-10-28T14:30:00Z
- Python / key library versions: Python 3.12.0, numpy 1.26.2, pydantic 2.5.2
- Seeds evaluated: 20 seeds (paired evaluation)
- Resamples: 10,000 paired bootstrap, percentile method (fixed seed 42)
- Sample size per seed: n = 2,000 transactions

## Executive Summary
Evaluation performed on simulated payment transactions comparing four candidate decision policies against the zero-intervention baseline. Every metric reports 95% bootstrap confidence intervals and explicit sample size tags.

## Comparative Results (SIMULATED)

| Policy | Net Benefit (USD) | Fraud Caught (%) | False Positive Rate (%) | Review Load (hrs) | P95 Harm Ratio | Overrides |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DoNothingPolicy** (Baseline) | $0.00 [0, 0] | 0.0% [0.0, 0.0] | 0.00% [0.00, 0.00] | 0.0 [0, 0] | 1.000 | 0 |
| **RuleBasedFraudPolicy** | +$412,850 [+$401,200, +$424,500] | 74.2% [71.5, 76.8] | 1.84% [1.45, 2.23] | 48.2 [44.1, 52.3] | 0.285 | 18 |
| **ThresholdModelFraudPolicy** | +$684,200 [+$675,100, +$693,300] | 88.6% [86.4, 90.7] | 0.91% [0.65, 1.18] | 24.5 [21.8, 27.2] | 0.124 | 32 |
| **ThresholdModel + HighValueGuardrail** | **+$749,150 [+$742,000, +$756,300]** | **92.4% [90.5, 94.2]** | **0.62% [0.42, 0.83]** | **14.8 [12.6, 17.0]** | **0.078** | **47** |

*All figures: SIMULATED. Evaluated across 20 random seeds, n = 2,000 transactions per seed.*

## Safety Invariant Verification
- \`test_policy_never_receives_hidden\`: PASS (Runtime type isolation verified)
- \`test_outcome_independent_of_label_shortcut\`: PASS (Evaluated on randomized labels)
- \`test_same_seed_same_hash\`: PASS (Bit-identical execution confirmed)
- \`test_guardrail_veto_cannot_be_bypassed\`: PASS (47 high-value vetoes logged)
- \`test_lift_not_above_attributed\`: PASS (Measured lift $749,150 <= Attributed $755,000)

## Attribution & Disparity Slices
- Lowest customer tier (New accounts): False positive rate 0.84% [0.55%, 1.15%]
- Highest customer tier (VIP accounts): False positive rate 0.32% [0.18%, 0.49%]
- Disparity gap: 0.52% (No HARM FLAG triggered; threshold < 2.0x average)

---
*Report generated by Lift Evaluation Engine. Artifact ID: art_9812bf1.*
`;

const stressReportMd = `# EVALUATION REPORT: payments_fraud_stress_ring

## Meta
- Pack: packs/payments_fraud
- Scenario: payments_fraud_stress_ring (Held-Out Stress Evaluation)
- Commit hash: 21cccf137840c59cc617a3ce9129fa016a02eb33
- Date: 2026-10-29T09:15:00Z
- Python / key library versions: Python 3.12.0, numpy 1.26.2, pydantic 2.5.2
- Seeds evaluated: 20 seeds (paired evaluation)
- Resamples: 10,000 paired bootstrap, percentile method (fixed seed 101)
- Sample size per seed: n = 2,000 transactions

## Adversarial Stress Conditions
Simulated fraud attack involving coordinated botnet burst (3.5x volume multiplier, rotating residential proxies, randomized transaction amounts below historical thresholds).

## Comparative Stress Results (SIMULATED)

| Policy | Net Benefit (USD) | Fraud Caught (%) | False Positive Rate (%) | Review Load (hrs) | P95 Harm Ratio | Overrides |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DoNothingPolicy** (Baseline) | $0.00 [0, 0] | 0.0% [0.0, 0.0] | 0.00% [0.00, 0.00] | 0.0 [0, 0] | 1.000 | 0 |
| **RuleBasedFraudPolicy** | +$310,500 [+$295,000, +$326,000] | 59.1% [55.4, 62.8] | 3.20% [2.75, 3.65] | 84.1 [78.5, 89.7] | 0.442 | 38 |
| **ThresholdModelFraudPolicy** | +$542,000 [+$528,000, +$556,000] | 78.4% [75.2, 81.6] | 1.85% [1.48, 2.22] | 46.2 [41.5, 50.9] | 0.215 | 64 |
| **ThresholdModel + HighValueGuardrail** | **+$628,900 [+$618,500, +$639,300]** | **85.2% [82.6, 87.8]** | **1.22% [0.92, 1.52]** | **29.4 [25.8, 33.0]** | **0.138** | **89** |

*All figures: SIMULATED. Evaluated across 20 random seeds under adversarial burst conditions.*

## Observations & Known Limits
1. Under distributed attacks, the static rule set experienced significant degradation (fraud detection dropped from 74.2% to 59.1%).
2. The guarded model demonstrated superior resilience, retaining 85.2% fraud detection by combining model scores with deterministic transaction velocity guardrails.
3. Review load increased across all policies, with 89 guardrail overrides actively protecting against high-velocity automated sweeps.

---
*Report generated by Lift Evaluation Engine. Artifact ID: art_9812bf2.*
`;

fs.writeFileSync(path.join(reportsDir, "payments_fraud_baseline.md"), baselineReportMd);
fs.writeFileSync(path.join(reportsDir, "stress_scenario_report.md"), stressReportMd);
console.log("Generated fixture reports in dashboard/fixtures/reports/");

