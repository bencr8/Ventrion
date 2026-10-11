import { NextResponse } from "next/server";
import { VERIFIED_VENTURES } from "../../../../lib/venturesData";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: VERIFIED_VENTURES,
    ventures: VERIFIED_VENTURES,
    timestamp: "2026-10-12T00:00:00.000Z",
  });
}
