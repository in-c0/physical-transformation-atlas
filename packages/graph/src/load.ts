/**
 * Load and validate everything under data/canonical (and the optional generated
 * files). Validation errors name the file and the record so a PR that breaks the
 * atlas fails with a readable message.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import {
  Claim,
  ConditionConflict,
  CONDITION_SCOPES,
  DomainDef,
  Entity,
  ExclusiveGroup,
  Interface,
  Pathway,
  SearchRecord,
  AutomatedSearchRun,
  AutomatedSearchRun,
  AutomatedSearchRun,
  Source,
  SystemPathway,
  REGIME_TOKENS,
  UnitDef,
  type Claim as ClaimT,
  type ConditionConflict as ConflictT,
  type ConditionScope,
  type ExclusiveGroup as ExclusiveGroupT,
  type Interface as InterfaceT,
  type DomainDef as DomainT,
  type Entity as EntityT,
  type Pathway as PathwayT,
  type SearchRecord as SearchT,
  type AutomatedSearchRun as RunT,
  type AutomatedSearchRun as RunT,
  type AutomatedSearchRun as RunT,
  type Source as SourceT,
  type SystemPathway as SystemT,
  type UnitDef as UnitT,
} from "@pta/schema";

export interface Canon {
  root: string;
  entities: EntityT[];
  claims: ClaimT[];
  sources: SourceT[];
  pathways: PathwayT[];
  searches: SearchT[];
  /** Interface records (pass 26), data/canonical/interfaces. */
  interfaces: InterfaceT[];
  /** System pathways (pass 34), data/canonical/systems: multi-route systems joined by handoffs. */
  systems: SystemT[];
  units: UnitT[];
  domains: DomainT[];
  conditionTags: { id: string; description: string; label?: string; default_scope: ConditionScope }[];
  conflicts: ConflictT[];
  /** Exclusive tag groups (pass 26): at most one member per scope and region. */
  exclusiveGroups: ExclusiveGroupT[];
  /** Automated index runs from pipelines (data/generated/search-runs.json): frozen result lists, never reviewed statements. */
  searchRuns: RunT[];
  sourceVerification: Record<string, { verified: boolean; checked_at: string; crossref_title?: string; note?: string }>;
  /** Every file read, for hashing. */
  files: { path: string; text: string }[];
}

export class ValidationError extends Error {
  constructor(public problems: string[]) {
    super(`${problems.length} validation problem(s):\n` + problems.map((p) => "  - " + p).join("\n"));
  }
}

function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort()
    .map((f) => join(dir, f));
}

function readList<T>(schema: z.ZodType<T>, file: string, root: string, problems: string[], files: Canon["files"]): T[] {
  const text = readFileSync(file, "utf8");
  files.push({ path: relative(root, file).replace(/\\/g, "/"), text });
  const raw = parse(text);
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    problems.push(`${relative(root, file)}: expected a YAML list`);
    return [];
  }
  const out: T[] = [];
  raw.forEach((item, i) => {
    const r = schema.safeParse(item);
    if (r.success) out.push(r.data);
    else {
      const id = item && typeof item === "object" && "id" in item ? (item as { id: string }).id : `#${i}`;
      for (const issue of r.error.issues) {
        problems.push(`${relative(root, file)} ${id}: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
      }
    }
  });
  return out;
}

export function loadCanon(root: string): Canon {
  const problems: string[] = [];
  const files: Canon["files"] = [];
  const canonical = join(root, "data", "canonical");
  const generated = join(root, "data", "generated");

  const entities = yamlFiles(join(canonical, "entities")).flatMap((f) => readList(Entity, f, root, problems, files));
  const claims = yamlFiles(join(canonical, "claims")).flatMap((f) => readList(Claim, f, root, problems, files));
  const sources = yamlFiles(join(canonical, "sources")).flatMap((f) => readList(Source, f, root, problems, files));
  const pathways = yamlFiles(join(canonical, "pathways")).flatMap((f) => readList(Pathway, f, root, problems, files));
  const searches = yamlFiles(join(canonical, "searches")).flatMap((f) => readList(SearchRecord, f, root, problems, files));
  const interfacesDir = join(canonical, "interfaces");
  const interfaces = existsSync(interfacesDir) ? yamlFiles(interfacesDir).flatMap((f) => readList(Interface, f, root, problems, files)) : [];
  const systemsDir = join(canonical, "systems");
  const systems = existsSync(systemsDir) ? yamlFiles(systemsDir).flatMap((f) => readList(SystemPathway, f, root, problems, files)) : [];
  const units = readList(UnitDef, join(canonical, "ontology", "units.yaml"), root, problems, files);
  const domains = readList(DomainDef, join(canonical, "ontology", "domains.yaml"), root, problems, files);

  const condText = readFileSync(join(canonical, "ontology", "conditions.yaml"), "utf8");
  files.push({ path: "data/canonical/ontology/conditions.yaml", text: condText });
  const condRaw = parse(condText) as { tags: { id: string; description: string; label?: string; default_scope?: string }[]; conflicts: unknown[]; exclusive_groups?: unknown[] };
  const conflicts = (condRaw.conflicts ?? []).flatMap((c, i) => {
    const r = ConditionConflict.safeParse(c);
    if (r.success) return [r.data];
    problems.push(`ontology/conditions.yaml conflicts#${i}: ${r.error.issues.map((x) => x.message).join("; ")}`);
    return [];
  });
  const exclusiveGroups = (condRaw.exclusive_groups ?? []).flatMap((g, i) => {
    const r = ExclusiveGroup.safeParse(g);
    if (r.success) return [r.data];
    problems.push(`ontology/conditions.yaml exclusive_groups#${i}: ${r.error.issues.map((x) => x.message).join("; ")}`);
    return [];
  });
  // Every tag carries a default scope (pass 26); a claim may override it per requirement.
  const conditionTags = (condRaw.tags ?? []).map((t) => {
    if (!t.default_scope || !(CONDITION_SCOPES as readonly string[]).includes(t.default_scope))
      problems.push(`ontology/conditions.yaml tag ${t.id}: default_scope must be one of ${CONDITION_SCOPES.join(", ")}`);
    return { ...t, default_scope: (t.default_scope ?? "medium") as ConditionScope };
  });

  let searchRuns: RunT[] = [];
  const runsFile = join(generated, "search-runs.json");
  if (existsSync(runsFile)) {
    const raw = JSON.parse(readFileSync(runsFile, "utf8")) as unknown[];
    searchRuns = raw.flatMap((r, i) => {
      const p = AutomatedSearchRun.safeParse(r);
      if (p.success) return [p.data];
      problems.push(`generated/search-runs.json #${i}: ${p.error.issues.map((x) => x.message).join("; ")}`);
      return [];
    });
  }
  // The negative gate: "no demonstration found" is a schema-level privilege, not a reviewer's choice.
  const MANDATORY_ENGINES = ["openalex", "semantic-scholar", "google-scholar"];
  const MANDATORY_FORMS = ["driver-family", "driver-phenomenon", "demonstration-precision"];
  const claimById = new Map(claims.map((c) => [c.id, c]));
  const entityType = new Map(entities.map((e) => [e.id, e.type]));
  for (const s of searches) {
    const qualifies = s.hits.some((h) => h.decision === "qualifies");
    if (s.result === "demonstration-found" && !qualifies) problems.push(`${s.id}: demonstration-found without a hit whose decision is "qualifies"`);
    if (s.result === "no-demonstration-found") {
      const engines = new Set(s.runs.map((r) => r.engine));
      const forms = new Set(s.runs.map((r) => r.query_form));
      const missingE = MANDATORY_ENGINES.filter((e) => !engines.has(e as never));
      const missingF = MANDATORY_FORMS.filter((f) => !forms.has(f as never));
      if (s.completeness !== "protocol-complete-negative") problems.push(`${s.id}: no-demonstration-found requires completeness protocol-complete-negative (got ${s.completeness})`);
      if (qualifies) problems.push(`${s.id}: no-demonstration-found but a hit qualifies`);
      if (missingE.length) problems.push(`${s.id}: no-demonstration-found requires every discovery engine; missing ${missingE.join(", ")}`);
      if (s.target.kind === "cell" && missingF.length) problems.push(`${s.id}: no-demonstration-found requires every mandatory query form; missing ${missingF.join(", ")}`);
    }
    // Route searches (route-search-v1): the target must carry its claim sequence, the id must be the
    // hash of that sequence, and a negative must cover every mandatory query key on every engine.
    if (s.target.kind === "path") {
      const claimSeq = s.target.claims;
      if (!claimSeq || claimSeq.length === 0) problems.push(`${s.id}: a route search must list target.claims (the route's ordered claim ids)`);
      else {
        const sha = createHash("sha1").update(claimSeq.join(">")).digest("hex").slice(0, 10);
        if (`p-${sha}` !== s.target.path) problems.push(`${s.id}: target.path ${s.target.path} is not the id of target.claims (p-${sha})`);
        for (const id of claimSeq) if (!claimById.has(id)) problems.push(`${s.id}: target.claims names unknown claim ${id}`);
        if (s.objective !== "exact-composition") problems.push(`${s.id}: a route search must have objective exact-composition`);
        if (s.result === "no-demonstration-found") {
          const mechanisms = [...new Set(claimSeq.flatMap((id) => [claimById.get(id)?.subject, claimById.get(id)?.object]).filter((n) => n && entityType.get(n) === "phenomenon"))];
          const k = mechanisms.length;
          const required = ["driver-mechanism:1", ...Array.from({ length: Math.max(0, k - 1) }, (_, i) => `mechanism-pair:${i + 1}-${i + 2}`), "whole-chain", "demonstration-precision"];
          if (s.protocol_version !== "route-search-v1") problems.push(`${s.id}: a route negative requires protocol_version route-search-v1`);
          // Pass 27: once a composition term is frozen, the composite-name form is mandatory on every engine too.
          if (s.composition_terms.length > 0) required.push("composite-name");
          for (const engine of MANDATORY_ENGINES) {
            const keys = new Set(s.runs.filter((r) => r.engine === engine).map((r) => r.query_key));
            const missing = required.filter((key) => !keys.has(key));
            if (missing.length) problems.push(`${s.id}: no-demonstration-found requires ${engine} runs for ${missing.join(", ")}`);
          }
          for (const r of s.runs) {
            if (!r.query_key || !required.includes(r.query_key)) continue;
            const due = Math.min(100, r.result_count_reported ?? r.records_retrieved);
            if (r.records_screened < due) problems.push(`${s.id}: run ${r.id} screened ${r.records_screened} of the ${due} the protocol requires`);
          }
          if (s.runs.filter((r) => r.query_form === "citation-chase").length < 2) problems.push(`${s.id}: a route negative requires citation-chase runs for two seed papers`);
        }
        if (s.result === "demonstration-found" && !s.follow_up?.canonical_pathway_review) problems.push(`${s.id}: a route positive needs follow_up.canonical_pathway_review`);
      }
    }
    if (s.result === "demonstration-found" && s.completeness !== "conclusive-positive") problems.push(`${s.id}: demonstration-found should carry completeness conclusive-positive`);
    if (s.result === "demonstration-found" && !s.follow_up) problems.push(`${s.id}: demonstration-found needs follow_up.canonical_claim_review`);
    if (s.screening.full_text_read > s.screening.title_abstract_screened || s.screening.unique_records > s.screening.records_retrieved) problems.push(`${s.id}: screening counts are inconsistent`);
    for (const runId of s.source_run_ids) if (!searchRuns.some((r) => r.id === runId)) problems.push(`${s.id}: source run ${runId} is not in data/generated/search-runs.json`);
    // A reviewed statement and a frozen bundle are different records; a shared id would count the bundle as reviewed.
    if (searchRuns.some((r) => r.id === s.id)) problems.push(`${s.id}: a reviewed record shares its id with an automated run; suffix it (for example -partial)`);
  }
  let sourceVerification: Canon["sourceVerification"] = {};
  const verFile = join(generated, "source-verification.json");
  if (existsSync(verFile)) sourceVerification = JSON.parse(readFileSync(verFile, "utf8"));

  // Referential integrity -----------------------------------------------------
  const entityIds = new Set(entities.map((e) => e.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  const claimIds = new Set(claims.map((c) => c.id));
  const tagIds = new Set(conditionTags.map((t) => t.id));

  const dupes = (ids: string[], what: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`duplicate ${what} id ${id}`);
      seen.add(id);
    }
  };
  dupes(
    entities.map((e) => e.id),
    "entity",
  );
  dupes(
    claims.map((c) => c.id),
    "claim",
  );
  dupes(
    sources.map((s) => s.id),
    "source",
  );
  dupes(
    pathways.map((p) => p.id),
    "pathway",
  );

  // Domain inventories: recorded slugs must exist as phenomena; target_phenomena is derived, never typed.
  const phenomenonSlugs = new Set(entities.filter((e) => e.type === "phenomenon").map((e) => e.id.split(":")[1]));
  for (const d of domains) {
    const dupes = d.target_inventory.filter((s, i) => d.target_inventory.indexOf(s) !== i);
    if (dupes.length) problems.push(`ontology/domains.yaml ${d.id}: duplicate inventory slugs ${dupes.join(", ")}`);
    d.target_phenomena = d.target_inventory.length;
    for (const e of entities) {
      if (e.type === "phenomenon" && e.domain === d.id && !d.target_inventory.includes(e.id.split(":")[1]))
        problems.push(`ontology/domains.yaml ${d.id}: recorded phenomenon ${e.id} is missing from target_inventory`);
    }
    void phenomenonSlugs;
  }
  for (const e of entities) {
    if (e.id.split(":")[0] !== e.type) problems.push(`${e.id}: id prefix does not match type ${e.type}`);
    if (e.quantity && !entityIds.has(e.quantity)) problems.push(`${e.id}: unknown quantity ${e.quantity}`);
    for (const t of e.condition_tags) if (!tagIds.has(t)) problems.push(`${e.id}: unknown condition tag ${t}`);
  }
  for (const c of claims) {
    if (!entityIds.has(c.subject)) problems.push(`${c.id}: unknown subject ${c.subject}`);
    if (!entityIds.has(c.object)) problems.push(`${c.id}: unknown object ${c.object}`);
    for (const s of c.evidence) if (!sourceIds.has(s)) problems.push(`${c.id}: unknown source ${s}`);
    for (const t of c.condition_tags) if (!tagIds.has(t)) problems.push(`${c.id}: unknown condition tag ${t}`);
    if (c.evidence.length === 0 && !["hypothesised"].includes(c.status)) problems.push(`${c.id}: status ${c.status} needs at least one source`);
    if (c.relation) {
      if (!entityIds.has(c.relation.input)) problems.push(`${c.id}: unknown relation input ${c.relation.input}`);
      if (!entityIds.has(c.relation.output)) problems.push(`${c.id}: unknown relation output ${c.relation.output}`);
    }
  }
  for (const p of pathways) {
    for (const s of p.steps) if (!claimIds.has(s)) problems.push(`${p.id}: unknown step ${s}`);
    for (const d of p.demonstrated_with) if (!entityIds.has(d)) problems.push(`${p.id}: unknown transducer ${d}`);
    for (const s of p.evidence) if (!sourceIds.has(s)) problems.push(`${p.id}: unknown source ${s}`);
    for (const t of p.environment) if (!tagIds.has(t)) problems.push(`${p.id}: unknown condition tag ${t}`);
  }
  for (const s of [...searches, ...searchRuns]) {
    for (const t of s.composition_terms) for (const src of t.evidence) if (!sourceIds.has(src)) problems.push(`${s.id}: composition term "${t.term}" cites unknown source ${src}`);
    if (s.target.kind === "cell") {
      if (!entityIds.has(s.target.row)) problems.push(`${s.id}: unknown row ${s.target.row}`);
      if (!entityIds.has(s.target.col)) problems.push(`${s.id}: unknown col ${s.target.col}`);
    }
    if (s.target.kind === "claim" && !claimIds.has(s.target.claim)) problems.push(`${s.id}: unknown claim ${s.target.claim}`);
  }
  for (const k of conflicts) {
    if (!tagIds.has(k.a)) problems.push(`conflict: unknown tag ${k.a}`);
    if (!tagIds.has(k.b)) problems.push(`conflict: unknown tag ${k.b}`);
  }
  for (const g of exclusiveGroups) for (const m of g.members) if (!tagIds.has(m)) problems.push(`exclusive group ${g.id}: unknown tag ${m}`);
  for (const c of claims) for (const r of c.condition_requirements) if (!tagIds.has(r.tag)) problems.push(`${c.id}: unknown condition tag ${r.tag} in condition_requirements`);
  // Pass 30: a regime_external token must be an independent exogenous degree of freedom — never the kind of
  // regime the step's own subject carries (a thermal token on a thermally driven step cannot self-certify).
  const regimeKind: Record<string, string[]> = { thermal: ["thermal"], field: ["electrical", "magnetic"], mechanical: ["mechanical"], light: ["radiative"], flow: ["kinetic"] };
  const entityById = new Map(entities.map((e) => [e.id, e]));
  for (const c of claims)
    for (const t of c.regime_external) {
      const ns = t.split(":")[0];
      const subject = entityById.get(c.subject);
      const form = subject?.energy_form;
      if (form && (regimeKind[ns] ?? []).includes(form))
        problems.push(
          `${c.id}: regime_external ${t} is a property of the step's own ${form} subject and cannot be self-certified; a reviewed pathway's regime_provides is the place for an established operating regime`,
        );
      if (!c.regime_requires.includes(t)) problems.push(`${c.id}: regime_external ${t} is not among its regime_requires`);
    }
  // Pass 44: a device-stage efficiency must say which stage and against what — a bare number would be read as the route's efficiency.
  for (const p of pathways)
    for (const m of p.performance?.measurements ?? [])
      if (m.metric === "device-stage-efficiency" && !(m.basis && /stage|relative to|over|against/.test(m.basis)))
        problems.push(`${p.id}: measurement "${m.quantity}" has metric device-stage-efficiency but its basis does not name the stage and its denominator`);
  // Pass 44: a device-stage efficiency must say which stage and against what — a bare number would be read as the route's efficiency.
  for (const p of pathways)
    for (const m of p.performance?.measurements ?? [])
      if (m.metric === "device-stage-efficiency" && !(m.basis && /stage|relative to|over|against/.test(m.basis)))
        problems.push(`${p.id}: measurement "${m.quantity}" has metric device-stage-efficiency but its basis does not name the stage and its denominator`);
  // Pass 37: a density metric needs a per-unit — a bare power (W, mW, µW) can never satisfy power-density; it is the
  // `power` metric. Every measurement with a density metric must state its normalisation in the unit and its basis.
  const DENSITY_METRICS = new Set(["power-density", "mechanical-power-density", "current-density", "work-per-volume"]);
  const perUnit = (u: string | undefined) => !!u && (/\//.test(u) || /⁻|\^-|per /.test(u));
  const checkDensity = (owner: string, ms: { metric?: string; unit?: string; basis?: string; quantity: string; normalization?: { kind: string; basis: string } | null }[]) => {
    for (const m of ms) {
      if (!m.metric || !DENSITY_METRICS.has(m.metric)) continue;
      if (!perUnit(m.unit))
        problems.push(
          `${owner}: "${m.quantity}" carries the ${m.metric} metric but its unit "${m.unit ?? ""}" states no normalisation (per area, volume, mass …) — a bare power is the power metric, not a density`,
        );
      if (!m.basis) problems.push(`${owner}: "${m.quantity}" carries the ${m.metric} metric without a basis stating what the number is normalised to`);
      if (!m.normalization) problems.push(`${owner}: "${m.quantity}" carries the ${m.metric} metric without a normalization { kind, basis } — same units never imply comparable densities`);
    }
    for (const m of ms) if (m.metric === "power" && m.normalization) problems.push(`${owner}: "${m.quantity}" is an absolute power and must not carry a normalization`);
  };
  for (const p of pathways) checkDensity(p.id, p.performance?.measurements ?? []);
  for (const s of systems) checkDensity(s.id, s.performance?.measurements ?? []);
  // Pass 39: a model-scope datum must say what kind of model datum it is; a measured datum is never model scope;
  // a Carnot-relative efficiency names the bound it is relative to.
  const MODEL_KINDS = new Set(["derived", "design-point", "simulated", "projected"]);
  const checkKinds = (owner: string, ms: { quantity: string; scope: string; datum_kind?: string; metric?: string; reference_constraint?: string }[]) => {
    for (const m of ms) {
      if (m.scope === "model" && (!m.datum_kind || !MODEL_KINDS.has(m.datum_kind)))
        problems.push(`${owner}: "${m.quantity}" is model scope and must carry datum_kind derived | design-point | simulated | projected`);
      if (m.scope !== "model" && (m.datum_kind === "design-point" || m.datum_kind === "simulated" || m.datum_kind === "projected"))
        problems.push(`${owner}: "${m.quantity}" is ${m.datum_kind} and must be scope model`);
      if (m.metric === "carnot-relative-efficiency" && m.reference_constraint !== "constraint:carnot-limit")
        problems.push(`${owner}: "${m.quantity}" is a carnot-relative-efficiency and must name reference_constraint constraint:carnot-limit`);
      if (m.reference_constraint && !entityIds.has(m.reference_constraint)) problems.push(`${owner}: unknown reference_constraint ${m.reference_constraint}`);
    }
  };
  for (const p of pathways) checkKinds(p.id, p.performance?.measurements ?? []);
  for (const s of systems) checkKinds(s.id, s.performance?.measurements ?? []);
  // Pass 36: a pathway may supply a token whose registry entry says a provider needs explaining only when a
  // preceding step of its route supplies that token or an auxiliary requirement establishes it — otherwise a
  // pathway-level provider is unexplained self-certification (the gas turbine's pressure ratio comes from a
  // compressor its own shaft drives, a feedback branch no linear route carries).
  const claimByIdForRegimes = claimById;
  for (const p of pathways) {
    for (const t of p.regime_provides) {
      if (!(REGIME_TOKENS as Record<string, { provider_needs_explanation: boolean }>)[t]?.provider_needs_explanation) continue;
      const steps = p.steps.map((id) => claimByIdForRegimes.get(id)).filter((c): c is ClaimT => !!c);
      const requiringIndex = steps.findIndex((c) => c.regime_requires.includes(t));
      if (requiringIndex === -1) continue;
      const precedingProvider = steps.slice(0, requiringIndex).some((c) => c.regime_provides.includes(t));
      const auxiliary = p.auxiliary_requirements.some((a) => a.establishes.includes(t));
      const establishment = p.regime_establishments.some((e) => e.token === t);
      if (!precedingProvider && !auxiliary && !establishment)
        problems.push(
          `${p.id}: supplies ${t} but no preceding step of its route provides it, no auxiliary_requirements entry establishes it and no regime_establishments entry explains it — record how the implementation establishes the regime (its compressor, pump, nozzle …) or drop the provider`,
        );
    }
    // Pass 43: a regime establishment explains a provider the pathway declares, for a token that needs explaining and is required
    // on its route, with known evidence, and never doubles a preceding route provider or an auxiliary's establishes.
    for (const e of p.regime_establishments) {
      if (!p.regime_provides.includes(e.token)) problems.push(`${p.id}: regime_establishments names ${e.token}, which is not in its regime_provides`);
      if (!(REGIME_TOKENS as Record<string, { provider_needs_explanation: boolean }>)[e.token]?.provider_needs_explanation)
        problems.push(`${p.id}: regime_establishments names ${e.token}, whose registry entry says a provider needs no explanation — an establishment record is for tokens that do`);
      const steps = p.steps.map((id) => claimByIdForRegimes.get(id)).filter((c): c is ClaimT => !!c);
      const requiringIndex = steps.findIndex((c) => c.regime_requires.includes(e.token));
      if (requiringIndex === -1) problems.push(`${p.id}: regime_establishments names ${e.token}, which no step of its route requires`);
      else if (steps.slice(0, requiringIndex).some((c) => c.regime_provides.includes(e.token)))
        problems.push(`${p.id}: regime_establishments names ${e.token}, which a preceding route step already provides — the establishment would double it`);
      if (p.auxiliary_requirements.some((a) => a.establishes.includes(e.token)))
        problems.push(`${p.id}: regime_establishments names ${e.token}, which an auxiliary_requirements entry already establishes — one explanation per token`);
      for (const s of e.evidence) if (!sourceIds.has(s)) problems.push(`${p.id}: regime_establishments evidence names unknown source ${s}`);
    }
  }
  // Pass 42: a pathway bound names an existing hard constraint (upper-bound | formula-bound) with evidence, and never one the
  // route already reaches through a bounded_by claim on one of its nodes — the escape hatch is for architecture-specific physics.
  const boundedByOf = new Map<string, string[]>();
  for (const c of claims) if (c.predicate === "bounded_by") boundedByOf.set(c.subject, [...(boundedByOf.get(c.subject) ?? []), c.object]);
  for (const p of pathways) {
    if (!p.bounds.length) continue;
    const reachable = new Set<string>();
    for (const id of p.steps) {
      const c = claimByIdForRegimes.get(id);
      if (!c) continue;
      for (const n of [c.subject, c.object]) for (const b of boundedByOf.get(n) ?? []) reachable.add(b);
    }
    for (const b of p.bounds) {
      const e = entityById.get(b.constraint);
      if (!e || e.type !== "constraint") { problems.push(`${p.id}: bounds names ${b.constraint}, which is not a constraint entity`); continue; }
      if (e.constraint_kind !== "upper-bound" && e.constraint_kind !== "formula-bound")
        problems.push(`${p.id}: bounds names ${b.constraint} (${e.constraint_kind ?? "no kind"}); only an upper-bound or formula-bound constraint is a pathway bound — a benchmark, constitutive relation or resource bound belongs on its phenomenon`);
      if (reachable.has(b.constraint))
        problems.push(`${p.id}: bounds names ${b.constraint}, which the route already reaches through a bounded_by claim on one of its nodes — a pathway bound is an escape hatch for architecture-specific physics, not a second place to restate a generic bound`);
      for (const s of b.evidence) if (!sourceIds.has(s)) problems.push(`${p.id}: bounds evidence names unknown source ${s}`);
    }
  }
  const interfaceIds = new Set<string>();
  for (const f of interfaces) {
    if (interfaceIds.has(f.id)) problems.push(`duplicate interface id ${f.id}`);
    interfaceIds.add(f.id);
    if ("between_claims" in f.location) {
      const { from_claim, to_claim } = f.location.between_claims;
      if (!claimIds.has(from_claim)) problems.push(`${f.id}: unknown from_claim ${from_claim}`);
      if (!claimIds.has(to_claim)) problems.push(`${f.id}: unknown to_claim ${to_claim}`);
      if (from_claim === to_claim) problems.push(`${f.id}: from_claim and to_claim are the same claim; use within_claim`);
    } else if (!claimIds.has(f.location.within_claim)) problems.push(`${f.id}: unknown within_claim ${f.location.within_claim}`);
    if (f.carrier && !entityIds.has(f.carrier)) problems.push(`${f.id}: unknown carrier ${f.carrier}`);
    for (const s of f.evidence) if (!sourceIds.has(s)) problems.push(`${f.id}: unknown source ${s}`);
    for (const r of f.condition_requirements) if (!tagIds.has(r.tag)) problems.push(`${f.id}: unknown condition tag ${r.tag}`);
    if (f.relation) {
      if (!entityIds.has(f.relation.input)) problems.push(`${f.id}: unknown relation input ${f.relation.input}`);
      if (!entityIds.has(f.relation.output)) problems.push(`${f.id}: unknown relation output ${f.relation.output}`);
    }
    if (f.status === "demonstrated" && f.evidence.length === 0) problems.push(`${f.id}: a demonstrated interface must cite evidence`);
  }
  // Pass 34: the system layer references whole pathways, disequilibria, carriers, outputs and sources; a handoff's
  // to_source must be the disequilibrium the receiving member's route actually starts from.
  const pathwayById = new Map(pathways.map((p) => [p.id, p]));
  const systemIds = new Set<string>();
  for (const s of systems) {
    if (systemIds.has(s.id)) problems.push(`duplicate system id ${s.id}`);
    systemIds.add(s.id);
    const memberPathway = new Map(s.members.map((m) => [m.id, m.pathway]));
    for (const m of s.members) if (!pathwayById.has(m.pathway)) problems.push(`${s.id}: member ${m.id} names unknown pathway ${m.pathway}`);
    for (const h of s.handoffs) {
      const to = entityById.get(h.to_source);
      if (!to) problems.push(`${s.id}: handoff ${h.from_member} → ${h.to_member} names unknown to_source ${h.to_source}`);
      else if (to.type !== "disequilibrium") problems.push(`${s.id}: handoff to_source ${h.to_source} is not a disequilibrium`);
      const receiving = pathwayById.get(memberPathway.get(h.to_member) ?? "");
      const firstClaim = receiving ? claims.find((c) => c.id === receiving.steps[0]) : undefined;
      if (firstClaim && firstClaim.subject !== h.to_source)
        problems.push(`${s.id}: handoff to ${h.to_member} names to_source ${h.to_source} but that member's route starts from ${firstClaim.subject}`);
      if (h.carrier && !entityIds.has(h.carrier)) problems.push(`${s.id}: unknown handoff carrier ${h.carrier}`);
      for (const src of h.evidence) if (!sourceIds.has(src)) problems.push(`${s.id}: unknown handoff source ${src}`);
    }
    // Pass 40: the device a handoff crosses through is a transducer; the energy form it carries is the sending member's
    // terminal output's energy form; and a member whose terminal output is absent from outputs[] must be the from_member
    // of a handoff of that energy form — an intentionally consumed internal output, never a forgotten system output.
    const RESIDUAL_KINDS = new Set(["residual-energy", "recovered-heat"]);
    const terminalOutputOf = (memberId: string) => {
      const pw = pathwayById.get(memberPathway.get(memberId) ?? "");
      const last = pw ? claimById.get(pw.steps[pw.steps.length - 1]) : undefined;
      return last ? entityById.get(last.object) : undefined;
    };
    for (const h of s.handoffs) {
      if (h.through) {
        const dev = entityById.get(h.through);
        if (!dev) problems.push(`${s.id}: handoff through unknown entity ${h.through}`);
        else if (dev.type !== "transducer") problems.push(`${s.id}: handoff through ${h.through} is not a transducer`);
      }
      // A residual stream (residual-energy, recovered-heat) is by definition not the sending member's terminal output, so
      // the energy-form invariant binds only the kinds that hand the member's intended output onward.
      const out = terminalOutputOf(h.from_member);
      if (!RESIDUAL_KINDS.has(h.kind) && out?.energy_form && out.energy_form !== h.from_energy_form)
        problems.push(`${s.id}: handoff from ${h.from_member} carries ${h.from_energy_form} energy but that member's terminal output ${out.id} is ${out.energy_form}`);
    }
    for (const m of s.members) {
      const out = terminalOutputOf(m.id);
      if (!out) continue;
      const exported = s.outputs.some((o) => o.member === m.id);
      const consumed = s.handoffs.some((h) => h.from_member === m.id && !RESIDUAL_KINDS.has(h.kind) && (!out.energy_form || h.from_energy_form === out.energy_form));
      if (!exported && !consumed) problems.push(`${s.id}: member ${m.id}'s terminal output ${out.id} is neither exported in outputs[] nor consumed by a handoff of its energy form`);
    }
    for (const o of s.outputs) {
      const out = entityById.get(o.output);
      if (!out) problems.push(`${s.id}: output names unknown entity ${o.output}`);
      else if (out.type !== "output") problems.push(`${s.id}: ${o.output} is not an output entity`);
      const member = pathwayById.get(memberPathway.get(o.member) ?? "");
      const lastClaim = member ? claims.find((c) => c.id === member.steps[member.steps.length - 1]) : undefined;
      if (lastClaim && lastClaim.object !== o.output) problems.push(`${s.id}: output of member ${o.member} is ${o.output} but that member's route ends at ${lastClaim.object}`);
    }
    for (const src of s.evidence) if (!sourceIds.has(src)) problems.push(`${s.id}: unknown source ${src}`);
    for (const m of s.performance?.measurements ?? []) for (const src of m.sources) if (!sourceIds.has(src)) problems.push(`${s.id}: measurement cites unknown source ${src}`);
  }

  if (problems.length) throw new ValidationError(problems);

  return { root, entities, claims, sources, pathways, searches, interfaces, systems, units, domains, conditionTags, conflicts, exclusiveGroups, searchRuns, sourceVerification, files };
}
