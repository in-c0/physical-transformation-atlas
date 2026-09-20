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
  DomainDef,
  Entity,
  Pathway,
  SearchRecord,
  AutomatedSearchRun,
  AutomatedSearchRun,
  AutomatedSearchRun,
  Source,
  UnitDef,
  type Claim as ClaimT,
  type ConditionConflict as ConflictT,
  type DomainDef as DomainT,
  type Entity as EntityT,
  type Pathway as PathwayT,
  type SearchRecord as SearchT,
  type AutomatedSearchRun as RunT,
  type AutomatedSearchRun as RunT,
  type AutomatedSearchRun as RunT,
  type Source as SourceT,
  type UnitDef as UnitT,
} from "@pta/schema";

export interface Canon {
  root: string;
  entities: EntityT[];
  claims: ClaimT[];
  sources: SourceT[];
  pathways: PathwayT[];
  searches: SearchT[];
  units: UnitT[];
  domains: DomainT[];
  conditionTags: { id: string; description: string; label?: string }[];
  conflicts: ConflictT[];
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
  const units = readList(UnitDef, join(canonical, "ontology", "units.yaml"), root, problems, files);
  const domains = readList(DomainDef, join(canonical, "ontology", "domains.yaml"), root, problems, files);

  const condText = readFileSync(join(canonical, "ontology", "conditions.yaml"), "utf8");
  files.push({ path: "data/canonical/ontology/conditions.yaml", text: condText });
  const condRaw = parse(condText) as { tags: { id: string; description: string; label?: string }[]; conflicts: unknown[] };
  const conflicts = (condRaw.conflicts ?? []).flatMap((c, i) => {
    const r = ConditionConflict.safeParse(c);
    if (r.success) return [r.data];
    problems.push(`ontology/conditions.yaml conflicts#${i}: ${r.error.issues.map((x) => x.message).join("; ")}`);
    return [];
  });
  const conditionTags = condRaw.tags ?? [];

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

  if (problems.length) throw new ValidationError(problems);

  return { root, entities, claims, sources, pathways, searches, units, domains, conditionTags, conflicts, searchRuns, sourceVerification, files };
}
