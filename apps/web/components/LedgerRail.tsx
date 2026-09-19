import Link from "next/link";
import { n, pct } from "@/lib/format";
import styles from "./LedgerRail.module.css";

export type Readout = { value: string; label: string; href?: string; tone?: "default" | "frontier" };

/** Typographic readouts on one baseline, separated by hairlines. Never cards. */
export function LedgerRail({ items }: { items: Readout[] }) {
  return (
    <div className={styles.rail} role="list" aria-label="Atlas counts">
      {items.map((it) => {
        const body = (
          <>
            <span className={`${styles.value} ${it.tone === "frontier" ? styles.frontier : ""}`}>{it.value}</span>
            <span className={styles.label}>{it.label}</span>
          </>
        );
        return (
          <div key={it.label} role="listitem" className={styles.item}>
            {it.href ? (
              <Link href={it.href} className={styles.link}>
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
    </div>
  );
}

export function homeReadouts(counts: {
  phenomena: number;
  claims: number;
  couplings: number;
  disequilibria: number;
  paths_examined: number;
  paths_demonstrated: number;
  matrix_cells_unsearched: number;
  coverage_mean: number;
  candidates: number;
}): Readout[] {
  return [
    { value: n(counts.phenomena), label: "PHENOMENA", href: "/atlas" },
    { value: n(counts.claims), label: "CLAIMS" },
    { value: `${counts.disequilibria} × ${counts.couplings}`, label: "DRIVERS × COUPLINGS", href: "/matrix" },
    { value: n(counts.paths_examined), label: "PATHS EXAMINED", href: "/frontier" },
    { value: n(counts.paths_demonstrated), label: "DEMONSTRATED" },
    { value: n(counts.candidates), label: "CANDIDATES", href: "/frontier", tone: "frontier" },
    { value: n(counts.matrix_cells_unsearched), label: "UNSEARCHED CELLS", href: "/matrix", tone: "frontier" },
    { value: pct(counts.coverage_mean, 1), label: "COVERAGE", href: "/coverage" },
  ];
}
