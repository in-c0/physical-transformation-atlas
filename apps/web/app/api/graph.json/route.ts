import { atlas } from "@/lib/data";

export const dynamic = "force-static";

/** The core graph: entities, claims, sources, named pathways, matrix, coverage, meta. Paths are in /api/paths.json. */
export function GET() {
  const g = atlas().graph;
  return Response.json({ ...g, paths: [] });
}
