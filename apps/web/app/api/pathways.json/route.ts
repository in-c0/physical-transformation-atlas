import { atlas } from "@/lib/data";
import { exportJson, pathUrl } from "@/lib/api";

export const dynamic = "force-static";

/** Named, reviewed compositions with their measured performance; canonical_url is the page of the compiled route that records each. */
export function GET() {
  const g = atlas().graph;
  const routeOf = new Map(g.paths.filter((p) => p.pathway).map((p) => [p.pathway!, p.id]));
  const pathways = g.pathways.map((p) => ({ ...p, route_id: routeOf.get(p.id) ?? null, canonical_url: routeOf.has(p.id) ? pathUrl(routeOf.get(p.id)!) : null }));
  return exportJson("pathways", pathways, {}, { records: pathways.length });
}
