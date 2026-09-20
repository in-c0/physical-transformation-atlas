import type { Metadata } from "next";
import Link from "next/link";
import { atlas } from "@/lib/data";
import { CHECK_NAME } from "@/lib/format";
import { KNOWLEDGE_LEVEL_LABEL, KNOWLEDGE_LEVELS, PREDICATES } from "@pta/schema";
import styles from "./methods.module.css";

export const metadata: Metadata = { title: "Methods", description: "The ontology, the evidence model, the status model and how paths are checked." };

export default function MethodsPage() {
  const a = atlas();
  const tags = a.graph.claims.reduce((s, c) => s + (c.condition_tags.length ? 1 : 0), 0);
  const relations = a.graph.claims.filter((c) => c.relation).length;
  return (
    <main className={styles.main}>
      <div className="label">Methods</div>
      <h1 className="t-title" style={{ margin: "6px 0 10px" }}>
        How the atlas is built
      </h1>
      <p className={styles.lead}>
        The atlas is a set of reviewed claims about physics, compiled into a graph that can be searched for conversion pathways nobody has demonstrated. This page explains what a claim is, how a
        pathway inherits a status from its claims, what the seven checks test, and where the language on the site comes from.
      </p>

      <section className={styles.section} id="ontology">
        <h2 className="t-section">1. Ontology</h2>
        <div className="prose">
          <p>
            The canonical object is not an energy source. It is a physical transformation: a disequilibrium (a temperature difference, a salinity difference, a stressed solid) driving a phenomenon
            (the Seebeck effect, reverse electrodialysis, piezoelectricity) that hands its energy to a carrier (charge carriers, ionic current, a spin current) and eventually to an output (electrical
            work, mechanical work, cooling, fuel).
          </p>
          <p>
            Entities come in these types: system, quantity, disequilibrium, state, interaction, phenomenon, transition, carrier, coupling family, transducer, material, constraint and output. Only four
            of them can sit in a conversion path — disequilibrium, phenomenon, carrier and output. The rest describe conditions, bounds, materials and devices.
          </p>
          <p>
            A coupling family (thermoelectric, piezoelectric, osmotic, …) is the column of the matrix. A phenomenon belongs to a family through a <code>member_of</code> claim. A disequilibrium is a
            row. The cell is whatever the claims say about that pair.
          </p>
        </div>
      </section>

      <section className={styles.section} id="claims">
        <h2 className="t-section">2. Claims, not edges</h2>
        <div className="prose">
          <p>
            Nothing in the graph is an unquestioned edge. Every relation is stored as a claim with a subject, a predicate, an object, the conditions under which it holds, the sources that support it
            and a review status. The predicates are:
          </p>
          <p className={styles.mono}>{PREDICATES.join(" · ")}</p>
          <p>
            Four of them — <code>drives</code>, <code>produces</code>, <code>couples_to</code> and <code>converts_into</code> — carry energy from one node to the next and are the only ones the path
            search follows. Process claims also carry an energy ledger (input form, output form, where the loss goes) and, where a constitutive relation exists, its formula with the unit of its
            coefficient. In this release {relations} claims carry a relation and {tags} carry machine-checkable condition tags.
          </p>
          <p>
            A claim's status is one of: established, replicated, demonstrated, reported, theoretically predicted, hypothesised, disputed, contradicted, invalid. A path takes the status of its weakest
            claim.
          </p>
        </div>
      </section>

      <section className={styles.section} id="status">
        <h2 className="t-section">3. Two kinds of status</h2>
        <div className="prose">
          <p>
            Evidence status says how well the physics of a relation is known. Search status says whether anyone has looked for a demonstration of a particular composition. They are independent: the
            Seebeck effect is established physics, and a five-step composition that uses it may never have been searched. The atlas never turns "we found no paper" into "nobody has tried this". A cell
            or a path can only say <em>no demonstration found</em> when a reviewed search record exists with that result. Otherwise it says <em>not searched</em>, or{" "}
            <em>index queried, not reviewed</em> when only an automated query has run.
          </p>
          <p>Knowledge levels place a phenomenon or pathway on one scale:</p>
          <table className={styles.table}>
            <tbody>
              {KNOWLEDGE_LEVELS.map((k) => (
                <tr key={k}>
                  <th scope="row" className={styles.mono}>
                    {k}
                  </th>
                  <td>{KNOWLEDGE_LEVEL_LABEL[k]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>A composition nobody has demonstrated cannot sit above K4 however well its parts are known, because the composition itself has only been assembled, not observed.</p>
        </div>
      </section>

      <section className={styles.section} id="matrix">
        <h2 className="t-section">4. The matrix</h2>
        <div className="prose">
          <p>
            Each cell is a disequilibrium × coupling-family pair. If a <code>drives</code> claim links the row to a phenomenon in the column's family, the cell shows that claim's evidence status
            (established, demonstrated, theoretical, contradicted, or insufficient when the claim cites nothing). If not, the compiler looks for bridges: enumerated paths from the row that pass
            through a phenomenon of the column's family. A cell with a bridge whose every constituent is at least demonstrated is a <em>candidate composition</em>. A row whose disequilibrium carries
            no exergy, and whose constraint claim records that, is <em>forbidden</em>. The remaining cells are <em>searched · none found</em>, <em>index queried</em> or <em>not searched</em>, in that
            order of what is actually on record.
          </p>
          <p>
            Addresses like D.04 × C.11 are stable dataset addresses: rows and columns are numbered in file order and filtering never renumbers them, so <code>/matrix?cell=D.04:C.11</code> is a
            permanent link to one scientific question.
          </p>
        </div>
      </section>

      <section className={styles.section} id="structure">
        <h2 className="t-section">5. Structure of a route</h2>
        <div className="prose">
          <p>
            Two routes can have the same evidence and very different research value. Alongside its evidence class, every route is classed by structure, which says nothing about how well its physics is
            known: <em>composition</em> (two or more conversion phenomena with a real handoff between mechanisms), <em>one effect plus bookkeeping</em> (fewer than two phenomena),{" "}
            <em>carrier-expanded copy</em> (a shorter route with the same source and sink already contains its phenomena and the extra steps add no cross-family seam and no energy-form transition),{" "}
            <em>same mechanism at another resolution</em> (the same mechanism core as a named pathway drawn with different carrier nodes, or the same source, ordered coupling families and sink form as another composition — one representative stays on the frontier), <em>energy backtracking</em> (a form reappears after a
            different one, as in electricity → heat → electricity), and <em>known device likely</em> (every phenomenon is implemented by one common transducer, so the composition is probably an
            uncurated pathway).
          </p>
          <p>
            Only compositions can make an empty matrix cell a candidate, and only compositions appear on the frontier by default. Each route also records its conversion phenomena in order, its
            collapsed energy-form sequence, the number of genuine cross-family seams, how many of the four core checks are unresolved, how many interfaces its condition tags imply, and how many of its
            conversion steps carry a constitutive relation.
          </p>
          <p>
            The frontier order is a fixed lexicographic order, never a score: structure, then resolution of the four core checks, then evidence floor and the count of non-established constituents,
            then mechanism novelty (one or two seams first), then composition-search strength, then how readily the driver is found, then the number of phenomena, then overlap with recorded pathways.
            The same order chooses which bridge a matrix cell shows first.
          </p>
        </div>
      </section>

      <section className={styles.section} id="paths">
        <h2 className="t-section">6. Path enumeration</h2>
        <div className="prose">
          <p>
            From every disequilibrium the compiler follows process claims depth-first, never revisiting a node, up to seven steps, and records every route that ends at an output. Each route gets a
            stable id from the hash of its claim sequence. If a route matches a named, reviewed pathway (a thermoelectric generator, a wind turbine, a hydrovoltaic generator) it inherits that
            pathway's status, knowledge level and measured performance. This release examines {a.graph.meta.counts.paths_examined} routes, of which {a.graph.meta.counts.paths_demonstrated} are
            demonstrated.
          </p>
          <p>
            Routes are then classed for the frontier: demonstrated; candidate (every constituent at least demonstrated, no check fails, and fewer than two relations shared with a recorded pathway);
            extends a recorded pathway (the same, but sharing two or more relations with one); weakly supported (a constituent is theoretical or worse); fails a check; or round trip (source and sink
            share an energy form).
          </p>
        </div>
      </section>

      <section className={styles.section} id="checks">
        <h2 className="t-section">7. The seven checks</h2>
        <div className="prose">
          <p>
            Every route is passed through seven checks. Each returns pass, fail, unresolved (the data needed to decide is partly present) or unknown (none of it is recorded), and a sentence saying
            what was examined. The site shows the sentence, never just the verdict.
          </p>
          <dl className={styles.checks}>
            <dt>{CHECK_NAME["type-chain"]}</dt>
            <dd>The route starts at a disequilibrium, ends at an output, and every step is an allowed (subject type, predicate, object type) triple whose object is the next step's subject.</dd>
            <dt>{CHECK_NAME["energy-form-continuity"]}</dt>
            <dd>Where consecutive steps declare an energy ledger, the form one step emits is the form the next step takes, and any carrier in between carries that form.</dd>
            <dt>{CHECK_NAME["conservation"]}</dt>
            <dd>
              The source carries exergy relative to a reference environment, no step is contradicted or invalid, and every step declares its output and its losses. A source with no exergy — heat at
              uniform temperature, the quantum vacuum — fails here, which is how the second law enters the atlas.
            </dd>
            <dt>{CHECK_NAME["thermodynamic-bound"]}</dt>
            <dd>
              Collects the <code>bounded_by</code> constraints of the route's phenomena. When a constraint has a numeric ceiling that applies to the route's source, any recorded efficiency is compared
              with it.
            </dd>
            <dt>{CHECK_NAME["dimensional"]}</dt>
            <dd>
              For each step with a constitutive relation, the SI dimension of the output quantity must equal the dimension of the coefficient times the dimension of the input quantity. Units are
              parsed from a table in the ontology.
            </dd>
            <dt>{CHECK_NAME["boundary-compatibility"]}</dt>
            <dd>
              Condition tags (vacuum, aqueous, cryogenic, above 700 K, ferroelectric, …) are checked against a list of declared conflicts. A conflict inside one step fails. A conflict between two
              adjacent steps means an interface — a heat exchanger, a window, a shaft — is implied but not recorded, so it is unresolved rather than failed.
            </dd>
            <dt>{CHECK_NAME["practical-magnitude"]}</dt>
            <dd>
              Whether a measured efficiency or power density exists on record for this exact composition. For an undemonstrated composition this is unknown, and the site says so instead of inventing a
              number.
            </dd>
          </dl>
        </div>
      </section>

      <section className={styles.section} id="evidence">
        <h2 className="t-section">8. Evidence and provenance</h2>
        <div className="prose">
          <p>
            Every claim cites at least one source. Sources with a DOI are checked against Crossref by a pipeline that records whether the DOI resolves and whether the title Crossref returns matches
            the one on file; the result is shown beside each reference. Historical sources that predate DOIs are listed with their venue.
          </p>
          <p>
            Search records are the only thing allowed to say "no demonstration found". A record names the engine, the date, the query string, the number of works found and the top hits, and whether a
            reviewer judged that a qualifying demonstration exists. Automated index queries are stored separately from reviewed searches and are never promoted without review.
          </p>
        </div>
      </section>

      <section className={styles.section} id="governance">
        <h2 className="t-section">9. Changing the atlas</h2>
        <div className="prose">
          <p>
            The canonical data is YAML under <code>data/canonical</code>, source-controlled and reviewed in pull requests. Validation rejects unknown units, invalid predicates, dangling entities,
            missing provenance and malformed conditions before anything is compiled. The compiler is deterministic: the dataset revision shown in the status rail is a hash of the canonical files, so
            two people building the same commit see the same numbers.
          </p>
          <p>
            Candidate compositions generated by search are public as compositions of known relations. Newly proposed device concepts with possible patent standing go through a review queue first,
            following the atlas's publication policy; nothing in this release is in that queue.
          </p>
        </div>
      </section>

      <section className={styles.section} id="language">
        <h2 className="t-section">10. Language</h2>
        <div className="prose">
          <p>
            The site reports the state of the atlas, never the state of nature. The canonical strings are: "Not searched." · "No direct demonstration found — searched in indexed evidence through{" "}
            {"{date}"}." · "No canonical relation currently recorded. This does not imply the relation is impossible." · "No composed pathway currently recorded." · "Insufficient evidence to assign a
            stronger status." Numbers on screen are computed from the dataset or replaced by an em dash. Nothing is decorative.
          </p>
          <p>
            The full data is public under <code>/api/</code>: <Link href="/api/stats.json">stats</Link>, <Link href="/api/graph.json">graph</Link>, <Link href="/api/entities.json">entities</Link>,{" "}
            <Link href="/api/claims.json">claims</Link> (also <Link href="/api/claims.ndjson">ndjson</Link> and <Link href="/api/claims.csv">csv</Link>), <Link href="/api/sources.json">sources</Link>,{" "}
            <Link href="/api/pathways.json">pathways</Link>, <Link href="/api/paths.json">paths</Link>, <Link href="/api/matrix.json">matrix</Link>, <Link href="/api/coverage.json">coverage</Link>,{" "}
            <Link href="/api/checks.json">checks</Link> (the seven checks above as data), <Link href="/api/vocabulary.json">vocabulary</Link> (every enumeration defined) and the JSON Schema at{" "}
            <Link href="/api/schema/v0.2.0.json">schema/v0.2.0.json</Link>. Every file carries the same <code>meta</code> block: dataset revision, build provenance, counts, schema pointer and reuse
            terms. The contract is <a href="https://github.com/in-c0/physical-transformation-atlas/blob/main/docs/data-api.md">docs/data-api.md</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
