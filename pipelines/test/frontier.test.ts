import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { researchOrder } from "@pta/graph/order";
import type { CompiledPath } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const paths: CompiledPath[] = JSON.parse(readFileSync(join(root, "apps", "web", "generated", "paths.json"), "utf8"));
const byId = new Map(paths.map((p) => [p.id, p]));
const graph: { searches: { id: string; target: { kind: string; path?: string }; reviewed?: boolean; result: string; hits: { decision: string; doi?: string }[] }[] } = JSON.parse(
  readFileSync(join(root, "apps", "web", "generated", "graph.json"), "utf8"),
);

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

test("a proposed pathway (TOEC) is attached to its route and never makes it demonstrated; its class comes from the demonstrated sibling, not the proposal", () => {
  const toec = paths.find((p) => p.pathway === "pathway:thermo-osmotic-energy-converter");
  assert.ok(toec, "TOEC pathway compiled");
  assert.notEqual(toec!.frontier_class, "demonstrated");
  assert.notEqual(toec!.search_status, "demonstrated");
  assert.equal(toec!.structural_kind, "composition");
  // Loop-3 pass 22: the thermal-osmosis → electrokinetic pathway (demonstrated) shares the route's head — driver
  // step and first conversion — but the route diverges into a different coupling family (turbomachinery, not
  // electrokinetic), so the head no longer makes it derived: it is a candidate with the sibling named as its
  // claim overlap. The proposal itself is still ignored for overlap.
  assert.equal(toec!.frontier_class, "candidate");
  assert.equal(toec!.known_pathway_overlap?.pathway, "pathway:thermal-osmosis-electrokinetic-generator");
  // The reviewed route search is attached: an honest partial whose only turbine run is a longer chain.
  assert.equal(toec!.search_status, "search-incomplete");
  const rec = graph.searches.find((s) => s.target.kind === "path" && s.target.path === toec!.id && s.reviewed);
  assert.ok(rec, "reviewed TOEC route record compiled");
  assert.equal(rec!.result, "inconclusive");
  assert.ok(rec!.hits.some((h) => h.decision === "longer-chain" && h.doi === "10.1016/j.enconman.2024.118636"));
  assert.ok(!rec!.hits.some((h) => h.decision === "qualifies"));
});

test("the sibling thermal-osmosis → streaming route carries the demonstrated MD-EPG pathway and is no longer a bare derived spelling", () => {
  const md = paths.find((p) => p.pathway === "pathway:thermal-osmosis-electrokinetic-generator");
  assert.ok(md, "MD-EPG pathway compiled");
  assert.equal(md!.frontier_class, "demonstrated");
  assert.equal(md!.search_status, "demonstrated");
  assert.deepEqual(md!.nodes, ["disequilibrium:temperature-gradient", "phenomenon:thermo-osmosis", "carrier:fluid-flow", "phenomenon:streaming-potential", "carrier:ionic-current", "output:electricity"]);
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

// Loop-3 pass 20: a resonance is an operating condition, not a conversion. The resonance-expanded
// spellings collapse onto the direct vibration → elastic deformation → stress routes, and a proposal
// never demonstrates.
test("resonance-expanded spellings are representation-equivalent to the direct vibration routes that carry the recorded pathways", () => {
  const flexoDirect = paths.find((p) => p.pathway === "pathway:flexoelectric-vibration-harvester");
  const elastoDirect = paths.find((p) => p.pathway === "pathway:vibration-elastocaloric-cooler");
  const flexoRes = paths.find(
    (p) =>
      p.nodes.includes("phenomenon:resonant-vibration") && p.nodes.includes("phenomenon:flexoelectric-effect") && p.source === "disequilibrium:mechanical-vibration" && p.sink === "output:electricity",
  );
  const elastoRes = paths.find(
    (p) =>
      p.nodes.includes("phenomenon:resonant-vibration") && p.nodes.includes("phenomenon:elastocaloric-effect") && p.source === "disequilibrium:mechanical-vibration" && p.sink === "output:cooling",
  );
  assert.ok(flexoDirect && elastoDirect && flexoRes && elastoRes, "all four routes compiled");
  assert.equal(flexoRes!.structural_kind, "representation-equivalent");
  assert.equal(flexoRes!.dominated_by, flexoDirect!.id);
  assert.equal(elastoRes!.structural_kind, "representation-equivalent");
  assert.equal(elastoRes!.dominated_by, elastoDirect!.id);
  // Yang 2025 demonstrates the direct flexoelectric route only; constituent resonance evidence promotes nothing.
  assert.equal(flexoDirect!.search_status, "demonstrated");
  assert.notEqual(flexoRes!.search_status, "demonstrated");
  // Kumar 2019 is a proposal: attached to the direct elastocaloric route, never a demonstration.
  assert.equal(elastoDirect!.pathway, "pathway:vibration-elastocaloric-cooler");
  assert.notEqual(elastoDirect!.search_status, "demonstrated");
  assert.notEqual(elastoRes!.search_status, "demonstrated");
  // The bending-actuated cooler starts at the stress row and is demonstrated on its own.
  const bending = paths.find((p) => p.pathway === "pathway:bending-actuated-elastocaloric-cooler");
  assert.ok(bending && bending.source === "disequilibrium:mechanical-stress" && bending.search_status === "demonstrated");
});

test("a shared head makes a route derived only when the first divergence stays in the same coupling family (loop-3 pass 22): head-divergent routes stay candidates", () => {
  const phen = (p: CompiledPath) => p.nodes.filter((n) => n.startsWith("phenomenon:")).map((n) => n.split(":")[1]).join(">");
  const find = (sig: string, source: string) => paths.find((p) => p.nodes[0] === source && phen(p) === sig && p.structural_kind === "composition");
  // family changes at the first divergence: candidates
  for (const [sig, source] of [
    ["thermomagnetic-ferrofluid-convection>streaming-potential", "disequilibrium:temperature-gradient"],
    ["thermal-expansion>flexoelectric-effect", "disequilibrium:temperature-gradient"],
    ["elastic-deformation>elastocaloric-effect", "disequilibrium:mechanical-vibration"],
    ["marangoni-effect>generator-action", "disequilibrium:temperature-gradient"],
  ] as const) {
    const p = find(sig, source);
    assert.ok(p, sig + " compiled");
    assert.equal(p!.frontier_class, "candidate", sig + " is a candidate, not derived by its shared head");
  }
  // true truncations of a demonstrated pathway stay derived (strict prefix, or shared claims spanning two phenomena)
  const pro = paths.find((p) => p.nodes[0] === "disequilibrium:salinity-gradient" && phen(p) === "pressure-retarded-osmosis>aerodynamic-lift" && p.sink === "output:mechanical-work");
  assert.ok(pro, "PRO → lift compiled");
  assert.equal(pro!.frontier_class, "derived");
  const fission = paths.find((p) => p.nodes[0] === "disequilibrium:nuclear-binding-difference" && phen(p) === "nuclear-fission>working-fluid-expansion" && p.sink === "output:mechanical-work");
  assert.ok(fission, "fission → expansion compiled");
  assert.equal(fission!.frontier_class, "derived");
});

test("an observed pathway (loop-3 pass 24) leads its route with the observation and changes nothing else: the thermal expansion → flexoelectric route stays a search-incomplete candidate", () => {
  const p = byId.get("p-a093d7ecc5");
  if (!p) return; // content-derived id; the synthetic build test covers the rule if the data changes
  assert.equal(p.pathway, "pathway:thermal-expansion-flexoelectric-response");
  assert.equal(p.composition_observation, "observed-not-converted");
  assert.equal(p.frontier_class, "candidate");
  assert.equal(p.search_status, "search-incomplete");
  assert.equal(p.structural_kind, "composition");
  // the observation is not evidence for anything else: no route is derived through the observed pathway
  for (const q of paths) {
    assert.notEqual(q.known_pathway_overlap?.pathway, p.pathway, `${q.id} overlaps the observed pathway`);
    assert.notEqual(q.closest_known_pathway?.pathway, p.pathway, `${q.id} is a variant of the observed pathway`);
  }
  // the reviewed record still holds the preprint as a sink-variant hit, never as qualifying
  const rec = graph.searches.find((s) => s.target.kind === "path" && s.target.path === "p-a093d7ecc5");
  assert.ok(rec && rec.result === "inconclusive");
  assert.ok(rec!.hits.some((h) => h.decision === "sink-variant"));
  assert.ok(!rec!.hits.some((h) => h.decision === "qualifies"));
});

test("a consuming step's carrier requirement is met only by the regime that provides it (loop-3 pass 25): the travelling-wave thermoacoustic spelling is the bounded acoustoelectric candidate, the generic-sound spelling is incomplete-handoff", () => {
  const phen = (p: CompiledPath) => p.nodes.filter((n) => n.startsWith("phenomenon:")).map((n) => n.split(":")[1]).join(">");
  const spellings = paths.filter((p) => p.nodes[0] === "disequilibrium:temperature-gradient" && phen(p) === "thermoacoustic-effect>acoustoelectric-effect" && p.sink === "output:electricity");
  assert.equal(spellings.length, 2, "two spellings of thermoacoustic → acoustoelectric");
  const travelling = spellings.find((p) => p.claims.includes("claim:thermoacoustic-produces-travelling-sound"));
  const generic = spellings.find((p) => p.claims.includes("claim:thermoacoustic-produces-sound"));
  assert.ok(travelling && generic);
  assert.equal(travelling!.frontier_class, "candidate");
  assert.equal(travelling!.handoff_unresolved_count, 0);
  assert.equal(travelling!.magnitude_screen.status, "relation-complete", "both drives steps carry a constitutive relation");
  assert.equal(travelling!.checks.find((c) => c.id === "dimensional")?.result, "pass");
  assert.equal(generic!.frontier_class, "incomplete-handoff");
  assert.ok(generic!.handoff_issues.some((h) => h.missing.includes("acoustic:travelling-wave")));
  // the piezoelectric sibling found on the way is a demonstrated pathway, never a candidate
  const piezo = paths.find((p) => p.pathway === "pathway:thermoacoustic-piezoelectric-harvester");
  assert.ok(piezo && piezo.search_status === "demonstrated" && piezo.frontier_class === "demonstrated");
});

test("magnitude screen: relation-complete means every relation-capable step (drives / couples_to / required) carries a relation; produces steps are never asked for one; no magnitude is asserted", () => {
  const complete = paths.filter((p) => p.magnitude_screen.status === "relation-complete");
  assert.ok(complete.length > 0, "the screen can say relation-complete");
  for (const p of paths) {
    if (p.magnitude_screen.status === "missing") assert.ok(p.magnitude_screen.bottleneck_claim, `${p.id} missing without a bottleneck`);
    if (p.magnitude_screen.status === "relation-complete") assert.equal(p.magnitude_data_coverage.quantified, p.magnitude_data_coverage.of, `${p.id} relation-complete but coverage incomplete`);
    assert.notEqual((p.magnitude_screen.status as string), "bounded", `${p.id} still says bounded`);
  }
});

test("scoped conditions and interface records (loop-3 pass 26): a demonstrated interface resolves the gas→solid transition, a theoretical one is recorded but unresolved, an unrecorded one stays implied, and no false conflict comes from an entity tag", () => {
  const boundary = (p: CompiledPath) => p.checks.find((c) => c.id === "boundary-compatibility")!;
  // (a) thermoacoustic → PAN membrane: demonstrated interface → PASS, nothing implied, one recorded
  const pan = paths.find((p) => p.pathway === "pathway:thermoacoustic-piezoelectric-harvester")!;
  assert.equal(boundary(pan).result, "pass");
  assert.equal(pan.implied_interface_count, 0);
  assert.deepEqual(pan.interfaces_recorded.map((r) => [r.interface, r.status]), [["interface:thermoacoustic-piezoelectric-gas-solid", "demonstrated"]]);
  // pass 27: the triboelectric sibling carries its own demonstrated piston boundary, and every demonstrated pathway is now boundary-pass
  const tribo = paths.find((p) => p.pathway === "pathway:thermoacoustic-triboelectric-harvester")!;
  assert.equal(boundary(tribo).result, "pass");
  assert.deepEqual(tribo.interfaces_recorded.map((r) => r.interface), ["interface:thermoacoustic-triboelectric-piston"]);
  // (b) combustion MHD: the phase-neutral charge carrier manufactures no gas→solid conflict; the electrode boundary is recorded within the step
  const mhd = paths.find((p) => p.pathway === "pathway:mhd-generator")!;
  assert.equal(boundary(mhd).result, "pass");
  assert.equal(mhd.implied_interface_count, 0);
  assert.ok(mhd.interfaces_recorded.some((r) => r.interface === "interface:mhd-plasma-electrodes" && r.location === "within claim:mhd-produces"));
  // (c) the acoustoelectric candidate: a theoretical record → UNRESOLVED, not implied, one recorded with a relation
  const cand = paths.find((p) => p.claims.includes("claim:thermoacoustic-produces-travelling-sound") && p.claims.includes("claim:acoustic-wave-drives-acoustoelectric") && p.nodes[0] === "disequilibrium:temperature-gradient")!;
  assert.equal(boundary(cand).result, "unresolved");
  assert.match(boundary(cand).detail, /^theoretical interface recorded/);
  assert.equal(cand.implied_interface_count, 0);
  assert.deepEqual(cand.interfaces_recorded.map((r) => r.status), ["theoretical"]);
  assert.deepEqual(cand.interface_model_coverage, { with_relation: 1, of: 1 });
  assert.equal(cand.magnitude_screen.status, "relation-complete", "the interface relation stays outside the magnitude screen");
  // (27) a genuinely absent interface: the generic-sound spelling changes the active medium from gas to solid with no record
  const generic = paths.find((p) => p.claims.includes("claim:thermoacoustic-produces-sound") && p.claims.includes("claim:acoustic-wave-drives-acoustoelectric") && p.nodes[0] === "disequilibrium:temperature-gradient")!;
  assert.equal(boundary(generic).result, "unresolved");
  assert.match(boundary(generic).detail, /^interface unrecorded/);
  assert.equal(generic.implied_interface_count, 1);
  assert.equal(generic.interfaces_recorded.length, 0);
  // every demonstrated pathway is either boundary-pass or honestly unknown (no scoped requirements); never an anonymous implied interface
  for (const p of paths.filter((q) => q.search_status === "demonstrated")) {
    assert.equal(boundary(p).result, "pass", `${p.pathway}: ${boundary(p).detail}`);
    assert.equal(p.implied_interface_count, 0, `${p.pathway} shows an unrecorded interface`);
  }
});

test("driver / regime sufficiency on real routes (loop-3 pass 30): the reviewer's regressions", () => {
  const regime = (p: CompiledPath) => p.checks.find((c) => c.id === "driver-regime-sufficiency")!;
  const byPathway = (pw: string) => paths.find((p) => p.pathway === pw)!;
  // pyroelectric harvester re-spelled from temporal temperature change → PASS; the static-gradient edge is gone
  const pyro = byPathway("pathway:pyroelectric-harvester");
  assert.equal(pyro.nodes[0], "disequilibrium:temperature-change");
  assert.equal(regime(pyro).result, "pass");
  assert.ok(!paths.some((p) => p.nodes[0] === "disequilibrium:temperature-gradient" && p.claims[0] === "claim:pyro-drives"), "no pyroelectric route starts at a static gradient");
  // a single caloric event produces a temperature change, not a gradient: no direct caloric → Seebeck route remains
  assert.ok(!paths.some((p) => p.claims.includes("claim:magnetocaloric-produces") && p.claims.includes("claim:seebeck-drives")), "caloric → gradient → Seebeck routes eliminated");
  assert.ok(paths.some((p) => p.claims.includes("claim:magnetocaloric-produces") && p.claims.includes("claim:pyro-drives")), "a caloric event can feed pyroelectricity at the regime level");
  // electrocaloric (pass 31): re-spelled onto the changing electric field, the single effect passes from its source; no static-bias spelling remains
  const ec = paths.find((p) => p.claims[0] === "claim:electrocaloric-drives")!;
  assert.equal(ec.nodes[0], "disequilibrium:electric-field-change");
  assert.equal(regime(ec).result, "pass");
  assert.ok(!paths.some((p) => p.nodes[0] === "disequilibrium:electric-potential-difference" && p.claims[0] === "claim:electrocaloric-drives"));
  // magnetocaloric: the single effect passes from the changing field; the refrigerator passes through its own regime_provides; a generic cooling route without cycling is unresolved
  assert.equal(regime(byPathway("pathway:magnetocaloric-refrigeration")).result, "pass");
  const mcGeneric = paths.find((p) => p.claims.includes("claim:magnetocaloric-converts-cooling") && !p.pathway);
  if (mcGeneric) assert.equal(regime(mcGeneric).result, "unresolved");
  // vibration → elastic → elastocaloric: stress change supplied, the transformation threshold missing
  const vib = byPathway("pathway:vibration-elastocaloric-cooler");
  assert.equal(regime(vib).result, "unresolved");
  assert.match(regime(vib).detail, /stress-crosses-transformation-threshold/);
  assert.doesNotMatch(regime(vib).detail, /requires mechanical:stress-change;/);
  // thermogalvanic passes; thermomagnetic convection passes only with the external non-uniform field; the thermomagnetic generator passes through its pathway
  assert.equal(regime(byPathway("pathway:thermogalvanic-cell")).result, "pass");
  assert.equal(regime(byPathway("pathway:thermomagnetic-hydrodynamic-harvester")).result, "pass");
  assert.equal(regime(byPathway("pathway:thermomagnetic-generator")).result, "pass");
  const tmGeneric = paths.find((p) => p.claims[0] === "claim:thermomagnetic-drives" && !p.pathway);
  if (tmGeneric) assert.equal(regime(tmGeneric).result, "unresolved");
  // generic photovoltaic spellings are unresolved on the spectrum; the module and the thermophotovoltaic pathway pass through their own evidence
  const pvGeneric = paths.find((p) => p.claims.includes("claim:pv-drives") && !p.pathway);
  if (pvGeneric) assert.equal(regime(pvGeneric).result, "unresolved");
  assert.equal(regime(byPathway("pathway:photovoltaic-module")).result, "pass");
  assert.equal(regime(byPathway("pathway:thermophotovoltaic")).result, "pass");
  // the thermoacoustic threshold cannot self-certify: the generator passes through its pathway, the acoustoelectric candidate stays unresolved
  assert.equal(regime(byPathway("pathway:thermoacoustic-generator")).result, "pass");
  // pass 31: the Tušek heat pump carries the mechanical regimes on its own pathway; the mechanical-stress source supplies none
  assert.equal(regime(byPathway("pathway:regenerative-elastocaloric-heat-pump")).result, "pass");
  const stressGeneric = paths.find((p) => p.claims[0] === "claim:elastocaloric-drives" && !p.pathway);
  if (stressGeneric) assert.equal(regime(stressGeneric).result, "unresolved");
  const ae = paths.find((p) => p.claims.includes("claim:thermoacoustic-produces-travelling-sound") && p.claims.includes("claim:acoustic-wave-drives-acoustoelectric") && p.nodes[0] === "disequilibrium:temperature-gradient")!;
  assert.equal(regime(ae).result, "unresolved");
  // no route fails, and no demonstrated pathway is left unresolved
  for (const p of paths) assert.notEqual(regime(p).result, "fail", p.id);
  // Pass 36: the nuclear steam plant is left unresolved on purpose — the hot-gas → expansion step now requires the expansion pressure drop,
  // and that pathway's steam-generation / pressure architecture has not been source-reviewed; commercial status never substitutes.
  const deliberatelyUnresolved = new Set(["pathway:nuclear-steam-plant"]);
  for (const p of paths.filter((q) => q.search_status === "demonstrated" && !deliberatelyUnresolved.has(q.pathway ?? ""))) assert.notEqual(regime(p).result, "unresolved", `${p.pathway}: ${regime(p).detail}`);
  assert.equal(regime(byPathway("pathway:nuclear-steam-plant")).result, "unresolved");
});
