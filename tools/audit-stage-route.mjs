// Loop-3 pass 45: the stage-versus-route measurement audit as a deterministic table. Joins design/reviews/loop-3/pass-45-dispositions.yaml
// to the compiled graph and writes design/reviews/loop-3/pass-45-audit.md. Fails when an efficiency datum on any pathway (metric
// conversion-efficiency, device-stage-efficiency or carnot-relative-efficiency, or an unstructured datum whose quantity says
// "efficiency") has no row, when a row's action contradicts the data (a removed row whose datum survives; a restaged row whose
// datum is not device-stage-efficiency; a ranged or restaged range that still carries a scalar; a route row whose datum is not
// conversion-efficiency), or when a row names a datum that does not exist and is not marked removed. Run after `pnpm build:graph`:
//   node tools/audit-stage-route.mjs [--check]     (--check writes nothing, only gates)
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = resolve(fileURLToPath(import.meta.url), "..");
const root = join(here, "..");
const check = process.argv.includes("--check");
const graph = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8"));
const disp = parse(readFileSync(join(root, "design", "reviews", "loop-3", "pass-45-dispositions.yaml"), "utf8"));
const CLASSES = new Set(["route", "stage", "population", "other-route", "unresolved"]);
const ACTIONS = new Set(["kept", "restaged", "ranged", "removed"]);
const EFFICIENCY_METRICS = new Set(["conversion-efficiency", "device-stage-efficiency", "carnot-relative-efficiency"]);

const pathwayById = new Map(graph.pathways.map((p) => [p.id, p]));
const problems = [];
// A row matches a datum by pathway, its leading quantity text (a parenthesised value disambiguates same-named rows) and source.
const rowKey = (d) => `${d.pathway}|${d.quantity}|${d.source}`;
const datumKey = (p, m) => `${p.id}|${m.quantity}|${m.sources[0]}`;
const rows = disp.dispositions;
const seen = new Map();
for (const d of rows) {
  if (!CLASSES.has(d.class)) problems.push(`${d.pathway} "${d.quantity}": unknown class ${d.class}`);
  if (!ACTIONS.has(d.action)) problems.push(`${d.pathway} "${d.quantity}": unknown action ${d.action}`);
  if (!pathwayById.has(d.pathway)) problems.push(`${d.pathway}: unknown pathway`);
  seen.set(rowKey(d) + (d.value ? `|${d.value}` : ""), d);
}
const matchRow = (p, m) => {
  const base = datumKey(p, m);
  const candidates = rows.filter((d) => rowKey(d) === base);
  if (candidates.length === 1) return candidates[0];
  // the same quantity and source twice: the row's value must equal the datum's value string
  return candidates.find((d) => d.value !== undefined && d.value === m.value) ?? null;
};
const table = [];
for (const p of graph.pathways) {
  for (const m of p.performance?.measurements ?? []) {
    const isEfficiency = EFFICIENCY_METRICS.has(m.metric) || (!m.metric && /efficiency/i.test(m.quantity));
    if (!isEfficiency) continue;
    const d = matchRow(p, m);
    if (!d) { problems.push(`${p.id} "${m.quantity}" (${m.value}): no disposition`); continue; }
    if (d.action === "removed") problems.push(`${p.id} "${m.quantity}": disposed as removed but the datum survives`);
    if (d.class === "stage" && m.metric !== "device-stage-efficiency") problems.push(`${p.id} "${m.quantity}": class stage but metric ${m.metric}`);
    if ((d.class === "route" || d.class === "unresolved") && m.metric !== "conversion-efficiency") problems.push(`${p.id} "${m.quantity}": class ${d.class} but metric ${m.metric}`);
    if (m.value_range !== undefined && m.value_numeric !== undefined) problems.push(`${p.id} "${m.quantity}": a range with a scalar`);
    if (d.action === "restaged" && m.metric !== "device-stage-efficiency") problems.push(`${p.id} "${m.quantity}": restaged but metric ${m.metric}`);
    table.push({ d, p, m });
  }
}
// a row for a datum that no longer exists must be a removal
for (const d of rows) {
  if (d.action === "removed") continue;
  const p = pathwayById.get(d.pathway);
  const found = (p?.performance?.measurements ?? []).some((m) => matchRow(p, m) === d);
  if (!found) problems.push(`${d.pathway} "${d.quantity}": the row names no surviving datum and is not marked removed`);
}
if (problems.length) {
  console.error("audit-stage-route: " + problems.length + " problem(s)\n  " + problems.join("\n  "));
  process.exit(1);
}
const esc = (s) => String(s ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
const order = ["stage", "unresolved", "other-route", "population", "route"];
const all = rows.slice().sort((a, b) => order.indexOf(a.class) - order.indexOf(b.class) || a.pathway.localeCompare(b.pathway));
const tally = {};
for (const r of all) tally[r.class] = (tally[r.class] ?? 0) + 1;
const actions = {};
for (const r of all) actions[r.action] = (actions[r.action] ?? 0) + 1;
const valueOf = (d) => {
  const t = table.find((x) => x.d === d);
  if (!t) return "(removed)";
  return t.m.value_range ? `[${t.m.value_range[0]}, ${t.m.value_range[1]}] (range)` : t.m.value;
};
const metricOf = (d) => table.find((x) => x.d === d)?.m.metric ?? "—";
const lines = [];
lines.push("# Pass 45 — the stage-versus-route measurement audit (generated by tools/audit-stage-route.mjs; do not edit by hand)");
lines.push("");
lines.push(
  `Revision ${graph.meta.data_hash} · ${all.length} efficiency data on ${new Set(all.map((r) => r.pathway)).size} pathways · classes: ${Object.entries(tally)
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ")} · actions: ${Object.entries(actions)
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ")}. The denominator boundary decides, never the scope label.`,
);
lines.push("");
lines.push("Policy (from the dispositions file):");
for (const [k, v] of Object.entries(disp.policy)) lines.push(`- **${k}** — ${v}`);
lines.push("");
lines.push("| pathway | quantity | source | numerator (as read) | denominator (as read) | class | action | metric now | value now | reason |");
lines.push("|---|---|---|---|---|---|---|---|---|---|");
for (const d of all)
  lines.push(
    `| ${d.pathway.replace("pathway:", "")} | ${esc(d.quantity)} | ${d.source.replace("source:", "")} | ${esc(d.numerator)} | ${esc(d.denominator)} | ${d.class} | ${d.action} | ${metricOf(d)} | ${esc(valueOf(d))} | ${esc(d.reason)} |`,
  );
lines.push("");
const out = lines.join("\n") + "\n";
if (!check) {
  writeFileSync(join(root, "design", "reviews", "loop-3", "pass-45-audit.md"), out);
  console.log(`audit-stage-route: ${all.length} rows disposed, table written`);
} else console.log(`audit-stage-route: ${all.length} rows disposed, consistent`);
