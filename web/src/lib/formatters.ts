/**
 * Institutional Financial Formatters for Ventrion Terminal
 * Formats values into clean compact notations ($120.4k, $1.52M) rather than raw numbers ($120000).
 */

export function formatCompactUsdc(val: number, includeDollar: boolean = true): string {
  if (isNaN(val) || val === null || val === undefined) {
    return includeDollar ? "$0.00" : "0.00";
  }

  const prefix = includeDollar ? "$" : "";
  const abs = Math.abs(val);

  if (abs >= 1_000_000_000) {
    return `${prefix}${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${prefix}${(val / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${prefix}${(val / 1_000).toFixed(1)}k`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(val / 1_000).toFixed(2)}k`;
  }
  return `${prefix}${val.toFixed(2)}`;
}

export function formatCompactShares(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "0";
  const abs = Math.abs(val);

  if (abs >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${(val / 1_000).toFixed(1)}k`;
  }
  return Math.round(val).toLocaleString();
}
