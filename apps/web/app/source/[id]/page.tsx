import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { SourceView } from "@/components/SourceView";

export function generateStaticParams() {
  return atlas().graph.sources.map((s) => ({ id: s.id.split(":")[1] }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = atlas().source.get(`source:${id}`);
  return {
    title: s?.title ?? "Source",
    description: s ? [s.authors.join(", "), s.year, s.venue].filter(Boolean).join(" · ") : undefined,
  };
}

export default async function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = atlas();
  const s = index.source.get(`source:${id}`);
  if (!s) notFound();
  return (
    <main>
      <SourceView index={index} source={s} />
    </main>
  );
}
