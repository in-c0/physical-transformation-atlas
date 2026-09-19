import type { Source } from "@pta/schema";
import styles from "./EvidenceList.module.css";

export type Verification = Record<string, { verified: boolean; checked_at: string; crossref_title?: string; note?: string }>;

export function EvidenceList({ sources, verification = {}, numbering }: { sources: Source[]; verification?: Verification; numbering?: (id: string) => number; startAt?: number }) {
  if (sources.length === 0) return <p className="t-data secondary">No source recorded.</p>;
  return (
    <ol className={styles.list}>
      {sources.map((s, i) => {
        const v = verification[s.id];
        const n = numbering ? numbering(s.id) : i + 1;
        return (
          <li key={s.id} id={s.id.replace(":", "-")}>
            <span className={styles.num}>[{n}]</span>
            <div>
              <div className={styles.title}>
                {s.authors.length > 0 && <span>{s.authors.length > 3 ? `${s.authors[0]} et al.` : s.authors.join(", ")}. </span>}
                {s.title}
                {s.year && <span className="secondary"> ({s.year})</span>}
              </div>
              <div className={styles.meta}>
                {s.venue && <span>{s.venue}</span>}
                {s.doi && (
                  <>
                    {s.venue && " · "}
                    <a href={`https://doi.org/${s.doi}`} rel="noopener" target="_blank">
                      doi:{s.doi}
                    </a>
                    {v && (
                      <span className={v.verified ? styles.verified : styles.unverified} title={v.note ?? v.crossref_title ?? ""}>
                        {v.verified ? ` · crossref ✓ ${v.checked_at.slice(0, 10)}` : ` · crossref: not matched ${v.checked_at.slice(0, 10)}`}
                      </span>
                    )}
                  </>
                )}
                {!s.doi && s.url && (
                  <>
                    {s.venue && " · "}
                    <a href={s.url} rel="noopener" target="_blank">
                      {s.url.replace(/^https?:\/\//, "")}
                    </a>
                  </>
                )}
                {!s.doi && !s.url && <span> · {s.type}, no DOI</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
