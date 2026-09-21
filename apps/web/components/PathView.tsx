import Link from "next/link";
import type { CompiledPath, Source } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { EVIDENCE_LABEL, FRONTIER_LABEL, INTERFACE_KIND_LABEL, OVERLAP_LABEL, PATHWAY_STATUS_LABEL, boundaryLine, claimHref, compositionState, hrefFor, kLabel, predicateLabel } from "@/lib/format";
import { Checksum } from "./Checksum";
import { EvidenceList } from "./EvidenceList";
import { CiteBlock } from "./CiteBlock";
import { ConditionTags, Explore, MatrixLegendLine } from "./Pieces";
import { AutomatedRunView, SearchRecordView, searchRouteSentence } from "./SearchRecordView";
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
  const routeSearch = index.graph.searches.find((x) => x.target.kind === "path" && x.target.path === path.id);
  const interfaces = path.interfaces_recorded.map((r) => index.graph.interfaces.find((f) => f.id === r.interface)).filter((f): f is NonNullable<typeof f> => !!f);
  const routeRuns = (index.graph.search_runs ?? []).filter((x) => x.target.kind === "path" && x.target.path === path.id);
  const overlap = path.known_pathway_overlap;
  const overlapPathway = overlap ? index.pathway.get(overlap.pathway) : undefined;
  const overlapPath = overlapPathway ? index.graph.paths.find((p) => p.pathway === overlapPathway.id) : undefined;
  const measurements = named?.performance?.measurements ?? [];
  const systems = named ? index.systemsOfPathway(named.id) : [];
  // Pass 42: the typed bounds reachable on this route — bounded_by claims on its nodes plus the exact pathway's own bounds —
  // with the same applicability test the thermodynamic-bound check uses.
  const HARD = new Set(["upper-bound", "formula-bound"]);
  const routePhenomena = new Set(path.nodes.filter((n) => index.entity.get(n)?.type === "phenomenon"));
  const appliesHere = (e: NonNullable<ReturnType<typeof index.entity.get>>) =>
    (e.applies_to_sources.length === 0 || e.applies_to_sources.includes(path.source)) &&
    (e.applies_to_outputs.length === 0 || e.applies_to_outputs.includes(path.sink)) &&
    (e.applies_to_phenomena.length === 0 || e.applies_to_phenomena.some((p) => routePhenomena.has(p)));
  const typedBounds: { entity: NonNullable<ReturnType<typeof index.entity.get>>; via: "claim" | "pathway"; hard: boolean; applies: boolean; pathwayBound?: NonNullable<typeof named>["bounds"][number] }[] = [];
  for (const n of path.nodes)
    for (const c of index.claimsFrom(n)) {
      if (c.predicate !== "bounded_by" && c.predicate !== "governed_by") continue;
      const e = index.entity.get(c.object);
      if (!e || e.type !== "constraint" || typedBounds.some((b) => b.entity.id === e.id)) continue;
      const hard = !!e.constraint_kind && HARD.has(e.constraint_kind);
      typedBounds.push({ entity: e, via: "claim", hard, applies: hard && appliesHere(e) });
    }
  for (const pb of named?.bounds ?? []) {
    const e = index.entity.get(pb.constraint);
    if (!e || typedBounds.some((b) => b.entity.id === e.id)) continue;
    const hard = !!e.constraint_kind && HARD.has(e.constraint_kind);
    typedBounds.push({ entity: e, via: "pathway", hard, applies: hard && appliesHere(e), pathwayBound: pb });
  }
  // Pass 35: the best recorded efficiency is derived from the structured physical measurements (never a model datum),
  // so a pathway needs no legacy efficiency_record for the page to say what has been measured.
  const PHYSICAL = new Set(["laboratory", "device", "module", "system", "plant", "field"]);
  const best = measurements.filter((m) => m.metric === "conversion-efficiency" && m.value_numeric !== undefined && PHYSICAL.has(m.scope)).sort((a, b) => b.value_numeric! - a.value_numeric!)[0];
  // Pass 37: the best recorded power density, per unit (densities in different units are not comparable), physical scopes only.
  // Two W/m² data with different normalisation bases never compete for one "best" (pass 37).
  const densityKey = (m: (typeof measurements)[number]) => `${m.metric}|${m.unit}|${m.normalization?.kind ?? "?"}|${m.normalization?.basis ?? "?"}`;
  const bestDensity = [
    ...measurements
      .filter((m) => m.metric === "power-density" && m.value_numeric !== undefined && m.unit && PHYSICAL.has(m.scope))
      .reduce((acc, m) => (acc.has(densityKey(m)) && acc.get(densityKey(m))!.value_numeric! >= m.value_numeric! ? acc : acc.set(densityKey(m), m)), new Map<string, (typeof measurements)[number]>())
      .values(),
  ];

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
        {systems.length > 0 && (
          <p className="t-ui secondary" style={{ marginTop: 8, fontWeight: 400 }}>
            Member of{" "}
            {systems.map((s, i) => (
              <span key={s.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/system/${s.id.split(":")[1]}`}>{s.name}</Link> as its {s.members.find((m) => m.pathway === named!.id)?.role}
              </span>
            ))}{" "}
            — a system whose other members and handoffs carry what this route alone cannot.
          </p>
        )}

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
          <dd>
            {routeSearch ? searchRouteSentence(routeSearch) : comp.long}
            {routeSearch && routeSearch.result === "no-demonstration-found" && (
              <div className="t-micro secondary">This is search provenance, not evidence that the composition is absent from nature.</div>
            )}
          </dd>
          {named && (
            <>
              <dt>recorded pathway</dt>
              <dd>
                {named.name} · {PATHWAY_STATUS_LABEL[named.status]}
                {named.status === "proposed" ? " — a proposal in the literature, not a demonstration; the route stays a candidate and its search state is unchanged by the proposal" : ""}
                {named.status === "observed" && (
                  <>
                    {" — one physical experiment traversed every conversion phenomenon and handoff in order, established through "}
                    {named.observed_through ? (
                      <Link href={claimHref(named.observed_through)}>
                        {(() => {
                          const c = index.claim.get(named.observed_through);
                          return c ? `${index.entity.get(c.subject)?.name ?? c.subject} → ${index.entity.get(c.object)?.name ?? c.object}` : named.observed_through;
                        })()}
                      </Link>
                    ) : (
                      "an unnamed step"
                    )}
                    {"; the later step(s) and the route's recorded output are not shown by it. The route stays a "}
                    {FRONTIER_LABEL[path.frontier_class]}
                    {" and its search state is unchanged by the observation."}
                  </>
                )}
              </dd>
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
                {overlap.relation === "stage-omission" && (
                  <>
                    {" "}
                    · omits {(overlap.omitted_phenomena ?? []).map((id) => index.entity.get(id)?.name ?? id).join(", ")}, which supplies {(overlap.supplies ?? []).join(", ")} — the regime or
                    handoff this shortened spelling leaves unresolved (pass 43)
                  </>
                )}
              </>
            )}
          </dd>
          {named && named.auxiliary_requirements.length > 0 && (
            <>
              <dt>auxiliaries off the route</dt>
              <dd>
                <ul className={styles.conditions}>
                  {named.auxiliary_requirements.map((a, i) => (
                    <li key={i}>
                      {a.kind.replace(/-/g, " ")} · {a.energy_form} · {a.purpose}
                      {a.establishes.length > 0 ? ` — establishes ${a.establishes.join(", ")}` : ""}
                      {a.conditions.length > 0 ? `: ${a.conditions.join("; ")}` : ""}
                      {a.note ? ` (${a.note})` : ""}
                    </li>
                  ))}
                </ul>
                <span className="t-micro secondary">
                  Loads the named implementation needs that no linear route carries (pass 36); a whole-cycle or net efficiency includes them, the enumerated route is the useful-output causal spine.
                </span>
              </dd>
            </>
          )}
          {named && named.regime_establishments.length > 0 && (
            <>
              <dt>regimes the implementation establishes</dt>
              <dd>
                <ul className={styles.conditions}>
                  {named.regime_establishments.map((e, i) => (
                    <li key={i}>
                      {e.token} · {e.kind.replace(/-/g, " ")}
                      {e.component ? ` · ${e.component}` : ""}: {e.explanation} · refs {e.evidence.map(refNo).filter((n) => n > 0).map((n) => `[${n}]`).join(" ")}
                    </li>
                  ))}
                </ul>
                <span className="t-micro secondary">
                  A physical process inside the named implementation that establishes a regime its route requires (pass 43) — never an off-route load and never a conversion stage the route should carry.
                </span>
              </dd>
            </>
          )}
          <dt>route-level evidence</dt>
          <dd>
            {compositionSources.length} source{compositionSources.length === 1 ? "" : "s"} for the complete composition · {constituentSources.length} cited by the constituent steps
            {path.literature.contradictory ? ` · ${path.literature.contradictory} contradictory constituent claim${path.literature.contradictory === 1 ? "" : "s"}` : ""}
          </dd>
          <dt>boundaries and interfaces</dt>
          <dd>
            {boundaryLine(path)}
            {interfaces.length > 0 && (
              <ul className={styles.conditions}>
                {interfaces.map((f) => (
                  <li key={f.id}>
                    <b>{f.id.split(":")[1]}</b> · {INTERFACE_KIND_LABEL[f.kind]} · {f.status} · {f.from_region} → {f.to_region}
                    {f.carrier ? ` · carries ${index.entity.get(f.carrier)?.name ?? f.carrier}` : ""}
                    {f.handoff_token ? ` · preserves ${f.handoff_token}` : ""}
                    {"between_claims" in f.location
                      ? ` · between ${f.location.between_claims.from_claim.split(":")[1]} and ${f.location.between_claims.to_claim.split(":")[1]}`
                      : ` · within ${f.location.within_claim.split(":")[1]}`}
                    {f.relation ? (
                      <div className="t-data">
                        {f.relation.formula}
                        {f.relation.conventions ? <span className="secondary"> — {f.relation.conventions}</span> : null}
                      </div>
                    ) : null}
                    {f.conditions.map((x) => (
                      <div key={x} className="secondary">
                        {x}
                      </div>
                    ))}
                    {f.notes ? <div className="secondary">{f.notes}</div> : null}
                    {f.evidence.length > 0 && (
                      <div className="t-micro secondary">
                        evidence:{" "}
                        {f.evidence.map((s, i) => (
                          <span key={s}>
                            {i > 0 ? ", " : ""}
                            <Link href={hrefFor(s)}>{index.source.get(s)?.title ?? s}</Link>
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {path.implied_interfaces.length > 0 && (
              <div className="secondary">unrecorded: {path.implied_interfaces.map((x) => x.replace(/^claim:([^ ]+) → claim:([^:]+): /, "$1 → $2: ")).join("; ")}</div>
            )}
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

      {(routeSearch || routeRuns.length > 0) && (
        <section className={styles.section} id="search">
          <h2 className="label">Literature search for this exact composition</h2>
          {routeSearch && <SearchRecordView record={routeSearch} />}
          {routeRuns.map((x) => (
            <AutomatedRunView key={x.id} run={x} />
          ))}
          <p className="t-micro secondary" style={{ marginTop: 6 }}>
            Protocol route-search-v1: a frozen index run changes only the search state; only a reviewed record can say that a demonstration was or was not found.
          </p>
        </section>
      )}

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
            {bestDensity.map((m) => (
              <div key={densityKey(m)} style={{ display: "contents" }}>
                <dt>best recorded power density (derived)</dt>
                <dd>
                  {m.value} per {m.normalization?.basis?.replace(/-/g, " ") ?? "unstated basis"} — {m.quantity}, {m.scope}
                  {m.year ? `, ${m.year}` : ""}; {m.basis}
                </dd>
              </div>
            ))}
            {best && (
              <>
                <dt>best recorded efficiency (derived)</dt>
                <dd>
                  {(best.value_numeric! * 100).toFixed(1)}% — {best.quantity}, {best.scope}
                  {best.year ? `, ${best.year}` : ""}; derived from the structured data above, not a stored number
                </dd>
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

      {typedBounds.length > 0 && (
        <section className={styles.section} id="bounds">
          <h2 className="label">Typed bounds on this route</h2>
          <p className="t-micro secondary" style={{ marginBottom: 8 }}>
            Every limit the atlas holds for this route, as constraint records: reached through bounded_by claims on the route&apos;s own entities
            {named?.bounds.length ? " or recorded for this exact architecture" : ""}. Hard bounds (an upper bound or a formula) decide the thermodynamic-bound check above; benchmarks, constitutive
            relations and resource limits are listed and never decisive. No prose limit exists anywhere (pass 42).
          </p>
          <ul className={styles.conditions}>
            {typedBounds.map((b) => (
              <li key={b.entity.id}>
                <Link href={hrefFor(b.entity.id)}>{b.entity.name}</Link>
                <span className="t-data secondary">
                  {" "}
                  · {b.entity.constraint_kind ?? "unclassified"}
                  {b.hard ? (b.applies ? " · hard, applies to this route" : " · hard, filtered out by its applicability") : " · listed, never decisive"}
                  {b.via === "pathway" ? " · recorded for this exact architecture" : ""}
                </span>
                {b.entity.bound && <div className={`${styles.limit} t-data`}>{b.entity.bound}</div>}
                {b.via === "pathway" && b.pathwayBound && (
                  <div className="t-micro secondary">
                    {b.pathwayBound.conditions.join("; ")}
                    {b.pathwayBound.note ? ` — ${b.pathwayBound.note}` : ""} · refs {b.pathwayBound.evidence.map(refNo).filter((n) => n > 0).map((n) => `[${n}]`).join(" ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
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
