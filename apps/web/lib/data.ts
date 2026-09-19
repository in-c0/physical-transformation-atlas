/**
 * Server-side access to the compiled atlas. `generated/*.json` is written by
 * `pnpm build:graph`; every static page reads through here at build time.
 */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CompiledPath, Graph } from "@pta/schema";
import { AtlasIndex } from "@pta/graph/query";

let cached: AtlasIndex | undefined;

export function atlas(): AtlasIndex {
  if (cached) return cached;
  const dir = join(process.cwd(), "generated");
  const graph = JSON.parse(readFileSync(join(dir, "graph.json"), "utf8")) as Graph;
  graph.paths = JSON.parse(readFileSync(join(dir, "paths.json"), "utf8")) as CompiledPath[];
  cached = new AtlasIndex(graph);
  return cached;
}

/** The matrix payload the home page and /matrix embed: axes, cells, and the names the probe needs. */
export function matrixPayload() {
  const a = atlas();
  const { rows, cols, cells } = a.graph.matrix;
  return {
    rows,
    cols,
    cells: cells.map((c) => ({
      row: c.row,
      col: c.col,
      address: c.address,
      status: c.status,
      direct: c.direct_phenomena.length,
      bridges: c.bridge_paths.length,
      searched: c.searched,
      last_searched: c.last_searched ?? null,
      works_found: c.works_found ?? null,
    })),
    indexed_through: a.graph.meta.built_at.slice(0, 10),
    data_hash: a.graph.meta.data_hash,
  };
}
export type MatrixPayload = ReturnType<typeof matrixPayload>;
export type MatrixCellLite = MatrixPayload["cells"][number];
