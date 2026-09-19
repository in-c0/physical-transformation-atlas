/** Print diagnostics about the compiled graph: sizes and failed checks. */
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import type { Graph } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const g = JSON.parse(readFileSync(join(root, "data", "generated", "graph.json"), "utf8")) as Graph;
g.paths = JSON.parse(readFileSync(join(root, "data", "generated", "paths.json"), "utf8"));
const size = (x: unknown) => (JSON.stringify(x).length / 1024).toFixed(0) + " KB";
console.log("sizes:", { entities: size(g.entities), claims: size(g.claims), sources: size(g.sources), pathways: size(g.pathways), paths: size(g.paths), matrix: size(g.matrix), coverage: size(g.coverage) });

const mode = process.argv[2] ?? "fails";
if (mode === "fails") {
  const name = (id: string) => g.entities.find((e) => e.id === id)?.name ?? id;
  for (const p of g.paths) {
    const fails = p.checks.filter((k) => k.result === "fail");
    if (!fails.length) continue;
    console.log(`\n${p.id} [${p.frontier_class}] ${p.nodes.map(name).join(" → ")}`);
    for (const f of fails) console.log(`   ✗ ${f.id}: ${f.detail}`);
  }
}
if (mode === "matrix") {
  const counts = new Map<string, number>();
  for (const c of g.matrix.cells) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
  console.log([...counts]);
}
if (mode === "paths") {
  const bySource = new Map<string, number>();
  for (const p of g.paths) bySource.set(p.source, (bySource.get(p.source) ?? 0) + 1);
  console.log([...bySource].sort((a, b) => b[1] - a[1]));
  const byClass = new Map<string, number>();
  for (const p of g.paths) byClass.set(p.frontier_class, (byClass.get(p.frontier_class) ?? 0) + 1);
  console.log([...byClass]);
}
