"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { CompiledPath, FrontierClass } from "@pta/schema";
import { FRONTIER_CLASSES } from "@pta/schema";
import { useAtlas } from "@/lib/client-data";
import { EVIDENCE_LABEL, FRONTIER_LABEL, OVERLAP_LABEL, compositionState, hrefFor } from "@/lib/format";
import { CheckGlyph } from "./StatusMark";
import styles from "./FrontierList.module.css";

type Filters = { source: string; sink: string; establishedOnly: boolean; minLen: number; maxLen: number; env: string; classes: Set<FrontierClass>; family: string; q: string };

const DEFAULT: Filters = { source: "", sink: "", establishedOnly: false, minLen: 2, maxLen: 7, env: "", classes: new Set<FrontierClass>(["candidate"]), family: "", q: "" };

export function FrontierList() {
  const atlas = useAtlas();
  const [f, setF] = useState<Filters>(DEFAULT);
  const [limit, setLimit] = useState(60);

  const data = useMemo(() => {
    if (atlas.status !== "ready") return null;
    const index = atlas.index;
    const g = index.graph;
    const sources = g.matrix.rows;
    const sinks = g.entities.filter((e) => e.type === "output");
    const families = g.matrix.cols;
    const envs = [...new Set(g.claims.flatMap((c) => c.condition_tags))].sort();
    const claimTags = (p: CompiledPath) => new Set(p.claims.flatMap((id) => index.claim.get(id)?.condition_tags ?? []));
    const q = f.q.trim().toLowerCase();
    const list = g.paths.filter((p) => {
      if (!f.classes.has(p.frontier_class)) return false;
      if (f.source && p.source !== f.source) return false;
      if (f.sink && p.sink !== f.sink) return false;
      if (f.family && !p.coupling_families.includes(f.family)) return false;
      if (f.establishedOnly && p.established_steps < p.length) return false;
      if (p.length < f.minLen || p.length > f.maxLen) return false;
      if (f.env && !claimTags(p).has(f.env)) return false;
      if (q && !p.nodes.some((n) => (index.entity.get(n)?.name ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
    // Shortest, best-supported first; demonstrated last unless asked for.
    list.sort((a, b) => b.established_steps / b.length - a.established_steps / a.length || a.length - b.length || a.id.localeCompare(b.id));
    return { index, sources, sinks, families, envs, list };
  }, [atlas, f]);

  if (atlas.status === "loading") {
    return (
      <div className={styles.state}>
        <p>Loading atlas index…</p>
      </div>
    );
  }
  if (atlas.status === "error") {
    return (
      <div className={styles.state}>
        <p>Atlas data could not be loaded.</p>
        <p className="secondary">
          The interface is available, but evidence and status data are unavailable.{" "}
          <button type="button" className={styles.link} onClick={atlas.retry}>
            Retry
          </button>
        </p>
      </div>
    );
  }
  const { index, sources, sinks, families, envs, list } = data!;
  const set = (patch: Partial<Filters>) => {
    setF({ ...f, ...patch });
    setLimit(60);
  };
  const toggleClass = (c: FrontierClass) => {
    const next = new Set(f.classes);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    set({ classes: next });
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.filters} onSubmit={(e) => e.preventDefault()}>
        <label>
          <span className="label">Input</span>
          <select value={f.source} onChange={(e) => set({ source: e.target.value })}>
            <option value="">all</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.address} {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Output</span>
          <select value={f.sink} onChange={(e) => set({ sink: e.target.value })}>
            <option value="">all</option>
            {sinks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Coupling</span>
          <select value={f.family} onChange={(e) => set({ family: e.target.value })}>
            <option value="">all</option>
            {families.map((s) => (
              <option key={s.id} value={s.id}>
                {s.address} {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Environment</span>
          <select value={f.env} onChange={(e) => set({ env: e.target.value })}>
            <option value="">any</option>
            {envs.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Path length</span>
          <span className={styles.range}>
            <input type="number" min={1} max={7} value={f.minLen} onChange={(e) => set({ minLen: Number(e.target.value) })} aria-label="minimum steps" />
            –
            <input type="number" min={1} max={7} value={f.maxLen} onChange={(e) => set({ maxLen: Number(e.target.value) })} aria-label="maximum steps" />
          </span>
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={f.establishedOnly} onChange={(e) => set({ establishedOnly: e.target.checked })} />
          <span className="label">established edges only</span>
        </label>
        <label>
          <span className="label">Contains</span>
          <input type="search" value={f.q} placeholder="phenomenon or carrier" onChange={(e) => set({ q: e.target.value })} />
        </label>
        <div className={styles.classes} role="group" aria-label="Status">
          <span className="label">Status</span>
          {FRONTIER_CLASSES.map((c) => (
            <button key={c} type="button" className={`${styles.chip} ${f.classes.has(c) ? styles.chipOn : ""}`} aria-pressed={f.classes.has(c)} onClick={() => toggleClass(c)}>
              {FRONTIER_LABEL[c]}
            </button>
          ))}
        </div>
      </form>

      <div className={styles.count}>
        <span className="t-data">
          {list.length} of {index.graph.paths.length} examined routes match
        </span>
        {list.length === 0 && <span className="t-data secondary"> · No relations match these filters. The underlying atlas has not changed.</span>}
      </div>

      <ol className={styles.list}>
        {list.slice(0, limit).map((p, i) => {
          const named = p.pathway ? index.pathway.get(p.pathway) : undefined;
          return (
            <li key={p.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.num}>{String(i + 1).padStart(4, "0")}</span>
                <span className={`t-micro st-${p.frontier_class === "forbidden" ? "contradicted" : p.frontier_class === "demonstrated" ? "demonstrated" : p.frontier_class === "derived" ? "search-incomplete" : "candidate"}`}>{FRONTIER_LABEL[p.frontier_class].toUpperCase()}</span>
                <span className="t-micro secondary">{p.id}</span>
                {named && <span className="t-micro secondary">· {named.name}</span>}
              </div>
              <div className={styles.chain}>
                {p.nodes.map((n, k) => (
                  <span key={n + k}>
                    <Link href={hrefFor(n)}>{index.entity.get(n)?.name ?? n}</Link>
                  </span>
                ))}
              </div>
              <dl className={styles.facts}>
                <dt>constituents</dt>
                <dd>
                  {p.established_steps}/{p.length} established · weakest {EVIDENCE_LABEL[p.evidence_status]} · floor {p.constituent_floor}
                </dd>
                <dt>exact composition</dt>
                <dd>{compositionState(p.search_status, p.last_searched).long}</dd>
                {p.known_pathway_overlap && p.known_pathway_overlap.relation !== "exact" && (
                  <>
                    <dt>recorded pathway</dt>
                    <dd>
                      {OVERLAP_LABEL[p.known_pathway_overlap.relation]} {index.pathway.get(p.known_pathway_overlap.pathway)?.name} · {p.known_pathway_overlap.shared_claims}/{p.known_pathway_overlap.route_claims} relations
                    </dd>
                  </>
                )}
                <dt>checks</dt>
                <dd className={styles.checks}>
                  {p.checks.map((k) => (
                    <span key={k.id} title={`${k.label}: ${k.result} — ${k.detail}`}>
                      <CheckGlyph result={k.result} />
                    </span>
                  ))}
                </dd>
                <dt>sources</dt>
                <dd>
                  {p.composition_source_ids.length} for the composition · {p.constituent_source_ids.length} for the constituent relations
                </dd>
              </dl>
              <div className={styles.actions}>
                <Link className={styles.link} href={`/path/${p.id.slice(2)}`}>
                  Open path
                </Link>
                {p.coupling_families[0] && index.rowAxis(p.source) && (
                  <Link className={styles.link} href={`/matrix?cell=${index.rowAxis(p.source)!.address}:${index.colAxis(p.coupling_families[0])!.address}`}>
                    Matrix cell
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {list.length > limit && (
        <button type="button" className={styles.more} onClick={() => setLimit(limit + 60)}>
          Show {Math.min(60, list.length - limit)} more of {list.length - limit} remaining
        </button>
      )}
    </div>
  );
}
