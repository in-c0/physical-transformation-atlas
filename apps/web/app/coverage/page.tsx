import type { Metadata } from "next";
import { atlas } from "@/lib/data";
import { pct } from "@/lib/format";
import styles from "./coverage.module.css";

export const metadata: Metadata = { title: "Coverage", description: "What the atlas does and does not yet cover, by physics domain." };

function Bar({ value }: { value: number }) {
  const blocks = 10;
  const filled = Math.round(value * blocks);
  return (
    <span className={styles.bar} aria-hidden="true">
      {Array.from({ length: blocks }, (_, i) => (
        <span key={i} className={i < filled ? styles.on : styles.off} />
      ))}
    </span>
  );
}

export default function CoveragePage() {
  const a = atlas();
  const rows = a.graph.coverage;
  const c = a.graph.meta.counts;
  const sourcesWithDoi = a.graph.sources.filter((s) => s.doi).length;
  const verified = Object.values(a.graph.source_verification).filter((v) => v.verified).length;
  const claimsNoEvidence = a.graph.claims.filter((x) => x.evidence.length === 0).length;
  const unresolved = a.graph.claims.filter((x) => ["hypothesised", "disputed", "theoretically-predicted", "reported"].includes(x.status)).length;
  return (
    <main className={styles.main}>
      <div className="label">Coverage · dataset r{a.graph.meta.data_hash}</div>
      <h1 className="t-title" style={{ margin: "6px 0 10px" }}>
        What the atlas covers
      </h1>
      <p className={styles.lead}>
        These bars estimate how much of each physics domain the atlas has represented so far. The first bar divides the number of phenomena recorded in a domain by an editorial target for a thorough first release of that domain. The second divides the domain's claims that cite a source by all of its claims. Neither is a measure of how much physics humanity understands.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Domain</th>
            <th scope="col">Ontology</th>
            <th scope="col" className={styles.num}>
              phenomena / target
            </th>
            <th scope="col">Literature</th>
            <th scope="col" className={styles.num}>
              cited / claims
            </th>
            <th scope="col" className={styles.num}>
              unresolved
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.domain}>
              <th scope="row">{r.name}</th>
              <td>
                <Bar value={r.ontology_coverage} /> <span className="t-data">{pct(r.ontology_coverage)}</span>
              </td>
              <td className={`${styles.num} t-data`}>
                {r.phenomena} / {r.target_phenomena}
              </td>
              <td>
                <Bar value={r.literature_coverage} /> <span className="t-data">{r.claims ? pct(r.literature_coverage) : "—"}</span>
              </td>
              <td className={`${styles.num} t-data`}>
                {r.claims_with_evidence} / {r.claims}
              </td>
              <td className={`${styles.num} t-data`}>{r.unresolved_claims}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className={styles.section}>
        <h2 className="label">Corpus</h2>
        <dl className={styles.facts}>
          <dt>entities</dt>
          <dd>{c.entities}</dd>
          <dt>phenomena</dt>
          <dd>{c.phenomena}</dd>
          <dt>claims</dt>
          <dd>
            {c.claims} · {claimsNoEvidence} without a source · {unresolved} not yet established
          </dd>
          <dt>sources</dt>
          <dd>
            {c.sources} · {sourcesWithDoi} with a DOI · {verified} DOIs matched against Crossref
          </dd>
          <dt>named pathways</dt>
          <dd>{c.pathways_named}</dd>
          <dt>paths examined</dt>
          <dd>
            {c.paths_examined} enumerated compositions · {c.paths_demonstrated} demonstrated · {c.paths_no_demonstration_found} searched with no demonstration found · {c.paths_not_searched} not searched
          </dd>
          <dt>matrix</dt>
          <dd>
            {c.matrix_cells} cells · {c.matrix_cells_empty} without a direct relation · {c.matrix_cells_unsearched} not searched
          </dd>
          <dt>indexed through</dt>
          <dd>{a.graph.meta.built_at.slice(0, 10)}</dd>
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className="label">How to read the gaps</h2>
        <div className="prose">
          <p>
            A low ontology bar means the atlas has not yet written down the phenomena of that domain, not that the domain lacks them. Nuclear, plasma, quantum-transport and biophysical domains are deliberately thin in this release: the representation was first tested on thermal, mechanical, electromagnetic and chemical conversions, where most of the demonstrated pathways live.
          </p>
          <p>
            "Not searched" means exactly that. The atlas records a literature search only when one has been run and reviewed, and it never infers absence of evidence from absence of a search. When an automated index query has run but nobody has reviewed the hits, the cell says so.
          </p>
          <p>
            Targets are round editorial numbers kept in <code>data/canonical/ontology/domains.yaml</code>. Raising a target lowers the bar; that is the point. They exist so that the bars fall when we learn a domain is larger than we thought.
          </p>
        </div>
      </section>
    </main>
  );
}
