import { ENDPOINTS, exportMeta } from "@/lib/api";

export const dynamic = "force-static";

/** Dataset revision, build provenance, counts and occurrence maps, and the list of every export. */
export function GET() {
  // Pass 50: projections are served beside the exports and sit outside the v0.5.0 contract (see docs/data-api.md).
  return Response.json({ meta: exportMeta("stats", { record_kind: "none" }), data: { endpoints: ENDPOINTS, projections: ["/api/residuals.json"] } });
}
