import { atlas } from "@/lib/data";
import { exportMeta } from "@/lib/api";

export const dynamic = "force-static";

/** The core graph in one file: entities, claims, sources, named pathways, searches, matrix, coverage. Routes are in /api/paths.json. */
export function GET() {
  const g = atlas().graph;
  return Response.json({
    ...g,
    meta: { ...exportMeta("graph"), ...g.meta },
    paths: [],
  });
}
