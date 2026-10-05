import { VERIFIED_VENTURES } from "../../../lib/venturesData";
import { VentureDetailClient } from "./VentureDetailClient";

export function generateStaticParams() {
  return VERIFIED_VENTURES.flatMap((v) => [
    { mint: v.mintAddress },
    { mint: v.id },
  ]);
}

export default function VenturePage({
  params,
}: {
  params: { mint: string };
}) {
  return <VentureDetailClient mint={params.mint} />;
}
