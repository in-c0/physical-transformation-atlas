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

test("the first reviewed search record parses and is a conclusive positive with a qualifying hit", () => {
  const r = SearchRecord.parse(first);
  assert.equal(r.result, "demonstration-found");
  assert.equal(r.completeness, "conclusive-positive");
  assert.ok(r.hits.some((h) => h.decision === "qualifies" && h.doi === "10.1039/D0NA00429D"));
  assert.equal(r.follow_up?.canonical_claim_review, "needed");
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
