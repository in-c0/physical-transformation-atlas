// Loop-3 pass 42: the theoretical_limit retirement as a deterministic table. Joins design/reviews/loop-3/pass-42-dispositions.yaml
// to the compiled graph and writes design/reviews/loop-3/pass-42-audit.md — the reviewer's map (pathway | old text | typed
// constraint already reachable? | proposed constraint | migration class | evidence | bound result before → after). Fails when a
// theoretical_limit key survives in the canonical pathway files, when a row's class contradicts the data (a typed row whose
// constraint is not reachable on the pathway's route, a noted row without a note), or when a route's thermodynamic-bound result
// moved although the row says nothing was added (the reviewer's finding 37: a changed result marks a limit that lived only in
// prose). Run after `pnpm build:graph`:
//   node tools/audit-limits.mjs [--check]     (--check writes nothing, only gates)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = resolve(fileURLToPath(import.meta.url), "..");
const root = join(here, "..");
const check = process.argv.includes("--check");
const graph = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8"));
const disp = parse(readFileSync(join(root, "design", "reviews", "loop-3", "pass-42-dispositions.yaml"), "utf8"));
const CLASSES = new Set(["already-typed", "generic-bound-missing", "pathway-specific-bound", "not-a-bound"]);
const ACTIONS = new Set(["removed", "noted", "typed"]);

const pathwayById = new Map(graph.pathways.map((p) => [p.id, p]));
const entityById = new Map(graph.entities.map((e) => [e.id, e]));
const claimById = new Map(graph.claims.map((c) => [c.id, c]));
const sourceById = new Map(graph.sources.map((s) => [s.id, s]));
const paths = JSON.parse(readFileSync(join(root, "data", "generated", "paths.json"), "utf8"));
const routeOf = new Map(paths.filter((p) => p.pathway).map((p) => [p.pathway, p]));
const boundedBy = new Map();
for (const c of graph.claims) {
  if (c.predicate !== "bounded_by") continue;
  boundedBy.set(c.subject, [...(boundedBy.get(c.subject) ?? []), c]);
}
const reachable = (route, exceptClaim) => {
  const out = new Map();
  for (const n of route?.nodes ?? []) for (const c of boundedBy.get(n) ?? []) if (c.id !== exceptClaim) out.set(c.object, c.id);
  return out;
};
const problems = [];
// 1. No prose limit survives in the canonical files (comments excepted).
const pathwaysDir = join(root, "data", "canonical", "pathways");
for (const f of readdirSync(pathwaysDir)) {
  if (!f.endsWith(".yaml")) continue;
  const text = readFileSync(join(pathwaysDir, f), "utf8");
  if (/^\s*theoretical_limit:/m.test(text)) problems.push(`data/canonical/pathways/${f}: a theoretical_limit key survives`);
}
for (const p of graph.pathways) if (p.performance && "theoretical_limit" in p.performance) problems.push(`${p.id}: compiled pathway still carries theoretical_limit`);
// 2. One disposition per row, each consistent with the data.
const seen = new Set();
const rows = [];
for (const d of disp.dispositions) {
  if (seen.has(d.pathway)) problems.push(`${d.pathway}: disposed twice`);
  seen.add(d.pathway);
  const p = pathwayById.get(d.pathway);
  if (!p) { problems.push(`${d.pathway}: unknown pathway`); continue; }
  if (d.field !== "theoretical_limit") problems.push(`${d.pathway}: field ${d.field} is not theoretical_limit`);
  if (!CLASSES.has(d.disposition)) problems.push(`${d.pathway}: unknown class ${d.disposition}`);
  if (!ACTIONS.has(d.action)) problems.push(`${d.pathway}: unknown action ${d.action}`);
  if (typeof d.was !== "string" || !d.was) problems.push(`${d.pathway}: no \`was\` text`);
  const route = routeOf.get(d.pathway);
  if (!route) problems.push(`${d.pathway}: no compiled route`);
  const bound = route?.checks.find((k) => k.id === "thermodynamic-bound");
  const before = d.bound_before;
  const after = bound?.result;
  const pool = reachable(route, d.claim);
  const now = reachable(route);
  let proposed = "—";
  let claim = null;
  if (d.action === "typed") {
    if (d.disposition !== "generic-bound-missing" && d.disposition !== "pathway-specific-bound") problems.push(`${d.pathway}: typed action on class ${d.disposition}`);
    const e = entityById.get(d.constraint);
    if (!e || e.type !== "constraint") problems.push(`${d.pathway}: proposed constraint ${d.constraint} is not a constraint entity`);
    if (d.disposition === "generic-bound-missing") {
      claim = claimById.get(d.claim);
      if (!claim) problems.push(`${d.pathway}: claim ${d.claim} does not exist`);
      else if (claim.object !== d.constraint) problems.push(`${d.pathway}: ${d.claim} names ${claim.object}, not ${d.constraint}`);
      else if (claim.predicate !== "bounded_by") problems.push(`${d.pathway}: ${d.claim} is ${claim.predicate}, not bounded_by`);
      if (!now.has(d.constraint)) problems.push(`${d.pathway}: ${d.constraint} is not reachable on route ${route?.id} after the addition`);
      if (pool.has(d.constraint)) problems.push(`${d.pathway}: ${d.constraint} was already reachable through ${pool.get(d.constraint)} — the row is already-typed, not generic-bound-missing`);
    } else {
      if (!(p.bounds ?? []).some((b) => b.constraint === d.constraint)) problems.push(`${d.pathway}: bounds[] does not name ${d.constraint}`);
    }
    proposed = d.constraint + (claim ? ` via ${claim.id}` : " via bounds[]");
  } else {
    if (d.constraint || d.claim) problems.push(`${d.pathway}: a ${d.action} row names a constraint or claim`);
    if (d.action === "noted" && !(p.performance?.notes ?? "").trim()) problems.push(`${d.pathway}: disposed as noted but performance.notes is empty`);
    if (before !== after) problems.push(`${d.pathway}: thermodynamic-bound result moved ${before} → ${after} although nothing was typed for it — a limit lived only in prose (finding 37)`);
  }
  rows.push({ d, p, route, before, after, pool, now, proposed, claim });
}
for (const p of graph.pathways) if (!seen.has(p.id) && p.performance && "theoretical_limit" in p.performance) problems.push(`${p.id}: a theoretical_limit with no disposition`);
if (problems.length) {
  console.error("audit-limits: " + problems.length + " problem(s)\n  " + problems.join("\n  "));
  process.exit(1);
}

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const order = ["generic-bound-missing", "pathway-specific-bound", "already-typed", "not-a-bound"];
rows.sort((a, b) => order.indexOf(a.d.disposition) - order.indexOf(b.d.disposition) || a.d.pathway.localeCompare(b.d.pathway));
const tally = {};
for (const r of rows) tally[r.d.disposition] = (tally[r.d.disposition] ?? 0) + 1;
const actions = {};
for (const r of rows) actions[r.d.action] = (actions[r.d.action] ?? 0) + 1;
const evidenceOf = (r) => {
  if (r.claim) return r.claim.evidence.map((id) => `${id.replace("source:", "")} (${sourceById.get(id)?.type ?? "?"})`).join(", ");
  if (r.d.action === "typed") return (r.p.bounds ?? []).flatMap((b) => b.evidence).map((id) => id.replace("source:", "")).join(", ");
  return "—";
};
const reachableText = (r) => {
  const ids = [...r.pool.keys()];
  return ids.length ? ids.map((id) => id.replace("constraint:", "")).join(", ") : "none";
};
const lines = [];
lines.push("# Pass 42 — the theoretical_limit retirement (generated by tools/audit-limits.mjs; do not edit by hand)");
lines.push("");
lines.push(
  `Revision ${graph.meta.data_hash} · ${rows.length} prose rows on ${rows.length} pathways · classes: ${Object.entries(tally)
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ")} · actions: ${Object.entries(actions)
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ")}. No pathway carries a theoretical_limit; the performance object is strict.`,
);
lines.push("");
lines.push("Policy (from the dispositions file):");
for (const [k, v] of Object.entries(disp.policy)) lines.push(`- **${k}** — ${v}`);
lines.push("");
lines.push("| pathway | old text | typed constraint already reachable at audit | proposed constraint | migration class | action | evidence | bound result before → after | reason |");
lines.push("|---|---|---|---|---|---|---|---|---|");
for (const r of rows)
  lines.push(
    `| ${r.d.pathway.replace("pathway:", "")} | "${esc(r.d.was)}" | ${esc(reachableText(r))} | ${esc(r.proposed)} | ${r.d.disposition} | ${r.d.action} | ${esc(evidenceOf(r))} | ${r.before} → ${r.after} | ${esc(r.d.reason)} |`,
  );
lines.push("");
lines.push(
  "Columns: *typed constraint already reachable at audit* lists the constraints a bounded_by claim on one of the route's entities reached before this pass (for a typed row, excluding the claim the pass added); *proposed constraint* is what the pass typed and through which claim or bounds[] entry; *bound result before → after* is the route's thermodynamic-bound result at revision ca0172056e74 and now — the gate requires it unchanged wherever nothing was typed.",
);
const out = lines.join("\n") + "\n";
if (!check) {
  writeFileSync(join(root, "design", "reviews", "loop-3", "pass-42-audit.md"), out);
  console.log(`audit-limits: ${rows.length} rows disposed, table written`);
} else console.log(`audit-limits: ${rows.length} rows disposed, consistent`);
