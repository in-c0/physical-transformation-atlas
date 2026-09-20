/**
 * The seven physics checks as data, so the export and the methods page describe exactly what
 * `runAllChecks` computes. Keep this in step with checks.ts: the ids are the CheckResult enum.
 */
import type { CheckResult } from "@pta/schema";

export type CheckId = CheckResult["id"];

export interface CheckDefinition {
  id: CheckId;
  name: string;
  /** What is examined, in one sentence. */
  question: string;
  /** What each of the four results means for this check. */
  results: Record<CheckResult["result"], string>;
  /** Which recorded fields the check reads; empty fields are what make it unresolved or unknown. */
  reads: string[];
  /** The four checks the site calls "core" (energy-form continuity, conservation, thermodynamic bound, boundary compatibility) decide whether a composition is physically coherent; the typed chain always holds for enumerated routes. */
  core: boolean;
}

export const CHECK_DEFINITIONS: CheckDefinition[] = [
  {
    id: "type-chain",
    name: "Typed chain",
    question: "Is every step a valid process relation and does the chain run disequilibrium → … → output without a break?",
    results: {
      pass: "every step is a typed process relation and the chain is unbroken from a disequilibrium to an output",
      fail: "a step is not a process relation, a step is dangling, or the chain does not start at a disequilibrium or end at an output",
      unresolved: "not used by this check",
      unknown: "not used by this check",
    },
    reads: ["claim.subject", "claim.predicate", "claim.object", "entity.type"],
    core: false,
  },
  {
    id: "energy-form-continuity",
    name: "Energy-form continuity",
    question: "Does each step's declared output energy form match the next step's declared input form?",
    results: {
      pass: "every declared seam matches",
      fail: "at least one adjacent pair declares mismatched forms",
      unresolved: "some steps declare their ledger and the declared seams match, but at least one step has no ledger",
      unknown: "no step declares its energy forms yet",
    },
    reads: ["claim.energy.input", "claim.energy.output"],
    core: true,
  },
  {
    id: "conservation",
    name: "Conservation / free energy",
    question: "Does the source carry exergy relative to the reference environment, and is no step contradicted or invalid?",
    results: {
      pass: "the source has positive exergy and every step declares its ledger",
      fail: "a step is contradicted or invalid, or the source carries no exergy relative to the reference environment",
      unresolved: "source exergy is positive but at least one step has no energy ledger entry",
      unknown: "the source has no exergy assessment recorded",
    },
    reads: ["entity.exergy", "claim.status", "claim.energy"],
    core: true,
  },
  {
    id: "thermodynamic-bound",
    name: "Thermodynamic bound",
    question: "Which recorded limits (bounded_by claims) apply, and does any recorded efficiency respect the tightest numeric one?",
    results: {
      pass: "applicable bounds are recorded and no recorded efficiency exceeds the tightest numeric bound",
      fail: "a recorded efficiency exceeds an applicable numeric bound",
      unresolved: "no bounded_by claim is recorded for any step (a thermal source implies Carnot, but the atlas does not assume it)",
      unknown: "not used by this check",
    },
    reads: ["bounded_by claims", "constraint.max_efficiency", "constraint.applies_to_sources", "pathway.performance.efficiency_typical", "pathway.performance.efficiency_record"],
    core: true,
  },
  {
    id: "dimensional",
    name: "Dimensional consistency",
    question: "For every step with a constitutive relation, do the input quantity, coefficient unit and output quantity balance in SI dimensions?",
    results: {
      pass: "every recorded relation balances",
      fail: "a relation does not balance, or a quantity or unit in it is unknown",
      unresolved: "not used by this check",
      unknown: "no step records a constitutive relation",
    },
    reads: ["claim.relation", "quantity.dimension", "ontology/units.yaml"],
    core: false,
  },
  {
    id: "boundary-compatibility",
    name: "Boundary compatibility",
    question: "Do the condition tags of one step, or of two adjacent steps, conflict (for example a vacuum region next to a liquid one)?",
    results: {
      pass: "condition tags are recorded on every step and none conflict within or between adjacent steps",
      fail: "two tags on the same step conflict",
      unresolved: "adjacent steps carry conflicting tags (an interface is implied but not recorded), or some steps carry no tags",
      unknown: "no step carries condition tags",
    },
    reads: ["claim.condition_tags", "ontology/conditions.yaml conflicts"],
    core: true,
  },
  {
    id: "practical-magnitude",
    name: "Practical magnitude",
    question: "Is a measured efficiency or power density on record for this composition?",
    results: {
      pass: "a numeric efficiency or power density is recorded",
      fail: "not used by this check",
      unresolved: "performance is recorded in prose without numbers",
      unknown: "no performance record exists for this composition",
    },
    reads: ["pathway.performance"],
    core: false,
  },
];

export const CORE_CHECK_IDS: ReadonlySet<CheckId> = new Set(CHECK_DEFINITIONS.filter((d) => d.core).map((d) => d.id));
