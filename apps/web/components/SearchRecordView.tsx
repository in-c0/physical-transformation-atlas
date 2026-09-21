import type { AutomatedSearchRun, SearchRecord } from "@pta/schema";
import { searchDate } from "@pta/schema";
import styles from "./Drawer.module.css";

const ENGINE_SHORT: Record<string, string> = { openalex: "OpenAlex", "semantic-scholar": "Semantic Scholar", "google-scholar": "Google Scholar", crossref: "Crossref", manual: "manual web search" };
const ENGINE_ABBR: Record<string, string> = { openalex: "OA", "semantic-scholar": "S2", "google-scholar": "Scholar", crossref: "CR", manual: "web" };
/** Pass 49: a run that obtained no result list (a throttle or a bot check before the first position) is an attempt, never coverage. */
export const obtainedRun = (x: SearchRecord["runs"][number]) => !(x.interruption && x.records_screened === 0 && x.records_retrieved === 0);
export const enginesOf = (r: SearchRecord) => [...new Set(r.runs.filter(obtainedRun).map((x) => x.engine))];
export const blockedAttempts = (r: SearchRecord) => r.runs.filter((x) => !obtainedRun(x));
export const engineList = (r: SearchRecord, abbr = false) =>
  enginesOf(r)
    .map((e) => (abbr ? ENGINE_ABBR[e] : ENGINE_SHORT[e]) ?? e)
    .join(abbr ? " + " : " + ");

/** One line for a frontier row or a route header. */
export function searchCompact(r: SearchRecord): string {
  const d = searchDate(r);
  if (r.result === "demonstration-found") return `search · reviewed ${d} · demonstration found`;
  if (r.result === "no-demonstration-found") return `search · reviewed ${d} · no demonstration found · ${engineList(r, true)}`;
  return `search · reviewed ${d} · inconclusive (${r.completeness})`;
}

/** The route page's sentence for a reviewed exact-composition search. */
export function searchRouteSentence(r: SearchRecord): string {
  const d = searchDate(r);
  if (r.result === "no-demonstration-found")
    return `Exact composition search: reviewed ${d} with ${engineList(r)} — no qualifying demonstration found in the recorded protocol. ${r.screening.unique_records} unique works screened · ${r.screening.full_text_read} read in full.`;
  if (r.result === "demonstration-found")
    return `Exact composition search: reviewed ${d} — a qualifying demonstration was found (${r.hits.find((h) => h.decision === "qualifies")?.title ?? "see the record"}).`;
  return `Exact composition search: reviewed ${d} — ${r.completeness}; ${r.conclusion}`;
}

/** A reviewed search record as the drawer shows it: what was concluded, how, and every plausible hit with its decision. */
export function SearchRecordView({ record }: { record: SearchRecord }) {
  const d = searchDate(record);
  const qualifying = record.hits.find((h) => h.decision === "qualifies");
  const rejected = record.hits.filter((h) => h.decision !== "qualifies" && h.decision !== "duplicate");
  return (
    <div className={styles.claim}>
      <div className={styles.claimLine}>
        <span className="t-data">Reviewed search · {d}</span>
        <span className="t-data secondary">{record.result === "demonstration-found" ? "demonstration found" : engineList(record)}</span>
        <span className={styles.status}>{record.completeness.replace(/-/g, " ")}</span>
      </div>
      {record.result === "no-demonstration-found" && (
        <p className={styles.stateSecondary} style={{ marginTop: 4 }}>
          No qualifying direct demonstration was found in this reviewed search. {record.screening.unique_records} unique records were screened and {record.screening.full_text_read} were read in full.
          This means no demonstration was found by this recorded protocol through {d}; it does not mean the relation does not exist.
        </p>
      )}
      {record.result === "demonstration-found" && qualifying && (
        <p className={styles.stateSecondary} style={{ marginTop: 4 }}>
          {qualifying.doi ? (
            <a href={`https://doi.org/${qualifying.doi}`} target="_blank" rel="noopener">
              {qualifying.title}
            </a>
          ) : (
            qualifying.title
          )}
          {qualifying.year ? ` (${qualifying.year})` : ""}: {qualifying.reason}
          {record.follow_up?.canonical_claim_review === "needed" ? " The atlas has not yet decided whether this warrants a new canonical direct-relation claim." : ""}
        </p>
      )}
      {record.result === "inconclusive" && (
        <p className={styles.stateSecondary} style={{ marginTop: 4 }}>
          {record.conclusion}
        </p>
      )}
      <div className="t-micro secondary" style={{ marginTop: 4 }}>
        {record.runs.filter(obtainedRun).length} run{record.runs.filter(obtainedRun).length === 1 ? "" : "s"}
        {blockedAttempts(record).length > 0
          ? ` · ${blockedAttempts(record).length} attempt${blockedAttempts(record).length === 1 ? "" : "s"} blocked before any result (${[...new Set(blockedAttempts(record).map((x) => ENGINE_SHORT[x.engine] ?? x.engine))].join(", ")}) — attempted, never counted`
          : ""}{" "}
        · {record.screening.unique_records} unique records · {record.screening.full_text_read} read in full · reviewed by {record.reviewed_by.split(" (")[0]} · protocol {record.protocol_version}
      </div>
      {rejected.length > 0 && (
        <ul className={styles.conditions}>
          {rejected.map((h) => (
            <li key={h.title}>
              {h.doi ? (
                <a href={`https://doi.org/${h.doi}`} target="_blank" rel="noopener">
                  {h.title}
                </a>
              ) : (
                h.title
              )}
              {h.year ? ` (${h.year})` : ""} · <span className="t-micro">{h.decision.replace(/-/g, " ")}</span> · {h.reason}
            </li>
          ))}
        </ul>
      )}
      {record.limitations.length > 0 && (
        <div className="t-micro secondary" style={{ marginTop: 4 }}>
          Limitations: {record.limitations.join(" ")}
        </div>
      )}
    </div>
  );
}

/** An automated run as the drawer shows it: an index query nobody has read yet. */
export function AutomatedRunView({ run }: { run: AutomatedSearchRun }) {
  const last = run.runs
    .map((r) => r.executed_at.slice(0, 10))
    .sort()
    .at(-1);
  const reported = run.runs.reduce((n, r) => n + (r.result_count_reported ?? 0), 0);
  const engines = [...new Set(run.runs.map((r) => r.engine))].map((e) => ENGINE_SHORT[e] ?? e).join(" + ");
  const notes = run.notes ?? "";
  const notRun = notes.indexOf("Planned runs");
  return (
    <div className={styles.claim}>
      <div className={styles.claimLine}>
        <span className="t-data">Index query only · {last}</span>
        <span className="t-data secondary">
          {engines} · {run.runs.length} quer{run.runs.length === 1 ? "y" : "ies"}
        </span>
        <span className={styles.status}>not reviewed</span>
      </div>
      <p className={styles.stateSecondary} style={{ marginTop: 4 }}>
        {reported} indexed works reported across the queries, {run.works.length} unique retrieved; nobody has read them for a qualifying demonstration. A person can screen this frozen list and promote
        it to a reviewed record without re-running the query.
      </p>
      <ul className={styles.runList}>
        {run.runs.map((r) => (
          <li key={r.id}>
            <span>{ENGINE_ABBR[r.engine] ?? r.engine}</span>
            <span>{r.query_key ?? r.query_form}</span>
            <span className="secondary">
              {r.result_count_reported ?? "?"} reported · {r.records_retrieved} retrieved
            </span>
          </li>
        ))}
      </ul>
      {notRun >= 0 && <p className={styles.stateSecondary}>{notes.slice(notRun)}</p>}
    </div>
  );
}
