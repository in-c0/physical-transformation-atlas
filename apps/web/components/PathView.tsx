import Link from "next/link";
import type { CompiledPath } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { EVIDENCE_LABEL, FRONTIER_LABEL, SEARCH_LABEL, hrefFor, kLabel, predicateLabel } from "@/lib/format";
import { Checksum } from "./Checksum";
import { EvidenceList } from "./EvidenceList";
import styles from "./PathView.module.css";

export function pathTitle(index: AtlasIndex, p: CompiledPath): string {
  if (p.pathway) return index.pathway.get(p.pathway)?.name ?? p.id;
  return p.nodes.map((n) => index.entity.get(n)?.name ?? n).join(" → ");
}

export function PathView({ index, path }: { index: AtlasIndex; path: CompiledPath }) {
  const claims = path.claims.map((id) => index.claim.get(id)!);
  const named = path.pathway ? index.pathway.get(path.pathway) : undefined;
  const sources = index.sourcesFor(claims);
  const extra = named ? named.evidence.map((s) => index.source.get(s)!).filter((s) => s && !sources.includes(s)) : [];
  const all = [...sources, ...extra];
  const srcAxis = index.rowAxis(path.source);
  const families = path.coupling_families.map((f) => index.colAxis(f)).filter(Boolean);
  const demonstrated = path.search_status === "demonstrated";

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">
          Pathway · {path.id} · {FRONTIER_LABEL[path.frontier_class]}
        </div>
        <h1 className="t-title">{named ? named.name : pathTitle(index, path)}</h1>
        <p className={styles.chain}>
          {path.nodes.map((n, i) => (
            <span key={n + i}>
              <Link href={hrefFor(n)}>{index.entity.get(n)?.name ?? n}</Link>
            </span>
          ))}
        </p>
        {named && <p className={styles.summary}>{named.summary}</p>}
        <dl className={styles.facts}>
          <dt>constituent relations established</dt>
          <dd>
            {path.established_steps} / {path.length}
          </dd>
          <dt>weakest constituent</dt>
          <dd className={`ev-${path.evidence_status}`}>{EVIDENCE_LABEL[path.evidence_status]}</dd>
          <dt>complete composition</dt>
          <dd>
            {SEARCH_LABEL[path.search_status]}
            {path.last_searched ? ` · through ${path.last_searched}` : ""}
          </dd>
          <dt>direct demonstration found</dt>
          <dd>{demonstrated ? `yes${named?.demonstrated_with.length ? ` — ${named.demonstrated_with.map((t) => index.entity.get(t)?.name).join(", ")}` : ""}` : "none"}</dd>
          <dt>knowledge level</dt>
          <dd>{kLabel(path.knowledge_level)}</dd>
          <dt>literature</dt>
          <dd>
            {path.literature.supporting} supporting source{path.literature.supporting === 1 ? "" : "s"} · {path.literature.contradictory} contradictory claim{path.literature.contradictory === 1 ? "" : "s"}
          </dd>
        </dl>
      </header>

      <section className={styles.section} aria-label="Physics checks">
        <Checksum checks={path.checks} claims={path.claims} />
      </section>

      {named?.performance && (
        <section className={styles.section}>
          <h2 className="label">Performance on record</h2>
          <dl className={styles.facts}>
            {named.performance.efficiency_typical !== undefined && (
              <>
                <dt>typical efficiency</dt>
                <dd>{(named.performance.efficiency_typical * 100).toFixed(1)}%</dd>
              </>
            )}
            {named.performance.efficiency_record !== undefined && (
              <>
                <dt>record efficiency</dt>
                <dd>{(named.performance.efficiency_record * 100).toFixed(1)}%</dd>
              </>
            )}
            {named.performance.theoretical_limit && (
              <>
                <dt>theoretical limit</dt>
                <dd>{named.performance.theoretical_limit}</dd>
              </>
            )}
            {named.performance.power_density && (
              <>
                <dt>power density</dt>
                <dd>{named.performance.power_density}</dd>
              </>
            )}
            {named.performance.notes && (
              <>
                <dt>notes</dt>
                <dd>{named.performance.notes}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <section className={styles.section}>
        <h2 className="label">Steps</h2>
        <ol className={styles.steps}>
          {claims.map((c, i) => {
            const s = index.entity.get(c.subject);
            const o = index.entity.get(c.object);
            const refs = c.evidence.map((e) => all.findIndex((x) => x.id === e) + 1).filter((n) => n > 0);
            return (
              <li key={c.id} className={styles.step} id={c.id.replace(":", "-")}>
                <div className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepLine}>
                    <Link href={hrefFor(c.subject)}>{s?.name}</Link>
                    <span className="t-data secondary"> —{predicateLabel(c.predicate)}→ </span>
                    <Link href={hrefFor(c.object)}>{o?.name}</Link>
                    <span className={`${styles.stepStatus} ev-${c.status}`}>{EVIDENCE_LABEL[c.status]}</span>
                  </div>
                  {c.energy && (
                    <div className="t-data secondary">
                      {c.energy.input} → {c.energy.output}
                      {c.energy.dissipation ? ` · loss to ${c.energy.dissipation}` : ""}
                    </div>
                  )}
                  {c.relation && (
                    <div className="t-data">
                      {c.relation.formula}
                      {c.relation.coefficient_name ? <span className="secondary"> · {c.relation.coefficient_name} [{c.relation.coefficient_unit}]</span> : null}
                    </div>
                  )}
                  {c.conditions.length > 0 && (
                    <ul className={styles.conditions}>
                      {c.conditions.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )}
                  {c.condition_tags.length > 0 && <div className="t-micro secondary">{c.condition_tags.join(" · ")}</div>}
                  {c.notes && <div className={`${styles.note} secondary`}>{c.notes}</div>}
                  {refs.length > 0 && <div className="t-data secondary">refs {refs.map((n) => `[${n}]`).join(" ")}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className="label">Coordinates</h2>
        <p className={styles.coords}>
          {srcAxis && families.length > 0 ? (
            families.map((f) => (
              <Link key={f!.id} href={`/matrix?cell=${srcAxis.address}:${f!.address}`} className={styles.coord}>
                {srcAxis.address} × {f!.address} · {srcAxis.name} → {f!.name}
              </Link>
            ))
          ) : (
            <span className="secondary">No coupling family recorded for this path's phenomena.</span>
          )}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className="label">Evidence</h2>
        <EvidenceList sources={all} verification={index.graph.source_verification} />
      </section>
    </article>
  );
}
