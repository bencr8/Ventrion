import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Ventrion IPFS & Metadata Gateway Ready",
    timestamp: "2026-10-12T00:00:00.000Z",
  });
}
