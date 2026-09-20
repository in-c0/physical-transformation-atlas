/**
 * The seven physics checks as data, so the export and the methods page describe exactly what
 * `runAllChecks` computes. Keep this in step with checks.ts: the ids are the CheckResult enum.
 */
import type { CheckResult } from "@pta/schema";

export type CheckId = CheckResult["id"];

export interface CheckDefinition {
  id: CheckId;
  label: string;
  /** What is examined, in one sentence. */
  definition: string;
  /** When each of the four results is given for this check ("not used" when the check never returns it). */
  pass_when: string;
  fail_when: string;
  unresolved_when: string;
  unknown_when: string;
  /** Which recorded fields the check reads; empty fields are what make it unresolved or unknown. */
  reads: string[];
  /** The four checks the site calls "core" (energy-form continuity, conservation, thermodynamic bound, boundary compatibility) decide whether a composition is physically coherent; the typed chain always holds for enumerated routes. */
  core: boolean;
  /** Where the code is. */
  implementation: string;
}

export const CHECK_DEFINITIONS: CheckDefinition[] = [
  {
    id: "type-chain",
    label: "Typed chain",
    definition: "Is every step a valid process relation and does the chain run disequilibrium → … → output without a break?",
    pass_when: "every step is a typed process relation and the chain is unbroken from a disequilibrium to an output",
    fail_when: "a step is not a process relation, a step is dangling, or the chain does not start at a disequilibrium or end at an output",
    unresolved_when: "not used",
    unknown_when: "not used",
    reads: ["claim.subject", "claim.predicate", "claim.object", "entity.type"],
    core: false,
    implementation: "packages/physics/src/checks.ts#checkTypeChain",
  },
  {
    id: "energy-form-continuity",
    label: "Energy-form continuity",
    definition: "Does each step's declared output energy form match the next step's declared input form?",
    pass_when: "every declared seam matches",
    fail_when: "at least one adjacent pair declares mismatched forms",
    unresolved_when: "some steps declare their ledger and the declared seams match, but at least one step has no ledger",
    unknown_when: "no step declares its energy forms yet",
    reads: ["claim.energy.input", "claim.energy.output"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkEnergyFormContinuity",
  },
  {
    id: "conservation",
    label: "Conservation / free energy",
    definition: "Does the source carry exergy relative to the reference environment, and is no step contradicted or invalid?",
    pass_when: "the source has positive exergy and every step declares its ledger",
    fail_when: "a step is contradicted or invalid, or the source carries no exergy relative to the reference environment",
    unresolved_when: "the source's exergy is conditional (it carries exergy only relative to a specific reference environment), or source exergy is positive but at least one step has no energy ledger entry",
    unknown_when: "the source has no exergy assessment recorded",
    reads: ["entity.exergy", "claim.status", "claim.energy"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkConservation",
  },
  {
    id: "thermodynamic-bound",
    label: "Thermodynamic bound",
    definition: "Which recorded limits (bounded_by claims) apply, and does any recorded efficiency respect the tightest numeric one?",
    pass_when: "at least one applicable bound is recorded and, where an efficiency is recorded, it does not exceed the tightest numeric bound",
    fail_when: "a recorded efficiency exceeds an applicable numeric bound",
    unresolved_when: "no bounded_by claim is recorded for any step (a thermal source implies Carnot, but the atlas does not assume it)",
    unknown_when: "not used",
    reads: ["bounded_by claims", "constraint.max_efficiency", "constraint.applies_to_sources", "pathway.performance.efficiency_typical", "pathway.performance.efficiency_record"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkThermodynamicBound",
  },
  {
    id: "dimensional",
    label: "Dimensional consistency",
    definition: "For every step with a constitutive relation, do the input quantity, coefficient unit and output quantity balance in SI dimensions?",
    pass_when: "every recorded relation balances",
    fail_when: "a relation does not balance, or a quantity or unit in it is unknown",
    unresolved_when: "every recorded relation balances, but only some of the route's steps record a constitutive relation",
    unknown_when: "no step records a constitutive relation",
    reads: ["claim.relation", "quantity.dimension", "ontology/units.yaml"],
    core: false,
    implementation: "packages/physics/src/checks.ts#checkDimensional",
  },
  {
    id: "boundary-compatibility",
    label: "Boundary compatibility",
    definition: "Do the condition tags of one step, or of two adjacent steps, conflict (for example a vacuum region next to a liquid one)?",
    pass_when: "condition tags are recorded on every step and none conflict within or between adjacent steps",
    fail_when: "two tags on the same step conflict",
    unresolved_when: "adjacent steps carry conflicting tags (an interface is implied but not recorded), or some steps carry no tags",
    unknown_when: "no step carries condition tags",
    reads: ["claim.condition_tags", "ontology/conditions.yaml conflicts"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkBoundaryCompatibility",
  },
  {
    id: "practical-magnitude",
    label: "Practical magnitude",
    definition: "Is a measured efficiency or power density on record for this composition?",
    pass_when: "a numeric efficiency or power density is recorded",
    fail_when: "not used",
    unresolved_when: "performance is recorded in prose without numbers",
    unknown_when: "no performance record exists for this composition",
    reads: ["pathway.performance"],
    core: false,
    implementation: "packages/physics/src/checks.ts#checkPracticalMagnitude",
  },
];

export const CORE_CHECK_IDS: ReadonlySet<CheckId> = new Set(CHECK_DEFINITIONS.filter((d) => d.core).map((d) => d.id));
