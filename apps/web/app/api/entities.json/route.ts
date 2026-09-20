import { atlas } from "@/lib/data";
import { entityUrl, exportJson } from "@/lib/api";

export const dynamic = "force-static";

/** Every entity: disequilibria, phenomena, carriers, couplings, transducers, constraints, materials, outputs, quantities, systems, states, interactions, transitions. */
export function GET() {
  const entities = atlas().graph.entities.map((e) => ({ ...e, canonical_url: entityUrl(e.id) }));
  return exportJson("entities", entities, {}, { records: entities.length });
}
