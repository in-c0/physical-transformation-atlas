/**
 * Automated index queries against OpenAlex for matrix cells that have no direct claim. Each cell
 * gets the same query bundle a human reviewer runs (driver × family, driver × each member
 * phenomenon, a demonstration-precision query), and the result list is frozen: ids, titles,
 * years, DOIs and open-access URLs for up to the first 100 works per query, with the literal
 * query, the request URL (mailto stripped) and the timestamp. A person can later screen exactly
 * this list and promote it to a reviewed SearchRecord in data/canonical/searches without
 * re-running anything. Every run here is `screening_status: not-reviewed`, `result: inconclusive`,
 * and lives in data/generated/search-runs.json, never in canonical data.
 *
 *   pnpm --filter @pta/pipelines literature-search           # cells not yet queried
 *   pnpm --filter @pta/pipelines literature-search --all     # re-query everything
 *   pnpm --filter @pta/pipelines literature-search --limit 20 --delay 2000
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { loadCanon, buildGraph } from "@pta/graph";
import type { AutomatedSearchRun, Entity, SearchRun } from "@pta/schema";

const root = resolve(import.meta.dirname, "..", "..");
const outFile = join(root, "data", "generated", "search-runs.json");
const all = process.argv.includes("--all");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;
const delayArg = process.argv.indexOf("--delay");
/** Pause between requests. OpenAlex documents 10 req/s but throttles the anonymous pool well below that. */
const delayMs = delayArg >= 0 ? Number(process.argv[delayArg + 1]) : 1500;
const PER_PAGE = 100;

const prev: AutomatedSearchRun[] = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : [];
const byKey = new Map(prev.filter((r) => r.target.kind === "cell").map((r) => [`${(r.target as { row: string }).row}|${(r.target as { col: string }).col}`, r]));

/** Names and aliases usable as search terms: multi-word phrases quoted, symbols and one-letter aliases dropped. */
function termList(e: Entity): string[] {
  const names = [e.name, ...e.aliases].map((s) => s.replace(/\(.*?\)/g, "").trim()).filter((s) => s.length > 3 && /^[A-Za-z0-9 \-–]+$/.test(s));
  return [...new Set(names.map((s) => s.toLowerCase()))].slice(0, 5);
}
const group = (terms: string[]) => "(" + terms.map((s) => (s.includes(" ") ? `"${s}"` : s)).join(" OR ") + ")";

const canon = loadCanon(root);
const graph = buildGraph(canon);
const entity = new Map(canon.entities.map((e) => [e.id, e]));
const members = new Map<string, string[]>();
for (const c of canon.claims) if (c.predicate === "member_of") members.set(c.object, [...(members.get(c.object) ?? []), c.subject]);
const forbidden = new Set(graph.matrix.cells.filter((c) => c.status === "forbidden").map((c) => `${c.row}|${c.col}`));
const todo = graph.matrix.cells.filter((c) => c.direct_claims.length === 0 && !forbidden.has(`${c.row}|${c.col}`) && (all || !byKey.has(`${c.row}|${c.col}`))).slice(0, limit);
console.log(`${todo.length} cell(s) to query`);

function save() {
  const outList = [...byKey.values()].sort((a, b) => a.id.localeCompare(b.id));
  mkdirSync(join(root, "data", "generated"), { recursive: true });
  writeFileSync(outFile, JSON.stringify(outList, null, 1) + "\n");
}

type Work = AutomatedSearchRun["works"][number];

async function openalex(query: string, runId: string): Promise<{ run: SearchRun; works: Work[] } | { error: string; status?: number }> {
  const url = new URL("https://api.openalex.org/works");
  const filters = { "title_and_abstract.search": query, type: "article|review|book-chapter" };
  url.searchParams.set(
    "filter",
    Object.entries(filters)
      .map(([k, v]) => `${k}:${v}`)
      .join(","),
  );
  url.searchParams.set("per-page", String(PER_PAGE));
  url.searchParams.set("sort", "relevance_score:desc");
  url.searchParams.set("select", "id,title,publication_year,doi,type,cited_by_count,open_access");
  const publicUrl = url.toString();
  // OpenAlex serves its "polite pool" (faster, rarely throttled) to requests that carry a contact
  // address. Set OPENALEX_MAILTO to opt in; the address never lands in the dataset.
  if (process.env.OPENALEX_MAILTO) url.searchParams.set("mailto", process.env.OPENALEX_MAILTO);
  const executed_at = new Date().toISOString();
  const r = await fetch(url, { headers: { "User-Agent": "physical-transformation-atlas/0.2 (literature index pipeline)" }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) return { error: `HTTP ${r.status}`, status: r.status };
  const j = (await r.json()) as {
    meta: { count: number };
    results: { id: string; title: string | null; publication_year?: number; doi?: string | null; type?: string; cited_by_count?: number; open_access?: { oa_url?: string | null } }[];
  };
  const works: Work[] = j.results.map((w) => ({
    openalex_id: w.id.replace(/^https?:\/\/openalex\.org\//, ""),
    doi: w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//, "") : undefined,
    title: w.title ?? "(untitled)",
    year: w.publication_year,
    type: w.type,
    cited_by_count: w.cited_by_count,
    open_access_url: w.open_access?.oa_url ?? undefined,
    found_by: [runId],
  }));
  return {
    run: {
      id: runId,
      engine: "openalex",
      query_form: "driver-family",
      query,
      executed_at,
      request_url: publicUrl,
      engine_version: null,
      index_snapshot: null,
      sort: "relevance_score:desc",
      filters,
      result_count_reported: j.meta.count,
      records_retrieved: works.length,
      records_screened: 0,
      records_read: 0,
    },
    works,
  };
}

let n = 0;
for (const cell of todo) {
  const row = entity.get(cell.row)!;
  const col = entity.get(cell.col)!;
  const driverTerms = termList(row);
  const familyTerms = termList(col);
  const phenomenonTerms: Record<string, string[]> = {};
  for (const ph of members.get(col.id) ?? []) phenomenonTerms[ph] = termList(entity.get(ph)!);
  const D = group(driverTerms);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `search:${stamp}-${cell.address.toLowerCase().replace(/[.:]/g, "-")}`;
  // The same bundle a reviewer runs: driver × family, driver × each member phenomenon, precision.
  const bundle: { id: string; form: SearchRun["query_form"]; query: string }[] = [{ id: `${base}/oa-family`, form: "driver-family", query: `${D} AND ${group(familyTerms)}` }];
  for (const [ph, terms] of Object.entries(phenomenonTerms)) if (terms.length) bundle.push({ id: `${base}/oa-${ph.split(":")[1]}`, form: "driver-phenomenon", query: `${D} AND ${group(terms)}` });
  bundle.push({
    id: `${base}/oa-precision`,
    form: "demonstration-precision",
    query: `${D} AND ${group([...familyTerms, ...Object.values(phenomenonTerms).flat()].slice(0, 6))} AND (experiment OR experimental OR measured OR device OR prototype)`,
  });

  const runs: SearchRun[] = [];
  const works = new Map<string, Work>();
  let failed = false;
  for (const q of bundle) {
    try {
      const res = await openalex(q.query, q.id);
      if ("error" in res) {
        console.log(`  ? ${cell.address} ${q.form}: ${res.error}`);
        if (res.status === 429) await new Promise((r) => setTimeout(r, 30000));
        failed = true;
        break;
      }
      res.run.query_form = q.form;
      runs.push(res.run);
      for (const w of res.works) {
        const key = w.doi ?? w.openalex_id ?? w.title;
        const seen = works.get(key);
        if (seen) seen.found_by.push(q.id);
        else works.set(key, w);
      }
    } catch (e) {
      console.log(`  ? ${cell.address} ${q.form}: ${(e as Error).message}`);
      failed = true;
      break;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  if (failed || runs.length === 0) continue;
  const rec: AutomatedSearchRun = {
    id: base,
    target: { kind: "cell", row: cell.row, col: cell.col },
    dataset_hash: graph.meta.data_hash,
    driver_terms: driverTerms,
    family_terms: familyTerms,
    phenomenon_terms: phenomenonTerms,
    runs,
    works: [...works.values()],
    screening_status: "not-reviewed",
    result: "inconclusive",
    notes: "Automated OpenAlex title/abstract queries; the result list is frozen for a reviewer and nothing here has been read for a qualifying demonstration.",
  };
  byKey.set(`${cell.row}|${cell.col}`, rec);
  n++;
  if (n % 5 === 0) save(); // partial progress survives a killed run
  if (n % 10 === 0) console.log(`  … ${n}/${todo.length} (${cell.address}: ${rec.works.length} unique works)`);
}
save();
console.log(`queried ${n} cell(s); ${byKey.size} automated run(s) on file`);
