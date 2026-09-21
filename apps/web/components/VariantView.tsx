import Link from "next/link";
import type { CompiledPath, Pathway, Source } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { PATHWAY_STATUS_LABEL, claimHref, hrefFor, kLabel } from "@/lib/format";
import { Checksum } from "./Checksum";
import { EvidenceList } from "./EvidenceList";
import { CiteBlock } from "./CiteBlock";
import styles from "./PathView.module.css";

/** The canonical page of a variant pathway: /pathway/<slug> (pass 47, the reviewer's finding 8). */
export const variantHref = (id: string) => `/pathway/${id.split(":")[1]}`;

/**
 * A variant is a narrower recorded architecture on the exact route of its parent pathway (pass 46): the same claim sequence,
 * its own evidence, status, data and bounds. It never creates a matrix cell, a frontier candidate, a route or an overlap — the
 * route page keeps the parent — but it is a canonical record with its own measurements and limits, so it has its own address
 * (pass 47): this page renders the complete record and links both ways to the parent's route.
 */
export function VariantView({ index, variant, path }: { index: AtlasIndex; variant: Pathway; path: CompiledPath }) {
  const parent = variant.variant_of ? index.pathway.get(variant.variant_of) : undefined;
  const compiled = path.variants.find((v) => v.pathway === variant.id);
  const measurements = variant.performance?.measurements ?? [];
  // One numbering across the variant's evidence, its measurements' sources and its bounds' evidence.
  const sourceIds: string[] = [];
  const add = (id: string) => { if (!sourceIds.includes(id)) sourceIds.push(id); };
  for (const s of variant.evidence) add(s);
  for (const m of measurements) for (const s of m.sources) add(s);
  for (const b of variant.bounds) for (const s of b.evidence) add(s);
  const sources = sourceIds.map((s) => index.source.get(s)).filter((s): s is Source => !!s);
  const refNo = (id: string) => sources.findIndex((x) => x.id === id) + 1;
  const refs = (ids: string[]) => ids.map(refNo).filter((n) => n > 0).map((n) => `[${n}]`).join(" ");
  const PHYSICAL = new Set(["laboratory", "device", "module", "system", "plant", "field"]);
  const best = measurements.filter((m) => m.metric === "conversion-efficiency" && m.value_numeric !== undefined && PHYSICAL.has(m.scope)).sort((a, b) => b.value_numeric! - a.value_numeric!)[0];
  const ranges = measurements.filter((m) => m.metric === "conversion-efficiency" && m.value_range !== undefined && PHYSICAL.has(m.scope));
  const devices = variant.demonstrated_with.map((d) => index.entity.get(d)).filter((d): d is NonNullable<typeof d> => !!d);

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <div className="label">
          Recorded variant · {variant.id} · {PATHWAY_STATUS_LABEL[variant.status]}
        </div>
        <h1 className="t-title">{variant.name}</h1>
        <p className={styles.chain}>
          {path.nodes.map((n, i) => (
            <span key={n + i}>
              <Link href={hrefFor(n)}>{index.entity.get(n)?.name ?? n}</Link>
            </span>
          ))}
        </p>
        <p className={styles.summary}>{variant.summary}</p>
        <p className="t-ui secondary" style={{ marginTop: 8, fontWeight: 400 }}>
          A narrower recorded architecture on the exact route of <Link href={`/path/${path.id.slice(2)}`}>{parent?.name ?? path.pathway ?? path.id}</Link> — the same claim sequence,
          its own evidence, data and bounds. It counts as no new route, matrix cell, frontier candidate or overlap; the route page keeps its parent, and this page is the variant&apos;s
          own address.
        </p>
        <dl className={styles.facts}>
          <dt>variant of</dt>
          <dd>
            <Link href={`/path/${path.id.slice(2)}`}>{parent?.name ?? variant.variant_of}</Link> · {parent ? PATHWAY_STATUS_LABEL[parent.status] : ""} · route {path.id}
          </dd>
          <dt>status</dt>
          <dd>{PATHWAY_STATUS_LABEL[variant.status]}</dd>
          <dt>maturity</dt>
          <dd>{kLabel(variant.knowledge_level)}</dd>
          {devices.length > 0 && (
            <>
              <dt>demonstrated with</dt>
              <dd>
                {devices.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 ? ", " : ""}
                    <Link href={hrefFor(d.id)}>{d.name}</Link>
                  </span>
                ))}
              </dd>
            </>
          )}
          {variant.review.last_reviewed && (
            <>
              <dt>reviewed</dt>
              <dd>
                {variant.review.last_reviewed}
                {variant.review.reviewer ? ` · ${variant.review.reviewer}` : ""}
              </dd>
            </>
          )}
        </dl>
      </header>

      {compiled && (
        <section className={styles.section} id="checks" aria-label="Physics checks">
          <p className="t-micro secondary" style={{ marginBottom: 8 }}>
            The eight checks evaluated for this variant&apos;s own data and bounds on the shared route (the route page shows the parent&apos;s).
          </p>
          <Checksum checks={compiled.checks} claims={path.claims} />
        </section>
      )}

      <section className={styles.section} id="performance">
        <h2 className="label">Measured or reported performance</h2>
        {measurements.length === 0 && <p className="t-ui secondary" style={{ fontWeight: 400 }}>No datum-level record on this variant.</p>}
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
                {m.basis && <div className="t-micro secondary">basis: {m.basis}</div>}
                <div className="t-data secondary">
                  {m.metric ? `${m.metric} · ` : ""}
                  {m.datum_kind ? `${m.datum_kind} · ` : ""}refs {refs(m.sources)}
                </div>
              </li>
            ))}
          </ol>
        )}
        {(best || ranges.length > 0 || variant.performance?.notes) && (
          <dl className={styles.facts} style={{ marginTop: measurements.length ? 12 : 8 }}>
            {best && (
              <>
                <dt>best recorded efficiency (derived)</dt>
                <dd>
                  {(best.value_numeric! * 100).toFixed(1)}% — {best.quantity}, {best.scope}
                  {best.year ? `, ${best.year}` : ""}; derived from the structured data above, not a stored number
                </dd>
              </>
            )}
            {ranges.map((m) => (
              <div key={m.quantity + m.value} style={{ display: "contents" }}>
                <dt>reported range</dt>
                <dd>
                  {(m.value_range![0] * 100).toFixed(2)}–{(m.value_range![1] * 100).toFixed(2)}% — {m.quantity}, {m.scope}
                  {m.year ? `, ${m.year}` : ""}; an aggregate the source reports over its devices, never a single record
                </dd>
              </div>
            ))}
            {variant.performance?.notes && (
              <>
                <dt>notes</dt>
                <dd>{variant.performance.notes}</dd>
              </>
            )}
          </dl>
        )}
      </section>

      {variant.bounds.length > 0 && (
        <section className={styles.section} id="bounds">
          <h2 className="label">Bounds recorded for this exact architecture</h2>
          <p className="t-micro secondary" style={{ marginBottom: 8 }}>
            Limits valid only for this architecture (pass 42), evaluated beside the route&apos;s generic bounds in the thermodynamic-bound check above; they never reach the generic route.
          </p>
          <ul className={styles.conditions}>
            {variant.bounds.map((b) => {
              const e = index.entity.get(b.constraint);
              return (
                <li key={b.constraint}>
                  <Link href={hrefFor(b.constraint)}>{e?.name ?? b.constraint}</Link>
                  <span className="t-data secondary"> · {e?.constraint_kind ?? "unclassified"}</span>
                  {e?.bound && <div className={`${styles.limit} t-data`}>{e.bound}</div>}
                  <div className="t-micro secondary">
                    {b.conditions.join("; ")}
                    {b.note ? ` — ${b.note}` : ""} · refs {refs(b.evidence)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className={styles.section} id="steps">
        <h2 className="label">Steps (the parent&apos;s exact sequence)</h2>
        <ol className={styles.conditions}>
          {path.claims.map((id) => {
            const c = index.claim.get(id);
            if (!c) return null;
            return (
              <li key={id}>
                <Link href={claimHref(id)}>
                  {index.entity.get(c.subject)?.name ?? c.subject} → {index.entity.get(c.object)?.name ?? c.object}
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="t-micro secondary" style={{ marginTop: 6 }}>
          Every step, its conditions and its evidence are on the <Link href={`/path/${path.id.slice(2)}`}>route page</Link>.
        </p>
      </section>

      <section className={styles.section} id="evidence">
        <h2 className="label">Evidence for this variant</h2>
        <EvidenceList sources={sources} verification={index.graph.source_verification} numbering={refNo} />
      </section>

      <CiteBlock kind="pathway" id={variant.id} title={variant.name} revision={index.graph.meta.data_hash} />
    </article>
  );
}
