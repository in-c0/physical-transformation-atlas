import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { EntityView } from "@/components/EntityView";

export function generateStaticParams() {
  return atlas()
    .graph.entities.filter((e) => e.type !== "phenomenon")
    .map((e) => ({ type: e.type, id: e.id.split(":")[1] }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }): Promise<Metadata> {
  const { type, id } = await params;
  const e = atlas().entity.get(`${type}:${id}`);
  return { title: e?.name ?? "Entity", description: e?.summary };
}

export default async function EntityPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const index = atlas();
  const e = index.entity.get(`${type}:${id}`);
  if (!e) notFound();
  return (
    <main>
      <EntityView index={index} entity={e} />
    </main>
  );
}
