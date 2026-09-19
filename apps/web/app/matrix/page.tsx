import type { Metadata } from "next";
import Link from "next/link";
import { atlas, matrixPayload } from "@/lib/data";
import { Matrix } from "@/components/Matrix";
import { hrefFor } from "@/lib/format";
import styles from "./matrix.module.css";

export const metadata: Metadata = { title: "Matrix", description: "Disequilibria × coupling families: the known and unexplored transformation space." };

export default function MatrixPage() {
  const a = atlas();
  const data = matrixPayload();
  const c = a.graph.meta.counts;
  return (
    <main>
      <div className={styles.head}>
        <div>
          <div className="label">Matrix · {data.rows.length} drivers × {data.cols.length} coupling families</div>
          <h1 className="t-section" style={{ marginTop: 4 }}>
            The transformation matrix
          </h1>
        </div>
        <p className={styles.note}>
          {c.matrix_cells - c.matrix_cells_empty} cells carry a recorded direct relation. {c.matrix_cells_empty} do not; of those, {c.matrix_cells_unsearched} have no recorded search. Click any cell — an empty one is a question about what this atlas has recorded, not a statement about nature. Arrow keys move, Enter opens, Escape closes; Ctrl+arrows jump families.
        </p>
      </div>
      <Matrix data={data} density="full" filters />
      <section className={styles.index}>
        <div>
          <h2 className="label">Columns · coupling families</h2>
          <ol className={styles.list}>
            {data.cols.map((col) => (
              <li key={col.id}>
                <span className="address">{col.address}</span> <Link href={hrefFor(col.id)}>{col.name}</Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="label">Rows · drivers</h2>
          <ol className={styles.list}>
            {data.rows.map((row) => (
              <li key={row.id}>
                <span className="address">{row.address}</span> <Link href={hrefFor(row.id)}>{row.name}</Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
