import { VERIFIED_VENTURES } from "../../../lib/venturesData";
import { VentureDetailClient } from "./VentureDetailClient";

export function generateStaticParams() {
  const mints = Array.from(new Set(VERIFIED_VENTURES.map((v) => v.mintAddress)));
  return mints.map((m) => ({ mint: m }));
}

export default function VenturePage({
  params,
}: {
  params: { mint: string };
}) {
  return <VentureDetailClient mint={params.mint} />;
}
