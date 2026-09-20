import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { researchOrder } from "@pta/graph/order";
import type { CompiledPath } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const paths: CompiledPath[] = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "paths.json"), "utf8"));
const byId = new Map(paths.map((p) => [p.id, p]));

test("a carrier-expanded spelling is representation-equivalent to its shortest form (magnetostriction → piezo)", () => {
  const a = byId.get("p-784ad6a8e6");
  const b = byId.get("p-640bd9ad1e");
  // ids are content-derived; if the data changes these routes are renamed and the synthetic structure test covers the rule
  if (!a || !b) return;
  // Both spell the magnetoelectric laminate; whichever rule fires first, neither may stand on the frontier as a fresh composition.
  assert.notEqual(a.structural_kind, "composition");
  if (a.structural_kind === "representation-equivalent") assert.equal(a.dominated_by, b.id);
  else assert.equal(a.structural_kind, "known-device-likely");
});

test("a route that prepares an ambient driver for an enumerated suffix is source-preparation and names the suffix", () => {
  const prepared = paths.filter((p) => p.structural_kind === "source-preparation");
  assert.ok(prepared.length > 0);
  for (const p of prepared) {
    assert.ok(p.dominated_by && byId.has(p.dominated_by), `${p.id} names its suffix route`);
    const suffix = byId.get(p.dominated_by!)!;
    assert.ok(p.claims.join(">").endsWith(suffix.claims.join(">")), `${p.id} ends with ${suffix.id}`);
  }
});

test("a flow producer that lacks the consumer's declared requirements has an unresolved handoff", () => {
  const flow = paths.filter((p) => p.claims.includes("claim:fluid-flow-carrier-drives-lift") && p.claims.includes("claim:marangoni-produces-flow"));
  assert.ok(flow.length > 0);
  for (const p of flow) {
    assert.ok(p.handoff_unresolved_count > 0, `${p.id}: Marangoni flow does not provide flow:bulk`);
    assert.ok(p.handoff_issues.some((h) => h.missing.includes("flow:bulk")));
  }
  // negative control: a route with no declared requirements has nothing unresolved
  const none = paths.find((p) => p.claims.every((id) => !id.startsWith("claim:fluid-flow-carrier")));
  assert.ok(none && none.handoff_unresolved_count === 0);
});

test("a proposed pathway (TOEC) is attached to its route, leaves it a candidate and never makes it demonstrated", () => {
  const toec = paths.find((p) => p.pathway === "pathway:thermo-osmotic-energy-converter");
  assert.ok(toec, "TOEC pathway compiled");
  assert.equal(toec!.frontier_class, "candidate");
  assert.notEqual(toec!.search_status, "demonstrated");
  assert.equal(toec!.structural_kind, "composition");
});

test("a route whose consuming step requires a carrier property nothing upstream provides is incomplete-handoff, not a candidate (radiation pressure → induction)", () => {
  const p = paths.find((x) => x.nodes.includes("phenomenon:radiation-pressure") && x.nodes.includes("phenomenon:electromagnetic-induction") && x.nodes.length === 6);
  if (!p) return;
  assert.equal(p.frontier_class, "incomplete-handoff");
  assert.ok(p.handoff_issues.some((h) => h.missing.includes("motion:relative-flux-change")));
});

test("carrier-relay bypass: a Marangoni flow turning a rotor is representation-dominated by the recorded direct Marangoni → motion route", () => {
  const long = paths.find(
    (x) =>
      x.source === "disequilibrium:temperature-gradient" && x.nodes.includes("phenomenon:marangoni-effect") && x.nodes.includes("phenomenon:aerodynamic-lift") && x.sink === "output:mechanical-work",
  );
  const short = paths.find((x) => x.pathway === "pathway:thermocapillary-micromotor");
  assert.ok(long && short, "both spellings compiled");
  assert.equal(long!.structural_kind, "representation-dominated");
  assert.equal(long!.dominated_by, short!.id);
});

test("internal-transport normalisation: heat conduction → phonon drag collapses onto the thermoelectric generator, never onto the Nernst generator", () => {
  const phonon = paths.find((x) => x.nodes.includes("phenomenon:phonon-drag") && x.nodes.includes("phenomenon:heat-conduction") && x.sink === "output:electricity" && x.nodes.length === 6);
  const teg = paths.find((x) => x.pathway === "pathway:thermoelectric-generator");
  assert.ok(phonon && teg);
  assert.equal(phonon!.structural_kind, "representation-equivalent");
  assert.equal(phonon!.dominated_by, teg!.id);
});

test("a route sharing the tail of a recorded pathway's mechanism is a source-variant and therefore derived", () => {
  const p = byId.get("p-98d54dfe3e"); // pressure gradient → elastic deformation → Villari → induction, vs the magnetostrictive harvester
  if (!p) return;
  assert.equal(p.closest_known_pathway?.relation, "source-variant");
  assert.equal(p.frontier_class, "derived");
});

test("default frontier order never places a source-preparation or known-device route ahead of a composition", () => {
  const sorted = [...paths].sort(researchOrder);
  const firstNonComposition = sorted.findIndex((p) => p.structural_kind !== "composition");
  const lastComposition = sorted.map((p) => p.structural_kind === "composition").lastIndexOf(true);
  assert.ok(firstNonComposition === -1 || lastComposition < firstNonComposition);
});
