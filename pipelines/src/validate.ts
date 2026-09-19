/** Validate data/canonical and report. Exit 1 on any problem. */
import { resolve } from "node:path";
import { loadCanon, ValidationError } from "@pta/graph";

const root = resolve(import.meta.dirname, "..", "..");
try {
  const canon = loadCanon(root);
  console.log(
    `ok: ${canon.entities.length} entities, ${canon.claims.length} claims, ${canon.sources.length} sources, ${canon.pathways.length} pathways, ${canon.searches.length} reviewed searches, ${canon.searchRuns.length} automated runs`,
  );
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
