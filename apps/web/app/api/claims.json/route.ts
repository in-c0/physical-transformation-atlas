import { atlas } from "@/lib/data";
import { exportJson, withClaimUrl } from "@/lib/api";

export const dynamic = "force-static";

/** Every claim: subject, predicate, object, conditions, energy ledger, relation, evidence, status, review provenance, canonical URL. */
export function GET() {
  const claims = atlas().graph.claims.map(withClaimUrl);
  return exportJson("claims", claims, {}, { records: claims.length });
}
