// Loop-3 pass 50: the whole-atlas scientific closure audit (the reviewer's pass-49 findings 6–29). Three products from one
// computation over the compiled atlas and the existing audits:
//   1. the INVARIANTS, regenerated (never inspected): the evidence-model rule on every claim; every demonstrated route's own
//      composition evidence; unresolved regime and handoff requirements on demonstrated routes; the scalar / range invariant and a
//      range never a scalar best; a benchmark never among the constraints that decided a thermodynamic-bound result; variant
//      parent-step equality and exclusion from route, frontier and matrix counts; system handoffs; frontier classification counts;
//      the retired legacy performance keys; the sibling audit gates (performance, limits, stage-versus-route, stage-omission,
//      electrical form, frontier search state) re-run; the v0.5.0 export validation over the built site; and a targeted lint of the
//      built pages for absolute phrases on surfaces whose backing state is not decisive;
//   2. the RESIDUAL collection — every open uncertainty in a current record, normalised, deterministic ids, a small kind
//      vocabulary, derived from the atlas (incomplete reviewed searches with their recomputed obligations; unread hits; reported
//      and theory-only claims; the observed pathway) plus the two measurement items that need human words (pass-50-curated.yaml,
//      each verified against the record so a resolved item fails the gate instead of lingering) — written once to
//      data/generated/residuals.json (and the web app's copy), served as /api/residuals.json and rendered into the report;
//   3. the closure REPORT design/reviews/loop-3/pass-50-closure.md — the invariants, CURRENT RESIDUALS and DEFERRED WORK.
// --check recomputes everything and fails on any invariant violation, any residual whose record is missing, any curated item whose
// record no longer has the property that made it a residual, a collection or report on disk that differs, or a built endpoint
// whose data differs from the collection. --collection <path> and --curated <path> exist for the suite's negative controls.
//   node tools/audit-closure.mjs [--check] [--collection <file>] [--curated <file>] [--no-site]
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";

const here = resolve(fileURLToPath(import.meta.url), "..");
const root = join(here, "..");
const argv = process.argv.slice(2);
const check = argv.includes("--check");
const noSite = argv.includes("--no-site");
const arg = (k) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : undefined);
const collectionFile = arg("--collection") ?? join(root, "data", "generated", "residuals.json");
const curatedFile = arg("--curated") ?? join(root, "design", "reviews", "loop-3", "pass-50-curated.yaml");
const graph = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8"));
const paths = JSON.parse(readFileSync(join(root, "data", "generated", "paths.json"), "utf8"));
const curated = parse(readFileSync(curatedFile, "utf8"));
const entityById = new Map(graph.entities.map((e) => [e.id, e]));
const claimById = new Map(graph.claims.map((c) => [c.id, c]));
const sourceById = new Map(graph.sources.map((s) => [s.id, s]));
const pathwayById = new Map(graph.pathways.map((p) => [p.id, p]));
const routeOfPathway = new Map(paths.filter((p) => p.pathway).map((p) => [p.pathway, p.id]));
for (const p of paths) for (const v of p.variants ?? []) routeOfPathway.set(v.pathway, p.id);
const SITE = "https://physical-transformation-atlas.wldud5192.workers.dev";
const DEMONSTRATED = new Set(["demonstrated", "prototype", "commercial"]);
const HARD = new Set(["upper-bound", "formula-bound"]);
const problems = [];
const invariants = [];
const inv = (name, violations, note) => {
  invariants.push({ name, ok: violations.length === 0, count: violations.length, note, violations: violations.slice(0, 12) });
  for (const v of violations) problems.push(`${name}: ${v}`);
};

// 1. Invariants ----------------------------------------------------------------------------------------------------------------
{
  // evidence-model rule
  const firstAuthor = (id) => (sourceById.get(id)?.authors?.[0] ?? id).split(",")[0].trim().toLowerCase();
  const v = [];
  for (const c of graph.claims) {
    const groups = new Set(c.evidence.map(firstAuthor));
    const reviewOrBook = c.evidence.some((e) => ["review", "book"].includes(sourceById.get(e)?.type ?? ""));
    if (c.status === "replicated" && groups.size < 2) v.push(`${c.id}: replicated with ${groups.size} group`);
    if (c.status === "established" && groups.size < 2 && !reviewOrBook) v.push(`${c.id}: established on one primary source`);
    for (const e of c.evidence) if (!sourceById.has(e)) v.push(`${c.id}: unknown source ${e}`);
  }
  inv("evidence-status derivation", v, `${graph.claims.length} claims: ${Object.entries(graph.claims.reduce((m, c) => ((m[c.status] = (m[c.status] ?? 0) + 1), m), {})).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
}
{
  // demonstrated routes' composition evidence
  const v = [];
  const dem = paths.filter((p) => p.search_status === "demonstrated");
  for (const p of dem) {
    const pw = p.pathway ? pathwayById.get(p.pathway) : undefined;
    if (!pw) { v.push(`${p.id}: demonstrated without a recorded pathway`); continue; }
    if (!DEMONSTRATED.has(pw.status)) v.push(`${p.id}: pathway ${pw.id} has status ${pw.status}`);
    const sources = new Set([...pw.evidence, ...(pw.performance?.measurements ?? []).flatMap((m) => m.sources)]);
    if (sources.size === 0) v.push(`${p.id}: pathway ${pw.id} cites no source`);
    if (p.composition_source_ids.length === 0) v.push(`${p.id}: no composition source on the route`);
  }
  for (const p of paths) if (!p.pathway && p.composition_source_ids.length) v.push(`${p.id}: composition sources without a recorded pathway`);
  inv("demonstrated-route composition evidence", v, `${dem.length} demonstrated routes, each with its own pathway and sources`);
}
{
  // regime and handoff requirements on demonstrated routes; interfaces
  const v = [];
  const dem = paths.filter((p) => p.search_status === "demonstrated");
  for (const p of dem) {
    const regime = p.checks.find((k) => k.id === "driver-regime-sufficiency");
    if (regime?.result === "unresolved" || regime?.result === "fail") v.push(`${p.id} (${p.pathway}): regime ${regime.result}`);
    if (p.handoff_unresolved_count > 0) v.push(`${p.id} (${p.pathway}): ${p.handoff_unresolved_count} unresolved handoff(s)`);
    const bc = p.checks.find((k) => k.id === "boundary-compatibility");
    if (bc?.result === "fail") v.push(`${p.id} (${p.pathway}): boundary fail`);
  }
  const regimes = dem.reduce((m, p) => { const r = p.checks.find((k) => k.id === "driver-regime-sufficiency").result; m[r] = (m[r] ?? 0) + 1; return m; }, {});
  inv("regime and handoff requirements on demonstrated routes", v, `regime ${Object.entries(regimes).map(([k, n]) => `${k} ${n}`).join(" · ")}; handoffs unresolved on ${dem.filter((p) => p.handoff_unresolved_count > 0).length}`);
}
{
  // scalar / range; a range never a best
  const v = [];
  const PHYSICAL = new Set(["laboratory", "device", "module", "system", "plant", "field"]);
  let ranges = 0;
  for (const pw of graph.pathways) {
    const ms = pw.performance?.measurements ?? [];
    for (const m of ms) {
      if (m.value_range !== undefined && m.value_numeric !== undefined) v.push(`${pw.id} "${m.quantity}": both value_numeric and value_range`);
      if (m.value_range !== undefined) { ranges++; if (m.value_range[0] > m.value_range[1]) v.push(`${pw.id} "${m.quantity}": range not [low, high]`); }
    }
    const best = ms.filter((m) => m.metric === "conversion-efficiency" && m.value_numeric !== undefined && PHYSICAL.has(m.scope)).sort((a, b) => b.value_numeric - a.value_numeric)[0];
    for (const m of ms) if (m.value_range && best && (best.value_numeric === m.value_range[0] || best.value_numeric === m.value_range[1]) && best.quantity === m.quantity) v.push(`${pw.id}: the best efficiency is an end of a range`);
  }
  inv("scalar / range invariant", v, `${ranges} range datum(s); a range is never a best`);
}
{
  // decisive vs nondecisive constraints in bound results
  const v = [];
  const nonHard = graph.entities.filter((e) => e.type === "constraint" && !HARD.has(e.constraint_kind ?? ""));
  for (const p of paths) {
    const k = p.checks.find((x) => x.id === "thermodynamic-bound");
    if (!k || (k.result !== "pass" && k.result !== "fail")) continue;
    for (const c of nonHard) {
      const re = new RegExp(`(≤|>|exceeds|above|within)\\s+${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(`);
      if (re.test(k.detail)) v.push(`${p.id}: ${c.constraint_kind} "${c.name}" appears as a deciding comparison`);
    }
  }
  const kinds = graph.entities.filter((e) => e.type === "constraint").reduce((m, e) => ((m[e.constraint_kind ?? "?"] = (m[e.constraint_kind ?? "?"] ?? 0) + 1), m), {});
  inv("decisive vs nondecisive constraints", v, `constraints: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(" · ")}; bound results on routes: ${Object.entries(paths.reduce((m, p) => { const r = p.checks.find((x) => x.id === "thermodynamic-bound").result; m[r] = (m[r] ?? 0) + 1; return m; }, {})).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
}
{
  // variants
  const v = [];
  const variants = graph.pathways.filter((p) => p.variant_of);
  for (const vp of variants) {
    const parent = pathwayById.get(vp.variant_of);
    if (!parent) { v.push(`${vp.id}: parent missing`); continue; }
    if (parent.variant_of) v.push(`${vp.id}: parent is itself a variant`);
    if (parent.steps.join(">") !== vp.steps.join(">")) v.push(`${vp.id}: steps differ from the parent's`);
    if (paths.some((p) => p.pathway === vp.id)) v.push(`${vp.id}: a route names the variant as its pathway`);
    const carrying = paths.filter((p) => (p.variants ?? []).some((x) => x.pathway === vp.id));
    if (carrying.length !== 1) v.push(`${vp.id}: carried by ${carrying.length} routes`);
  }
  const demonstratedCount = paths.filter((p) => p.search_status === "demonstrated").length;
  if (demonstratedCount !== graph.meta.counts.routes_demonstrated && graph.meta.counts.routes_demonstrated !== undefined) v.push(`demonstrated route count ${demonstratedCount} ≠ meta ${graph.meta.counts.routes_demonstrated}`);
  inv("variant isolation", v, `${variants.length} variant(s), each on exactly one route as a variant and never as the route's pathway`);
}
{
  // systems
  const v = [];
  for (const s of graph.systems ?? []) {
    for (const h of s.handoffs) if (!h.status) v.push(`${s.id}: a handoff without status`);
    for (const m of s.members) if (!routeOfPathway.has(m.pathway)) v.push(`${s.id}: member ${m.pathway} has no route`);
  }
  inv("system handoffs", v, (graph.systems ?? []).map((s) => `${s.id.replace("system-pathway:", "")}: ${s.handoffs.map((h) => h.status).join(", ")}`).join("; "));
}
{
  // retired performance keys
  const v = [];
  for (const pw of graph.pathways) for (const k of ["efficiency_typical", "power_density", "efficiency_record", "theoretical_limit"]) if (pw.performance && k in pw.performance) v.push(`${pw.id}: ${k} present`);
  inv("retired legacy performance keys", v, "none of efficiency_typical, power_density, efficiency_record, theoretical_limit is written");
}
{
  // frontier classification counts
  const classes = paths.reduce((m, p) => ((m[p.frontier_class] = (m[p.frontier_class] ?? 0) + 1), m), {});
  inv("frontier classification", [], `${paths.length} routes: ${Object.entries(classes).map(([k, n]) => `${k} ${n}`).join(" · ")}; default frontier ${paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition").length}`);
}
{
  // sibling gates
  const gates = [
    ["audit-performance.mjs", ["--check"]],
    ["audit-performance.mjs", ["--pass", "37", "--check"]],
    ["audit-limits.mjs", ["--check"]],
    ["audit-stage-route.mjs", ["--check"]],
    ["audit-stage-omission.mjs", ["--check"]],
    ["audit-electrical-form.mjs", ["--check"]],
    ["audit-frontier-searches.mjs", ["--check"]],
  ];
  const v = [];
  const notes = [];
  for (const [tool, args] of gates) {
    const r = spawnSync(process.execPath, [join(root, "tools", tool), ...args], { encoding: "utf8" });
    if (r.status !== 0) v.push(`${tool} ${args.join(" ")}: ${(r.stderr || r.stdout).trim().split("\n")[0]}`);
    else notes.push((r.stdout.trim().split("\n").pop() ?? "").replace(/ — consistent$/, ""));
  }
  inv("sibling audit gates", v, notes.join(" | "));
}
{
  // export validation and the public-wording lint over the built site
  const out = join(root, "apps", "web", "out");
  const v = [];
  let note = "skipped (--no-site)";
  if (!noSite) {
    if (!existsSync(join(out, "api", "stats.json"))) v.push("the site is not built (apps/web/out missing)");
    else {
      const r = spawnSync(process.execPath, [join(root, "tools", "validate-exports.mjs")], { encoding: "utf8" });
      if (r.status !== 0) v.push(`validate-exports: ${(r.stderr || r.stdout).trim().split("\n").pop()}`);
      const stats = JSON.parse(readFileSync(join(out, "api", "stats.json"), "utf8"));
      if (stats.meta.data_hash !== graph.meta.data_hash) v.push(`the built site is at ${stats.meta.data_hash}, the graph at ${graph.meta.data_hash}`);
      // the lint: absolute phrases on pages whose backing state is not decisive; allowlisted contexts are explanations of the rule itself
      const PHRASES = [
        { re: /no demonstration found/i, allow: [/^\/(methods|coverage)/], ctx: [/only a reviewed record can say/i, /may produce/i] },
        { re: /\bimpossible\b/i, allow: [/^\/methods/], ctx: [/rather than declaring it impossible/i, /never\s+["“']impossible/i] },
        { re: /no such device/i, allow: [/^\/methods/], ctx: [/none of those states means/i] },
        { re: /no demonstration exists/i, allow: [], ctx: [] },
        { re: /has never been demonstrated/i, allow: [], ctx: [] },
        { re: /proven impossible/i, allow: [], ctx: [] },
        { re: /cannot exist/i, allow: [], ctx: [] },
        { re: /maximum efficiency is/i, allow: [/^\/source\//, /^\/e\/constraint\//], ctx: [] },
      ];
      const negatives = new Set(graph.searches.filter((s) => s.result === "no-demonstration-found").map((s) => (s.target.kind === "path" ? `/path/${s.target.path.slice(2)}` : `/matrix`)));
      const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : []; });
      let pages = 0, hits = 0;
      for (const file of walk(out)) {
        pages++;
        const rel = "/" + file.slice(out.length + 1).replace(/\\/g, "/").replace(/\.html$/, "").replace(/\/index$/, "");
        const html = readFileSync(file, "utf8");
        const main = (html.match(/<main[\s\S]*?<\/main>/) ?? [html])[0];
        const text = main.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ");
        for (const ph of PHRASES) {
          if (ph.allow.some((a) => a.test(rel))) continue;
          if (ph.re.source.includes("no demonstration found") && negatives.has(rel)) continue;
          let m;
          const re = new RegExp(ph.re.source, "gi");
          while ((m = re.exec(text))) {
            const ctx = text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 60);
            if (ph.ctx.some((c) => c.test(ctx))) continue;
            hits++;
            v.push(`${rel}: "${m[0]}" — …${ctx.trim()}…`);
          }
        }
      }
      note = `exports valid at r${graph.meta.data_hash}; lint over ${pages} built pages, ${hits} absolute phrase(s) outside allowlisted contexts`;
    }
  }
  inv("export validation and public-wording lint", v, note);
}

// 2. Residuals -----------------------------------------------------------------------------------------------------------------
const residuals = [];
const push = (r) => residuals.push({ id: r.id, kind: r.kind, record_type: r.record_type, record_id: r.record_id, statement: r.statement, why_unresolved: r.why, what_exists: r.exists, closure_condition: r.closure, related_ids: r.related ?? [], public_url: r.url ?? null, on_default_frontier: r.frontier ?? false });
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// 2a. incomplete reviewed searches, obligations recomputed (the loader's rule; the pass-49 audit's arithmetic)
const MANDATORY_ENGINES = ["openalex", "semantic-scholar", "google-scholar"];
const MANDATORY_FORMS = ["driver-family", "driver-phenomenon", "demonstration-precision"];
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
function routeObligations(s) {
  const claimSeq = s.target.claims ?? [];
  const k = [...new Set(claimSeq.flatMap((id) => [claimById.get(id)?.subject, claimById.get(id)?.object]).filter((n) => n && entityById.get(n)?.type === "phenomenon"))].length;
  const required = ["driver-mechanism:1", ...Array.from({ length: Math.max(0, k - 1) }, (_, i) => `mechanism-pair:${i + 1}-${i + 2}`), "whole-chain", "demonstration-precision"];
  if (s.composition_terms.length > 0) required.push("composite-name");
  const outstanding = [];
  for (const engine of MANDATORY_ENGINES) {
    const runs = s.runs.filter((r) => r.engine === engine);
    const got = new Set(runs.filter(obtained).map((r) => r.query_key));
    const tried = new Set(runs.filter((r) => !obtained(r)).map((r) => r.query_key));
    for (const key of required) if (!got.has(key)) outstanding.push(`${engine} ${key}${tried.has(key) ? " (attempted, blocked)" : ""}`);
  }
  const groups = new Map();
  for (const r of s.runs) {
    if (!r.query_key || !required.includes(r.query_key) || !obtained(r) || !MANDATORY_ENGINES.includes(r.engine)) continue;
    groups.set(`${r.engine} ${r.query_key}`, [...(groups.get(`${r.engine} ${r.query_key}`) ?? []), r]);
  }
  for (const [g, rs] of groups) {
    const due = Math.min(100, Math.max(...rs.map((r) => r.result_count_reported ?? r.records_retrieved)));
    const sets = rs.map(positionsOf);
    const screened = sets.every((x) => x) ? new Set(sets.flatMap((x) => [...x])).size : rs.reduce((n, r) => n + r.records_screened, 0);
    if (screened < due) outstanding.push(`${g} screened ${screened} of ${due}`);
  }
  const chases = s.runs.filter((r) => r.query_form === "citation-chase").length;
  if (chases < 2) outstanding.push(`citation chases ${chases} of 2`);
  return outstanding;
}
function cellObligations(s) {
  const engines = new Set(s.runs.filter(obtained).map((r) => r.engine));
  const forms = new Set(s.runs.filter(obtained).map((r) => r.query_form));
  return [...MANDATORY_ENGINES.filter((e) => !engines.has(e)).map((e) => `engine ${e}`), ...MANDATORY_FORMS.filter((f) => !forms.has(f)).map((f) => `form ${f}`)];
}
const frontierIds = new Set(paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition").map((p) => p.id));
for (const s of graph.searches) {
  if (s.result !== "inconclusive") continue;
  const isRoute = s.target.kind === "path";
  const outstanding = isRoute ? routeObligations(s) : cellObligations(s);
  if (outstanding.length === 0) { problems.push(`${s.id}: inconclusive with every obligation met — review it as a negative or a positive`); continue; }
  const route = isRoute ? paths.find((p) => p.id === s.target.path) : null;
  const label = isRoute ? (route ? route.nodes.map((n) => entityById.get(n)?.name ?? n).join(" → ") : s.target.path) : `${entityById.get(s.target.row)?.name ?? s.target.row} × ${entityById.get(s.target.col)?.name ?? s.target.col}`;
  const blocked = s.runs.filter((r) => !obtained(r));
  push({
    id: `residual:search-incomplete:${s.id.replace("search:", "")}`,
    kind: "search-incomplete",
    record_type: "search",
    record_id: s.id,
    statement: `The reviewed ${isRoute ? "exact-composition" : "cell"} search for ${label} is inconclusive (${s.completeness}): the atlas does not know whether a demonstration exists, and may not say that none was found.`,
    why: `Outstanding ${isRoute ? "route-search-v1" : "protocol"} obligations: ${outstanding.join("; ")}.${blocked.length ? ` ${blocked.length} attempt(s) obtained no result list (a throttle or a bot check before the first position) and count toward nothing.` : ""}`,
    exists: `${s.runs.filter(obtained).length} completed run(s) on ${[...new Set(s.runs.filter(obtained).map((r) => r.engine))].join(", ")}; ${s.screening.unique_records} unique works screened, ${s.screening.full_text_read} read in full; ${s.hits.length} decided hit(s); reviewed ${s.reviewed_on}.`,
    closure: `Complete the named obligations${isRoute ? " (every mandatory engine × key to the protocol depth, the conditional composite-name form where a term is frozen, two citation chases)" : ""}, then review the record into demonstration-found or no-demonstration-found.`,
    related: [...new Set(s.hits.map((h) => h.doi).filter(Boolean))].slice(0, 12),
    url: isRoute ? `${SITE}/path/${s.target.path.slice(2)}` : `${SITE}/matrix`,
    frontier: isRoute && frontierIds.has(s.target.path),
  });
}
// 2b. unread hits: a decision the search could not make
for (const s of graph.searches)
  for (const h of s.hits.filter((x) => x.decision === "insufficient-information")) {
    const key = h.doi ?? slug(h.title).slice(0, 60);
    push({
      id: `residual:source-read-pending:${s.id.replace("search:", "")}:${slug(key)}`,
      kind: "source-read-pending",
      record_type: "search-hit",
      record_id: `${s.id} · ${h.doi ?? h.title}`,
      statement: `"${h.title}"${h.year ? ` (${h.year})` : ""} could not be decided for the search ${s.id}: the text available was insufficient to say whether it demonstrates the composition.`,
      // The hit's reason carries the science; a clause about who will fetch the text is workstation history, not atlas uncertainty.
      why: (h.reason ?? "no abstract or full text available at review time").split(/(?<=[.;])\s+/).filter((x) => !/owner|exception|api key/i.test(x)).join(" ").replace(/\s+—\s*$/, ""),
      exists: `Decision insufficient-information${h.access ? `; access: ${h.access}` : ""}${h.doi ? `; doi:${h.doi}` : ""}.`,
      closure: "Read the full text and decide the hit (qualifies / a stated exclusion), then reconsider the record's result.",
      related: h.doi ? [h.doi] : [],
      url: s.target.kind === "path" ? `${SITE}/path/${s.target.path.slice(2)}` : `${SITE}/matrix`,
      frontier: s.target.kind === "path" && frontierIds.has(s.target.path),
    });
  }
// 2c. claims whose evidence is a single source or theory only
for (const c of graph.claims) {
  if (!["reported", "theoretically-predicted", "hypothesised"].includes(c.status)) continue;
  const single = c.status === "reported";
  const subject = entityById.get(c.subject)?.name ?? c.subject;
  const object = entityById.get(c.object)?.name ?? c.object;
  push({
    id: `residual:${single ? "evidence-single-source" : "evidence-not-observed"}:${c.id.replace("claim:", "")}`,
    kind: single ? "evidence-single-source" : "evidence-not-observed",
    record_type: "claim",
    record_id: c.id,
    statement: `${subject} —${c.predicate.replace(/_/g, " ")}→ ${object} is ${c.status}: ${single ? "a single paper reports it and no independent confirmation is recorded" : c.status === "theoretically-predicted" ? "predicted by theory, not yet observed" : "proposed without a supporting calculation"}.`,
    why: single ? `Evidence: ${c.evidence.join(", ")} — one group, no review or book.` : `Evidence: ${c.evidence.join(", ") || "none"}.`,
    exists: `Status ${c.status}${c.knowledge_level ? `, maturity ${c.knowledge_level}` : ""}; routes through this claim inherit it as their weakest constituent.`,
    closure: curated.claim_closure_notes?.[c.id] ?? (single ? "Add a qualifying independent source, or a review or book, under the atlas's evidence rule — or change the claim if contrary evidence is found." : "An experiment observing the effect, reviewed and cited on the claim."),
    related: c.evidence,
    url: `${SITE}/claim/${c.id.split(":")[1]}`,
  });
}
// 2d. the observed pathway: traversed, output not delivered
for (const pw of graph.pathways.filter((p) => p.status === "observed")) {
  push({
    id: `residual:pathway-observed-not-delivered:${pw.id.replace("pathway:", "")}`,
    kind: "pathway-observed-not-delivered",
    record_type: "pathway",
    record_id: pw.id,
    statement: `${pw.name} is observed, not demonstrated: one experiment traversed the composition through ${pw.observed_through}, and the route's output was not delivered to a load.`,
    why: pw.performance?.notes ?? "the later step(s) and the recorded output are not shown by the evidence",
    exists: `Evidence ${pw.evidence.join(", ")}; status observed; the route stays a candidate.`,
    closure: "A measurement delivering the route's output from the same composition, reviewed; then the pathway becomes demonstrated.",
    related: pw.evidence,
    url: routeOfPathway.has(pw.id) ? `${SITE}/path/${routeOfPathway.get(pw.id).slice(2)}` : null,
  });
}
// 2e. curated measurement items, verified against the record they hang on
for (const item of curated.measurement ?? []) {
  const pw = pathwayById.get(item.pathway);
  const m = pw?.performance?.measurements.find((x) => x.quantity === item.quantity);
  if (!pw || !m) { problems.push(`curated residual ${item.pathway} "${item.quantity}": no such measurement — an orphan`); continue; }
  const stillOpen = item.verify?.basis_contains ? (m.basis ?? "").includes(item.verify.basis_contains) : item.verify?.unstructured ? m.metric === undefined && m.value_numeric === undefined : false;
  if (!stillOpen) { problems.push(`curated residual ${item.pathway} "${item.quantity}": the record no longer has the property that made it a residual — remove it`); continue; }
  push({
    id: `residual:${item.kind}:${item.pathway.replace("pathway:", "")}:${slug(item.quantity)}`,
    kind: item.kind,
    record_type: "measurement",
    record_id: `${item.pathway} · ${item.quantity}`,
    statement: item.statement,
    why: item.why,
    exists: `Recorded as "${m.value}" (${m.scope}${m.year ? `, ${m.year}` : ""}); sources ${m.sources.join(", ")}${m.basis ? `; basis: ${m.basis}` : "; no basis"}.`,
    closure: item.closure_condition,
    related: m.sources,
    url: routeOfPathway.has(item.pathway) ? `${SITE}/path/${routeOfPathway.get(item.pathway).slice(2)}#performance` : null,
  });
}
residuals.sort((a, b) => a.id.localeCompare(b.id));
// integrity: every residual points at an existing record; every closure condition is non-empty; ids unique
{
  const ids = new Set();
  for (const r of residuals) {
    if (ids.has(r.id)) problems.push(`duplicate residual id ${r.id}`);
    ids.add(r.id);
    if (!r.closure_condition) problems.push(`${r.id}: empty closure condition`);
    const exists =
      r.record_type === "search" ? graph.searches.some((s) => s.id === r.record_id)
      : r.record_type === "search-hit" ? graph.searches.some((s) => r.record_id.startsWith(s.id + " · "))
      : r.record_type === "claim" ? claimById.has(r.record_id)
      : r.record_type === "pathway" ? pathwayById.has(r.record_id)
      : r.record_type === "measurement" ? !!pathwayById.get(r.record_id.split(" · ")[0])?.performance?.measurements.some((m) => m.quantity === r.record_id.split(" · ")[1])
      : false;
    if (!exists) problems.push(`${r.id}: its record ${r.record_type} ${r.record_id} does not exist — an orphan`);
  }
  // every mechanically detectable open item appears
  for (const s of graph.searches) if (s.result === "inconclusive" && !residuals.some((r) => r.kind === "search-incomplete" && r.record_id === s.id) && !problems.some((p) => p.startsWith(s.id + ": inconclusive with every obligation met"))) problems.push(`${s.id}: an inconclusive search without a residual`);
  for (const c of graph.claims) if (["reported", "theoretically-predicted", "hypothesised"].includes(c.status) && !residuals.some((r) => r.record_id === c.id)) problems.push(`${c.id}: a ${c.status} claim without a residual`);
}
const countsByKind = residuals.reduce((m, r) => ((m[r.kind] = (m[r.kind] ?? 0) + 1), m), {});
const collection = {
  meta: {
    dataset: "physical-transformation-atlas",
    endpoint: "residuals",
    kind: "projection",
    note: "Every open uncertainty in a current atlas record — derived from the compiled atlas and its audits by tools/audit-closure.mjs; a live view that may shrink, grow or change after later work, outside the v0.5.0 export contract; the immutable closure snapshot is design/reviews/loop-3/pass-50-closure.md.",
    atlas_revision: graph.meta.data_hash,
    generated_at: graph.meta.built_at,
    residual_count: residuals.length,
    counts_by_kind: countsByKind,
    counts: graph.meta.counts,
    kinds: {
      "search-incomplete": "a reviewed literature search whose protocol obligations are not all met: the atlas may not say that no demonstration was found",
      "source-read-pending": "a search hit that could not be decided for want of its text",
      "evidence-single-source": "a claim one paper reports, with no independent confirmation recorded",
      "evidence-not-observed": "a claim predicted by theory or proposed, not yet observed",
      "pathway-observed-not-delivered": "a composition traversed in one experiment whose output was not delivered to a load",
      "measurement-boundary-unresolved": "a recorded figure whose numerator's boundary the source does not state",
      "measurement-definition-unresolved": "a recorded figure whose defining quantities have not been read from the source",
    },
    snapshot: "https://github.com/in-c0/physical-transformation-atlas/blob/main/design/reviews/loop-3/pass-50-closure.md",
  },
  residuals,
};
const collectionText = JSON.stringify(collection, null, 2) + "\n";

// 3. Report --------------------------------------------------------------------------------------------------------------------
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const lines = [];
lines.push("# Pass 50 — the closure audit of loop 3 (generated by tools/audit-closure.mjs; an immutable snapshot of the atlas at this revision — do not edit by hand)");
lines.push("");
lines.push(`Revision ${graph.meta.data_hash} · ${graph.meta.counts.entities ?? graph.entities.length} entities · ${graph.claims.length} claims · ${graph.sources.length} sources · ${graph.pathways.length} pathways (${graph.pathways.filter((p) => p.variant_of).length} variant) · ${(graph.systems ?? []).length} systems · ${paths.length} routes · ${paths.filter((p) => p.search_status === "demonstrated").length} demonstrated · ${graph.searches.length} reviewed searches. This report regenerates every invariant the fifty passes established and lists, in two inventories, what the atlas does not know: CURRENT RESIDUALS (open uncertainties in present records — the same collection served live at /api/residuals.json) and DEFERRED WORK (worthwhile additions not needed to interpret the present atlas). Statuses describe recorded evidence, never nature; the closure criterion is that every uncertainty is typed, sourced and exposed, not that it was eliminated.`);
lines.push("");
lines.push("## 1. Invariants, regenerated");
lines.push("");
lines.push("| invariant | state | note |");
lines.push("|---|---|---|");
for (const i of invariants) lines.push(`| ${i.name} | ${i.ok ? "holds" : `**${i.count} violation(s)**`} | ${esc(i.note)}${i.violations.length ? " — " + esc(i.violations.join("; ")) : ""} |`);
lines.push("");
lines.push("## 2. Cross-audit consistency");
lines.push("");
lines.push(`- The pass-45 measurement rows classed unresolved are exactly the measurement residuals below (${residuals.filter((r) => r.record_type === "measurement").length}), each verified against the current record's basis or shape.`);
lines.push(`- The pass-49 outstanding obligations are recomputed here with the loader's rule (blocked attempts count toward nothing; segments add up); every inconclusive reviewed search carries a search residual naming them (${countsByKind["search-incomplete"] ?? 0}, of which ${residuals.filter((r) => r.kind === "search-incomplete" && r.on_default_frontier).length} on the default frontier).`);
lines.push(`- No variant is a route, a frontier row or a matrix cell (invariant above); no benchmark, constitutive relation or resource bound appears as a deciding comparison in any bound result; no range datum is a scalar best.`);
lines.push(`- The ten default-frontier searches by state: demonstration-found 0 · protocol-complete-negative 0 · partial/blocked ${residuals.filter((r) => r.kind === "search-incomplete" && r.on_default_frontier).length} (the pass-49 audit).`);
lines.push("");
lines.push(`## 3. CURRENT RESIDUALS — ${residuals.length} open uncertainties in present records (${Object.entries(countsByKind).map(([k, n]) => `${k} ${n}`).join(" · ")})`);
lines.push("");
lines.push("| id | kind | record | statement | why unresolved | what would close it | public |");
lines.push("|---|---|---|---|---|---|---|");
for (const r of residuals) lines.push(`| ${r.id.replace("residual:", "")} | ${r.kind} | ${esc(r.record_id)} | ${esc(r.statement)} | ${esc(r.why_unresolved)} | ${esc(r.closure_condition)} | ${r.public_url ? r.public_url.replace(SITE, "") : "—"} |`);
lines.push("");
const hitEx = curated.hit_exceptions ?? {};
const maintainers = Object.entries(hitEx).map(([doi, ex]) => `${doi} → ${ex}`);
lines.push(`Maintainer notes (never served): the unread hits' full texts are owner reads — ${maintainers.join("; ") || "none"}; the Semantic Scholar key and the OpenAlex key are owner decisions (exceptions e953, 6a0d); Trepakov 1989 is owner read e9d8. The public residuals name only the scientific limitation each creates.`);
lines.push("");
lines.push(`## 4. DEFERRED WORK — ${(curated.deferred_work ?? []).length} additions not needed to interpret the present atlas`);
lines.push("");
for (const d of curated.deferred_work ?? []) lines.push(`- ${d}`);
lines.push("");
lines.push(`Loop 3 closes at revision ${graph.meta.data_hash} with ${residuals.length} named residuals and ${(curated.deferred_work ?? []).length} deferred items. Nothing was cleared to improve these numbers.`);
const reportText = lines.join("\n") + "\n";
const reportFile = join(root, "design", "reviews", "loop-3", "pass-50-closure.md");

// Write or check -----------------------------------------------------------------------------------------------------------------
if (check) {
  if (!existsSync(collectionFile)) problems.push("the residual collection does not exist — run without --check");
  else {
    const onDisk = JSON.parse(readFileSync(collectionFile, "utf8"));
    if (JSON.stringify(onDisk.residuals) !== JSON.stringify(residuals)) {
      const disk = new Set(onDisk.residuals.map((r) => r.id));
      const now = new Set(residuals.map((r) => r.id));
      const missing = [...now].filter((id) => !disk.has(id));
      const stale = [...disk].filter((id) => !now.has(id));
      problems.push(`the residual collection on disk differs from the atlas${missing.length ? `; missing: ${missing.join(", ")}` : ""}${stale.length ? `; stale: ${stale.join(", ")}` : ""}${!missing.length && !stale.length ? " (a residual's content changed)" : ""} — run without --check`);
    }
    if (onDisk.meta?.atlas_revision !== graph.meta.data_hash) problems.push(`the collection is at ${onDisk.meta?.atlas_revision}, the graph at ${graph.meta.data_hash}`);
  }
  const webCopy = join(root, "apps", "web", "generated", "residuals.json");
  if (existsSync(webCopy) && readFileSync(webCopy, "utf8") !== readFileSync(collectionFile, "utf8")) problems.push("the web app's copy of the collection differs from data/generated/residuals.json");
  if (!noSite) {
    const served = join(root, "apps", "web", "out", "api", "residuals.json");
    if (!existsSync(served)) problems.push("the built site does not serve /api/residuals.json");
    else {
      const s = JSON.parse(readFileSync(served, "utf8"));
      if (JSON.stringify(s.data) !== JSON.stringify(residuals)) problems.push("/api/residuals.json (built) differs from the residual collection");
    }
  }
  // The report carries the site lint's result, so only a full run (with the built site) writes or compares it.
  if (!noSite) {
    if (!existsSync(reportFile)) problems.push("the closure report does not exist — run without --check");
    else if (readFileSync(reportFile, "utf8") !== reportText) problems.push("the closure report on disk differs from the atlas — run without --check");
  }
}
if (problems.length) {
  console.error("audit-closure: " + problems.length + " problem(s)\n  " + problems.join("\n  "));
  process.exit(1);
}
const summary = `${invariants.length} invariants hold · ${residuals.length} residuals (${Object.entries(countsByKind).map(([k, n]) => `${k} ${n}`).join(", ")}) · ${(curated.deferred_work ?? []).length} deferred`;
if (!check) {
  writeFileSync(collectionFile, collectionText);
  if (!arg("--collection")) writeFileSync(join(root, "apps", "web", "generated", "residuals.json"), collectionText);
  if (!noSite) writeFileSync(reportFile, reportText);
  console.log(`audit-closure: ${summary} — collection${noSite ? " written (the report needs the built site)" : " and report written"}`);
} else console.log(`audit-closure: ${summary} — consistent`);
