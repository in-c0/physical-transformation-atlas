import { atlas } from "@/lib/data";
import { exportJson, pathUrl, variantUrl } from "@/lib/api";

export const dynamic = "force-static";

/**
 * Named, reviewed compositions with their measured performance; canonical_url is the page of the compiled route that records each.
 * Pass 47: a variant (variant_of set) keeps its parent's route_id and gets its own page as canonical_url.
 */
export function GET() {
  const g = atlas().graph;
  const routeOf = new Map(g.paths.filter((p) => p.pathway).map((p) => [p.pathway!, p.id]));
  for (const p of g.paths) for (const v of p.variants ?? []) routeOf.set(v.pathway, p.id);
  const pathways = g.pathways.map((p) => ({
    ...p,
    route_id: routeOf.get(p.id) ?? null,
    canonical_url: p.variant_of ? variantUrl(p.id) : routeOf.has(p.id) ? pathUrl(routeOf.get(p.id)!) : null,
  }));
  return exportJson("pathways", pathways, {}, { records: pathways.length });
}
