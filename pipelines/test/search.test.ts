import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { AtlasIndex } from "@pta/graph/query";

const root = resolve(import.meta.dirname, "..", "..");
const g = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "graph.json"), "utf8"));
g.paths = [];
const index = new AtlasIndex(g);
const top = (q: string) => index.search(q, 5).map((h) => h.entity.id);

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
  assert.ok(top("osmotic power")[0].startsWith("coupling:osmotic") || top("osmotic power")[0].startsWith("disequilibrium:"));
});

test("negative control: a token never matches mid-word", () => {
  assert.ok(!top("rain").some((id) => id.includes("strain")), "rain must not match strain");
});
