/**
 * Compile data/canonical → data/generated/graph.json (+ a copy the web app can
 * import). Fails loudly on validation problems.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { loadCanon, buildGraph, ValidationError } from "@pta/graph";

const root = resolve(import.meta.dirname, "..", "..");
const sourceCommit = (() => {
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", "data/canonical"], { cwd: root, encoding: "utf8" }).trim().length > 0;
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    return dirty ? `${sha}-dirty` : sha;
  } catch {
    return null;
  }
})();
try {
  const canon = loadCanon(root);
  const graph = buildGraph(canon, { version: "0.5.0", sourceCommit });
  const outDir = join(root, "data", "generated");
  mkdirSync(outDir, { recursive: true });
  // Two files: the core graph (entities, claims, sources, pathways, matrix, coverage)
  // and the enumerated paths, which the site loads only when a drawer or the
  // frontier needs them.
  const { paths, ...core } = graph;
  const coreJson = JSON.stringify({ ...core, paths: [] });
  void paths;
  const pathsJson = JSON.stringify(paths);
  const json = JSON.stringify(graph);
  for (const dir of [outDir, join(root, "apps", "web", "generated")]) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "graph.json"), coreJson);
    writeFileSync(join(dir, "paths.json"), pathsJson);
  }
  const c = graph.meta.counts;
  console.log(
    `graph ${graph.meta.data_hash}: ${c.phenomena} phenomena · ${c.claims} claims · ${c.routes_enumerated} routes enumerated (${c.routes_with_recorded_composition_demonstration} with a recorded demonstration) · ${c.matrix_cells} cells (${c.matrix_cells_without_direct_relation} without a direct relation, ${c.matrix_cells_without_search_record} without a search record) · scope fill ${(c.editorial_scope_fill * 100).toFixed(1)}% · core ${(coreJson.length / 1024).toFixed(0)} KB + paths ${(pathsJson.length / 1024).toFixed(0)} KB`,
  );
  const fails = graph.paths.filter((p) => p.checks.some((k) => k.result === "fail"));
  const byCheck = new Map<string, number>();
  for (const p of fails) for (const k of p.checks) if (k.result === "fail") byCheck.set(k.id, (byCheck.get(k.id) ?? 0) + 1);
  if (fails.length) console.log(`paths with a failed check: ${fails.length} (${[...byCheck].map(([k, n]) => `${k}: ${n}`).join(", ")})`);
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
