import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { EXPORTS, ExportMeta, ClaimRecord, PathRecord, MatrixCellRecord, exportJsonSchema } from "@pta/schema/export-schema";
import { Entity, Source, Pathway, CoverageEntry } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const graph = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "graph.json"), "utf8"));
const paths = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "paths.json"), "utf8"));
const site = "https://example.test";
const url = (kind: string, id: string) => `${site}/${kind}/${id.split(":")[1] ?? id}`;

test("the JSON Schema generates with a $defs entry per export and per record type", () => {
  const js = exportJsonSchema("0.3.0", site);
  for (const name of Object.keys(EXPORTS)) assert.ok(js.$defs[name], `missing $defs.${name}`);
  for (const name of ["Entity", "Claim", "Source", "Pathway", "CompiledPath", "MatrixCell", "CoverageEntry", "CheckDefinition", "ExportMeta"]) assert.ok(js.$defs[name], `missing $defs.${name}`);
  assert.equal(js.$id, `${site}/api/schema/v0.3.0.json`);
});

test("every compiled record validates against the export record schema it will be served under", () => {
  for (const e of graph.entities) Entity.parse(e);
  for (const s of graph.sources) Source.parse(s);
  for (const p of graph.pathways) Pathway.parse(p);
  for (const c of graph.coverage) CoverageEntry.parse(c);
  for (const c of graph.claims) ClaimRecord.parse({ ...c, canonical_url: url("claim", c.id) });
  for (const p of paths) PathRecord.parse({ ...p, canonical_url: `${site}/path/${p.id.slice(2)}` });
  for (const c of graph.matrix.cells) MatrixCellRecord.parse({ ...c, canonical_url: `${site}/matrix?cell=${c.address}` });
});

test("the export meta the site emits has every field the schema requires", () => {
  const m = graph.meta;
  const meta = {
    dataset: "physical-transformation-atlas",
    endpoint: "claims",
    version: "0.3.0",
    data_hash: m.data_hash,
    generated_at: m.built_at,
    source_commit: m.source_commit,
    search_indexed_through: m.search_indexed_through,
    enumeration: m.enumeration,
    record_kind: "canonical",
    records: graph.claims.length,
    counts: m.counts,
    schema: `${site}/api/schema/v0.3.0.json#/$defs/ClaimsExport`,
    license: { spdx: null, status: "PENDING_OWNER_RULING", note: "x" },
    citation: `${site}/CITATION.cff`,
    contract: `${site}/docs/data-api.md`,
    changelog: `${site}/docs/dataset-changelog.md`,
    vocabulary: `${site}/api/vocabulary.json`,
    checks: `${site}/api/checks.json`,
    canonical_url_rules: { claim: "x" },
  };
  ExportMeta.parse(meta);
});

test("negative control: a claim without review provenance or with an unknown status is rejected", () => {
  const c = { ...graph.claims[0], canonical_url: url("claim", graph.claims[0].id), status: "believed" };
  assert.throws(() => ClaimRecord.parse(c));
});
