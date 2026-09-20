"use client";
import { useSearchParams } from "next/navigation";
import { AtlasGraph } from "@/components/AtlasGraph";

export function AtlasClient() {
  const params = useSearchParams();
  const focus = params.get("focus") ?? undefined;
  const route = params.get("route") ?? undefined;
  return <AtlasGraph initial={focus} route={route} />;
}
