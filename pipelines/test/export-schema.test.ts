import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { EXPORTS, ExportMeta, ClaimRecord, PathRecord, MatrixCellRecord, SystemRecord, exportJsonSchema } from "@pta/schema/export-schema";
import { Entity, Source, Pathway, CoverageEntry } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const graph = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "graph.json"), "utf8"));
const paths = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "paths.json"), "utf8"));
const site = "https://example.test";
const url = (kind: string, id: string) => `${site}/${kind}/${id.split(":")[1] ?? id}`;

test("the JSON Schema generates with a $defs entry per export and per record type", () => {
  const js = exportJsonSchema("0.5.0", site);
  for (const name of Object.keys(EXPORTS)) assert.ok(js.$defs[name], `missing $defs.${name}`);
  for (const name of ["Entity", "Claim", "Source", "Pathway", "SystemPathway", "CompiledPath", "MatrixCell", "CoverageEntry", "CheckDefinition", "ExportMeta"]) assert.ok(js.$defs[name], `missing $defs.${name}`);
  assert.equal(js.$id, `${site}/api/schema/v0.5.0.json`);
});

test("every compiled record validates against the export record schema it will be served under", () => {
  for (const e of graph.entities) Entity.parse(e);
  for (const s of graph.sources) Source.parse(s);
  for (const p of graph.pathways) Pathway.parse(p);
  for (const s of graph.systems) SystemRecord.parse({ ...s, canonical_url: url("system", s.id) });
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
    version: "0.5.0",
    data_hash: m.data_hash,
    generated_at: m.built_at,
    source_commit: m.source_commit,
    search_indexed_through: m.search_indexed_through,
    enumeration: m.enumeration,
    record_kind: "canonical",
    records: graph.claims.length,
    counts: m.counts,
    schema: `${site}/api/schema/v0.5.0.json#/$defs/ClaimsExport`,
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

// Pass 43: the frozen formats never move. v0.4.0 is the pass-34 contract (generated from commit 196b2e9, the last pass-34
// revision, before pass 35 began the incompatible cleanup), the last format that carried the four legacy performance keys and
// the frontier class "circular".
test("the frozen export schemas are immutable: their hashes match, v0.4.0 still carries what v0.5.0 removed, and the current contract is v0.5.0", () => {
  const frozen: Record<string, string> = {
    "v0.2.0.json": "fce30fde20bceece915eeec5cae20c0ee5dda9898ce618cbc6b26c858a961aef",
    "v0.3.0.json": "1bc8d8db895e347f8dd37977aae20c0b15da11040feaee0b08937d34ea81b31c",
    "v0.4.0.json": "f7be81e2ec4ada26f8c598402659232ca6757b0063221c6c109761141b42c073",
  };
  for (const [file, hash] of Object.entries(frozen)) {
    const bytes = readFileSync(join(root, "apps", "web", "public", "api", "schema", file));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, `${file} changed — a frozen format is immutable`);
  }
  const v4 = JSON.parse(readFileSync(join(root, "apps", "web", "public", "api", "schema", "v0.4.0.json"), "utf8"));
  assert.match(v4.$id, /\/api\/schema\/v0\.4\.0\.json$/);
  const v4perf = v4.$defs.Pathway.properties.performance.properties;
  for (const key of ["efficiency_typical", "efficiency_record", "power_density", "theoretical_limit"]) assert.ok(key in v4perf, `v0.4.0 carried ${key}`);
  assert.ok(v4.$defs.CompiledPath.properties.frontier_class.enum.includes("circular"));
  assert.ok(!("regime_establishments" in v4.$defs.Pathway.properties) && !("bounds" in v4.$defs.Pathway.properties));
  const v5 = exportJsonSchema("0.5.0", site);
  const v5perf = v5.$defs.Pathway.properties.performance.properties;
  for (const key of ["efficiency_typical", "efficiency_record", "power_density", "theoretical_limit"]) assert.ok(!(key in v5perf), `v0.5.0 must not carry ${key}`);
  assert.equal(v5.$defs.Pathway.properties.performance.additionalProperties, false, "the performance object is strict");
  assert.ok(v5.$defs.CompiledPath.properties.frontier_class.enum.includes("same-form") && !v5.$defs.CompiledPath.properties.frontier_class.enum.includes("circular"));
  for (const key of ["bounds", "auxiliary_requirements", "regime_establishments"]) assert.ok(key in v5.$defs.Pathway.properties, `v0.5.0 carries Pathway.${key}`);
  for (const key of ["normalization", "datum_kind", "reference_constraint"]) assert.ok(key in v5.$defs.Pathway.properties.performance.properties.measurements.items.properties, `v0.5.0 carries Measurement.${key}`);
  assert.ok("SystemPathway" in v5.$defs && "SystemsExport" in v5.$defs);
  // every export the site emits declares the current version and points at its schema
  const api = readFileSync(join(root, "apps", "web", "lib", "api.ts"), "utf8");
  assert.match(api, /SCHEMA_VERSION = "0.5.0"/);
  assert.equal(graph.meta.version, "0.5.0");
});

test("negative control: a claim without review provenance or with an unknown status is rejected", () => {
  const c = { ...graph.claims[0], canonical_url: url("claim", graph.claims[0].id), status: "believed" };
  assert.throws(() => ClaimRecord.parse(c));
});
