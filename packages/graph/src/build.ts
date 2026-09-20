/**
 * Compile the canonical claims into the graph the site loads: enumerated
 * conversion paths with physics checks, the disequilibrium × coupling matrix,
 * coverage accounting and the headline counts. Everything numeric on the site
 * comes from here.
 */
import { createHash } from "node:crypto";
import {
  EVIDENCE_RANK,
  PROCESS_PREDICATES,
  type Claim,
  type CompiledPath,
  type CoverageEntry,
  type Entity,
  type EvidenceStatus,
  type FrontierClass,
  type Graph,
  type KnowledgeLevel,
  type MatrixAxis,
  type MatrixCell,
  type MatrixCellStatus,
  type Pathway,
  type SearchRecord,
  type SearchStatus,
} from "@pta/schema";
import { CORE_CHECK_IDS, UnitTable, boundaryReport, runAllChecks, type PhysicsContext } from "@pta/physics";
import type { Canon } from "./load.js";
import { classify, collapseForms, familySeams, signature, type RouteCore } from "./structure.js";
import { researchOrder } from "./order.js";

export const MAX_PATH_STEPS = 7;
export const MAX_PATHS_PER_SOURCE = 4000;

const STATUS_TO_LEVEL: Record<EvidenceStatus, KnowledgeLevel> = {
  established: "K4",
  replicated: "K4",
  demonstrated: "K4",
  reported: "K4",
  "theoretically-predicted": "K3",
  hypothesised: "K2",
  disputed: "K2",
  contradicted: "K1",
  invalid: "K0",
};

const LEVEL_RANK = (k: KnowledgeLevel) => Number(k.slice(1));

function pathId(claimIds: string[]): string {
  return "p-" + createHash("sha1").update(claimIds.join(">")).digest("hex").slice(0, 10);
}

export function buildGraph(canon: Canon, opts: { builtAt?: string; version?: string; sourceCommit?: string | null } = {}): Graph {
  const entity = new Map(canon.entities.map((e) => [e.id, e]));
  const claimById = new Map(canon.claims.map((c) => [c.id, c]));
  const units = new UnitTable(canon.units);

  const boundedByIndex = new Map<string, { constraint: Entity; claim: Claim }[]>();
  for (const c of canon.claims) {
    if (c.predicate !== "bounded_by") continue;
    const constraint = entity.get(c.object);
    if (!constraint) continue;
    const list = boundedByIndex.get(c.subject) ?? [];
    list.push({ constraint, claim: c });
    boundedByIndex.set(c.subject, list);
  }
  const ctx: PhysicsContext = {
    entity: (id) => entity.get(id),
    units,
    conflicts: canon.conflicts,
    boundedBy: (id) => boundedByIndex.get(id) ?? [],
  };

  // Adjacency over process claims ----------------------------------------------
  const out = new Map<string, Claim[]>();
  for (const c of canon.claims) {
    if (!(PROCESS_PREDICATES as readonly string[]).includes(c.predicate)) continue;
    const list = out.get(c.subject) ?? [];
    list.push(c);
    out.set(c.subject, list);
  }
  const memberOf = new Map<string, string[]>();
  for (const c of canon.claims) {
    if (c.predicate !== "member_of") continue;
    const list = memberOf.get(c.subject) ?? [];
    list.push(c.object);
    memberOf.set(c.subject, list);
  }

  // Transducers per phenomenon (implemented_by / demonstrated_with), K6+ only ---------
  const devicesOf = new Map<string, Set<string>>();
  for (const c of canon.claims) {
    if (c.predicate !== "implemented_by" && c.predicate !== "demonstrated_with") continue;
    const t = entity.get(c.object);
    if (!t || t.type !== "transducer" || !t.knowledge_level || Number(t.knowledge_level.slice(1)) < 6) continue;
    devicesOf.set(c.subject, new Set([...(devicesOf.get(c.subject) ?? []), c.object]));
  }

  // Named pathway lookup by claim sequence ----------------------------------------
  const pathwayBySeq = new Map<string, Pathway>();
  for (const p of canon.pathways) pathwayBySeq.set(p.steps.join(">"), p);

  // Search records ----------------------------------------------------------------
  const cellSearches = new Map<string, SearchRecord[]>();
  const pathSearches = new Map<string, SearchRecord[]>();
  const allSearches = [...canon.searches, ...canon.searchRuns];
  for (const s of allSearches) {
    if (s.target.kind === "cell") {
      const key = `${s.target.row}|${s.target.col}`;
      cellSearches.set(key, [...(cellSearches.get(key) ?? []), s]);
    } else if (s.target.kind === "path") {
      pathSearches.set(s.target.path, [...(pathSearches.get(s.target.path) ?? []), s]);
    }
  }
  const reviewedIds = new Set(canon.searches.map((s) => s.id));

  // Path enumeration ---------------------------------------------------------------
  const paths: CompiledPath[] = [];
  const disequilibria = canon.entities.filter((e) => e.type === "disequilibrium");
  for (const d of disequilibria) {
    let count = 0;
    const stack: Claim[] = [];
    const visited = new Set<string>([d.id]);
    const dfs = (node: string) => {
      if (count >= MAX_PATHS_PER_SOURCE) return;
      for (const c of out.get(node) ?? []) {
        if (visited.has(c.object)) continue;
        const target = entity.get(c.object)!;
        stack.push(c);
        if (target.type === "output") {
          paths.push(compilePath(stack.slice()));
          count++;
        } else if (stack.length < MAX_PATH_STEPS) {
          visited.add(c.object);
          dfs(c.object);
          visited.delete(c.object);
        }
        stack.pop();
        if (count >= MAX_PATHS_PER_SOURCE) return;
      }
    };
    dfs(d.id);
  }

  function compilePath(claims: Claim[]): CompiledPath {
    const ids = claims.map((c) => c.id);
    const id = pathId(ids);
    const nodes = [claims[0].subject, ...claims.map((c) => c.object)];
    const pathway = pathwayBySeq.get(ids.join(">"));
    const checks = runAllChecks(ctx, claims, pathway);
    const weakest = claims.reduce<EvidenceStatus>((acc, c) => (EVIDENCE_RANK[c.status] < EVIDENCE_RANK[acc] ? c.status : acc), "established");
    const established = claims.filter((c) => c.status === "established" || c.status === "replicated").length;
    const failed = checks.some((k) => k.result === "fail");

    let search_status: SearchStatus;
    let last_searched: string | undefined;
    const searches = pathSearches.get(id) ?? [];
    const reviewed = searches.filter((s) => reviewedIds.has(s.id));
    if (pathway && pathway.status !== "proposed") search_status = "demonstrated";
    else if (reviewed.some((s) => s.result === "demonstration-found")) search_status = "demonstrated";
    else if (reviewed.some((s) => s.result === "no-demonstration-found")) search_status = "searched-no-demonstration-found";
    else if (searches.length) search_status = "search-incomplete";
    else search_status = "not-searched";
    if (searches.length) last_searched = searches.map((s) => s.date).sort().at(-1);

    // Recorded-pathway overlap: does a reviewed pathway share this claim sequence, or a prefix,
    // suffix or ordered subsequence of it? A generated route that merely extends or truncates a
    // recorded pathway is "derived", not a fresh candidate.
    const known_pathway_overlap = pathwayOverlap(ids, pathway);

    const srcForm = entity.get(claims[0].subject)?.energy_form;
    const sinkForm = entity.get(claims[claims.length - 1].object)?.energy_form;
    let frontier_class: FrontierClass;
    if (failed) frontier_class = "forbidden";
    else if (search_status === "demonstrated") frontier_class = "demonstrated";
    else if (srcForm && sinkForm && srcForm === sinkForm) frontier_class = "circular";
    else if (EVIDENCE_RANK[weakest] >= EVIDENCE_RANK.demonstrated) frontier_class = known_pathway_overlap && known_pathway_overlap.shared_claims >= 2 ? "derived" : "candidate";
    else frontier_class = "weak";

    // The constituent floor is a statement about the parts. The composition's own level exists only
    // when a reviewed pathway records it.
    const levels = claims.map((c) => c.knowledge_level ?? STATUS_TO_LEVEL[c.status]);
    const constituent_floor = levels.reduce((a, b) => (LEVEL_RANK(b) < LEVEL_RANK(a) ? b : a));
    let knowledge_level: KnowledgeLevel;
    if (pathway) knowledge_level = pathway.knowledge_level;
    else knowledge_level = LEVEL_RANK(constituent_floor) > 4 ? "K4" : constituent_floor;

    const families = new Set<string>();
    const domains = new Set<string>();
    for (const n of nodes) {
      const e = entity.get(n)!;
      if (e.type === "phenomenon") {
        for (const f of memberOf.get(n) ?? []) families.add(f);
        if (e.domain) domains.add(e.domain);
      }
    }
    const sources = new Set<string>();
    for (const c of claims) for (const s of c.evidence) sources.add(s);
    const contradictory = claims.filter((c) => c.status === "disputed" || c.status === "contradicted" || c.status === "invalid").length;
    const compositionSources = new Set<string>(pathway?.evidence ?? []);
    for (const m of pathway?.performance?.measurements ?? []) for (const src of m.sources) compositionSources.add(src);

    const phenomena = nodes.filter((n) => entity.get(n)?.type === "phenomenon");
    const forms = collapseForms([claims[0].energy?.input, ...claims.map((c) => c.energy?.output)]);
    const famSets = phenomena.map((p) => memberOf.get(p) ?? []);
    const CORE = CORE_CHECK_IDS;
    const coreUnresolved = checks.filter((k) => CORE.has(k.id) && (k.result === "unresolved" || k.result === "unknown")).length;
    const boundary = boundaryReport(ctx, claims);
    const conversionSteps = claims.filter((c) => entity.get(c.subject)?.type === "phenomenon" || entity.get(c.object)?.type === "phenomenon");
    const quantified = conversionSteps.filter((c) => c.relation).length;
    const knownDevice = phenomena.length >= 2 && phenomena.every((p) => devicesOf.has(p)) && (() => {
      let common: Set<string> | null = null;
      for (const p of phenomena) {
        const d = devicesOf.get(p)!;
        common = common ? new Set([...common].filter((x) => d.has(x))) : new Set(d);
      }
      return !!common && common.size > 0;
    })();

    return {
      id,
      nodes,
      claims: ids,
      source: claims[0].subject,
      sink: claims[claims.length - 1].object,
      length: claims.length,
      phenomena,
      effective_length: phenomena.length,
      energy_form_sequence: forms,
      energy_transition_count: Math.max(0, forms.length - 1),
      family_seam_count: familySeams(famSets),
      core_unresolved_count: coreUnresolved,
      implied_interface_count: boundary.adjacent.length,
      magnitude_data_coverage: { quantified, of: conversionSteps.length },
      representation_signature: signature(claims[0].subject, phenomena, sinkForm),
      semantic_overlap: null,
      structural_kind: "composition",
      dominated_by: null,
      source_availability: entity.get(claims[0].subject)?.availability ?? null,
      // filled after enumeration: see classifyStructure below
      _families: famSets as never,
      _knownDevice: knownDevice as never,
      evidence_status: weakest,
      established_steps: established,
      search_status,
      frontier_class,
      knowledge_level,
      pathway: pathway?.id,
      checks,
      coupling_families: [...families],
      domains: [...domains] as CompiledPath["domains"],
      last_searched,
      literature: { supporting: sources.size, contradictory },
      constituent_source_ids: [...sources],
      composition_source_ids: [...compositionSources],
      constituent_floor,
      known_pathway_overlap,
    };
  }

  /** Best overlap between a route's claim sequence and the recorded pathways. */
  function pathwayOverlap(ids: string[], exact: Pathway | undefined): CompiledPath["known_pathway_overlap"] {
    if (exact) return { pathway: exact.id, relation: "exact", shared_claims: ids.length, route_claims: ids.length };
    let best: CompiledPath["known_pathway_overlap"] = null;
    for (const p of canon.pathways) {
      const steps = p.steps;
      let relation: "prefix" | "suffix" | "subsequence" | null = null;
      let shared = 0;
      const isPrefix = steps.length < ids.length && steps.every((st, i) => ids[i] === st);
      const routeIsPrefix = ids.length < steps.length && ids.every((st, i) => steps[i] === st);
      const isSuffix = steps.length < ids.length && steps.every((st, i) => ids[ids.length - steps.length + i] === st);
      const routeIsSuffix = ids.length < steps.length && ids.every((st, i) => steps[steps.length - ids.length + i] === st);
      if (isPrefix || routeIsPrefix) {
        relation = "prefix";
        shared = Math.min(steps.length, ids.length);
      } else if (isSuffix || routeIsSuffix) {
        relation = "suffix";
        shared = Math.min(steps.length, ids.length);
      } else {
        // ordered subsequence: how many of the pathway's steps appear in order inside the route
        let j = 0;
        for (const st of ids) if (j < steps.length && steps[j] === st) j++;
        let k = 0;
        for (const st of steps) if (k < ids.length && ids[k] === st) k++;
        shared = Math.max(j, k);
        if (shared >= 2) relation = "subsequence";
      }
      if (relation && (!best || shared > best.shared_claims)) best = { pathway: p.id, relation, shared_claims: shared, route_claims: ids.length };
    }
    return best;
  }

  // Sanity: every named pathway must correspond to an enumerated path ---------------
  const pathIds = new Set(paths.map((p) => p.id));
  for (const p of canon.pathways) {
    const id = pathId(p.steps);
    if (!pathIds.has(id)) {
      // Not reachable by enumeration (e.g. a cooling path whose sink is an output reached from a non-disequilibrium start). Compile it directly.
      const claims = p.steps.map((s) => claimById.get(s)!);
      paths.push(compilePath(claims));
      pathIds.add(id);
    }
  }

  // Structural classification (pure; see structure.ts) --------------------------------
  const namedSignatures = new Set<string>();
  for (const p of paths) if (p.pathway) namedSignatures.add(p.representation_signature);
  const cores: RouteCore[] = paths.map((p) => ({
    id: p.id,
    source: p.source,
    sinkForm: entity.get(p.sink)?.energy_form,
    phenomena: p.phenomena,
    families: (p as unknown as { _families: string[][] })._families,
    forms: p.energy_form_sequence,
    exact: !!p.pathway,
    knownDevice: (p as unknown as { _knownDevice: boolean })._knownDevice,
  }));
  const kinds = classify(cores, namedSignatures);
  const sigToPathway = new Map<string, string>();
  for (const p of paths) if (p.pathway) sigToPathway.set(p.representation_signature, p.pathway);
  for (const p of paths) {
    const k = kinds.get(p.id)!;
    p.structural_kind = p.pathway ? "composition" : k.kind;
    p.semantic_overlap = k.semanticOverlap ? (sigToPathway.get(p.representation_signature) ?? null) : null;
    p.dominated_by = k.dominatedBy;
    delete (p as unknown as { _families?: unknown })._families;
    delete (p as unknown as { _knownDevice?: unknown })._knownDevice;
  }

  // Matrix ---------------------------------------------------------------------------
  const pad = (n: number) => String(n).padStart(2, "0");
  const rows: MatrixAxis[] = disequilibria.map((d, i) => ({ id: d.id, address: `D.${pad(i + 1)}`, name: d.name, family: d.domain ?? "other" }));
  const couplings = canon.entities.filter((e) => e.type === "coupling");
  const cols: MatrixAxis[] = couplings.map((c, i) => ({ id: c.id, address: `C.${pad(i + 1)}`, name: c.name, family: c.domain ?? "other" }));

  const drives = new Map<string, Claim[]>();
  for (const c of canon.claims) {
    if (c.predicate !== "drives") continue;
    drives.set(c.subject, [...(drives.get(c.subject) ?? []), c]);
  }
  const forbiddenRows = new Set<string>();
  for (const c of canon.claims) {
    if (c.predicate === "bounded_by" && c.object === "constraint:second-law" && entity.get(c.subject)?.type === "disequilibrium") forbiddenRows.add(c.subject);
  }
  const pathsBySource = new Map<string, CompiledPath[]>();
  for (const p of paths) pathsBySource.set(p.source, [...(pathsBySource.get(p.source) ?? []), p]);

  const cells: MatrixCell[] = [];
  for (const r of rows) {
    for (const c of cols) {
      const direct = (drives.get(r.id) ?? []).filter((cl) => (memberOf.get(cl.object) ?? []).includes(c.id));
      const directPhenomena = [...new Set(direct.map((cl) => cl.object))];
      const bridges = (pathsBySource.get(r.id) ?? []).filter((p) => p.coupling_families.includes(c.id) && !directPhenomena.some((ph) => p.nodes[1] === ph));
      const searches = cellSearches.get(`${r.id}|${c.id}`) ?? [];
      const reviewed = searches.filter((s) => reviewedIds.has(s.id));
      const works = searches.reduce((a, s) => a + s.works_found, 0);
      const last = searches.map((s) => s.date).sort().at(-1);

      let status: MatrixCellStatus;
      if (direct.length) {
        const best = direct.reduce<EvidenceStatus>((acc, cl) => (EVIDENCE_RANK[cl.status] > EVIDENCE_RANK[acc] ? cl.status : acc), "invalid");
        if (direct.every((cl) => cl.evidence.length === 0)) status = "insufficient";
        else if (best === "established" || best === "replicated") status = "established";
        else if (best === "demonstrated" || best === "reported") status = "demonstrated";
        else if (best === "theoretically-predicted" || best === "hypothesised") status = "theoretical";
        else status = "contradicted";
      } else if (forbiddenRows.has(r.id)) status = "forbidden";
      else if (reviewed.some((s) => s.result === "demonstration-found")) status = "demonstrated";
      else if (bridges.some((b) => b.structural_kind === "composition" && (b.frontier_class === "candidate" || b.frontier_class === "derived" || b.frontier_class === "demonstrated"))) status = "candidate";
      else if (reviewed.some((s) => s.result === "no-demonstration-found")) status = "searched-none";
      else if (searches.length) status = "search-incomplete";
      else status = "not-searched";

      cells.push({
        row: r.id,
        col: c.id,
        status,
        direct_claims: direct.map((cl) => cl.id),
        direct_phenomena: directPhenomena,
        bridge_paths: bridges
          .sort(researchOrder)
          .slice(0, 12)
          .map((b) => b.id),
        address: `${r.address}:${c.address}`,
        searched: searches.length > 0,
        last_searched: last,
        works_found: searches.length ? works : undefined,
      });
    }
  }

  // Coverage ---------------------------------------------------------------------------
  const claimsBySubject = new Map<string, Claim[]>();
  for (const c of canon.claims) claimsBySubject.set(c.subject, [...(claimsBySubject.get(c.subject) ?? []), c]);
  const coverage: CoverageEntry[] = canon.domains.map((d) => {
    const phen = canon.entities.filter((e) => e.type === "phenomenon" && e.domain === d.id && (claimsBySubject.get(e.id) ?? []).length > 0);
    const phenIds = new Set(phen.map((p) => p.id));
    const dclaims = canon.claims.filter((c) => phenIds.has(c.subject) || phenIds.has(c.object));
    const withEvidence = dclaims.filter((c) => c.evidence.length > 0).length;
    const unresolved = dclaims.filter((c) => ["hypothesised", "disputed", "theoretically-predicted", "reported"].includes(c.status)).length;
    return {
      domain: d.id,
      name: d.name,
      phenomena: phen.length,
      target_phenomena: d.target_phenomena,
      claims: dclaims.length,
      claims_with_evidence: withEvidence,
      ontology_coverage: Math.min(1, phen.length / d.target_phenomena),
      literature_coverage: dclaims.length ? withEvidence / dclaims.length : 0,
      unresolved_claims: unresolved,
    };
  });

  // Meta ---------------------------------------------------------------------------------
  const hash = createHash("sha256");
  for (const f of [...canon.files].sort((a, b) => a.path.localeCompare(b.path))) hash.update(f.path).update("\0").update(f.text).update("\0");
  const data_hash = hash.digest("hex").slice(0, 12);
  const totalTargets = coverage.reduce((a, c) => a + c.target_phenomena, 0);
  const coverage_mean = coverage.reduce((a, c) => a + c.ontology_coverage * c.target_phenomena, 0) / (totalTargets || 1);
  const count = (t: Entity["type"]) => canon.entities.filter((e) => e.type === t).length;
  const cellsEmpty = cells.filter((c) => c.direct_claims.length === 0).length;
  const tally = <T,>(xs: T[], key: (x: T) => string): Record<string, number> => {
    const m: Record<string, number> = {};
    for (const x of xs) m[key(x)] = (m[key(x)] ?? 0) + 1;
    return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  };
  const searchDates = allSearches.map((x) => x.date).filter(Boolean).sort();
  // Route ids are ten hex characters of a SHA-1 over the ordered claim ids; a collision between two
  // different claim sequences would silently merge two routes, so it is a build failure.
  const seenIds = new Map<string, string>();
  for (const p of paths) {
    const key = p.claims.join(">");
    const prev = seenIds.get(p.id);
    if (prev !== undefined && prev !== key) throw new Error(`route id collision: ${p.id} is claimed by two different claim sequences`);
    seenIds.set(p.id, key);
  }

  return {
    meta: {
      version: opts.version ?? "0.1.0",
      built_at: opts.builtAt ?? new Date().toISOString(),
      data_hash,
      source_commit: opts.sourceCommit ?? null,
      search_indexed_through: searchDates.length ? searchDates[searchDates.length - 1] : null,
      counts: {
        entities: canon.entities.length,
        phenomena: count("phenomenon"),
        disequilibria: count("disequilibrium"),
        couplings: count("coupling"),
        transducers: count("transducer"),
        claims: canon.claims.length,
        sources: canon.sources.length,
        pathways_named: canon.pathways.length,
        paths_examined: paths.length,
        paths_demonstrated: paths.filter((p) => p.search_status === "demonstrated").length,
        paths_no_demonstration_found: paths.filter((p) => p.search_status === "searched-no-demonstration-found").length,
        paths_not_searched: paths.filter((p) => p.search_status === "not-searched").length,
        matrix_cells: cells.length,
        matrix_cells_empty: cellsEmpty,
        matrix_cells_unsearched: cells.filter((c) => c.status === "not-searched").length,
        coverage_mean,
        claims_by_status: tally(canon.claims, (c) => c.status),
        claims_by_predicate: tally(canon.claims, (c) => c.predicate),
        paths_by_search_status: tally(paths, (p) => p.search_status),
        paths_by_frontier_class: tally(paths, (p) => p.frontier_class),
        paths_by_structural_kind: tally(paths, (p) => p.structural_kind),
        matrix_cells_by_status: tally(cells, (c) => c.status),
        entities_by_type: tally(canon.entities, (e) => e.type),
      },
    },
    entities: canon.entities,
    claims: canon.claims,
    sources: canon.sources,
    pathways: canon.pathways,
    searches: allSearches.map((x) => ({ ...x, reviewed: reviewedIds.has(x.id) })),
    paths,
    matrix: { rows, cols, cells },
    coverage,
    source_verification: canon.sourceVerification,
  };
}
