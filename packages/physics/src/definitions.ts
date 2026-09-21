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
    label: "Source work availability",
    definition:
      "Does the source carry exergy relative to the reference environment, and does every step account for its energy? (Not a verified first-law balance: no quantitative energy accounting is recorded.)",
    pass_when: "the source has positive exergy and every step declares its ledger",
    fail_when: "the source carries no exergy relative to the reference environment",
    unresolved_when:
      "the source's exergy is conditional (it carries exergy only relative to a specific reference environment), or source exergy is positive but at least one step has no energy ledger entry",
    unknown_when: "the source has no exergy assessment recorded",
    reads: ["entity.exergy", "claim.energy"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkConservation",
  },
  {
    id: "thermodynamic-bound",
    label: "Thermodynamic bound",
    definition:
      "Which hard limits (bounded_by claims whose constraint is an upper-bound or a formula-bound applying to the route's source, output and phenomena) can be evaluated against a comparable recorded datum, and does every such datum respect them? Benchmarks, constitutive relations and resource limits are listed, never decisive.",
    pass_when:
      "at least one hard bound is fully evaluated against a physical-scope datum (laboratory, device, module, system, plant, field, or a summary efficiency — a numeric ceiling with the required basis, or a formula evaluated from the datum's recorded parameters) and every comparable physical datum is within it",
    fail_when: "a comparable physical-scope datum exceeds a fully evaluated hard bound",
    unresolved_when:
      "a hard bound applies but no physical datum can be evaluated: no datum of its metric, a datum without the required basis, missing formula inputs (for Carnot, the hot and cold temperatures of that datum), or only model-scope data — a model datum is evaluated and reported as model-consistent or model-inconsistent but never decides the physical route, exactly as it supplies no regime",
    unknown_when: "no hard bound is recorded for the route (a thermal source implies Carnot, but only a bounded_by claim records it)",
    reads: [
      "bounded_by claims",
      "constraint.constraint_kind",
      "constraint.metric",
      "constraint.max_efficiency",
      "constraint.formula",
      "constraint.formula_inputs",
      "constraint.requires_basis",
      "constraint.applies_to_sources / _outputs / _phenomena",
      "pathway.performance.measurements[].value_numeric / metric / basis / parameters",
      "pathway.performance.efficiency_record",
    ],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkThermodynamicBound",
  },
  {
    id: "dimensional",
    label: "Dimensional consistency",
    definition:
      "For every step with a constitutive relation, do the input quantity, coefficient unit and output quantity balance in SI dimensions — and does every conversion step (drives / couples_to, unless marked not-applicable) carry one?",
    pass_when: "every conversion step carries a relation and every recorded relation balances (bookkeeping steps — produces / converts_into — are not expected to carry one)",
    fail_when: "a relation does not balance, or a quantity or unit in it is unknown",
    unresolved_when: "every recorded relation balances, but at least one conversion step has no relation",
    unknown_when: "no step records a constitutive relation",
    reads: ["claim.relation", "claim.relation_requirement", "quantity.dimension", "ontology/units.yaml"],
    core: false,
    implementation: "packages/physics/src/checks.ts#checkDimensional",
  },
  {
    id: "boundary-compatibility",
    label: "Boundary compatibility",
    definition:
      "Do the scoped condition requirements of one step conflict on the same region, or does the active medium change state between two adjacent steps without a demonstrated interface record (for example a thermoacoustic gas column next to a solid acoustoelectric element)?",
    pass_when:
      "no two requirements of one step conflict in the same scope on the same region, no environment requirements conflict anywhere on the route, and every adjacent-step medium transition has a demonstrated interface record",
    fail_when:
      "two requirements of one step conflict in the same scope on the same region (a listed pair, or two members of one exclusive group), or environment requirements on the same region conflict anywhere on the route",
    unresolved_when: "an adjacent-step medium transition has no interface record, or only a theoretical or proposed one",
    unknown_when: "no step carries a scoped condition requirement",
    reads: ["claim.condition_requirements (or condition_tags with default scopes)", "ontology/conditions.yaml conflicts and exclusive_groups", "data/canonical/interfaces"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkBoundaryCompatibility",
  },
  {
    id: "driver-regime-sufficiency",
    label: "Driver / regime sufficiency",
    definition:
      "Does each conversion step get the regime it needs from its causal source — not merely a syntactically valid edge? Pyroelectricity needs a temperature that changes in time; a static temperature gradient supplies a spatial gradient, not that.",
    pass_when:
      "every regime requirement recorded on a step is supplied by the route source's regime_provides, a preceding step's regime_provides (or that of the disequilibrium it produces), the exact reviewed pathway's regime_provides, or an independent external condition the step records (never a property of its own subject)",
    fail_when: "the route source's regime_excludes names a required regime nothing else supplies",
    unresolved_when: "a requirement is recorded but no provider is recorded",
    unknown_when: "no step records a machine-readable regime requirement",
    reads: ["claim.regime_requires / regime_provides / regime_external", "entity.regime_provides / regime_excludes", "pathway.regime_provides"],
    core: true,
    implementation: "packages/physics/src/checks.ts#checkDriverRegimeSufficiency",
  },
  {
    id: "practical-magnitude",
    label: "Measured performance coverage",
    definition: "Does the recorded pathway carry a structured measurement — value, unit, regime and source — for this composition? A coverage statement, not a physics verdict.",
    pass_when: "at least one structured measurement with value, unit, regime and source is recorded",
    fail_when: "a structured datum is malformed: a conversion efficiency or power coefficient outside [0, 1]",
    unresolved_when: "only summary figures or prose are recorded",
    unknown_when: "no performance record exists for this composition (the honest state of an undemonstrated route)",
    reads: ["pathway.performance.measurements", "pathway.performance.efficiency_record / theoretical_limitity"],
    core: false,
    implementation: "packages/physics/src/checks.ts#checkPracticalMagnitude",
  },
];

export const CORE_CHECK_IDS: ReadonlySet<CheckId> = new Set(CHECK_DEFINITIONS.filter((d) => d.core).map((d) => d.id));
