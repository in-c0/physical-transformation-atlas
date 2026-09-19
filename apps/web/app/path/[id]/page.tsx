import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { PathView, pathTitle } from "@/components/PathView";

export function generateStaticParams() {
  return atlas().graph.paths.map((p) => ({ id: p.id.slice(2) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const index = atlas();
  const p = index.path.get(`p-${id}`);
  return { title: p ? pathTitle(index, p) : "Pathway" };
}

export default async function PathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = atlas();
  const p = index.path.get(`p-${id}`);
  if (!p) notFound();
  return (
    <main>
      <PathView index={index} path={p} />
    </main>
  );
}
