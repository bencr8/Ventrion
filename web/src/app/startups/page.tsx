"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StartupsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ventures");
  }, [router]);

  return null;
}
