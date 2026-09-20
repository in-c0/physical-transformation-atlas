import { atlas } from "@/lib/data";
import { exportMeta, withCellUrl, withClaimUrl } from "@/lib/api";

export const dynamic = "force-static";

/**
 * The core graph in one file: entities, claims, sources, named pathways, search records, matrix,
 * coverage and source verification. Compiled routes are large and live at /api/paths.json.
 */
export function GET() {
  const g = atlas().graph;
  const { paths: _paths, meta: _meta, ...rest } = g;
  void _paths;
  void _meta;
  return Response.json({
    meta: exportMeta("graph", { record_kind: "mixed" }),
    data: { ...rest, claims: g.claims.map(withClaimUrl), matrix: { ...g.matrix, cells: g.matrix.cells.map(withCellUrl) } },
    links: { paths: "/api/paths.json" },
  });
}
