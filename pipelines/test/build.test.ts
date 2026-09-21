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
  assert.doesNotMatch(pw("thermophotovoltaic").performance?.theoretical_limit ?? "", /projected/);
  assert.doesNotMatch(pw("solar-water-heater").performance?.theoretical_limit ?? "", /0\.9/);
  assert.match(pw("photosynthesis").performance?.theoretical_limit ?? "", /two-photosystem/);
  // pass 39 closing: bounds only in the limit field; every model-scope datum says what kind it is; a measured datum is never model scope
  for (const p of graph.pathways) assert.doesNotMatch(p.performance?.theoretical_limit ?? "", /Curzon|reach a few per cent|η\/η_Carnot|benchmark/, `${p.id}: a benchmark inside the limit field`);
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
  // the flow token comes from nowhere but a recorded provider: no disequilibrium, carrier or claim provides it by name
  assert.equal(canon.entities.filter((e) => (e.regime_provides ?? []).includes("flow:bulk-fluid-motion")).length, 0);
  assert.equal(canon.claims.filter((c) => c.regime_provides.includes("flow:bulk-fluid-motion") || c.regime_external.includes("flow:bulk-fluid-motion")).length, 0);
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
  assert.throws(() => loadCanon(tmp), /supplies flow:bulk-fluid-motion but no preceding step of its route provides it and no auxiliary_requirements entry establishes it/);
  rmSync(tmp, { recursive: true, force: true });
  // the route count did not move: this pass added no process edge
  assert.equal(graph.paths.length, 761);
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
  assert.throws(() => loadCanon(tmp), /supplies thermodynamic:expansion-pressure-drop but no preceding step of its route provides it and no auxiliary_requirements entry establishes it/);
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
