import Link from "next/link";
import { n } from "@/lib/format";
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

/**
 * The five first-screen numbers, in instrument order: the question space, recorded direct knowledge,
 * the unsearched space, the actionable compositions, the demonstrated reference set. Corpus-scale
 * figures (phenomena, claims, routes, scope fill) live on /coverage.
 */
export function homeReadouts(counts: {
  couplings: number;
  disequilibria: number;
  matrix_cells_with_direct_relation: number;
  matrix_cells_without_search_record: number;
  routes_with_recorded_composition_demonstration: number;
  candidates: number;
}): Readout[] {
  return [
    { value: `${counts.disequilibria} × ${counts.couplings}`, label: "DRIVER × COUPLING MATRIX", href: "/matrix" },
    { value: n(counts.matrix_cells_with_direct_relation), label: "CELLS WITH RECORDED DIRECT RELATIONS", href: "/matrix" },
    { value: n(counts.matrix_cells_without_search_record), label: "CELLS WITH NO SEARCH RECORD", href: "/matrix", tone: "frontier" },
    { value: n(counts.candidates), label: "FRONTIER CANDIDATE COMPOSITIONS", href: "/frontier", tone: "frontier" },
    { value: n(counts.routes_with_recorded_composition_demonstration), label: "ROUTES WITH COMPOSITION DEMONSTRATIONS", href: "/frontier" },
  ];
}
