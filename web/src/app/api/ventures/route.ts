import { NextResponse } from "next/server";
import { VERIFIED_VENTURES } from "../../../lib/venturesData";
import {
  DEVNET_PROGRAM_ID,
  DEVNET_VENT_MINT,
  DEVNET_USDC_MINT,
  DEVNET_QCMP_VENTURE_MINT,
  DEVNET_QCMP_METAPLEX_METADATA_PDA,
  DEVNET_QCMP_METEORA_DLMM_POOL,
  DEVNET_PIONEER_VENTURE_MINT,
} from "../../../lib/constants";

export const dynamic = "force-static";

export async function GET() {
  const protocolConstants = {
    programId: DEVNET_PROGRAM_ID,
    motherTokenMint: DEVNET_VENT_MINT,
    motherTokenTicker: "$VENT",
    motherTokenTotalSupply: 10_000_000,
    protocolRoyaltyBps: 50, // 0.5%
    canonicalUsdcMint: DEVNET_USDC_MINT,
    stakingMultipliers: [
      { days: 0, label: "0 Tage (Liquid)", multiplier: 1.0, boost: "0%" },
      { days: 90, label: "90 Tage", multiplier: 1.25, boost: "+25%" },
      { days: 180, label: "180 Tage", multiplier: 1.5, boost: "+50%" },
      { days: 365, label: "365 Tage (1 Jahr)", multiplier: 2.0, boost: "Double Rewards" },
      { days: 730, label: "730 Tage (2 Jahre)", multiplier: 3.0, boost: "Triple Rewards" },
    ],
  };

  const pilotVentures = {
    qcmp: {
      name: "QuantumCompute Systems ($QCMP)",
      ticker: "$QCMP",
      mint: DEVNET_QCMP_VENTURE_MINT,
      metaplexMetadataPda: DEVNET_QCMP_METAPLEX_METADATA_PDA,
      meteoraDlmmPool: DEVNET_QCMP_METEORA_DLMM_POOL,
      status: "Graduated • DLMM Live",
      stateKey: "GraduatedDLMMLive",
      legalEntity: "MIDAO DAO LLC, Marshall Islands",
      shareInvariant: 1_000_000,
      mintAuthorityRevoked: true,
      dlmmSeedingPercent: 17.0,
      quoteCurrency: "Canonical USDC",
    },
    pvent: {
      name: "Pilot Venture 1 ($PVENT)",
      ticker: "$PVENT",
      mint: DEVNET_PIONEER_VENTURE_MINT,
      status: "Primary Raise • Flat Curve",
      stateKey: "PrimaryRaiseActive",
      legalEntity: "MIDAO DAO LLC, Marshall Islands",
      shareInvariant: 1_000_000,
      mintAuthorityRevoked: true,
      quoteCurrency: "Canonical USDC",
    },
  };

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    protocol: protocolConstants,
    pilotVentures,
    ventures: VERIFIED_VENTURES,
  });
}
