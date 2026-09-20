import Link from "next/link";
import type { CompiledPath, Source } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { EVIDENCE_LABEL, FRONTIER_LABEL, OVERLAP_LABEL, claimHref, compositionState, hrefFor, kLabel, predicateLabel } from "@/lib/format";
import { Checksum } from "./Checksum";
import { EvidenceList } from "./EvidenceList";
import { CiteBlock } from "./CiteBlock";
import { ConditionTags, Explore, MatrixLegendLine } from "./Pieces";
import styles from "./PathView.module.css";

export function pathTitle(index: AtlasIndex, p: CompiledPath): string {
  if (p.pathway) return index.pathway.get(p.pathway)?.name ?? p.id;
  return p.nodes.map((n) => index.entity.get(n)?.name ?? n).join(" → ");
}

export function PathView({ index, path }: { index: AtlasIndex; path: CompiledPath }) {
  const claims = path.claims.map((id) => index.claim.get(id)!);
  const named = path.pathway ? index.pathway.get(path.pathway) : undefined;
  const constituentSources = path.constituent_source_ids.map((s) => index.source.get(s)).filter((s): s is Source => !!s);
  const compositionSources = path.composition_source_ids.map((s) => index.source.get(s)).filter((s): s is Source => !!s);
  // One numbering across both lists so step refs and measurement refs resolve unambiguously.
  const all: Source[] = [...constituentSources];
  for (const s of compositionSources) if (!all.includes(s)) all.push(s);
  const refNo = (id: string) => all.findIndex((x) => x.id === id) + 1;
  const srcAxis = index.rowAxis(path.source);
  const families = path.coupling_families.map((f) => index.colAxis(f)).filter(Boolean);
  const comp = compositionState(path.search_status, path.last_searched);
  const overlap = path.known_pathway_overlap;
  const overlapPathway = overlap ? index.pathway.get(overlap.pathway) : undefined;
  const overlapPath = overlapPathway ? index.graph.paths.find((p) => p.pathway === overlapPathway.id) : undefined;
  const measurements = named?.performance?.measurements ?? [];

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">
          Pathway · {path.id} · {FRONTIER_LABEL[path.frontier_class]}
        </div>
        <h1 className="t-title">{named ? named.name : `${index.entity.get(path.source)?.name ?? path.source} → ${index.entity.get(path.sink)?.name ?? path.sink}`}</h1>
        <p className={styles.chain}>
          {path.nodes.map((n, i) => (
            <span key={n + i}>
              <Link href={hrefFor(n)}>{index.entity.get(n)?.name ?? n}</Link>
            </span>
          ))}
        </p>
        {named && <p className={styles.summary}>{named.summary}</p>}

        <h2 className="label" style={{ marginTop: 16 }}>
          Epistemic state of the route
        </h2>
        <dl className={styles.facts}>
          <dt>known constituent relations</dt>
          <dd>
            {path.established_steps} / {path.length} established or replicated · weakest constituent <span className={`ev-${path.evidence_status}`}>{EVIDENCE_LABEL[path.evidence_status]}</span>
          </dd>
          <dt>constituent maturity floor</dt>
          <dd>{kLabel(path.constituent_floor)}</dd>
          <dt>search for this exact route</dt>
          <dd>{comp.long}</dd>
          {named && (
            <>
              <dt>composition maturity</dt>
              <dd>
                {kLabel(named.knowledge_level)}
                {named.demonstrated_with.length ? ` — ${named.demonstrated_with.map((t) => index.entity.get(t)?.name).join(", ")}` : ""}
              </dd>
            </>
          )}
          <dt>recorded-pathway overlap</dt>
          <dd>
            {!overlap && "none recorded"}
            {overlap && overlap.relation === "exact" && `this route is the recorded pathway ${overlapPathway?.name ?? overlap.pathway}`}
            {overlap && overlap.relation !== "exact" && overlapPathway && (
              <>
                {OVERLAP_LABEL[overlap.relation]} {overlapPath ? <Link href={`/path/${overlapPath.id.slice(2)}`}>{overlapPathway.name}</Link> : overlapPathway.name} · {overlap.shared_claims}/
                {overlap.route_claims} relations shared
              </>
            )}
          </dd>
          <dt>route-level evidence</dt>
          <dd>
            {compositionSources.length} source{compositionSources.length === 1 ? "" : "s"} for the complete composition · {constituentSources.length} cited by the constituent steps
            {path.literature.contradictory ? ` · ${path.literature.contradictory} contradictory constituent claim${path.literature.contradictory === 1 ? "" : "s"}` : ""}
          </dd>
        </dl>
        <Explore
          items={[
            { label: "matrix context", href: "#matrix" },
            { label: "physics checks", href: "#checks" },
            ...(named?.performance ? [{ label: "performance", href: "#performance" }] : []),
            { label: "steps", href: "#steps" },
            { label: "route evidence", href: "#route-evidence" },
            { label: "constituent evidence", href: "#constituent-evidence" },
            { label: "cite", href: "#cite" },
          ]}
        />
      </header>

      <section className={styles.section} id="matrix">
        <h2 className="label">Matrix context</h2>
        <MatrixLegendLine />
        <p className={styles.coords}>
          {srcAxis && families.length > 0 ? (
            families.map((f) => (
              <span key={f!.id} className={styles.coordRow}>
                <Link href={`/matrix?cell=${srcAxis.address}:${f!.address}`} className={styles.coord}>
                  {srcAxis.address} × {f!.address} · {srcAxis.name} × {f!.name}
                </Link>
                <Link href={hrefFor(f!.id)} className={styles.coord}>
                  family: {f!.name}
                </Link>
              </span>
            ))
          ) : (
            <span className="secondary">No coupling family recorded for this route's phenomena.</span>
          )}
        </p>
      </section>

      <section className={styles.section} id="checks" aria-label="Physics checks">
        <Checksum checks={path.checks} claims={path.claims} />
      </section>

      {named?.performance && (
        <section className={styles.section} id="performance">
          <h2 className="label">Measured or reported performance</h2>
          {measurements.length === 0 && (
            <p className="t-ui secondary" style={{ fontWeight: 400 }}>
              Summary figures only; no datum-level record yet. Each figure below is a reviewed summary, not a single measurement.
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
                  <div className="t-ui secondary" style={{ fontWeight: 400 }}>
                    {m.conditions}
                    {m.note ? ` — ${m.note}` : ""}
                  </div>
                  <div className="t-data secondary">refs {m.sources.map((s) => `[${refNo(s)}]`).join(" ")}</div>
                </li>
              ))}
            </ol>
          )}
          <dl className={styles.facts} style={{ marginTop: measurements.length ? 12 : 8 }}>
            {named.performance.efficiency_typical !== undefined && (
              <>
                <dt>typical efficiency (summary)</dt>
                <dd>{(named.performance.efficiency_typical * 100).toFixed(1)}%</dd>
              </>
            )}
            {named.performance.efficiency_record !== undefined && (
              <>
                <dt>record efficiency (summary)</dt>
                <dd>{(named.performance.efficiency_record * 100).toFixed(1)}%</dd>
              </>
            )}
            {named.performance.power_density && (
              <>
                <dt>power density (summary)</dt>
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
          {named.performance.theoretical_limit && (
            <>
              <h2 className="label" style={{ marginTop: 14 }}>
                Theoretical relation
              </h2>
              <p className={`${styles.limit} t-data`}>{named.performance.theoretical_limit}</p>
            </>
          )}
        </section>
      )}

      <section className={styles.section} id="steps">
        <h2 className="label">Steps</h2>
        <ol className={styles.steps}>
          {claims.map((c, i) => {
            const s = index.entity.get(c.subject);
            const o = index.entity.get(c.object);
            const refs = c.evidence.map(refNo).filter((n) => n > 0);
            return (
              <li key={c.id} className={styles.step} id={c.id.replace(":", "-")}>
                <div className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepLine}>
                    <Link href={hrefFor(c.subject)}>{s?.name}</Link>
                    <span className="t-data secondary"> —{predicateLabel(c.predicate)}→ </span>
                    <Link href={hrefFor(c.object)}>{o?.name}</Link>
                    <span className={`${styles.stepStatus} ev-${c.status}`}>{EVIDENCE_LABEL[c.status]}</span>
                    <Link href={claimHref(c.id)} className={styles.stepRecord} aria-label={`Open the record for ${c.id}`}>
                      claim record
                    </Link>
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
                      {c.relation.coefficient_name ? (
                        <span className="secondary">
                          {" "}
                          · {c.relation.coefficient_name} [{c.relation.coefficient_unit}]
                        </span>
                      ) : null}
                      {c.relation.conventions ? <div className="secondary">{c.relation.conventions}</div> : null}
                    </div>
                  )}
                  {c.conditions.length > 0 && (
                    <ul className={styles.conditions}>
                      {c.conditions.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )}
                  <ConditionTags index={index} tags={c.condition_tags} />
                  {c.notes && <div className={`${styles.note} secondary`}>{c.notes}</div>}
                  {refs.length > 0 && <div className="t-data secondary">refs {refs.map((n) => `[${n}]`).join(" ")}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.section} id="route-evidence">
        <h2 className="label">Evidence for the complete composition · {compositionSources.length}</h2>
        {compositionSources.length === 0 ? (
          <p className="t-ui secondary" style={{ fontWeight: 400 }}>
            No source on record for this exact composition. The sources below support the individual steps, not the route as a whole.
          </p>
        ) : (
          <EvidenceList sources={compositionSources} verification={index.graph.source_verification} startAt={refNo(compositionSources[0].id)} numbering={refNo} />
        )}
      </section>

      <section className={styles.section} id="constituent-evidence">
        <h2 className="label">Evidence for the constituent relations · {constituentSources.length}</h2>
        <EvidenceList sources={constituentSources} verification={index.graph.source_verification} numbering={refNo} />
      </section>

      <CiteBlock kind="route" id={path.id} title={named ? named.name : pathTitle(index, path)} revision={index.graph.meta.data_hash} />
    </article>
  );
}
