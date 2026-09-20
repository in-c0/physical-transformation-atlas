import Link from "next/link";
import type { Claim } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { CELL_STATUS_LABEL, EVIDENCE_LABEL, FRONTIER_LABEL, hrefFor, kLabel, predicateLabel } from "@/lib/format";
import { EvidenceList } from "./EvidenceList";
import { StatusMark } from "./StatusMark";
import { pathTitle } from "./PathView";
import { CiteBlock } from "./CiteBlock";
import styles from "./EntityView.module.css";

/**
 * One claim as a citable record: the relation, the conditions it holds under, its energy ledger
 * and constitutive relation, its evidence and review provenance, and everything built on it.
 */
export function ClaimView({ index, claim }: { index: AtlasIndex; claim: Claim }) {
  const s = index.entity.get(claim.subject);
  const o = index.entity.get(claim.object);
  const sources = index.sourcesFor([claim]);
  const routes = index.pathsWithClaim(claim.id);
  const demonstrated = routes.filter((p) => p.search_status === "demonstrated");
  const pathways = index.graph.pathways.filter((p) => p.steps.includes(claim.id));
  // A drives-claim from a disequilibrium into a phenomenon feeds the cells of that row for every family the phenomenon belongs to.
  const rowAxis = s?.type === "disequilibrium" ? index.rowAxis(s.id) : undefined;
  const cells =
    rowAxis && o?.type === "phenomenon"
      ? index
          .families(o.id)
          .map((f) => ({
            axis: index.colAxis(f),
            cell: index.cellFor(s!.id, f),
          }))
          .filter((x) => x.axis && x.cell)
      : [];
  const topRoutes = [...routes].sort((a, b) => (a.search_status === "demonstrated" ? -1 : 1) - (b.search_status === "demonstrated" ? -1 : 1) || a.length - b.length).slice(0, 24);
  const title = `${s?.name ?? claim.subject} —${predicateLabel(claim.predicate)}→ ${o?.name ?? claim.object}`;

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">Claim · {claim.id}</div>
        <h1 className="t-title">
          <Link href={hrefFor(claim.subject)}>{s?.name ?? claim.subject}</Link> <span className="secondary">—{predicateLabel(claim.predicate)}→</span>{" "}
          <Link href={hrefFor(claim.object)}>{o?.name ?? claim.object}</Link>
        </h1>
        <div className={styles.meta}>
          <span className={`ev-${claim.status}`}>{EVIDENCE_LABEL[claim.status]}</span>
          {claim.knowledge_level && <span>{kLabel(claim.knowledge_level)}</span>}
          {claim.energy && (
            <span>
              ledger {claim.energy.input} → {claim.energy.output}
              {claim.energy.dissipation ? ` · loss to ${claim.energy.dissipation}` : ""}
            </span>
          )}
          <span>reviewed {claim.review.last_reviewed}</span>
          <span>{claim.review.canonical ? "canonical" : "not canonical"}</span>
          {claim.review.reviewer && <span>by {claim.review.reviewer}</span>}
        </div>
        <div className={styles.readouts}>
          <span className={styles.readout}>
            <b>{sources.length}</b>
            <span className="label">sources</span>
          </span>
          <span className={styles.readout}>
            <b>{routes.length}</b>
            <span className="label">routes using it</span>
          </span>
          <span className={styles.readout}>
            <b>{demonstrated.length}</b>
            <span className="label">demonstrated</span>
          </span>
          <span className={styles.readout}>
            <b>{pathways.length}</b>
            <span className="label">recorded pathways</span>
          </span>
        </div>
      </header>

      <section className={styles.section}>
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
        {claim.condition_tags.length > 0 && (
          <div className="t-micro secondary" style={{ marginTop: 8 }}>
            tags: {claim.condition_tags.join(" · ")}
          </div>
        )}
      </section>

      {claim.relation && (
        <section className={styles.section}>
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

      {claim.notes && (
        <section className={styles.section}>
          <h2 className="label">Notes</h2>
          <p className="prose">{claim.notes}</p>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="label">Evidence</h2>
        <EvidenceList sources={sources} verification={index.graph.source_verification} />
      </section>

      {cells.length > 0 && (
        <section className={styles.section}>
          <h2 className="label">Matrix cells this relation feeds</h2>
          <div className={styles.cells}>
            {cells.map(({ axis, cell }) => (
              <Link key={axis!.id} className={styles.cellLink} href={`/matrix?cell=${rowAxis!.address}:${axis!.address}`} title={`${axis!.name}: ${CELL_STATUS_LABEL[cell!.status]}`}>
                <StatusMark status={cell!.status} />
                {rowAxis!.address} × {axis!.address} {axis!.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {pathways.length > 0 && (
        <section className={styles.section}>
          <h2 className="label">Recorded pathways using this step</h2>
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
        </section>
      )}

      <section className={styles.section}>
        <h2 className="label">Routes using this claim ({routes.length})</h2>
        {routes.length === 0 ? (
          <p className="t-data secondary">This claim is not a step of any enumerated route.</p>
        ) : (
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
        )}
        {routes.length > topRoutes.length && (
          <p className="t-micro secondary" style={{ marginTop: 6 }}>
            first {topRoutes.length} shown; all {routes.length} are in /api/paths.json filtered by claims ∋ {claim.id}
          </p>
        )}
      </section>

      <CiteBlock kind="claim" id={claim.id} title={title} revision={index.graph.meta.data_hash} />
    </article>
  );
}
