import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  ComputeBudgetProgram,
  SystemProgram,
} from "@solana/web3.js";
import {
  DEVNET_USDC_MINT,
  DEVNET_PROGRAM_ID,
  METAPLEX_TOKEN_METADATA_PROGRAM_ID,
} from "../constants";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "./ventrionProgram";

export interface LaunchGenesisParams {
  founderPubkey: string;
  name: string;
  symbol: string;
  uri?: string;
  equitySalePercent: number;
  fundingTargetUsdc: number;
  upfrontRunwayPercent: number;
  vestingCliffMonths?: number;
  vestingDurationYears?: number;
  milestones?: Array<{ percentageBps: number; targetDays?: number }>;
}

export interface ContributeRoundParams {
  investorPubkey: string;
  companyMint: string;
  usdcAmount: number; // in micro-USDC (6 decimals)
}

export interface SellPrimaryRoundParams {
  investorPubkey: string;
  companyMint: string;
  receiptAmount: number; // in receipt atoms (6 decimals)
}

export interface RedeemSharesParams {
  investorPubkey: string;
  companyMint: string;
  sharesAmount: number;
}

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64");
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sends a POST request to the Express backend transaction builder.
 * Tries multiple canonical mount points:
 *  1. /ventrion/api/tx/${endpoint}
 *  2. /api/tx/${endpoint}
 *  3. /ventrion/api/ventures/tx/${endpoint}
 *  4. /api/ventures/tx/${endpoint}
 */
async function postToTxApi(endpoint: string, body: Record<string, any>): Promise<any> {
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const candidates = [
    `/ventrion/api/tx/${cleanEndpoint}`,
    `/api/tx/${cleanEndpoint}`,
    `/ventrion/api/ventures/tx/${cleanEndpoint}`,
    `/api/ventures/tx/${cleanEndpoint}`,
    `/ventrion/api/ventures/${cleanEndpoint}`,
    `/api/ventures/${cleanEndpoint}`,
  ];

  let lastError: Error | null = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return json;
        } else if (json.error) {
          throw new Error(json.error);
        }
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError || new Error(`Failed to call transaction builder at /api/tx/${cleanEndpoint}`);
}

/**
 * AUFGABE 2.1: LAUNCH VENTURE GENESIS
 * 1. Requests prepared & partially signed genesis transaction from backend
 * 2. Deserializes Base64 transaction
 * 3. Signs with user's Solana wallet (Phantom / Solflare / Ephemeral)
 * 4. Broadcasts raw transaction to Solana Devnet
 * 5. Confirms on-chain and returns signature & new companyMint
 */
export async function executeLaunchGenesis(
  params: LaunchGenesisParams,
  wallet: any,
  connection: Connection
): Promise<{ signature: string; companyMint: string; milestonesSignature?: string }> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected. Please connect your Solana wallet.");
  }
  if (!wallet.signTransaction) {
    throw new Error("Connected wallet does not support signTransaction.");
  }

  // 1. Request prepared transaction from backend
  const data = await postToTxApi("prepare-launch-genesis", {
    founderPubkey: params.founderPubkey || wallet.publicKey.toBase58(),
    name: params.name,
    symbol: params.symbol,
    uri: params.uri,
    equitySalePercent: params.equitySalePercent,
    fundingTargetUsdc: params.fundingTargetUsdc,
    upfrontRunwayPercent: params.upfrontRunwayPercent,
    vestingCliffMonths: params.vestingCliffMonths || 6,
    vestingDurationYears: params.vestingDurationYears || 2,
    milestones: params.milestones,
  });

  if (!data?.transactionBase64 || !data?.companyMint) {
    throw new Error("Backend did not return valid genesis transactionBase64");
  }

  // 2. Deserialize transaction(s)
  const tx1Bytes = base64ToUint8Array(data.transactionBase64);
  const tx1 = Transaction.from(tx1Bytes);

  let tx2: Transaction | null = null;
  if (data.milestonesTransactionBase64) {
    const tx2Bytes = base64ToUint8Array(data.milestonesTransactionBase64);
    tx2 = Transaction.from(tx2Bytes);
  }

  // 3. Prompt wallet to sign
  let signedTx1: Transaction;
  let signedTx2: Transaction | null = null;

  if (tx2 && typeof wallet.signAllTransactions === "function") {
    try {
      const signedAll = await wallet.signAllTransactions([tx1, tx2]);
      signedTx1 = signedAll[0];
      signedTx2 = signedAll[1];
    } catch {
      signedTx1 = await wallet.signTransaction(tx1);
      signedTx2 = await wallet.signTransaction(tx2);
    }
  } else {
    signedTx1 = await wallet.signTransaction(tx1);
    if (tx2) {
      signedTx2 = await wallet.signTransaction(tx2);
    }
  }

  // 4. Broadcast and confirm TX 1 (Genesis Launch with Metaplex Metadata)
  const rawTx1 = signedTx1.serialize();
  const signature1 = await connection.sendRawTransaction(rawTx1, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature: signature1,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  // 5. Broadcast and confirm TX 2 (Milestone Roadmap Configuration)
  let signature2: string | null = null;
  if (signedTx2) {
    try {
      const rawTx2 = signedTx2.serialize();
      signature2 = await connection.sendRawTransaction(rawTx2, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      const lbh2 = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature: signature2,
          blockhash: lbh2.blockhash,
          lastValidBlockHeight: lbh2.lastValidBlockHeight,
        },
        "confirmed"
      );
    } catch (mErr: any) {
      console.warn("Milestone configuration confirmation warning:", mErr);
    }
  }

  return {
    signature: signature1,
    milestonesSignature: signature2 || undefined,
    companyMint: data.companyMint,
  };
}

/**
 * AUFGABE 2.2: CONTRIBUTE TO FUNDING ROUND
 * 1. Requests prepared contribute transaction from backend
 * 2. Deserializes Base64 transaction
 * 3. Signs with user's Solana wallet
 * 4. Broadcasts raw transaction to Solana Devnet
 * 5. Confirms on-chain and returns signature
 */
export async function executeContributeRound(
  params: ContributeRoundParams,
  wallet: any,
  connection: Connection
): Promise<{ signature: string }> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected. Please connect your Solana wallet.");
  }
  if (!wallet.signTransaction) {
    throw new Error("Connected wallet does not support signTransaction.");
  }

  // 1. Request prepared transaction from backend
  const data = await postToTxApi("prepare-contribute-round", {
    investorPubkey: params.investorPubkey || wallet.publicKey.toBase58(),
    companyMint: params.companyMint,
    usdcAmount: params.usdcAmount,
  });

  if (!data?.transactionBase64) {
    throw new Error("Backend did not return valid contribute transactionBase64");
  }

  // 2. Deserialize transaction
  const txBytes = base64ToUint8Array(data.transactionBase64);
  const transaction = Transaction.from(txBytes);

  // 3. Prompt wallet to sign
  const signedTx = await wallet.signTransaction(transaction);

  // 4. Broadcast raw transaction
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  // 5. Confirm on-chain
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return { signature };
}

/**
 * AUFGABE 2.3: SELL PRIMARY ROUND (REFUND ON FLAT CURVE)
 * 1. Requests prepared sell transaction from backend
 * 2. Deserializes Base64 transaction
 * 3. Signs with user's Solana wallet
 * 4. Broadcasts raw transaction to Solana Devnet
 * 5. Confirms on-chain and returns signature
 */
export async function executeSellPrimaryRound(
  params: SellPrimaryRoundParams,
  wallet: any,
  connection: Connection
): Promise<{ signature: string }> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected. Please connect your Solana wallet.");
  }
  if (!wallet.signTransaction) {
    throw new Error("Connected wallet does not support signTransaction.");
  }

  // 1. Request prepared transaction from backend
  const data = await postToTxApi("prepare-sell-primary-round", {
    investorPubkey: params.investorPubkey || wallet.publicKey.toBase58(),
    companyMint: params.companyMint,
    receiptAmount: params.receiptAmount,
  });

  if (!data?.transactionBase64) {
    throw new Error("Backend did not return valid sell transactionBase64");
  }

  // 2. Deserialize transaction
  const txBytes = base64ToUint8Array(data.transactionBase64);
  const transaction = Transaction.from(txBytes);

  // 3. Prompt wallet to sign
  const signedTx = await wallet.signTransaction(transaction);

  // 4. Broadcast raw transaction
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  // 5. Confirm on-chain
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return { signature };
}

/**
 * AUFGABE 2.4: REDEEM PRIMARY RECEIPTS FOR 1:1 SHARES
 */
export async function executeRedeemShares(
  params: RedeemSharesParams,
  wallet: any,
  connection: Connection
): Promise<{ signature: string }> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected. Please connect your Solana wallet.");
  }
  if (!wallet.signTransaction) {
    throw new Error("Connected wallet does not support signTransaction.");
  }

  const data = await postToTxApi("prepare-redeem-shares", {
    investorPubkey: params.investorPubkey || wallet.publicKey.toBase58(),
    companyMint: params.companyMint,
    sharesAmount: params.sharesAmount,
  });

  if (!data?.transactionBase64) {
    throw new Error("Backend did not return valid redeem transactionBase64");
  }

  const txBytes = base64ToUint8Array(data.transactionBase64);
  const transaction = Transaction.from(txBytes);

  const signedTx = await wallet.signTransaction(transaction);
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return { signature };
}

export interface VoteMilestoneParams {
  investorPubkey: string;
  companyMint: string;
  milestoneId: number;
  approve: boolean;
  roundIndex?: number;
}

/**
 * AUFGABE 2.5: VOTE ON MILESTONE
 * 1. Requests prepared vote-milestone transaction from backend
 * 2. Deserializes Base64 transaction
 * 3. Signs with user's Solana wallet
 * 4. Broadcasts raw transaction to Solana Devnet
 * 5. Confirms on-chain and returns signature
 */
export async function executeVoteMilestone(
  params: VoteMilestoneParams,
  wallet: any,
  connection: Connection
): Promise<{ signature: string }> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected. Please connect your Solana wallet.");
  }
  if (!wallet.signTransaction) {
    throw new Error("Connected wallet does not support signTransaction.");
  }

  const data = await postToTxApi("prepare-vote-milestone", {
    investorPubkey: params.investorPubkey || wallet.publicKey.toBase58(),
    companyMint: params.companyMint,
    milestoneId: params.milestoneId,
    approve: params.approve,
    roundIndex: params.roundIndex ?? 0,
  });

  if (!data?.transactionBase64) {
    throw new Error("Backend did not return valid vote-milestone transactionBase64");
  }

  const txBytes = base64ToUint8Array(data.transactionBase64);
  const transaction = Transaction.from(txBytes);

  const signedTx = await wallet.signTransaction(transaction);
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return { signature };
}

export interface DlmmSwapParams {
  userPubkey?: string;
  companyMint: string;
  poolAddress?: string;
  action: "BUY" | "SELL";
  amount: number;
  slippageBps?: number;
}

/**
 * AUFGABE: METEORA DLMM SECONDARY SWAP (BUY / SELL)
 * 1. Requests prepared DLMM swap transaction from backend (/api/tx/prepare-swap-dlmm)
 * 2. Deserializes Base64 transaction
 * 3. Signs with user's Solana wallet (Phantom / Solflare)
 * 4. Broadcasts raw transaction to Solana Devnet
 * 5. Confirms on-chain and returns signature & execution details
 */
export async function executeDlmmSwap(
  params: DlmmSwapParams,
  wallet: any,
  connection: Connection
): Promise<{ signature: string; expectedOut?: string }> {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected. Please connect your Solana wallet.");
  }
  if (!wallet.signTransaction) {
    throw new Error("Connected wallet does not support signTransaction.");
  }

  const data = await postToTxApi("prepare-swap-dlmm", {
    userPubkey: params.userPubkey || wallet.publicKey.toBase58(),
    companyMint: params.companyMint,
    poolAddress: params.poolAddress,
    action: params.action,
    amount: params.amount,
    slippageBps: params.slippageBps ?? 100,
  });

  if (!data?.transactionBase64) {
    throw new Error(data?.error || "Backend did not return valid DLMM swap transactionBase64");
  }

  const txBytes = base64ToUint8Array(data.transactionBase64);
  const transaction = Transaction.from(txBytes);

  const signedTx = await wallet.signTransaction(transaction);
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return { signature, expectedOut: data.expectedOut };
}

