/**
 * Browser-safe queries over a compiled Graph. No node imports here: the web app
 * loads graph.json once and builds this index on the client.
 */
import type { Claim, CompiledPath, CompiledSystemPathway, Entity, Graph, MatrixCell, Pathway, Source } from "@pta/schema";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "that",
  "this",
  "what",
  "which",
  "how",
  "can",
  "does",
  "are",
  "was",
  "were",
  "has",
  "have",
  "you",
  "your",
  "its",
  "than",
  "then",
  "when",
  "where",
  "about",
  "using",
  "use",
  "via",
  "any",
  "all",
  "one",
  "two",
  "energy",
  "effect",
]);

export type SearchHit =
  { kind: "entity"; id: string; name: string; type: string; href: string; entity: Entity; score: number } | { kind: "pathway"; id: string; name: string; type: "pathway"; href: string; score: number };

/** Page href for an entity id; duplicated from the web app's format.ts so the index stays framework-free. */
export function entityHref(id: string): string {
  const [type, slug] = id.split(":");
  return type === "phenomenon" ? `/phenomenon/${slug}` : `/e/${type}/${slug}`;
}

export class AtlasIndex {
  readonly entity: Map<string, Entity>;
  readonly claim: Map<string, Claim>;
  readonly source: Map<string, Source>;
  readonly path: Map<string, CompiledPath>;
  readonly pathway: Map<string, Pathway>;
  /** The system layer (pass 34). */
  readonly system: Map<string, CompiledSystemPathway>;
  readonly cell: Map<string, MatrixCell>;
  readonly cellByAddress: Map<string, MatrixCell>;
  private bySubject = new Map<string, Claim[]>();
  private byObject = new Map<string, Claim[]>();
  private pathsByNode = new Map<string, CompiledPath[]>();
  private pathsByClaim = new Map<string, CompiledPath[]>();
  private claimsBySource = new Map<string, Claim[]>();
  private pathwaysBySource = new Map<string, Pathway[]>();
  private searchDocs: {
    kind: "entity" | "pathway";
    id: string;
    name: string;
    nameWords: string[];
    aliasNames: string[];
    textWords: string[];
    symbol: string;
    type: string;
    /** For pathways: the compiled route that records it, when one exists. */
    routeId?: string;
  }[];

  /** The systems a named pathway is a member of (pass 34). */
  systemsOfPathway(pathwayId: string): CompiledSystemPathway[] {
    return [...this.system.values()].filter((s) => s.members.some((m) => m.pathway === pathwayId));
  }

  constructor(public readonly graph: Graph) {
    this.entity = new Map(graph.entities.map((e) => [e.id, e]));
    this.claim = new Map(graph.claims.map((c) => [c.id, c]));
    this.source = new Map(graph.sources.map((s) => [s.id, s]));
    this.path = new Map(graph.paths.map((p) => [p.id, p]));
    this.pathway = new Map(graph.pathways.map((p) => [p.id, p]));
    this.system = new Map((graph.systems ?? []).map((s) => [s.id, s]));
    this.cell = new Map(graph.matrix.cells.map((c) => [`${c.row}|${c.col}`, c]));
    this.cellByAddress = new Map(graph.matrix.cells.map((c) => [c.address, c]));
    for (const c of graph.claims) {
      this.bySubject.set(c.subject, [...(this.bySubject.get(c.subject) ?? []), c]);
      this.byObject.set(c.object, [...(this.byObject.get(c.object) ?? []), c]);
    }
    for (const p of graph.paths) {
      for (const n of new Set(p.nodes)) this.pathsByNode.set(n, [...(this.pathsByNode.get(n) ?? []), p]);
      for (const c of new Set(p.claims)) this.pathsByClaim.set(c, [...(this.pathsByClaim.get(c) ?? []), p]);
    }
    for (const c of graph.claims) for (const s of new Set(c.evidence)) this.claimsBySource.set(s, [...(this.claimsBySource.get(s) ?? []), c]);
    for (const p of graph.pathways) {
      const cited = new Set<string>(p.evidence ?? []);
      for (const m of p.performance?.measurements ?? []) for (const s of m.sources) cited.add(s);
      for (const s of cited) this.pathwaysBySource.set(s, [...(this.pathwaysBySource.get(s) ?? []), p]);
    }
    const words = (s: string) =>
      s
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
    const routeOfPathway = new Map(graph.paths.filter((p) => p.pathway).map((p) => [p.pathway!, p.id]));
    for (const p of graph.paths) for (const v of p.variants ?? []) routeOfPathway.set(v.pathway, p.id);
    this.searchDocs = graph.entities.map((e) => ({
      kind: "entity" as const,
      id: e.id,
      name: e.name.toLowerCase(),
      nameWords: words([e.name, ...(e.aliases ?? [])].join(" ")),
      aliasNames: (e.aliases ?? []).map((a) => a.toLowerCase()),
      textWords: words([e.summary].join(" ")),
      // Symbols are matched whole, case-insensitively, so "ΔT" and "∇T" find the driver they denote.
      symbol: (e.symbol ?? "").toLowerCase().replace(/\s+/g, ""),
      type: e.type,
    }));
    // Named pathways are searchable by name and summary ("waste heat" → Thermoelectric generator).
    for (const pw of graph.pathways) {
      this.searchDocs.push({
        kind: "pathway",
        id: pw.id,
        name: pw.name.toLowerCase(),
        nameWords: words(pw.name),
        aliasNames: [],
        textWords: words(pw.summary),
        symbol: "",
        type: "pathway",
        routeId: routeOfPathway.get(pw.id),
      });
    }
  }

  private properNouns?: Set<string>;
  /**
   * Whether a capitalised word is a proper noun (Seebeck, Onsager, Carnot): true when it appears
   * capitalised somewhere other than sentence-initially in any name or summary of the atlas.
   */
  isProperNoun(word: string): boolean {
    if (!this.properNouns) {
      this.properNouns = new Set();
      const texts = this.graph.entities.flatMap((e) => [e.name, e.summary, ...(e.aliases ?? [])]);
      for (const t of texts) for (const m of t.matchAll(/(?<=[^.!?]\s)([A-Z][a-zA-Z]+)/g)) this.properNouns.add(m[1]);
    }
    return this.properNouns.has(word);
  }
  /** Human label for a condition tag ("medium-conductor" → "conductor required"). */
  conditionLabel(tag: string): string {
    return this.graph.ontology?.condition_tags.find((t) => t.id === tag)?.label ?? tag.replace(/-/g, " ");
  }
  conditionDescription(tag: string): string | undefined {
    return this.graph.ontology?.condition_tags.find((t) => t.id === tag)?.description;
  }
  claimsFrom(id: string): Claim[] {
    return this.bySubject.get(id) ?? [];
  }
  claimsTo(id: string): Claim[] {
    return this.byObject.get(id) ?? [];
  }
  claimsAbout(id: string): Claim[] {
    return [...this.claimsFrom(id), ...this.claimsTo(id)];
  }
  pathsThrough(id: string): CompiledPath[] {
    return this.pathsByNode.get(id) ?? [];
  }
  /** Every enumerated route that uses this claim as a step. */
  pathsWithClaim(claimId: string): CompiledPath[] {
    return this.pathsByClaim.get(claimId) ?? [];
  }
  /** Claims citing this source. */
  claimsCiting(sourceId: string): Claim[] {
    return this.claimsBySource.get(sourceId) ?? [];
  }
  /** Named pathways citing this source, in their evidence or a measurement. */
  pathwaysCiting(sourceId: string): Pathway[] {
    return this.pathwaysBySource.get(sourceId) ?? [];
  }
  /** Ids of entities one claim away from `id`. */
  neighbours(id: string): string[] {
    const s = new Set<string>();
    for (const c of this.claimsFrom(id)) s.add(c.object);
    for (const c of this.claimsTo(id)) s.add(c.subject);
    return [...s];
  }
  families(phenomenonId: string): string[] {
    return this.claimsFrom(phenomenonId)
      .filter((c) => c.predicate === "member_of")
      .map((c) => c.object);
  }
  cellFor(row: string, col: string): MatrixCell | undefined {
    return this.cell.get(`${row}|${col}`);
  }
  rowAxis(id: string) {
    return this.graph.matrix.rows.find((r) => r.id === id);
  }
  colAxis(id: string) {
    return this.graph.matrix.cols.find((c) => c.id === id);
  }
  /** Sources cited by a set of claims, deduplicated, in first-citation order. */
  sourcesFor(claims: Claim[]): Source[] {
    const seen = new Set<string>();
    const out: Source[] = [];
    for (const c of claims)
      for (const s of c.evidence) {
        if (seen.has(s)) continue;
        seen.add(s);
        const src = this.source.get(s);
        if (src) out.push(src);
      }
    return out;
  }
  /**
   * Concept search. A phrase like "window heated by sunlight" should resolve to the
   * disequilibria and phenomena it touches, so any token may match; results rank by
   * how many tokens matched, with name and alias matches weighted above summary text.
   * Stop words are dropped; tokens shorter than three characters are ignored.
   */
  search(query: string, limit = 20): SearchHit[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const compact = q.replace(/\s+/g, "");
    const tokens = q.split(/[\s,;.()/]+/).filter((t) => t.length >= 3 && !STOP.has(t));
    const hits: (SearchHit & { full: boolean })[] = [];
    const toHit = (d: (typeof this.searchDocs)[number], score: number, full: boolean): SearchHit & { full: boolean } =>
      d.kind === "pathway"
        ? { kind: "pathway", id: d.id, name: this.pathway.get(d.id)!.name, type: "pathway", href: this.pathway.get(d.id)!.variant_of ? `/pathway/${d.id.split(":")[1]}` : d.routeId ? `/path/${d.routeId.slice(2)}` : "/frontier", score, full }
        : { kind: "entity", id: d.id, name: this.entity.get(d.id)!.name, type: d.type, href: entityHref(d.id), entity: this.entity.get(d.id)!, score, full };
    // A symbol query ("ΔT", "∇p", "Δμ") is shorter than a word token; match it whole.
    if (tokens.length === 0) {
      for (const d of this.searchDocs) if (d.symbol && d.symbol === compact) hits.push(toHit(d, 12, true));
      return hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
    }
    // An exactly named coupling lifts its member phenomena and the disequilibria that drive them
    // ("osmotic power" → the osmotic family, then PRO / RED, then the salinity gradient).
    const lifted = new Map<string, number>();
    for (const d of this.searchDocs) {
      if (d.kind !== "entity" || d.type !== "coupling") continue;
      if (d.name !== q && !d.aliasNames.includes(q) && !tokens.every((t, i) => d.nameWords[i] === t)) continue;
      for (const c of this.claimsTo(d.id)) {
        if (c.predicate !== "member_of") continue;
        lifted.set(c.subject, Math.max(lifted.get(c.subject) ?? 0, 5));
        for (const drv of this.claimsTo(c.subject)) if (drv.predicate === "drives" && drv.subject.startsWith("disequilibrium:")) lifted.set(drv.subject, Math.max(lifted.get(drv.subject) ?? 0, 4));
      }
    }
    // A token matches a word when the word starts with it ("heat" ⊂ "heated"), never mid-word
    // ("rain" must not match "strain").
    const wordHit = (words: string[], t: string) => words.some((w) => w === t || (t.length >= 4 && w.startsWith(t)) || (w.length >= 5 && t.startsWith(w)));
    for (const d of this.searchDocs) {
      let score = lifted.get(d.id) ?? 0;
      let matched = 0;
      for (const t of tokens) {
        if (wordHit(d.nameWords, t)) {
          score += 4;
          matched++;
        } else if (wordHit(d.textWords, t)) {
          score += 1;
          matched++;
        }
      }
      if (matched === 0 && score === 0) continue;
      const full = matched === tokens.length;
      if (full) score += 2;
      // The entity whose name (or an alias) is exactly the query outranks everything that merely contains it.
      if (d.name === q) score += 10;
      else if (tokens.every((t, i) => d.nameWords[i] === t))
        score += 6; // the name starts with the query: "seebeck" → Seebeck effect
      else if (d.aliasNames.includes(q)) score += 5;
      if (d.symbol && d.symbol === compact) score += 12;
      // A concept search is for drivers and effects; quantities and materials rank below.
      if (d.type === "disequilibrium" || d.type === "phenomenon") score += 1;
      hits.push(toHit(d, score, full || (lifted.get(d.id) ?? 0) > 0));
    }
    // Every record matching all tokens precedes any record matching only some of them.
    return hits
      .sort((a, b) => Number(b.full) - Number(a.full) || b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map(({ full: _full, ...h }) => h);
  }
}

export function describeStep(index: AtlasIndex, claim: Claim): string {
  const s = index.entity.get(claim.subject)?.name ?? claim.subject;
  const o = index.entity.get(claim.object)?.name ?? claim.object;
  return `${s} —${claim.predicate.replace(/_/g, " ")}→ ${o}`;
}
