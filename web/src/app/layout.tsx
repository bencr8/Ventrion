import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: "../../public/fonts/PlusJakartaSans.ttf",
  variable: "--font-jakarta",
  display: "swap",
});

const hanken = localFont({
  src: "../../public/fonts/HankenGrotesk.ttf",
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ventrion Protocol ($VENT) | Tokenize Companies. Stream Dividends.",
  description:
    "The Solana protocol turning commercial revenue into programmatic equity and continuous shareholder USDC distributions.",
  icons: {
    icon: "/ventrion-logo.png",
  },
};

import { SolanaWalletProvider } from "../components/wallet/SolanaWalletProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${hanken.variable}`}>
      <body className="min-h-screen bg-[#FAF7F2] text-[#111113] font-jakarta antialiased selection:bg-[#F68D66]/20">
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
