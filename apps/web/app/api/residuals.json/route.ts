import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_VERSION, SITE, REPO } from "@/lib/api";

export const dynamic = "force-static";

/**
 * Pass 50: the live residual view — every open uncertainty in a current atlas record, as tools/audit-closure.mjs derives it from
 * the compiled atlas and its audits (generated/residuals.json). A projection outside the v0.5.0 export contract: it may shrink,
 * grow or change after later work; the immutable closure snapshot is design/reviews/loop-3/pass-50-closure.md.
 */
export function GET() {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "generated", "residuals.json"), "utf8")) as { meta: Record<string, unknown>; residuals: unknown[] };
  return Response.json({
    meta: {
      ...collection.meta,
      version: SCHEMA_VERSION,
      contract: `${REPO}/blob/main/docs/data-api.md`,
      site: SITE,
    },
    data: collection.residuals,
  });
}
