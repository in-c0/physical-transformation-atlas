import Link from "next/link";
import type { Source } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { CELL_STATUS_LABEL, claimHref, hrefFor } from "@/lib/format";
import { ClaimLine } from "./ClaimLine";
import { StatusMark } from "./StatusMark";
import { pathTitle } from "./PathView";
import { CiteBlock } from "./CiteBlock";
import { Explore, MatrixLegendLine } from "./Pieces";
import styles from "./EntityView.module.css";

/** One source as a record: why it is in the atlas, what it supports, and its bibliographic data. */
export function SourceView({ index, source }: { index: AtlasIndex; source: Source }) {
  const v = index.graph.source_verification[source.id];
  const claims = index.claimsCiting(source.id);
  const pathways = index.pathwaysCiting(source.id);
  const routesByPathway = new Map(index.graph.paths.filter((p) => p.pathway).map((p) => [p.pathway!, p]));

  // Atlas context, derived strictly from the citing claims: families, cells and routes reached through them.
  const families = new Map<string, { id: string; name: string; address: string }>();
  const cells = new Map<string, { row: string; col: string; driver: string; family: string; status: string; address: string }>();
  const routes = new Map<string, (typeof index.graph.paths)[number]>();
  for (const c of claims) {
    for (const r of index.pathsWithClaim(c.id)) routes.set(r.id, r);
    const phen = [c.subject, c.object].find((id) => index.entity.get(id)?.type === "phenomenon");
    if (!phen) continue;
    for (const f of index.families(phen)) {
      const col = index.colAxis(f);
      if (col) families.set(f, { id: f, name: col.name, address: col.address });
      for (const d of index.claimsTo(phen)) {
        if (d.predicate !== "drives" || !d.subject.startsWith("disequilibrium:")) continue;
        const row = index.rowAxis(d.subject);
        const cell = index.cellFor(d.subject, f);
        if (row && col && cell) cells.set(cell.address, { row: row.address, col: col.address, driver: row.name, family: col.name, status: cell.status, address: cell.address });
      }
    }
  }
  const routeList = [...routes.values()].sort((a, b) => (a.search_status === "demonstrated" ? -1 : 1) - (b.search_status === "demonstrated" ? -1 : 1) || a.length - b.length).slice(0, 12);

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
          {source.doi && (
            <span>
              <a href={`https://doi.org/${source.doi}`} rel="noopener" target="_blank">
                doi:{source.doi}
              </a>
            </span>
          )}
          {!source.doi && source.url && (
            <span>
              <a href={source.url} rel="noopener" target="_blank">
                {source.url}
              </a>
            </span>
          )}
        </div>
        <p className={styles.record}>
          Atlas use: this {source.type} is cited as evidence by {claims.length} claim{claims.length === 1 ? "" : "s"} and {pathways.length} named pathway{pathways.length === 1 ? "" : "s"}.
          {v
            ? v.verified
              ? ` Bibliographic record verified against Crossref on ${v.checked_at.slice(0, 10)}.`
              : ` Crossref did not match this record on ${v.checked_at.slice(0, 10)}${v.note ? ` (${v.note})` : ""}.`
            : source.doi
              ? " Not yet checked against Crossref."
              : " No DOI or URL on record; not machine-verifiable."}
        </p>
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
        <Explore
          items={[
            ...(families.size || cells.size || routes.size ? [{ label: "atlas context", href: "#context" }] : []),
            { label: "claims citing it", href: "#claims" },
            ...(pathways.length ? [{ label: "pathways citing it", href: "#pathways" }] : []),
            { label: "cite", href: "#cite" },
          ]}
        />
      </header>

      {(families.size > 0 || cells.size > 0 || routes.size > 0) && (
        <section className={styles.section} id="context">
          <h2 className="label">Atlas context</h2>
          <p className="t-micro secondary" style={{ marginBottom: 6 }}>
            Derived from the citing claims only: the families, matrix cells and routes those claims take part in.
          </p>
          {families.size > 0 && (
            <div className={styles.cells}>
              {[...families.values()].map((f) => (
                <Link key={f.id} className={styles.cellLink} href={hrefFor(f.id)}>
                  family: {f.name} ({f.address})
                </Link>
              ))}
            </div>
          )}
          {cells.size > 0 && (
            <>
              <MatrixLegendLine />
              <div className={styles.cells}>
                {[...cells.values()].map((c) => (
                  <Link
                    key={c.address}
                    className={styles.cellLink}
                    href={`/matrix?cell=${c.address}`}
                    title={`${c.driver} × ${c.family}: ${CELL_STATUS_LABEL[c.status as keyof typeof CELL_STATUS_LABEL]}`}
                  >
                    <StatusMark status={c.status as keyof typeof CELL_STATUS_LABEL} />
                    {c.row} × {c.col} · {c.driver} × {c.family}
                  </Link>
                ))}
              </div>
            </>
          )}
          {routeList.length > 0 && (
            <ul className={styles.paths} style={{ marginTop: 8 }}>
              {routeList.map((p) => (
                <li key={p.id}>
                  <Link href={`/path/${p.id.slice(2)}`}>{pathTitle(index, p)}</Link>
                  <span className={styles.pathMeta}>{p.search_status === "demonstrated" ? "composition evidence recorded" : `${p.established_steps}/${p.length} established`}</span>
                </li>
              ))}
            </ul>
          )}
          {routes.size > routeList.length && (
            <p className="t-micro secondary" style={{ marginTop: 6 }}>
              first {routeList.length} of {routes.size} routes shown
            </p>
          )}
        </section>
      )}

      <section className={styles.section} id="claims">
        <h2 className="label">Claims citing this source · {claims.length}</h2>
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
        <section className={styles.section} id="pathways">
          <h2 className="label">Named pathways citing this source · {pathways.length}</h2>
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
