import Link from "next/link";
import type { Claim } from "@pta/schema";
import type { AtlasIndex } from "@pta/graph/query";
import { EVIDENCE_LABEL, claimHref, hrefFor, predicateLabel } from "@/lib/format";
import styles from "./Drawer.module.css";

/** One claim as a ruled line: subject —predicate→ object, status, then its conditions. */
export function ClaimLine({ claim, index, showConditions = true, anchor }: { claim: Claim; index: AtlasIndex; showConditions?: boolean; anchor?: "subject" | "object" | "both" }) {
  const s = index.entity.get(claim.subject);
  const o = index.entity.get(claim.object);
  const link = (id: string, name: string, on: boolean) => (on ? <Link href={hrefFor(id)}>{name}</Link> : <span>{name}</span>);
  const a = anchor ?? "both";
  return (
    <div className={styles.claim} id={claim.id.replace(":", "-")}>
      <div className={styles.claimLine}>
        {link(claim.subject, s?.name ?? claim.subject, a !== "subject")}
        <span className="t-data secondary">—{predicateLabel(claim.predicate)}→</span>
        {link(claim.object, o?.name ?? claim.object, a !== "object")}
        <span className={`${styles.status} ev-${claim.status}`}>{EVIDENCE_LABEL[claim.status]}</span>
        <Link href={claimHref(claim.id)} className={styles.recordLink} aria-label={`Open the record for ${claim.id}`} title={claim.id}>
          record
        </Link>
      </div>
      {showConditions && claim.conditions.length > 0 && (
        <ul className={styles.conditions}>
          {claim.conditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {showConditions && claim.relation && (
        <div className="t-data secondary" style={{ marginTop: 4 }}>
          {claim.relation.formula}
          {claim.relation.coefficient_name ? ` · ${claim.relation.coefficient_name} [${claim.relation.coefficient_unit}]` : ""}
        </div>
      )}
    </div>
  );
}
