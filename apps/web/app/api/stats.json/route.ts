import { exportMeta } from "@/lib/api";

export const dynamic = "force-static";

/** Dataset revision, build time, counts and the list of exports. */
export function GET() {
  const meta = exportMeta("stats");
  const endpoints = ["stats", "graph", "entities", "claims", "sources", "pathways", "paths", "matrix", "coverage", "checks", "vocabulary"].map((e) => `/api/${e}.json`);
  return Response.json({
    ...meta,
    endpoints: [...endpoints, "/api/claims.csv"],
  });
}
