/**
 * Automated index queries against OpenAlex for every matrix cell that has no
 * direct claim: how many indexed works mention both the driver and the coupling
 * family, and the top hits. This is NOT a search for a demonstration — a human
 * has to review the hits before a cell may say "no demonstration found" — so
 * every record here carries result: inconclusive and lands in
 * data/generated/search-runs.json, never in data/canonical/searches.
 *
 *   pnpm --filter @pta/pipelines literature-search           # cells not yet queried
 *   pnpm --filter @pta/pipelines literature-search --all     # re-query everything
 *   pnpm --filter @pta/pipelines literature-search --limit 20 --delay 2000
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { loadCanon, buildGraph } from "@pta/graph";
import type { Entity, SearchRecord } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const outFile = join(root, "data", "generated", "search-runs.json");
const all = process.argv.includes("--all");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;
const delayArg = process.argv.indexOf("--delay");
/** Pause between requests. OpenAlex documents 10 req/s but throttles the anonymous pool well below that. */
const delayMs = delayArg >= 0 ? Number(process.argv[delayArg + 1]) : 1500;
const today = new Date().toISOString().slice(0, 10);

const prev: SearchRecord[] = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : [];
const byKey = new Map(prev.filter((r) => r.target.kind === "cell").map((r) => [`${(r.target as { row: string }).row}|${(r.target as { col: string }).col}`, r]));

/** Quoted phrase for multi-word names, plus aliases, OR-ed. Symbols and one-letter aliases are dropped. */
function terms(e: Entity): string {
  const names = [e.name, ...e.aliases].map((s) => s.replace(/\(.*?\)/g, "").trim()).filter((s) => s.length > 3 && /^[A-Za-z0-9 \-–]+$/.test(s));
  const uniq = [...new Set(names.map((s) => s.toLowerCase()))].slice(0, 4);
  return "(" + uniq.map((s) => (s.includes(" ") ? `"${s}"` : s)).join(" OR ") + ")";
}

const canon = loadCanon(root);
const graph = buildGraph(canon);
const entity = new Map(canon.entities.map((e) => [e.id, e]));
const forbidden = new Set(graph.matrix.cells.filter((c) => c.status === "forbidden").map((c) => `${c.row}|${c.col}`));
const todo = graph.matrix.cells.filter((c) => c.direct_claims.length === 0 && !forbidden.has(`${c.row}|${c.col}`) && (all || !byKey.has(`${c.row}|${c.col}`))).slice(0, limit);
console.log(`${todo.length} cell(s) to query`);

function save() {
  const outList = [...byKey.values()].sort((a, b) => a.id.localeCompare(b.id));
  mkdirSync(join(root, "data", "generated"), { recursive: true });
  writeFileSync(outFile, JSON.stringify(outList, null, 1) + "\n");
}

let n = 0;
for (const cell of todo) {
  const row = entity.get(cell.row)!;
  const col = entity.get(cell.col)!;
  const query = `${terms(row)} AND ${terms(col)}`;
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("filter", `title_and_abstract.search:${query},type:article|review|book-chapter`);
  url.searchParams.set("per-page", "3");
  url.searchParams.set("sort", "cited_by_count:desc");
  url.searchParams.set("select", "title,publication_year,doi");
  // OpenAlex serves its "polite pool" (faster, rarely throttled) to requests that carry a contact
  // address. Set OPENALEX_MAILTO to opt in; the anonymous pool is throttled hard.
  if (process.env.OPENALEX_MAILTO) url.searchParams.set("mailto", process.env.OPENALEX_MAILTO);
  const id = `search:${today}-${cell.address.toLowerCase().replace(/[.:]/g, "-")}` as SearchRecord["id"];
  try {
    const r = await fetch(url, { headers: { "User-Agent": "physical-transformation-atlas/0.1 (literature index pipeline)" }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) {
      console.log(`  ? ${cell.address}: HTTP ${r.status}`);
      if (r.status === 429) await new Promise((res) => setTimeout(res, 30000));
      continue;
    }
    const j = (await r.json()) as { meta: { count: number }; results: { title: string; publication_year?: number; doi?: string | null }[] };
    const rec: SearchRecord = {
      id,
      target: { kind: "cell", row: cell.row, col: cell.col },
      date: today,
      engine: "openalex",
      query,
      works_found: j.meta.count,
      top: j.results.map((w) => ({ title: w.title ?? "(untitled)", year: w.publication_year, doi: w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//, "") : undefined })),
      result: "inconclusive",
      notes: "Automated title/abstract co-occurrence query; hits not reviewed for a qualifying demonstration.",
    };
    byKey.set(`${cell.row}|${cell.col}`, rec);
    n++;
    if (n % 10 === 0) save(); // partial progress survives a killed run
    if (n % 25 === 0) console.log(`  … ${n}/${todo.length} (${cell.address}: ${j.meta.count} works)`);
  } catch (e) {
    console.log(`  ? ${cell.address}: ${(e as Error).message}`);
  }
  await new Promise((res) => setTimeout(res, delayMs));
}
save();
console.log(`queried ${n} cell(s); ${byKey.size} automated run(s) on file`);
