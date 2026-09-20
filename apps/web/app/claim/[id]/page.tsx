import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { ClaimView } from "@/components/ClaimView";
import { predicateLabel } from "@/lib/format";

export function generateStaticParams() {
  return atlas().graph.claims.map((c) => ({ id: c.id.split(":")[1] }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const index = atlas();
  const c = index.claim.get(`claim:${id}`);
  if (!c) return { title: "Claim" };
  const s = index.entity.get(c.subject)?.name ?? c.subject;
  const o = index.entity.get(c.object)?.name ?? c.object;
  return {
    title: `${s} ${predicateLabel(c.predicate)} ${o}`,
    description: c.conditions[0] ?? `${c.id}: ${c.status}`,
  };
}

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = atlas();
  const c = index.claim.get(`claim:${id}`);
  if (!c) notFound();
  return (
    <main>
      <ClaimView index={index} claim={c} />
    </main>
  );
}
