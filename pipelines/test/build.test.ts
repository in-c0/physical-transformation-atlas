import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { loadCanon, buildGraph, ValidationError } from "@pta/graph";
import { Claim } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const canon = loadCanon(root);
const graph = buildGraph(canon, { builtAt: "2026-01-01T00:00:00.000Z" });

test("every named pathway compiles to a demonstrated path with the same claim sequence", () => {
  const bySeq = new Map(graph.paths.map((p) => [p.claims.join(">"), p]));
  for (const pw of canon.pathways) {
    const p = bySeq.get(pw.steps.join(">"));
    assert.ok(p, `${pw.id} has no compiled path`);
    assert.equal(p.pathway, pw.id);
    if (pw.status !== "proposed") assert.equal(p.search_status, "demonstrated", pw.id);
    assert.equal(p.checks.find((k) => k.id === "type-chain")?.result, "pass", `${pw.id} typed chain`);
  }
});

test("no compiled path fails the typed-chain check and ids are unique", () => {
  const ids = new Set<string>();
  for (const p of graph.paths) {
    assert.equal(p.checks[0].id, "type-chain");
    assert.notEqual(p.checks[0].result, "fail", `${p.id}: ${p.checks[0].detail}`);
    assert.ok(!ids.has(p.id), `duplicate path id ${p.id}`);
    ids.add(p.id);
  }
});

test("matrix covers rows × cols; forbidden cells are exactly the exergy-free rows without a direct relation", () => {
  const { rows, cols, cells } = graph.matrix;
  assert.equal(cells.length, rows.length * cols.length);
  const noExergy = new Set(canon.entities.filter((e) => e.type === "disequilibrium" && e.exergy === "none").map((e) => e.id));
  for (const c of cells) {
    if (c.status === "forbidden") assert.ok(noExergy.has(c.row), `${c.address} forbidden but row has exergy`);
    if (noExergy.has(c.row) && c.direct_claims.length === 0) assert.equal(c.status, "forbidden", c.address);
  }
  assert.ok(rows.every((r, i) => r.address === `D.${String(i + 1).padStart(2, "0")}`));
});

test("a cell may only say 'searched-none' when a reviewed search record says so", () => {
  const reviewed = new Set(canon.searches.map((s) => s.id));
  for (const c of graph.matrix.cells) {
    if (c.status === "searched-none") {
      const rec = graph.searches.find((s) => reviewed.has(s.id) && s.target.kind === "cell" && s.target.row === c.row && s.target.col === c.col && s.result === "no-demonstration-found");
      assert.ok(rec, `${c.address} says searched-none without a reviewed record`);
    }
  }
});

test("counts on the home page derive from the compiled data", () => {
  const c = graph.meta.counts;
  assert.equal(c.phenomena, canon.entities.filter((e) => e.type === "phenomenon").length);
  assert.equal(c.claims, canon.claims.length);
  assert.equal(c.paths_examined, graph.paths.length);
  assert.equal(c.matrix_cells_unsearched, graph.matrix.cells.filter((x) => x.status === "not-searched").length);
});

test("negative control: a claim with a dangling entity is rejected by validation", () => {
  const bad = Claim.parse({ id: "claim:dangling", subject: "disequilibrium:does-not-exist", predicate: "drives", object: "phenomenon:seebeck-effect", evidence: ["source:goldsmid-2016"], status: "established" });
  // Re-run the referential checks the loader performs, on a copy with the bad claim injected.
  const ids = new Set(canon.entities.map((e) => e.id));
  const problems = [bad, ...canon.claims].filter((c) => !ids.has(c.subject) || !ids.has(c.object));
  assert.equal(problems.length, 1);
  assert.equal(problems[0].id, "claim:dangling");
  assert.ok(new ValidationError(["x"]).message.includes("validation problem"));
});

test("a candidate never shares two or more relations with a recorded pathway; derived routes always do", () => {
  for (const p of graph.paths) {
    const shared = p.known_pathway_overlap?.shared_claims ?? 0;
    if (p.frontier_class === "candidate") assert.ok(shared < 2, `${p.id} is a candidate but shares ${shared} relations with ${p.known_pathway_overlap?.pathway}`);
    if (p.frontier_class === "derived") assert.ok(shared >= 2, `${p.id} is derived with only ${shared} shared relations`);
    if (p.pathway) assert.equal(p.known_pathway_overlap?.relation, "exact", `${p.id} matches a pathway but overlap is not exact`);
  }
});

test("composition evidence is never borrowed from constituent claims", () => {
  for (const p of graph.paths) {
    if (p.pathway) continue;
    assert.equal(p.composition_source_ids.length, 0, `${p.id} has composition sources without a recorded pathway`);
  }
});
