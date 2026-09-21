import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atlas } from "@/lib/data";
import { VariantView } from "@/components/VariantView";

/** A page per recorded variant pathway (pass 47): the parent keeps the route page; the variant gets its own address. */
function variantAndRoute(id: string) {
  const index = atlas();
  const variant = index.pathway.get(`pathway:${id}`);
  if (!variant?.variant_of) return null;
  const path = index.graph.paths.find((p) => p.variants.some((v) => v.pathway === variant.id));
  if (!path) return null;
  return { index, variant, path };
}

export function generateStaticParams() {
  return atlas()
    .graph.pathways.filter((p) => p.variant_of)
    .map((p) => ({ id: p.id.split(":")[1] }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const v = variantAndRoute(id);
  return { title: v ? v.variant.name : "Variant pathway", description: v?.variant.summary };
}

export default async function VariantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = variantAndRoute(id);
  if (!v) notFound();
  return (
    <main>
      <VariantView index={v.index} variant={v.variant} path={v.path} />
    </main>
  );
}
