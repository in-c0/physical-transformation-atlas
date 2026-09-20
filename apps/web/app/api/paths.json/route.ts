import { atlas } from "@/lib/data";
import { exportJson, withPathUrl } from "@/lib/api";

export const dynamic = "force-static";

/** Every enumerated conversion route with its physics checks, structure, search status and canonical URL. Generated records: derived from the canonical claims at this data_hash. */
export function GET() {
  const paths = atlas().graph.paths.map(withPathUrl);
  return exportJson("paths", paths, {}, { records: paths.length, record_kind: "generated" });
}
