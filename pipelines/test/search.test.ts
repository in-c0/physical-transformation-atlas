import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { AtlasIndex } from "@pta/graph/query";

const root = resolve(import.meta.dirname, "..", "..");
const g = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "graph.json"), "utf8"));
g.paths = [];
const index = new AtlasIndex(g);
const top = (q: string) => index.search(q, 5).map((h) => h.id);

test("a query that is the start of an entity name ranks that entity first, above alias matches", () => {
  assert.equal(top("seebeck")[0], "phenomenon:seebeck-effect");
  assert.equal(top("salinity")[0], "disequilibrium:salinity-gradient");
});

test("a symbol query finds the entity that carries the symbol", () => {
  assert.equal(top("ΔT")[0], "quantity:temperature-difference");
  assert.ok(top("∇T").includes("disequilibrium:temperature-gradient"));
});

test("everyday phrases resolve to drivers and effects", () => {
  assert.equal(top("waste heat")[0], "disequilibrium:temperature-gradient");
  assert.equal(top("sunlight")[0], "disequilibrium:radiation-flux");
  const osmotic = top("osmotic power");
  assert.ok(osmotic.slice(0, 3).includes("disequilibrium:salinity-gradient"), "salinity gradient in the top three for osmotic power");
  assert.ok(osmotic.includes("phenomenon:pressure-retarded-osmosis"), "PRO surfaces for osmotic power");
});

test("named pathways are searchable and full-token matches precede partial ones", () => {
  const hits = index.search("waste heat", 8);
  assert.ok(hits.some((h) => h.kind === "pathway" && h.name === "Thermoelectric generator"), "the TEG pathway surfaces for waste heat");
  const q = index.search("thermal gradient", 12);
  const firstPartial = q.findIndex((h) => !/thermal|gradient/i.test(h.name) || !(/thermal|temperature/i.test(h.name) && /gradient/i.test(h.name)));
  const lastFull = q.map((h) => /thermal|temperature/i.test(h.name) && /gradient/i.test(h.name)).lastIndexOf(true);
  assert.ok(firstPartial === -1 || lastFull < firstPartial || lastFull === -1, "every full-token match precedes the first partial match");
});

test("negative control: a token never matches mid-word", () => {
  assert.ok(!top("rain").some((id) => id.includes("strain")), "rain must not match strain");
});
