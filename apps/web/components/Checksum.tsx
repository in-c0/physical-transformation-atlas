"use client";
import { useId, useState } from "react";
import type { CheckResult } from "@pta/schema";
import { CHECK_ABBR, CHECK_NAME, CHECK_PHONE } from "@/lib/format";
import { CheckGlyph } from "./StatusMark";
import styles from "./Checksum.module.css";

/** One terse fact for the third line, when the detail carries one. */
function fact(k: CheckResult): string {
  if (k.result === "unknown") return "not known";
  if (k.id === "energy-form-continuity" && k.result === "pass") return "continuous";
  if (k.id === "type-chain" && k.result === "pass") return "chain";
  if (k.id === "conservation" && k.result === "pass") return "ΔG < 0";
  if (k.id === "dimensional" && k.result === "pass") return "valid";
  if (k.id === "boundary-compatibility" && k.result === "pass") return "compatible";
  if (k.id === "boundary-compatibility" && k.result === "unresolved") {
    if (k.detail.startsWith("interface unrecorded")) return "interface unrecorded";
    const m = k.detail.match(/^(theoretical|proposed) interface recorded/);
    if (m) return `${m[1]} interface`;
    return "interface";
  }
  if (k.id === "thermodynamic-bound") {
    const m = k.detail.match(/≤ ([\d.]+%)/);
    if (m) return `η ≤ ${m[1]}`;
    if (k.result === "pass") return "bounded";
  }
  if (k.id === "driver-regime-sufficiency" && k.result === "pass") return "supplied";
  if (k.id === "driver-regime-sufficiency" && k.result === "unresolved") return "regime unsupplied";
  if (k.id === "practical-magnitude" && k.result === "pass") {
    const m = k.detail.match(/record ([\d.]+%)|typical efficiency ([\d.]+%)/);
    if (m) return `η ${m[1] ?? m[2]}`;
    return "measured";
  }
  if (k.result === "fail") return "fails";
  return "—";
}

export function Checksum({ checks, claims, compact = false }: { checks: CheckResult[]; claims?: string[]; compact?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const active = checks.find((k) => k.id === open);
  const detailId = useId();
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
      <div className={styles.strip} role="group" aria-label="Physics checks">
        {checks.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`${styles.cell} ${open === k.id ? styles.cellOpen : ""}`}
            aria-expanded={open === k.id}
            aria-controls={detailId}
            aria-label={`${CHECK_NAME[k.id]}: ${k.result}`}
            onClick={() => setOpen(open === k.id ? null : k.id)}
          >
            <span className={styles.abbr}>
              <span className={styles.abbrDesk}>{CHECK_ABBR[k.id]}</span>
              <span className={styles.abbrPhone}>{CHECK_PHONE[k.id]}</span>
            </span>
            <span className={styles.glyph}>
              <CheckGlyph result={k.result} />
            </span>
            {!compact && <span className={styles.fact}>{fact(k)}</span>}
          </button>
        ))}
      </div>
      {active && (
        <div className={styles.detail} id={detailId} role="region" aria-label={`${CHECK_NAME[active.id]} details`}>
          <dl>
            <dt className="label">Check</dt>
            <dd>{CHECK_NAME[active.id]}</dd>
            <dt className="label">Result</dt>
            <dd className={`check-${active.result}`} style={{ color: `var(--check-${active.result})` }}>
              {active.result}
            </dd>
            <dt className="label">Basis</dt>
            <dd>{active.detail}</dd>
            {claims && (
              <>
                <dt className="label">Steps</dt>
                <dd className="t-data">{claims.join(" › ")}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
