/**
 * Print a canonical source record for each DOI, filled from Crossref, so that new
 * sources enter the atlas with the publisher's title, authors, year and venue.
 *
 *   pnpm --filter @pta/pipelines source-from-doi <id>=<doi> [<id>=<doi> ...]
 *
 * Output is YAML to paste into data/canonical/sources/sources.yaml; nothing is written.
 */
type Work = {
  title?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  issued?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  volume?: string;
  page?: string;
  "article-number"?: string;
  type?: string;
  publisher?: string;
};

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: source-from-doi <id>=<doi> ...");
  process.exit(1);
}
const TYPE: Record<string, string> = { "journal-article": "paper", book: "book", monograph: "book", "book-chapter": "book", "proceedings-article": "paper", report: "report" };
const q = (s: string) => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';

for (const arg of args) {
  const eq = arg.indexOf("=");
  const id = arg.slice(0, eq);
  const doi = arg.slice(eq + 1);
  const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { headers: { "User-Agent": "physical-transformation-atlas/0.1 (source-from-doi)" } });
  if (!r.ok) {
    console.log(`# ${id}: Crossref HTTP ${r.status} for ${doi}`);
    continue;
  }
  const w = ((await r.json()) as { message: Work }).message;
  const title = (w.title?.[0] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const authors = (w.author ?? []).map((a) => (a.name ? a.name : `${(a.given ?? "").split(/[\s-]+/).map((g) => g[0] ? g[0] + "." : "").join(" ").trim()} ${a.family ?? ""}`.trim()));
  const year = w.issued?.["date-parts"]?.[0]?.[0];
  const venue = [w["container-title"]?.[0], w.volume, w.page ?? w["article-number"]].filter(Boolean).join(w.volume ? " " : "").replace(/(\S) (\S+)$/, (m, a, b) => `${a}, ${b}`);
  const type = TYPE[w.type ?? ""] ?? "paper";
  const isReview = /review|advances|progress|perspective/i.test(title);
  console.log(`- id: source:${id}`);
  console.log(`  type: ${type === "paper" && isReview ? "review" : type}`);
  console.log(`  title: ${q(title)}`);
  console.log(`  authors: [${authors.slice(0, 8).map((a) => (a.includes(":") ? q(a) : a)).join(", ")}${authors.length > 8 ? ", et al." : ""}]`);
  if (year) console.log(`  year: ${year}`);
  if (venue) console.log(`  venue: ${q(venue)}`);
  console.log(`  doi: ${doi}`);
  await new Promise((res) => setTimeout(res, 150));
}
