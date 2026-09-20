/**
 * Every /api export carries the same `meta` block so a file downloaded on its own still says
 * what it is, which dataset revision it came from, how many records it holds, where the field
 * definitions live and under what terms it may be reused.
 */
import "server-only";
import { atlas } from "./data";

export const EXPORT_FORMAT_VERSION = "0.2.0";
const REPO = "https://github.com/in-c0/physical-transformation-atlas";
export const SITE = "https://physical-transformation-atlas.wldud5192.workers.dev";

/** Where a record of each kind has a citable page. `{id}` is the record id without its type prefix. */
export const CANONICAL_URLS = {
  entity: `${SITE}/e/{type}/{slug}  (phenomena: ${SITE}/phenomenon/{slug})`,
  claim: `${SITE}/claim/{slug}`,
  path: `${SITE}/path/{id}`,
  pathway: `${SITE}/path/{id of the compiled route the pathway records}`,
  matrix_cell: `${SITE}/matrix?cell={row address}:{column address}`,
  source: `${SITE}/source/{slug}`,
};

export type ExportName = "stats" | "graph" | "entities" | "claims" | "sources" | "pathways" | "paths" | "matrix" | "coverage" | "checks" | "vocabulary";

export function exportMeta(endpoint: ExportName, count?: number) {
  const m = atlas().graph.meta;
  return {
    dataset: "physical-transformation-atlas",
    endpoint,
    format_version: EXPORT_FORMAT_VERSION,
    revision: m.data_hash,
    built_at: m.built_at,
    ...(count === undefined ? {} : { count }),
    counts: m.counts,
    license: {
      spdx: null,
      status: "pending-owner-ruling",
      note: "No licence has been declared yet; all rights reserved until one is. Ask before redistributing.",
    },
    citation: `${REPO}/blob/main/CITATION.cff`,
    docs: `${REPO}/blob/main/docs/api.md`,
    vocabulary: `${SITE}/api/vocabulary.json`,
    checks: `${SITE}/api/checks.json`,
    schema: `${REPO}/blob/main/packages/schema/src/index.ts`,
    canonical_urls: CANONICAL_URLS,
    changelog: `${REPO}/blob/main/docs/CHANGELOG-DATA.md`,
  };
}

export function exportJson<T>(endpoint: ExportName, body: Record<string, T>, count?: number) {
  return Response.json({ meta: exportMeta(endpoint, count), ...body });
}
