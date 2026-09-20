import Link from "next/link";
import type { Source } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { claimHref } from "@/lib/format";
import { ClaimLine } from "./ClaimLine";
import { CiteBlock } from "./CiteBlock";
import styles from "./EntityView.module.css";

/** One source as a record: its bibliographic data, verification, and every claim and pathway that cites it. */
export function SourceView({ index, source }: { index: AtlasIndex; source: Source }) {
  const v = index.graph.source_verification[source.id];
  const claims = index.claimsCiting(source.id);
  const pathways = index.pathwaysCiting(source.id);
  const routesByPathway = new Map(index.graph.paths.filter((p) => p.pathway).map((p) => [p.pathway!, p]));
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">
          Source · {source.id} · {source.type}
        </div>
        <h1 className="t-title">{source.title}</h1>
        <div className={styles.meta}>
          {source.authors.length > 0 && <span>{source.authors.join(", ")}</span>}
          {source.year && <span>{source.year}</span>}
          {source.venue && <span>{source.venue}</span>}
        </div>
        <div className={styles.meta}>
          {source.doi && (
            <span>
              <a href={`https://doi.org/${source.doi}`} rel="noopener" target="_blank">
                doi:{source.doi}
              </a>
              {v && (v.verified ? ` · crossref ✓ ${v.checked_at.slice(0, 10)}` : ` · crossref: not matched ${v.checked_at.slice(0, 10)}`)}
            </span>
          )}
          {!source.doi && source.url && (
            <span>
              <a href={source.url} rel="noopener" target="_blank">
                {source.url}
              </a>
            </span>
          )}
          {!source.doi && !source.url && <span>no DOI or URL on record</span>}
        </div>
        {v?.crossref_title && v.crossref_title !== source.title && (
          <p className="t-micro secondary" style={{ marginTop: 6 }}>
            Crossref title: {v.crossref_title}
          </p>
        )}
        {source.notes && (
          <p className="t-ui secondary" style={{ marginTop: 8, fontWeight: 400 }}>
            {source.notes}
          </p>
        )}
        <div className={styles.readouts}>
          <span className={styles.readout}>
            <b>{claims.length}</b>
            <span className="label">claims cite it</span>
          </span>
          <span className={styles.readout}>
            <b>{pathways.length}</b>
            <span className="label">pathways cite it</span>
          </span>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className="label">Claims citing this source</h2>
        {claims.length === 0 ? (
          <p className="t-data secondary">No claim cites this source.</p>
        ) : (
          <div>
            {claims.map((c) => (
              <div key={c.id}>
                <ClaimLine claim={c} index={index} showConditions={false} />
                <div className="t-micro secondary" style={{ margin: "-4px 0 8px" }}>
                  <Link href={claimHref(c.id)}>{c.id}</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pathways.length > 0 && (
        <section className={styles.section}>
          <h2 className="label">Pathways citing this source</h2>
          <ul className={styles.paths}>
            {pathways.map((p) => {
              const route = routesByPathway.get(p.id);
              return (
                <li key={p.id}>
                  {route ? <Link href={`/path/${route.id.slice(2)}`}>{p.name}</Link> : <span>{p.name}</span>}
                  <span className={styles.pathMeta}>{p.status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <CiteBlock kind="source" id={source.id} title={source.title} revision={index.graph.meta.data_hash} />
    </article>
  );
}
