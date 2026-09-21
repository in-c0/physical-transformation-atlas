import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { SystemView } from "@/components/SystemView";

export function generateStaticParams() {
  return atlas().graph.systems.map((s) => ({ id: s.id.split(":")[1] }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = atlas().system.get(`system-pathway:${id}`);
  return { title: s ? s.name : "System" };
}

export default async function SystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = atlas();
  const s = index.system.get(`system-pathway:${id}`);
  if (!s) notFound();
  return (
    <main>
      <SystemView index={index} system={s} />
    </main>
  );
}
