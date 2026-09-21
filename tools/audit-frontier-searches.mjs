// Loop-3 pass 49: the frontier search-state audit (the reviewer's pass-48 findings 16–23). For every default-frontier candidate
// (class candidate, kind composition) and every other route with a reviewed route-search-v1 record, recompute the record's
// obligations from its frozen target — the mandatory engines, every mandatory decomposed key for its k phenomena, the
// conditional composite-name key (mandatory only when composition_terms is non-empty), the screening depth per engine × key with
// the segments of one run added together, and the two citation chases — and read the state the atlas can honestly claim:
// demonstration-found · protocol-complete-negative · partial/blocked, naming each outstanding engine/key/depth. A blocked attempt
// (an engine that answered 429, a captcha before the first position) counts as attempted, never as coverage — the same rule the
// loader applies. Writes design/reviews/loop-3/pass-49-frontier-search-audit.md; --check gates that every partial names at least
// one outstanding obligation (else it should have been a negative), that no stored label outruns its obligations, and that the
// report on disk matches the compiled graph.
//   node tools/audit-frontier-searches.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(fileURLToPath(import.meta.url), "..");
const root = join(here, "..");
const check = process.argv.includes("--check");
const graph = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8"));
const paths = JSON.parse(readFileSync(join(root, "data", "generated", "paths.json"), "utf8"));
const entityById = new Map(graph.entities.map((e) => [e.id, e]));
const claimById = new Map(graph.claims.map((c) => [c.id, c]));
const MANDATORY_ENGINES = ["openalex", "semantic-scholar", "google-scholar"];
const obtained = (r) => !(r.interruption && r.records_screened === 0 && r.records_retrieved === 0);
const positionsOf = (r) => {
  if (!r.positions_screened) return null;
  const out = new Set();
  for (const part of r.positions_screened.split(/[,;]/)) {
    const m = part.trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (!m) return null;
    for (let i = Number(m[1]); i <= Number(m[2]); i++) out.add(i);
  }
  return out;
};
/** The obligations of a route record, recomputed from its target — what the loader would demand of a negative. */
function obligations(s) {
  const claimSeq = s.target.claims ?? [];
  const mechanisms = [...new Set(claimSeq.flatMap((id) => [claimById.get(id)?.subject, claimById.get(id)?.object]).filter((n) => n && entityById.get(n)?.type === "phenomenon"))];
  const k = mechanisms.length;
  const required = ["driver-mechanism:1", ...Array.from({ length: Math.max(0, k - 1) }, (_, i) => `mechanism-pair:${i + 1}-${i + 2}`), "whole-chain", "demonstration-precision"];
  const compositeApplicable = s.composition_terms.length > 0;
  if (compositeApplicable) required.push("composite-name");
  const outstanding = [];
  const attempted = [];
  for (const engine of MANDATORY_ENGINES) {
    const runs = s.runs.filter((r) => r.engine === engine);
    const got = new Set(runs.filter(obtained).map((r) => r.query_key));
    const tried = new Set(runs.filter((r) => !obtained(r)).map((r) => r.query_key));
    for (const key of required) {
      if (got.has(key)) continue;
      outstanding.push(`${engine}: ${key}${tried.has(key) ? " (attempted, blocked)" : " (not run)"}`);
      if (tried.has(key)) attempted.push(`${engine}: ${key}`);
    }
  }
  const groups = new Map();
  for (const r of s.runs) {
    if (!r.query_key || !required.includes(r.query_key) || !obtained(r) || !MANDATORY_ENGINES.includes(r.engine)) continue;
    const g = `${r.engine}|${r.query_key}`;
    groups.set(g, [...(groups.get(g) ?? []), r]);
  }
  for (const [g, rs] of groups) {
    const due = Math.min(100, Math.max(...rs.map((r) => r.result_count_reported ?? r.records_retrieved)));
    const sets = rs.map(positionsOf);
    const screened = sets.every((x) => x) ? new Set(sets.flatMap((x) => [...x])).size : rs.reduce((n, r) => n + r.records_screened, 0);
    if (screened < due) outstanding.push(`${g.replace("|", ": ")} screened ${screened} of ${due}`);
  }
  const chases = s.runs.filter((r) => r.query_form === "citation-chase").length;
  if (chases < 2) outstanding.push(`citation chases: ${chases} of 2`);
  const blockedRuns = s.runs.filter((r) => !obtained(r));
  const qualifies = s.hits.some((h) => h.decision === "qualifies");
  const state = qualifies && s.result === "demonstration-found" ? "demonstration-found" : outstanding.length === 0 && s.result === "no-demonstration-found" ? "protocol-complete-negative" : "partial/blocked";
  return { k, required, compositeApplicable, outstanding, attempted, blockedRuns, chases, state, qualifies };
}

const frontier = paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition");
const records = graph.searches.filter((s) => s.target.kind === "path");
const rows = [];
for (const r of frontier) {
  const recs = records.filter((s) => s.target.path === r.id);
  if (!recs.length) { rows.push({ route: r, rec: null }); continue; }
  for (const s of recs) rows.push({ route: r, rec: s, ob: obligations(s) });
}
for (const s of records) if (!frontier.some((r) => r.id === s.target.path)) rows.push({ route: paths.find((p) => p.id === s.target.path) ?? { id: s.target.path, frontier_class: "?", structural_kind: "?" }, rec: s, ob: obligations(s), extra: true });

const problems = [];
for (const x of rows) {
  if (!x.rec) { problems.push(`${x.route.id}: a default-frontier candidate with no reviewed route record`); continue; }
  const { ob, rec } = x;
  if (rec.result === "no-demonstration-found" && ob.outstanding.length) problems.push(`${rec.id}: claims a negative with outstanding obligations: ${ob.outstanding.join("; ")}`);
  if (rec.result === "inconclusive" && ob.outstanding.length === 0 && !ob.qualifies) problems.push(`${rec.id}: every obligation is met but the record is inconclusive — it should be reviewed as a negative`);
  if (rec.result === "demonstration-found" && !ob.qualifies) problems.push(`${rec.id}: demonstration-found without a qualifying hit`);
  for (const r of rec.runs) if (!obtained(r) && r.result_count_reported === 0) problems.push(`${rec.id}: ${r.id} is blocked yet records an empty result`);
}

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const byState = (st) => rows.filter((x) => x.ob?.state === st && !x.extra).length;
const lines = [];
lines.push("# Pass 49 — the frontier search-state audit (generated by tools/audit-frontier-searches.mjs; do not edit by hand)");
lines.push("");
lines.push(`Revision ${graph.meta.data_hash} · ${frontier.length} default-frontier candidates (class candidate, kind composition) · ${records.length} reviewed route-search-v1 records. Each record's obligations are recomputed from its target: the three mandatory engines × every mandatory key for its k phenomena (driver-mechanism:1, mechanism-pair:i-j, whole-chain, demonstration-precision; composite-name only when a source-backed composition term is frozen), screening to min(100, reported) per engine × key with the segments of one run added together, and two citation chases. A blocked attempt (HTTP 429; a captcha before the first position) is attempted, never coverage. States over the default frontier: demonstration-found ${byState("demonstration-found")} · protocol-complete-negative ${byState("protocol-complete-negative")} · partial/blocked ${byState("partial/blocked")}.`);
lines.push("");
lines.push("| route | class / kind | record | k | composite-name | result · completeness | state (recomputed) | blocked attempts | outstanding obligations |");
lines.push("|---|---|---|---|---|---|---|---|---|");
for (const x of rows.sort((a, b) => (a.extra ? 1 : 0) - (b.extra ? 1 : 0) || a.route.id.localeCompare(b.route.id))) {
  if (!x.rec) { lines.push(`| ${x.route.id} | ${x.route.frontier_class} / ${x.route.structural_kind} | — | | | | no reviewed record | | |`); continue; }
  const { rec, ob } = x;
  lines.push(`| ${x.route.id}${x.extra ? " (not on the default frontier)" : ""} | ${x.route.frontier_class} / ${x.route.structural_kind} | ${rec.id.replace("search:", "")} | ${ob.k} | ${ob.compositeApplicable ? "mandatory (" + rec.composition_terms.length + " term(s))" : "not applicable (no source-backed term)"} | ${rec.result} · ${rec.completeness} | ${ob.state} | ${ob.blockedRuns.length ? ob.blockedRuns.map((r) => `${r.engine} ${r.query_key ?? r.query_form}`).join("; ") : "none"} | ${esc(ob.outstanding.join("; ") || "none")} |`);
}
lines.push("");
lines.push("Reading the table: a partial names what still has to run before the atlas may say no demonstration was found — an engine that has not answered, a key never run, a depth not reached, a chase not made. Nothing here is a statement about nature: search-incomplete is exactly what the atlas knows, and no-demonstration-found is reserved for a record whose every obligation is met. The blockers on 21/09/2026 are the same on every route: Semantic Scholar's anonymous pool throttles the first request (the key is owner exception e953) and Google Scholar serves its bot check at the first page load, which the lane never completes.");
const out = lines.join("\n") + "\n";
const file = join(root, "design", "reviews", "loop-3", "pass-49-frontier-search-audit.md");
if (check) {
  if (!existsSync(file)) problems.push("the report file does not exist — run without --check");
  else if (readFileSync(file, "utf8") !== out) problems.push("the report on disk differs from the compiled graph — run without --check and commit the result");
}
if (problems.length) {
  console.error("audit-frontier-searches: " + problems.length + " problem(s)\n  " + problems.join("\n  "));
  process.exit(1);
}
const summary = `${frontier.length} candidates · ${records.length} records · found ${byState("demonstration-found")} · negative ${byState("protocol-complete-negative")} · partial ${byState("partial/blocked")}`;
if (!check) {
  writeFileSync(file, out);
  console.log(`audit-frontier-searches: ${summary} — report written`);
} else console.log(`audit-frontier-searches: ${summary} — consistent`);
