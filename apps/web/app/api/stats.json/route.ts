import { ENDPOINTS, exportMeta } from "@/lib/api";

export const dynamic = "force-static";

/** Dataset revision, build provenance, counts and occurrence maps, and the list of every export. */
export function GET() {
  return Response.json({ meta: exportMeta("stats", { record_kind: "none" }), data: { endpoints: ENDPOINTS } });
}
