import { atlas } from "@/lib/data";

export const dynamic = "force-static";

const COLUMNS = [
  "id",
  "subject",
  "predicate",
  "object",
  "status",
  "knowledge_level",
  "energy_input",
  "energy_output",
  "energy_dissipation",
  "conditions",
  "condition_tags",
  "evidence",
  "relation_formula",
  "relation_coefficient_unit",
  "last_reviewed",
  "canonical",
  "notes",
] as const;

const cell = (v: unknown): string => {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The claims table flattened one row per claim; list fields joined with " | ". Same rows as claims.json. */
export function GET() {
  const rows = atlas().graph.claims.map((c) =>
    [
      c.id,
      c.subject,
      c.predicate,
      c.object,
      c.status,
      c.knowledge_level ?? "",
      c.energy?.input ?? "",
      c.energy?.output ?? "",
      c.energy?.dissipation ?? "",
      c.conditions.join(" | "),
      c.condition_tags.join(" | "),
      c.evidence.join(" | "),
      c.relation?.formula ?? "",
      c.relation?.coefficient_unit ?? "",
      c.review.last_reviewed,
      c.review.canonical ? "true" : "false",
      c.notes ?? "",
    ]
      .map(cell)
      .join(","),
  );
  const body = [COLUMNS.join(","), ...rows].join("\n") + "\n";
  return new Response(body, {
    headers: { "content-type": "text/csv; charset=utf-8" },
  });
}
