// Loop-3 pass 48: the electrical output-form / terminal-boundary audit (the reviewer's pass-47 findings 13–14) — a generated,
// gated report, never a classifier and never a token. Over every pathway and every route ending at output:electricity it records
// the last phenomenon, the terminal producer claim (phenomenon → electrical carrier) and the conversion claim (the load boundary),
// the electrical form an atlas record STATES for that producer (from design/reviews/loop-3/pass-48-dispositions.yaml; `unspecified`
// where none does, with the auditor's physics reading kept in its own column), any conditioning stage after electrical power first
// exists (an electrical → electrical coupling into a further phenomenon: the rectenna's rectification), and — the decisive
// question — whether any claim on the route REQUIRES a form: the answer is read from the requirement namespaces themselves, so
// "form is merely descriptive" is a computed fact, not an assertion. For every electrical datum it records where the numerator
// sits relative to the conditioning and delivery stages (terminals | after-power-electronics | grid | net-plant | per-event-peak |
// unstated), beside the record's own basis so the two can be compared. Writes design/reviews/loop-3/pass-48-electrical-form-audit.md.
// --check gates (pipelines/test): every producer claim and every electrical datum has a row; a stated form quotes a record; no
// requirement token names a current form or waveform; the reviewer's controls hold (antenna: rf-oscillatory, no rectifier
// required; rectenna: dc after rectification; a rotating generator needs no current:direct; PV needs no inversion; grid-connected
// data keep their boundary); the report on disk matches the graph.
//   node tools/audit-electrical-form.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = resolve(fileURLToPath(import.meta.url), "..");
const root = join(here, "..");
const check = process.argv.includes("--check");
const graph = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8"));
const paths = JSON.parse(readFileSync(join(root, "data", "generated", "paths.json"), "utf8"));
const disp = parse(readFileSync(join(root, "design", "reviews", "loop-3", "pass-48-dispositions.yaml"), "utf8"));
const entityById = new Map(graph.entities.map((e) => [e.id, e]));
const claimById = new Map(graph.claims.map((c) => [c.id, c]));
const name = (id) => entityById.get(id)?.name ?? id;
const FORMS = new Set(["dc", "ac", "rf-oscillatory", "pulsed", "unspecified"]);
const BOUNDARIES = new Set(["terminals", "after-power-electronics", "grid", "net-plant", "per-event-peak", "unstated"]);
const problems = [];

// The electrical carriers are the subjects of the conversion claims into electrical work; a producer delivers one of them.
const conversions = graph.claims.filter((c) => c.object === "output:electricity");
const electricalCarriers = new Set(conversions.map((c) => c.subject));
const producers = graph.claims.filter((c) => electricalCarriers.has(c.object));
const producerRow = new Map((disp.producers ?? []).map((r) => [r.claim, r]));
for (const c of producers) if (!producerRow.has(c.id)) problems.push(`producer ${c.id} has no disposition row`);
for (const r of disp.producers ?? []) {
  if (!claimById.has(r.claim)) problems.push(`producer row names unknown claim ${r.claim}`);
  else if (!electricalCarriers.has(claimById.get(r.claim).object)) problems.push(`producer row ${r.claim} does not deliver an electrical carrier`);
  if (!FORMS.has(r.form)) problems.push(`producer row ${r.claim}: unknown form ${r.form}`);
  if (r.form !== "unspecified" && !r.stated) problems.push(`producer row ${r.claim}: a stated form must quote the record that states it`);
}
// Conditioning: electrical → electrical coupling from a phenomenon or an electrical carrier into a further phenomenon.
const isConditioning = (c) =>
  c.energy?.input === "electrical" && c.energy?.output === "electrical" && entityById.get(c.object)?.type === "phenomenon" &&
  (entityById.get(c.subject)?.type === "phenomenon" || electricalCarriers.has(c.subject));
// The decisive question: does any requirement namespace name an electrical form or waveform?
const requirementTokens = [...new Set(graph.claims.flatMap((c) => [...(c.regime_requires ?? []), ...(c.handoff?.requires_all ?? []), ...(c.handoff?.requires_any ?? [])]))].sort();
const formTokens = requirementTokens.filter((t) => /^(current|waveform|electric|electrical):/.test(t));
if (formTokens.length) problems.push(`requirement tokens name an electrical form: ${formTokens.join(", ")} — the audit's premise (form is descriptive) no longer holds; propose a mechanism in the pass result instead`);

/** Terminal analysis of an ordered claim sequence ending at electricity. */
function terminal(claimIds) {
  const claims = claimIds.map((id) => claimById.get(id)).filter(Boolean);
  const conversion = claims[claims.length - 1];
  const producer = [...claims].reverse().find((c) => electricalCarriers.has(c.object));
  const lastPhenomenon = producer ? producer.subject : null;
  const firstElectrical = claims.findIndex((c) => c.energy?.output === "electrical");
  const conditioning = claims.filter((c, i) => i > firstElectrical && isConditioning(c));
  const row = producer ? producerRow.get(producer.id) : undefined;
  const requires = claims.flatMap((c) => [...(c.regime_requires ?? []), ...(c.handoff?.requires_all ?? []), ...(c.handoff?.requires_any ?? [])]).filter((t) => /^(current|waveform|electric|electrical):/.test(t));
  return { claims, conversion, producer, lastPhenomenon, conditioning, form: row?.form ?? "unspecified", reading: row?.reading ?? "", stated: row?.stated ?? "", requires };
}

// Pathways ending at electricity ------------------------------------------------------------------------------------------------
const pathways = graph.pathways.filter((p) => claimById.get(p.steps[p.steps.length - 1])?.object === "output:electricity");
const pathwayRows = pathways.map((p) => ({ p, t: terminal(p.steps) }));
// Routes ending at electricity ----------------------------------------------------------------------------------------------------
const routes = paths.filter((r) => r.sink === "output:electricity");
const routeRows = routes.map((r) => ({ r, t: terminal(r.claims) }));
const byForm = (rows) => { const m = new Map(); for (const x of rows) m.set(x.t.form, (m.get(x.t.form) ?? 0) + 1); return [...m].sort().map(([k, v]) => `${k} ${v}`).join(" · "); };

// Electrical data ------------------------------------------------------------------------------------------------------------------
const ELECTRICAL = /power|efficien|electric|watt|\bW\b|voltage|current|load/i;
const dataRows = [];
for (const p of pathways) for (const m of p.performance?.measurements ?? []) if (ELECTRICAL.test(`${m.quantity} ${m.metric ?? ""} ${m.unit ?? ""}`)) dataRows.push({ owner: p.id, kind: "pathway", m });
for (const s of graph.systems ?? []) for (const m of s.performance?.measurements ?? []) if (ELECTRICAL.test(`${m.quantity} ${m.metric ?? ""} ${m.unit ?? ""}`)) dataRows.push({ owner: s.id, kind: "system", m });
const boundaryRows = disp.boundaries ?? [];
const findBoundary = (owner, m) => boundaryRows.filter((b) => (b.pathway ?? b.system) === owner && b.quantity === m.quantity && (b.value === undefined || b.value === m.value));
for (const d of dataRows) {
  const hits = findBoundary(d.owner, d.m);
  if (hits.length !== 1) problems.push(`${d.owner} "${d.m.quantity}"${hits.length ? " matches " + hits.length + " boundary rows" : " has no boundary row"}`);
  else {
    d.b = hits[0];
    if (!BOUNDARIES.has(d.b.boundary)) problems.push(`${d.owner} "${d.m.quantity}": unknown boundary ${d.b.boundary}`);
  }
}
for (const b of boundaryRows) if (!dataRows.some((d) => d.b === b)) problems.push(`boundary row ${b.pathway ?? b.system} "${b.quantity}"${b.value ? " (" + b.value + ")" : ""} matches no electrical datum`);

// Controls (the reviewer's finding 14) ---------------------------------------------------------------------------------------------
const routeOf = (pathwayId) => routeRows.find((x) => x.r.pathway === pathwayId);
const antenna = routeRows.find((x) => x.t.producer?.id === "claim:antenna-produces" && x.r.claims.length === 3);
if (!antenna) problems.push("control: the atomic antenna → electricity route is not enumerated");
else {
  if (antenna.t.form !== "rf-oscillatory") problems.push(`control antenna: form ${antenna.t.form}, expected rf-oscillatory`);
  if (antenna.t.conditioning.length) problems.push("control antenna: a conditioning stage appears on the atomic route");
  if (antenna.t.requires.length) problems.push("control antenna: a claim requires an electrical form");
  if (antenna.r.frontier_class !== "candidate") problems.push(`control antenna: class ${antenna.r.frontier_class}, expected candidate — generic electricity requires no rectifier`);
}
const rectenna = pathwayRows.find((x) => x.p.id === "pathway:rectenna-microwave");
if (!rectenna) problems.push("control: pathway:rectenna-microwave missing");
else {
  if (rectenna.t.form !== "dc") problems.push(`control rectenna: form ${rectenna.t.form}, expected dc`);
  if (!rectenna.t.conditioning.some((c) => c.object === "phenomenon:rectification")) problems.push("control rectenna: rectification is not read as the conditioning stage");
  const datum = dataRows.find((d) => d.owner === "pathway:rectenna-microwave");
  if (datum?.b?.boundary !== "after-power-electronics") problems.push("control rectenna: its datum is not after the rectifier");
}
for (const id of ["pathway:hydroelectric-plant", "pathway:wind-turbine", "pathway:rankine-steam-plant"]) {
  const x = routeOf(id);
  if (!x) { problems.push(`control generator: ${id} has no route`); continue; }
  if (x.t.producer?.id !== "claim:generator-produces-carriers") problems.push(`control generator: ${id} does not end in generator action`);
  if (x.t.requires.length) problems.push(`control generator: ${id} requires an electrical form`);
  if (x.r.frontier_class !== "demonstrated") problems.push(`control generator: ${id} reads ${x.r.frontier_class}`);
}
const pv = routeOf("pathway:photovoltaic-module");
if (!pv) problems.push("control PV: no route");
else {
  if (pv.t.conditioning.length) problems.push("control PV: a conditioning stage (inversion) appears");
  if (pv.t.requires.length) problems.push("control PV: a claim requires an electrical form");
  const datum = dataRows.find((d) => d.owner === "pathway:photovoltaic-module");
  if (datum?.b?.boundary !== "terminals") problems.push("control PV: the module datum is not at the module's terminals");
  if (pv.r.frontier_class !== "demonstrated") problems.push(`control PV: reads ${pv.r.frontier_class}`);
}
const gridControls = [
  ["pathway:otec-plant", "maximum grid-connected electrical power", "grid", /grid-connected/],
  ["pathway:rankine-steam-plant", "net plant electrical efficiency", "net-plant", /to the 400 kV grid/],
  ["pathway:hydroelectric-plant", "water-to-wire plant efficiency", "net-plant", /water-to-wire/],
  ["pathway:combustion-microthermophotovoltaic-generator", "heat-to-electricity efficiency", "after-power-electronics", /maximum-power-point converter/],
];
for (const [owner, quantity, boundary, re] of gridControls) {
  const d = dataRows.find((x) => x.owner === owner && x.m.quantity === quantity);
  if (!d) { problems.push(`control boundary: ${owner} "${quantity}" missing`); continue; }
  if (d.b?.boundary !== boundary) problems.push(`control boundary: ${owner} "${quantity}" reads ${d.b?.boundary}, expected ${boundary}`);
  if (!re.test(`${d.m.basis ?? ""} ${d.m.conditions ?? ""} ${d.m.quantity}`)) problems.push(`control boundary: ${owner} "${quantity}" — the record does not state ${re}`);
}
const dcAlias = (entityById.get("output:electricity")?.aliases ?? []).some((a) => /^dc\b/i.test(a));
if (dcAlias) problems.push("output:electricity still carries a DC alias (finding 4)");

// Report -------------------------------------------------------------------------------------------------------------------------
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const short = (s, n = 220) => (String(s ?? "").length > n ? String(s).slice(0, n - 1) + "…" : String(s ?? ""));
const lines = [];
lines.push("# Pass 48 — the electrical output-form / terminal-boundary audit (generated by tools/audit-electrical-form.mjs; do not edit by hand)");
lines.push("");
lines.push(
  `Revision ${graph.meta.data_hash} · ${pathways.length} recorded pathways and ${routes.length} routes end at output:electricity (${routes.filter((r) => r.search_status === "demonstrated").length} routes demonstrated) · ${producers.length} producer claims deliver one of ${electricalCarriers.size} electrical carriers to ${conversions.length} conversion claims · ${dataRows.length} electrical data. A form is recorded only where an atlas record states it; the auditor's reading is descriptive and never becomes a form. The decisive fact, computed from the requirement namespaces: ${formTokens.length === 0 ? "**no claim requires an electrical form or waveform** — every form below is merely descriptive" : "requirement tokens name a form: " + formTokens.join(", ")}. The ${requirementTokens.length} requirement tokens in use: ${requirementTokens.join(", ")}.`,
);
lines.push("");
lines.push(`Forms stated for producers: ${[...FORMS].map((f) => `${f} ${producers.filter((c) => producerRow.get(c.id)?.form === f).length}`).join(" · ")}. Pathways by terminal form: ${byForm(pathwayRows)}. Routes by terminal form: ${byForm(routeRows)}. Conditioning stages found: ${[...new Set(pathwayRows.flatMap((x) => x.t.conditioning.map((c) => c.object)))].map(name).join(", ") || "none"} (${pathwayRows.filter((x) => x.t.conditioning.length).length} pathway(s), ${routeRows.filter((x) => x.t.conditioning.length).length} route(s)).`);
lines.push("");
lines.push("## 1. Producer claims (phenomenon → electrical carrier): the form an atlas record states, and the auditor's reading");
lines.push("");
lines.push("| producer claim | phenomenon | carrier | form (stated) | stated by | reading (descriptive) | routes ending through it |");
lines.push("|---|---|---|---|---|---|---|");
for (const c of producers.sort((a, b) => a.id.localeCompare(b.id))) {
  const r = producerRow.get(c.id);
  lines.push(`| ${c.id} | ${esc(name(c.subject))} | ${c.object.replace("carrier:", "")} | ${r?.form ?? "—"} | ${esc(short(r?.stated ?? "—", 260))} | ${esc(r?.reading ?? "")} | ${routeRows.filter((x) => x.t.producer?.id === c.id).length} |`);
}
lines.push("");
lines.push("## 2. Recorded pathways ending at electricity: terminal stage, conditioning after electrical power first exists, requirement");
lines.push("");
lines.push("| pathway | status | last phenomenon | producer claim | conversion claim (load boundary) | conditioning stage(s) | form (stated) | requires a form |");
lines.push("|---|---|---|---|---|---|---|---|");
for (const { p, t } of pathwayRows.sort((a, b) => a.p.id.localeCompare(b.p.id)))
  lines.push(`| ${p.id.replace("pathway:", "")} | ${p.status} | ${esc(name(t.lastPhenomenon))} | ${t.producer?.id ?? "—"} | ${t.conversion?.id ?? "—"} | ${t.conditioning.map((c) => `${c.id} → ${name(c.object)}`).join("; ") || "none"} | ${t.form} | ${t.requires.length ? t.requires.join(", ") : "no"} |`);
lines.push("");
lines.push("## 3. Electrical data: where the numerator sits");
lines.push("");
lines.push("| owner | quantity | value | scope | boundary | the record's own basis / conditions (excerpt) | as read |");
lines.push("|---|---|---|---|---|---|---|");
for (const d of dataRows.sort((a, b) => a.owner.localeCompare(b.owner) || a.m.quantity.localeCompare(b.m.quantity)))
  lines.push(`| ${d.owner.replace(/^(pathway|system-pathway):/, "")} | ${esc(d.m.quantity)} | ${esc(d.m.value)} | ${d.m.scope} | ${d.b?.boundary ?? "—"} | ${esc(short(d.m.basis || d.m.conditions || "—"))} | ${esc(d.b?.stated ?? "")} |`);
lines.push("");
lines.push(`Boundaries: ${[...BOUNDARIES].map((b) => `${b} ${dataRows.filter((d) => d.b?.boundary === b).length}`).join(" · ")}.`);
lines.push("");
lines.push("## 4. Routes ending at electricity, by terminal producer");
lines.push("");
lines.push("| producer claim | form (stated) | routes | demonstrated | candidate | conditioning on any |");
lines.push("|---|---|---|---|---|---|");
const groups = new Map();
for (const x of routeRows) { const k = x.t.producer?.id ?? "—"; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
for (const [k, xs] of [...groups].sort((a, b) => a[0].localeCompare(b[0])))
  lines.push(`| ${k} | ${xs[0].t.form} | ${xs.length} | ${xs.filter((x) => x.r.search_status === "demonstrated").length} | ${xs.filter((x) => x.r.frontier_class === "candidate").length} | ${xs.some((x) => x.t.conditioning.length) ? "yes" : "no"} |`);
lines.push("");
lines.push("Reading the report: electrical work is one output whatever the waveform; the atlas records a form only in a claim's conditions or a datum's own words, and no downstream claim consumes one, so no token, carrier or schema field for a current form exists or is proposed. The one conditioning stage on record, rectification, narrows the rectenna's output to direct current; the antenna's own route delivers an oscillating current at the wave frequency to a load and is complete as electrical work. A datum's boundary says whether its numerator was taken at the converter's terminals, after power electronics, at the plant boundary or at the grid, or is a per-event peak — the only place where form and conditioning change a number. The report decides nothing; it shows where a future requirement would have to be recorded if a source ever made one.");
const out = lines.join("\n") + "\n";
const file = join(root, "design", "reviews", "loop-3", "pass-48-electrical-form-audit.md");
if (check) {
  if (!existsSync(file)) problems.push("the report file does not exist — run without --check");
  else if (readFileSync(file, "utf8") !== out) problems.push("the report on disk differs from the compiled graph — run without --check and commit the result");
}
if (problems.length) {
  console.error("audit-electrical-form: " + problems.length + " problem(s)\n  " + problems.join("\n  "));
  process.exit(1);
}
const summary = `${producers.length} producers · ${pathways.length} pathways · ${routes.length} routes · ${dataRows.length} data · form tokens ${formTokens.length}`;
if (!check) {
  writeFileSync(file, out);
  console.log(`audit-electrical-form: ${summary} — report written`);
} else console.log(`audit-electrical-form: ${summary} — consistent`);
