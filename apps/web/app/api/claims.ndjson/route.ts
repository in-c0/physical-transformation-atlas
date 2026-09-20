import { atlas } from "@/lib/data";
import { exportMeta, withClaimUrl } from "@/lib/api";

export const dynamic = "force-static";

/** One claim per line. The first line is the meta block (endpoint "claims", kind "meta"); every claim line carries data_hash and canonical_url. */
export function GET() {
  const g = atlas().graph;
  const meta = { kind: "meta", ...exportMeta("claims", { records: g.claims.length }) };
  const lines = [JSON.stringify(meta), ...g.claims.map((c) => JSON.stringify({ kind: "claim", data_hash: g.meta.data_hash, ...withClaimUrl(c) }))];
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "application/x-ndjson; charset=utf-8" } });
}
