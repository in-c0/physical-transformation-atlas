import { atlas } from "@/lib/data";
import { claimUrl } from "@/lib/api";

export const dynamic = "force-static";

const COLUMNS = [
  "data_hash",
  "id",
  "subject",
  "predicate",
  "object",
  "status",
  "conditions_json",
  "condition_tags_json",
  "energy_input",
  "energy_output",
  "energy_dissipation",
  "relation_formula",
  "relation_input",
  "relation_output",
  "coefficient_unit",
  "evidence_ids_json",
  "canonical",
  "last_reviewed",
  "canonical_url",
  "notes",
] as const;

const cell = (v: unknown): string => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The claims table flattened, one row per claim; list fields are JSON arrays in a cell. Same rows as claims.json. */
export function GET() {
  const g = atlas().graph;
  const rows = g.claims.map((c) =>
    [
      g.meta.data_hash,
      c.id,
      c.subject,
      c.predicate,
      c.object,
      c.status,
      JSON.stringify(c.conditions),
      JSON.stringify(c.condition_tags),
      c.energy?.input ?? "",
      c.energy?.output ?? "",
      c.energy?.dissipation ?? "",
      c.relation?.formula ?? "",
      c.relation?.input ?? "",
      c.relation?.output ?? "",
      c.relation?.coefficient_unit ?? "",
      JSON.stringify(c.evidence),
      c.review.canonical ? "true" : "false",
      c.review.last_reviewed ?? "",
      claimUrl(c.id),
      c.notes ?? "",
    ]
      .map(cell)
      .join(","),
  );
  const body = [COLUMNS.join(","), ...rows].join("\n") + "\n";
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8" } });
}
