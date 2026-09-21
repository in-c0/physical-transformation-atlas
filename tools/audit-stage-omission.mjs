// Loop-3 pass 47: the generalised stage-omission audit — a generated, gated report, never a classifier (the reviewer's pass-46
// findings 10–16). A route is a SHORTER SPELLING of a recorded pathway when both run from the same source entity to the same sink
// entity and the route's ordered phenomena are a proper ordered subsequence of the pathway's; phenomenon matching only generates
// the audit hits — every hit keeps the exact claims, carriers, handoffs and conditions of both compositions so that the same
// labels under different conditions are never silently treated as equivalent.
// For every hit the report records the omitted steps (positions and ids) and decomposes each omitted step's CONTRIBUTION
// mechanically: regime tokens it provides, tokens of the disequilibrium it produces, handoff tokens it provides, tokens it declares
// external, and every downstream consumer of each token (a step's regime_requires or handoff requirement), with the pathway-level
// establishments and auxiliaries the candidate cannot inherit. It then decides, per token, whether the shortened route leaves the
// requirement unresolved, replaces the omitted provider elsewhere (naming the provider), or represents no such requirement, and
// summarises candidate_without_omitted_stage = unresolved | resolved | not-represented. "No recorded contribution" means the
// ontology holds no machine-readable reason for the stage — never that the stage is physically dispensable.
// Scopes: (1) the default frontier (class candidate, kind composition — the reviewer's population); (2) beyond it, every route
// neither demonstrated nor already derived by stage-omission; (3) the positive control — the routes the compiler DID derive by
// stage-omission, which the same detector must find with the same token.
// --check gates (pipelines/test): the controls in pass-47-controls.yaml hold (an unresolved omission, a provider replaced
// elsewhere, and a hit with no represented requirement); every compiler stage-omission route is found; no row in scopes 1–2 meets
// the compiler's decisive condition (else the classifier should have fired); the report on disk matches the compiled graph.
//   node tools/audit-stage-omission.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = resolve(fileURLToPath(import.meta.url), "..");
const root = join(here, "..");
const check = process.argv.includes("--check");
const graph = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8"));
const paths = JSON.parse(readFileSync(join(root, "data", "generated", "paths.json"), "utf8"));
const controls = parse(readFileSync(join(root, "design", "reviews", "loop-3", "pass-47-controls.yaml"), "utf8"));
const entityById = new Map(graph.entities.map((e) => [e.id, e]));
const claimById = new Map(graph.claims.map((c) => [c.id, c]));
const DEMONSTRATED = new Set(["demonstrated", "prototype", "commercial"]);
const recorded = graph.pathways.filter((p) => DEMONSTRATED.has(p.status) && !p.variant_of);
const name = (id) => entityById.get(id)?.name ?? id;
const phenomenaOf = (claimIds) =>
  [...new Set(claimIds.flatMap((id) => { const c = claimById.get(id); return c ? [c.subject, c.object] : []; }).filter((n) => entityById.get(n)?.type === "phenomenon"))];
const isSubsequence = (short, long) => { let j = 0; for (const x of long) if (j < short.length && short[j] === x) j++; return j === short.length; };
/** The tokens the compiler reports the route as leaving unresolved (its regime check detail and handoff issues). */
const missingTokens = (route) => {
  const out = new Set();
  const regime = route.checks.find((k) => k.id === "driver-regime-sufficiency");
  if (regime?.result === "unresolved") for (const m of regime.detail.matchAll(/requires ([a-z]+:[a-z0-9-]+); nothing before it records supplying it/g)) out.add(m[1]);
  for (const h of route.handoff_issues ?? []) for (const t of h.missing) out.add(t);
  return out;
};
const producedProvides = (c) => { const d = entityById.get(c.object); return d?.type === "disequilibrium" ? (d.regime_provides ?? []) : []; };
/** What one claim supplies, by channel. */
const contribution = (c) => ({
  regime_provides: c.regime_provides ?? [],
  produced_disequilibrium_provides: producedProvides(c),
  handoff_provides: c.handoff?.provides ?? [],
  regime_external: c.regime_external ?? [],
});
const suppliedTokens = (c) => { const k = contribution(c); return [...new Set([...k.regime_provides, ...k.produced_disequilibrium_provides, ...k.handoff_provides])]; };
const consumes = (c, t) => (c.regime_requires ?? []).includes(t) || (c.handoff?.requires_all ?? []).includes(t) || (c.handoff?.requires_any ?? []).includes(t);
/** Who, in the route, supplies token t before claim index i (the compiler's provider rules, minus the exact pathway's own provides). */
function routeProviders(routeClaims, i, t) {
  const out = [];
  const src = entityById.get(routeClaims[0].subject);
  if (src?.type === "disequilibrium" && (src.regime_provides ?? []).includes(t)) out.push(`the source ${src.id}`);
  for (let j = 0; j < i; j++) {
    const c = routeClaims[j];
    if ((c.regime_provides ?? []).includes(t)) out.push(`${c.id} (regime_provides)`);
    if (producedProvides(c).includes(t)) out.push(`${c.object} produced by ${c.id}`);
    if ((c.handoff?.provides ?? []).includes(t)) out.push(`${c.id} (handoff provides)`);
  }
  if ((routeClaims[i].regime_external ?? []).includes(t)) out.push(`${routeClaims[i].id} declares it external`);
  return out;
}

/** Every recorded pathway the route is a shorter spelling of, with the omitted steps' contributions decomposed. */
function relationsOf(route) {
  const phen = phenomenaOf(route.claims);
  const missing = missingTokens(route);
  const routeClaims = route.claims.map((id) => claimById.get(id));
  const routeClaimIds = new Set(route.claims);
  const out = [];
  for (const pw of recorded) {
    const steps = pw.steps.map((id) => claimById.get(id)).filter(Boolean);
    if (steps.length !== pw.steps.length) continue;
    if (steps[0].subject !== route.source || steps[steps.length - 1].object !== route.sink) continue;
    const pp = phenomenaOf(pw.steps);
    if (phen.length >= pp.length || !isSubsequence(phen, pp)) continue;
    const omittedPhenomena = pp.filter((x) => !phen.includes(x));
    const omittedSteps = steps.map((c, i) => ({ c, position: i + 1 })).filter(({ c }) => !routeClaimIds.has(c.id));
    const routeOnly = routeClaims.filter((c) => !pw.steps.includes(c.id));
    const sameEnds = phen[0] === pp[0] && phen[phen.length - 1] === pp[pp.length - 1];
    // Per omitted step, per token: who consumes it downstream in the pathway, and what the shortened route does about it.
    const tokens = [];
    for (const { c, position } of omittedSteps) {
      for (const t of suppliedTokens(c)) {
        // Consumers: the pathway's later steps, and the route's own claims when they spell a later stage through a different claim
        // (the compact MHD route consumes flow:bulk-fluid-motion on claim:hot-gas-drives-mhd, which the pathway never uses).
        const omittedIndex = Math.max(...[c.subject, c.object].map((n) => pp.indexOf(n)));
        const stageIndex = (d) => Math.max(...[d.subject, d.object].map((n) => pp.indexOf(n)));
        const consumers = [
          ...steps.slice(position).filter((d) => consumes(d, t)).map((d) => ({ id: d.id, inRoute: routeClaimIds.has(d.id) })),
          ...routeOnly.filter((d) => consumes(d, t) && stageIndex(d) >= omittedIndex).map((d) => ({ id: d.id, inRoute: true })),
        ];
        let status, detail;
        const routeConsumers = consumers.filter((d) => d.inRoute);
        if (routeConsumers.length === 0) {
          status = consumers.length ? "consumer-omitted" : "no-consumer";
          detail = consumers.length ? `consumed only by ${consumers.map((d) => d.id).join(", ")}, which the route omits too` : "no downstream step records requiring it";
        } else if (missing.has(t)) {
          status = "unresolved";
          detail = `${routeConsumers.map((d) => d.id).join(", ")} requires it and the compiler reports nothing before it supplying it`;
        } else {
          const providers = [...new Set(routeConsumers.flatMap((d) => routeProviders(routeClaims, routeClaims.findIndex((x) => x.id === d.id), t)))];
          status = "replaced";
          detail = `${routeConsumers.map((d) => d.id).join(", ")} requires it; the route supplies it through ${providers.join(", ") || "a provider the compiler accepted"}`;
        }
        tokens.push({ step: c.id, position, token: t, consumers, status, detail });
      }
    }
    const pathwayLevel = {
      establishments: (pw.regime_establishments ?? []).map((e) => e.token),
      auxiliaries: (pw.auxiliary_requirements ?? []).flatMap((a) => a.establishes ?? []),
      pathway_provides: pw.regime_provides ?? [],
    };
    const unresolved = tokens.filter((t) => t.status === "unresolved");
    const replaced = tokens.filter((t) => t.status === "replaced");
    const without = unresolved.length ? "unresolved" : replaced.length ? "resolved" : "not-represented";
    const cls = unresolved.length ? "unresolved-requirement" : replaced.length ? "replaced-elsewhere" : "not-represented";
    const compilerCondition = sameEnds && unresolved.length > 0;
    out.push({ route, pw, phen, pp, omittedPhenomena, omittedSteps, routeOnly, steps, sameEnds, missing: [...missing], tokens, pathwayLevel, without, cls, compilerCondition });
  }
  return out;
}

const isControl = (r) => r.known_pathway_overlap?.relation === "stage-omission";
const scopes = [
  { key: "default", title: "1. The default frontier (class candidate, kind composition)", routes: paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition") },
  { key: "beyond", title: "2. Beyond the default view (every route neither demonstrated nor already derived by stage-omission)", routes: paths.filter((p) => p.search_status !== "demonstrated" && !(p.frontier_class === "candidate" && p.structural_kind === "composition") && !isControl(p)) },
  { key: "control", title: "3. Positive control (routes the compiler derived by stage-omission — the same detector must find each, with the same token)", routes: paths.filter(isControl) },
];
for (const s of scopes) s.rows = s.routes.flatMap(relationsOf).sort((a, b) => a.route.id.localeCompare(b.route.id) || a.pw.id.localeCompare(b.pw.id));
const allRows = scopes.flatMap((s) => s.rows);

// Gates -------------------------------------------------------------------------------------------------------------------------
const problems = [];
for (const s of scopes.slice(0, 2)) for (const r of s.rows) if (r.compilerCondition) problems.push(`${r.route.id} vs ${r.pw.id}: an omitted stage supplies an unresolved token with the same ends — the compiler should have derived it`);
for (const route of scopes[2].routes) {
  const hit = scopes[2].rows.find((r) => r.route.id === route.id && r.pw.id === route.known_pathway_overlap.pathway);
  if (!hit) problems.push(`${route.id}: the compiler recorded stage-omission against ${route.known_pathway_overlap.pathway} but the detector does not find the relation`);
  else {
    if (!hit.compilerCondition) problems.push(`${route.id}: found, but the audit does not read it as an unresolved omission with the same ends`);
    for (const t of route.known_pathway_overlap.supplies ?? []) if (!hit.tokens.some((x) => x.token === t && x.status === "unresolved")) problems.push(`${route.id}: the compiler names ${t} as the supplied token; the audit does not`);
  }
}
for (const ctl of controls) {
  const hit = allRows.find((r) => r.route.id === ctl.route && r.pw.id === ctl.pathway);
  if (!hit) { problems.push(`control ${ctl.route} vs ${ctl.pathway}: not found`); continue; }
  if (hit.cls !== ctl.expect) problems.push(`control ${ctl.route}: expected ${ctl.expect}, read ${hit.cls}`);
  if (ctl.token && !hit.tokens.some((t) => t.token === ctl.token && (ctl.expect === "unresolved-requirement" ? t.status === "unresolved" : ctl.expect === "replaced-elsewhere" ? t.status === "replaced" : true))) problems.push(`control ${ctl.route}: token ${ctl.token} not read as ${ctl.expect}`);
  if (ctl.replaced_by && !hit.tokens.some((t) => t.status === "replaced" && t.detail.includes(ctl.replaced_by))) problems.push(`control ${ctl.route}: the replacing provider ${ctl.replaced_by} is not named`);
  if (ctl.omitted && !hit.omittedPhenomena.includes(ctl.omitted)) problems.push(`control ${ctl.route}: ${ctl.omitted} is not among the omitted phenomena`);
  if (ctl.compiler === "stage-omission" && !(isControl(hit.route) && hit.route.known_pathway_overlap.pathway === ctl.pathway)) problems.push(`control ${ctl.route}: the compiler does not record it as stage-omission`);
  if (ctl.compiler === "none" && isControl(hit.route)) problems.push(`control ${ctl.route}: the compiler derived it, but the control expects an audit hit only`);
}

// Report ------------------------------------------------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const list = (a) => (a.length ? a.join(", ") : "—");
const CLASS_LABEL = {
  "unresolved-requirement": "omission creates an unresolved requirement",
  "replaced-elsewhere": "the omitted provider is replaced elsewhere in the route",
  "not-represented": "no relevant requirement is represented",
};
const lines = [];
lines.push("# Pass 47 — the generalised stage-omission audit (generated by tools/audit-stage-omission.mjs; do not edit by hand)");
lines.push("");
lines.push(
  `Revision ${graph.meta.data_hash} · ${paths.length} routes · ${recorded.length} recorded demonstrated pathways (variants excluded). A route is a shorter spelling of a pathway when both share the source and sink entity and the route's ordered phenomena are a proper ordered subsequence of the pathway's (relation: proper-subsequence). Phenomenon matching only generates the hits; each hit below keeps the exact claims, carriers, handoffs and conditions of both compositions. A report, not a classifier: the compiler's decisive condition (pass 43 — the same first and last phenomena, and an omitted stage supplying a regime or handoff token the shortened route leaves unresolved) already derives a route; every other hit is diagnostic. "No recorded contribution" means the ontology holds no machine-readable reason for the stage, never that the stage is physically dispensable.`,
);
lines.push("");
lines.push("Classes: **omission creates an unresolved requirement** (the only class that is evidence for the stage-omission relation) · **the omitted provider is replaced elsewhere in the route** (another step or a declared external degree of freedom supplies the same token) · **no relevant requirement is represented** (the omitted stage's tokens are consumed by nothing the route keeps, or the stage records no token at all).");
for (const s of scopes) {
  lines.push("");
  lines.push(`## ${s.title}`);
  lines.push("");
  const byClass = (k) => s.rows.filter((r) => r.cls === k).length;
  lines.push(`${s.routes.length} routes in scope · ${s.rows.length} hit(s) against ${new Set(s.rows.map((r) => r.pw.id)).size} recorded pathway(s) · ${byClass("unresolved-requirement")} unresolved requirement · ${byClass("replaced-elsewhere")} replaced elsewhere · ${byClass("not-represented")} no requirement represented.`);
  if (!s.rows.length) continue;
  lines.push("");
  lines.push("| route | class / kind | route phenomena | recorded pathway | pathway phenomena | omitted stages (position · phenomenon) | contributions of the omitted steps | route leaves unresolved | candidate without the omitted stage | same ends | class | compiler |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of s.rows)
    lines.push(
      `| ${r.route.id} | ${r.route.frontier_class} / ${r.route.structural_kind} | ${esc(r.phen.map(name).join(" → "))} | ${r.pw.id.replace("pathway:", "")} | ${esc(r.pp.map(name).join(" → "))} | ${esc(r.omittedSteps.map(({ c, position }) => `${position} · ${c.id}`).join("; "))} — ${esc(r.omittedPhenomena.join(", "))} | ${esc(r.tokens.length ? r.tokens.map((t) => `${t.token} (${t.status})`).join("; ") : "no recorded contribution")} | ${esc(list(r.missing))} | ${r.without} | ${r.sameEnds ? "yes" : "no"} | ${CLASS_LABEL[r.cls]} | ${isControl(r.route) && r.route.known_pathway_overlap.pathway === r.pw.id ? "derived by stage-omission" : "not derived"} |`,
    );
  for (const r of s.rows) {
    lines.push("");
    lines.push(`### ${r.route.id} ← ${r.pw.id} (proper-subsequence)`);
    lines.push("");
    lines.push(`- Route ${r.route.id} (${r.route.frontier_class} / ${r.route.structural_kind}; ${r.route.source} → ${r.route.sink}): ${r.phen.join(" → ")}. Leaves unresolved: ${list(r.missing)}.`);
    lines.push(`- Pathway ${r.pw.id} (${r.pw.status}; "${r.pw.name}"): ${r.pp.join(" → ")}.`);
    lines.push(`- Omitted: ${r.omittedSteps.map(({ c, position }) => `step ${position} ${c.id} (${c.subject} → ${c.object})`).join("; ")} — phenomena ${r.omittedPhenomena.join(", ")}. Same first and last phenomena: ${r.sameEnds ? "yes" : "no"}.`);
    if (r.routeOnly.length) lines.push(`- The route spells its shared stages through claims the pathway does not use: ${r.routeOnly.map((c) => `${c.id} (${c.subject} → ${c.object}; conditions: ${list(c.conditions ?? [])}; regime requires ${list(c.regime_requires ?? [])}, provides ${list(c.regime_provides ?? [])}, external ${list(c.regime_external ?? [])}; handoff provides ${list(c.handoff?.provides ?? [])}, requires ${list([...(c.handoff?.requires_all ?? []), ...(c.handoff?.requires_any ?? [])])})`).join("; ")}.`);
    lines.push(`- Contribution of each omitted step, by channel:`);
    for (const { c, position } of r.omittedSteps) {
      const k = contribution(c);
      lines.push(`  - step ${position} ${c.id}: regime_provides ${list(k.regime_provides)} · produced disequilibrium provides ${list(k.produced_disequilibrium_provides)} · handoff provides ${list(k.handoff_provides)} · regime_external ${list(k.regime_external)} · conditions: ${list(c.conditions ?? [])}.`);
    }
    if (r.tokens.length) {
      lines.push(`- Each supplied token and what the shortened route does about it:`);
      for (const t of r.tokens) lines.push(`  - ${t.token} from ${t.step}: consumers downstream ${t.consumers.length ? t.consumers.map((d) => `${d.id}${d.inRoute ? " (in the route)" : " (omitted)"}`).join(", ") : "none"} → ${t.status}: ${t.detail}.`);
    } else lines.push(`- No omitted step records a contribution in any channel.`);
    lines.push(`- Pathway-level, which no candidate inherits: regime_establishments ${list(r.pathwayLevel.establishments)} · auxiliaries establish ${list(r.pathwayLevel.auxiliaries)} · the exact pathway provides ${list(r.pathwayLevel.pathway_provides)}.`);
    lines.push(`- candidate_without_omitted_stage = **${r.without}** · class: **${CLASS_LABEL[r.cls]}** · compiler: ${isControl(r.route) && r.route.known_pathway_overlap.pathway === r.pw.id ? "derived by stage-omission (the same token)" : r.compilerCondition ? "MEETS THE CONDITION BUT NOT DERIVED — gate failure" : "not derived (the condition is not met)"}.`);
    lines.push("");
    lines.push(`| pathway step | claim | subject → object | in the route | conditions | regime requires / provides / external | handoff provides / requires |`);
    lines.push(`|---|---|---|---|---|---|---|`);
    for (const [i, c] of r.steps.entries())
      lines.push(`| ${i + 1} | ${c.id} | ${esc(c.subject)} → ${esc(c.object)} | ${r.route.claims.includes(c.id) ? "yes" : "omitted"} | ${esc(list(c.conditions ?? []))} | ${esc(list(c.regime_requires ?? []))} / ${esc(list(c.regime_provides ?? []))} / ${esc(list(c.regime_external ?? []))} | ${esc(list(c.handoff?.provides ?? []))} / ${esc(list([...(c.handoff?.requires_all ?? []), ...(c.handoff?.requires_any ?? [])]))} |`);
  }
}
lines.push("");
lines.push("Reading the report: only a hit in the first class is evidence for the stage-omission relation, and the compiler already derives every such hit whose ends match. A hit whose omitted stage is replaced elsewhere is a different spelling of the same physics by the atlas's records. A hit with no represented requirement is a shorter spelling of a demonstrated device for which the atlas holds no machine-readable reason to require the omitted stage — either the stage is genuinely optional physics, or the ontology has not yet recorded what it establishes (a regime token or handoff to add, after which the compiler's rule derives the route). The report decides neither; the reviewer does, hit by hit. Nothing here is published on the site (finding 16).");
const out = lines.join("\n") + "\n";
const file = join(root, "design", "reviews", "loop-3", "pass-47-stage-omission-audit.md");
if (check) {
  if (!existsSync(file)) problems.push("the report file does not exist — run without --check");
  else if (readFileSync(file, "utf8") !== out) problems.push("the report on disk differs from the compiled graph — run without --check and commit the result");
}
if (problems.length) {
  console.error("audit-stage-omission: " + problems.length + " problem(s)\n  " + problems.join("\n  "));
  process.exit(1);
}
const summary = scopes.map((s) => `${s.key} ${s.routes.length}/${s.rows.length}`).join(" · ");
if (!check) {
  writeFileSync(file, out);
  console.log(`audit-stage-omission: ${summary} (routes/hits) · ${controls.length} controls hold — report written`);
} else console.log(`audit-stage-omission: ${summary} (routes/hits) · ${controls.length} controls hold — consistent`);
