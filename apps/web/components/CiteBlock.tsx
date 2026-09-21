import styles from "./EntityView.module.css";

const SITE = "https://physical-transformation-atlas.wldud5192.workers.dev";

/**
 * How to cite one record: its canonical URL, the dataset revision it was read at, and a reference
 * line. `href` is required for entities (their path depends on type); claims, sources and routes
 * derive it from the id.
 */
export function CiteBlock({
  kind,
  id,
  title,
  revision,
  href,
}: { kind: "claim" | "source" | "route" | "system"; id: string; title: string; revision: string; href?: string } | { kind: "entity"; id: string; title: string; revision: string; href: string }) {
  const path = href ?? (kind === "claim" ? `/claim/${id.split(":")[1]}` : kind === "source" ? `/source/${id.split(":")[1]}` : kind === "system" ? `/system/${id.split(":")[1]}` : `/path/${id.slice(2)}`);
  const url = `${SITE}${path}`;
  const year = new Date().getUTCFullYear();
  return (
    <section className={styles.section} id="cite">
      <h2 className="label">Cite this {kind}</h2>
      <p className={styles.mono} style={{ fontSize: "var(--text-data)" }}>
        Physical Transformation Atlas ({year}). {kind} {id}: {title}. Dataset revision r{revision} (hash of the canonical data). {url}
      </p>
      <p className="t-micro secondary" style={{ marginTop: 6 }}>
        Ids and matrix addresses are stable across revisions; the revision hash identifies the exact canonical files the record was compiled from and is <code>meta.data_hash</code> in every /api
        export. Reuse terms: see the license field in any export.
      </p>
    </section>
  );
}
