/**
 * Browser-safe queries over a compiled Graph. No node imports here: the web app
 * loads graph.json once and builds this index on the client.
 */
import type { Claim, CompiledPath, Entity, Graph, MatrixCell, Pathway, Source } from "@pta/schema";

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
  private searchDocs: { id: string; text: string; name: string; type: string }[];

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
    }
    this.searchDocs = graph.entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      text: [e.name, ...(e.aliases ?? []), e.symbol ?? "", e.summary].join(" ").toLowerCase(),
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
    for (const c of claims) for (const s of c.evidence) {
      if (seen.has(s)) continue;
      seen.add(s);
      const src = this.source.get(s);
      if (src) out.push(src);
    }
    return out;
  }
  /** Concept search: tokens must all appear in name/aliases/summary. Names weigh more. */
  search(query: string, limit = 20): { entity: Entity; score: number }[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const hits: { entity: Entity; score: number }[] = [];
    for (const d of this.searchDocs) {
      let score = 0;
      for (const t of tokens) {
        if (!d.text.includes(t)) {
          score = -1;
          break;
        }
        if (d.name.toLowerCase().includes(t)) score += 3;
        else score += 1;
      }
      if (score < 0) continue;
      if (d.name.toLowerCase() === q) score += 10;
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
