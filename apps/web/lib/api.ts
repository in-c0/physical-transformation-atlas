/**
 * Every /api export carries the same `meta` block so a file downloaded on its own still says
 * what it is, which dataset revision it came from, how many records it holds, where the field
 * definitions live and under what terms it may be reused. The contract is docs/data-api.md.
 */
import "server-only";
import type { Claim, CompiledPath, MatrixCell } from "@pta/schema";
import { atlas } from "./data";

export const SCHEMA_VERSION = "0.4.0";
export const REPO = "https://github.com/in-c0/physical-transformation-atlas";
export const SITE = "https://physical-transformation-atlas.wldud5192.workers.dev";

/** Where a record of each kind has a citable page. */
export const CANONICAL_URL_RULES = {
  entity: `${SITE}/e/{type}/{slug}; phenomena at ${SITE}/phenomenon/{slug}`,
  claim: `${SITE}/claim/{slug}`,
  source: `${SITE}/source/{slug}`,
  path: `${SITE}/path/{ten hex characters of the route id after "p-"}`,
  pathway: "the canonical_url of the compiled route whose pathway field names it",
  system: `${SITE}/system/{slug}`,
  matrix_cell: `${SITE}/matrix?cell={row address}:{column address}`,
};

export const claimUrl = (id: string) => `${SITE}/claim/${id.split(":")[1]}`;
export const pathUrl = (id: string) => `${SITE}/path/${id.slice(2)}`;
export const cellUrl = (address: string) => `${SITE}/matrix?cell=${address}`;
export const sourceUrl = (id: string) => `${SITE}/source/${id.split(":")[1]}`;
export const systemUrl = (id: string) => `${SITE}/system/${id.split(":")[1]}`;
export const entityUrl = (id: string) => {
  const [type, slug] = id.split(":");
  return type === "phenomenon" ? `${SITE}/phenomenon/${slug}` : `${SITE}/e/${type}/${slug}`;
};

export type ExportName = "stats" | "graph" | "entities" | "claims" | "sources" | "pathways" | "systems" | "paths" | "matrix" | "coverage" | "checks" | "vocabulary" | "schema";

export const ENDPOINTS = [
  "/api/stats.json",
  "/api/graph.json",
  "/api/entities.json",
  "/api/claims.json",
  "/api/claims.ndjson",
  "/api/claims.csv",
  "/api/sources.json",
  "/api/pathways.json",
  "/api/systems.json",
  "/api/paths.json",
  "/api/matrix.json",
  "/api/coverage.json",
  "/api/checks.json",
  "/api/vocabulary.json",
  `/api/schema/v${SCHEMA_VERSION}.json`,
];

export function defName(endpoint: ExportName): string {
  return {
    stats: "StatsExport",
    graph: "GraphCoreExport",
    entities: "EntitiesExport",
    claims: "ClaimsExport",
    sources: "SourcesExport",
    pathways: "PathwaysExport",
    systems: "SystemsExport",
    paths: "PathsExport",
    matrix: "MatrixExport",
    coverage: "CoverageExport",
    checks: "ChecksExport",
    vocabulary: "VocabularyExport",
    schema: "Schema",
  }[endpoint];
}

/** `record_kind` tells a reuser whether the rows were written by a person (canonical YAML) or compiled from them. */
export function exportMeta(endpoint: ExportName, opts: { records?: number; record_kind?: "canonical" | "generated" | "mixed" | "none" } = {}) {
  const m = atlas().graph.meta;
  return {
    dataset: "physical-transformation-atlas",
    endpoint,
    version: SCHEMA_VERSION,
    data_hash: m.data_hash,
    generated_at: m.built_at,
    source_commit: m.source_commit,
    search_indexed_through: m.search_indexed_through,
    enumeration: m.enumeration,
    record_kind: opts.record_kind ?? "canonical",
    ...(opts.records === undefined ? {} : { records: opts.records }),
    counts: m.counts,
    schema: `${SITE}/api/schema/v${SCHEMA_VERSION}.json#/$defs/${defName(endpoint)}`,
    license: {
      spdx: null,
      status: "PENDING_OWNER_RULING",
      note: "No data licence has been selected yet; this marker is not a licence grant. All rights reserved until a licence is declared in docs/licensing.md.",
    },
    citation: `${REPO}/blob/main/CITATION.cff`,
    contract: `${REPO}/blob/main/docs/data-api.md`,
    changelog: `${REPO}/blob/main/docs/dataset-changelog.md`,
    vocabulary: `${SITE}/api/vocabulary.json`,
    checks: `${SITE}/api/checks.json`,
    canonical_url_rules: CANONICAL_URL_RULES,
  };
}

export function exportJson<T>(endpoint: ExportName, data: T, extra: Record<string, unknown> = {}, opts: Parameters<typeof exportMeta>[1] = {}) {
  return Response.json({ meta: exportMeta(endpoint, opts), data, ...extra });
}

export const withClaimUrl = (c: Claim) => ({ ...c, canonical_url: claimUrl(c.id) });
export const withPathUrl = (p: CompiledPath) => ({ ...p, canonical_url: pathUrl(p.id) });
export const withCellUrl = (c: MatrixCell) => ({ ...c, canonical_url: cellUrl(c.address) });
