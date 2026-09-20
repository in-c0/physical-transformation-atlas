import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Named, reviewed compositions with their measured performance. */
export function GET() {
  const pathways = atlas().graph.pathways;
  return exportJson("pathways", { pathways }, pathways.length);
}
