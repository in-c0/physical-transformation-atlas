import { test } from "node:test";
import assert from "node:assert/strict";
import { classify, collapseForms, familySeams, hasBacktracking, signature, type RouteCore } from "@pta/graph";

const route = (over: Partial<RouteCore> & { id: string }): RouteCore => ({
  source: "disequilibrium:temperature-gradient",
  sinkForm: "electrical",
  phenomena: [],
  families: [],
  forms: ["thermal", "electrical"],
  exact: false,
  knownDevice: false,
  ...over,
});

test("one effect plus bookkeeping is atomic, never a composition", () => {
  const r = route({ id: "a", phenomena: ["phenomenon:seebeck-effect"], families: [["coupling:thermoelectric"]] });
  assert.equal(classify([r], new Set()).get("a")!.kind, "atomic");
});

test("a carrier-expanded copy of a recorded pathway is representation-equivalent", () => {
  const named = signature("disequilibrium:temperature-gradient", ["phenomenon:seebeck-effect", "phenomenon:x"], "electrical");
  const r = route({ id: "b", phenomena: ["phenomenon:seebeck-effect", "phenomenon:x"], families: [["coupling:thermoelectric"], ["coupling:y"]] });
  const k = classify([r], new Set([named])).get("b")!;
  assert.equal(k.kind, "representation-equivalent");
  assert.equal(k.semanticOverlap, true);
});

test("a strict zero-novelty superpath is dominated by the shorter route", () => {
  const short = route({ id: "s", phenomena: ["phenomenon:p", "phenomenon:q"], families: [["coupling:a"], ["coupling:b"]], forms: ["thermal", "spin", "electrical"] });
  const long = route({ id: "l", phenomena: ["phenomenon:p", "phenomenon:transport", "phenomenon:q"], families: [["coupling:a"], ["coupling:a"], ["coupling:b"]], forms: ["thermal", "spin", "electrical"] });
  const k = classify([short, long], new Set());
  assert.equal(k.get("s")!.kind, "composition");
  assert.equal(k.get("l")!.kind, "representation-dominated");
  assert.equal(k.get("l")!.dominatedBy, "s");
});

test("a true two-effect cross-family composition stays a composition", () => {
  const r = route({ id: "c", phenomena: ["phenomenon:thermal-expansion", "phenomenon:piezoelectric-effect"], families: [["coupling:heat-engine"], ["coupling:piezoelectric"]], forms: ["thermal", "mechanical", "electrical"] });
  const k = classify([r], new Set()).get("c")!;
  assert.equal(k.kind, "composition");
  assert.equal(familySeams(r.families), 1);
});

test("energy backtracking and form collapsing", () => {
  assert.deepEqual(collapseForms(["thermal", "thermal", "electrical", undefined, "electrical"]), ["thermal", "electrical"]);
  assert.equal(hasBacktracking(["electrical", "thermal", "electrical"]), true);
  assert.equal(hasBacktracking(["thermal", "mechanical", "electrical"]), false);
  const r = route({ id: "d", source: "disequilibrium:electric-potential-difference", phenomena: ["phenomenon:peltier-effect", "phenomenon:seebeck-effect"], families: [["coupling:thermoelectric"], ["coupling:thermoelectric"]], forms: ["electrical", "thermal", "electrical"] });
  assert.equal(classify([r], new Set()).get("d")!.kind, "energy-backtracking");
});

test("family-core collapse: two compositions with the same source, family sequence and sink form keep one representative", () => {
  const a: RouteCore = { id: "p-a", source: "d:heat", sinkForm: "electrical", phenomena: ["ph:marangoni", "ph:lift", "ph:induction"], families: [["c:marangoni"], ["c:turbo"], ["c:emi"]], forms: ["thermal", "kinetic", "mechanical", "electrical"], exact: false, knownDevice: false };
  const b: RouteCore = { ...a, id: "p-b", phenomena: ["ph:marangoni", "ph:lift", "ph:generator"] };
  const c: RouteCore = { ...a, id: "p-c", phenomena: ["ph:marangoni", "ph:lift", "ph:mhd"], families: [["c:marangoni"], ["c:turbo"], ["c:mhd"]] };
  const out = classify([a, b, c], new Set());
  assert.equal(out.get("p-a")!.kind, "composition");
  assert.equal(out.get("p-b")!.kind, "representation-equivalent");
  assert.equal(out.get("p-b")!.dominatedBy, "p-a");
  assert.equal(out.get("p-c")!.kind, "composition", "a different family sequence is a different mechanism");
});
