/**
 * Shared data types for Lift Console.
 * Can be safely imported in both Client and Server Components.
 */

export interface MetricWithCI {
  mean: number;
  lo: number;
  hi: number;
  n: number;
  unit: string;
}

export interface PolicyResult {
  policy_id: string;
  name: string;
  type: "baseline" | "rules" | "learned" | "guarded";
  is_baseline: boolean;
  description: string;
  metrics: {
    net_benefit: MetricWithCI;
    lift_vs_baseline: MetricWithCI;
    fraud_caught_rate: MetricWithCI;
    false_positive_rate: MetricWithCI;
    review_load_hours: MetricWithCI;
    p95_harm_ratio: MetricWithCI;
    guardrail_overrides: number;
    attributed_benefit: number;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
}

export interface RunData {
  run_id: string;
  pack: string;
  scenario: string;
  scenario_description: string;
  created_at: string;
  seed: number;
  seeds_evaluated: number;
  sample_size_n: number;
  events_digest: string;
  config: Record<string, unknown>;
  pareto_frontier: Array<{
    policy_id: string;
    cost: number;
    fraud_caught: number;
    label: string;
  }>;
  policies: PolicyResult[];
  is_demo?: boolean;
}

export interface AuditStep {
  step: number;
  phase: string;
  title: string;
  detail: string;
  data: Record<string, unknown>;
  override?: boolean;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  customer_id: string;
  customer_tier: "new" | "established" | "vip";
  payment_method: "card" | "wire" | "ach" | "instant";
  ip_country: string;
  observable: Record<string, unknown>;
  hidden: Record<string, unknown>;
  policies: Record<string, unknown>;
  guardrail: {
    override: boolean;
    rule_name: string;
    reason: string;
    verdict: string;
  };
  final_decision: "ALLOW" | "BLOCK" | "REVIEW";
  outcome: {
    actual_loss: number;
    review_hours: number;
    customer_delayed: boolean;
    is_positive: boolean;
  };
  audit_steps: AuditStep[];
}

export interface ReportItem {
  id: string;
  title: string;
  scenario: string;
  date: string;
  filename: string;
  content: string;
  is_demo?: boolean;
}
