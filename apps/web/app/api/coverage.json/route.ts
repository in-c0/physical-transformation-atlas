import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Per-domain coverage: phenomena recorded against target, claims with evidence, unresolved claims. Generated records. */
export function GET() {
  const domains = atlas().graph.coverage;
  return exportJson("coverage", domains, {}, { records: domains.length, record_kind: "generated" });
}
