import { test } from "node:test";
import assert from "node:assert/strict";
import { SearchRecord } from "@pta/schema";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { loadCanon, ValidationError } from "@pta/graph";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..", "..");
const first = parse(readFileSync(join(root, "data", "canonical", "searches", "2026-09-20-d-01-c-23.yaml"), "utf8"))[0];

test("the first reviewed search record parses: an honest partial whose physical hit is route-only and whose follow-up is completed", () => {
  const r = SearchRecord.parse(first);
  assert.equal(r.result, "inconclusive");
  assert.equal(r.completeness, "partial");
  assert.ok(r.hits.some((h) => h.decision === "route-only" && h.doi === "10.1039/D0NA00429D"));
  assert.ok(!r.hits.some((h) => h.decision === "qualifies"), "a route-only hit never qualifies a cell");
  assert.equal(r.follow_up?.canonical_claim_review, "completed");
});

test("a route-only hit is recorded as a canonical coupling claim, never as a direct cell relation", () => {
  const claims = parse(readFileSync(join(root, "data", "canonical", "claims", "pass3-gaps.yaml"), "utf8")) as { id: string; subject: string; predicate: string; object: string; status: string }[];
  const c = claims.find((x) => x.id === "claim:thermo-osmosis-couples-streaming");
  assert.ok(c, "the coupling claim exists");
  assert.equal(c!.predicate, "couples_to");
  assert.equal(c!.status, "demonstrated");
  assert.ok(
    !claims.some((x) => x.subject === "disequilibrium:temperature-gradient" && x.object === "phenomenon:streaming-potential"),
    "no direct temperature-gradient → streaming-potential claim was manufactured",
  );
});

/** Copy data/canonical into a scratch root with one extra search file, and run the loader on it. */
function loadWith(extraYaml: string): string[] {
  const dir = mkdtempSync(join(tmpdir(), "pta-search-"));
  cpSync(join(root, "data"), join(dir, "data"), { recursive: true });
  mkdirSync(join(dir, "data", "canonical", "searches"), { recursive: true });
  writeFileSync(join(dir, "data", "canonical", "searches", "zz-test.yaml"), extraYaml);
  try {
    loadCanon(dir);
    return [];
  } catch (e) {
    if (e instanceof ValidationError) return e.problems;
    throw e;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const negativeSkeleton = (over: string) => `
- id: search:2026-09-21-d-02-c-05
  target: { kind: cell, row: disequilibrium:pressure-gradient, col: coupling:pyroelectric }
  protocol_version: cell-search-v1
  started_at: "2026-09-21T10:00:00+10:00"
  completed_at: "2026-09-21T11:00:00+10:00"
  objective: direct-relation
  inclusion_criteria: [x]
  exclusion_criteria: [y]
  runs:
    - { id: r1, engine: openalex, query_form: driver-family, query: q, executed_at: "2026-09-21T10:00:00+10:00", result_count_reported: 10, records_retrieved: 10, records_screened: 10, records_read: 2 }
${over}
  screening: { records_retrieved: 10, unique_records: 10, title_abstract_screened: 10, full_text_read: 2 }
  hits: []
  result: no-demonstration-found
  completeness: protocol-complete-negative
  reviewed_by: test
  reviewed_on: 2026-09-21
  conclusion: none found
`;

test("negative control: a no-demonstration-found record with only one engine and one query form is rejected by the loader", () => {
  const problems = loadWith(negativeSkeleton(""));
  assert.ok(
    problems.some((p) => p.includes("missing semantic-scholar")),
    problems.join("\n"),
  );
  assert.ok(
    problems.some((p) => p.includes("missing driver-phenomenon")),
    problems.join("\n"),
  );
});

test("a protocol-complete negative with every engine and query form passes the gate", () => {
  const extra = `    - { id: r2, engine: semantic-scholar, query_form: driver-phenomenon, query: q, executed_at: "2026-09-21T10:10:00+10:00", result_count_reported: 5, records_retrieved: 5, records_screened: 5, records_read: 1 }
    - { id: r3, engine: google-scholar, query_form: demonstration-precision, query: q, executed_at: "2026-09-21T10:20:00+10:00", result_count_reported: null, records_retrieved: 20, records_screened: 20, records_read: 3 }`;
  const problems = loadWith(negativeSkeleton(extra));
  assert.deepEqual(
    problems.filter((p) => p.includes("search:2026-09-21")),
    [],
  );
});

test("negative control: a positive without a qualifying hit is rejected", () => {
  const yaml = negativeSkeleton("").replace("result: no-demonstration-found", "result: demonstration-found").replace("completeness: protocol-complete-negative", "completeness: conclusive-positive");
  const problems = loadWith(yaml);
  assert.ok(
    problems.some((p) => p.includes('without a hit whose decision is "qualifies"')),
    problems.join("\n"),
  );
});

/** route-search-v1: a route negative skeleton for p-423a19acdd (k = 2: Marangoni effect, streaming potential). */
const routeRun = (id: string, engine: string, form: string, key: string, screened = 10) =>
  `    - { id: ${id}, engine: ${engine}, query_form: ${form}, query_key: "${key}", query: q, executed_at: "2026-09-21T10:00:00+10:00", result_count_reported: 10, records_retrieved: 10, records_screened: ${screened}, records_read: 2 }`;
const routeRunsFor = (engine: string, tag: string, screened = 10) =>
  [
    routeRun(`${tag}-dm`, engine, "route-driver-mechanism", "driver-mechanism:1", screened),
    routeRun(`${tag}-mp`, engine, "route-mechanism-pair", "mechanism-pair:1-2", screened),
    routeRun(`${tag}-wc`, engine, "route-whole-chain", "whole-chain", screened),
    routeRun(`${tag}-dp`, engine, "route-demonstration-precision", "demonstration-precision", screened),
  ].join("\n");
const routeNegative = (runs: string, over = "") => `
- id: search:2026-09-21-p-423a19acdd
  target: { kind: path, path: p-423a19acdd, claims: [claim:temperature-drives-marangoni, claim:marangoni-produces-flow, claim:fluid-flow-carrier-drives-streaming, claim:streaming-produces-ions, claim:ionic-current-converts-electricity] }
  protocol_version: route-search-v1
  started_at: "2026-09-21T10:00:00+10:00"
  completed_at: "2026-09-21T11:00:00+10:00"
  objective: exact-composition
  inclusion_criteria: [x]
  exclusion_criteria: [y]
  runs:
${runs}
  screening: { records_retrieved: 10, unique_records: 10, title_abstract_screened: 10, full_text_read: 2 }
  hits: []
  result: no-demonstration-found
  completeness: protocol-complete-negative
  reviewed_by: test
  reviewed_on: 2026-09-21
  conclusion: none found
${over}`;

test("route negative gate: a complete route-search-v1 negative (every engine × every key, two citation chases) passes", () => {
  const runs = [
    routeRunsFor("openalex", "oa"),
    routeRunsFor("semantic-scholar", "s2"),
    routeRunsFor("google-scholar", "gs"),
    routeRun("cc1", "manual", "citation-chase", "citation-chase:seed-1"),
    routeRun("cc2", "manual", "citation-chase", "citation-chase:seed-2"),
  ].join("\n");
  const problems = loadWith(routeNegative(runs));
  assert.deepEqual(
    problems.filter((p) => p.includes("search:2026-09-21")),
    [],
  );
});

test("negative control: a route negative missing the mechanism-pair key on one engine, or a citation chase, is rejected", () => {
  const runs = [
    routeRunsFor("openalex", "oa"),
    routeRunsFor("semantic-scholar", "s2"),
    routeRun("gs-dm", "google-scholar", "route-driver-mechanism", "driver-mechanism:1"),
    routeRun("gs-wc", "google-scholar", "route-whole-chain", "whole-chain"),
    routeRun("gs-dp", "google-scholar", "route-demonstration-precision", "demonstration-precision"),
    routeRun("cc1", "manual", "citation-chase", "citation-chase:seed-1"),
  ].join("\n");
  const problems = loadWith(routeNegative(runs));
  assert.ok(
    problems.some((p) => p.includes("google-scholar runs for mechanism-pair:1-2")),
    problems.join("\n"),
  );
  assert.ok(
    problems.some((p) => p.includes("citation-chase runs for two seed papers")),
    problems.join("\n"),
  );
});

test("negative control: a route record whose target.path is not the hash of target.claims, or whose mandatory run under-screened, is rejected", () => {
  const runs = [
    routeRunsFor("openalex", "oa", 3),
    routeRunsFor("semantic-scholar", "s2"),
    routeRunsFor("google-scholar", "gs"),
    routeRun("cc1", "manual", "citation-chase", "c1"),
    routeRun("cc2", "manual", "citation-chase", "c2"),
  ].join("\n");
  const problems = loadWith(routeNegative(runs).replace("path: p-423a19acdd,", "path: p-000000dead,"));
  assert.ok(
    problems.some((p) => p.includes("is not the id of target.claims")),
    problems.join("\n"),
  );
  assert.ok(
    problems.some((p) => p.includes("screened 3 of the 10")),
    problems.join("\n"),
  );
});

// Loop-3 pass 49: blocked attempts, segments and the conditional composite-name form (the reviewer's pass-48 findings 10–11, 14, 19–20).
const blockedRun = (id: string, engine: string, form: string, key: string) =>
  `    - { id: ${id}, engine: ${engine}, query_form: ${form}, query_key: "${key}", query: q, executed_at: "2026-09-21T23:30:00+10:00", result_count_reported: null, records_retrieved: 0, records_screened: 0, records_read: 0, positions_screened: none, interruption: "HTTP 429 from the anonymous pool; no result list obtained" }`;
const segmentRun = (id: string, key: string, segment: number, positions: string, screened: number) =>
  `    - { id: ${id}, engine: google-scholar, query_form: route-driver-mechanism, query_key: "${key}", query: q, executed_at: "2026-09-21T10:00:00+10:00", result_count_reported: 100, records_retrieved: 100, records_screened: ${screened}, records_read: 0, segment: ${segment}, positions_screened: "${positions}", interruption: "${segment === 1 ? "captcha after position 40" : "completed"}" }`;

test("blocked attempts never count (pass 49): an engine that answered 429 on every key is an attempt, not coverage — a negative over OpenAlex + Scholar + blocked S2 is refused, however many OpenAlex runs were added; and a blocked run may never record an empty result", () => {
  const runs = [
    routeRunsFor("openalex", "oa"),
    routeRunsFor("openalex", "oa-again"),
    [blockedRun("s2-dm", "semantic-scholar", "route-driver-mechanism", "driver-mechanism:1"), blockedRun("s2-mp", "semantic-scholar", "route-mechanism-pair", "mechanism-pair:1-2"), blockedRun("s2-wc", "semantic-scholar", "route-whole-chain", "whole-chain"), blockedRun("s2-dp", "semantic-scholar", "route-demonstration-precision", "demonstration-precision")].join("\n"),
    routeRunsFor("google-scholar", "gs"),
    routeRun("cc1", "manual", "citation-chase", "citation-chase:seed-1"),
    routeRun("cc2", "manual", "citation-chase", "citation-chase:seed-2"),
  ].join("\n");
  const problems = loadWith(routeNegative(runs));
  assert.ok(problems.some((p) => p.includes("requires every discovery engine; missing semantic-scholar")), problems.join("\n"));
  assert.ok(problems.some((p) => p.includes("requires semantic-scholar runs for driver-mechanism:1, mechanism-pair:1-2, whole-chain, demonstration-precision")), problems.join("\n"));
  // the same record with the blocked runs claiming an empty result list is refused on that ground too
  const zeroed = loadWith(routeNegative(runs.replace(/result_count_reported: null, records_retrieved: 0/g, "result_count_reported: 0, records_retrieved: 0")));
  assert.ok(zeroed.some((p) => p.includes("a blocked request is an attempt, never an empty result")), zeroed.join("\n"));
});

test("segments add up (pass 49): two Scholar sittings screening positions 1–40 and 41–100 complete one mandatory run; a repeated segment does not", () => {
  const complete = [
    routeRunsFor("openalex", "oa"),
    routeRunsFor("semantic-scholar", "s2"),
    segmentRun("gs-dm-1", "driver-mechanism:1", 1, "1–40", 40),
    segmentRun("gs-dm-2", "driver-mechanism:1", 2, "41–100", 60),
    routeRun("gs-mp", "google-scholar", "route-mechanism-pair", "mechanism-pair:1-2"),
    routeRun("gs-wc", "google-scholar", "route-whole-chain", "whole-chain"),
    routeRun("gs-dp", "google-scholar", "route-demonstration-precision", "demonstration-precision"),
    routeRun("cc1", "manual", "citation-chase", "citation-chase:seed-1"),
    routeRun("cc2", "manual", "citation-chase", "citation-chase:seed-2"),
  ].join("\n");
  assert.deepEqual(loadWith(routeNegative(complete)).filter((p) => p.includes("search:2026-09-21")), []);
  const repeated = complete.replace('positions_screened: "41–100", interruption: "completed"', 'positions_screened: "1–40", interruption: "completed"').replace("records_screened: 60", "records_screened: 40");
  const problems = loadWith(routeNegative(repeated));
  assert.ok(problems.some((p) => p.includes("gs-dm-1 + gs-dm-2 screened 40 of the 100")), problems.join("\n"));
});

test("the composite-name form is conditional (pass 49): no frozen composition term means the form is not applicable, never missing; one frozen term makes it mandatory on every discovery engine", () => {
  const base = [
    routeRunsFor("openalex", "oa"),
    routeRunsFor("semantic-scholar", "s2"),
    routeRunsFor("google-scholar", "gs"),
    routeRun("cc1", "manual", "citation-chase", "citation-chase:seed-1"),
    routeRun("cc2", "manual", "citation-chase", "citation-chase:seed-2"),
  ].join("\n");
  assert.deepEqual(loadWith(routeNegative(base)).filter((p) => p.includes("search:2026-09-21")), [], "an empty composition_terms array requires no composite-name run");
  const frozen = loadWith(routeNegative(base, "  composition_terms: [{ term: \"thermocapillary electrokinetic generator\", evidence: [source:seebeck-1826] }]\n"));
  assert.ok(frozen.some((p) => p.includes("requires openalex runs for composite-name")), frozen.join("\n"));
  assert.ok(frozen.some((p) => p.includes("requires google-scholar runs for composite-name")), frozen.join("\n"));
});
