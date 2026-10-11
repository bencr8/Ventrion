import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    success: true,
    globalConfig: {
      totalVentStaked: 500000,
      masterFeeVaultBalance: 1250.0,
      masterFeeVault: "5BPnjZ6yPQtVK2tSJ4dYzD8mwzNnJxiP9fcVuKK4RbEV",
      ventStakingVault: "EB6KLGyxnCLH3pu26VvwVx7GTocGXg2CVwtkkRyYEnik",
    },
    stakerPosition: {
      stakerAddress: null,
      amountStaked: 0,
      pendingDividendsUsdc: 0,
    },
  });
}
