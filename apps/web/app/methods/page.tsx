import type { Metadata } from "next";
import Link from "next/link";
import { atlas } from "@/lib/data";
import { ENDPOINTS, REPO, SCHEMA_VERSION } from "@/lib/api";
import { claimHref, hrefFor, sourceHref } from "@/lib/format";
import { KNOWLEDGE_LEVEL_LABEL, KNOWLEDGE_LEVELS, PREDICATES, PROCESS_PREDICATES } from "@pta/schema";
import { VOCABULARY } from "@pta/schema/vocabulary";
import { CHECK_DEFINITIONS } from "@pta/physics/definitions";
import styles from "./methods.module.css";

export const metadata: Metadata = {
  title: "Methods",
  description: "How every public state of the atlas is derived: claims, route construction, the eight checks, the five state layers, search records, counts, a worked example and the limits.",
};

const DOCS = `${REPO}/blob/main`;

/** The worked example is built from the live records; if they change, the build fails rather than publishing a stale example. */
const EXAMPLE = {
  claim: "claim:seebeck-drives",
  member: "claim:seebeck-member-thermoelectric",
  sequence: ["claim:seebeck-drives", "claim:seebeck-produces-carriers", "claim:charge-carriers-convert-electricity"],
  pathway: "pathway:thermoelectric-generator",
  family: "coupling:thermoelectric",
};

function vocab(name: string) {
  const e = VOCABULARY.find((v) => v.name === name);
  if (!e) throw new Error(`methods: vocabulary enumeration ${name} is missing`);
  return e;
}

export default function MethodsPage() {
  const a = atlas();
  const g = a.graph;
  const m = g.meta;
  const c = m.counts;
  const tags = g.claims.reduce((s, cl) => s + (cl.condition_tags.length ? 1 : 0), 0);
  const relations = g.claims.filter((cl) => cl.relation).length;
  const ledgers = g.claims.filter((cl) => (PROCESS_PREDICATES as readonly string[]).includes(cl.predicate)).length;
  const ledgersMissing = g.claims.filter((cl) => (PROCESS_PREDICATES as readonly string[]).includes(cl.predicate) && !cl.energy).length;
  const candidates = g.paths.filter((p) => p.frontier_class === "candidate" && p.structural_kind === "composition").length;

  // Worked example records.
  const exClaim = a.claim.get(EXAMPLE.claim);
  const exMember = a.claim.get(EXAMPLE.member);
  const exRoute = g.paths.find((p) => p.claims.length === EXAMPLE.sequence.length && p.claims.every((id, i) => id === EXAMPLE.sequence[i]));
  const exPathway = a.pathway.get(EXAMPLE.pathway);
  const exCell = exClaim ? a.cell.get(`${exClaim.subject}|${EXAMPLE.family}`) : undefined;
  if (!exClaim || !exMember || !exRoute || !exPathway || !exCell || exRoute.pathway !== EXAMPLE.pathway || !exCell.direct_claims.includes(EXAMPLE.claim)) {
    throw new Error("methods: the worked example no longer matches the records; update EXAMPLE in apps/web/app/methods/page.tsx");
  }
  const exSubject = a.entity.get(exClaim.subject)!;
  const exObject = a.entity.get(exClaim.object)!;
  const exFamily = a.entity.get(EXAMPLE.family)!;
  const exRow = g.matrix.rows.find((r) => r.id === exClaim.subject)!;
  const exCol = g.matrix.cols.find((col) => col.id === EXAMPLE.family)!;
  const exChecks = exRoute.checks.map((k) => `${k.label}: ${k.result}`).join(" · ");

  const occurrence = (map: Record<string, number>, id: string) => map[id] ?? 0;
  const layers: { field: string; question: string; enumName: string; counts: Record<string, number> }[] = [
    { field: "claim.status", question: "how well is this one relation known?", enumName: "claim.status", counts: c.claims_by_status },
    { field: "path.search_status", question: "has anyone looked for a demonstration of this whole composition?", enumName: "path.search_status", counts: c.paths_by_search_status },
    {
      field: "path.frontier_class",
      question: "how does this enumerated route compare with evidence, checks and recorded pathways?",
      enumName: "path.frontier_class",
      counts: c.paths_by_frontier_class,
    },
    {
      field: "path.structural_kind",
      question: "is the route a genuine composition or a representational or engineering variant?",
      enumName: "path.structural_kind",
      counts: c.paths_by_structural_kind,
    },
    { field: "matrix.cells[].status", question: "what is on record for one driver × coupling-family coordinate?", enumName: "matrix.cell.status", counts: c.matrix_cells_by_status },
  ];

  return (
    <main className={styles.main}>
      <div className="label">Methods</div>
      <h1 className="t-title" style={{ margin: "6px 0 10px" }}>
        How the atlas is built
      </h1>
      <p className={styles.lead}>
        The atlas records reviewed claims about physics and compiles those claims into routes, matrix cells and coverage counts. It reports the state of those records, never the state of nature: an
        absent claim means not recorded, an absent search means not searched by the atlas, and a negative search means only that the recorded protocol found no qualifying demonstration through its
        stated date. This page explains how each public state is derived.
      </p>
      <nav aria-label="Sections" className={styles.toc}>
        <ol>
          <li>
            <a href="#claims">Claims and ontology</a>
          </li>
          <li>
            <a href="#routes">Route construction</a>
          </li>
          <li>
            <a href="#checks">The eight checks</a>
          </li>
          <li>
            <a href="#states">Five state layers</a>
          </li>
          <li>
            <a href="#candidate">What “candidate” means</a>
          </li>
          <li>
            <a href="#searches">Search records</a>
          </li>
          <li>
            <a href="#counts">Matrix and home-page counts</a>
          </li>
          <li>
            <a href="#example">Worked example</a>
          </li>
          <li>
            <a href="#evidence">Evidence thresholds and provenance</a>
          </li>
          <li>
            <a href="#limits">Enumeration limits</a>
          </li>
          <li>
            <a href="#non-goals">What the atlas deliberately does not do</a>
          </li>
          <li>
            <a href="#governance">Governance and revisions</a>
          </li>
          <li>
            <a href="#cite">Citation and data access</a>
          </li>
        </ol>
      </nav>

      <section className={styles.section} id="claims">
        <h2 className="t-section">1. Claims and ontology</h2>
        <div className="prose">
          <p>
            The canonical scientific unit is a claim: subject —predicate→ object, with conditions, evidence, evidence status and review provenance. Process claims may additionally record an energy
            ledger, a constitutive relation and explicit handoff tokens. Entities provide the things those claims refer to: disequilibria, phenomena, carriers, outputs, quantities, materials,
            constraints, coupling families and devices.
          </p>
          <p>
            Entities come in these types: system, quantity, disequilibrium, state, interaction, phenomenon, transition, carrier, coupling family, transducer, material, constraint and output. Only four
            of them can sit in a route — disequilibrium, phenomenon, carrier and output. The rest describe conditions, bounds, materials and devices. A coupling family (thermoelectric, piezoelectric,
            osmotic, …) is a column of the matrix; a phenomenon belongs to a family through a <code>member_of</code> claim; a disequilibrium is a row.
          </p>
          <p>The predicates are:</p>
          <p className={styles.mono}>{PREDICATES.join(" · ")}</p>
          <p>
            Four of them —{" "}
            {PROCESS_PREDICATES.map((p, i) => (
              <span key={p}>
                {i > 0 ? ", " : ""}
                <code>{p}</code>
              </span>
            ))}{" "}
            — carry energy from one node to the next and are the only ones route construction follows. Process claims are expected to record an energy ledger; missing ledgers are permitted by the
            schema and cause the relevant physics checks to return unresolved or unknown rather than being silently inferred. In this revision {ledgers} claims are process claims
            {ledgersMissing ? ` (${ledgersMissing} without a ledger)` : " and every one of them records its ledger"}; {relations} claims carry a constitutive relation and {tags} carry
            machine-checkable condition tags.
          </p>
          <p>
            A condition tag on a claim applies in a <em>scope</em> — medium (the matter the phenomenon acts in), boundary (a surface, contact or gap the step uses) or environment (a surrounding
            field, atmosphere, vacuum or source) — and on a named <em>region</em> of the device (<code>active</code> unless the claim says otherwise): <code>condition_requirements</code>, expanded
            from the flat tags with each tag&apos;s default scope when a claim has not been curated. Entity-level tags describe the entity and are never inherited into a route step. Two
            requirements can conflict only in the same scope on the same region — as members of one exclusive group (material state; coarse temperature regime) or as one of the few universal
            same-region incompatibilities — and an adjacent-step change of medium on the same continuing region is a region transition that an <em>interface record</em> must name: a gas–solid
            acoustic boundary, an electrode contact, a heat-exchanger wall, a window, a membrane, a coupling, a free surface. A demonstrated record resolves the transition; a theoretical or
            proposed one is shown on the route and leaves the boundary check unresolved; none leaves it unresolved and the interface unrecorded. Interface records live in{" "}
            <code>data/canonical/interfaces</code> and are served in <Link href="/api/graph.json">/api/graph.json</Link>.
          </p>
          <p>
            Definitions of every enumerated value — entity types, predicates, statuses, energy forms, domains — are generated from one source file and served as{" "}
            <Link href="/api/vocabulary.json">/api/vocabulary.json</Link> (<a href={`${DOCS}/docs/vocabulary.md`}>docs/vocabulary.md</a>). This page renders those definitions where it needs them
            rather than restating them. The ontology itself is described in <a href={`${DOCS}/docs/ontology.md`}>docs/ontology.md</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="routes">
        <h2 className="t-section">2. Route construction</h2>
        <div className="prose">
          <p>
            From each disequilibrium, the compiler follows only <code>drives</code>, <code>produces</code>, <code>couples_to</code> and <code>converts_into</code> claims depth-first. It never revisits
            a node, stops after {m.enumeration.max_claims_per_route} claims, records routes that reach an output, and stops after {m.enumeration.max_routes_per_source.toLocaleString("en")} enumerated
            routes per source. Route ids are the first ten hexadecimal digits of SHA-1 over the ordered claim ids. Literature search does not generate these routes.
          </p>
          <p>
            If a route's claim sequence is exactly a named, reviewed pathway (a thermoelectric generator, a wind turbine, a hydrovoltaic generator) it inherits that pathway's status, knowledge level
            and measured performance; otherwise it has none of its own. This revision enumerated {c.routes_enumerated} routes from {c.disequilibria} disequilibria;{" "}
            {m.enumeration.sources_at_cap.length === 0
              ? "no disequilibrium reached the per-source cap, so no route set is truncated."
              : `${m.enumeration.sources_at_cap.length} reached the per-source cap, so their route sets are truncated: ${m.enumeration.sources_at_cap.join(", ")}.`}{" "}
            The algorithm is specified in <a href={`${DOCS}/docs/candidate-generation.md`}>docs/candidate-generation.md</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="checks">
        <h2 className="t-section">3. The eight checks</h2>
        <div className="prose">
          <p>
            Every route is passed through eight checks. Each returns pass, fail, unresolved (the data needed to decide is partly present) or unknown (none of it is recorded), and a sentence saying
            what was examined; the site shows the sentence, never just the verdict. The definitions below are the registry served as <Link href="/api/checks.json">/api/checks.json</Link>, rendered
            here so this page cannot drift from the code. The five marked core decide whether a composition is physically coherent — the fifth, driver / regime sufficiency (loop-3 pass 30), asks whether each conversion step gets the regime it needs from its causal source rather than merely a typed edge: pyroelectricity needs a temperature that changes in time, which a static gradient does not supply, so the pyroelectric spelling from a temperature gradient reads unresolved until a route step or a stated condition supplies the change. Requirements and providers are machine-readable tokens on claims, disequilibria and reviewed pathways; a pathway&apos;s own structured temperatures (T_h_K, T_c_K, dT_dt_K_s, T_transition_K, cycle_frequency_Hz, from the registry served as vocabulary <code>measurement.parameter</code>) supply regimes to its exact route only; nothing is inferred from prose. Since pass 19 a check passes only when it has actually decided
            something: the thermodynamic bound passes only when a hard limit (an upper bound with its stated basis, or a formula such as Carnot evaluated from the datum's own recorded temperatures)
            has been compared with a comparable measurement, the dimensional check only when every conversion step carries a balanced relation, and the coverage check only when a structured datum
            exists. Benchmarks such as Curzon–Ahlborn and relations such as Onsager–Casimir reciprocity are listed as recorded limits and never decide. Most routes therefore read unresolved or
            unknown, which is the honest state of an undemonstrated composition.
          </p>
          <dl className={styles.checks}>
            {CHECK_DEFINITIONS.map((d) => (
              <div key={d.id} className={styles.check}>
                <dt>
                  {d.label}
                  {d.core ? <span className={styles.core}> · core</span> : null}
                </dt>
                <dd>
                  <p>{d.definition}</p>
                  <ul className={styles.results}>
                    <li>
                      <span className={styles.result}>pass</span> {d.pass_when}
                    </li>
                    <li>
                      <span className={styles.result}>fail</span> {d.fail_when}
                    </li>
                    <li>
                      <span className={styles.result}>unresolved</span> {d.unresolved_when}
                    </li>
                    <li>
                      <span className={styles.result}>unknown</span> {d.unknown_when}
                    </li>
                  </ul>
                  <p className={styles.reads}>reads {d.reads.join(", ")}</p>
                </dd>
              </div>
            ))}
          </dl>
          <p>
            Measured performance coverage is one of the eight checks and asks whether the recorded pathway carries a structured measurement for the whole composition; it is a coverage statement, not a
            physics verdict. <code>magnitude_screen</code> is a separate frontier-ordering diagnostic: <em>quantified</em> means whole-composition measurements exist; <em>relation-complete</em> means every
            relation-required conversion step — a <em>drives</em> or <em>couples_to</em> step, or one whose <code>relation_requirement</code> is required; a <em>produces</em> step projects the
            carrier its phenomenon emits and is not asked for one, the same notion the dimensional check uses — carries a dimensionally valid constitutive relation, and no route magnitude is
            thereby asserted (a formula with no coefficient value bounds nothing numerically, which is why the value is not called <em>bounded</em>); <em>missing</em> means at least one such step
            has no relation. Interface transmission relations stay outside the screen (<code>interface_model_coverage</code> counts them separately). Neither field estimates performance.
          </p>
        </div>
      </section>

      <section className={styles.section} id="states">
        <h2 className="t-section">4. Five state layers</h2>
        <div className="prose">
          <p>
            Five different fields answer five different questions and must not be collapsed into one confidence label: claim evidence status describes a relation; route search status describes
            recorded searches for the whole composition; frontier class describes how an enumerated route compares with evidence, checks and recorded pathways; structural kind describes whether the
            route is a genuine composition or a representational/engineering variant; matrix-cell status summarizes one driver × coupling-family coordinate.
          </p>
          <p>
            The values of each field, with the definition from the vocabulary and how often the value occurs in this revision. A value with no occurrences is still a valid value; the order in which
            the compiler decides between them is in <a href={`${DOCS}/docs/status-model.md`}>docs/status-model.md</a>.
          </p>
          {layers.map((l) => {
            const e = vocab(l.enumName);
            return (
              <div key={l.field} className={styles.layer}>
                <h3 className={styles.layerHead}>
                  <code>{l.field}</code> <span className="secondary">— {l.question}</span>
                </h3>
                <dl className={styles.terms}>
                  {e.terms.map((t) => (
                    <div key={t.id} className={styles.term}>
                      <dt>
                        <code>{t.id}</code>
                        <span className={styles.occ}>{occurrence(l.counts, t.id)}</span>
                      </dt>
                      <dd>{t.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
          <p>Knowledge level is a scale, not a state layer. It places a phenomenon or a named pathway on one ladder:</p>
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
          <p>
            A composed route with no demonstration has no level of its own: the compiler records its constituent floor (the lowest level among its claims) and caps the displayed level at K4, because
            the composition has only been assembled, not observed.
          </p>
        </div>
      </section>

      <section className={styles.section} id="candidate">
        <h2 className="t-section">5. What “candidate” means</h2>
        <div className="prose">
          <p>
            Candidate is an atlas classification, not a novelty claim. A frontier candidate has no failed physics check, has constituent evidence at least demonstrated, is not an energy-form round
            trip, has every declared carrier handoff provided by an earlier step (otherwise it is classed <em>unresolved handoff</em>), and is not classified as derived from a sufficiently similar
            demonstrated pathway. A pathway recorded with status <em>proposed</em> is shown on the route but does not change its class; so is one recorded with status <em>observed</em> — one physical experiment traversed every conversion phenomenon and handoff in order but the route&apos;s output was not delivered (a polarization, current, force or flow measured, no work), and the frontier row then leads with <em>observed · output not delivered</em> while the class stays candidate. The default frontier further requires{" "}
            <code>structural_kind = composition</code>. A candidate may be not searched, partially searched, or covered by a completed negative search; none of those states means that no such device
            or experiment exists outside the atlas.
          </p>
          <p>
            “Derived” means the route shares with a demonstrated pathway ordered claims that contain the whole pathway, form a strict prefix or suffix of it, span two or more of its phenomena, or
            share its driver step and first conversion and then diverge into the same coupling family; or at least two phenomena as a source-variant or sink-variant of the closest demonstrated
            pathway: it extends, truncates or re-drives something known and is shown apart from fresh candidates. Sharing only a generic tail (a produced carrier turning a rotor, a rotor turning a
            generator) does not make a route derived, and neither does a shared first mechanism whose next conversion changes coupling family — coupling a familiar mechanism into a different
            family is a new composition.
          </p>
          <p>A matrix cell takes the first of these that applies, in this order:</p>
          <ol className={styles.precedence}>
            <li>
              <strong>direct relation</strong> — a <code>drives</code> claim links the row's disequilibrium to a phenomenon of the column's family; the cell shows the best status among those claims
              (established, demonstrated, theoretical, contradicted), or <em>insufficient</em> when every such claim cites nothing;
            </li>
            <li>
              <strong>forbidden row</strong> — the row's disequilibrium carries a second-law <code>bounded_by</code> claim;
            </li>
            <li>
              <strong>reviewed direct demonstration</strong> — a reviewed search of the cell found a qualifying demonstration;
            </li>
            <li>
              <strong>qualifying composition bridge</strong> — a route from the row through the family has structural kind composition and frontier class candidate, derived or demonstrated: the cell
              is a <em>candidate</em>;
            </li>
            <li>
              <strong>reviewed negative direct search</strong> — a reviewed search that passed the protocol gate found no qualifying demonstration;
            </li>
            <li>
              <strong>search incomplete</strong> — any other search record exists (an automated index run, or a reviewed search left partial or blocked);
            </li>
            <li>
              <strong>not searched</strong> — no record.
            </li>
          </ol>
          <p>So a search record can move a cell only among the last five states. It can never create a direct relation; that takes a canonical claim, reviewed separately.</p>
        </div>
      </section>

      <section className={styles.section} id="searches">
        <h2 className="t-section">6. Search records</h2>
        <div className="prose">
          <p>
            A search record changes search state; it does not by itself rewrite canonical physics. An automated run freezes index results and can only produce search-incomplete. A reviewed positive
            can mark the searched target as demonstrated, but a new direct relation still requires a separate canonical-claim review. A reviewed negative may produce “no demonstration found” only when
            its protocol gate passes. A physical hit that reaches the requested coupling through a separately resolvable intermediate conversion is route-only evidence and must not promote the direct
            matrix cell.
          </p>
          <p>The gate, enforced by the loader so that a negative that skips it fails validation:</p>
          <ul>
            <li>
              completeness <code>protocol-complete-negative</code>;
            </li>
            <li>a named reviewer and a completion date;</li>
            <li>no hit whose decision is “qualifies”;</li>
            <li>runs on every discovery engine: OpenAlex, Semantic Scholar and Google Scholar (Crossref only verifies DOIs; a manual web search does not count);</li>
            <li>
              runs in every mandatory query form: driver × family, driver × each member phenomenon, and the demonstration-precision form; the citation chase is required by the protocol but is not
              machine-checked;
            </li>
            <li>
              anything incomplete or blocked — unscreened results beyond the cap, an engine that failed, an inaccessible hit, a member phenomenon not searched — leaves the record{" "}
              <code>inconclusive</code> with completeness <code>partial</code> or <code>blocked</code>.
            </li>
          </ul>
          <p>
            A positive may stop early: one unambiguous qualifying experiment, read in full, is conclusive. In this revision {c.searches_reviewed} reviewed search{" "}
            {c.searches_reviewed === 1 ? "record" : "records"} and {c.searches_index_only} frozen automated {c.searches_index_only === 1 ? "run" : "runs"} exist; {c.matrix_cells_without_search_record}{" "}
            of {c.matrix_cells} cells have no search record of either kind. The protocol is <a href={`${DOCS}/data/canonical/searches/README.md`}>data/canonical/searches/README.md</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="counts">
        <h2 className="t-section">7. Matrix and home-page counts</h2>
        <div className="prose">
          <p>
            The five home readouts are counts over the current compiled revision, not estimates of physics: DRIVER × COUPLING MATRIX is the number of disequilibrium rows × coupling-family columns (
            {c.disequilibria} × {c.couplings}); CELLS WITH RECORDED DIRECT RELATIONS counts cells with at least one canonical direct <code>drives</code> relation ({c.matrix_cells_with_direct_relation}
            ); CELLS WITH NO SEARCH RECORD counts cells with neither a reviewed search nor an automated run ({c.matrix_cells_without_search_record}); FRONTIER CANDIDATE COMPOSITIONS counts routes with{" "}
            <code>frontier_class = candidate</code> and <code>structural_kind = composition</code> ({candidates}); ROUTES WITH COMPOSITION DEMONSTRATIONS counts routes whose whole-composition search
            status is demonstrated ({c.routes_with_recorded_composition_demonstration}).
          </p>
          <p>
            The <Link href="/coverage">coverage page</Link> carries the corpus-scale counts per domain and the editorial target inventories those counts are measured against.
          </p>
          <p>
            Addresses like D.04 × C.11 are stable dataset addresses: rows and columns are numbered in file order and filtering never renumbers them, so <code>/matrix?cell=D.04:C.11</code> is a
            permanent link to one scientific question.
          </p>
        </div>
      </section>

      <section className={styles.section} id="example">
        <h2 className="t-section">8. Worked example</h2>
        <div className="prose">
          <p>
            <code>{exClaim.id}</code> records {exSubject.name} —drives→ {exObject.name} under stated solid-conductor conditions, with {exClaim.energy?.input} → {exClaim.energy?.output} energy,{" "}
            {exClaim.relation?.formula}, {exClaim.evidence.length} cited sources and status {exClaim.status}. <code>{exMember.id}</code> places the {exObject.name} in <code>{EXAMPLE.family}</code>, so
            that direct drives claim makes {exRow.address} × {exCol.address} a recorded direct-relation cell. The compiler can then chain{" "}
            {EXAMPLE.sequence.map((id, i) => (
              <span key={id}>
                {i > 0 ? " → " : ""}
                <code>{id}</code>
              </span>
            ))}
            ; that exact sequence hashes to route <code>{exRoute.id}</code> and matches the named {exPathway.name} pathway, which supplies whole-composition evidence and performance.
          </p>
          <div className={styles.fragments}>
            <div className={styles.fragment}>
              <div className="label">source YAML claim</div>
              <pre className={styles.pre}>{`- id: ${exClaim.id}
  subject: ${exClaim.subject}
  predicate: ${exClaim.predicate}
  object: ${exClaim.object}
  condition_tags: [${exClaim.condition_tags.join(", ")}]
  energy: { input: ${exClaim.energy?.input}, output: ${exClaim.energy?.output}, dissipation: ${exClaim.energy?.dissipation} }
  relation: { formula: "${exClaim.relation?.formula}", coefficient_unit: ${exClaim.relation?.coefficient_unit} }
  evidence: [${exClaim.evidence.join(", ")}]
  status: ${exClaim.status}`}</pre>
              <p className={styles.fragmentNote}>
                <Link href={claimHref(exClaim.id)}>the claim page</Link> · sources{" "}
                {exClaim.evidence.map((s, i) => (
                  <span key={s}>
                    {i > 0 ? ", " : ""}
                    <Link href={sourceHref(s)}>{s.split(":")[1]}</Link>
                  </span>
                ))}
              </p>
            </div>
            <div className={styles.fragment}>
              <div className="label">generated route</div>
              <pre className={styles.pre}>{`id: ${exRoute.id}
nodes: ${exRoute.nodes.join(" → ")}
energy: ${exRoute.energy_form_sequence.join(" → ")}
structural_kind: ${exRoute.structural_kind} · frontier_class: ${exRoute.frontier_class} · search_status: ${exRoute.search_status}
evidence_status: ${exRoute.evidence_status} (weakest: ${exRoute.weakest_claim})
magnitude_screen: ${exRoute.magnitude_screen.status}
checks: ${exChecks}`}</pre>
              <p className={styles.fragmentNote}>
                <Link href={`/path/${exRoute.id.slice(2)}`}>the route page</Link>
              </p>
            </div>
            <div className={styles.fragment}>
              <div className="label">matrix consequence</div>
              <pre className={styles.pre}>{`cell: ${exCell.address} (${exRow.name} × ${exCol.name})
status: ${exCell.status}
direct_claims: ${exCell.direct_claims.join(", ")}
searched: ${exCell.searched}`}</pre>
              <p className={styles.fragmentNote}>
                <Link href={`/matrix?cell=${exCell.address}`}>the cell</Link> · the row is <Link href={hrefFor(exRow.id)}>{exRow.name}</Link>, the column{" "}
                <Link href={hrefFor(exFamily.id)}>{exFamily.name}</Link>
              </p>
            </div>
            <div className={styles.fragment}>
              <div className="label">named pathway</div>
              <pre className={styles.pre}>{`id: ${exPathway.id}
steps: ${exPathway.steps.join(" > ")}
status: ${exPathway.status} · knowledge_level: ${exPathway.knowledge_level}
measurements: ${exPathway.performance?.measurements?.length ?? 0} datum-level records
evidence: ${exPathway.evidence.join(", ")}`}</pre>
              <p className={styles.fragmentNote}>
                Because the route's claim sequence equals these steps, the route inherits this record; only a recorded pathway or a reviewed search of the whole composition can make a route
                “demonstrated”.
              </p>
            </div>
          </div>
          <p>
            The longer version, with what would change each of these records, is <a href={`${DOCS}/docs/worked-example.md`}>docs/worked-example.md</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="evidence">
        <h2 className="t-section">9. Evidence thresholds and provenance</h2>
        <div className="prose">
          <p>
            Every claim except a hypothesised claim must cite at least one source; a hypothesised claim may cite none. The statuses, in the vocabulary's wording, with the minimums a test enforces:
          </p>
          <ul>
            {vocab("claim.status").terms.map((t) => (
              <li key={t.id}>
                <code>{t.id}</code> — {t.definition}
                {t.id === "established" ? " (tested: at least two independent first-author groups, or a review or book, among the sources)" : ""}
                {t.id === "replicated" ? " (tested: at least two independent first-author groups)" : ""}
              </li>
            ))}
          </ul>
          <p>
            Route-level evidence is kept apart from constituent evidence. A compiled route carries <code>constituent_source_ids</code> (sources cited by its steps) and{" "}
            <code>composition_source_ids</code> (sources cited by a recorded pathway for the whole route, including its datum-level measurements). The site never presents the first as evidence for the
            composition.
          </p>
          <p>
            Sources with a DOI are checked against Crossref by a pipeline that records whether the DOI resolves and whether the title Crossref returns matches the one on file; the result is shown
            beside each reference. Historical sources that predate DOIs are listed with their venue. Authoring rules: <a href={`${DOCS}/docs/evidence-model.md`}>docs/evidence-model.md</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="limits">
        <h2 className="t-section">10. Enumeration limits</h2>
        <div className="prose">
          <p>
            Enumeration is exhaustive only within the recorded graph and its configured bounds. The compiler follows canonical process claims only, forbids node revisits, enumerates at most{" "}
            {m.enumeration.max_claims_per_route} claims per route and stops after {m.enumeration.max_routes_per_source.toLocaleString("en")} routes from any one disequilibrium. Therefore “all
            enumerated routes” means all routes found under those rules in this revision, not all physically possible conversions.
          </p>
          <ul>
            <li>no route contains a cycle, so a process that genuinely revisits a node cannot be represented;</li>
            <li>a conversion that would need more than {m.enumeration.max_claims_per_route} claims is absent;</li>
            <li>
              the per-source cap can truncate a dense source;{" "}
              {m.enumeration.sources_at_cap.length === 0 ? "in this revision none is truncated" : `in this revision ${m.enumeration.sources_at_cap.length} are`} (<code>meta.enumeration</code> in every
              export);
            </li>
            <li>a missing claim, alias or family membership cannot be discovered by enumeration — the compiler can only recombine what is recorded;</li>
            <li>boundary conditions and carrier handoffs that no claim records stay unresolved or unknown; they are never inferred;</li>
            <li>the coverage page's target inventories are editorial checklists of what the atlas intends to record, not estimates of what exists in nature.</li>
          </ul>
        </div>
      </section>

      <section className={styles.section} id="non-goals">
        <h2 className="t-section">11. What the atlas deliberately does not do</h2>
        <div className="prose">
          <p>
            The atlas does not infer missing physics, use a language model to create canonical relations, treat graph absence as impossibility, treat constituent evidence as composition evidence,
            convert an automated search into a negative result, estimate performance where no recorded magnitude exists, or claim patentability, novelty or experimental feasibility from a generated
            route.
          </p>
          <p>
            Generated routes are public as compositions of recorded relations, and that is all they are. There is no review queue, no proposal pipeline and no publication policy in this release; the
            schema reserves a few queue statuses that the compiler never assigns.
          </p>
        </div>
      </section>

      <section className={styles.section} id="governance">
        <h2 className="t-section">12. Governance and revisions</h2>
        <div className="prose">
          <p>
            The canonical data is YAML under <code>data/canonical</code>, source-controlled and reviewed in pull requests. Validation rejects unknown units, invalid predicates, dangling entities,
            missing provenance, malformed conditions and negatives that skip the search gate before anything is compiled. The compiler is deterministic: the dataset revision shown in the status rail
            is a hash of the canonical files, so two people building the same commit see the same numbers, and every published revision is listed with its counts and the ids it added or removed in{" "}
            <a href={`${DOCS}/docs/dataset-changelog.md`}>docs/dataset-changelog.md</a>.
          </p>
          <p>
            Review provenance is never manufactured: a record's <code>last_reviewed</code> date changes only when that record was actually re-read, and generated records inherit the revision's{" "}
            <code>data_hash</code> and <code>source_commit</code>, not a review date. The rules for contributors are in <a href={`${DOCS}/AGENTS.md`}>AGENTS.md</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="cite">
        <h2 className="t-section">13. Citation and data access</h2>
        <div className="prose">
          <p>
            To cite the atlas as a dataset, use <a href={`${DOCS}/CITATION.cff`}>CITATION.cff</a> and include the exact <code>meta.data_hash</code> of the revision used. To cite a claim, entity,
            source, route or matrix cell, cite its stable canonical URL together with dataset revision r{m.data_hash}; the stable id identifies the record and the hash identifies the canonical files
            from which that page was compiled. Citation does not grant reuse rights: the current dataset and code licence remain PENDING OWNER RULING.
          </p>
          <p>
            The full data is public under <code>/api/</code> — every file carries the same <code>meta</code> block (dataset revision, build provenance, enumeration bounds, counts, schema pointer and
            reuse terms):{" "}
            {ENDPOINTS.map((e, i) => (
              <span key={e}>
                {i > 0 ? " · " : ""}
                <Link href={e}>{e.replace("/api/", "")}</Link>
              </span>
            ))}
            . The contract is <a href={`${DOCS}/docs/data-api.md`}>docs/data-api.md</a>; the export format is v{SCHEMA_VERSION}.
          </p>
        </div>
      </section>
    </main>
  );
}
