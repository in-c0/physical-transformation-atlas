import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** The disequilibrium × coupling-family matrix: row and column axes with stable addresses, and one cell per pair. */
export function GET() {
  const { rows, cols, cells } = atlas().graph.matrix;
  return exportJson("matrix", { rows, cols, cells }, cells.length);
}
