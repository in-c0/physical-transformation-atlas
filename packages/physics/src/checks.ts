/**
 * Physics checks over a conversion path (an ordered list of process claims).
 *
 * Every check returns pass / fail / unresolved / unknown plus a sentence that
 * says what was actually examined. "unresolved" means the data needed to decide
 * is partly present; "unknown" means none of it is recorded yet. The site shows
 * the sentence, never just the verdict.
 */
import type {
  CheckResult,
  Claim,
  ConditionConflict,
  ConditionRequirement,
  Entity,
  EntityType,
  EnergyForm,
  ExclusiveGroup,
  Interface,
  InterfaceKind,
  InterfaceStatus,
  Pathway,
  Predicate,
} from "@pta/schema";
import { UnitTable, add, equal, format, dim } from "./dimensions.js";

export interface PhysicsContext {
  entity(id: string): Entity | undefined;
  units: UnitTable;
  conflicts: ConditionConflict[];
  /** Pass 26: exclusive tag groups, the interface records, and each step's scoped requirements (expanded from its flat tags when none are authored). */
  exclusiveGroups: ExclusiveGroup[];
  interfaces: Interface[];
  requirementsOf(claim: Claim): ConditionRequirement[];
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
  // A carrier must carry what the step emits into it, and a step fed by a carrier must take what it carries.
  for (const c of claims) {
    if (!c.energy) continue;
    const obj = ctx.entity(c.object);
    if (obj?.type === "carrier" && obj.energy_form && obj.energy_form !== c.energy.output) {
      mismatches++;
      seams.push(`${c.id} emits ${c.energy.output} into ${obj.name}, which carries ${obj.energy_form}`);
    }
    const subj = ctx.entity(c.subject);
    if (subj?.type === "carrier" && subj.energy_form && subj.energy_form !== c.energy.input) {
      mismatches++;
      seams.push(`${c.id} takes ${c.energy.input} from ${subj.name}, which carries ${subj.energy_form}`);
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
  // Loop-3 pass 19: this check asks whether the source carries work and whether every step accounts
  // for its energy; it never verified a first-law balance, so the label says what it examines.
  const label = "source work availability";
  const src = ctx.entity(claims[0]?.subject ?? "");
  if (!src) return { id: "conservation", label, result: "fail", detail: "no source" };
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
    detail: `source exergy positive; every step declares its output and losses${sinks.length ? ` (dissipation to ${sinks.join(", ")})` : ""}; no quantitative balance is recorded, so this is availability, not a verified first-law balance`,
  };
}

/** A tiny arithmetic evaluator for formula bounds: + − × ÷ ^ sqrt() and named inputs; no eval. */
export function evaluateFormula(formula: string, vars: Record<string, number>): number | null {
  const src = formula.replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  const parsePrimary = (): number | null => {
    if (peek() === "(") {
      i++;
      const v = parseExpr();
      if (peek() !== ")") return null;
      i++;
      return v;
    }
    if (peek() === "-") {
      i++;
      const v = parsePrimary();
      return v === null ? null : -v;
    }
    const m = /^([0-9]*\.?[0-9]+|[A-Za-z_][A-Za-z0-9_]*)/.exec(src.slice(i));
    if (!m) return null;
    i += m[0].length;
    if (/^[0-9.]/.test(m[0])) return Number(m[0]);
    if (m[0] === "sqrt" && peek() === "(") {
      i++;
      const v = parseExpr();
      if (peek() !== ")" || v === null || v < 0) return null;
      i++;
      return Math.sqrt(v);
    }
    return m[0] in vars ? vars[m[0]] : null;
  };
  const parsePower = (): number | null => {
    const base = parsePrimary();
    if (base === null) return null;
    if (peek() === "^") {
      i++;
      const e = parsePower();
      return e === null ? null : Math.pow(base, e);
    }
    return base;
  };
  const parseTerm = (): number | null => {
    let v = parsePower();
    while (v !== null && (peek() === "*" || peek() === "/")) {
      const op = src[i++];
      const r = parsePower();
      if (r === null) return null;
      v = op === "*" ? v * r : v / r;
    }
    return v;
  };
  const parseExpr = (): number | null => {
    let v = parseTerm();
    while (v !== null && (peek() === "+" || peek() === "-")) {
      const op = src[i++];
      const r = parseTerm();
      if (r === null) return null;
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  const v = parseExpr();
  return i === src.length && v !== null && Number.isFinite(v) ? v : null;
}

const HARD_KINDS = new Set(["upper-bound", "formula-bound"]);

/**
 * Loop-3 pass 19: a typed evaluator. Only a hard bound (upper-bound or formula-bound) that applies to
 * the route's source, sink and phenomena and can be fully evaluated against a comparable datum of the
 * same metric may pass or fail a route; benchmarks (Curzon–Ahlborn), constitutive relations (Onsager)
 * and resource bounds without a comparable datum are listed and never decide. A name is not a pass.
 */
export function checkThermodynamicBound(ctx: PhysicsContext, claims: Claim[], pathway?: Pathway): CheckResult {
  const label = "thermodynamic bound";
  const bounds = new Map<string, Entity>();
  for (const c of claims) {
    for (const id of [c.subject, c.object]) {
      for (const b of ctx.boundedBy(id)) bounds.set(b.constraint.id, b.constraint);
    }
  }
  const source = claims[0]?.subject;
  const sink = claims[claims.length - 1]?.object;
  const phenomena = new Set(claims.flatMap((c) => [c.subject, c.object]).filter((n) => ctx.entity(n)?.type === "phenomenon"));
  const applies = (b: Entity) =>
    (b.applies_to_sources.length === 0 || b.applies_to_sources.includes(source)) &&
    (b.applies_to_outputs.length === 0 || b.applies_to_outputs.includes(sink)) &&
    (b.applies_to_phenomena.length === 0 || b.applies_to_phenomena.some((p) => phenomena.has(p)));
  const all = [...bounds.values()];
  const hard = all.filter((b) => b.constraint_kind && HARD_KINDS.has(b.constraint_kind) && applies(b));
  const other = all.filter((b) => !hard.includes(b));
  const otherText = other.length ? `; other recorded limits: ${other.map((b) => b.name).join(", ")}` : "";
  if (hard.length === 0) {
    const first = claims[0]?.energy?.input;
    const hint = first === "thermal" && all.length === 0 ? " (a thermal source implies the Carnot bound but no bounded_by claim records it)" : "";
    return { id: "thermodynamic-bound", label, result: "unknown", detail: `no hard bound recorded for this route${hint}${otherText}` };
  }
  // Comparable data: structured measurements with the bound's metric; summary efficiencies count as
  // conversion-efficiency data without a basis or parameters. Pass 33: a model-scope datum is evaluated
  // against the bound and its result kept, but it never decides the physical route — exactly as a model
  // datum supplies no regime (pass 31). A model above the bound is an inconsistent model, not a forbidden route.
  type Datum = { value: number; metric: string; basis?: string; parameters?: Record<string, number>; label: string; model: boolean };
  const data: Datum[] = [];
  for (const m of pathway?.performance?.measurements ?? []) {
    if (m.value_numeric !== undefined && m.metric)
      data.push({ value: m.value_numeric, metric: m.metric, basis: m.basis, parameters: m.parameters, label: `${m.quantity} ${m.value}`, model: m.scope === "model" });
  }
  if (pathway?.performance?.efficiency_record !== undefined)
    data.push({ value: pathway.performance.efficiency_record, metric: "conversion-efficiency", label: `record efficiency ${(pathway.performance.efficiency_record * 100).toFixed(1)}%`, model: false });

  const evaluated: string[] = [];
  const failures: string[] = [];
  const pending: string[] = [];
  const modelConsistent: string[] = [];
  const modelInconsistent: string[] = [];
  for (const b of hard) {
    const comparable = data.filter((d) => d.metric === b.metric);
    if (comparable.length === 0) {
      pending.push(`${b.name}: no ${b.metric ?? "comparable"} datum recorded for this composition`);
      continue;
    }
    let decided = false;
    for (const d of comparable) {
      let ceiling: number | null = null;
      if (b.constraint_kind === "upper-bound") {
        if (b.requires_basis && d.basis !== b.requires_basis) {
          pending.push(`${b.name}: ${d.label} does not state the basis "${b.requires_basis}"`);
          continue;
        }
        ceiling = b.max_efficiency ?? null;
      } else if (b.constraint_kind === "formula-bound" && b.formula) {
        const missing = b.formula_inputs.filter((k) => d.parameters?.[k] === undefined);
        if (missing.length) {
          pending.push(`${b.name}: ${d.label} records no ${missing.join(", ")}`);
          continue;
        }
        ceiling = evaluateFormula(b.formula, d.parameters ?? {});
      }
      if (ceiling === null) {
        pending.push(`${b.name}: the bound could not be evaluated`);
        continue;
      }
      const pct = (x: number) => (b.metric === "conversion-efficiency" || b.metric === "power-coefficient" ? `${(x * 100).toFixed(1)}%` : String(x));
      const at = d.parameters && b.formula_inputs.length ? ` at ${b.formula_inputs.map((k) => `${k} ${d.parameters![k]}`).join(" / ")}` : "";
      if (d.model) {
        // Evaluated and kept, never decisive for the physical route.
        if (d.value > ceiling) modelInconsistent.push(`${d.label} exceeds ${b.name} (${pct(ceiling)})${at}`);
        else modelConsistent.push(`${d.label} ≤ ${b.name} (${pct(ceiling)})${at}`);
        continue;
      }
      decided = true;
      if (d.value > ceiling) failures.push(`${d.label} exceeds ${b.name} (${pct(ceiling)})`);
      else evaluated.push(`${d.label} ≤ ${b.name} (${pct(ceiling)})`);
    }
    if (!decided && comparable.length) continue;
  }
  const modelText = [
    ...(modelConsistent.length ? [`model-consistent · ${modelConsistent.join("; ")}`] : []),
    ...(modelInconsistent.length ? [`model-inconsistent · ${modelInconsistent.join("; ")} (a model prediction above the bound marks the model inconsistent; it does not forbid the route)`] : []),
  ];
  if (failures.length) return { id: "thermodynamic-bound", label, result: "fail", detail: [failures.join("; "), ...modelText].join("; ") + otherText };
  if (evaluated.length)
    return { id: "thermodynamic-bound", label, result: "pass", detail: `${[evaluated.join("; "), ...modelText].join("; ")}${pending.length ? `; unresolved: ${pending.join("; ")}` : ""}${otherText}` };
  if (modelText.length)
    return {
      id: "thermodynamic-bound",
      label,
      result: "unresolved",
      detail: `${modelText.join("; ")}; no comparable physical datum can be evaluated against ${hard.map((b) => b.name).join(", ")}${pending.length ? `: ${pending.join("; ")}` : ""}${otherText}`,
    };
  return { id: "thermodynamic-bound", label, result: "unresolved", detail: `hard bound recorded (${hard.map((b) => b.name).join(", ")}) but not evaluable: ${pending.join("; ")}${otherText}` };
}

/** Which steps are expected to carry a constitutive relation: drives / couples_to unless a reviewer marked them not-applicable; produces / converts_into never. */
export function relationRequirement(c: Claim): "required" | "not-applicable" | "unknown" {
  if (c.relation_requirement) return c.relation_requirement;
  return c.predicate === "drives" || c.predicate === "couples_to" ? "unknown" : "not-applicable";
}

export function checkDimensional(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "dimensional";
  const withRel = claims.filter((c) => c.relation);
  const conversion = claims.filter((c) => relationRequirement(c) !== "not-applicable");
  if (withRel.length === 0 && conversion.length === 0) return { id: "dimensional", label, result: "unknown", detail: "no step records a constitutive relation and none is expected to" };
  if (withRel.length === 0)
    return {
      id: "dimensional",
      label,
      result: "unknown",
      detail: `no constitutive relation recorded on any step (${conversion.length} conversion step${conversion.length === 1 ? "" : "s"} could carry one)`,
    };
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
  const missing = conversion.filter((c) => !c.relation);
  if (missing.length) {
    return {
      id: "dimensional",
      label,
      result: "unresolved",
      detail: `${passes.length} recorded relation${passes.length === 1 ? "" : "s"} dimensionally consistent (${passes.join("; ")}); ${missing.length} conversion step${missing.length === 1 ? "" : "s"} without a relation: ${missing.map((c) => c.id).join(", ")}`,
    };
  }
  return { id: "dimensional", label, result: "pass", detail: `every conversion step carries a relation and all balance: ${passes.join("; ")}` };
}

/**
 * Conditions inside one step must be mutually compatible (a fail). Conflicting
 * conditions on two adjacent steps mean an interface — a heat exchanger, a window,
 * a shaft — is implied but not recorded, so the result is unresolved, not fail.
 * Condition conflicts within a step and between adjacent steps, for the boundary check and the compiler.
 */
export interface BoundaryReport {
  /** Hard conflicts: two requirements of one step in the same scope on the same region, or environment requirements anywhere on the route on the same region. */
  within: string[];
  /** Medium-region transitions between adjacent steps: the same continuing region changes state; resolved only by a demonstrated interface record between the two claims. */
  adjacent: { from: string; to: string; pair: string; region: string; interface: { id: string; kind: InterfaceKind; status: InterfaceStatus } | null }[];
  /** Every interface record on the route: between two adjacent steps, or within one step. */
  recorded: { interface: string; kind: InterfaceKind; status: InterfaceStatus; location: string; relation: boolean }[];
  untagged: number;
  tagCount: number;
}

export function boundaryReport(ctx: PhysicsContext, claims: Claim[]): BoundaryReport {
  // Pass 26: only the claim's own scoped requirements count; entity-level tags are descriptive.
  const reqs = claims.map((c) => ctx.requirementsOf(c));
  const all = new Set<string>();
  for (const r of reqs) for (const q of r) all.add(q.tag);
  /** Two requirements conflict only in the same scope on the same region: a listed pair, or two members of one exclusive group. */
  const conflict = (a: ConditionRequirement, b: ConditionRequirement): string | null => {
    if (a.scope !== b.scope || a.region !== b.region || a.tag === b.tag) return null;
    for (const k of ctx.conflicts) if ((k.a === a.tag && k.b === b.tag) || (k.a === b.tag && k.b === a.tag)) return `${a.tag} vs ${b.tag}`;
    for (const g of ctx.exclusiveGroups) if (g.scope === a.scope && g.members.includes(a.tag) && g.members.includes(b.tag)) return `${a.tag} vs ${b.tag}`;
    return null;
  };
  const within: string[] = [];
  for (let i = 0; i < reqs.length; i++)
    for (let x = 0; x < reqs[i].length; x++)
      for (let y = x + 1; y < reqs[i].length; y++) {
        const m = conflict(reqs[i][x], reqs[i][y]);
        if (m) within.push(`${claims[i].id}: ${m} on region ${reqs[i][x].region}`);
      }
  // Environment requirements on the same region are compared route-wide, not only between neighbours.
  for (let i = 0; i < reqs.length; i++)
    for (let j = i + 1; j < reqs.length; j++)
      for (const a of reqs[i])
        for (const b of reqs[j]) {
          if (a.scope !== "environment" || b.scope !== "environment") continue;
          const m = conflict(a, b);
          if (m) within.push(`${claims[i].id} … ${claims[j].id}: ${m} (environment, region ${a.region})`);
        }
  // Medium transitions between adjacent steps: the same continuing region changes state; an interface record between the two claims names it.
  const adjacent: BoundaryReport["adjacent"] = [];
  const seen = new Set<string>();
  for (let i = 1; i < reqs.length; i++)
    for (const a of reqs[i - 1])
      for (const b of reqs[i]) {
        if (a.scope !== "medium" || b.scope !== "medium") continue;
        const m = conflict(a, b);
        if (!m) continue;
        const key = `${claims[i - 1].id}>${claims[i].id}:${m}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const rec = ctx.interfaces.find((f) => "between_claims" in f.location && f.location.between_claims.from_claim === claims[i - 1].id && f.location.between_claims.to_claim === claims[i].id);
        adjacent.push({ from: claims[i - 1].id, to: claims[i].id, pair: m, region: a.region, interface: rec ? { id: rec.id, kind: rec.kind, status: rec.status } : null });
      }
  const recorded: BoundaryReport["recorded"] = [];
  for (const f of ctx.interfaces) {
    if ("within_claim" in f.location) {
      if (claims.some((c) => c.id === f.location.within_claim))
        recorded.push({ interface: f.id, kind: f.kind, status: f.status, location: `within ${f.location.within_claim}`, relation: !!f.relation });
    } else {
      const { from_claim, to_claim } = f.location.between_claims;
      for (let i = 1; i < claims.length; i++)
        if (claims[i - 1].id === from_claim && claims[i].id === to_claim)
          recorded.push({ interface: f.id, kind: f.kind, status: f.status, location: `${from_claim} → ${to_claim}`, relation: !!f.relation });
    }
  }
  return { within, adjacent, recorded, untagged: reqs.filter((r) => r.length === 0).length, tagCount: all.size };
}

export function checkBoundaryCompatibility(ctx: PhysicsContext, claims: Claim[]): CheckResult {
  const label = "boundary compatibility";
  const { within, adjacent, recorded, tagCount } = boundaryReport(ctx, claims);
  if (within.length) return { id: "boundary-compatibility", label, result: "fail", detail: within.join("; ") };
  if (tagCount === 0) return { id: "boundary-compatibility", label, result: "unknown", detail: "no scoped condition requirements recorded on any step" };
  const open = adjacent.filter((a) => !a.interface || a.interface.status !== "demonstrated");
  if (open.length) {
    const items = open.map((a) =>
      a.interface
        ? `${a.interface.status} interface recorded: ${a.interface.id} (${a.interface.kind}) for ${a.from} → ${a.to}, ${a.pair}`
        : `interface unrecorded: ${a.from} → ${a.to}: ${a.pair} on region ${a.region}`,
    );
    return { id: "boundary-compatibility", label, result: "unresolved", detail: items.join("; ") };
  }
  const demonstrated = recorded.filter((r) => r.status === "demonstrated").length;
  return {
    id: "boundary-compatibility",
    label,
    result: "pass",
    detail: `${tagCount} scoped condition tags across ${claims.length} steps, no conflicts within a step or on a continuing region between neighbours; ${demonstrated} recorded interface${demonstrated === 1 ? "" : "s"}${adjacent.length ? ` (every region transition has a demonstrated record)` : ""}`,
  };
}

/**
 * Driver / regime sufficiency (loop-3 pass 30): does each conversion step get the regime it needs from
 * what precedes it? Requirements are machine-readable tokens on the step; providers are the route
 * source's regime_provides, any preceding step's regime_provides (or the regime_provides of the
 * disequilibrium it produces), and the step's own regime_external. Nothing is inferred from aliases
 * or prose. PASS = every requirement met; FAIL = the route source excludes a requirement; UNRESOLVED
 * = a requirement nothing recorded provides; UNKNOWN = no step records a requirement.
 */
export function checkDriverRegimeSufficiency(ctx: PhysicsContext, claims: Claim[], pathway?: Pathway): CheckResult {
  const id = "driver-regime-sufficiency";
  const label = "driver / regime sufficiency";
  const source = ctx.entity(claims[0]?.subject);
  // Any process step may record a requirement (a cooling conversion may require a cycle); none does by default.
  const requiring = claims.filter((c) => c.regime_requires.length > 0);
  if (requiring.length === 0) return { id, label, result: "unknown", detail: "no step records a machine-readable regime requirement" };
  const excluded = new Set(source?.regime_excludes ?? []);
  const failures: string[] = [];
  const unresolved: string[] = [];
  const met: string[] = [];
  for (const c of requiring) {
    const i = claims.indexOf(c);
    const providers = new Set<string>([...(source?.regime_provides ?? []), ...(pathway?.regime_provides ?? [])]);
    for (let k = 0; k < i; k++) {
      for (const t of claims[k].regime_provides) providers.add(t);
      const produced = ctx.entity(claims[k].object);
      if (produced?.type === "disequilibrium") for (const t of produced.regime_provides) providers.add(t);
    }
    for (const t of c.regime_external) providers.add(t);
    for (const t of c.regime_requires) {
      if (excluded.has(t) && !providers.has(t)) failures.push(`${c.id} requires ${t}, which ${source?.id ?? "the source"} cannot supply`);
      else if (!providers.has(t)) unresolved.push(`${c.id} requires ${t}; nothing before it records supplying it`);
      else met.push(`${c.id}: ${t}`);
    }
  }
  if (failures.length) return { id, label, result: "fail", detail: failures.join("; ") };
  if (unresolved.length) return { id, label, result: "unresolved", detail: unresolved.join("; ") };
  return { id, label, result: "pass", detail: `every regime requirement is supplied by the source, a preceding step, the reviewed pathway or an independent external condition: ${met.join("; ")}` };
}

export function checkPracticalMagnitude(pathway?: Pathway): CheckResult {
  // Loop-3 pass 19: a coverage statement about recorded measurements, not a physics validity check.
  const label = "measured performance coverage";
  const p = pathway?.performance;
  if (!p) return { id: "practical-magnitude", label, result: "unknown", detail: "no performance record for this composition (unknown is the honest state of an undemonstrated route)" };
  const structured = (p.measurements ?? []).filter((m) => m.value_numeric !== undefined && m.unit && m.sources.length);
  for (const m of structured) {
    if ((m.metric === "conversion-efficiency" || m.metric === "power-coefficient") && (m.value_numeric! < 0 || m.value_numeric! > 1))
      return { id: "practical-magnitude", label, result: "fail", detail: `${m.quantity} ${m.value} is outside [0, 1] for a ${m.metric}` };
  }
  const parts: string[] = [];
  if (p.efficiency_record !== undefined) parts.push(`record ${(p.efficiency_record * 100).toFixed(1)}%`);
  if (p.power_density) parts.push(`power density ${p.power_density}`);
  if (structured.length)
    return {
      id: "practical-magnitude",
      label,
      result: "pass",
      detail: `${structured.length} structured measurement${structured.length === 1 ? "" : "s"} with value, unit, regime and source${parts.length ? `; summary: ${parts.join(", ")}` : ""}`,
    };
  if (parts.length) return { id: "practical-magnitude", label, result: "unresolved", detail: `summary figures only (${parts.join(", ")}); no structured datum with value, unit, regime and source` };
  return { id: "practical-magnitude", label, result: "unresolved", detail: p.notes ?? "performance recorded without numbers" };
}

export function runAllChecks(ctx: PhysicsContext, claims: Claim[], pathway?: Pathway): CheckResult[] {
  return [
    checkTypeChain(ctx, claims),
    checkEnergyFormContinuity(ctx, claims),
    checkConservation(ctx, claims),
    checkThermodynamicBound(ctx, claims, pathway),
    checkDimensional(ctx, claims),
    checkBoundaryCompatibility(ctx, claims),
    checkDriverRegimeSufficiency(ctx, claims, pathway),
    checkPracticalMagnitude(pathway),
  ];
}
