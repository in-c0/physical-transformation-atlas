import Link from "next/link";
import type { CompiledSystemPathway, Source } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { CHECK_ABBR, CHECK_GLYPH, CHECK_NAME, PATHWAY_STATUS_LABEL, SYSTEM_HANDOFF_KIND_LABEL, SYSTEM_STATUS_LABEL, hrefFor, kLabel } from "@/lib/format";
import { EvidenceList } from "./EvidenceList";
import { CiteBlock } from "./CiteBlock";
import styles from "./PathView.module.css";

/**
 * A system pathway (loop-3 pass 34): two or more linear pathways joined by documented handoffs. The page
 * shows the members with their exact routes' eight check results, the handoffs with their status, the
 * outputs and the system's own performance — never a verdict of its own: the eight checks run over routes,
 * and a system is not clear merely because its members are.
 */
export function SystemView({ index, system }: { index: AtlasIndex; system: CompiledSystemPathway }) {
  const g = index.graph;
  const cited = new Set<string>(system.evidence);
  for (const h of system.handoffs) for (const s of h.evidence) cited.add(s);
  for (const m of system.performance?.measurements ?? []) for (const s of m.sources) cited.add(s);
  const sources = [...cited].map((id) => index.source.get(id)).filter((s): s is Source => !!s);
  const refNo = (id: string) => sources.findIndex((s) => s.id === id) + 1;
  const memberName = (id: string) => system.members.find((m) => m.id === id);
  const measurements = system.performance?.measurements ?? [];
  const checkOrder = Object.keys(CHECK_ABBR) as (keyof typeof CHECK_ABBR)[];

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">
          System · {system.id} · {SYSTEM_STATUS_LABEL[system.status]}
        </div>
        <h1 className="t-title">{system.name}</h1>
        <p className={styles.chain}>
          {system.members.map((m) => (
            <span key={m.id}>
              {m.route_id ? <Link href={`/path/${m.route_id.slice(2)}`}>{m.pathway_name}</Link> : m.pathway_name} <span className="secondary">({m.role})</span>
            </span>
          ))}
        </p>
        <p className={styles.summary}>{system.summary}</p>
        <dl className={styles.facts}>
          <dt>what a system is</dt>
          <dd>
            Two or more linear pathways, each keeping its own route and checks, joined by a documented residual stream. The eight physics checks are not run over the system; it is not clear merely
            because its members are — every handoff must also be demonstrated.
          </dd>
          <dt>handoffs</dt>
          <dd>
            {system.handoffs.length} recorded · weakest status <strong>{system.handoff_status}</strong>
          </dd>
          <dt>members&apos; core checks</dt>
          <dd>
            {system.members.map((m, i) => (
              <span key={m.id}>
                {i > 0 ? " · " : ""}
                {m.pathway_name}:{" "}
                {m.core_unresolved_count === null
                  ? "no compiled route"
                  : m.core_unresolved_count === 0
                    ? "core checks clear"
                    : `${m.core_unresolved_count} core check${m.core_unresolved_count === 1 ? "" : "s"} unresolved`}
              </span>
            ))}{" "}
            — unresolved describes the atlas&apos;s evidence coverage of a member route, never a doubt about a plant that runs.
          </dd>
          <dt>knowledge level</dt>
          <dd>{kLabel(system.knowledge_level)}</dd>
        </dl>
      </header>

      <section className={styles.section} id="members" aria-label="Member pathways">
        <h2 className="label">Members and their routes&apos; checks</h2>
        <ol className={styles.steps}>
          {system.members.map((m, i) => (
            <li key={m.id} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <div className={styles.stepBody}>
                <div className={styles.stepLine}>
                  {m.route_id ? <Link href={`/path/${m.route_id.slice(2)}`}>{m.pathway_name}</Link> : <span>{m.pathway_name}</span>}
                  <span className="t-micro secondary">{m.role}</span>
                  <span className={styles.stepStatus}>{PATHWAY_STATUS_LABEL[m.pathway_status]}</span>
                </div>
                <div className="t-data secondary" aria-label={`Route checks of ${m.pathway_name}`}>
                  {checkOrder.map((id) => {
                    const r = m.route_checks[id];
                    return r ? (
                      <span key={id} title={`${CHECK_NAME[id]}: ${r}`} style={{ marginRight: 10, whiteSpace: "nowrap" }}>
                        {CHECK_ABBR[id]} {CHECK_GLYPH[r]}
                      </span>
                    ) : null;
                  })}
                  {m.core_unresolved_count !== null && <span>· {m.core_unresolved_count} core unresolved</span>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} id="handoffs" aria-label="Handoffs">
        <h2 className="label">Handoffs between members</h2>
        <ol className={styles.steps}>
          {system.handoffs.map((h, i) => (
            <li key={i} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <div className={styles.stepBody}>
                <div className={styles.stepLine}>
                  <span>
                    {memberName(h.from_member)?.pathway_name ?? h.from_member} → {memberName(h.to_member)?.pathway_name ?? h.to_member}
                  </span>
                  <span className="t-micro secondary">{SYSTEM_HANDOFF_KIND_LABEL[h.kind]}</span>
                  <span className={styles.stepStatus}>{h.status}</span>
                </div>
                <div className="t-ui secondary" style={{ fontWeight: 400 }}>
                  {h.from_energy_form} energy leaves the first member
                  {h.carrier ? (
                    <>
                      {" "}
                      as <Link href={hrefFor(h.carrier)}>{index.entity.get(h.carrier)?.name ?? h.carrier}</Link>
                    </>
                  ) : null}{" "}
                  and establishes <Link href={hrefFor(h.to_source)}>{index.entity.get(h.to_source)?.name ?? h.to_source}</Link>, the disequilibrium the second member&apos;s route starts from.
                </div>
                {h.conditions.length > 0 && (
                  <ul className={styles.conditions}>
                    {h.conditions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
                {h.note && <div className={styles.note}>{h.note}</div>}
                {h.evidence.length > 0 && <div className="t-data secondary">refs {h.evidence.map((s) => `[${refNo(s)}]`).join(" ")}</div>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} id="outputs" aria-label="Outputs">
        <h2 className="label">Outputs</h2>
        <dl className={styles.facts}>
          {system.outputs.map((o, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>{memberName(o.member)?.role ?? o.member}</dt>
              <dd>
                <Link href={hrefFor(o.output)}>{index.entity.get(o.output)?.name ?? o.output}</Link> · {o.aggregation === "sum" ? "adds into the system output" : "delivered separately"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {system.performance && (
        <section className={styles.section} id="performance">
          <h2 className="label">Measured or reported performance of the system</h2>
          {measurements.length === 0 && (
            <p className="t-ui secondary" style={{ fontWeight: 400 }}>
              No datum-level record yet.
            </p>
          )}
          {measurements.length > 0 && (
            <ol className={styles.measurements}>
              {measurements.map((m, i) => (
                <li key={i}>
                  <div className={styles.mHead}>
                    <span className={styles.mQuantity}>{m.quantity}</span>
                    <span className={styles.mValue}>{m.value}</span>
                    <span className="t-micro secondary">{m.scope}</span>
                    {m.year && <span className="t-micro secondary">{m.year}</span>}
                  </div>
                  {m.basis && <div className="t-data secondary">basis: {m.basis}</div>}
                  <div className="t-ui secondary" style={{ fontWeight: 400 }}>
                    {m.conditions}
                    {m.note ? ` — ${m.note}` : ""}
                  </div>
                  <div className="t-data secondary">refs {m.sources.map((s) => `[${refNo(s)}]`).join(" ")}</div>
                </li>
              ))}
            </ol>
          )}
          {system.performance.notes && (
            <dl className={styles.facts} style={{ marginTop: 12 }}>
              <dt>notes</dt>
              <dd className={styles.limit}>{system.performance.notes}</dd>
            </dl>
          )}
        </section>
      )}

      <section className={styles.section} id="sources" aria-label="Sources">
        <h2 className="label">Sources</h2>
        <EvidenceList sources={sources} verification={g.source_verification} numbering={refNo} />
      </section>
      <CiteBlock kind="system" id={system.id} title={system.name} revision={g.meta.data_hash} />
    </article>
  );
}
