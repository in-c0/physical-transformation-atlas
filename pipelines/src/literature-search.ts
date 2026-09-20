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
 *   pnpm --filter @pta/pipelines literature-search --cell D.04:C.01   # one cell, re-queried
 *   pnpm --filter @pta/pipelines literature-search --path p-423a19acdd --plan data/canonical/searches/plans/p-423a19acdd.yaml
 *       # one route (exact composition) from a query plan written under route-search-v1: every run's
 *       # engine, form and literal query comes from the plan, never from the aliases at run time.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse as parseYaml } from "yaml";
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
const cellArg = process.argv.indexOf("--cell");
/** Query one cell by address, e.g. --cell D.04:C.01 (implies --all for that cell). */
const onlyCell = cellArg >= 0 ? process.argv[cellArg + 1] : undefined;
const pathArg = process.argv.indexOf("--path");
/** Query one route by id from a plan file: --path p-423a19acdd --plan <yaml>. */
const onlyPath = pathArg >= 0 ? process.argv[pathArg + 1] : undefined;
const planArg = process.argv.indexOf("--plan");
const planFile = planArg >= 0 ? process.argv[planArg + 1] : undefined;
const PER_PAGE = 100;

const prev: AutomatedSearchRun[] = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : [];
const keyOf = (r: AutomatedSearchRun) => (r.target.kind === "cell" ? `${r.target.row}|${r.target.col}` : r.target.kind === "path" ? `path|${r.target.path}` : `claim|${r.target.claim}`);
const byKey = new Map(prev.map((r) => [keyOf(r), r]));

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
const todo = onlyPath
  ? []
  : graph.matrix.cells
      .filter((c) => (onlyCell ? c.address === onlyCell : c.direct_claims.length === 0 && !forbidden.has(`${c.row}|${c.col}`) && (all || !byKey.has(`${c.row}|${c.col}`))))
      .slice(0, limit);
console.log(onlyPath ? `route ${onlyPath} from plan ${planFile}` : `${todo.length} cell(s) to query`);

function save() {
  const outList = [...byKey.values()].sort((a, b) => a.id.localeCompare(b.id));
  mkdirSync(join(root, "data", "generated"), { recursive: true });
  writeFileSync(outFile, JSON.stringify(outList, null, 1) + "\n");
}

type Work = AutomatedSearchRun["works"][number];

async function openalex(query: string, runId: string, opts: { sort?: "relevance" | "newest"; perPage?: number } = {}): Promise<{ run: SearchRun; works: Work[] } | { error: string; status?: number }> {
  const sortParam = opts.sort === "newest" ? "publication_date:desc" : "relevance_score:desc";
  const url = new URL("https://api.openalex.org/works");
  const filters = { "title_and_abstract.search": query, type: "article|review|book-chapter" };
  url.searchParams.set(
    "filter",
    Object.entries(filters)
      .map(([k, v]) => `${k}:${v}`)
      .join(","),
  );
  url.searchParams.set("per-page", String(opts.perPage ?? PER_PAGE));
  url.searchParams.set("sort", sortParam);
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
      sort: sortParam,
      filters,
      result_count_reported: j.meta.count,
      records_retrieved: works.length,
      records_screened: 0,
      records_read: 0,
    },
    works,
  };
}

/** Semantic Scholar's relevance search: plain keyword strings, no boolean guarantees; the literal string is recorded. */
async function semanticScholar(query: string, runId: string): Promise<{ run: SearchRun; works: Work[] } | { error: string; status?: number }> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(PER_PAGE));
  url.searchParams.set("fields", "title,year,externalIds,openAccessPdf,citationCount,publicationTypes");
  const publicUrl = url.toString();
  const executed_at = new Date().toISOString();
  const headers: Record<string, string> = { "User-Agent": "physical-transformation-atlas/0.3 (literature index pipeline)" };
  if (process.env.S2_API_KEY) headers["x-api-key"] = process.env.S2_API_KEY;
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!r.ok) return { error: `HTTP ${r.status}`, status: r.status };
  const j = (await r.json()) as {
    total?: number;
    data?: {
      paperId: string;
      title: string | null;
      year?: number | null;
      externalIds?: { DOI?: string };
      openAccessPdf?: { url?: string } | null;
      citationCount?: number;
      publicationTypes?: string[] | null;
    }[];
  };
  const works: Work[] = (j.data ?? []).map((w) => ({
    doi: w.externalIds?.DOI ? w.externalIds.DOI : undefined,
    title: w.title ?? "(untitled)",
    year: w.year ?? undefined,
    type: w.publicationTypes?.[0]?.toLowerCase(),
    cited_by_count: w.citationCount,
    open_access_url: w.openAccessPdf?.url ?? undefined,
    found_by: [runId],
  }));
  return {
    run: {
      id: runId,
      engine: "semantic-scholar",
      query_form: "driver-family",
      query,
      executed_at,
      request_url: publicUrl,
      engine_version: null,
      index_snapshot: null,
      sort: "relevance",
      filters: { limit: PER_PAGE },
      result_count_reported: j.total ?? null,
      records_retrieved: works.length,
      records_screened: 0,
      records_read: 0,
    },
    works,
  };
}

// Route mode: the plan supplies every run (engine, form, literal query) plus the term lists it was built from.
if (onlyPath) {
  if (!planFile) throw new Error("--path needs --plan <yaml>");
  const route = graph.paths.find((p) => p.id === onlyPath);
  if (!route) throw new Error(`no route ${onlyPath}`);
  const plan = parseYaml(readFileSync(resolve(root, planFile), "utf8")) as {
    protocol_version: string;
    driver_terms: string[];
    phenomenon_terms: Record<string, string[]>;
    claims?: string[];
    runs: { id: string; engine: "openalex" | "semantic-scholar"; form: SearchRun["query_form"]; key?: string; sort?: "relevance" | "newest"; per_page?: number; query: string }[];
    notes?: string;
  };
  if (plan.claims && plan.claims.join(">") !== route.claims.join(">")) throw new Error(`plan claims do not match route ${onlyPath}`);
  const runs: SearchRun[] = [];
  const works = new Map<string, Work>();
  const failedRuns: string[] = [];
  // --engines openalex,semantic-scholar limits which planned engines are run now; the others are
  // listed in the bundle's notes as not run, so a reviewer sees exactly what the frozen list lacks.
  const enginesArg = process.argv.indexOf("--engines");
  const enginesNow = enginesArg >= 0 ? new Set(process.argv[enginesArg + 1].split(",")) : null;
  const skippedRuns = enginesNow ? plan.runs.filter((q) => !enginesNow.has(q.engine)).map((q) => `${q.id} (${q.engine})`) : [];
  for (const q of plan.runs) {
    if (enginesNow && !enginesNow.has(q.engine)) continue;
    const call = () => (q.engine === "openalex" ? openalex(q.query, q.id, { sort: q.sort, perPage: q.per_page }) : semanticScholar(q.query, q.id));
    let res = await call();
    // Semantic Scholar's anonymous pool throttles hard: back off up to four times before giving the run up.
    for (let attempt = 1; "error" in res && res.status === 429 && attempt <= 4; attempt++) {
      console.log(`  … ${q.id}: HTTP 429, waiting ${60 * attempt} s`);
      await new Promise((r) => setTimeout(r, 60000 * attempt));
      res = await call();
    }
    if ("error" in res) {
      console.log(`  ? ${q.id} (${q.engine}): ${res.error} — run skipped, recorded as failed`);
      failedRuns.push(`${q.id} (${q.engine}: ${res.error})`);
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }
    res.run.query_form = q.form;
    res.run.query_key = q.key;
    runs.push(res.run);
    console.log(`  ${q.id} (${q.engine}, ${q.form}): ${res.run.result_count_reported ?? "?"} reported, ${res.works.length} retrieved`);
    for (const w of res.works) {
      const key = w.doi ?? w.openalex_id ?? w.title;
      const seen = works.get(key);
      if (seen) seen.found_by.push(q.id);
      else works.set(key, w);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  if (runs.length === 0) throw new Error("every planned run failed; nothing recorded");
  const stamp = new Date().toISOString().slice(0, 10);
  const rec: AutomatedSearchRun = {
    id: `search:${stamp}-${onlyPath}`,
    target: { kind: "path", path: onlyPath, claims: route.claims },
    dataset_hash: graph.meta.data_hash,
    driver_terms: plan.driver_terms,
    family_terms: [],
    phenomenon_terms: plan.phenomenon_terms,
    runs,
    works: [...works.values()],
    screening_status: "not-reviewed",
    result: "inconclusive",
    notes:
      (plan.notes ?? `Automated ${plan.protocol_version} index queries from ${planFile}; the result list is frozen for a reviewer and nothing here has been read for a qualifying demonstration.`) +
      (failedRuns.length ? ` Planned runs that failed and are NOT in this bundle: ${failedRuns.join("; ")}.` : "") +
      (skippedRuns.length ? ` Planned runs NOT run in this bundle (engine unavailable): ${skippedRuns.join("; ")}.` : ""),
  };
  byKey.set(`path|${onlyPath}`, rec);
  save();
  console.log(`route ${onlyPath}: ${runs.length} run(s), ${rec.works.length} unique works; ${byKey.size} automated run(s) on file`);
  process.exit(0);
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
