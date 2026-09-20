import { test } from "node:test";
import assert from "node:assert/strict";
import { VOCABULARY } from "@pta/schema/vocabulary";
import { AVAILABILITY, DOMAINS, ENERGY_FORMS, ENTITY_TYPES, EVIDENCE_STATUSES, FRONTIER_CLASSES, KNOWLEDGE_LEVELS, MATRIX_CELL_STATUSES, PREDICATES, SEARCH_STATUSES, STRUCTURAL_KINDS } from "@pta/schema";

const byName = new Map(VOCABULARY.map((e) => [e.name, e]));

test("every enumeration in the schema is in the vocabulary with one definition per value", () => {
  const expected: Record<string, readonly string[]> = {
    "entity.type": ENTITY_TYPES,
    "claim.predicate": PREDICATES,
    "claim.status": EVIDENCE_STATUSES,
    "path.search_status": SEARCH_STATUSES,
    knowledge_level: KNOWLEDGE_LEVELS,
    energy_form: ENERGY_FORMS,
    domain: DOMAINS,
    "disequilibrium.availability": AVAILABILITY,
    "path.structural_kind": STRUCTURAL_KINDS,
    "matrix.cell.status": MATRIX_CELL_STATUSES,
    "path.frontier_class": FRONTIER_CLASSES,
  };
  for (const [name, values] of Object.entries(expected)) {
    const e = byName.get(name);
    assert.ok(e, `vocabulary lacks ${name}`);
    assert.deepEqual(
      e.terms.map((t) => t.id),
      [...values],
      `${name}: vocabulary values differ from the schema`,
    );
    for (const t of e.terms) assert.ok(t.definition.length > 12, `${name}.${t.id} has no definition`);
  }
});

test("negative control: a value missing from the vocabulary is detected", () => {
  const e = byName.get("claim.status")!;
  const broken = e.terms.filter((t) => t.id !== "disputed").map((t) => t.id);
  assert.notDeepEqual(broken, [...EVIDENCE_STATUSES]);
});
