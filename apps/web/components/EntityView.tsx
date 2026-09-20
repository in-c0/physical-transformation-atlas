import Link from "next/link";
import type { Claim, Entity } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { CELL_STATUS_LABEL, EVIDENCE_LABEL, FRONTIER_LABEL, hrefFor, kLabel, predicateLabel } from "@/lib/format";
import { EvidenceList } from "./EvidenceList";
import { StatusMark } from "./StatusMark";
import { pathTitle } from "./PathView";
import { CiteBlock } from "./CiteBlock";
import { ConditionTags, Explore, MatrixLegendLine, statusSentence } from "./Pieces";
import styles from "./EntityView.module.css";
import claimStyles from "./Drawer.module.css";

const TYPE_LABEL: Record<Entity["type"], string> = {
  system: "System",
  quantity: "Physical quantity",
  disequilibrium: "Disequilibrium",
  state: "State",
  interaction: "Interaction",
  phenomenon: "Phenomenon",
  transition: "Transition",
  carrier: "Carrier",
  coupling: "Coupling family",
  transducer: "Transducer",
  material: "Material",
  constraint: "Constraint",
  output: "Output",
};

function ClaimRow({ c, index, anchor }: { c: Claim; index: AtlasIndex; anchor: string }) {
  const s = index.entity.get(c.subject);
  const o = index.entity.get(c.object);
  return (
    <div className={claimStyles.claim} id={c.id.replace(":", "-")}>
      <div className={claimStyles.claimLine}>
        {c.subject === anchor ? <span>{s?.name}</span> : <Link href={hrefFor(c.subject)}>{s?.name}</Link>}
        <span className="t-data secondary">—{predicateLabel(c.predicate)}→</span>
        {c.object === anchor ? <span>{o?.name}</span> : <Link href={hrefFor(c.object)}>{o?.name}</Link>}
        <span className={`${claimStyles.status} ev-${c.status}`}>{EVIDENCE_LABEL[c.status]}</span>
      </div>
      {c.conditions.length > 0 && (
        <ul className={claimStyles.conditions}>
          {c.conditions.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )}
      {c.relation && (
        <div className="t-data secondary" style={{ marginTop: 4 }}>
          {c.relation.formula}
          {c.relation.coefficient_name ? ` · ${c.relation.coefficient_name} [${c.relation.coefficient_unit}]` : ""}
        </div>
      )}
      {c.notes && (
        <div className="t-ui secondary" style={{ marginTop: 4, fontWeight: 400 }}>
          {c.notes}
        </div>
      )}
    </div>
  );
}

export function EntityView({ index, entity }: { index: AtlasIndex; entity: Entity }) {
  const about = index.claimsAbout(entity.id);
  const byPredicate = new Map<string, Claim[]>();
  for (const c of about) byPredicate.set(c.predicate, [...(byPredicate.get(c.predicate) ?? []), c]);
  const order = [
    "drives",
    "produces",
    "couples_to",
    "converts_into",
    "member_of",
    "implemented_by",
    "demonstrated_with",
    "bounded_by",
    "requires",
    "observed_in",
    "predicted_in",
    "governed_by",
    "mediated_by",
    "enhanced_by",
    "inhibited_by",
    "conserves",
    "dissipates_to",
  ];
  const groups = order.filter((p) => byPredicate.has(p)).map((p) => [p, byPredicate.get(p)!] as const);
  const paths = index.pathsThrough(entity.id);
  const demonstrated = paths.filter((p) => p.search_status === "demonstrated");
  const unsearched = paths.filter((p) => p.search_status === "not-searched" && p.frontier_class === "candidate");
  const sources = index.sourcesFor(about);
  const families = entity.type === "phenomenon" ? index.families(entity.id) : [];
  const rowAxis = index.rowAxis(entity.id);
  const colAxis = index.colAxis(entity.id);
  const domainName = entity.domain ? index.graph.coverage.find((c) => c.domain === entity.domain)?.name : undefined;
  // A phenomenon supplies the direct relation of every (driver row × family column) cell where a
  // canonical drives claim names a disequilibrium and a member_of claim names the family.
  const drivers = entity.type === "phenomenon" ? index.claimsTo(entity.id).filter((c) => c.predicate === "drives" && c.subject.startsWith("disequilibrium:")) : [];
  const phenomenonCells = drivers.flatMap((d) =>
    families
      .map((f) => ({ driver: index.entity.get(d.subject)!, row: index.rowAxis(d.subject), col: index.colAxis(f), cell: index.cellFor(d.subject, f), status: d.status }))
      .filter((x) => x.row && x.col && x.cell),
  );
  const recordSentence = `Atlas record: ${about.length} claim${about.length === 1 ? "" : "s"} reference${about.length === 1 ? "s" : ""} this ${TYPE_LABEL[entity.type].toLowerCase()}${
    about.length
      ? ` — ${statusSentence(
          about.map((c) => c.status),
          (st) => EVIDENCE_LABEL[st as Claim["status"]],
        )}`
      : ""
  }.`;
  const topPaths = [...paths].sort((a, b) => (a.search_status === "demonstrated" ? -1 : 1) - (b.search_status === "demonstrated" ? -1 : 1) || a.length - b.length).slice(0, 24);

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">
          {TYPE_LABEL[entity.type]} · {entity.id}
        </div>
        <h1 className="t-title">{entity.name}</h1>
        <p className={styles.summary}>{entity.summary}</p>
        <div className={styles.meta}>
          {entity.symbol && <span>symbol {entity.symbol}</span>}
          {domainName && <span>{domainName}</span>}
          {entity.year_first_reported !== undefined && <span>first reported {entity.year_first_reported < 0 ? `${-entity.year_first_reported} BCE` : entity.year_first_reported}</span>}
          {entity.energy_form && <span>energy form {entity.energy_form}</span>}
          {entity.exergy && <span>exergy {entity.exergy}</span>}
          {entity.unit && <span>unit {entity.unit}</span>}
          {entity.knowledge_level && <span>{kLabel(entity.knowledge_level)}</span>}
          {entity.aliases.length > 0 && <span>also: {entity.aliases.join(", ")}</span>}
        </div>
        <p className={styles.record}>{recordSentence}</p>
        <Explore
          items={[
            { label: "relations", href: "#relations" },
            ...(rowAxis || colAxis || families.length > 0 ? [{ label: "matrix context", href: "#matrix" }] : []),
            ...(paths.length > 0 ? [{ label: "routes", href: "#routes" }] : []),
            { label: "sources", href: "#sources" },
            { label: "cite", href: "#cite" },
          ]}
        />
        {entity.bound && (
          <p className={`${styles.bound} ${styles.mono}`} style={{ marginTop: 10 }}>
            {entity.bound}
          </p>
        )}
        <ConditionTags index={index} tags={entity.condition_tags} prefix="conditions:" />
        <div className={styles.readouts}>
          <span className={styles.readout}>
            <b>{about.length}</b>
            <span className="label">claims</span>
          </span>
          <span className={styles.readout}>
            <b>{paths.length}</b>
            <span className="label">enumerated routes</span>
          </span>
          <span className={styles.readout}>
            <b>{demonstrated.length}</b>
            <span className="label">routes with complete-composition evidence</span>
          </span>
          <span className={styles.readout}>
            <b>{unsearched.length}</b>
            <span className="label">candidate routes not searched</span>
          </span>
          <span className={styles.readout}>
            <b>{sources.length}</b>
            <span className="label">cited sources</span>
          </span>
        </div>
      </header>

      <section className={styles.section} id="relations">
        <h2 className="label">Relations</h2>
        {groups.length === 0 && <p className="t-data secondary">No claim currently references this entity.</p>}
        {groups.map(([p, list]) => (
          <div key={p} className={styles.group}>
            <div className={styles.groupTitle}>
              {predicateLabel(p)} · {list.length}
            </div>
            <div className={claimStyles.list}>
              {list.map((c) => (
                <ClaimRow key={c.id} c={c} index={index} anchor={entity.id} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {(rowAxis || colAxis || families.length > 0) && (
        <section className={styles.section} id="matrix">
          <h2 className="label">Matrix context</h2>
          <MatrixLegendLine />
          {phenomenonCells.length > 0 && (
            <div className={styles.cells} style={{ marginBottom: 6 }}>
              {phenomenonCells.map(({ driver, row, col, cell, status }) => (
                <Link
                  key={`${row!.id}|${col!.id}`}
                  className={styles.cellLink}
                  href={`/matrix?cell=${row!.address}:${col!.address}`}
                  title={`${driver.name} × ${col!.name}: ${CELL_STATUS_LABEL[cell!.status]}; direct relation ${EVIDENCE_LABEL[status]}`}
                >
                  <StatusMark status={cell!.status} />
                  {row!.address} × {col!.address} · {driver.name} × {col!.name} · {CELL_STATUS_LABEL[cell!.status]}
                </Link>
              ))}
            </div>
          )}
          {rowAxis && (
            <div className={styles.cells}>
              {index.graph.matrix.cols.map((col) => {
                const cell = index.cellFor(entity.id, col.id)!;
                return (
                  <Link key={col.id} className={styles.cellLink} href={`/matrix?cell=${rowAxis.address}:${col.address}`} title={`${col.name}: ${CELL_STATUS_LABEL[cell.status]}`}>
                    <StatusMark status={cell.status} />
                    {col.address} {col.name}
                  </Link>
                );
              })}
            </div>
          )}
          {colAxis && (
            <div className={styles.cells}>
              {index.graph.matrix.rows.map((row) => {
                const cell = index.cellFor(row.id, entity.id)!;
                return (
                  <Link key={row.id} className={styles.cellLink} href={`/matrix?cell=${row.address}:${colAxis.address}`} title={`${row.name}: ${CELL_STATUS_LABEL[cell.status]}`}>
                    <StatusMark status={cell.status} />
                    {row.address} {row.name}
                  </Link>
                );
              })}
            </div>
          )}
          {families.length > 0 && !rowAxis && !colAxis && (
            <div className={styles.cells}>
              {families.map((f) => {
                const col = index.colAxis(f)!;
                return (
                  <Link key={f} className={styles.cellLink} href={hrefFor(f)}>
                    family: {col.name} ({col.address})
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {paths.length > 0 && (
        <section className={styles.section} id="routes">
          <h2 className="label">
            Enumerated routes through this · {paths.length}
            {paths.length > topPaths.length ? ` (showing ${topPaths.length})` : ""}
          </h2>
          <ul className={styles.paths}>
            {topPaths.map((p) => (
              <li key={p.id}>
                <Link href={`/path/${p.id.slice(2)}`}>{pathTitle(index, p)}</Link>
                <span className={styles.pathMeta}>
                  {p.established_steps}/{p.length} est · {FRONTIER_LABEL[p.frontier_class]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} id="sources">
        <h2 className="label">Cited sources · {sources.length}</h2>
        <EvidenceList sources={sources} verification={index.graph.source_verification} />
      </section>

      <CiteBlock kind="entity" id={entity.id} title={entity.name} revision={index.graph.meta.data_hash} href={hrefFor(entity.id)} />
    </article>
  );
}
