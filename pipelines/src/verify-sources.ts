/**
 * Check every source DOI against Crossref and record whether it resolves and
 * whether the title Crossref returns matches the one on file. Output:
 * data/generated/source-verification.json (committed; shown on the site).
 *
 *   pnpm --filter @pta/pipelines verify-sources            # only unchecked / failed
 *   pnpm --filter @pta/pipelines verify-sources --all      # re-check everything
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { loadCanon } from "@pta/graph";

const root = resolve(import.meta.dirname, "..", "..");
const outFile = join(root, "data", "generated", "source-verification.json");
const all = process.argv.includes("--all");

type Record_ = { verified: boolean; checked_at: string; crossref_title?: string; note?: string };
const prev: Record<string, Record_> = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
const out: Record<string, Record_> = { ...prev };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

function overlap(a: string, b: string): number {
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

const canon = loadCanon(root);
const todo = canon.sources.filter((s) => s.doi && (all || !prev[s.id] || !prev[s.id].verified));
console.log(`${todo.length} DOI(s) to check`);
let ok = 0;
for (const s of todo) {
  const doi = s.doi!;
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const checked_at = new Date().toISOString();
  try {
    const r = await fetch(url, { headers: { "User-Agent": "physical-transformation-atlas/0.1 (source verification pipeline)" } });
    if (r.status === 404) {
      out[s.id] = { verified: false, checked_at, note: "DOI not found in Crossref" };
      console.log(`  ✗ ${s.id}: not found`);
    } else if (!r.ok) {
      out[s.id] = { verified: false, checked_at, note: `Crossref HTTP ${r.status}` };
      console.log(`  ? ${s.id}: HTTP ${r.status}`);
    } else {
      const j = (await r.json()) as { message: { title?: string[]; "container-title"?: string[]; issued?: { "date-parts"?: number[][] } } };
      const title = j.message.title?.[0] ?? "";
      const score = overlap(s.title, title);
      const year = j.message.issued?.["date-parts"]?.[0]?.[0];
      const verified = score >= 0.5;
      out[s.id] = { verified, checked_at, crossref_title: title, note: verified ? undefined : `title overlap ${score.toFixed(2)}${year ? `, Crossref year ${year}` : ""}` };
      console.log(`  ${verified ? "✓" : "✗"} ${s.id}: ${score.toFixed(2)} "${title.slice(0, 70)}"${year && s.year && year !== s.year ? ` (year ${year} vs ${s.year})` : ""}`);
      if (verified) ok++;
    }
  } catch (e) {
    out[s.id] = { verified: false, checked_at, note: `fetch failed: ${(e as Error).message}` };
    console.log(`  ? ${s.id}: ${(e as Error).message}`);
  }
  await new Promise((r) => setTimeout(r, 120));
}
mkdirSync(join(root, "data", "generated"), { recursive: true });
writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
const total = Object.values(out).filter((v) => v.verified).length;
console.log(`verified this run: ${ok}/${todo.length}; total verified on file: ${total}/${canon.sources.filter((s) => s.doi).length} DOIs`);
