import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { EntityView } from "@/components/EntityView";

export function generateStaticParams() {
  return atlas()
    .graph.entities.filter((e) => e.type === "phenomenon")
    .map((e) => ({ id: e.id.split(":")[1] }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = atlas().entity.get(`phenomenon:${id}`);
  return { title: e?.name ?? "Phenomenon", description: e?.summary };
}

export default async function PhenomenonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = atlas();
  const e = index.entity.get(`phenomenon:${id}`);
  if (!e) notFound();
  return (
    <main>
      <EntityView index={index} entity={e} />
    </main>
  );
}
