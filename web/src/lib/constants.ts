export const TOTAL_SHARES = 1_000_000;
export const QUORUM_PERCENT = 51.0;
export const QUORUM_VOTES_REQUIRED = 510_000; // 51% of 1,000,000
export const DIVIDEND_PRECISION = 1_000_000_000_000_000_000; // 1e18 (ACC_PRECISION in ventrion_core)

// =============================================================================
// SOLANA DEVNET DEPLOYMENT CONSTANTS & ADDRESSES (LIVE CLUSTER VERIFIED)
// =============================================================================
export const DEVNET_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const DEVNET_PROGRAM_ID = "vENT66Zyif8JMrb6GbkpwmRYhhYYgguZpfErJnrjEpY";
export const DEVNET_LEGACY_PROGRAM_ID = "vENT66Zyif8JMrb6GbkpwmRYhhYYgguZpfErJnrjEpY";
export const DEVNET_DEPLOYER_KEY = "2Yt4xXiyTJD1gN2Bz2c3FoyTWWqFZMsWApoe75DrYbPH";
export const DEVNET_GLOBAL_CONFIG_PDA = "2Hdse1LPfiJRZcxZfKgKZsDXYB1MCBJyBRuZGi9rTzoW";
export const DEVNET_VENT_STAKE_VAULT_PDA = "Bv7CyZCMYnfZYyPRdH34p8F18mAFdeWoLiicXuGY8xYb";
export const DEVNET_MASTER_FEE_VAULT_PDA = "CDLo9pYdLKzULbLNVkFuCJJBfSVxhcXWLh1hXvBsVHxh";
export const DEVNET_VENT_MINT = "5MJffbYDKokyemXzu6YXW2jHd9VPq9Sv1HKPt1xZAAgJ";
export const DEVNET_USDC_MINT = "5dPaWuSzqwQiqP4JqmB8d7HxvigZfBEVFKbR3GNnvUYt";
export const DEVNET_DLMM_PRESET_PARAMETER = "4vP4DFDJLRz85NBCfJALYPNdieWwzQSstrUuTms1gekn";

// Ventrion Protocol Venture ($VENT)
export const DEVNET_VENTRION_VENTURE_MINT = "48X1XhQr7rSLKLQsmwUPyQ7snURtVcprFSWQV8x3YeDU";
export const DEVNET_VENTRION_VENTURE_PDA = "FcLYBmNTL4qDoyRbVkn6ATSEtbLwprZLNbdnjAW8jDck";
export const DEVNET_VENTRION_FUNDING_ROUND_0_PDA = "2EzBRr8FpWbdBfspx1AAa7e5yCMvBaiQxvZ53ESwxvLP";
export const DEVNET_VENTRION_RECEIPT_MINT_PDA = "6h5hcLoR6GmXgaGtsA5rT7qCWKhDEURb5wiVBC5WDQy3";

// Apex Quantum ($APEX)
export const DEVNET_APEX_VENTURE_MINT = "C8UNEaZhDFxy4H8kdhwk3Y4zxDFpPfkLN1E5Hc6ypupJ";
export const DEVNET_APEX_VENTURE_PDA = "5n7DHyU8mT73UpftmemFxHK6jgba7FKiBbPZvan4C3Qn";
export const DEVNET_APEX_FUNDING_ROUND_0_PDA = "HQGn3cN7pke8g2CCon3M67GiWbAuNGqfQpvAa3wzVvtc";
export const DEVNET_APEX_RECEIPT_MINT_PDA = "9XGmReBLjnhXFL9JnNPWrTJWKgt4ux7NUb5T7FPV7xcX";

// Solana BioDynamics ($SBD)
export const DEVNET_SBD_VENTURE_MINT = "3VnWqQjw7T7YGSUVYYgrW6SZavMQ24u1FsrEzDvXwUYC";
export const DEVNET_SBD_VENTURE_PDA = "91FMqn4zTLE2WZ1LT8MzPV4NiciAmHYUr3k5yFdu9WRy";
export const DEVNET_SBD_FUNDING_ROUND_0_PDA = "AaZVxzeT8wZXT1zQWMQMSykRhJ5ZTT9G9hhaHdrHrBx6";
export const DEVNET_SBD_RECEIPT_MINT_PDA = "2rMJ4CsvmjTZQDJbkT6FGmNGxy8fxv2Au8KtkqHSP5xr";

export const METAPLEX_TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const DEFAULT_VENTURE = {
  name: "Ventrion Protocol ($VENT)",
  symbol: "$VENT",
  founder: "2Yt4x...YbPH",
  totalShares: TOTAL_SHARES,
  quorumVotes: QUORUM_VOTES_REQUIRED,
  reserveRateBps: 1000, // 10%
  ceoSalaryBps: 500,    // 5%
  cogsUsdc: 24.0,
  priceUsdc: 0.50,
  supplierName: "Ventrion Core Network",
  supplierWallet: "2Yt4xXiyTJD1gN2Bz2c3FoyTWWqFZMsWApoe75DrYbPH",
};
