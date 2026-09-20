import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Every claim: subject, predicate, object, conditions, energy ledger, relation, evidence, status, review provenance. */
export function GET() {
  const claims = atlas().graph.claims;
  return exportJson("claims", { claims }, claims.length);
}
