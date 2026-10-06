export const TOTAL_SHARES = 1_000_000;
export const QUORUM_PERCENT = 51.0;
export const QUORUM_VOTES_REQUIRED = 510_000; // 51% of 1,000,000
export const DIVIDEND_PRECISION = 1_000_000_000_000_000_000; // 1e18 (ACC_PRECISION in ventrion_core)

// =============================================================================
// SOLANA DEVNET DEPLOYMENT CONSTANTS & ADDRESSES (LIVE CLUSTER VERIFIED)
export const HELIUS_DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=97301aa7-addf-4cd6-86b5-04612d19ad56";
export const HELIUS_DEVNET_WSS = "wss://devnet.helius-rpc.com/?api-key=97301aa7-addf-4cd6-86b5-04612d19ad56";
export const DEVNET_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || HELIUS_DEVNET_RPC;
export const DEVNET_WSS_URL = process.env.NEXT_PUBLIC_SOLANA_WS_URL || HELIUS_DEVNET_WSS;
export const DEVNET_PROGRAM_ID = "37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8";
export const DEVNET_DEPLOYER_KEY = "2K9r52f1ZxuB1BQ1hhZWFgk1cGPcf7ucdvDHkGgf82TV";
export const DEVNET_GLOBAL_CONFIG_PDA = "9W5BqZ32GkZyhbs6KqhfWCNwi1KXNiZemBerMsb2n57M";
export const DEVNET_VENT_STAKE_VAULT_PDA = "64JBeV2b8XTHJqgeaLoD93Z5zH4Afic98idfGbBaVkd6";
export const DEVNET_VENT_MINT = "5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ";
export const DEVNET_USDC_MINT = "5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt";
export const DEVNET_DLMM_PRESET_PARAMETER = "4vP4DFDJLRz85NBCfJALYPNdieWwzQSstrUuTms1gekn";

// Pioneer Venture 1 ($PVENT) - Live Post-Graduation State
export const DEVNET_PIONEER_VENTURE_PDA = "GsPUAiuzCcr1PnrkxSXQYosJMYLroDy8tnfcF8YfWSmG";
export const DEVNET_PIONEER_VENTURE_MINT = "5SgXQXjGZ9grLTYZkZkVHzaLCMqMWN5PsD472Dg9KiSn";
export const DEVNET_PIONEER_FUNDING_ROUND_0_PDA = "ofPFE4gdAg7wkS3NLLPh4vZBMfh7SY5qtuuXq8kJ6ZZ";
export const DEVNET_PIONEER_RECEIPT_MINT_PDA = "GWyp7KVHoyGZFxsSWMVsDZcpLemPZgsNJAno7X5myKY9";
export const DEVNET_PIONEER_METEORA_LB_PAIR = "Fttz288rQqJX93ayuNGBZyDMdgfhyU76x5n3pR9GSN9h";
export const DEVNET_PIONEER_STATUS = "GraduatedDLMMLive";
export const DEVNET_PIONEER_DLMM_RESERVE_X_PVENT = "B94c7Meb8CQUx7hbzqKFGFRs4jyFCBPgxKL47YULBfvV";
export const DEVNET_PIONEER_DLMM_RESERVE_Y_USDC = "adNDo8J6unTz3jimQUFTr6J45YXd43x6yHw9fZ449ki";
export const DEVNET_PIONEER_MASTER_LOCK_VAULT = "HccspiobbsMgm8yMdVTRfW4peebray7JA8fdJrsjdhC";
export const DEVNET_PIONEER_DIVIDEND_VAULT = "D1V21FL2ofrFePRUicQiGBiPtphGwpKRSVNLWcdcyyew";
export const DEVNET_PIONEER_STAKED_SHARES_VAULT = "3b9TFYemxrRs6EibT53GF4BrSSUvJG8W9AtNeFJBNNKt";
export const DEVNET_PIONEER_MILESTONE_ESCROW = "9oHnjiAfiPj645NyEKVzsveKgNDou8mLADMpgHmzPmdb";
export const DEVNET_PIONEER_MILESTONE_USDC_VAULT = "79AGSm67xMAbkrqUYsuqNCe9Z8cF8yEEUDk2p1MDfNzy";

// Pilot Venture 2 ($QCMP - Metaplex Verified)
export const DEVNET_QCMP_VENTURE_MINT = "Bs2nqzTGTt3EqAjzvpcpnGRagMd9QWELxnENYTh83i1E";
export const DEVNET_QCMP_METAPLEX_METADATA_PDA = "AAJwDz75nu3oxL23xQzxTUgQYdR7T5F1b9YU5s4b8GzH";
export const DEVNET_QCMP_METEORA_DLMM_POOL = "CKfSPXBoLq2Xp5KNPDdp6wKYRBMX5FtMYja8HJKQEvDh";
export const METAPLEX_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const DEFAULT_VENTURE = {
  name: "Ventrion Pioneer 1 ($PVENT)",
  symbol: "$PVENT",
  founder: "2K9r5...82TV",
  totalShares: TOTAL_SHARES,
  quorumVotes: QUORUM_VOTES_REQUIRED,
  reserveRateBps: 1000, // 10%
  ceoSalaryBps: 500,    // 5%
  cogsUsdc: 24.0,
  priceUsdc: 60.0,
  supplierName: "Apex PrintWorks (Berlin, DE)",
  supplierWallet: "9xQeWvG816bUx9EPjHmaT23yvVM2VXmzLsDaA88Wv",
};
