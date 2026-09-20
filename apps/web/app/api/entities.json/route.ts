import { atlas } from "@/lib/data";
import { exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Every entity (disequilibria, phenomena, carriers, couplings, transducers, constraints, materials, outputs, quantities). */
export function GET() {
  const entities = atlas().graph.entities;
  return exportJson("entities", { entities }, entities.length);
}
