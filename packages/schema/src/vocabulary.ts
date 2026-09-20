/**
 * Every enumeration the exports use, with a one-line definition per value. This is the
 * machine-readable vocabulary behind /api/vocabulary.json and docs/vocabulary.md; both are
 * generated from it, so the documentation cannot drift from the code.
 */
import { AVAILABILITY, DOMAINS, ENERGY_FORMS, ENTITY_TYPES, EVIDENCE_STATUSES, FRONTIER_CLASSES, KNOWLEDGE_LEVELS, KNOWLEDGE_LEVEL_LABEL, MATRIX_CELL_STATUSES, PREDICATES, SEARCH_STATUSES, STRUCTURAL_KINDS } from "./index.js";

export interface VocabularyTerm {
  id: string;
  definition: string;
}
export interface VocabularyEnum {
  /** Field or concept the enumeration is used for. */
  name: string;
  /** Where it appears in the exports. */
  used_in: string[];
  terms: VocabularyTerm[];
}

const define = <T extends readonly string[]>(values: T, defs: Record<T[number], string>): VocabularyTerm[] => values.map((id) => ({ id, definition: defs[id as T[number]] }));

export const VOCABULARY: VocabularyEnum[] = [
  {
    name: "entity.type",
    used_in: ["entities[].type", "graph.entities[].type"],
    terms: define(ENTITY_TYPES, {
      system: "a physical system or setting in which phenomena are observed (an ocean, a cell, a reactor)",
      quantity: "a physical quantity with an SI dimension; used by constitutive relations",
      disequilibrium: "a gradient or difference that can drive a process; the matrix rows and the start of every route",
      state: "a state of matter or a regime a process requires",
      interaction: "a fundamental or effective interaction a phenomenon is governed by",
      phenomenon: "a named physical effect that converts one energy form into another",
      transition: "a phase or state transition that a phenomenon exploits",
      carrier: "what moves the energy between steps: charge carriers, photons, fluid flow, mechanical motion, and so on",
      coupling: "a family of phenomena sharing one coupling mechanism; the matrix columns",
      transducer: "a device class that implements a coupling or pathway",
      material: "a material or material class a phenomenon is observed or predicted in",
      constraint: "a physical bound (Carnot, Shockley–Queisser, Betz, …) that limits phenomena, couplings or transducers",
      output: "a useful end form: electricity, mechanical work, useful heat, cooling, light, chemical fuel",
    }),
  },
  {
    name: "claim.predicate",
    used_in: ["claims[].predicate"],
    terms: define(PREDICATES, {
      drives: "process step: a disequilibrium or carrier drives a phenomenon",
      produces: "process step: a phenomenon produces a carrier or a new disequilibrium",
      couples_to: "process step: one phenomenon couples directly into another",
      converts_into: "process step: a phenomenon or carrier is delivered as an output",
      mediated_by: "descriptive: the phenomenon works through this carrier (not a process step)",
      member_of: "the phenomenon belongs to this coupling family",
      implemented_by: "the coupling or phenomenon is implemented by this transducer class",
      requires: "the subject needs this material, constraint, state or interaction",
      inhibited_by: "the subject is suppressed by this phenomenon or constraint",
      enhanced_by: "the subject is strengthened by this phenomenon or material",
      bounded_by: "the subject is limited by this constraint; read by the thermodynamic-bound check",
      conserves: "the phenomenon conserves this quantity",
      dissipates_to: "where the losses of the phenomenon or coupling go",
      observed_in: "the phenomenon has been observed in this material or system",
      predicted_in: "the phenomenon is predicted, not yet observed, in this material or system",
      demonstrated_with: "the phenomenon or coupling has been demonstrated with this transducer",
      governed_by: "the phenomenon is governed by this interaction",
    }),
  },
  {
    name: "claim.status",
    used_in: ["claims[].status", "paths[].evidence_status"],
    terms: define(EVIDENCE_STATUSES, {
      established: "textbook physics: two independent groups, or a review or book, among the sources",
      replicated: "several groups, recent; sources from two independent first authors",
      demonstrated: "at least one credible device or experiment",
      reported: "a single paper reports it; no independent confirmation recorded",
      "theoretically-predicted": "predicted by theory, not yet observed",
      hypothesised: "proposed without a supporting calculation; may cite no source",
      disputed: "credible sources disagree",
      contradicted: "a credible source contradicts the claim",
      invalid: "the claim has been withdrawn or shown wrong",
    }),
  },
  {
    name: "path.search_status",
    used_in: ["paths[].search_status", "searches[].status"],
    terms: define(SEARCH_STATUSES, {
      "not-indexed": "the composition is not covered by any literature index the atlas queries",
      "not-searched": "no search record exists; the atlas has not looked",
      "search-incomplete": "only an automated index query has run; nobody has read the hits",
      "searched-no-demonstration-found": "a reviewed search record says no qualifying demonstration was found in indexed evidence through its date",
      candidate: "a reviewed search left the composition as a candidate for demonstration",
      "under-review": "the composition is in the review queue",
      "experiment-proposed": "an experiment has been proposed in the literature or the queue",
      "experiment-tested": "an experiment has been run; outcome recorded on the pathway",
      demonstrated: "a recorded pathway demonstrates the whole composition",
    }),
  },
  {
    name: "knowledge_level",
    used_in: ["claims[].knowledge_level", "pathways[].knowledge_level", "entities[].knowledge_level"],
    terms: define(KNOWLEDGE_LEVELS, KNOWLEDGE_LEVEL_LABEL),
  },
  {
    name: "energy_form",
    used_in: ["claims[].energy.input", "claims[].energy.output", "claims[].energy.dissipation", "entities[].energy_form", "paths[].energy_form_sequence"],
    terms: define(ENERGY_FORMS, {
      thermal: "heat; random molecular motion at a temperature",
      mechanical: "work, stress, strain, displacement or rotation",
      electrical: "charge at a potential; electrical work",
      magnetic: "energy stored in magnetisation or a magnetic field",
      chemical: "energy of chemical bonds or chemical potential differences",
      radiative: "electromagnetic radiation: light, infrared, radio",
      nuclear: "binding-energy differences between nuclei",
      gravitational: "potential energy in a gravitational field",
      acoustic: "sound or ultrasound: an oscillating pressure field",
      spin: "angular momentum of spins; spin currents and accumulation",
      phonon: "quantised lattice vibration as a carrier of heat or momentum",
      "electronic-excitation": "excited electronic states, excitons, hot carriers before thermalisation",
      kinetic: "bulk kinetic energy of a moving mass or fluid",
      surface: "surface or interfacial energy",
      osmotic: "free energy of a concentration or salinity difference across a membrane",
    }),
  },
  {
    name: "domain",
    used_in: ["entities[].domain", "coverage[].domain"],
    terms: define(DOMAINS, {
      thermodynamics: "heat, work and entropy; classical and non-equilibrium thermodynamics",
      "classical-mechanics": "forces, motion, elasticity and turbomachinery",
      electromagnetism: "electric and magnetic fields and their coupling to matter",
      electrochemistry: "charge transfer at electrodes, batteries, fuel cells, electrolysis",
      "condensed-matter": "solid-state transport and cross effects: thermoelectric, piezoelectric, magnetocaloric, …",
      "fluid-mechanics": "flows, waves, capillarity, hydraulic and wind conversion",
      "optics-photonics": "light–matter conversion: photovoltaic, photothermal, radiation pressure",
      "spin-systems": "spintronic and spin-caloritronic effects",
      "nuclear-physics": "decay, fission, fusion and radiation-driven conversion",
      "plasma-physics": "ionised media, MHD and plasma conversion",
      "quantum-transport": "mesoscopic and quantum-coherent transport effects",
      "biophysical-transduction": "conversion in living systems: chemiosmosis, molecular motors",
      "surface-interface": "surface-energy, wetting and interfacial effects",
      chemistry: "chemical reaction pathways and thermochemical cycles",
    }),
  },
  {
    name: "disequilibrium.availability",
    used_in: ["entities[].availability", "paths[].source_availability"],
    terms: define(AVAILABILITY, {
      "ambient-common": "present almost everywhere without preparation (temperature differences, sunlight)",
      "ambient-conditional": "present in specific environments (salinity gradients, ocean waves)",
      "engineered-common": "routinely produced by engineering (pressure differences, mechanical vibration)",
      "stored-controlled": "must be stored or controlled (chemical fuel, radioisotopes)",
      "scarce-specialised": "rare or requires specialised equipment (nuclear binding-energy differences, quantum vacuum fluctuations)",
    }),
  },
  {
    name: "path.structural_kind",
    used_in: ["paths[].structural_kind"],
    terms: define(STRUCTURAL_KINDS, {
      composition: "two or more conversion phenomena with a real handoff; the only kind the frontier treats as a fresh composition",
      "known-device-likely": "every step already appears in one recorded device pathway, so the route most likely restates that device",
      "energy-backtracking": "the energy-form sequence returns to a form it already left",
      "representation-dominated": "a shorter route with the same source, sink form and an ordered subset of its phenomena exists with no more mechanism seams or energy transitions; the field dominated_by names it",
      "representation-equivalent": "same mechanism core (source, ordered phenomena, sink form) as a recorded pathway, spelled with different claims",
      atomic: "fewer than two conversion phenomena; nothing to compose",
    }),
  },
  {
    name: "matrix.cell.status",
    used_in: ["matrix.cells[].status"],
    terms: define(MATRIX_CELL_STATUSES, {
      established: "a canonical direct relation with status established or replicated",
      demonstrated: "a direct relation with a demonstration or report indexed",
      theoretical: "a direct relation supported theoretically only",
      candidate: "no direct relation, but a composed bridge exists with every constituent established",
      "searched-none": "a reviewed search found no qualifying direct demonstration",
      "search-incomplete": "only an automated index query has run; not reviewed",
      "not-searched": "no recorded search at all",
      forbidden: "excluded by a recorded physical constraint under the stated conditions",
      contradicted: "a direct relation whose claim is disputed or contradicted",
      insufficient: "a direct relation exists but carries no evidence",
    }),
  },
  {
    name: "path.frontier_class",
    used_in: ["paths[].frontier_class"],
    terms: define(FRONTIER_CLASSES, {
      demonstrated: "search_status is demonstrated: a recorded pathway covers the whole route",
      candidate: "no check fails, every constituent is at least demonstrated, and the route shares fewer than two claims with any recorded pathway",
      derived: "as candidate, but the route shares two or more claims with a recorded pathway (see known_pathway_overlap): it extends or truncates something known",
      weak: "at least one constituent claim is below demonstrated (reported, theoretical, hypothesised, disputed …)",
      forbidden: "at least one physics check fails",
      circular: "the source disequilibrium and the sink carry the same energy form",
    }),
  },
  {
    name: "check.result",
    used_in: ["paths[].checks[].result"],
    terms: [
      { id: "pass", definition: "the check examined the recorded data and found no problem" },
      { id: "fail", definition: "the check found a contradiction in the recorded data" },
      { id: "unresolved", definition: "the data needed to decide is partly present" },
      { id: "unknown", definition: "none of the data needed to decide is recorded yet" },
    ],
  },
];
