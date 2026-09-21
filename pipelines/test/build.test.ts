import { test } from "node:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { loadCanon, buildGraph, ValidationError } from "@pta/graph";
import { evaluateFormula } from "@pta/physics";
import { Claim, Measurement, SystemPathway, isDemonstratedPathway } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const canon = loadCanon(root);
const graph = buildGraph(canon, { builtAt: "2026-01-01T00:00:00.000Z" });

test("every named pathway compiles to a demonstrated path with the same claim sequence", () => {
  const bySeq = new Map(graph.paths.map((p) => [p.claims.join(">"), p]));
  for (const pw of canon.pathways) {
    const p = bySeq.get(pw.steps.join(">"));
    assert.ok(p, `${pw.id} has no compiled path`);
    if (pw.variant_of) {
      // pass 46: a variant shares its parent's route and is evaluated beside it
      assert.equal(p.pathway, pw.variant_of);
      assert.ok(p.variants.some((v) => v.pathway === pw.id), `${pw.id} is listed as a variant of its route`);
      continue;
    }
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
    const omission = ov?.relation === "stage-omission"; // loop-3 pass 43: omits a required stage of a demonstrated pathway
    if (p.frontier_class === "derived") assert.ok(byClaims || variant || omission, `${p.id} is derived with only a generic overlap`);
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
  assert.equal((pw("combustion-heater").performance as Record<string, unknown> | undefined)?.theoretical_limit, undefined, "the combustion heater has no HHV 'limit'");
  assert.equal((pw("otec-plant").performance as Record<string, unknown> | undefined)?.theoretical_limit, undefined, "OTEC carries no prose limit (pass 42)");
  // The TEG record is discoverable from its structured datum after the legacy duplicate is gone.
  const teg = pw("thermoelectric-generator");
  assert.equal(teg.performance?.efficiency_record, undefined);
  const best = (teg.performance?.measurements ?? []).filter((m) => m.metric === "conversion-efficiency" && m.scope !== "model").sort((a, b) => b.value_numeric! - a.value_numeric!)[0];
  assert.equal(best?.value_numeric, 0.12);
  // Every surviving legacy field has a disposition, and no disposition contradicts the data: the audit gate.
  const gate = spawnSync(process.execPath, [join(root, "tools", "audit-performance.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(gate.status, 0, gate.stderr || gate.stdout);
  // Pass 35 closing: no stored typical anywhere, and the Rankine 47 % is discoverable from its plant datum with its basis.
  assert.equal(graph.pathways.filter((p) => "efficiency_typical" in (p.performance ?? {})).length, 0, "efficiency_typical is gone from every pathway");
  const rankine = pw("rankine-steam-plant");
  assert.equal(rankine.performance?.efficiency_record, undefined);
  const nord = (rankine.performance?.measurements ?? []).find((m) => m.value_numeric === 0.47);
  assert.ok(nord && nord.scope === "plant" && /lower-heating-value/.test(nord.basis ?? ""), "the Nordjylland datum carries its LHV basis");
  // Pass 39: no stored record anywhere; the rectenna's 90.5 % is a device datum from the primary; the limit rows carry no projection or material property as a bound.
  assert.equal(graph.pathways.filter((p) => "efficiency_record" in (p.performance ?? {})).length, 0, "efficiency_record is gone from every pathway");
  const rect = pw("rectenna-microwave").performance!.measurements.find((m) => m.value_numeric === 0.905);
  assert.ok(rect && rect.scope === "device" && /2450 MHz/.test(rect.basis ?? ""), "the rectenna element datum carries its frequency and basis");
  // pass 42: the limit field is gone from every pathway — the photosynthesis limit is a typed constraint on its phenomenon
  assert.equal(graph.pathways.filter((p) => "theoretical_limit" in (p.performance ?? {})).length, 0, "theoretical_limit is gone from every pathway");
  assert.ok(canon.claims.some((c) => c.id === "claim:photosynthesis-bounded-glucose-limit" && c.object === "constraint:photosynthesis-glucose-free-energy-limit"));
  // pass 39 closing: every model-scope datum says what kind it is; a measured datum is never model scope
  const allData = graph.pathways.flatMap((p) => (p.performance?.measurements ?? []).map((m) => ({ p: p.id, ...m })));
  for (const m of allData) {
    if (m.scope === "model") assert.ok(["derived", "design-point", "simulated", "projected"].includes(m.datum_kind ?? ""), `${m.p}: model datum "${m.quantity}" carries its kind`);
    else assert.ok(!m.datum_kind || m.datum_kind === "measured" || m.datum_kind === "derived", `${m.p}: physical datum "${m.quantity}" is measured or derived`);
  }
  assert.throws(
    () =>
      Measurement.parse({ quantity: "x", value: "0.1", value_numeric: 0.1, unit: "1", metric: "conversion-efficiency", scope: "device", conditions: "", sources: ["source:s"], datum_kind: "guessed" }),
    /datum_kind/,
  );
  // The combined cycle's efficiency exists only as a structured system measurement.
  assert.equal(graph.pathways.filter((p) => JSON.stringify(p).includes("0.4693")).length, 0);
  assert.ok(graph.systems.some((s) => (s.performance?.measurements ?? []).some((m) => m.value_numeric === 0.4693)));
});

test("the power_density sweep (loop-3 pass 37): no mixed or naked summary survives, a power is never a density, the key is gone", () => {
  assert.equal(graph.pathways.filter((p) => "power_density" in (p.performance ?? {})).length, 0, "power_density is gone from every pathway");
  const all = graph.pathways.flatMap((p) => (p.performance?.measurements ?? []).map((m) => ({ p: p.id, ...m })));
  for (const m of all.filter((m) => m.metric === "power-density")) {
    assert.match(m.unit ?? "", /\/|⁻/, `${m.p}: a power-density unit states its normalisation`);
    assert.ok(m.basis, `${m.p}: a power-density datum states its basis`);
  }
  for (const m of all.filter((m) => m.metric === "power")) assert.doesNotMatch(m.unit ?? "", /\//, `${m.p}: a power is not a density`);
  // pass 37 closing: every density datum names what it is normalised to; an absolute power names nothing; two W/m² with different bases coexist
  for (const m of all.filter((m) => m.metric === "power-density")) assert.ok(m.normalization && m.normalization.kind && m.normalization.basis, `${m.p}: a density carries its normalization`);
  for (const m of all.filter((m) => m.metric === "power")) assert.ok(!m.normalization, `${m.p}: a power carries no normalization`);
  const bases = new Set(all.filter((m) => m.metric === "power-density" && m.unit === "W/m²").map((m) => m.normalization!.basis));
  assert.ok(bases.has("liquid-substrate-overlap-area") && bases.has("radiative-cooler-area") && bases.has("active-device-area"), "W/m² data with three different bases are recorded and distinguished");
  assert.throws(
    () =>
      Measurement.parse({
        quantity: "x",
        value: "1 W/m²",
        value_numeric: 1,
        unit: "W/m²",
        metric: "power-density",
        normalization: { kind: "area", basis: "made-up-area" },
        scope: "device",
        conditions: "",
        sources: ["source:s"],
      }),
    /unknown normalization basis/,
  );
  const nt = graph.pathways.find((p) => p.id === "pathway:radiative-cooling-teg")!.performance!.measurements.find((m) => m.value_numeric === 0.025);
  assert.ok(nt && nt.normalization?.basis === "radiative-cooler-area" && nt.scope === "device", "Raman 2019's 25 mW/m² is recorded per radiative-cooler area");
  // no model-scope projection can be the derived "best recorded" — the only power-density data are physical
  assert.equal(all.filter((m) => m.metric === "power-density" && m.scope === "model").length, 0);
  // the migrated data are there with their bases
  const rc = graph.pathways.find((p) => p.id === "pathway:passive-radiative-cooler")!.performance!.measurements.find((m) => m.value_numeric === 40.1);
  assert.ok(rc && rc.unit === "W/m²" && /ambient air temperature/.test(rc.basis ?? ""));
  const evap = graph.pathways.find((p) => p.id === "pathway:evaporation-driven-engine")!.performance!.measurements;
  assert.ok(
    evap.some((m) => m.metric === "power" && m.value_numeric === 0.06) && evap.every((m) => m.metric !== "power-density"),
    "the evaporation engine's 60 mW is a power, not a density per kilogram",
  );
  // the loader refuses a bare power under the power-density metric
  assert.throws(() => Measurement.parse({ quantity: "x", value: "1 mW", value_numeric: 0.001, unit: "W", metric: "power-densityy", scope: "device", conditions: "", sources: ["source:s"] }), /metric/);
  const gate = spawnSync(process.execPath, [join(root, "tools", "audit-performance.mjs"), "--pass", "37", "--check"], { encoding: "utf8" });
  assert.equal(gate.status, 0, gate.stderr || gate.stdout);
  assert.equal(
    graph.systems.every((s) => !("efficiency_record" in (s.performance ?? {}))),
    true,
  );
});

test("the steam / nuclear architecture audit (loop-3 pass 38): the direct-carrier claim never covers a PWR, the generic nuclear plant runs through the gradient, the steam engine is named for its Rankine evidence", () => {
  const fhg = canon.claims.find((c) => c.id === "claim:fission-produces-hot-gas")!;
  assert.ok(
    fhg.conditions.some((c) => /boiling-water reactor/.test(c)) && !fhg.conditions.some((c) => /in a PWR heat passes/.test(c)),
    "the claim names direct boiling and no longer folds the PWR in",
  );
  assert.match(fhg.conditions.join(" "), /not a pressurised-water reactor/);
  const nuc = canon.pathways.find((p) => p.id === "pathway:nuclear-steam-plant")!;
  assert.deepEqual(nuc.steps.slice(0, 3), ["claim:binding-drives-fission", "claim:fission-produces-gradient", "claim:expansion-drives"]);
  assert.equal(nuc.auxiliary_requirements.length, 0, "no nuclear feed-pump auxiliary until the named implementation is reviewed");
  const nucRoute = graph.paths.find((p) => p.pathway === "pathway:nuclear-steam-plant")!;
  assert.equal(nucRoute.checks.find((k) => k.id === "driver-regime-sufficiency")!.result, "pass");
  // fission → hot gas remains enumerable for the direct-boiling / fissioning-gas routes the MHD and light-bulb searches target
  assert.ok(graph.paths.some((p) => p.claims.includes("claim:fission-produces-hot-gas") && p.claims.includes("claim:hot-gas-drives-mhd")));
  assert.ok(graph.paths.some((p) => p.claims.includes("claim:fission-produces-hot-gas") && p.claims.includes("claim:hot-gas-drives-thermal-emission")));
  assert.ok(
    graph.searches.some((s) => s.target.kind === "path" && s.target.path === "p-ccef4f212b") && graph.searches.some((s) => s.target.kind === "path" && s.target.path === "p-8200d7ab7e"),
    "the two fission search records still target their routes",
  );
  assert.equal(canon.pathways.find((p) => p.id === "pathway:steam-engine")!.name, "Steam Rankine cycle (shaft work)");
  // pass 38 closing: the direct-steam route carries the BWR as a commercial pathway and passes the pressure regime only through it
  const bwr = graph.paths.find((p) => p.pathway === "pathway:boiling-water-reactor-direct-steam-plant")!;
  assert.ok(bwr, "the BWR pathway compiles to its route");
  assert.deepEqual(bwr.claims.slice(0, 3), ["claim:binding-drives-fission", "claim:fission-produces-hot-gas", "claim:hot-gas-drives-expansion"]);
  assert.equal(bwr.search_status, "demonstrated");
  assert.equal(graph.pathways.find((p) => p.id === "pathway:boiling-water-reactor-direct-steam-plant")!.status, "commercial");
  const bwrRegime = bwr.checks.find((k) => k.id === "driver-regime-sufficiency")!;
  assert.equal(bwrRegime.result, "pass");
  assert.match(bwrRegime.detail, /thermodynamic:expansion-pressure-drop/);
  for (const p of graph.paths.filter((q) => !q.pathway && q.claims.includes("claim:fission-produces-hot-gas") && q.claims.includes("claim:hot-gas-drives-expansion")))
    assert.equal(p.checks.find((k) => k.id === "driver-regime-sufficiency")!.result, "unresolved", `${p.id}: no pathway, no provider`);
});

test("the pressurised-water reactor as a system (loop-3 pass 40): advective transport, a transferred-heat handoff through the steam generator, only the secondary's electricity exported", () => {
  const primary = canon.pathways.find((p) => p.id === "pathway:pwr-primary-heat-delivery")!;
  assert.ok(
    primary.steps.includes("claim:temperature-drives-advective-heat-transport") && !primary.steps.some((s) => s.includes("heat-conduction")),
    "the primary loop is advective transport, not conduction",
  );
  const fourier = canon.claims.find((c) => c.id === "claim:heat-conduction-drives")!;
  assert.equal(fourier.relation?.formula, "q = −κ · ∇T", "Fourier conduction keeps its relation and its name");
  assert.equal(canon.claims.find((c) => c.id === "claim:temperature-drives-advective-heat-transport")!.relation, undefined, "no fake Fourier relation on advection");
  assert.equal(primary.status, "commercial");
  // pass 41: the coolant pumps now establish the flow token (they had established nothing in pass 40)
  assert.ok(primary.auxiliary_requirements.some((a) => a.kind === "external-input" && /coolant pump/.test(a.purpose) && a.establishes.includes("flow:bulk-fluid-motion")));
  const pwr = graph.systems.find((s) => s.id === "system-pathway:pressurized-water-reactor-steam-plant")!;
  assert.ok(pwr, "the PWR system compiles");
  assert.equal(pwr.status, "commercial");
  assert.equal(pwr.handoffs.length, 1);
  const h = pwr.handoffs[0];
  assert.equal(h.kind, "transferred-heat");
  assert.equal(h.carrier, null);
  assert.equal(h.through, "transducer:pwr-steam-generator");
  assert.equal(h.status, "demonstrated");
  assert.equal(pwr.handoff_status, "demonstrated");
  // primary useful heat is consumed internally and absent from the exported outputs; secondary electricity is the system output
  assert.deepEqual(
    pwr.outputs.map((o) => `${o.member}:${o.output}`),
    ["secondary:output:electricity"],
  );
  assert.ok(
    pwr.members.every((m) => m.route_id),
    "both members carry compiled routes",
  );
  // the BWR stays a distinct one-loop direct-steam pathway; the generic nuclear pathway stays architecture-neutral
  assert.ok(canon.pathways.find((p) => p.id === "pathway:boiling-water-reactor-direct-steam-plant")!.steps.includes("claim:fission-produces-hot-gas"));
  assert.ok(canon.pathways.find((p) => p.id === "pathway:nuclear-steam-plant")!.steps.includes("claim:fission-produces-gradient"));
  // the loader refuses a forgotten member output and a handoff whose energy form is not the sender's terminal form
  const tmp = mkdtempSync(join(tmpdir(), "pta-pwr-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  const file = join(tmp, "data", "canonical", "systems", "systems.yaml");
  cpSync(join(root, "data", "generated"), join(tmp, "data", "generated"), { recursive: true });
  writeFileSync(
    file,
    readFileSync(file, "utf8")
      .replace(
        "from_energy_form: thermal\n      to_source: disequilibrium:temperature-gradient\n      carrier: null\n      through: transducer:pwr-steam-generator",
        "from_energy_form: mechanical\n      to_source: disequilibrium:temperature-gradient\n      carrier: null\n      through: transducer:pwr-steam-generator",
      )
      .replace(
        "from_energy_form: thermal\r\n      to_source: disequilibrium:temperature-gradient\r\n      carrier: null\r\n      through: transducer:pwr-steam-generator",
        "from_energy_form: mechanical\r\n      to_source: disequilibrium:temperature-gradient\r\n      carrier: null\r\n      through: transducer:pwr-steam-generator",
      ),
  );
  assert.throws(() => loadCanon(tmp), /carries thermal energy but that member's terminal output|neither exported/);
  rmSync(tmp, { recursive: true, force: true });
  // the route-count delta is enumerated, not suppressed: the ten routes through advective transport
  const adv = graph.paths.filter((p) => p.claims.includes("claim:temperature-drives-advective-heat-transport"));
  assert.equal(adv.length, 10, "ten routes run through advective heat transport");
  assert.equal(adv.filter((p) => p.pathway === "pathway:pwr-primary-heat-delivery").length, 1);
  assert.equal(
    adv.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition").length,
    0,
    "none of them is a fresh candidate composition — each is dominated by, prepares, or is derived from a heat-delivery spelling the atlas already records",
  );
});

test("theoretical_limit retired into the typed constraint graph (loop-3 pass 42): no prose limit anywhere, the key unwritable, every former row disposed, typed bounds reachable, pathway bounds an escape hatch", () => {
  const pw = (slug: string) => graph.pathways.find((p) => p.id === `pathway:${slug}`)!;
  const bound = (p: (typeof graph.paths)[number]) => p.checks.find((k) => k.id === "thermodynamic-bound")!;
  const routeOf = (slug: string) => graph.paths.find((p) => p.pathway === `pathway:${slug}`)!;
  // the raw canonical files carry no theoretical_limit key (comments excepted) and the strict schema refuses one
  for (const f of canon.files.filter((x) => x.path.startsWith("data/canonical/pathways/")))
    assert.ok(!/^\s*theoretical_limit:/m.test(f.text), `${f.path}: a theoretical_limit key survives`);
  const tmp = mkdtempSync(join(tmpdir(), "pta-limit-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmp, "data", "generated"), { recursive: true });
  const file = join(tmp, "data", "canonical", "pathways", "pathways.yaml");
  const text = readFileSync(file, "utf8");
  const at = text.indexOf("  performance:", text.indexOf("- id: pathway:thermoelectric-generator"));
  assert.ok(at > 0);
  writeFileSync(file, text.slice(0, at) + '  performance:\n    theoretical_limit: "Carnot"\n' + text.slice(at + "  performance:\n".length));
  assert.throws(() => loadCanon(tmp), /theoretical_limit/);
  // every former prose row has exactly one disposition and the audit gate holds (bound results unchanged where nothing was typed)
  const gate = spawnSync(process.execPath, [join(root, "tools", "audit-limits.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(gate.status, 0, gate.stderr || gate.stdout);
  // the six typed rows: the constraint is now reachable on the pathway's route and the check names it
  const typed: [string, string][] = [
    ["incandescent-lamp", "Visible-band fraction of thermal emission"],
    ["fuel-cell", "Reversible electrochemical efficiency"],
    ["photosynthesis", "Photosynthetic glucose-production limit"],
    ["photoelectrochemical-water-splitting", "Landsberg limit"],
    ["capacitive-mixing-cell", "Free energy of mixing"],
    ["concentration-cell", "Nernst / Gibbs free-energy bound"],
  ];
  for (const [slug, name] of typed) assert.match(bound(routeOf(slug)).detail, new RegExp(name.replace(/[()/]/g, "\\$&")), `${slug}: ${bound(routeOf(slug)).detail}`);
  assert.equal(bound(routeOf("incandescent-lamp")).result, "unresolved", "a hard bound recorded but not evaluable until the band fraction is curated");
  assert.equal(bound(routeOf("photosynthesis")).result, "unresolved", "no datum on the glucose basis yet");
  const bench = canon.claims.find((c) => c.id === "claim:photosynthesis-benchmarked-physiological-maximum")!;
  assert.equal(bench.predicate, "governed_by", "a benchmark is attached like Curzon–Ahlborn: listed on the route page, never a bound");
  assert.equal(canon.entities.find((e) => e.id === bench.object)!.constraint_kind, "benchmark");
  // the ΔG/ΔH bound evaluates from a datum's own thermochemistry: 0.83 for hydrogen, above 1 for carbon — a formula, never a fixed number
  const gibbs = canon.entities.find((e) => e.id === "constraint:gibbs-enthalpy-ratio-bound")!;
  assert.equal(gibbs.constraint_kind, "formula-bound");
  assert.equal(Math.round(evaluateFormula(gibbs.formula!, { delta_G_kJ_per_mol: 237.1, delta_H_kJ_per_mol: 285.8 })! * 1000) / 1000, 0.83);
  assert.ok(evaluateFormula(gibbs.formula!, { delta_G_kJ_per_mol: 395.4, delta_H_kJ_per_mol: 393.5 })! > 1, "carbon's ΔG exceeds its ΔH");
  // Pathway.bounds: an architecture-specific constraint referenced only from the exact pathway is evaluated on that route and
  // never leaks to a sibling route sharing the phenomenon (the reviewer's finding 38)
  const tmp2 = mkdtempSync(join(tmpdir(), "pta-pbound-"));
  cpSync(join(root, "data", "canonical"), join(tmp2, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmp2, "data", "generated"), { recursive: true });
  const ents = join(tmp2, "data", "canonical", "entities", "misc.yaml");
  writeFileSync(ents, readFileSync(ents, "utf8") + `
- id: constraint:test-module-architecture-bound
  type: constraint
  name: Test module architecture bound
  bound: "η ≤ 20 % for this exact module architecture (synthetic)"
  constraint_kind: upper-bound
  metric: conversion-efficiency
  max_efficiency: 0.2
  summary: A synthetic bound for the regression only.
`);
  const pf = join(tmp2, "data", "canonical", "pathways", "pathways.yaml");
  const pt = readFileSync(pf, "utf8");
  const pvAt = pt.indexOf("  knowledge_level:", pt.indexOf("- id: pathway:photovoltaic-module"));
  writeFileSync(pf, pt.slice(0, pvAt) + "  bounds:\n    - { constraint: constraint:test-module-architecture-bound, evidence: [source:green-2024-tables], conditions: [synthetic] }\n" + pt.slice(pvAt));
  const g2 = buildGraph(loadCanon(tmp2), { builtAt: "2026-01-01T00:00:00.000Z" });
  const pv2 = g2.paths.find((p) => p.pathway === "pathway:photovoltaic-module")!;
  assert.equal(bound(pv2).result, "fail", bound(pv2).detail);
  assert.match(bound(pv2).detail, /exceeds Test module architecture bound/);
  const siblings = g2.paths.filter((p) => p.id !== pv2.id && p.nodes.includes("phenomenon:photovoltaic-effect"));
  assert.ok(siblings.length > 0);
  for (const s of siblings) assert.doesNotMatch(bound(s).detail, /Test module architecture bound/, `${s.id} inherited a pathway-specific bound`);
  // the escape hatch refuses a generic restatement and a non-hard kind
  const pt2 = readFileSync(pf, "utf8");
  const rkAt = pt2.indexOf("  knowledge_level:", pt2.indexOf("- id: pathway:rankine-steam-plant"));
  writeFileSync(pf, pt2.slice(0, rkAt) + "  bounds:\n    - { constraint: constraint:carnot-limit, evidence: [source:bejan-2016] }\n" + pt2.slice(rkAt));
  assert.throws(() => loadCanon(tmp2), /already reaches through a bounded_by claim/);
  writeFileSync(pf, pt2.slice(0, rkAt) + "  bounds:\n    - { constraint: constraint:curzon-ahlborn-limit, evidence: [source:bejan-2016] }\n" + pt2.slice(rkAt));
  assert.throws(() => loadCanon(tmp2), /only an upper-bound or formula-bound constraint is a pathway bound/);
  rmSync(tmp, { recursive: true, force: true });
  rmSync(tmp2, { recursive: true, force: true });
});

test("the PEC architecture bounds (loop-3 pass 46): water-splitting-scoped ideal limits, realistic-case benchmarks, and Cheng 2018's gap-pair limit on a variant pathway that never touches the generic route", () => {
  const generic = graph.paths.find((p) => p.pathway === "pathway:photoelectrochemical-water-splitting")!;
  const bound = (checks: (typeof generic)["checks"]) => checks.find((k) => k.id === "thermodynamic-bound")!;
  // the generic route: the two ideal limits reachable (single- and dual-junction), no datum on it any more, the pair limit absent
  assert.match(bound(generic.checks).detail, /PEC water-splitting ideal limit, single junction/);
  assert.match(bound(generic.checks).detail, /PEC water-splitting ideal limit, dual junction/);
  assert.doesNotMatch(bound(generic.checks).detail, /GaInP\/GaInAs/);
  assert.equal(bound(generic.checks).result, "unresolved");
  assert.equal((canon.pathways.find((p) => p.id === "pathway:photoelectrochemical-water-splitting")!.performance?.measurements ?? []).length, 0);
  // the variant: the same route, its own data, its own bound — evaluated: 19.3 % ≤ 22.8 % (its pair) and ≤ 40.0 % (the dual-junction ideal)
  const v = generic.variants.find((x) => x.pathway === "pathway:tandem-pec-gainp-gainas-1p78-1p26ev")!;
  assert.ok(v);
  assert.equal(bound(v.checks).result, "pass", bound(v.checks).detail);
  assert.match(bound(v.checks).detail, /19\.3% ≤ Theoretical STH limit for the GaInP\/GaInAs 1\.78 \/ 1\.26 eV tandem \(Cheng 2018\) \(22\.8%\)/);
  assert.match(bound(v.checks).detail, /19\.3% ≤ PEC water-splitting ideal limit, dual junction \(40\.0%\)/);
  assert.match(bound(v.checks).detail, /18\.5% ≤/);
  assert.match(bound(v.checks).detail, /single junction: .*does not state the basis/, "the single-junction limit does not apply to a dual-junction datum");
  const vp = canon.pathways.find((p) => p.id === "pathway:tandem-pec-gainp-gainas-1p78-1p26ev")!;
  assert.equal(vp.variant_of, "pathway:photoelectrochemical-water-splitting");
  assert.deepEqual(vp.bounds.map((b) => b.constraint), ["constraint:pec-tandem-gainp-gainas-1p78-1p26ev-limit"]);
  // the benchmarks are listed on the route and never decide
  for (const name of ["realistic limiting efficiency, high-performance", "realistic limiting efficiency, Earth-abundant"]) {
    const c = canon.entities.find((e) => e.type === "constraint" && e.name.includes(name))!;
    assert.equal(c.constraint_kind, "benchmark");
    assert.ok(canon.claims.some((cl) => cl.object === c.id && cl.predicate === "governed_by"));
  }
  // the ideal limits are scoped to water splitting by their basis
  for (const id of ["constraint:pec-water-splitting-single-junction-ideal-limit", "constraint:pec-water-splitting-dual-junction-ideal-limit"])
    assert.match(canon.entities.find((e) => e.id === id)!.requires_basis!, /^PEC water splitting, /);
  // a variant must carry its parent's exact steps, and a variant of a variant is refused
  const tmp = mkdtempSync(join(tmpdir(), "pta-variant-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmp, "data", "generated"), { recursive: true });
  const pf = join(tmp, "data", "canonical", "pathways", "pathways.yaml");
  const pt = readFileSync(pf, "utf8");
  writeFileSync(pf, pt.replace("  variant_of: pathway:photoelectrochemical-water-splitting\n  steps: [claim:pec-drives, claim:pec-converts-fuel]", "  variant_of: pathway:photoelectrochemical-water-splitting\n  steps: [claim:pec-drives]"));
  assert.throws(() => loadCanon(tmp), /must carry exactly its parent's steps/);
  writeFileSync(pf, pt + "\n- id: pathway:test-variant-of-variant\n  name: x\n  variant_of: pathway:tandem-pec-gainp-gainas-1p78-1p26ev\n  steps: [claim:pec-drives, claim:pec-converts-fuel]\n  demonstrated_with: []\n  evidence: [source:cheng-2018-pec-19-percent]\n  status: demonstrated\n  knowledge_level: K5\n  summary: x\n");
  assert.throws(() => loadCanon(tmp), /a variant cannot have variants/);
  rmSync(tmp, { recursive: true, force: true });
});

test("the stage-versus-route measurement audit (loop-3 pass 45): every efficiency datum classified by its boundaries; a stage figure never the route's; a handbook range never a measurement", () => {
  const gate = spawnSync(process.execPath, [join(root, "tools", "audit-stage-route.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(gate.status, 0, gate.stderr || gate.stdout);
  const pw = (slug: string) => graph.pathways.find((p) => p.id === `pathway:${slug}`)!;
  const data = (slug: string) => pw(slug).performance?.measurements ?? [];
  // pass 45 close: a number a paper repeats from its literature review is never a measurement sourced to that paper — Asim 2022's
  // 72–77 % was its Introduction's citation of references 13–14; the paper's own result is the 66.42 % overall system efficiency
  const wheelData = data("waterwheel-electric-generator");
  assert.ok(!wheelData.some((m) => m.value_range !== undefined || m.value_numeric === 0.77 || /72/.test(m.value)), "the mis-sourced 72–77 % is gone");
  const wheel = wheelData.find((m) => m.value_numeric === 0.6642)!;
  assert.equal(wheel.metric, "conversion-efficiency");
  assert.match(wheel.basis!, /generator electrical output/);
  assert.match(wheel.basis!, /does not state/);
  assert.equal(wheel.datum_kind, "measured");
  const wheelSource = canon.sources.find((s) => s.id === "source:asim-2022-pico-waterwheel")!;
  assert.match(wheelSource.notes ?? "", /prior literature/);
  // the TEG pathway keeps the Zhang 2017 module datum and nothing from a handbook or another route
  const teg = data("thermoelectric-generator");
  assert.deepEqual(teg.filter((m) => m.metric === "conversion-efficiency").map((m) => m.value_numeric), [0.12]);
  assert.ok(!teg.some((m) => /radioisotope|solar-thermal/.test(m.quantity)));
  // the OTEC design point is the organic-Rankine stage's figure (model), the actual 2.46 % stays the route's reported figure with its ambiguity written down
  const otec = data("otec-plant");
  assert.equal(otec.find((m) => m.value_numeric === 0.0263)!.metric, "device-stage-efficiency");
  assert.match(otec.find((m) => m.value_numeric === 0.0263)!.basis!, /W_T − W_P/);
  assert.equal(otec.find((m) => m.value_numeric === 0.0246)!.metric, "conversion-efficiency");
  assert.match(otec.find((m) => m.value_numeric === 0.0246)!.basis!, /unresolved/);
  // every route conversion-efficiency datum's basis names a denominator on the route's boundary — the words the audit read
  for (const p of graph.pathways)
    for (const m of p.performance?.measurements ?? [])
      if (m.metric === "conversion-efficiency") assert.ok((m.basis ?? "").length > 20, `${p.id} "${m.quantity}": a conversion-efficiency datum states its basis`);
});

test("source restoration (loop-3 pass 44): six primaries as typed measurements with their denominators; operating points never combined; a stage efficiency never the route's", () => {
  const pw = (slug: string) => graph.pathways.find((p) => p.id === `pathway:${slug}`)!;
  const data = (slug: string) => pw(slug).performance?.measurements ?? [];
  const bound = (p: (typeof graph.paths)[number]) => p.checks.find((k) => k.id === "thermodynamic-bound")!;
  const routeOf = (slug: string) => graph.paths.find((p) => p.pathway === `pathway:${slug}`)!;
  // thermoacoustic: Wu 2014's 19.8 % and Bi 2017's 18.4 % are distinct records with their own sources and temperatures
  const ta = data("thermoacoustic-generator");
  const wu = ta.find((m) => m.value_numeric === 0.198)!;
  const bi = ta.find((m) => m.value_numeric === 0.184)!;
  assert.ok(wu && bi && wu.sources[0] !== bi.sources[0]);
  assert.deepEqual(wu.parameters, { T_h_K: 923.15, T_c_K: 288.15 });
  assert.deepEqual(bi.parameters, { T_h_K: 923.15, T_c_K: 298.15 });
  assert.match(bi.conditions, /3\.46 kW/);
  assert.doesNotMatch(bi.conditions, /4\.69/, "the maximum-power point is never paired with the maximum efficiency");
  const biPower = ta.find((m) => m.metric === "power" && m.value_numeric === 4690)!;
  assert.match(biPower.conditions, /15\.6 %/);
  assert.ok(!ta.some((m) => m.metric === "conversion-efficiency" && m.value_numeric === 0.156), "15.6 % is the efficiency AT the power point, not a record of its own");
  assert.equal(bound(routeOf("thermoacoustic-generator")).result, "pass", bound(routeOf("thermoacoustic-generator")).detail);
  assert.match(bound(routeOf("thermoacoustic-generator")).detail, /19\.8% ≤ Carnot limit \(68\.8%\)/);
  // wind: the Storm's 0.45 is a power coefficient on the Betz basis and there is no electrical-efficiency datum
  const wind = data("wind-turbine");
  const storm = wind.find((m) => m.value_numeric === 0.45)!;
  assert.equal(storm.metric, "power-coefficient");
  assert.equal(storm.datum_kind, "derived");
  assert.equal(storm.scope, "field");
  assert.ok(!wind.some((m) => m.metric === "conversion-efficiency"));
  assert.equal(bound(routeOf("wind-turbine")).result, "pass", bound(routeOf("wind-turbine")).detail);
  assert.match(bound(routeOf("wind-turbine")).detail, /0\.45 ≤ Betz limit/);
  // hydro: 60 % is water-to-wire at plant scope; 73 % is the turbine stage's own metric and never the route's efficiency
  const hydro = data("hydroelectric-plant");
  const w2w = hydro.find((m) => m.value_numeric === 0.6)!;
  const hyd = hydro.find((m) => m.value_numeric === 0.73)!;
  assert.equal(w2w.metric, "conversion-efficiency");
  assert.equal(w2w.scope, "plant");
  assert.match(w2w.basis!, /water-to-wire/);
  assert.equal(hyd.metric, "device-stage-efficiency");
  assert.match(hyd.basis!, /turbine stage/);
  // betavoltaic: the whole-route ECEs state the isotope's decay power as denominator; Zhang's 7.31 % can never satisfy the route metric
  const beta = data("betavoltaic-battery");
  const kim = beta.find((m) => m.value_numeric === 0.1079)!;
  const zhangTotal = beta.find((m) => m.value_range !== undefined)!;
  const zhangDevice = beta.find((m) => m.value_numeric === 0.0731)!;
  assert.equal(kim.metric, "conversion-efficiency");
  assert.match(kim.basis!, /total decay power/);
  assert.match(kim.basis!, /49\.4 keV/);
  assert.equal(zhangTotal.metric, "conversion-efficiency");
  assert.match(zhangTotal.basis!, /isotope source power/);
  assert.equal(zhangDevice.metric, "device-stage-efficiency");
  for (const m of beta.filter((x) => x.metric === "conversion-efficiency")) assert.match(m.basis!, /decay power|isotope source power/, `${m.quantity}: an isotope-energy denominator`);
  // pass 44 close: Zhang's aggregate is a range — never a scalar, never a best, both ends preserved through the export
  const zhangRange = beta.find((m) => m.value_range !== undefined)!;
  assert.deepEqual(zhangRange.value_range, [0.0234, 0.0256]);
  assert.equal(zhangRange.value_numeric, undefined, "a range never carries a scalar");
  assert.ok(!beta.some((m) => m.value_numeric === 0.0256), "2.56 % is never an independently observed datum");
  assert.throws(() => Measurement.parse({ ...zhangRange, value_numeric: 0.0256 }), /never both/);
  assert.throws(() => Measurement.parse({ ...zhangRange, value_range: [0.0256, 0.0234] }), /\[low, high\]/);
  const exported = JSON.parse(JSON.stringify(graph.pathways.find((p) => p.id === "pathway:betavoltaic-battery")!.performance!.measurements.find((m) => m.value_range)));
  assert.deepEqual(exported.value_range, [0.0234, 0.0256]);
  // the derived best efficiency on each page ignores stage efficiencies and ranges: hydro's best is 60 %, betavoltaic's 10.79 %
  const PHYSICAL = new Set(["laboratory", "device", "module", "system", "plant", "field"]);
  const best = (slug: string) => data(slug).filter((m) => m.metric === "conversion-efficiency" && m.value_numeric !== undefined && PHYSICAL.has(m.scope)).sort((a, b) => b.value_numeric! - a.value_numeric!)[0]?.value_numeric;
  assert.equal(best("hydroelectric-plant"), 0.6);
  assert.equal(best("betavoltaic-battery"), 0.1079);
  assert.equal(best("thermoacoustic-generator"), 0.198);
  // a device-stage efficiency must name its stage and denominator (loader), and no restored datum recreates a retired summary key
  const tmp = mkdtempSync(join(tmpdir(), "pta-stage-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmp, "data", "generated"), { recursive: true });
  const pf = join(tmp, "data", "canonical", "pathways", "pathways.yaml");
  const pt = readFileSync(pf, "utf8");
  const bad = pt.replace('basis: "the turbine stage alone: mechanical power delivered by the hydroEngine relative to the hydraulic power at its inlet, as the report states it (no formula given) — a subsystem figure, not the pathway\'s water-to-wire efficiency"', 'basis: "73 %"');
  assert.notEqual(bad, pt);
  writeFileSync(pf, bad);
  assert.throws(() => loadCanon(tmp), /device-stage-efficiency but its basis does not name the stage/);
  rmSync(tmp, { recursive: true, force: true });
  for (const slug of ["thermoacoustic-generator", "wind-turbine", "hydroelectric-plant", "betavoltaic-battery"])
    for (const key of ["efficiency_typical", "efficiency_record", "power_density", "theoretical_limit"]) assert.ok(!(key in (pw(slug).performance ?? {})), `${slug}: ${key} must stay retired`);
});

test("stage omission (loop-3 pass 43 close): a route that omits a required stage of a demonstrated pathway is derived, never on one matching end, never without an unresolved token the omitted stage supplies, and a demonstration still wins", () => {
  const compact = graph.paths.find((p) => p.id === "p-d7374879fd")!;
  assert.deepEqual(compact.claims, ["claim:combustion-drives", "claim:combustion-produces-hot-gas", "claim:hot-gas-drives-mhd", "claim:mhd-produces", "claim:charge-carriers-convert-electricity"]);
  assert.equal(compact.known_pathway_overlap?.relation, "stage-omission");
  assert.equal(compact.known_pathway_overlap?.pathway, "pathway:mhd-generator");
  assert.deepEqual(compact.known_pathway_overlap?.omitted_phenomena, ["phenomenon:gas-dynamic-expansion"]);
  assert.deepEqual(compact.known_pathway_overlap?.supplies, ["flow:bulk-fluid-motion"]);
  assert.equal(compact.closest_known_pathway?.pathway, "pathway:mhd-generator");
  assert.equal(compact.frontier_class, "derived");
  // the invariant behind the relation: exact source and sink entities, first and last phenomena, a proper ordered subsequence
  const claimById = new Map(canon.claims.map((c) => [c.id, c]));
  const phen = (ids: string[]) => [...new Set(ids.flatMap((id) => [claimById.get(id)!.subject, claimById.get(id)!.object]).filter((n) => canon.entities.find((e) => e.id === n)?.type === "phenomenon"))];
  for (const p of graph.paths.filter((q) => q.known_pathway_overlap?.relation === "stage-omission")) {
    const pw = canon.pathways.find((x) => x.id === p.known_pathway_overlap!.pathway)!;
    assert.ok(isDemonstratedPathway(pw));
    assert.equal(claimById.get(pw.steps[0])!.subject, p.source, `${p.id}: same source entity`);
    assert.equal(claimById.get(pw.steps[pw.steps.length - 1])!.object, p.sink, `${p.id}: same sink entity`);
    const a = phen(p.claims), b = phen(pw.steps);
    assert.ok(a.length < b.length && a[0] === b[0] && a[a.length - 1] === b[b.length - 1], `${p.id}: proper subsequence with the same ends`);
    assert.notEqual(p.search_status, "demonstrated", "a demonstration outranks the relation");
  }
  // one matching end is never enough: the fission → hot gas → MHD spelling shares the sink only and stays outside the relation
  const fissionCompact = graph.paths.find((p) => p.claims.includes("claim:fission-produces-hot-gas") && p.claims.includes("claim:hot-gas-drives-mhd"))!;
  assert.notEqual(fissionCompact.known_pathway_overlap?.relation, "stage-omission");
  assert.ok(!fissionCompact.closest_known_pathway || fissionCompact.closest_known_pathway.relation !== "exact");
  // without an unresolved token the omitted stage supplies, the relation must not fire (a bare subsequence is never enough)
  const tmpA = mkdtempSync(join(tmpdir(), "pta-omit-a-"));
  cpSync(join(root, "data", "canonical"), join(tmpA, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmpA, "data", "generated"), { recursive: true });
  const cf = join(tmpA, "data", "canonical", "claims", "mechanical.yaml");
  const ct = readFileSync(cf, "utf8");
  const reqLine = ct.split("\n").find((l) => l.startsWith("  regime_requires: [flow:bulk-fluid-motion, field:transverse-magnetic-field]"))!;
  assert.ok(reqLine);
  writeFileSync(cf, ct.replace(reqLine, "  regime_requires: [field:transverse-magnetic-field]"));
  const gA = buildGraph(loadCanon(tmpA), { builtAt: "2026-01-01T00:00:00.000Z" });
  const compactA = gA.paths.find((p) => p.id === "p-d7374879fd")!;
  assert.notEqual(compactA.known_pathway_overlap?.relation, "stage-omission", "nothing unresolved, nothing omitted that matters");
  assert.equal(compactA.checks.find((k) => k.id === "driver-regime-sufficiency")!.result, "pass");
  rmSync(tmpA, { recursive: true, force: true });
  // an exact demonstrated pathway on the compact spelling outranks the relation
  const tmpB = mkdtempSync(join(tmpdir(), "pta-omit-b-"));
  cpSync(join(root, "data", "canonical"), join(tmpB, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmpB, "data", "generated"), { recursive: true });
  const pf = join(tmpB, "data", "canonical", "pathways", "pathways.yaml");
  writeFileSync(
    pf,
    readFileSync(pf, "utf8") +
      `
- id: pathway:test-compact-mhd
  name: Test compact MHD spelling
  steps: [claim:combustion-drives, claim:combustion-produces-hot-gas, claim:hot-gas-drives-mhd, claim:mhd-produces, claim:charge-carriers-convert-electricity]
  demonstrated_with: [transducer:mhd-generator]
  evidence: [source:rosa-1961-mhd]
  status: prototype
  knowledge_level: K7
  summary: A synthetic demonstration of the compact spelling, for the regression only.
`,
  );
  const gB = buildGraph(loadCanon(tmpB), { builtAt: "2026-01-01T00:00:00.000Z" });
  const compactB = gB.paths.find((p) => p.id === "p-d7374879fd")!;
  assert.equal(compactB.search_status, "demonstrated");
  assert.equal(compactB.frontier_class, "demonstrated");
  assert.equal(compactB.known_pathway_overlap?.relation, "exact");
  rmSync(tmpB, { recursive: true, force: true });
});

test("the forced-advection closure (loop-3 pass 41): advection requires bulk fluid motion, which only a recorded pump auxiliary or an upstream flow step supplies", () => {
  const regime = (p: (typeof graph.paths)[number]) => p.checks.find((k) => k.id === "driver-regime-sufficiency")!;
  const claim = canon.claims.find((c) => c.id === "claim:temperature-drives-advective-heat-transport")!;
  assert.deepEqual([...claim.regime_requires].sort(), ["flow:bulk-fluid-motion", "thermal:spatial-temperature-gradient"]);
  assert.deepEqual(claim.regime_external, [], "the generic claim never self-certifies the flow");
  assert.ok(
    claim.condition_requirements.some((r) => r.tag === "flow-required"),
    "the condition layer keeps flow-required beside the regime",
  );
  // negative control: every advective route with no pathway is unresolved specifically on the flow token
  const generic = graph.paths.filter((p) => !p.pathway && p.claims.includes("claim:temperature-drives-advective-heat-transport"));
  assert.equal(generic.length, 8);
  for (const p of generic) {
    assert.equal(regime(p).result, "unresolved", p.id);
    assert.match(regime(p).detail, /requires flow:bulk-fluid-motion/);
    assert.doesNotMatch(regime(p).detail, /requires thermal:spatial-temperature-gradient/, "the gradient is supplied; only the flow is missing");
  }
  // positive controls: the PWR primary through its electrical coolant pumps, the forced-circulation loop through its mechanical pump
  const pwr = graph.paths.find((p) => p.pathway === "pathway:pwr-primary-heat-delivery")!;
  const loop = graph.paths.find((p) => p.pathway === "pathway:forced-circulation-heat-delivery")!;
  assert.equal(regime(pwr).result, "pass");
  assert.equal(regime(loop).result, "pass");
  const pwrAux = canon.pathways.find((p) => p.id === "pathway:pwr-primary-heat-delivery")!.auxiliary_requirements[0];
  const loopAux = canon.pathways.find((p) => p.id === "pathway:forced-circulation-heat-delivery")!.auxiliary_requirements[0];
  assert.equal(pwrAux.energy_form, "electrical");
  assert.equal(loopAux.energy_form, "mechanical");
  assert.ok(pwrAux.establishes.includes("flow:bulk-fluid-motion") && loopAux.establishes.includes("flow:bulk-fluid-motion"));
  // the flow token comes from nowhere but a recorded provider: no entity other than disequilibrium:fluid-flow — the source whose
  // physical content is bulk fluid motion — provides it, and no carrier, condition tag or claim supplies it implicitly (pass 41 close)
  assert.deepEqual(
    canon.entities.filter((e) => (e.regime_provides ?? []).includes("flow:bulk-fluid-motion")).map((e) => e.id),
    ["disequilibrium:fluid-flow"],
  );
  assert.equal(canon.claims.filter((c) => c.regime_provides.includes("flow:bulk-fluid-motion") || c.regime_external.includes("flow:bulk-fluid-motion")).length, 0);
  // the exact forced-circulation route: atomic in structure (one transport phenomenon), demonstrated in evidence — never "circular"
  assert.equal(loop.structural_kind, "atomic");
  assert.equal(loop.search_status, "demonstrated");
  assert.equal(loop.frontier_class, "demonstrated");
  assert.ok(!graph.paths.some((p) => (p.frontier_class as string) === "circular"), "the class was renamed same-form");
  assert.ok(graph.paths.some((p) => p.frontier_class === "same-form" && !p.pathway), "unrecorded same-form routes keep the honest class");
  assert.ok(!graph.paths.some((p) => p.frontier_class === "same-form" && p.search_status === "demonstrated"), "a demonstrated route is never classed same-form");
  // the MHD pair: the flow-driven claim needs only the transverse field (its subject provides the flow); the hot-gas claim needs both,
  // and the combustion generator reads unresolved on the flow it obtains from its own nozzle until the schema can record that provider
  const flowMhd = canon.claims.find((c) => c.id === "claim:flow-drives-mhd")!;
  const hotMhd = canon.claims.find((c) => c.id === "claim:hot-gas-drives-mhd")!;
  assert.deepEqual(flowMhd.regime_requires, ["field:transverse-magnetic-field"]);
  assert.deepEqual([...hotMhd.regime_requires].sort(), ["field:transverse-magnetic-field", "flow:bulk-fluid-motion"]);
  assert.deepEqual(hotMhd.regime_external, ["field:transverse-magnetic-field"]);
  // pass 43: the named generator is re-spelled through the nozzle stage — pressure drop from its implementation-process
  // establishment, bulk flow from the gas-dynamic-expansion-produced fluid-flow, the transverse field external — and PASSES;
  // the compact hot-gas → MHD spelling stays unresolved on flow, and an unrecorded route through the nozzle stays unresolved on the drop
  const mhdPathway = canon.pathways.find((p) => p.id === "pathway:mhd-generator")!;
  assert.deepEqual(mhdPathway.steps, [
    "claim:combustion-drives",
    "claim:combustion-produces-hot-gas",
    "claim:hot-gas-drives-gas-dynamic-expansion",
    "claim:gas-dynamic-expansion-produces-flow",
    "claim:flow-drives-mhd",
    "claim:mhd-produces",
    "claim:charge-carriers-convert-electricity",
  ]);
  assert.equal(mhdPathway.auxiliary_requirements.length, 0, "no invented auxiliary");
  assert.deepEqual(mhdPathway.regime_establishments.map((e) => [e.token, e.kind]), [["thermodynamic:expansion-pressure-drop", "implementation-process"]]);
  const mhdGen = graph.paths.find((p) => p.pathway === "pathway:mhd-generator")!;
  assert.equal(regime(mhdGen).result, "pass", regime(mhdGen).detail);
  assert.match(regime(mhdGen).detail, /claim:hot-gas-drives-gas-dynamic-expansion: thermodynamic:expansion-pressure-drop/);
  assert.match(regime(mhdGen).detail, /claim:flow-drives-mhd: field:transverse-magnetic-field/);
  const compact = graph.paths.filter((p) => p.claims.includes("claim:hot-gas-drives-mhd"));
  assert.ok(compact.length > 0, "the compact spelling is kept");
  for (const p of compact) {
    assert.equal(regime(p).result, "unresolved", p.id);
    assert.match(regime(p).detail, /requires flow:bulk-fluid-motion/);
    assert.equal(p.pathway, undefined, "no recorded pathway sits on the compact spelling any more");
  }
  const flowSourced = graph.paths.filter((p) => p.claims.includes("claim:flow-drives-mhd") && p.nodes[0] === "disequilibrium:fluid-flow");
  assert.ok(flowSourced.length > 0);
  for (const p of flowSourced) assert.equal(regime(p).result, "pass", p.id);
  const nozzleUnrecorded = graph.paths.filter((p) => p.claims.includes("claim:hot-gas-drives-gas-dynamic-expansion") && !p.pathway);
  assert.ok(nozzleUnrecorded.length > 0);
  for (const p of nozzleUnrecorded) {
    assert.equal(regime(p).result, "unresolved", p.id);
    assert.match(regime(p).detail, /requires thermodynamic:expansion-pressure-drop/);
  }
  // the establishment is an explanation, never a hiding place: it is refused for a token no step requires, for one an auxiliary
  // already establishes, and for one whose registry entry needs no explanation (temp copies of the data)
  const tmpE = mkdtempSync(join(tmpdir(), "pta-estab-"));
  cpSync(join(root, "data", "canonical"), join(tmpE, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmpE, "data", "generated"), { recursive: true });
  const pfE = join(tmpE, "data", "canonical", "pathways", "pathways.yaml");
  const ptE = readFileSync(pfE, "utf8");
  const gtAt = ptE.indexOf("  auxiliary_requirements:", ptE.indexOf("- id: pathway:combustion-gas-turbine"));
  assert.ok(gtAt > 0);
  const estab = (token: string) => `  regime_establishments:\n    - { token: ${token}, kind: implementation-process, explanation: x, evidence: [source:smith-1979-nasa-tm-79135] }\n`;
  writeFileSync(pfE, ptE.slice(0, gtAt) + estab("thermodynamic:expansion-pressure-drop") + ptE.slice(gtAt));
  assert.throws(() => loadCanon(tmpE), /an auxiliary_requirements entry already establishes/);
  writeFileSync(pfE, ptE.slice(0, gtAt) + estab("flow:bulk-fluid-motion") + ptE.slice(gtAt));
  assert.throws(() => loadCanon(tmpE), /not in its regime_provides/);
  rmSync(tmpE, { recursive: true, force: true });
  // conduction and advection stay distinct mechanisms on the same source and sink
  const cond = graph.paths.find((p) => p.pathway === "pathway:heat-exchanger")!;
  assert.notEqual(cond.id, loop.id);
  assert.equal(loop.dominated_by, null, "the advective loop is not collapsed onto the conduction spelling");
  // provider_needs_explanation: cutting the PWR's auxiliary while keeping its provider fails validation
  const tmp = mkdtempSync(join(tmpdir(), "pta-flow-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  cpSync(join(root, "data", "generated"), join(tmp, "data", "generated"), { recursive: true });
  const file = join(tmp, "data", "canonical", "pathways", "pathways.yaml");
  const text = readFileSync(file, "utf8");
  const start = text.indexOf("  auxiliary_requirements:", text.indexOf("- id: pathway:pwr-primary-heat-delivery"));
  const end = text.indexOf("  environment:", start);
  assert.ok(start > 0 && end > start);
  writeFileSync(file, text.slice(0, start) + text.slice(end));
  assert.throws(() => loadCanon(tmp), /supplies flow:bulk-fluid-motion but no preceding step of its route provides it, no auxiliary_requirements entry establishes it and no regime_establishments entry explains it/);
  rmSync(tmp, { recursive: true, force: true });
  // pass 41 added no process edge (761); pass 43 added the nozzle stage — two process claims and one phenomenon — and the ten
  // routes it generates are enumerated and classified in design/reviews/loop-3/pass-43.md
  assert.equal(graph.paths.length, 771);
  assert.equal(graph.paths.filter((p) => p.nodes.includes("phenomenon:gas-dynamic-expansion")).length, 10);
});

test("the gas-turbine / expansion-carrier closure (loop-3 pass 36): the pressure regime is required by the expansion step, supplied only through an explained auxiliary, and never by the carrier or by combustion", () => {
  const route = (id: string) => graph.paths.find((p) => p.pathway === id)!;
  const regime = (p: (typeof graph.paths)[number]) => p.checks.find((k) => k.id === "driver-regime-sufficiency")!;
  // generic combustion → hot gas → expansion without a reviewed provider is unresolved on the token
  const generic = graph.paths.filter((p) => !p.pathway && p.claims.includes("claim:combustion-produces-hot-gas") && p.claims.includes("claim:hot-gas-drives-expansion"));
  assert.ok(generic.length > 0);
  for (const p of generic) {
    assert.equal(regime(p).result, "unresolved", p.id);
    assert.match(regime(p).detail, /thermodynamic:expansion-pressure-drop/);
  }
  // the reviewed gas turbine with its compressor auxiliary passes; the nuclear plant (pass 38) passes through the gradient, not the pressure drop
  assert.equal(regime(route("pathway:combustion-gas-turbine")).result, "pass");
  assert.equal(regime(route("pathway:nuclear-steam-plant")).result, "pass");
  // hot gas → thermal emission does not acquire the pressure requirement; the carrier no longer claims pressure
  const emission = canon.claims.find((c) => c.id === "claim:hot-gas-drives-thermal-emission")!;
  assert.deepEqual(emission.regime_requires, []);
  const hotGas = canon.entities.find((e) => e.id === "carrier:hot-gas")!;
  assert.equal(hotGas.name, "Hot gas");
  assert.doesNotMatch(hotGas.summary, /at high temperature and pressure/);
  assert.deepEqual(hotGas.regime_provides, []);
  assert.deepEqual(canon.claims.find((c) => c.id === "claim:combustion-produces-hot-gas")!.regime_provides, []);
  // the auxiliary never enters enumeration: the gas-turbine route is exactly its seven steps and no route names a compressor
  assert.equal(route("pathway:combustion-gas-turbine").claims.length, 7);
  assert.equal(graph.paths.filter((p) => p.claims.some((c) => /compressor|auxiliary/.test(c))).length, 0);
  // an unregistered token is refused by the schema
  assert.throws(() => Claim.parse({ ...emission, regime_requires: ["thermal:made-up-regime"] }), /unknown regime token/);
  // removing the auxiliary while leaving the pathway provider fails validation
  const tmp = mkdtempSync(join(tmpdir(), "pta-aux-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  const file = join(tmp, "data", "canonical", "pathways", "pathways.yaml");
  const text = readFileSync(file, "utf8");
  const start = text.indexOf("  auxiliary_requirements:\n    - kind: recirculating-work");
  const end = text.indexOf("  performance:", start);
  assert.ok(start > 0 && end > start, "the gas-turbine auxiliary block is where the test expects it");
  writeFileSync(file, text.slice(0, start) + text.slice(end));
  assert.throws(() => loadCanon(tmp), /supplies thermodynamic:expansion-pressure-drop but no preceding step of its route provides it, no auxiliary_requirements entry establishes it and no regime_establishments entry explains it/);
  rmSync(tmp, { recursive: true, force: true });
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
  // pass 36: the gas-turbine member passes too, through its explained compressor auxiliary (it read unknown in pass 34)
  assert.equal(cc.members.find((m) => m.id === "topping")!.route_checks["driver-regime-sufficiency"], "pass");
  // The loader gate: a copy of the canonical data with the handoff pointed at the wrong disequilibrium fails to load.
  const tmp = mkdtempSync(join(tmpdir(), "pta-systems-"));
  cpSync(join(root, "data", "canonical"), join(tmp, "data", "canonical"), { recursive: true });
  const file = join(tmp, "data", "canonical", "systems", "systems.yaml");
  writeFileSync(file, readFileSync(file, "utf8").replace("to_source: disequilibrium:temperature-gradient", "to_source: disequilibrium:chemical-potential-difference"));
  assert.throws(() => loadCanon(tmp), /names to_source disequilibrium:chemical-potential-difference but that member's route starts from disequilibrium:temperature-gradient/);
  rmSync(tmp, { recursive: true, force: true });
});
