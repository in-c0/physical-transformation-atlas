import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CHECK_DEFINITIONS, CORE_CHECK_IDS } from "@pta/physics/definitions";
import { checkConservation, checkDimensional, dim, UnitTable, type PhysicsContext } from "@pta/physics";
import type { Claim, CompiledPath, Entity, Graph } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const paths: CompiledPath[] = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "paths.json"), "utf8"));
const graph: Graph = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "graph.json"), "utf8"));

/** The registry (/api/checks.json, the methods page) must describe what the checks actually return. */
test("every (check, result) pair the dataset produces has a description in CHECK_DEFINITIONS", () => {
  const seen = new Map<string, Set<string>>();
  for (const p of paths) for (const k of p.checks) seen.set(k.id, new Set([...(seen.get(k.id) ?? []), k.result]));
  const problems: string[] = [];
  for (const d of CHECK_DEFINITIONS) {
    for (const r of seen.get(d.id) ?? []) {
      const text = d[`${r}_when` as "pass_when" | "fail_when" | "unresolved_when" | "unknown_when"];
      if (text === "not used") problems.push(`${d.id} returned ${r} on a real route but the registry says "${r}: not used"`);
    }
  }
  assert.deepEqual(problems, []);
  // Every check id in the registry is one the compiler ran, and vice versa.
  assert.deepEqual([...seen.keys()].sort(), CHECK_DEFINITIONS.map((d) => d.id).sort());
  assert.deepEqual([...CORE_CHECK_IDS].sort(), ["boundary-compatibility", "conservation", "driver-regime-sufficiency", "energy-form-continuity", "thermodynamic-bound"]);
});

// Results the current dataset happens not to exercise are pinned with synthetic routes so the
// registry text cannot claim a result the code never returns, or omit one it does.
const units = new UnitTable([
  { symbol: "V", name: "volt", dimension: dim({ M: 1, L: 2, T: -3, I: -1 }) },
  { symbol: "K", name: "kelvin", dimension: dim({ Th: 1 }) },
]);
const entities: Entity[] = [
  { id: "quantity:temperature-difference", type: "quantity", name: "ΔT", aliases: [], summary: "", dimension: dim({ Th: 1 }), condition_tags: [], tags: [] },
  { id: "quantity:electric-potential", type: "quantity", name: "V", aliases: [], summary: "", dimension: dim({ M: 1, L: 2, T: -3, I: -1 }), condition_tags: [], tags: [] },
  { id: "disequilibrium:conditional", type: "disequilibrium", name: "conditional driver", aliases: [], summary: "", exergy: "conditional", condition_tags: [], tags: [] },
  { id: "phenomenon:x", type: "phenomenon", name: "x", aliases: [], summary: "", condition_tags: [], tags: [] },
  { id: "carrier:y", type: "carrier", name: "y", aliases: [], summary: "", condition_tags: [], tags: [] },
  { id: "output:z", type: "output", name: "z", aliases: [], summary: "", condition_tags: [], tags: [] },
] as Entity[];
const ctx: PhysicsContext = { entity: (id) => entities.find((e) => e.id === id), units, conflicts: [], boundedBy: () => [] };
const claim = (id: string, subject: string, object: string, extra: Partial<Claim> = {}): Claim =>
  ({
    id,
    subject,
    predicate: "drives",
    object,
    conditions: [],
    condition_tags: [],
    evidence: ["source:s"],
    status: "demonstrated",
    energy: { input: "thermal", output: "electrical" },
    ...extra,
  }) as Claim;

test("dimensional returns unresolved when only some steps carry a relation, as the registry now says", () => {
  const withRel = claim("claim:a", "disequilibrium:conditional", "phenomenon:x", {
    relation: { formula: "ΔV = S · ΔT", input: "quantity:temperature-difference", output: "quantity:electric-potential", coefficient_unit: "V/K" },
  });
  const r = checkDimensional(ctx, [withRel, claim("claim:b", "phenomenon:x", "carrier:y"), claim("claim:c", "carrier:y", "output:z")]);
  assert.equal(r.result, "unresolved");
  const d = CHECK_DEFINITIONS.find((x) => x.id === "dimensional")!;
  assert.notEqual(d.unresolved_when, "not used");
});

test("conservation returns unresolved for a source whose exergy is conditional, as the registry now says", () => {
  const r = checkConservation(ctx, [claim("claim:a", "disequilibrium:conditional", "phenomenon:x"), claim("claim:c", "phenomenon:x", "output:z")]);
  assert.equal(r.result, "unresolved");
  const d = CHECK_DEFINITIONS.find((x) => x.id === "conservation")!;
  assert.match(d.unresolved_when, /conditional/);
});

test("the enumeration bounds are published with the graph and no source is silently truncated", () => {
  assert.equal(typeof graph.meta.enumeration.max_claims_per_route, "number");
  assert.equal(typeof graph.meta.enumeration.max_routes_per_source, "number");
  assert.ok(Array.isArray(graph.meta.enumeration.sources_at_cap));
  for (const id of graph.meta.enumeration.sources_at_cap)
    assert.ok(
      graph.entities.some((e) => e.id === id),
      `${id} is not an entity`,
    );
});
