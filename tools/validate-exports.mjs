// Validate every built /api export against the JSON Schema it names in meta.schema.
// Run after `pnpm build`: node tools/validate-exports.mjs [origin]
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = resolve(fileURLToPath(import.meta.url), "..");
const origin = process.argv[2];
const out = join(here, "..", "apps", "web", "out", "api");
const read = async (p) => (origin ? await (await fetch(`${origin}/api/${p}`)).text() : readFileSync(join(out, p), "utf8"));

const schema = JSON.parse(await read("schema/v0.5.0.json"));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(schema, schema.$id);

const files = ["stats.json", "graph.json", "entities.json", "claims.json", "sources.json", "pathways.json", "systems.json", "paths.json", "matrix.json", "coverage.json", "checks.json", "vocabulary.json"];
let bad = 0;
for (const f of files) {
  const doc = JSON.parse(await read(f));
  const ref = doc.meta.schema.slice(doc.meta.schema.indexOf("#"));
  const validate = ajv.getSchema(`${schema.$id}${ref}`);
  if (!validate) {
    console.log(`${f}: no schema for ${ref}`);
    bad++;
    continue;
  }
  const ok = validate(doc);
  console.log(`${f.padEnd(16)} ${ref.padEnd(28)} ${ok ? "valid" : "INVALID"} ${ok ? "" : JSON.stringify(validate.errors.slice(0, 3))}`);
  if (!ok) bad++;
}
// ndjson: every line after the first is a Claim
const lines = (await read("claims.ndjson")).trim().split("\n");
const claim = ajv.getSchema(`${schema.$id}#/$defs/ClaimLine`);
const ndBad = lines.slice(1).filter((l) => !claim(JSON.parse(l))).length;
console.log(`claims.ndjson     ${lines.length - 1} claim lines, ${ndBad} invalid`);
if (ndBad) bad++;
// negative control: a claim with an unknown status must fail
const control = JSON.parse(lines[1]);
control.status = "believed";
if (claim(control)) {
  console.log("NEGATIVE CONTROL FAILED: an invalid status validated");
  bad++;
} else console.log("negative control ok: unknown status rejected");
process.exit(bad ? 1 : 0);
