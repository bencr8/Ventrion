import { VTrustTier } from "./vTrust";

export interface MilestoneItem {
  id: number;
  title: string;
  description: string;
  percentageBps: number;
  amountUsdc: number;
  targetDays: number;
  status: "completed" | "in_review" | "pending";
  votesFor: number;
  votesAgainst: number;
  vetoPercentage: number;
  amendmentCount?: number;
  proposedDate?: string;
}

export interface VentureProduct {
  id: string;
  name: string;
  description: string;
  priceUsdc: number;
  cogsUsdc: number;
  grossMarginPercentage: number;
  dividendSplitPercentage: number; // e.g. 20%
  imageUrl: string;
}

export type VentureCategory = "AI & Compute" | "Hardware" | "Real Commerce";

export interface Venture {
  id: string;
  name: string;
  symbol: string;
  ticker: string;
  tagline: string;
  description: string;
  category: VentureCategory;
  canonicalStatus?: "Raising" | "Migrating" | "Funded";
  legalEntity: string;
  registrationNumber: string;
  statusBadge: string;
  sharePriceUsdc: number;
  marketCapUsdc: number;
  targetFundingCapUsdc?: number;
  totalCapitalRaisedUsdc?: number;
  fundingProgressPercent?: number;
  valuationSol?: number;
  lockedEscrowUsdc: number;
  currentDividendYield: number; // %
  logoUrl: string;
  bannerUrl?: string;
  mintAddress: string;
  receiptMint?: string;
  metaplexMetadataPda?: string;
  meteoraDbcPool?: string;
  meteoraDlmmPool?: string;
  founderAddress: string;
  totalShares: number; // Invariant: exactly 1,000,000 shares
  circulatingFloat: number;
  dlmmLockedShares: number; // exactly 17% = 170,000 shares
  founderVestingShares: number;
  progressPercentage: number;
  founderLockMonths: number;
  founderLockPercentage: number;
  vTrustTier: VTrustTier;
  schufaRating: VTrustTier;
  totalDividendsPaidUsdc: number;
  totalStakedInVaults?: number;
  totalDividendsDistributed?: number;
  dividendSplitBps?: number;
  currentApy: number;
  activeRound: number;
  milestones: MilestoneItem[];
  products: VentureProduct[];
}

export const VERIFIED_VENTURES: Venture[] = [
  {
    id: "Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E",
    name: "QuantumCompute Systems",
    symbol: "QCMP",
    ticker: "$QCMP",
    canonicalStatus: "Funded",
    tagline: "Next-Generation Photonic Quantum Computing tokenized under MIDAO DAO LLC framework.",
    description: "QuantumCompute Systems ($QCMP) is verified on Solana Devnet with full Metaplex Token Metadata V3, verified 1,000,000 fixed share cap, permanently revoked mint authority (null), and live graduated Meteora DLMM pool CKfSPXBoLq2Xp5KNPDdp6wKYRBMX5FtMYja8HJKQEvDh.",
    category: "AI & Compute",
    legalEntity: "MIDAO DAO LLC, Marshall Islands",
    registrationNumber: "MIDAO-QC-84920-REG",
    statusBadge: "Funded",
    sharePriceUsdc: 1.25,
    marketCapUsdc: 1_250_000,
    targetFundingCapUsdc: 20_000,
    totalCapitalRaisedUsdc: 20_000,
    fundingProgressPercent: 100.0,
    valuationSol: 8333,
    lockedEscrowUsdc: 14_000,
    currentDividendYield: 0.0,
    logoUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
    mintAddress: "Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E",
    receiptMint: "qKhbmddUdEMVqJjAbRVrqgST44fCoYes6szeXbBoMAL",
    metaplexMetadataPda: "AAJwDz75nu3oxL23xQzxTUgQYdR7T5F1b9YU5s4b8GzH",
    meteoraDlmmPool: "CKfSPXBoLq2Xp5KNPDdp6wKYRBMX5FtMYja8HJKQEvDh",
    meteoraDbcPool: "CKfSPXBoLq2Xp5KNPDdp6wKYRBMX5FtMYja8HJKQEvDh",
    founderAddress: "2K9r52f1ZxuB1BQ1hhZWFgk1cGPcf7ucdvDHkGgf82TV",
    totalShares: 1_000_000,
    circulatingFloat: 530_000,
    dlmmLockedShares: 170_000,
    founderVestingShares: 300_000,
    progressPercentage: 100.0,
    founderLockPercentage: 30,
    founderLockMonths: 24,
    vTrustTier: "AAA+",
    schufaRating: "AAA+",
    totalDividendsPaidUsdc: 0,
    currentApy: 0,
    activeRound: 0,
    milestones: [
      {
        id: 0,
        title: "Milestone 0: MIDAO DAO LLC & Photonic Foundry Setup",
        description: "MIDAO legal entity formation, optical chip foundry wafer reservations, and 17% Meteora DLMM liquidity lock.",
        percentageBps: 3000,
        amountUsdc: 6_000,
        targetDays: 30,
        status: "completed",
        votesFor: 100,
        votesAgainst: 0,
        vetoPercentage: 0,
        proposedDate: "2026-09-15",
      },
      {
        id: 1,
        title: "Milestone 1: 32-Qubit Photonic Room-Temp QPU Prototype",
        description: "Fabrication of 32-qubit photonic quantum processor operating at room temperature.",
        percentageBps: 3000,
        amountUsdc: 6_000,
        targetDays: 60,
        status: "in_review",
        votesFor: 72,
        votesAgainst: 8,
        vetoPercentage: 10.0,
        proposedDate: "2026-10-01",
      },
      {
        id: 2,
        title: "Milestone 2: Commercial Solana Pay API & 20% Dividend Split",
        description: "Cloud API access to quantum simulator with automated 20% gross revenue distribution into investor dividend vault.",
        percentageBps: 4000,
        amountUsdc: 8_000,
        targetDays: 90,
        status: "pending",
        votesFor: 0,
        votesAgainst: 0,
        vetoPercentage: 0,
        proposedDate: "2026-10-25",
      },
    ],
    products: [
      {
        id: "prod-qcmp-voucher",
        name: "QuantumCompute H100 Node Voucher - 100 Compute Hours",
        description: "On-demand reserved photonic QPU & H100 GPU compute hours with automated Solana Pay revenue split.",
        priceUsdc: 250.0,
        cogsUsdc: 50.0,
        grossMarginPercentage: 80.0,
        dividendSplitPercentage: 20.0,
        imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80",
      },
    ],
  },
  {
    id: "5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn",
    name: "Pioneer Venture 1",
    symbol: "PVENT",
    ticker: "$PVENT",
    canonicalStatus: "Funded",
    tagline: "First tokenized venture on Ventrion Protocol. 1,000,000 shares mathematically hard-capped, primary flat curve raise.",
    description: "Pioneer Venture 1 ($PVENT) is the canonical genesis venture of the Ventrion Protocol on Solana Devnet. Features on-chain $50k USDC primary escrow raise, 14-day $VENT verification voting gate, flat pricing curve, and ragequit floor price backstop.",
    category: "Hardware",
    legalEntity: "MIDAO DAO LLC, Marshall Islands",
    registrationNumber: "MIDAO-PV-10291-REG",
    statusBadge: "Funded",
    sharePriceUsdc: 0.10,
    marketCapUsdc: 100_000,
    targetFundingCapUsdc: 50_000,
    totalCapitalRaisedUsdc: 50_000,
    fundingProgressPercent: 100.0,
    valuationSol: 667,
    lockedEscrowUsdc: 30_000,
    currentDividendYield: 0.0,
    logoUrl: "/ventrion-logo.png",
    mintAddress: "5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn",
    receiptMint: "GWyp7KVHoyGZFxsSWMVsDZcpLemPZgsNJAno7X5myKY9",
    meteoraDbcPool: "ofPFE4gdAg7wkS3NLLPh4vZBMfh7SY5qtuuXq8kJ6ZZ",
    meteoraDlmmPool: "Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h",
    founderAddress: "2K9r52f1ZxuB1BQ1hhZWFgk1cGPcf7ucdvDHkGgf82TV",
    totalShares: 1_000_000,
    circulatingFloat: 400_000,
    dlmmLockedShares: 170_000,
    founderVestingShares: 300_000,
    progressPercentage: 100.0,
    founderLockPercentage: 30,
    founderLockMonths: 12,
    vTrustTier: "AAA+",
    schufaRating: "AAA+",
    totalDividendsPaidUsdc: 0,
    currentApy: 0,
    activeRound: 0,
    milestones: [
      {
        id: 0,
        title: "Milestone 0: Protocol Genesis & Legal Architecture",
        description: "MIDAO DAO LLC operating agreement, Delaware SPV corporate wrap, and 17% DLMM graduation seeding.",
        percentageBps: 3000,
        amountUsdc: 9_300,
        targetDays: 30,
        status: "completed",
        votesFor: 100,
        votesAgainst: 0,
        vetoPercentage: 0,
        proposedDate: "2026-09-10",
      },
      {
        id: 1,
        title: "Milestone 1: Dynamic Liquidity & B2B Settlement Engine",
        description: "Integration of Meteora dynamic fee harvesting and Solana Pay merchant clearing pipeline.",
        percentageBps: 3000,
        amountUsdc: 9_300,
        targetDays: 60,
        status: "completed",
        votesFor: 100,
        votesAgainst: 0,
        vetoPercentage: 0,
        proposedDate: "2026-09-28",
      },
      {
        id: 2,
        title: "Milestone 2: Floor Defense & Arbitrage Backstop",
        description: "Escrow capital reserve backing the ragequit floor with instant pro-rata USDC buyback protection.",
        percentageBps: 4000,
        amountUsdc: 12_400,
        targetDays: 90,
        status: "in_review",
        votesFor: 65,
        votesAgainst: 12,
        vetoPercentage: 15.6,
        proposedDate: "2026-10-04",
      },
    ],
    products: [
      {
        id: "prod-pvent-key",
        name: "Ventrion Sovereign Hardware Signer",
        description: "Cryptographic security key for institutional tokenized share management and multisig governance.",
        priceUsdc: 149.0,
        cogsUsdc: 45.0,
        grossMarginPercentage: 69.8,
        dividendSplitPercentage: 20.0,
        imageUrl: "/products/hardware_key.png",
      },
    ],
  },
  {
    id: "AWYXNVVsgwy4ouk5qAYoLqTbe2VtrWtpvHJuRzyGXXqX",
    name: "Solana BioDynamics",
    symbol: "SBD",
    ticker: "$SBD",
    canonicalStatus: "Raising",
    tagline: "Decentralized bio-simulation & molecular docking compute engine.",
    description: "Solana BioDynamics ($SBD) is tokenized on Solana Devnet under the Ventrion Protocol. Features primary flat curve raise, milestone escrow security, and continuous backstop liquidity.",
    category: "AI & Compute",
    legalEntity: "MIDAO DAO LLC, Marshall Islands",
    registrationNumber: "MIDAO-SBD-91023-REG",
    statusBadge: "Raising",
    sharePriceUsdc: 0.25,
    marketCapUsdc: 250_000,
    targetFundingCapUsdc: 50_000,
    totalCapitalRaisedUsdc: 0,
    fundingProgressPercent: 0.0,
    lockedEscrowUsdc: 0,
    currentDividendYield: 0.0,
    logoUrl: "/ventrion-logo.png",
    mintAddress: "AWYXNVVsgwy4ouk5qAYoLqTbe2VtrWtpvHJuRzyGXXqX",
    receiptMint: "E16sN5yLg4vQkZ5f6jG9mN4oP8rT7uV1wX2yZ3aB4cD5",
    founderAddress: "2K9r52f1ZxuB1BQ1hhZWFgk1cGPcf7ucdvDHkGgf82TV",
    totalShares: 1_000_000,
    circulatingFloat: 200_000,
    dlmmLockedShares: 170_000,
    founderVestingShares: 630_000,
    progressPercentage: 0.0,
    founderLockPercentage: 63,
    founderLockMonths: 24,
    vTrustTier: "AAA+",
    schufaRating: "AAA+",
    totalDividendsPaidUsdc: 0,
    currentApy: 0,
    activeRound: 0,
    milestones: [],
    products: [],
  },
];
