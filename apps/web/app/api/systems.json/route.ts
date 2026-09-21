import { atlas } from "@/lib/data";
import { exportJson, systemUrl } from "@/lib/api";

export const dynamic = "force-static";

/** The system layer (pass 34): multi-route systems joined by documented handoffs, each member carrying its exact route and that route's check results. */
export function GET() {
  const systems = atlas().graph.systems.map((s) => ({ ...s, canonical_url: systemUrl(s.id) }));
  return exportJson("systems", systems, {}, { records: systems.length });
}
