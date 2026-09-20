import styles from "./EntityView.module.css";

const SITE = "https://physical-transformation-atlas.wldud5192.workers.dev";

/** How to cite one record: its canonical URL, the dataset revision it was read at, and a reference line. */
export function CiteBlock({ kind, id, title, revision, href }: { kind: "claim" | "source" | "entity" | "route"; id: string; title: string; revision: string; href?: string }) {
  const path = href ?? (kind === "claim" ? `/claim/${id.split(":")[1]}` : kind === "source" ? `/source/${id.split(":")[1]}` : `/path/${id.slice(2)}`);
  const url = `${SITE}${path}`;
  const year = new Date().getUTCFullYear();
  return (
    <section className={styles.section}>
      <h2 className="label">Cite this {kind}</h2>
      <p className={styles.mono} style={{ fontSize: "var(--text-data)" }}>
        Physical Transformation Atlas ({year}). {kind} {id}: {title}. Dataset revision {revision}. {url}
      </p>
      <p className="t-micro secondary" style={{ marginTop: 6 }}>
        Ids and matrix addresses are stable across revisions; the revision hash identifies the exact canonical files the record was compiled from. Machine-readable: every /api export carries the same
        revision in meta.revision. Reuse terms: see the license field in any export.
      </p>
    </section>
  );
}
