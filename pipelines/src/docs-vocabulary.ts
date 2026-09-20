/**
 * Writes docs/vocabulary.md from the schema's VOCABULARY so the documented enumerations are
 * exactly the ones the code and the exports use. Run by `pnpm build:graph`; also `pnpm docs:vocabulary`.
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { VOCABULARY } from "@pta/schema/vocabulary";

const root = resolve(import.meta.dirname, "..", "..");
const out = join(root, "docs", "vocabulary.md");

const lines: string[] = [
  "# Vocabulary",
  "",
  "Every enumeration used by the canonical data and the `/api/*.json` exports, with one definition per value.",
  "This file is generated from `packages/schema/src/vocabulary.ts` by `pnpm build:graph`; edit the definitions there.",
  "The same content is served as JSON at `/api/vocabulary.json`.",
  "",
];
for (const e of VOCABULARY) {
  lines.push(`## \`${e.name}\``, "", `Used in: ${e.used_in.map((u) => `\`${u}\``).join(", ")}`, "");
  for (const t of e.terms) lines.push(`- \`${t.id}\` — ${t.definition}`);
  lines.push("");
}
writeFileSync(out, lines.join("\n"));
console.log(`docs/vocabulary.md: ${VOCABULARY.length} enumerations, ${VOCABULARY.reduce((n, e) => n + e.terms.length, 0)} terms`);
