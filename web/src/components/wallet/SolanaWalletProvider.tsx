"use client";

import React, { useMemo } from "react";
import {
  ConnectionContext,
  WalletContext,
  WalletContextState,
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import {
  WalletModalContext,
  WalletModalContextState,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import {
  DualModeWalletProviderCore,
  useDualWallet,
  DualModeWalletState,
} from "./DualModeWalletContext";
import { DualModeWalletModal } from "./DualModeWalletModal";
import { WalletRejectionToast } from "./WalletRejectionToast";

export { useDualWallet } from "./DualModeWalletContext";
export { useWallet, useConnection } from "@solana/wallet-adapter-react";
export { useWalletModal } from "@solana/wallet-adapter-react-ui";

/**
 * Bridge component that maps DualModeWalletState to the standard
 * Solana Wallet Adapter React & UI contexts.
 */
function WalletAdapterBridge({
  children,
  connection,
}: {
  children: React.ReactNode;
  connection: Connection;
}) {
  const dual = useDualWallet();

  const walletContextValue: WalletContextState = useMemo(
    () =>
      ({
        autoConnect: false,
        wallets: dual.wallets,
        wallet: dual.wallet,
        publicKey: dual.publicKey,
        connecting: dual.connecting,
        connected: dual.connected,
        disconnecting: dual.disconnecting,
        select: dual.select,
        connect: dual.connect,
        disconnect: dual.disconnect,
        sendTransaction: dual.sendTransaction,
        signTransaction: dual.signTransaction,
        signAllTransactions: dual.signAllTransactions,
        signMessage: undefined,
        signIn: undefined,
      } as unknown as WalletContextState),
    [dual]
  );

  const modalContextValue: WalletModalContextState = useMemo(
    () => ({
      visible: dual.isModalOpen,
      setVisible: dual.setIsModalOpen,
    }),
    [dual.isModalOpen, dual.setIsModalOpen]
  );

  const ConnProvider = ConnectionContext.Provider as any;
  const WalProvider = WalletContext.Provider as any;
  const ModalProvider = WalletModalContext.Provider as any;

  return (
    <ConnProvider value={{ connection }}>
      <WalProvider value={walletContextValue}>
        <ModalProvider value={modalContextValue}>
          {children}
          <DualModeWalletModal />
          <WalletRejectionToast />
        </ModalProvider>
      </WalProvider>
    </ConnProvider>
  );
}

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      clusterApiUrl(network),
    [network]
  );

  const connection = useMemo(
    () => new Connection(endpoint, "confirmed"),
    [endpoint]
  );

  return (
    <DualModeWalletProviderCore endpoint={endpoint}>
      <WalletAdapterBridge connection={connection}>
        {children}
      </WalletAdapterBridge>
    </DualModeWalletProviderCore>
  );
}
