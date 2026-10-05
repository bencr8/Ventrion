"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SendOptions,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// =============================================================================
// BASE58 ZERO-DEPENDENCY ENCODER / DECODER
// =============================================================================
const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function encodeBase58(buffer: Uint8Array): string {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
    digits[0] += buffer[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) digits.push(0);
  return digits.reverse().map((digit) => B58_ALPHABET[digit]).join("");
}

export function decodeBase58(str: string): Uint8Array {
  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    const value = B58_ALPHABET.indexOf(c);
    if (value === -1) throw new Error(`Invalid base58 character '${c}'`);
    for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
    bytes[0] += value;
    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; str[i] === "1" && i < str.length - 1; i++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

const EPHEMERAL_KEYPAIR_STORAGE_KEY = "ventrion_devnet_ephemeral_keypair_v1";
const WALLET_CONNECTED_STORAGE_KEY = "ventrion_local_wallet_connected_v1";

export type WalletMode = "ephemeral";

export interface DualModeWalletState {
  walletMode: WalletMode;
  setWalletMode: (mode: WalletMode) => void;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  wallet: any | null;
  wallets: any[];
  select: (walletName: any) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendOptions
  ) => Promise<string>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  ephemeralKeypair: Keypair | null;
  airdropSol: (amountSol?: number) => Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }>;
  isAirdropping: boolean;
  exportPrivateKey: () => string | null;
  resetEphemeralWallet: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isInsecureContext: boolean;
  isPhantomInstalled: boolean;
  connectPhantomDirect: () => Promise<boolean>;
  connectEphemeral: () => void;
}

export const DualModeWalletContext = createContext<DualModeWalletState | null>(null);

export function useDualWallet(): DualModeWalletState {
  const ctx = useContext(DualModeWalletContext);
  if (!ctx) {
    throw new Error("useDualWallet must be used within a DualModeWalletProvider");
  }
  return ctx;
}

interface DualModeWalletProviderProps {
  children: React.ReactNode;
  endpoint: string;
}

export function DualModeWalletProviderCore({
  children,
  endpoint,
}: DualModeWalletProviderProps) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAirdropping, setIsAirdropping] = useState<boolean>(false);

  const connection = useMemo(() => new Connection(endpoint, "confirmed"), [endpoint]);
  const [ephemeralKeypair, setEphemeralKeypair] = useState<Keypair | null>(null);

  // Load or generate ephemeral keypair
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(EPHEMERAL_KEYPAIR_STORAGE_KEY);
      if (stored) {
        const raw = JSON.parse(stored);
        if (Array.isArray(raw) && raw.length === 64) {
          const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
          setEphemeralKeypair(kp);
        } else {
          throw new Error("Invalid stored keypair shape");
        }
      } else {
        const fresh = Keypair.generate();
        window.localStorage.setItem(
          EPHEMERAL_KEYPAIR_STORAGE_KEY,
          JSON.stringify(Array.from(fresh.secretKey))
        );
        setEphemeralKeypair(fresh);
      }
    } catch (e) {
      console.warn("[LocalWallet] Generating fresh keypair:", e);
      const fresh = Keypair.generate();
      try {
        window.localStorage.setItem(
          EPHEMERAL_KEYPAIR_STORAGE_KEY,
          JSON.stringify(Array.from(fresh.secretKey))
        );
      } catch {}
      setEphemeralKeypair(fresh);
    }

    const wasConnected = window.localStorage.getItem(WALLET_CONNECTED_STORAGE_KEY);
    if (wasConnected === "true") {
      setConnected(true);
    }
  }, []);

  // Update public key when keypair and connected state ready
  useEffect(() => {
    if (connected && ephemeralKeypair) {
      setPublicKey(ephemeralKeypair.publicKey);
    } else if (!connected) {
      setPublicKey(null);
    }
  }, [connected, ephemeralKeypair]);

  // Connect local wallet
  const connectEphemeral = useCallback(() => {
    if (!ephemeralKeypair) return;
    setPublicKey(ephemeralKeypair.publicKey);
    setConnected(true);
    setConnecting(false);
    setIsModalOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WALLET_CONNECTED_STORAGE_KEY, "true");
    }
  }, [ephemeralKeypair]);

  const connect = useCallback(async () => {
    connectEphemeral();
  }, [connectEphemeral]);

  const disconnect = useCallback(async () => {
    setDisconnecting(true);
    setPublicKey(null);
    setConnected(false);
    setDisconnecting(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WALLET_CONNECTED_STORAGE_KEY);
      window.localStorage.removeItem("walletName");
    }
  }, []);

  // Client-side local signing
  const sendTransaction = useCallback(
    async (
      transaction: Transaction,
      targetConnection: Connection,
      options?: SendOptions
    ): Promise<string> => {
      const conn = targetConnection || connection;
      if (!ephemeralKeypair) {
        throw new Error("Local wallet keypair not initialized");
      }

      if (!transaction.recentBlockhash) {
        const { blockhash } = await conn.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
      }
      if (!transaction.feePayer) {
        transaction.feePayer = ephemeralKeypair.publicKey;
      }

      transaction.partialSign(ephemeralKeypair);

      const rawTx = transaction.serialize();
      const signature = await conn.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        ...options,
      });

      const latestBlockhash = await conn.getLatestBlockhash("confirmed");
      await conn.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      return signature;
    },
    [ephemeralKeypair, connection]
  );

  const signTransaction = useCallback(
    async (transaction: Transaction): Promise<Transaction> => {
      if (!ephemeralKeypair) throw new Error("Local wallet keypair not ready");
      if (!transaction.recentBlockhash) {
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
      }
      if (!transaction.feePayer) {
        transaction.feePayer = ephemeralKeypair.publicKey;
      }
      transaction.partialSign(ephemeralKeypair);
      return transaction;
    },
    [ephemeralKeypair, connection]
  );

  const signAllTransactions = useCallback(
    async (transactions: Transaction[]): Promise<Transaction[]> => {
      if (!ephemeralKeypair) throw new Error("Local wallet keypair not ready");
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      for (const tx of transactions) {
        if (!tx.recentBlockhash) tx.recentBlockhash = blockhash;
        if (!tx.feePayer) tx.feePayer = ephemeralKeypair.publicKey;
        tx.partialSign(ephemeralKeypair);
      }
      return transactions;
    },
    [ephemeralKeypair, connection]
  );

  // Devnet SOL Airdrop helper
  const airdropSol = useCallback(
    async (
      amountSol: number = 1
    ): Promise<{ success: boolean; signature?: string; error?: string }> => {
      const target = publicKey || (ephemeralKeypair ? ephemeralKeypair.publicKey : null);
      if (!target) return { success: false, error: "No wallet keypair" };

      setIsAirdropping(true);
      try {
        const sig = await connection.requestAirdrop(
          target,
          amountSol * LAMPORTS_PER_SOL
        );
        const latest = await connection.getLatestBlockhash("confirmed");
        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          "confirmed"
        );
        return { success: true, signature: sig };
      } catch (err: any) {
        console.warn("[LocalWallet] Airdrop failed:", err);
        return {
          success: false,
          error:
            err?.message ||
            "Devnet airdrop rate limit reached. Try requesting on solfaucet.com.",
        };
      } finally {
        setIsAirdropping(false);
      }
    },
    [publicKey, ephemeralKeypair, connection]
  );

  // Export Private Key in Base58 format
  const exportPrivateKey = useCallback((): string | null => {
    if (ephemeralKeypair) {
      return encodeBase58(ephemeralKeypair.secretKey);
    }
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(EPHEMERAL_KEYPAIR_STORAGE_KEY);
        if (stored) {
          const raw = JSON.parse(stored);
          if (Array.isArray(raw) && raw.length === 64) {
            return encodeBase58(Uint8Array.from(raw));
          }
        }
      } catch {}
    }
    return null;
  }, [ephemeralKeypair]);

  // Reset / Regenerate Keypair
  const resetEphemeralWallet = useCallback(() => {
    const fresh = Keypair.generate();
    try {
      window.localStorage.setItem(
        EPHEMERAL_KEYPAIR_STORAGE_KEY,
        JSON.stringify(Array.from(fresh.secretKey))
      );
    } catch {}
    setEphemeralKeypair(fresh);
    if (connected) {
      setPublicKey(fresh.publicKey);
    }
  }, [connected]);

  const activeAdapter = useMemo(() => {
    return {
      name: "Local Storage Wallet",
      icon: "",
    };
  }, []);

  const walletsList = useMemo(() => {
    return [
      {
        adapter: {
          name: "Local Storage Wallet",
          icon: "",
        },
        readyState: "Installed",
      },
    ];
  }, []);

  const select = useCallback(
    () => {
      connectEphemeral();
    },
    [connectEphemeral]
  );

  const value: DualModeWalletState = {
    walletMode: "ephemeral",
    setWalletMode: () => {},
    publicKey,
    connected,
    connecting,
    disconnecting,
    wallet: connected ? { adapter: activeAdapter } : null,
    wallets: walletsList,
    select,
    connect,
    disconnect,
    sendTransaction,
    signTransaction,
    signAllTransactions,
    ephemeralKeypair,
    airdropSol,
    isAirdropping,
    exportPrivateKey,
    resetEphemeralWallet,
    isModalOpen,
    setIsModalOpen,
    isInsecureContext: false,
    isPhantomInstalled: false,
    connectPhantomDirect: async () => {
      connectEphemeral();
      return true;
    },
    connectEphemeral,
  };

  return (
    <DualModeWalletContext.Provider value={value}>
      {children}
    </DualModeWalletContext.Provider>
  );
}
