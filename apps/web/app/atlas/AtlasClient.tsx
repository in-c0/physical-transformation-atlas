"use client";
import { useSearchParams } from "next/navigation";
import { AtlasGraph } from "@/components/AtlasGraph";

export function AtlasClient() {
  const params = useSearchParams();
  const focus = params.get("focus") ?? undefined;
  return <AtlasGraph initial={focus} />;
}
