/**
 * One JSON Schema for every public export, generated from the zod definitions so it cannot drift
 * from what the compiler writes. Served at /api/schema/v<version>.json; each export's meta.schema
 * points at its $defs entry.
 */
import { z } from "zod";
import {
  Claim,
  CompiledPath,
  CoverageEntry,
  Entity,
  MatrixCell,
  Pathway,
  SearchRecord,
  Source,
  CheckResult,
  DOMAINS,
  ENTITY_TYPES,
  ENERGY_FORMS,
  EVIDENCE_STATUSES,
  FRONTIER_CLASSES,
  MATRIX_CELL_STATUSES,
  PREDICATES,
  SEARCH_STATUSES,
  STRUCTURAL_KINDS,
} from "@pta/schema";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const url = z.string().url();

export const Counts = z.object({
  entities: z.number().int(),
  phenomena: z.number().int(),
  disequilibria: z.number().int(),
  couplings: z.number().int(),
  transducers: z.number().int(),
  claims: z.number().int(),
  sources: z.number().int(),
  pathways_named: z.number().int(),
  paths_examined: z.number().int(),
  paths_demonstrated: z.number().int(),
  paths_no_demonstration_found: z.number().int(),
  paths_not_searched: z.number().int(),
  matrix_cells: z.number().int(),
  matrix_cells_empty: z.number().int(),
  matrix_cells_unsearched: z.number().int(),
  coverage_mean: z.number(),
  claims_by_status: z.record(z.string(), z.number().int()),
  claims_by_predicate: z.record(z.string(), z.number().int()),
  paths_by_search_status: z.record(z.string(), z.number().int()),
  paths_by_frontier_class: z.record(z.string(), z.number().int()),
  paths_by_structural_kind: z.record(z.string(), z.number().int()),
  matrix_cells_by_status: z.record(z.string(), z.number().int()),
  entities_by_type: z.record(z.string(), z.number().int()),
});

export const ExportMeta = z.object({
  dataset: z.literal("physical-transformation-atlas"),
  endpoint: z.string(),
  version: z.string().describe("schema version of the export format (semver)"),
  data_hash: z.string().describe("twelve hex characters: SHA-256 over the canonical files; the dataset revision"),
  generated_at: z.string().describe("ISO 8601 time the graph was compiled"),
  source_commit: z.string().nullable().describe("git commit of the canonical files; suffixed -dirty when uncommitted edits were present"),
  search_indexed_through: isoDate.nullable().describe("latest date any search record covers; null when no search record exists"),
  record_kind: z.enum(["canonical", "generated", "mixed", "none"]).describe("canonical = written by a person in data/canonical; generated = compiled from canonical records at this data_hash"),
  records: z.number().int().optional(),
  counts: Counts,
  schema: z.string().describe("URL of this schema with a fragment naming the export's $defs entry"),
  license: z.object({ spdx: z.string().nullable(), status: z.string(), note: z.string() }),
  citation: url,
  contract: url,
  changelog: url,
  vocabulary: url,
  checks: url,
  canonical_url_rules: z.record(z.string(), z.string()),
});

const withUrl = <T extends z.ZodRawShape>(o: z.ZodObject<T>) => o.extend({ canonical_url: url });
const withNullableUrl = <T extends z.ZodRawShape>(o: z.ZodObject<T>) => o.extend({ canonical_url: url.nullable(), route_id: z.string().nullable() });

export const Verification = z.record(z.string(), z.object({ verified: z.boolean(), checked_at: z.string(), crossref_title: z.string().optional(), note: z.string().optional() }));
export const MatrixAxis = z.object({ id: z.string(), address: z.string(), name: z.string(), family: z.string() });
export const CheckDefinition = z.object({
  id: CheckResult.shape.id,
  label: z.string(),
  definition: z.string(),
  pass_when: z.string(),
  fail_when: z.string(),
  unresolved_when: z.string(),
  unknown_when: z.string(),
  reads: z.array(z.string()),
  core: z.boolean(),
  implementation: z.string(),
});
export const VocabularyEnum = z.object({ name: z.string(), used_in: z.array(z.string()), terms: z.array(z.object({ id: z.string(), definition: z.string() })) });

export const ClaimRecord = withUrl(Claim);
/** One line of /api/claims.ndjson after the meta line. */
export const ClaimLine = ClaimRecord.extend({ kind: z.literal("claim"), data_hash: z.string() });
export const EntityRecord = withUrl(Entity);
export const SourceRecord = withUrl(Source);
export const PathwayRecord = withNullableUrl(Pathway);
export const PathRecord = withUrl(CompiledPath);
export const MatrixCellRecord = withUrl(MatrixCell);

export const StatsExport = z.object({ meta: ExportMeta, data: z.object({ endpoints: z.array(z.string()) }) });
export const GraphCoreExport = z.object({
  meta: ExportMeta,
  data: z.object({
    entities: z.array(Entity),
    claims: z.array(ClaimRecord),
    sources: z.array(Source),
    pathways: z.array(Pathway),
    searches: z.array(SearchRecord.extend({ reviewed: z.boolean() })),
    matrix: z.object({ rows: z.array(MatrixAxis), cols: z.array(MatrixAxis), cells: z.array(MatrixCellRecord) }),
    coverage: z.array(CoverageEntry),
    source_verification: Verification,
  }),
  links: z.object({ paths: z.string() }),
});
export const EntitiesExport = z.object({ meta: ExportMeta, data: z.array(EntityRecord) });
export const ClaimsExport = z.object({ meta: ExportMeta, data: z.array(ClaimRecord) });
export const SourcesExport = z.object({ meta: ExportMeta, data: z.array(SourceRecord), verification: Verification });
export const PathwaysExport = z.object({ meta: ExportMeta, data: z.array(PathwayRecord) });
export const PathsExport = z.object({ meta: ExportMeta, data: z.array(PathRecord) });
export const MatrixExport = z.object({ meta: ExportMeta, data: z.object({ rows: z.array(MatrixAxis), cols: z.array(MatrixAxis), cells: z.array(MatrixCellRecord) }) });
export const CoverageExport = z.object({ meta: ExportMeta, data: z.array(CoverageEntry) });
export const ChecksExport = z.object({ meta: ExportMeta, data: z.array(CheckDefinition) });
export const VocabularyExport = z.object({ meta: ExportMeta, data: z.array(VocabularyEnum) });

export const EXPORTS = {
  StatsExport,
  GraphCoreExport,
  EntitiesExport,
  ClaimsExport,
  SourcesExport,
  PathwaysExport,
  PathsExport,
  MatrixExport,
  CoverageExport,
  ChecksExport,
  VocabularyExport,
} as const;

/** The whole contract as one JSON Schema document with $defs per export and per record type. */
export function exportJsonSchema(version: string, siteUrl: string) {
  const defs: Record<string, unknown> = {};
  const add = (name: string, schema: z.ZodType) => {
    const js = z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any" }) as Record<string, unknown>;
    delete js.$schema;
    defs[name] = js;
  };
  add("ExportMeta", ExportMeta);
  add("Counts", Counts);
  add("Entity", EntityRecord);
  add("Claim", ClaimRecord);
  add("ClaimLine", ClaimLine);
  add("Source", SourceRecord);
  add("Pathway", PathwayRecord);
  add("SearchRecord", SearchRecord);
  add("CompiledPath", PathRecord);
  add("MatrixCell", MatrixCellRecord);
  add("MatrixAxis", MatrixAxis);
  add("CoverageEntry", CoverageEntry);
  add("CheckResult", CheckResult);
  add("CheckDefinition", CheckDefinition);
  add("VocabularyEnum", VocabularyEnum);
  for (const [name, schema] of Object.entries(EXPORTS)) add(name, schema);
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${siteUrl}/api/schema/v${version}.json`,
    title: "Physical Transformation Atlas — export formats",
    description:
      "Generated from packages/schema/src/export-schema.ts (zod). Every /api export's meta.schema names its $defs entry. Enumerations: " +
      [ENTITY_TYPES, PREDICATES, EVIDENCE_STATUSES, SEARCH_STATUSES, ENERGY_FORMS, DOMAINS, STRUCTURAL_KINDS, MATRIX_CELL_STATUSES, FRONTIER_CLASSES].map((e) => e.length).reduce((a, b) => a + b, 0) +
      " values, defined at /api/vocabulary.json.",
    version,
    $defs: defs,
  };
}
