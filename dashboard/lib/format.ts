/**
 * Deterministic en-US number and currency formatters.
 * INVARIANT: Always uses "en-US" to prevent locale hydration mismatches.
 * No system-dependent toLocaleString() anywhere in the dashboard.
 */

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdExactFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatUSD(value: number, showSign = false, exact = false): string {
  const abs = Math.abs(value);
  const formatted = exact ? usdExactFormatter.format(abs) : usdFormatter.format(abs);

  if (value === 0) {
    return "$0.00";
  }

  if (showSign && value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

