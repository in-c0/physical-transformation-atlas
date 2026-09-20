import { atlas } from "@/lib/data";
import { exportJson, withCellUrl } from "@/lib/api";

export const dynamic = "force-static";

/** The disequilibrium × coupling-family matrix: row and column axes with stable addresses, one cell per pair with its canonical URL. Generated records. */
export function GET() {
  const { rows, cols, cells } = atlas().graph.matrix;
  return exportJson("matrix", { rows, cols, cells: cells.map(withCellUrl) }, {}, { records: cells.length, record_kind: "generated" });
}
