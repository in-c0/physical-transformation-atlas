import { test } from "node:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { loadCanon, buildGraph, ValidationError } from "@pta/graph";
import { Claim, Measurement, SystemPathway, isDemonstratedPathway } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const canon = loadCanon(root);
const graph = buildGraph(canon, { builtAt: "2026-01-01T00:00:00.000Z" });

test("every named pathway compiles to a demonstrated path with the same claim sequence", () => {
  const bySeq = new Map(graph.paths.map((p) => [p.claims.join(">"), p]));
  for (const pw of canon.pathways) {
    const p = bySeq.get(pw.steps.join(">"));
    assert.ok(p, `${pw.id} has no compiled path`);
    assert.equal(p.pathway, pw.id);
    if (isDemonstratedPathway(pw)) assert.equal(p.search_status, "demonstrated", pw.id);
    else assert.notEqual(p.search_status, "demonstrated", `${pw.id} (${pw.status}) must not make its route demonstrated`);
    // loop-3 pass 24: an observed pathway names the last step it established, never the final one, and marks its route
    if (pw.status === "observed") {
      assert.ok(pw.observed_through && pw.steps.includes(pw.observed_through) && pw.observed_through !== pw.steps.at(-1), `${pw.id} observed_through`);
      assert.equal(p.composition_observation, "observed-not-converted", `${pw.id} route annotation`);
    } else assert.equal(p.composition_observation, null, `${pw.id} route carries no observation`);
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
    // A proposed or observed pathway is attached to its route but never counts as overlap with a demonstrated one.
    const own = p.pathway ? pathwayById.get(p.pathway) : undefined;
    if (own && isDemonstratedPathway(own)) assert.equal(ov?.relation, "exact", `${p.id} matches a pathway but overlap is not exact`);
    if (own && !isDemonstratedPathway(own)) {
      assert.notEqual(p.search_status, "demonstrated", `${p.id}: a ${own.status} pathway made a route demonstrated`);
      assert.ok(!ov || ov.pathway !== own.id, `${p.id}: its ${own.status} pathway counted as overlap`);
    }
    if (!p.pathway) assert.equal(p.composition_observation, null, `${p.id} carries an observation without a pathway`);
    // No route may be derived through a pathway that is not a demonstration.
    if (ov) assert.ok(isDemonstratedPathway(pathwayById.get(ov.pathway)!), `${p.id} overlaps the non-demonstrated pathway ${ov.pathway}`);
    if (ck) assert.ok(isDemonstratedPathway(pathwayById.get(ck.pathway)!), `${p.id} is closest to the non-demonstrated pathway ${ck.pathway}`);
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

test("measurement parameters come from the registry (loop-3 pass 31): a stray key is rejected, the registered ones parse", () => {
  const base = { quantity: "conversion efficiency", value: "0.3", value_numeric: 0.3, scope: "laboratory", conditions: "x", sources: ["source:swift-1988"] };
  assert.ok(Measurement.safeParse({ ...base, parameters: { T_h_K: 850, T_c_K: 300 } }).success);
  const bad = Measurement.safeParse({ ...base, parameters: { T_hot: 850 } });
  assert.equal(bad.success, false);
  assert.ok(JSON.stringify(bad.success ? {} : bad.error.issues).includes("unknown measurement parameter"));
});

test("a pathway's structured temperatures supply regimes to its exact route only (loop-3 pass 31)", () => {
  const teg = graph.paths.find((p) => p.pathway === "pathway:thermoelectric-generator")!;
  const regime = teg.checks.find((c) => c.id === "driver-regime-sufficiency")!;
  assert.equal(regime.result, "pass");
  // the TEG's 850/300 K fixture would supply the spatial gradient even without the source's own token; a sibling route through the same claim gets nothing from it
  assert.match(regime.detail, /thermal:spatial-temperature-gradient/);
  // the derivation reaches only the exact pathway: a synthetic pathway with T_h ≠ T_c supplies the gradient to a source that does not
  const canon2 = {
    ...canon,
    pathways: canon.pathways.map((pw) =>
      pw.id === "pathway:thermogalvanic-cell"
        ? {
            ...pw,
            performance: {
              measurements: [
                { quantity: "conversion efficiency", value: "0.01", value_numeric: 0.01, scope: "laboratory" as const, conditions: "x", sources: pw.evidence, parameters: { T_h_K: 320, T_c_K: 300 } },
              ],
            },
          }
        : pw,
    ),
  };
  const g2 = buildGraph(canon2, { builtAt: "2026-01-01T00:00:00.000Z" });
  const tgc = g2.paths.find((p) => p.pathway === "pathway:thermogalvanic-cell")!;
  assert.equal(tgc.checks.find((c) => c.id === "driver-regime-sufficiency")!.result, "pass");
});

test("the system layer (loop-3 pass 34): a system joins whole pathways by handoffs, its members carry their exact routes and check results, and its efficiency lives on no member", () => {
  assert.ok(graph.systems.length >= 1, "at least one system is recorded");
  assert.equal(graph.meta.counts.systems_named, graph.systems.length);
  const cc = graph.systems.find((s) => s.id === "system-pathway:natural-gas-combined-cycle");
  assert.ok(cc, "the natural-gas combined cycle is recorded");
  for (const m of cc.members) {
    assert.ok(m.route_id, `${m.id} has a compiled route`);
    const route = graph.paths.find((p) => p.id === m.route_id);
    assert.equal(route?.pathway, m.pathway);
    assert.equal(Object.keys(m.route_checks).length, route?.checks.length, "every route check is exposed");
  }
  assert.equal(cc.handoff_status, "demonstrated");
  // The combined cycle's 46.93 % appears on the system and on no pathway, route or claim.
  const on = (x: unknown) => JSON.stringify(x).includes("0.4693");
  assert.ok(on(cc), "the system carries the combined-cycle efficiency");
  assert.equal(graph.pathways.filter(on).length, 0, "no pathway carries it");
  assert.equal(graph.paths.filter(on).length, 0, "no route carries it");
  assert.equal(graph.pathways.find((p) => p.id === "pathway:combustion-gas-turbine")?.performance?.efficiency_record, undefined, "the gas-turbine pathway no longer carries a combined-cycle record");
  assert.deepEqual(graph.pathways.find((p) => p.id === "pathway:combustion-gas-turbine")?.demonstrated_with, ["transducer:gas-turbine-generator"]);
  // A system never enters route enumeration or the frontier: no route is enumerated from a handoff.
  assert.equal(graph.paths.filter((p) => p.frontier_class === "candidate" && p.claims.some((c) => c.includes("system"))).length, 0);
});

test("the legacy performance audit's regression controls (loop-3 pass 35)", () => {
  const pw = (id: string) => graph.pathways.find((p) => p.id === `pathway:${id}`)!;
  assert.equal(pw("combustion-gas-turbine").performance?.efficiency_record, undefined, "the gas turbine carries no combined-cycle record");
  assert.equal(pw("combustion-heater").performance?.theoretical_limit, undefined, "the combustion heater has no HHV 'limit'");
  assert.doesNotMatch(pw("otec-plant").performance?.theoretical_limit ?? "", /300 K|280 K|6\.7/, "OTEC has no hard-coded representative Carnot number");
  // The TEG record is discoverable from its structured datum after the legacy duplicate is gone.
  const teg = pw("thermoelectric-generator");
  assert.equal(teg.performance?.efficiency_record, undefined);
  const best = (teg.performance?.measurements ?? []).filter((m) => m.metric === "conversion-efficiency" && m.scope !== "model").sort((a, b) => b.value_numeric! - a.value_numeric!)[0];
  assert.equal(best?.value_numeric, 0.12);
  // Every surviving legacy field has a disposition, and no disposition contradicts the data: the audit gate.
  const gate = spawnSync(process.execPath, [join(root, "tools", "audit-performance.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(gate.status, 0, gate.stderr || gate.stdout);
  // The combined cycle's efficiency exists only as a structured system measurement.
  assert.equal(graph.pathways.filter((p) => JSON.stringify(p).includes("0.4693")).length, 0);
  assert.ok(graph.systems.some((s) => (s.performance?.measurements ?? []).some((m) => m.value_numeric === 0.4693)));
});

test("the system layer's loader gate (loop-3 pass 34): a handoff must name the disequilibrium its receiving member's route starts from; the schema refuses unknown members", () => {
  assert.throws(() => SystemPathway.parse({ ...canon.systems[0], handoffs: [{ ...canon.systems[0].handoffs[0], to_member: "nowhere" }] }), /unknown member nowhere/);
  // Measurements only: a legacy summary field on a system is refused (pass 34, the reviewer's invariant).
  for (const key of ["efficiency_record", "efficiency_typical", "theoretical_limit", "power_density"])
    assert.throws(
      () => SystemPathway.parse({ ...canon.systems[0], performance: { ...canon.systems[0].performance, [key]: key === "theoretical_limit" || key === "power_density" ? "x" : 0.5 } }),
      new RegExp(key),
      `${key} must be refused`,
    );
  // The Rankine member reads regime pass since its drives claim records the requirement its source provides; the gas-turbine member stays unknown on purpose.
  const cc = graph.systems.find((s) => s.id === "system-pathway:natural-gas-combined-cycle")!;
  assert.equal(cc.members.find((m) => m.id === "bottoming")!.route_checks["driver-regime-sufficiency"], "pass");
  assert.equal(cc.members.find((m) => m.id === "topping")!.route_checks["driver-regime-sufficiency"], "unknown");
  // The loader gate: a copy of the canonical data with the handoff pointed at the wrong disequilibrium fails to load.
  const tmp = mkdtempSync(join(tmpdir(), "pta-systems-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  const file = join(tmp, "data", "canonical", "systems", "systems.yaml");
  writeFileSync(file, readFileSync(file, "utf8").replace("to_source: disequilibrium:temperature-gradient", "to_source: disequilibrium:chemical-potential-difference"));
  assert.throws(() => loadCanon(tmp), /names to_source disequilibrium:chemical-potential-difference but that member's route starts from disequilibrium:temperature-gradient/);
  rmSync(tmp, { recursive: true, force: true });
});
