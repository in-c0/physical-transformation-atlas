import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { evaluateFormula, checkThermodynamicBound, checkDimensional, checkConservation, dim, UnitTable, type PhysicsContext } from "@pta/physics";
import type { Claim, CompiledPath, Entity, Pathway } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const paths: CompiledPath[] = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "paths.json"), "utf8"));
const byPathway = (id: string) => paths.find((p) => p.pathway === id);
const bound = (p: CompiledPath) => p.checks.find((k) => k.id === "thermodynamic-bound")!;

test("formula evaluator: Carnot, Landsberg and ZT bounds from named inputs; malformed input is null, never a number", () => {
  assert.ok(Math.abs(evaluateFormula("1 - T_c_K/T_h_K", { T_h_K: 850, T_c_K: 300 })! - 0.647) < 0.001);
  assert.ok(Math.abs(evaluateFormula("1 - (4/3)*(T_c_K/T_s_K) + (1/3)*(T_c_K/T_s_K)^4", { T_s_K: 6000, T_c_K: 300 })! - 0.9333) < 0.001);
  const zt = evaluateFormula("(1 - T_c_K/T_h_K) * (sqrt(1 + ZT) - 1) / (sqrt(1 + ZT) + T_c_K/T_h_K)", { T_h_K: 500, T_c_K: 300, ZT: 1 })!;
  assert.ok(zt > 0.07 && zt < 0.09, `ZT bound ${zt}`);
  assert.equal(evaluateFormula("1 - T_c_K/T_h_K", { T_h_K: 850 }), null);
  assert.equal(evaluateFormula("1 - T_c_K/T_h_K)", { T_h_K: 850, T_c_K: 300 }), null);
  assert.equal(evaluateFormula("sqrt(-1)", {}), null);
});

test("the thermoelectric generator passes the thermodynamic bound because Carnot is evaluated from its own measured temperatures", () => {
  const p = byPathway("pathway:thermoelectric-generator")!;
  assert.equal(bound(p).result, "pass");
  assert.match(bound(p).detail, /12\.0% ≤ Carnot limit \(64\.7%\)/);
});

test("regression pathways: a name is never a pass, a benchmark never a fail", () => {
  // Rankine 0.47 vs a Curzon–Ahlborn benchmark ≈ 0.41 must not fail; without recorded temperatures Carnot is unresolved.
  const rankine = byPathway("pathway:rankine-steam-plant")!;
  assert.equal(bound(rankine).result, "unresolved");
  assert.doesNotMatch(bound(rankine).detail, /exceeds/);
  // Wind turbine 0.52 is a system efficiency, not a rotor power coefficient: Betz stays unresolved.
  const wind = byPathway("pathway:wind-turbine")!;
  assert.equal(bound(wind).result, "unresolved");
  assert.match(bound(wind).detail, /power-coefficient/);
  // Photovoltaic 0.27 states no Shockley–Queisser basis: unresolved, not pass.
  const pv = byPathway("pathway:photovoltaic-module")!;
  assert.equal(bound(pv).result, "unresolved");
  assert.match(bound(pv).detail, /basis/);
  // The microwave rectenna must not acquire Landsberg or Shockley–Queisser.
  const rectenna = byPathway("pathway:rectenna-microwave")!;
  assert.doesNotMatch(bound(rectenna).detail, /Landsberg|Shockley/);
  assert.notEqual(bound(rectenna).result, "fail");
  // No route in the dataset fails a bound (no recorded pathway violates a genuine hard limit).
  assert.equal(paths.filter((p) => bound(p).result === "fail").length, 0);
});

// Synthetic negative controls for the typed evaluator.
const units = new UnitTable([
  { symbol: "V", name: "volt", dimension: dim({ M: 1, L: 2, T: -3, I: -1 }) },
  { symbol: "K", name: "kelvin", dimension: dim({ Th: 1 }) },
]);
const carnot: Entity = {
  id: "constraint:carnot",
  type: "constraint",
  name: "Carnot limit",
  aliases: [],
  summary: "",
  constraint_kind: "formula-bound",
  metric: "conversion-efficiency",
  formula: "1 - T_c_K/T_h_K",
  formula_inputs: ["T_h_K", "T_c_K"],
  applies_to_sources: [],
  applies_to_outputs: [],
  applies_to_phenomena: [],
  condition_tags: [],
  tags: [],
} as unknown as Entity;
const ca: Entity = {
  ...carnot,
  id: "constraint:ca",
  name: "Curzon–Ahlborn",
  constraint_kind: "benchmark",
  metric: "conversion-efficiency-at-maximum-power",
  formula: "1 - sqrt(T_c_K/T_h_K)",
} as Entity;
const entities: Entity[] = [
  {
    id: "disequilibrium:heat",
    type: "disequilibrium",
    name: "heat",
    aliases: [],
    summary: "",
    exergy: "positive",
    condition_tags: [],
    tags: [],
    applies_to_sources: [],
    applies_to_outputs: [],
    applies_to_phenomena: [],
  },
  {
    id: "disequilibrium:uniform",
    type: "disequilibrium",
    name: "uniform heat",
    aliases: [],
    summary: "",
    exergy: "none",
    condition_tags: [],
    tags: [],
    applies_to_sources: [],
    applies_to_outputs: [],
    applies_to_phenomena: [],
  },
  { id: "phenomenon:engine", type: "phenomenon", name: "engine", aliases: [], summary: "", condition_tags: [], tags: [], applies_to_sources: [], applies_to_outputs: [], applies_to_phenomena: [] },
  {
    id: "output:work",
    type: "output",
    name: "work",
    aliases: [],
    summary: "",
    energy_form: "mechanical",
    condition_tags: [],
    tags: [],
    applies_to_sources: [],
    applies_to_outputs: [],
    applies_to_phenomena: [],
  },
  {
    id: "quantity:temperature-difference",
    type: "quantity",
    name: "ΔT",
    aliases: [],
    summary: "",
    dimension: dim({ Th: 1 }),
    condition_tags: [],
    tags: [],
    applies_to_sources: [],
    applies_to_outputs: [],
    applies_to_phenomena: [],
  },
  {
    id: "quantity:electric-potential",
    type: "quantity",
    name: "V",
    aliases: [],
    summary: "",
    dimension: dim({ M: 1, L: 2, T: -3, I: -1 }),
    condition_tags: [],
    tags: [],
    applies_to_sources: [],
    applies_to_outputs: [],
    applies_to_phenomena: [],
  },
] as unknown as Entity[];
const ctx = (bounds: Entity[]): PhysicsContext => ({
  entity: (id) => entities.find((e) => e.id === id),
  units,
  conflicts: [],
  boundedBy: (id) => (id === "phenomenon:engine" ? bounds.map((constraint) => ({ constraint, claim: {} as Claim })) : []),
});
const claims: Claim[] = [
  {
    id: "claim:a",
    subject: "disequilibrium:heat",
    predicate: "drives",
    object: "phenomenon:engine",
    conditions: [],
    condition_tags: [],
    evidence: ["source:s"],
    status: "established",
    energy: { input: "thermal", output: "mechanical" },
  } as Claim,
  {
    id: "claim:b",
    subject: "phenomenon:engine",
    predicate: "converts_into",
    object: "output:work",
    conditions: [],
    condition_tags: [],
    evidence: ["source:s"],
    status: "established",
    energy: { input: "mechanical", output: "mechanical" },
  } as Claim,
];
const pathwayWith = (eff: number, params?: Record<string, number>): Pathway =>
  ({
    id: "pathway:x",
    name: "x",
    steps: ["claim:a", "claim:b"],
    demonstrated_with: [],
    evidence: [],
    status: "demonstrated",
    knowledge_level: "K5",
    environment: [],
    summary: "",
    performance: {
      measurements: [
        { quantity: "efficiency", value: `${eff}`, value_numeric: eff, unit: "1", metric: "conversion-efficiency", parameters: params, scope: "device", conditions: "", sources: ["source:s"] },
      ],
    },
  }) as unknown as Pathway;

test("negative control: an efficiency above the Carnot ceiling evaluated from its own temperatures fails; without temperatures it is unresolved; a benchmark alone is unknown", () => {
  assert.equal(checkThermodynamicBound(ctx([carnot]), claims, pathwayWith(0.7, { T_h_K: 500, T_c_K: 300 })).result, "fail");
  assert.equal(checkThermodynamicBound(ctx([carnot]), claims, pathwayWith(0.3, { T_h_K: 500, T_c_K: 300 })).result, "pass");
  assert.equal(checkThermodynamicBound(ctx([carnot]), claims, pathwayWith(0.7)).result, "unresolved");
  const onlyBenchmark = checkThermodynamicBound(ctx([ca]), claims, pathwayWith(0.7, { T_h_K: 500, T_c_K: 300 }));
  assert.equal(onlyBenchmark.result, "unknown");
  assert.match(onlyBenchmark.detail, /other recorded limits: Curzon–Ahlborn/);
});

test("dimensional: a route whose only conversion step carries a balanced relation passes; a conversion step without one is unresolved", () => {
  const withRel = [
    { ...claims[0], relation: { formula: "ΔV = S · ΔT", input: "quantity:temperature-difference", output: "quantity:electric-potential", coefficient_unit: "V/K" } } as Claim,
    claims[1],
  ];
  assert.equal(checkDimensional(ctx([]), withRel).result, "pass");
  const extraDrive = [
    ...withRel,
    { id: "claim:c", subject: "output:work", predicate: "drives", object: "phenomenon:engine", conditions: [], condition_tags: [], evidence: [], status: "established" } as Claim,
  ];
  const r = checkDimensional(ctx([]), extraDrive);
  assert.equal(r.result, "unresolved");
  assert.match(r.detail, /1 conversion step without a relation: claim:c/);
});

test("source work availability: a zero-exergy source fails; an epistemically contradicted step no longer counts as a conservation failure", () => {
  const none = [{ ...claims[0], subject: "disequilibrium:uniform" } as Claim, claims[1]];
  assert.equal(checkConservation(ctx([]), none).result, "fail");
  const contradicted = [{ ...claims[0], status: "contradicted" } as Claim, claims[1]];
  assert.equal(checkConservation(ctx([]), contradicted).result, "pass");
});
