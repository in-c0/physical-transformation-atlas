import Link from "next/link";
import type { Claim } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { CELL_STATUS_LABEL, EVIDENCE_LABEL, FRONTIER_LABEL, claimSentence, hrefFor, kLabel, predicateLabel } from "@/lib/format";
import { EvidenceList } from "./EvidenceList";
import { StatusMark } from "./StatusMark";
import { pathTitle } from "./PathView";
import { CiteBlock } from "./CiteBlock";
import { ConditionTags, Explore, MatrixLegendLine } from "./Pieces";
import styles from "./EntityView.module.css";

/** Cells a phenomenon supplies the direct relation for: (canonical driver row) × (member family column). */
function cellsForPhenomenon(index: AtlasIndex, phenomenonId: string) {
  const drivers = index.claimsTo(phenomenonId).filter((c) => c.predicate === "drives" && c.subject.startsWith("disequilibrium:"));
  return drivers.flatMap((d) =>
    index
      .families(phenomenonId)
      .map((f) => ({ driver: index.entity.get(d.subject)!, row: index.rowAxis(d.subject), col: index.colAxis(f), cell: index.cellFor(d.subject, f) }))
      .filter((x) => x.row && x.col && x.cell),
  );
}

/**
 * One claim as a citable record: what the atlas asserts, the conditions it holds under, its
 * ledger and constitutive relation, its evidence, where it sits in the matrix, and what is built on it.
 */
export function ClaimView({ index, claim }: { index: AtlasIndex; claim: Claim }) {
  const s = index.entity.get(claim.subject);
  const o = index.entity.get(claim.object);
  const subjectName = s?.name ?? claim.subject;
  const objectName = o?.name ?? claim.object;
  const sources = index.sourcesFor([claim]);
  const routes = index.pathsWithClaim(claim.id);
  const withEvidence = routes.filter((p) => p.search_status === "demonstrated");
  const pathways = index.graph.pathways.filter((p) => p.steps.includes(claim.id));
  const pathwayRouteIds = new Set(routes.filter((r) => r.pathway && pathways.some((p) => p.id === r.pathway)).map((r) => r.id));
  const otherRoutes = routes.filter((r) => !pathwayRouteIds.has(r.id));
  const topRoutes = [...otherRoutes].sort((a, b) => (a.search_status === "demonstrated" ? -1 : 1) - (b.search_status === "demonstrated" ? -1 : 1) || a.length - b.length).slice(0, 24);

  // Cells this claim itself determines: a disequilibrium —drives→ phenomenon claim feeds the row × each family of the phenomenon.
  const rowAxis = s?.type === "disequilibrium" && claim.predicate === "drives" ? index.rowAxis(s.id) : undefined;
  const feeds =
    rowAxis && o?.type === "phenomenon"
      ? index
          .families(o.id)
          .map((f) => ({ col: index.colAxis(f), cell: index.cellFor(s!.id, f) }))
          .filter((x) => x.col && x.cell)
      : [];
  // Related context for every other claim: the families and cells of the phenomenon it is about.
  const contextPhenomenon = feeds.length === 0 ? (s?.type === "phenomenon" ? s : o?.type === "phenomenon" ? o : undefined) : undefined;
  const contextFamilies = contextPhenomenon
    ? index
        .families(contextPhenomenon.id)
        .map((f) => index.colAxis(f))
        .filter(Boolean)
    : [];
  const contextCells = contextPhenomenon ? cellsForPhenomenon(index, contextPhenomenon.id) : [];

  const title = `${subjectName} —${predicateLabel(claim.predicate)}→ ${objectName}`;
  const statement = claimSentence(claim.status, { name: subjectName, type: s?.type ?? "" }, claim.predicate, { name: objectName, type: o?.type ?? "" }, claim.conditions.length > 0, (w) =>
    index.isProperNoun(w),
  );

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">Claim · {claim.id}</div>
        <h1 className="t-title">
          <Link href={hrefFor(claim.subject)}>{subjectName}</Link> <span className="secondary">—{predicateLabel(claim.predicate)}→</span> <Link href={hrefFor(claim.object)}>{objectName}</Link>
        </h1>
        <p className={styles.record}>{statement}</p>
        <div className={styles.meta}>
          <span className={`ev-${claim.status}`}>{EVIDENCE_LABEL[claim.status]}</span>
          {claim.knowledge_level && <span>{kLabel(claim.knowledge_level)}</span>}
          {claim.energy && (
            <span>
              ledger {claim.energy.input} → {claim.energy.output}
              {claim.energy.dissipation ? ` · loss to ${claim.energy.dissipation}` : ""}
            </span>
          )}
          <span>{claim.review.last_reviewed ? `record reviewed ${claim.review.last_reviewed}` : "no record-level review date"}</span>
          {!claim.review.canonical && <span>not canonical</span>}
        </div>
        <Explore
          items={[
            { label: "conditions", href: "#conditions" },
            ...(claim.relation ? [{ label: "relation", href: "#relation" }] : []),
            { label: "evidence", href: "#evidence" },
            ...(feeds.length || contextCells.length || contextFamilies.length ? [{ label: "matrix context", href: "#matrix" }] : []),
            ...(routes.length || pathways.length ? [{ label: "uses", href: "#uses" }] : []),
            { label: "cite", href: "#cite" },
          ]}
        />
        <div className={styles.readouts}>
          <span className={styles.readout}>
            <b>{sources.length}</b>
            <span className="label">cited sources</span>
          </span>
          <span className={styles.readout}>
            <b>{routes.length}</b>
            <span className="label">enumerated routes using it</span>
          </span>
          <span className={styles.readout}>
            <b>{withEvidence.length}</b>
            <span className="label">routes with composition evidence</span>
          </span>
          <span className={styles.readout}>
            <b>{pathways.length}</b>
            <span className="label">recorded pathways</span>
          </span>
        </div>
      </header>

      <section className={styles.section} id="conditions">
        <h2 className="label">Conditions</h2>
        {claim.conditions.length === 0 ? (
          <p className="t-data secondary">No conditions recorded.</p>
        ) : (
          <ul className="prose">
            {claim.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        <ConditionTags index={index} tags={claim.condition_tags} prefix="regime:" />
      </section>

      {claim.relation && (
        <section className={styles.section} id="relation">
          <h2 className="label">Constitutive relation</h2>
          <p className={styles.mono}>{claim.relation.formula}</p>
          <div className={styles.meta}>
            <span>
              input <Link href={hrefFor(claim.relation.input)}>{index.entity.get(claim.relation.input)?.name ?? claim.relation.input}</Link>
            </span>
            <span>
              output <Link href={hrefFor(claim.relation.output)}>{index.entity.get(claim.relation.output)?.name ?? claim.relation.output}</Link>
            </span>
            {claim.relation.coefficient_name && (
              <span>
                {claim.relation.coefficient_name} [{claim.relation.coefficient_unit}]
              </span>
            )}
          </div>
          {claim.relation.conventions && (
            <p className="t-ui secondary" style={{ marginTop: 6, fontWeight: 400 }}>
              {claim.relation.conventions}
            </p>
          )}
        </section>
      )}

      <section className={styles.section} id="evidence">
        <h2 className="label">Evidence · {sources.length}</h2>
        <EvidenceList sources={sources} verification={index.graph.source_verification} />
      </section>

      {feeds.length > 0 && (
        <section className={styles.section} id="matrix">
          <h2 className="label">Matrix cells this relation feeds</h2>
          <MatrixLegendLine />
          <div className={styles.cells}>
            {feeds.map(({ col, cell }) => (
              <Link key={col!.id} className={styles.cellLink} href={`/matrix?cell=${rowAxis!.address}:${col!.address}`} title={`${col!.name}: ${CELL_STATUS_LABEL[cell!.status]}`}>
                <StatusMark status={cell!.status} />
                {rowAxis!.address} × {col!.address} · {subjectName} × {col!.name} · {CELL_STATUS_LABEL[cell!.status]}
              </Link>
            ))}
          </div>
          <div className={styles.cells} style={{ marginTop: 6 }}>
            {feeds.map(({ col }) => (
              <Link key={`fam-${col!.id}`} className={styles.cellLink} href={hrefFor(col!.id)}>
                family: {col!.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {feeds.length === 0 && contextPhenomenon && (contextCells.length > 0 || contextFamilies.length > 0) && (
        <section className={styles.section} id="matrix">
          <h2 className="label">Related matrix context</h2>
          <p className="t-micro secondary" style={{ marginBottom: 6 }}>
            This claim does not itself create a matrix cell. The context below belongs to <Link href={hrefFor(contextPhenomenon.id)}>{contextPhenomenon.name}</Link>, the phenomenon it is about.
          </p>
          <MatrixLegendLine />
          <div className={styles.cells}>
            {contextFamilies.map((col) => (
              <Link key={`fam-${col!.id}`} className={styles.cellLink} href={hrefFor(col!.id)}>
                family: {col!.name} ({col!.address})
              </Link>
            ))}
          </div>
          {contextCells.length > 0 && (
            <div className={styles.cells} style={{ marginTop: 6 }}>
              {contextCells.map(({ driver, row, col, cell }) => (
                <Link
                  key={`${row!.id}|${col!.id}`}
                  className={styles.cellLink}
                  href={`/matrix?cell=${row!.address}:${col!.address}`}
                  title={`${driver.name} × ${col!.name}: ${CELL_STATUS_LABEL[cell!.status]}`}
                >
                  <StatusMark status={cell!.status} />
                  {row!.address} × {col!.address} · {driver.name} × {col!.name} · {CELL_STATUS_LABEL[cell!.status]}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {(pathways.length > 0 || routes.length > 0) && (
        <section className={styles.section} id="uses">
          <h2 className="label">Uses of this claim</h2>
          {pathways.length > 0 && (
            <>
              <div className={styles.groupTitle}>recorded pathways · {pathways.length}</div>
              <ul className={styles.paths}>
                {pathways.map((p) => {
                  const route = routes.find((r) => r.pathway === p.id);
                  return (
                    <li key={p.id}>
                      {route ? <Link href={`/path/${route.id.slice(2)}`}>{p.name}</Link> : <span>{p.name}</span>}
                      <span className={styles.pathMeta}>
                        {p.status} · {p.steps.length} steps
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {otherRoutes.length > 0 && (
            <>
              <div className={styles.groupTitle} style={{ marginTop: pathways.length ? 10 : 0 }}>
                other enumerated routes · {otherRoutes.length}
                {otherRoutes.length > topRoutes.length ? ` (first ${topRoutes.length} shown)` : ""}
              </div>
              <ul className={styles.paths}>
                {topRoutes.map((p) => (
                  <li key={p.id}>
                    <Link href={`/path/${p.id.slice(2)}`}>{pathTitle(index, p)}</Link>
                    <span className={styles.pathMeta}>
                      {p.established_steps}/{p.length} established · {FRONTIER_LABEL[p.frontier_class]}
                    </span>
                  </li>
                ))}
              </ul>
              {otherRoutes.length > topRoutes.length && (
                <p className="t-micro secondary" style={{ marginTop: 6 }}>
                  all {routes.length} routes are in /api/paths.json filtered by claims ∋ {claim.id}
                </p>
              )}
            </>
          )}
        </section>
      )}

      {claim.notes && (
        <section className={styles.section} id="notes">
          <h2 className="label">Notes</h2>
          <p className="prose">{claim.notes}</p>
        </section>
      )}

      <CiteBlock kind="claim" id={claim.id} title={title} revision={index.graph.meta.data_hash} />
    </article>
  );
}
