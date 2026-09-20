import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Every source with its Crossref verification record (title match against the DOI, checked on the date given). */
export function GET() {
  const g = atlas().graph;
  return exportJson("sources", { sources: g.sources, verification: g.source_verification }, g.sources.length);
}
