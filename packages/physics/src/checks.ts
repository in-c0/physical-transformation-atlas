/**
 * Physics checks over a conversion path (an ordered list of process claims).
 *
 * Every check returns pass / fail / unresolved / unknown plus a sentence that
 * says what was actually examined. "unresolved" means the data needed to decide
 * is partly present; "unknown" means none of it is recorded yet. The site shows
 * the sentence, never just the verdict.
 */
import type { CheckResult, Claim, ConditionConflict, Entity, EntityType, EnergyForm, Pathway, Predicate } from "@pta/schema";
import { UnitTable, add, equal, format, dim } from "./dimensions.js";

export interface PhysicsContext {
  entity(id: string): Entity | undefined;
  units: UnitTable;
  conflicts: ConditionConflict[];
  /** All `bounded_by` claims, so the thermodynamic check can find applicable limits. */
  boundedBy(entityId: string): { constraint: Entity; claim: Claim }[];
}

/** Which (subject type, predicate, object type) triples are valid process steps. */
export const PROCESS_STEP_TYPES: Record<string, Array<[EntityType, EntityType]>> = {
  drives: [
    ["disequilibrium", "phenomenon"],
    ["carrier", "phenomenon"],
  ],
  produces: [
    ["phenomenon", "carrier"],
    ["phenomenon", "disequilibrium"],
  ],
  couples_to: [["phenomenon", "phenomenon"]],
  converts_into: [
    ["phenomenon", "output"],
    ["carrier", "output"],
  ],
};

export function isValidStep(pred: Predicate, s: EntityType, o: EntityType): boolean {
  const allowed = PROCESS_STEP_TYPES[pred];
  return !!allowed && allowed.some(([a, b]) => a === s && b === o);
}

function typeOf(ctx: PhysicsContext, id: string): EntityType | undefined {
  return ctx.entity(id)?.type;
}

export function checkTypeChain(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "typed chain";
  if (claims.length === 0) return { id: "type-chain", label, result: "fail", detail: "empty path" };
  for (let i = 0; i < claims.length; i++) {
    const c = claims[i];
    const s = typeOf(ctx, c.subject);
    const o = typeOf(ctx, c.object);
    if (!s || !o) return { id: "type-chain", label, result: "fail", detail: `${c.id}: dangling entity` };
    if (!isValidStep(c.predicate, s, o)) {
      return { id: "type-chain", label, result: "fail", detail: `${c.id}: ${s} —${c.predicate}→ ${o} is not a process step` };
    }
    if (i > 0 && claims[i - 1].object !== c.subject) {
      return { id: "type-chain", label, result: "fail", detail: `${claims[i - 1].id} → ${c.id}: chain is broken` };
    }
  }
  const first = typeOf(ctx, claims[0].subject);
  const last = typeOf(ctx, claims[claims.length - 1].object);
  if (first !== "disequilibrium") return { id: "type-chain", label, result: "fail", detail: "path does not start at a disequilibrium" };
  if (last !== "output") return { id: "type-chain", label, result: "fail", detail: "path does not end at an output" };
  return { id: "type-chain", label, result: "pass", detail: `${claims.length} typed steps, disequilibrium → output` };
}

export function checkEnergyFormContinuity(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "energy-form continuity";
  const declared = claims.filter((c) => c.energy);
  if (declared.length === 0) return { id: "energy-form-continuity", label, result: "unknown", detail: "no step declares its energy forms yet" };
  let mismatches = 0;
  const seams: string[] = [];
  for (let i = 0; i < claims.length - 1; i++) {
    const a = claims[i].energy;
    const b = claims[i + 1].energy;
    if (!a || !b) continue;
    if (a.output !== b.input) {
      mismatches++;
      seams.push(`${claims[i].id} emits ${a.output} but ${claims[i + 1].id} takes ${b.input}`);
    }
  }
  // The carrier between two steps must carry what the step emits.
  for (const c of claims) {
    if (!c.energy) continue;
    const obj = ctx.entity(c.object);
    if (obj?.type === "carrier" && obj.energy_form && obj.energy_form !== c.energy.output) {
      mismatches++;
      seams.push(`${c.id} emits ${c.energy.output} into ${obj.name}, which carries ${obj.energy_form}`);
    }
  }
  if (mismatches > 0) return { id: "energy-form-continuity", label, result: "fail", detail: seams.join("; ") };
  if (declared.length < claims.length) {
    return {
      id: "energy-form-continuity",
      label,
      result: "unresolved",
      detail: `${declared.length}/${claims.length} steps declare energy forms; the declared seams are consistent`,
    };
  }
  const chain = [claims[0].energy!.input, ...claims.map((c) => c.energy!.output)];
  return { id: "energy-form-continuity", label, result: "pass", detail: chain.join(" → ") };
}

export function checkConservation(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "conservation / available free energy";
  const src = ctx.entity(claims[0]?.subject ?? "");
  if (!src) return { id: "conservation", label, result: "fail", detail: "no source" };
  const invalid = claims.filter((c) => c.status === "contradicted" || c.status === "invalid");
  if (invalid.length) return { id: "conservation", label, result: "fail", detail: `${invalid.map((c) => c.id).join(", ")} contradicted or invalid` };
  if (src.exergy === "none") return { id: "conservation", label, result: "fail", detail: `${src.name} carries no exergy relative to the reference environment` };
  const sinkForms: EnergyForm[] = [];
  const undeclared: string[] = [];
  for (const c of claims) {
    if (!c.energy) undeclared.push(c.id);
    else if (c.energy.dissipation) sinkForms.push(c.energy.dissipation);
  }
  if (src.exergy === undefined) return { id: "conservation", label, result: "unknown", detail: `${src.name} has no exergy assessment recorded` };
  if (src.exergy === "conditional") {
    return {
      id: "conservation",
      label,
      result: "unresolved",
      detail: `${src.name} carries exergy only relative to a specific reference environment; sign of ΔG depends on conditions`,
    };
  }
  if (undeclared.length) {
    return { id: "conservation", label, result: "unresolved", detail: `source exergy positive; ${undeclared.length} step(s) have no energy ledger entry` };
  }
  const sinks = [...new Set(sinkForms)];
  return {
    id: "conservation",
    label,
    result: "pass",
    detail: `source exergy positive; every step declares its output and losses${sinks.length ? ` (dissipation to ${sinks.join(", ")})` : ""}`,
  };
}

export function checkThermodynamicBound(ctx: PhysicsContext, claims: Claim[], pathway?: Pathway): CheckResult {
  const label = "thermodynamic bound";
  const bounds = new Map<string, Entity>();
  for (const c of claims) {
    for (const id of [c.subject, c.object]) {
      for (const b of ctx.boundedBy(id)) bounds.set(b.constraint.id, b.constraint);
    }
  }
  const first = claims[0]?.energy?.input;
  if (bounds.size === 0) {
    const hint = first === "thermal" ? "; a thermal source implies the Carnot bound but no bounded_by claim records it" : "";
    return { id: "thermodynamic-bound", label, result: "unresolved", detail: `no bound recorded for these steps${hint}` };
  }
  const names = [...bounds.values()].map((b) => b.name);
  const eff = pathway?.performance?.efficiency_record ?? pathway?.performance?.efficiency_typical;
  const source = claims[0].subject;
  const numeric = [...bounds.values()].filter(
    (b) => typeof b.max_efficiency === "number" && (b.applies_to_sources.length === 0 || b.applies_to_sources.includes(source)),
  );
  if (eff !== undefined && numeric.length) {
    const ceiling = Math.min(...numeric.map((b) => b.max_efficiency as number));
    if (eff > ceiling) {
      return { id: "thermodynamic-bound", label, result: "fail", detail: `recorded efficiency ${(eff * 100).toFixed(1)}% exceeds ${names.join(", ")} (${(ceiling * 100).toFixed(1)}%)` };
    }
    return { id: "thermodynamic-bound", label, result: "pass", detail: `recorded efficiency ${(eff * 100).toFixed(1)}% is within ${names.join(", ")} (≤ ${(ceiling * 100).toFixed(1)}%)` };
  }
  return { id: "thermodynamic-bound", label, result: "pass", detail: `applicable: ${names.join(", ")}${eff === undefined ? "; no efficiency recorded to compare" : ""}` };
}

export function checkDimensional(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "dimensional";
  const withRel = claims.filter((c) => c.relation);
  if (withRel.length === 0) return { id: "dimensional", label, result: "unknown", detail: "no constitutive relation recorded on any step" };
  const failures: string[] = [];
  const passes: string[] = [];
  for (const c of withRel) {
    const r = c.relation!;
    const qin = ctx.entity(r.input);
    const qout = ctx.entity(r.output);
    if (!qin?.dimension || !qout?.dimension) {
      failures.push(`${c.id}: ${!qin?.dimension ? r.input : r.output} has no dimension`);
      continue;
    }
    let coeff;
    try {
      coeff = ctx.units.parse(r.coefficient_unit);
    } catch (e) {
      failures.push(`${c.id}: ${(e as Error).message}`);
      continue;
    }
    const lhs = dim(qout.dimension);
    const rhs = add(coeff, dim(qin.dimension));
    if (equal(lhs, rhs)) passes.push(`${r.formula} [${format(lhs)}]`);
    else failures.push(`${c.id}: ${r.formula} gives ${format(rhs)} but ${qout.name} is ${format(lhs)}`);
  }
  if (failures.length) return { id: "dimensional", label, result: "fail", detail: failures.join("; ") };
  if (withRel.length < claims.length) {
    return { id: "dimensional", label, result: "unresolved", detail: `${withRel.length}/${claims.length} steps carry a relation; all consistent: ${passes.join("; ")}` };
  }
  return { id: "dimensional", label, result: "pass", detail: passes.join("; ") };
}

/**
 * Conditions inside one step must be mutually compatible (a fail). Conflicting
 * conditions on two adjacent steps mean an interface — a heat exchanger, a window,
 * a shaft — is implied but not recorded, so the result is unresolved, not fail.
 */
export function checkBoundaryCompatibility(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "boundary compatibility";
  const tagsByStep = claims.map((c) => {
    const own = new Set(c.condition_tags);
    for (const id of [c.subject, c.object]) for (const t of ctx.entity(id)?.condition_tags ?? []) own.add(t);
    return own;
  });
  const all = new Set<string>();
  for (const s of tagsByStep) for (const t of s) all.add(t);
  const untagged = tagsByStep.filter((s) => s.size === 0).length;
  if (all.size === 0) return { id: "boundary-compatibility", label, result: "unknown", detail: "no condition tags recorded on any step" };
  const within: string[] = [];
  const adjacent: string[] = [];
  for (const k of ctx.conflicts) {
    for (let i = 0; i < tagsByStep.length; i++) {
      const s = tagsByStep[i];
      if (s.has(k.a) && s.has(k.b)) within.push(`${claims[i].id}: ${k.a} vs ${k.b} (${k.reason})`);
      if (i > 0) {
        const p = tagsByStep[i - 1];
        if ((p.has(k.a) && s.has(k.b)) || (p.has(k.b) && s.has(k.a))) adjacent.push(`${claims[i - 1].id} → ${claims[i].id}: ${k.a} vs ${k.b}`);
      }
    }
  }
  if (within.length) return { id: "boundary-compatibility", label, result: "fail", detail: within.join("; ") };
  if (adjacent.length) {
    return { id: "boundary-compatibility", label, result: "unresolved", detail: `interface implied but not recorded: ${[...new Set(adjacent)].join("; ")}` };
  }
  if (untagged > 0) return { id: "boundary-compatibility", label, result: "unresolved", detail: `${untagged}/${claims.length} steps have no condition tags; no conflicts among the ${all.size} recorded` };
  return { id: "boundary-compatibility", label, result: "pass", detail: `${all.size} condition tags across ${claims.length} steps, no conflicts within or between adjacent steps` };
}

export function checkPracticalMagnitude(pathway?: Pathway): CheckResult {
  const label = "practical magnitude";
  const p = pathway?.performance;
  if (!p) return { id: "practical-magnitude", label, result: "unknown", detail: "no measured efficiency or power density on record for this composition" };
  const parts: string[] = [];
  if (p.efficiency_typical !== undefined) parts.push(`typical efficiency ${(p.efficiency_typical * 100).toFixed(1)}%`);
  if (p.efficiency_record !== undefined) parts.push(`record ${(p.efficiency_record * 100).toFixed(1)}%`);
  if (p.power_density) parts.push(`power density ${p.power_density}`);
  if (parts.length === 0) return { id: "practical-magnitude", label, result: "unresolved", detail: p.notes ?? "performance recorded without numbers" };
  return { id: "practical-magnitude", label, result: "pass", detail: parts.join(", ") };
}

export function runAllChecks(ctx: PhysicsContext, claims: Claim[], pathway?: Pathway): CheckResult[] {
  return [
    checkTypeChain(ctx, claims),
    checkEnergyFormContinuity(ctx, claims),
    checkConservation(ctx, claims),
    checkThermodynamicBound(ctx, claims, pathway),
    checkDimensional(ctx, claims),
    checkBoundaryCompatibility(ctx, claims),
    checkPracticalMagnitude(pathway),
  ];
}
