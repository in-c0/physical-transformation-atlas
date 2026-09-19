import type { MatrixCellStatus } from "@pta/schema";
import { CELL_STATUS_LABEL } from "@/lib/format";
import { StatusMark } from "./StatusMark";
import styles from "./Legend.module.css";

const ORDER: MatrixCellStatus[] = ["established", "demonstrated", "theoretical", "candidate", "searched-none", "search-incomplete", "not-searched", "forbidden", "contradicted", "insufficient"];
const COMPACT: MatrixCellStatus[] = ["established", "demonstrated", "theoretical", "candidate", "searched-none", "not-searched", "forbidden", "contradicted"];
const SHORT: Record<MatrixCellStatus, string> = {
  established: "established",
  demonstrated: "demonstrated",
  theoretical: "theoretical",
  candidate: "candidate",
  "searched-none": "searched · none found",
  "search-incomplete": "index queried",
  "not-searched": "not searched",
  forbidden: "forbidden",
  contradicted: "contradicted",
  insufficient: "insufficient",
};

export function Legend({ compact = false }: { compact?: boolean }) {
  const list = compact ? COMPACT : ORDER;
  return (
    <ul className={`${styles.legend} ${compact ? styles.compact : ""}`} aria-label="Matrix status legend">
      {list.map((s) => (
        <li key={s} className={styles.item} title={CELL_STATUS_LABEL[s]}>
          <span className={`${styles.mark} ${s === "insufficient" ? "hatch" : ""}`}>
            <StatusMark status={s} />
          </span>
          <span className={`t-micro ${styles.text}`}>{compact ? SHORT[s] : CELL_STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ul>
  );
}
