import { atlas } from "@/lib/data";
import { exportJson, sourceUrl } from "@/lib/api";

export const dynamic = "force-static";

/** Every source with its canonical URL; `verification` holds the Crossref title match per DOI with the date it was checked. */
export function GET() {
  const g = atlas().graph;
  const sources = g.sources.map((s) => ({ ...s, canonical_url: sourceUrl(s.id) }));
  return exportJson("sources", sources, { verification: g.source_verification }, { records: sources.length });
}
