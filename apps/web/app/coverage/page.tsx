import type { Metadata } from "next";
import Link from "next/link";
import { atlas } from "@/lib/data";
import { hrefFor, pct } from "@/lib/format";
import styles from "./coverage.module.css";

export const metadata: Metadata = { title: "Coverage", description: "How much of its own editorial scope this atlas has filled, by physics domain, and what has actually been searched." };

function Bar({ value }: { value: number }) {
  const blocks = 10;
  const filled = Math.min(blocks, Math.round(value * blocks));
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
  const m = a.graph.meta;
  const sourcesWithDoi = a.graph.sources.filter((s) => s.doi).length;
  const verified = Object.values(a.graph.source_verification).filter((v) => v.verified).length;
  const claimsNoEvidence = a.graph.claims.filter((x) => x.evidence.length === 0).length;
  const openStatus = a.graph.claims.filter((x) => ["hypothesised", "disputed", "theoretically-predicted", "reported"].includes(x.status)).length;
  const contradicted = a.graph.claims.filter((x) => x.status === "contradicted" || x.status === "invalid").length;
  const totalRecorded = rows.reduce((n, r) => n + r.phenomena, 0);
  const totalTarget = rows.reduce((n, r) => n + r.target_phenomena, 0);
  const missing = rows.flatMap((r) => r.missing_from_inventory.map((slug) => ({ domain: r.name, slug })));
  return (
    <main className={styles.main}>
      <div className="label">Coverage · dataset r{m.data_hash}</div>
      <h1 className="t-title" style={{ margin: "6px 0 10px" }}>
        What the atlas covers
      </h1>
      <p className={styles.lead}>
        These measures describe this atlas, not the completeness of physics or the scientific literature. Scope fill compares phenomenon records in this revision with an editorial first-release
        checklist per domain. Citation completeness reports the fraction of claim records carrying at least one cited source; it does not mean the literature has been comprehensively searched. Every
        number below is a count over the records of revision r{m.data_hash}.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Domain</th>
              <th scope="col">Editorial scope fill</th>
              <th scope="col" className={styles.num}>
                recorded / scope target
              </th>
              <th scope="col" className={styles.num}>
                claims with source / claims
              </th>
              <th scope="col" className={styles.num}>
                established+replicated / demonstrated / open
              </th>
              <th scope="col" className={styles.num}>
                no-search cells / matrix cells
              </th>
              <th scope="col" className={styles.num}>
                reviewed / index-only searches
              </th>
              <th scope="col" className={styles.num}>
                newest cited source
              </th>
              <th scope="col" className={styles.num}>
                named pathways
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
                <td className={`${styles.num} t-data`}>
                  {r.claims_with_evidence} / {r.claims}
                </td>
                <td className={`${styles.num} t-data`}>
                  {r.claims_established} / {r.claims_demonstrated} / {r.open_status_claims}
                </td>
                <td className={`${styles.num} t-data`}>{r.matrix_cells ? `${r.matrix_cells_without_search_record} / ${r.matrix_cells}` : "no coupling column"}</td>
                <td className={`${styles.num} t-data`}>
                  {r.reviewed_searches} / {r.index_only_searches}
                </td>
                <td className={`${styles.num} t-data`}>{r.newest_source_year ?? "—"}</td>
                <td className={`${styles.num} t-data`}>{r.named_pathways}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="t-micro secondary" style={{ marginTop: 8 }}>
        Aggregate scope fill: {totalRecorded} / {totalTarget} editorial checklist slots in this revision ({pct(totalRecorded / totalTarget, 1)}); the denominator is maintained by the atlas and is not
        an estimate of the number of physical phenomena in nature. A pathway with steps in two domains counts in both. "No-search cells" are matrix cells in the domain's coupling columns with no
        search record of any kind; "newest cited source" is citation recency, not search recency.
      </p>

      <section className={styles.section}>
        <h2 className="label">Corpus</h2>
        <dl className={styles.facts}>
          <dt>entities</dt>
          <dd>{c.entities} entity records</dd>
          <dt>phenomena</dt>
          <dd>{c.phenomena} phenomenon records</dd>
          <dt>claims</dt>
          <dd>
            {c.claims} canonical claim records · {claimsNoEvidence} without a source · {openStatus} reported / theoretical / hypothesised / disputed claim records
            {contradicted ? ` · ${contradicted} contradicted / invalid` : ""}
          </dd>
          <dt>sources</dt>
          <dd>
            {c.sources} source records · {sourcesWithDoi} with a DOI · {verified} DOIs matched against Crossref
          </dd>
          <dt>named pathways</dt>
          <dd>{c.pathways_named} recorded named pathways</dd>
          <dt>routes</dt>
          <dd>
            {c.routes_enumerated} routes enumerated from the current claim graph · {c.routes_with_recorded_composition_demonstration} with a recorded complete-composition demonstration ·{" "}
            {c.paths_no_demonstration_found} with a reviewed search that found none · {c.paths_not_searched} with no search record
          </dd>
          <dt>matrix</dt>
          <dd>
            {c.matrix_cells} cells · {c.matrix_cells_with_direct_relation} with a recorded direct relation · {c.matrix_cells_without_direct_relation} with no recorded direct relation ·{" "}
            {c.matrix_cells_without_search_record} with no search record
          </dd>
          <dt>dataset generated</dt>
          <dd>{m.built_at.slice(0, 10)}</dd>
          <dt>search records through</dt>
          <dd>{m.search_indexed_through ?? "none"}</dd>
          <dt>reviewed search records</dt>
          <dd>{c.searches_reviewed}</dd>
          <dt>index-only search runs</dt>
          <dd>{c.searches_index_only}</dd>
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className="label">Scope checklist · {missing.length} phenomena the atlas intends to record and has not yet</h2>
        <p className="t-micro secondary" style={{ marginBottom: 8 }}>
          The per-domain checklists live in <code>data/canonical/ontology/domains.yaml</code>; each domain's target is the length of its list. Recorded phenomena link to their pages.
        </p>
        <div className={styles.checklist}>
          {rows.map((r) => (
            <div key={r.domain}>
              <div className={styles.groupTitle}>
                {r.name} · {r.phenomena} recorded · {r.missing_from_inventory.length} missing
              </div>
              <p className={styles.slugs}>
                {a.graph.entities
                  .filter((e) => e.type === "phenomenon" && e.domain === r.domain)
                  .map((e) => (
                    <Link key={e.id} href={hrefFor(e.id)}>
                      {e.name}
                    </Link>
                  ))}
                {r.missing_from_inventory.map((slug) => (
                  <span key={slug} className="secondary">
                    {slug.replace(/-/g, " ")}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className="label">How to read the gaps</h2>
        <div className="prose">
          <p>
            A low scope-fill bar means the atlas has not yet written down the phenomena on its own checklist for that domain, not that the domain lacks them. Nuclear, plasma, quantum-transport and
            biophysical domains are deliberately thin in this release.
          </p>
          <p>
            "No search record" means exactly that. The atlas records a literature search only when one has been run, and it never infers absence of evidence from absence of a search. An automated
            index query that nobody has read marks a cell <em>index query only</em>; only a reviewed record can say <em>no demonstration found</em>. This revision has {c.searches_reviewed} reviewed
            search records and {c.searches_index_only} index-only runs.
          </p>
          <p>
            Scope targets are maintained checklists of phenomena the atlas intends to represent in its first broad release. They are editorial and revisable; they are not estimates of the total number
            of phenomena that exist. Lengthening a checklist lowers the bar; that is the point.
          </p>
        </div>
      </section>
    </main>
  );
}
