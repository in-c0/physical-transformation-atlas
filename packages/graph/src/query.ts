/**
 * Browser-safe queries over a compiled Graph. No node imports here: the web app
 * loads graph.json once and builds this index on the client.
 */
import type { Claim, CompiledPath, Entity, Graph, MatrixCell, Pathway, Source } from "@pta/schema";

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

export class AtlasIndex {
  readonly entity: Map<string, Entity>;
  readonly claim: Map<string, Claim>;
  readonly source: Map<string, Source>;
  readonly path: Map<string, CompiledPath>;
  readonly pathway: Map<string, Pathway>;
  readonly cell: Map<string, MatrixCell>;
  readonly cellByAddress: Map<string, MatrixCell>;
  private bySubject = new Map<string, Claim[]>();
  private byObject = new Map<string, Claim[]>();
  private pathsByNode = new Map<string, CompiledPath[]>();
  private pathsByClaim = new Map<string, CompiledPath[]>();
  private claimsBySource = new Map<string, Claim[]>();
  private pathwaysBySource = new Map<string, Pathway[]>();
  private searchDocs: {
    id: string;
    name: string;
    nameWords: string[];
    textWords: string[];
    type: string;
  }[];

  constructor(public readonly graph: Graph) {
    this.entity = new Map(graph.entities.map((e) => [e.id, e]));
    this.claim = new Map(graph.claims.map((c) => [c.id, c]));
    this.source = new Map(graph.sources.map((s) => [s.id, s]));
    this.path = new Map(graph.paths.map((p) => [p.id, p]));
    this.pathway = new Map(graph.pathways.map((p) => [p.id, p]));
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
    this.searchDocs = graph.entities.map((e) => ({
      id: e.id,
      name: e.name.toLowerCase(),
      nameWords: words([e.name, ...(e.aliases ?? [])].join(" ")),
      textWords: words([e.summary, e.symbol ?? ""].join(" ")),
      type: e.type,
    }));
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
  search(query: string, limit = 20): { entity: Entity; score: number }[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const tokens = q.split(/[\s,;.()/]+/).filter((t) => t.length >= 3 && !STOP.has(t));
    if (tokens.length === 0) return [];
    const hits: { entity: Entity; score: number }[] = [];
    // A token matches a word when the word starts with it ("heat" ⊂ "heated"), never mid-word
    // ("rain" must not match "strain").
    const wordHit = (words: string[], t: string) => words.some((w) => w === t || (t.length >= 4 && w.startsWith(t)) || (w.length >= 5 && t.startsWith(w)));
    for (const d of this.searchDocs) {
      let score = 0;
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
      if (matched === 0) continue;
      if (matched === tokens.length) score += 2;
      if (d.name === q) score += 10;
      // A concept search is for drivers and effects; quantities and materials rank below.
      if (d.type === "disequilibrium" || d.type === "phenomenon") score += 1;
      hits.push({ entity: this.entity.get(d.id)!, score });
    }
    return hits.sort((a, b) => b.score - a.score || a.entity.name.localeCompare(b.entity.name)).slice(0, limit);
  }
}

export function describeStep(index: AtlasIndex, claim: Claim): string {
  const s = index.entity.get(claim.subject)?.name ?? claim.subject;
  const o = index.entity.get(claim.object)?.name ?? claim.object;
  return `${s} —${claim.predicate.replace(/_/g, " ")}→ ${o}`;
}
