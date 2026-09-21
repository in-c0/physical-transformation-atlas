import { test } from "node:test";
import assert from "node:assert/strict";
import { UnitTable, checkDimensional, checkBoundaryCompatibility, checkConservation, checkDriverRegimeSufficiency, dim, equal, format, type PhysicsContext } from "@pta/physics";
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
  { id: "disequilibrium:temperature-gradient", type: "disequilibrium", name: "∇T", aliases: [], summary: "", exergy: "positive", condition_tags: [], tags: [], regime_provides: ["thermal:spatial-temperature-gradient"], regime_excludes: [] },
  { id: "disequilibrium:uniform-thermal-energy", type: "disequilibrium", name: "T0", aliases: [], summary: "", exergy: "none", condition_tags: [], tags: [] },
  { id: "phenomenon:seebeck-effect", type: "phenomenon", name: "Seebeck", aliases: [], summary: "", condition_tags: [], tags: [] },
  { id: "phenomenon:thermogalvanic-effect", type: "phenomenon", name: "Thermogalvanic", aliases: [], summary: "", condition_tags: [], tags: [] },
  { id: "output:electricity", type: "output", name: "Electricity", aliases: [], summary: "", condition_tags: [], tags: [] },
];
// Pass 26: the synthetic context treats every tag as a medium requirement on region "active" unless a claim scopes it itself.
const ctx: PhysicsContext = {
  entity: (id) => entities.find((e) => e.id === id),
  units: table,
  conflicts: [{ a: "env-vacuum", b: "env-aqueous", reason: "vacuum vs water" }],
  exclusiveGroups: [{ id: "material-state", members: ["state-solid", "state-liquid", "state-gas", "state-plasma"], scope: "medium", rule: "one state per region" }],
  interfaces: [],
  requirementsOf: (c) => (c.condition_requirements.length ? c.condition_requirements : c.condition_tags.map((tag) => ({ tag, scope: "medium" as const, region: "active" }))),
  boundedBy: () => [],
};
const base: Omit<Claim, "id" | "subject" | "predicate" | "object"> = {
  conditions: [],
  condition_tags: [],
  condition_requirements: [],
  regime_requires: [],
  regime_provides: [],
  regime_external: [],
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
  // pass 26: scope and region decide — the same two tags on different regions of one step do not conflict,
  // an exclusive group conflicts like a listed pair, a demonstrated interface record resolves a transition and a theoretical one does not
  const twoRegions: Claim = { ...within, id: "claim:two-regions", condition_tags: [], condition_requirements: [{ tag: "env-vacuum", scope: "medium", region: "gap" }, { tag: "env-aqueous", scope: "medium", region: "active" }] };
  assert.equal(checkBoundaryCompatibility(ctx, [twoRegions]).result, "pass");
  const gas: Claim = { ...a, id: "claim:gas", condition_tags: ["state-gas"] };
  const solid: Claim = { ...b, id: "claim:solid", condition_tags: ["state-solid"] };
  const r = checkBoundaryCompatibility(ctx, [gas, solid]);
  assert.equal(r.result, "unresolved");
  assert.match(r.detail, /^interface unrecorded/);
  const record = (status: "demonstrated" | "theoretical") => ({
    ...ctx,
    interfaces: [{ id: "interface:x", location: { between_claims: { from_claim: "claim:gas", to_claim: "claim:solid" } }, kind: "gas-solid-acoustic-boundary" as const, from_region: "gas", to_region: "solid", carrier: null, handoff_token: null, relation: null, conditions: [], condition_requirements: [], evidence: ["source:x"], status, notes: null, review: { canonical: true, last_reviewed: null } }],
  });
  assert.equal(checkBoundaryCompatibility(record("demonstrated"), [gas, solid]).result, "pass");
  const t = checkBoundaryCompatibility(record("theoretical"), [gas, solid]);
  assert.equal(t.result, "unresolved");
  assert.match(t.detail, /^theoretical interface recorded/);
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

test("driver / regime sufficiency (loop-3 pass 30): a static gradient supplies a spatial gradient, not temporal change; a stated external condition supplies its own regime; an excluding source fails", () => {
  const seebeck: Claim = { ...base, id: "claim:s", subject: "disequilibrium:temperature-gradient", predicate: "drives", object: "phenomenon:seebeck-effect", regime_requires: ["thermal:spatial-temperature-gradient"] };
  assert.equal(checkDriverRegimeSufficiency(ctx, [seebeck]).result, "pass");
  const pyro: Claim = { ...seebeck, id: "claim:p", regime_requires: ["thermal:temporal-temperature-change"] };
  const r = checkDriverRegimeSufficiency(ctx, [pyro]);
  assert.equal(r.result, "unresolved");
  assert.match(r.detail, /nothing before it records supplying it/);
  const thermoacoustic: Claim = { ...seebeck, id: "claim:t", regime_requires: ["thermal:spatial-temperature-gradient", "thermal:gradient-above-critical"], regime_external: ["thermal:gradient-above-critical"] };
  assert.equal(checkDriverRegimeSufficiency(ctx, [thermoacoustic]).result, "pass");
  const none: Claim = { ...seebeck, id: "claim:n", regime_requires: [] };
  assert.equal(checkDriverRegimeSufficiency(ctx, [none]).result, "unknown");
  // a preceding step's produced disequilibrium supplies its regime to later steps
  const chain: Claim = { ...base, id: "claim:c", subject: "disequilibrium:uniform-thermal-energy", predicate: "produces", object: "disequilibrium:temperature-gradient" };
  assert.equal(checkDriverRegimeSufficiency(ctx, [chain, seebeck]).result, "pass");
  // an excluding source fails rather than waits
  const strict = { ...ctx, entity: (id: string) => (id === "disequilibrium:temperature-gradient" ? { ...entities.find((e) => e.id === id)!, regime_excludes: ["thermal:temporal-temperature-change"] } : entities.find((e) => e.id === id)) };
  assert.equal(checkDriverRegimeSufficiency(strict, [pyro]).result, "fail");
});
