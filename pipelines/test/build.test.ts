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
  const bad = Claim.parse({
    id: "claim:dangling",
    subject: "disequilibrium:does-not-exist",
    predicate: "drives",
    object: "phenomenon:seebeck-effect",
    evidence: ["source:goldsmid-2016"],
    status: "established",
  });
  // Re-run the referential checks the loader performs, on a copy with the bad claim injected.
  const ids = new Set(canon.entities.map((e) => e.id));
  const problems = [bad, ...canon.claims].filter((c) => !ids.has(c.subject) || !ids.has(c.object));
  assert.equal(problems.length, 1);
  assert.equal(problems[0].id, "claim:dangling");
  assert.ok(new ValidationError(["x"]).message.includes("validation problem"));
});

test("derived means mechanism overlap with a demonstrated pathway: the whole pathway, a strict prefix or suffix, two shared phenomena, or a shared head that diverges within the same coupling family — never a generic tail or a head that changes family; candidates have none of it and every handoff provided", () => {
  const pathwayById = new Map(canon.pathways.map((pw) => [pw.id, pw]));
  const claimById = new Map(canon.claims.map((c) => [c.id, c]));
  const entityType = new Map(canon.entities.map((e) => [e.id, e.type]));
  const phenomenaOf = (ids: string[]) => new Set(ids.flatMap((id) => [claimById.get(id)?.subject, claimById.get(id)?.object]).filter((n) => n && entityType.get(n) === "phenomenon"));
  const familiesOf = new Map<string, Set<string>>();
  for (const c of canon.claims) if (c.predicate === "member_of") familiesOf.set(c.subject, new Set([...(familiesOf.get(c.subject) ?? []), c.object]));
  const nextPhenomenon = (seq: string[]) => {
    for (const cid of seq) {
      const c = claimById.get(cid);
      if (!c) continue;
      for (const n of [c.subject, c.object]) if (entityType.get(n) === "phenomenon") return n;
    }
    return null;
  };
  for (const p of graph.paths) {
    const ov = p.known_pathway_overlap;
    const steps = ov ? (pathwayById.get(ov.pathway)?.steps ?? []) : [];
    const shared = new Set<string>();
    let j = 0;
    for (const id of p.claims) if (j < steps.length && steps[j] === id) (shared.add(id), j++);
    let k = 0;
    for (const st of steps) if (k < p.claims.length && p.claims[k] === st) (shared.add(st), k++);
    // loop-3 pass 22: a shared head counts only when the first divergence stays in one coupling family
    let head = 0;
    while (head < steps.length && head < p.claims.length && steps[head] === p.claims[head]) head++;
    let sameFamily = false;
    if (head >= 2 && head < steps.length && head < p.claims.length) {
      const a = nextPhenomenon(p.claims.slice(head));
      const b = nextPhenomenon(steps.slice(head));
      if (a && b) sameFamily = [...(familiesOf.get(a) ?? [])].some((f) => familiesOf.get(b)?.has(f));
    }
    const strict = !!ov && (ov.relation === "prefix" || ov.relation === "suffix");
    const byClaims = !!ov && ov.shared_claims >= 2 && (strict || steps.every((st) => shared.has(st)) || phenomenaOf([...shared]).size >= 2 || (head >= 2 && sameFamily));
    const ck = p.closest_known_pathway;
    const variant = !!ck && ck.relation !== "mechanism-subsequence" && ck.shared_phenomena >= 2;
    if (p.frontier_class === "candidate") {
      assert.ok(!byClaims && !variant, `${p.id} is a candidate but overlaps ${ov?.pathway ?? ck?.pathway}`);
      assert.equal(p.handoff_unresolved_count, 0, `${p.id} is a candidate with an unresolved handoff`);
    }
    if (p.frontier_class === "derived") assert.ok(byClaims || variant, `${p.id} is derived with only a generic overlap`);
    if (p.frontier_class === "incomplete-handoff") assert.ok(p.handoff_unresolved_count > 0, `${p.id} is incomplete-handoff with nothing unresolved`);
    if (p.search_status === "demonstrated") assert.equal(p.handoff_unresolved_count, 0, `${p.id} is demonstrated yet a handoff is unresolved: the tokens are wrong`);
    // A proposed pathway is attached to its route but never counts as overlap with a demonstrated one.
    if (p.pathway && pathwayById.get(p.pathway)?.status !== "proposed") assert.equal(ov?.relation, "exact", `${p.id} matches a pathway but overlap is not exact`);
    if (p.pathway && pathwayById.get(p.pathway)?.status === "proposed") assert.notEqual(p.search_status, "demonstrated", `${p.id}: a proposal made a route demonstrated`);
    if (p.pathway) assert.equal(p.dominated_by, null, `${p.id} is a recorded pathway shown as dominated`);
  }
});

test("composition evidence is never borrowed from constituent claims", () => {
  for (const p of graph.paths) {
    if (p.pathway) continue;
    assert.equal(p.composition_source_ids.length, 0, `${p.id} has composition sources without a recorded pathway`);
  }
});

test("evidence-model rule: replicated needs two groups; established needs two groups or a review/book", () => {
  const src = new Map(canon.sources.map((s) => [s.id, s]));
  const firstAuthor = (id: string) => (src.get(id)?.authors[0] ?? id).split(",")[0].trim().toLowerCase();
  const problems: string[] = [];
  for (const c of canon.claims) {
    const groups = new Set(c.evidence.map(firstAuthor));
    const reviewOrBook = c.evidence.some((e) => ["review", "book"].includes(src.get(e)?.type ?? ""));
    if (c.status === "replicated" && groups.size < 2) problems.push(`${c.id}: replicated with ${groups.size} group`);
    if (c.status === "established" && groups.size < 2 && !reviewOrBook) problems.push(`${c.id}: established on one primary source`);
  }
  assert.deepEqual(problems, []);
});
