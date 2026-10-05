/**
 * Ventrion V-Score Integrity Standard (colloquially V-Score)
 * 
 * Citadel-Grade Sovereign Founder Trust Matrix:
 * - AAA+ (Citadel Grade): Strictly requires 100% Dev Lock, >=75% Escrow Retention, >=24 Mo Lock & On-Chain Governance!
 * - AAA: Strictly requires 100% Dev Lock, >=60% Escrow Retention, >=12 Mo Lock
 * - AA+: Strictly requires 100% Dev Lock, >=50% Escrow Retention, >=6 Mo Lock (Shorter lock duration, but strictly 100% dev equity)
 * - AA:  >=75% Dev Lock, >=50% Escrow Retention
 * - A:   >=60% Dev Lock, >=40% Escrow Retention
 * - B:   >=40% Dev Lock
 * - C:   >=20% Dev Lock
 * - D (High Risk / Degen): <20% Dev Lock or 0% Escrow Retention (pump.fun style)
 */

export type VTrustTier = "AAA+" | "AAA" | "AA+" | "AA" | "A" | "B" | "C" | "D (High Risk)";
export type VScoreTier = VTrustTier;

export interface VTrustEvaluationParams {
  founderLockPct: number;         // 0 to 100 (% of dev/founder tokens locked)
  founderLockMonths: number;      // e.g. 0 to 48
  escrowRetentionPct: number;     // 0 to 100 (funds locked under milestone voting)
  governanceEnabled: boolean;     // CEO proposals & shareholder voting active
}

export function computeVTrustRating(params: VTrustEvaluationParams): {
  tier: VTrustTier;
  score: number;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  isCitadelGrade: boolean;
  explanation: string;
} {
  const { founderLockPct, founderLockMonths, escrowRetentionPct, governanceEnabled } = params;

  // Tier 1: AAA+ (Citadel Grade)
  // Hard Requirements: Strictly 100% founder tokens locked, >=75% capital retained in milestone escrow, >=24 mo, governance active
  if (
    founderLockPct >= 100 &&
    escrowRetentionPct >= 75 &&
    founderLockMonths >= 24 &&
    governanceEnabled
  ) {
    return {
      tier: "AAA+",
      score: 100,
      badgeLabel: "V-Score AAA+ (Citadel)",
      badgeColor: "text-emerald-400",
      badgeBg: "bg-emerald-950/60 border-emerald-500/50",
      isCitadelGrade: true,
      explanation: "Maximum alignment: 100% of founder equity locked for 2+ years, >=75% capital custody-escrowed with decentralized milestone governance."
    };
  }

  // Tier 2: AAA
  // Hard Requirements: Strictly 100% founder tokens locked, >=60% milestone escrow retention, >=12 mo
  if (founderLockPct >= 100 && escrowRetentionPct >= 60 && founderLockMonths >= 12) {
    return {
      tier: "AAA",
      score: 92,
      badgeLabel: "V-Score AAA",
      badgeColor: "text-teal-400",
      badgeBg: "bg-teal-950/60 border-teal-500/50",
      isCitadelGrade: false,
      explanation: "Ultra-high commitment: 100% founder/dev tokens locked for 12+ months with >=60% milestone escrow retention."
    };
  }

  // Tier 3: AA+
  // Hard Requirements: Strictly 100% founder tokens locked, >=50% escrow retention, >=6 mo (shorter lock period but 100% dev equity)
  if (founderLockPct >= 100 && escrowRetentionPct >= 50 && founderLockMonths >= 6) {
    return {
      tier: "AA+",
      score: 85,
      badgeLabel: "V-Score AA+",
      badgeColor: "text-cyan-400",
      badgeBg: "bg-cyan-950/60 border-cyan-500/50",
      isCitadelGrade: false,
      explanation: "Strict alignment: 100% of founder/dev equity locked (6+ months duration) with >=50% milestone escrow retention."
    };
  }

  // Tier 4: AA
  if (founderLockPct >= 75 && escrowRetentionPct >= 50) {
    return {
      tier: "AA",
      score: 76,
      badgeLabel: "V-Score AA",
      badgeColor: "text-blue-400",
      badgeBg: "bg-blue-950/60 border-blue-500/50",
      isCitadelGrade: false,
      explanation: "Substantial founder lock (75%+) with milestone protection."
    };
  }

  // Tier 5: A
  if (founderLockPct >= 60 && escrowRetentionPct >= 40) {
    return {
      tier: "A",
      score: 65,
      badgeLabel: "V-Score A",
      badgeColor: "text-yellow-400",
      badgeBg: "bg-yellow-950/60 border-yellow-500/50",
      isCitadelGrade: false,
      explanation: "Moderate founder lock (60%+) and standard escrow."
    };
  }

  // Tier 6: B
  if (founderLockPct >= 40) {
    return {
      tier: "B",
      score: 48,
      badgeLabel: "V-Score B",
      badgeColor: "text-orange-400",
      badgeBg: "bg-orange-950/60 border-orange-500/50",
      isCitadelGrade: false,
      explanation: "Partial lock (40%+). Founder retains liquid tokens at launch."
    };
  }

  // Tier 7: C
  if (founderLockPct >= 20) {
    return {
      tier: "C",
      score: 30,
      badgeLabel: "V-Score C",
      badgeColor: "text-amber-500",
      badgeBg: "bg-amber-950/60 border-amber-500/50",
      isCitadelGrade: false,
      explanation: "Low founder lock (20%+). Significant early dilution potential."
    };
  }

  // Tier 8: D (High Risk / Degen)
  return {
    tier: "D (High Risk)",
    score: 10,
    badgeLabel: "V-Score D (Degen / High Risk)",
    badgeColor: "text-red-400",
    badgeBg: "bg-red-950/60 border-red-500/50",
    isCitadelGrade: false,
    explanation: "High Rug-Pull Risk: Less than 20% founder equity locked or 0% milestone escrow retention."
  };
}

export const computeVScore = computeVTrustRating;

