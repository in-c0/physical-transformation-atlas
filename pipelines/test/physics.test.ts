import { test } from "node:test";
import assert from "node:assert/strict";
import { UnitTable, checkDimensional, checkBoundaryCompatibility, checkConservation, dim, equal, format, type PhysicsContext } from "@pta/physics";
import type { Claim, Entity, UnitDef } from "@pta/schema";

const units: UnitDef[] = [
  { symbol: "V", name: "volt", dimension: dim({ M: 1, L: 2, T: -3, I: -1 }) },
  { symbol: "K", name: "kelvin", dimension: dim({ Th: 1 }) },
  { symbol: "m", name: "metre", dimension: dim({ L: 1 }) },
  { symbol: "W", name: "watt", dimension: dim({ M: 1, L: 2, T: -3 }) },
  { symbol: "C", name: "coulomb", dimension: dim({ I: 1, T: 1 }) },
  { symbol: "N", name: "newton", dimension: dim({ M: 1, L: 1, T: -2 }) },
  { symbol: "s", name: "second", dimension: dim({ T: 1 }) },
];
const table = new UnitTable(units);

test("unit parsing handles quotients, products and powers", () => {
  assert.ok(equal(table.parse("V/K"), dim({ M: 1, L: 2, T: -3, I: -1, Th: -1 })));
  assert.ok(equal(table.parse("W/(m K)"), dim({ M: 1, L: 1, T: -3, Th: -1 })));
  assert.ok(equal(table.parse("C/N"), dim({ I: 1, T: 3, M: -1, L: -1 })));
  // mobility: m² / (V·s) = M⁻¹ T² I
  assert.ok(equal(table.parse("m^2/(V s)"), dim({ M: -1, T: 2, I: 1 })));
  assert.equal(format(table.parse("1")), "1");
  assert.throws(() => table.parse("furlong/K"), /unknown unit symbol/);
});

const entities: Entity[] = [
  { id: "quantity:temperature-difference", type: "quantity", name: "ΔT", aliases: [], summary: "", dimension: dim({ Th: 1 }), condition_tags: [], tags: [] },
  { id: "quantity:electric-potential", type: "quantity", name: "V", aliases: [], summary: "", dimension: dim({ M: 1, L: 2, T: -3, I: -1 }), condition_tags: [], tags: [] },
  { id: "disequilibrium:temperature-gradient", type: "disequilibrium", name: "∇T", aliases: [], summary: "", exergy: "positive", condition_tags: [], tags: [] },
  { id: "disequilibrium:uniform-thermal-energy", type: "disequilibrium", name: "T0", aliases: [], summary: "", exergy: "none", condition_tags: [], tags: [] },
  { id: "phenomenon:seebeck-effect", type: "phenomenon", name: "Seebeck", aliases: [], summary: "", condition_tags: [], tags: [] },
  { id: "phenomenon:thermogalvanic-effect", type: "phenomenon", name: "Thermogalvanic", aliases: [], summary: "", condition_tags: [], tags: [] },
  { id: "output:electricity", type: "output", name: "Electricity", aliases: [], summary: "", condition_tags: [], tags: [] },
];
const ctx: PhysicsContext = {
  entity: (id) => entities.find((e) => e.id === id),
  units: table,
  conflicts: [{ a: "env-vacuum", b: "env-aqueous", reason: "vacuum vs water" }],
  boundedBy: () => [],
};
const base: Omit<Claim, "id" | "subject" | "predicate" | "object"> = {
  conditions: [],
  condition_tags: [],
  evidence: ["source:x"],
  status: "established",
  review: { canonical: true, last_reviewed: "2026-09-19" },
};

test("dimensional check passes a consistent constitutive relation and fails an inconsistent one (negative control)", () => {
  const good: Claim = {
    ...base,
    id: "claim:good",
    subject: "disequilibrium:temperature-gradient",
    predicate: "drives",
    object: "phenomenon:seebeck-effect",
    relation: { formula: "ΔV = S·ΔT", input: "quantity:temperature-difference", output: "quantity:electric-potential", coefficient_unit: "V/K" },
  };
  const bad: Claim = { ...good, id: "claim:bad", relation: { ...good.relation!, coefficient_unit: "W/K" } };
  assert.equal(checkDimensional(ctx, [good]).result, "pass");
  const r = checkDimensional(ctx, [bad]);
  assert.equal(r.result, "fail");
  assert.match(r.detail, /claim:bad/);
});

test("boundary check: conflict inside a step fails, conflict across adjacent steps is unresolved", () => {
  const a: Claim = { ...base, id: "claim:a", subject: "disequilibrium:temperature-gradient", predicate: "drives", object: "phenomenon:seebeck-effect", condition_tags: ["env-vacuum"] };
  const b: Claim = { ...base, id: "claim:b", subject: "phenomenon:seebeck-effect", predicate: "converts_into", object: "output:electricity", condition_tags: ["env-aqueous"] };
  assert.equal(checkBoundaryCompatibility(ctx, [a, b]).result, "unresolved");
  const within: Claim = { ...a, id: "claim:within", condition_tags: ["env-vacuum", "env-aqueous"] };
  assert.equal(checkBoundaryCompatibility(ctx, [within]).result, "fail");
});

test("conservation check: a source with no exergy fails (second law)", () => {
  const c: Claim = {
    ...base,
    id: "claim:c",
    subject: "disequilibrium:uniform-thermal-energy",
    predicate: "drives",
    object: "phenomenon:seebeck-effect",
    energy: { input: "thermal", output: "electrical" },
  };
  assert.equal(checkConservation(ctx, [c]).result, "fail");
  const ok: Claim = { ...c, id: "claim:ok", subject: "disequilibrium:temperature-gradient" };
  assert.equal(checkConservation(ctx, [ok]).result, "pass");
});
