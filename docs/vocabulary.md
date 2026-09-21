# Vocabulary

Every enumeration used by the canonical data and the `/api/*.json` exports, with one definition per value.
This file is generated from `packages/schema/src/vocabulary.ts` by `pnpm build:graph`; edit the definitions there.
The same content is served as JSON at `/api/vocabulary.json`.

## `entity.type`

Used in: `entities[].type`, `graph.entities[].type`

- `system` — a physical system or setting in which phenomena are observed (an ocean, a cell, a reactor)
- `quantity` — a physical quantity with an SI dimension; used by constitutive relations
- `disequilibrium` — a gradient or difference that can drive a process; the matrix rows and the start of every route
- `state` — a state of matter or a regime a process requires
- `interaction` — a fundamental or effective interaction a phenomenon is governed by
- `phenomenon` — a named physical effect that converts one energy form into another
- `transition` — a phase or state transition that a phenomenon exploits
- `carrier` — what moves the energy between steps: charge carriers, photons, fluid flow, mechanical motion, and so on
- `coupling` — a family of phenomena sharing one coupling mechanism; the matrix columns
- `transducer` — a device class that implements a coupling or pathway
- `material` — a material or material class a phenomenon is observed or predicted in
- `constraint` — a physical bound (Carnot, Shockley–Queisser, Betz, …) that limits phenomena, couplings or transducers
- `output` — a useful end form: electricity, mechanical work, useful heat, cooling, light, chemical fuel

## `claim.predicate`

Used in: `claims[].predicate`

- `drives` — process step: a disequilibrium or carrier drives a phenomenon
- `produces` — process step: a phenomenon produces a carrier or a new disequilibrium
- `couples_to` — process step: one phenomenon couples directly into another
- `converts_into` — process step: a phenomenon or carrier is delivered as an output
- `mediated_by` — descriptive: the phenomenon works through this carrier (not a process step)
- `member_of` — the phenomenon belongs to this coupling family
- `implemented_by` — the coupling or phenomenon is implemented by this transducer class
- `requires` — the subject needs this material, constraint, state or interaction
- `inhibited_by` — the subject is suppressed by this phenomenon or constraint
- `enhanced_by` — the subject is strengthened by this phenomenon or material
- `bounded_by` — the subject is limited by this constraint; read by the thermodynamic-bound check
- `conserves` — the phenomenon conserves this quantity
- `dissipates_to` — where the losses of the phenomenon or coupling go
- `observed_in` — the phenomenon has been observed in this material or system
- `predicted_in` — the phenomenon is predicted, not yet observed, in this material or system
- `demonstrated_with` — the phenomenon or coupling has been demonstrated with this transducer
- `governed_by` — the phenomenon is governed by this interaction

## `claim.status`

Used in: `claims[].status`, `paths[].evidence_status`

- `established` — textbook physics: two independent groups, or a review or book, among the sources
- `replicated` — several groups, recent; sources from two independent first authors
- `demonstrated` — at least one credible device or experiment
- `reported` — a single paper reports it; no independent confirmation recorded
- `theoretically-predicted` — predicted by theory, not yet observed
- `hypothesised` — proposed without a supporting calculation; may cite no source
- `disputed` — credible sources disagree
- `contradicted` — a credible source contradicts the claim
- `invalid` — the claim has been withdrawn or shown wrong

## `path.search_status`

Used in: `paths[].search_status`, `searches[].status`

- `not-searched` — no search record exists; the atlas has not looked
- `search-incomplete` — a search record exists — an automated index run, or a reviewed search that is partial, blocked or inconclusive — but no reviewed result decides the composition
- `searched-no-demonstration-found` — a reviewed search record that passed the protocol gate says no qualifying demonstration was found in indexed evidence through its date
- `candidate` — reserved; not produced by the current compiler (no review queue exists in this release)
- `under-review` — reserved; not produced by the current compiler (no review queue exists in this release)
- `experiment-proposed` — reserved; not produced by the current compiler (no review queue exists in this release)
- `experiment-tested` — reserved; not produced by the current compiler (no review queue exists in this release)
- `demonstrated` — a recorded pathway with a demonstrated status (demonstrated, prototype or commercial) has exactly this claim sequence, or a reviewed search of the whole composition found a demonstration

## `system-pathway.status`

Used in: `systems[].status`

- `demonstrated` — the multi-route system has run as one physical plant or device with every member pathway and every handoff in place
- `prototype` — demonstrated and built as an engineering prototype
- `commercial` — demonstrated and sold or operated as a product or plant
- `proposed` — a design, calculation or simulation of the system in the literature

## `system-handoff.kind`

Used in: `systems[].handoffs[].kind`

- `residual-energy` — a member's residual energy stream (exhaust, waste heat, spent flow) sources the next member
- `recovered-heat` — heat recovered from one member establishes the temperature difference the next member's route starts from
- `mechanical-coupling` — shaft or linkage work of one member drives the next
- `electrical-coupling` — electrical output of one member powers or biases the next
- `material-flow` — a material stream (fuel, working fluid, product) of one member feeds the next

## `system-handoff.status`

Used in: `systems[].handoffs[].status`

- `demonstrated` — the stream has physically joined the two members in a running system, with evidence
- `theoretical` — the stream's transfer is calculated or modelled but not shown in a running system
- `proposed` — the stream is proposed without a calculation or a demonstration

## `system-output.aggregation`

Used in: `systems[].outputs[].aggregation`

- `sum` — the member outputs add into one system output (two generators on one grid)
- `separate` — the member outputs are delivered separately (electricity and useful heat)

## `pathway.status`

Used in: `pathways[].status`

- `demonstrated` — the composition has been shown end to end in at least one physical experiment or device that delivered the route's recorded output
- `prototype` — demonstrated and built as an engineering prototype
- `commercial` — demonstrated and sold or operated as a product or plant
- `proposed` — a design, calculation or simulation in the literature; attached to its exact route and shown as a proposal, never a demonstration; ignored when other routes are classified as derived
- `observed` — one physical experiment or device has traversed every recorded conversion phenomenon and every inter-phenomenon handoff in order, but the route's terminal output criterion has not been met: a voltage, current, charge, displacement, force, flow or other terminal response may be measured, but the pathway has not delivered the work or output represented by the route's sink; observed_through names the last step its evidence established; an observed pathway does not make a route demonstrated and is ignored when classifying other routes as derived from demonstrated pathways

## `condition.scope`

Used in: `claims[].condition_requirements[].scope`, `interfaces[].condition_requirements[].scope`, `ontology.condition_tags[].default_scope`, `ontology.exclusive_groups[].scope`

- `medium` — a condition of the matter in which the phenomenon acts, on a named region of the device (active by default); the only scope in which an adjacent-step change of state is a region transition
- `boundary` — a condition of a physical surface, contact or gap the step crosses or uses; checked against interface records, never treated as an active-medium state
- `environment` — an external field, radiation, atmosphere, vacuum or other surrounding or source condition; compared route-wide on the same region, not only between neighbours

## `interface.kind`

Used in: `interfaces[].kind`, `paths[].interfaces_recorded[].kind`

- `gas-solid-acoustic-boundary` — a gas-borne acoustic field loading a solid across a mechanically continuous boundary
- `fluid-solid-mechanical-boundary` — a liquid or gas exerting pressure or shear on a solid surface, plate or membrane
- `electrode-contact` — a solid electrode collecting or injecting current at the boundary of a conducting fluid, plasma or solid
- `heat-exchanger-wall` — a wall conducting heat between two media without mass exchange
- `radiative-window` — a transparent boundary through which radiation crosses between regions
- `membrane` — a selective boundary passing some species or phases and not others
- `shaft-coupling` — a mechanical coupling transmitting torque or motion between regions or machines
- `free-surface` — an interface between a liquid and a gas or vacuum with no solid between them
- `material-contact` — two solids in contact, exchanging strain, charge or heat across the junction

## `interface.status`

Used in: `interfaces[].status`, `paths[].interfaces_recorded[].status`

- `demonstrated` — the boundary has been realised in a physical experiment or device cited in evidence; it resolves the region transition it names
- `theoretical` — the boundary is modelled (a transmission relation or an argument from physics) but not realised for this pair of steps; the boundary check stays unresolved
- `proposed` — the boundary is named in a proposal or design only; the boundary check stays unresolved

## `measurement.parameter`

Used in: `pathways[].performance.measurements[].parameters`

- `T_h_K` — hot-side (heat-source) temperature, K
- `T_c_K` — cold-side (heat-sink) temperature, K
- `T_initial_K` — temperature before a transient or a single caloric event, K
- `T_final_K` — temperature after a transient or a single caloric event, K
- `dT_dt_K_s` — rate of temperature change during a transient, K/s
- `T_transition_K` — the material's transition temperature (Curie, martensitic, glass …), K
- `temperature_gradient_K_m` — spatial temperature gradient across the active element, K/m
- `gradient_length_m` — the length over which the gradient is imposed, m
- `cycle_frequency_Hz` — the frequency of a cyclic operation (field, stress, hot–cold exposure), Hz
- `T_emitter_K` — thermionic or thermal emitter temperature, K
- `T_collector_K` — thermionic collector temperature, K
- `T_turbine_inlet_K` — turbine inlet (working-fluid) temperature — an operating state, never the Carnot hot reservoir, K
- `T_turbine_exhaust_K` — turbine exhaust temperature — an operating state, never the cold reservoir, K
- `T_cooling_water_inlet_K` — cooling-water inlet temperature at the condenser or sink — an operating state, K
- `T_condenser_K` — condensing temperature when the source derives it, K
- `T_s_K` — the radiating-source temperature a radiative bound uses (the Sun ≈ 5800 K), K
- `ZT` — thermoelectric figure of merit, dimensionless
- `V` — applied or generated voltage, V
- `d` — a characteristic length the bound's formula names, m
- `delta_G_J` — Gibbs free-energy change of the reaction, J
- `k_squared` — electromechanical coupling factor squared, dimensionless

## `path.magnitude_screen.status`

Used in: `paths[].magnitude_screen.status`

- `quantified` — a reviewed whole-composition measurement exists
- `relation-complete` — every relation-required conversion step (drives, couples_to, or relation_requirement required) carries a dimensionally valid constitutive relation; no route magnitude is thereby asserted (renamed from bounded in loop-3 pass 26)
- `missing` — at least one relation-required conversion step lacks a relation; bottleneck_claim names the first
- `incompatible` — a recorded quantitative contradiction makes the composition physically inconsistent; never inferred from absence

## `path.composition_observation`

Used in: `paths[].composition_observation`

- `observed-not-converted` — the exact route carries a pathway with status observed: the composition's conversion physics was traversed in one physical experiment and its recorded output was not delivered; the frontier class and the search status are unchanged by it (null otherwise)

## `knowledge_level`

Used in: `claims[].knowledge_level`, `pathways[].knowledge_level`, `entities[].knowledge_level`

- `K0` — known physical quantity
- `K1` — known interaction
- `K2` — known transition
- `K3` — theoretically quantified
- `K4` — experimentally observed
- `K5` — energy harvested
- `K6` — working transducer
- `K7` — engineering prototype
- `K8` — commercial technology

## `energy_form`

Used in: `claims[].energy.input`, `claims[].energy.output`, `claims[].energy.dissipation`, `entities[].energy_form`, `paths[].energy_form_sequence`

- `thermal` — heat; random molecular motion at a temperature
- `mechanical` — work, stress, strain, displacement or rotation
- `electrical` — charge at a potential; electrical work
- `magnetic` — energy stored in magnetisation or a magnetic field
- `chemical` — energy of chemical bonds or chemical potential differences
- `radiative` — electromagnetic radiation: light, infrared, radio
- `nuclear` — binding-energy differences between nuclei
- `gravitational` — potential energy in a gravitational field
- `acoustic` — sound or ultrasound: an oscillating pressure field
- `spin` — angular momentum of spins; spin currents and accumulation
- `phonon` — quantised lattice vibration as a carrier of heat or momentum
- `electronic-excitation` — excited electronic states, excitons, hot carriers before thermalisation
- `kinetic` — bulk kinetic energy of a moving mass or fluid
- `surface` — surface or interfacial energy
- `osmotic` — free energy of a concentration or salinity difference across a membrane

## `domain`

Used in: `entities[].domain`, `coverage[].domain`

- `thermodynamics` — heat, work and entropy; classical and non-equilibrium thermodynamics
- `classical-mechanics` — forces, motion, elasticity and turbomachinery
- `electromagnetism` — electric and magnetic fields and their coupling to matter
- `electrochemistry` — charge transfer at electrodes, batteries, fuel cells, electrolysis
- `condensed-matter` — solid-state transport and cross effects: thermoelectric, piezoelectric, magnetocaloric, …
- `fluid-mechanics` — flows, waves, capillarity, hydraulic and wind conversion
- `optics-photonics` — light–matter conversion: photovoltaic, photothermal, radiation pressure
- `spin-systems` — spintronic and spin-caloritronic effects
- `nuclear-physics` — decay, fission, fusion and radiation-driven conversion
- `plasma-physics` — ionised media, MHD and plasma conversion
- `quantum-transport` — mesoscopic and quantum-coherent transport effects
- `biophysical-transduction` — conversion in living systems: chemiosmosis, molecular motors
- `surface-interface` — surface-energy, wetting and interfacial effects
- `chemistry` — chemical reaction pathways and thermochemical cycles

## `disequilibrium.availability`

Used in: `entities[].availability`, `paths[].source_availability`

- `ambient-common` — present almost everywhere without preparation (temperature differences, sunlight)
- `ambient-conditional` — present in specific environments (salinity gradients, ocean waves)
- `engineered-common` — routinely produced by engineering (pressure differences, mechanical vibration)
- `stored-controlled` — must be stored or controlled (chemical fuel, radioisotopes)
- `scarce-specialised` — rare or requires specialised equipment (nuclear binding-energy differences, quantum vacuum fluctuations)

## `path.structural_kind`

Used in: `paths[].structural_kind`

- `composition` — two or more conversion phenomena with a real handoff; the only kind the frontier treats as a fresh composition
- `known-device-likely` — every conversion phenomenon on the route is implemented by one and the same recorded device, so the route most likely restates that device
- `source-preparation` — the route first manufactures an ambient driver (a temperature gradient by combustion, an osmotic pressure by osmosis …) and then runs a suffix that is itself an enumerated route from that driver; dominated_by names the suffix route, which is the composition
- `energy-backtracking` — the energy-form sequence returns to a form it already left
- `representation-dominated` — a shorter route with the same source, sink form and an ordered subset of its phenomena exists, and either adds no mechanism seam or energy transition to it, or differs from it only by carrier relays (phenomena that take a carrier in and hand a carrier out, such as a rotor in a produced flow); the field dominated_by names it
- `representation-equivalent` — the same mechanism as another route — either a recorded pathway with the same source, ordered phenomena and sink form spelled with different claims, or another composition with the same source, ordered coupling families (phenomena with no family, such as pure transport, are transparent) and sink form; dominated_by names the representative, which is the recorded pathway when one is in the group
- `atomic` — fewer than two conversion phenomena; nothing to compose

## `matrix.cell.status`

Used in: `matrix.cells[].status`

- `established` — a canonical direct relation with status established or replicated
- `demonstrated` — a direct relation with a demonstration or report indexed
- `theoretical` — a direct relation supported theoretically only
- `candidate` — no direct relation, but at least one bridge route from the row through the family has structural kind composition and frontier class candidate, derived or demonstrated
- `searched-none` — no direct relation; a reviewed search that passed the protocol gate found no qualifying direct demonstration through its date
- `search-incomplete` — no direct relation; a search record exists (an automated index run, or a reviewed search that is partial, blocked or inconclusive) but no reviewed result decides the cell
- `not-searched` — no recorded search at all
- `forbidden` — excluded by a recorded physical constraint under the stated conditions
- `contradicted` — a direct relation whose claim is disputed or contradicted
- `insufficient` — a direct relation exists but carries no evidence

## `path.frontier_class`

Used in: `paths[].frontier_class`

- `demonstrated` — search_status is demonstrated: a recorded pathway or a reviewed search covers the whole route
- `candidate` — no check fails, the source and the sink do not share an energy form, every constituent is at least demonstrated, every declared carrier handoff is provided, and neither claim-level overlap nor a phenomena-level variant of a demonstrated pathway makes it derived; a pathway with status proposed or observed does not change the class
- `derived` — otherwise candidate-quality, but the route shares with a demonstrated pathway (status demonstrated, prototype or commercial) either ordered claims that contain the whole pathway, form a strict prefix or suffix of it, span two or more of its phenomena, or share its driver step and first conversion with the next conversion phenomenon in the same coupling family at the first divergence (known_pathway_overlap), or two or more phenomena as a source-variant or sink-variant (closest_known_pathway): it extends, truncates or re-drives something known; a shared head whose first divergence changes coupling family leaves the route a candidate
- `incomplete-handoff` — otherwise candidate-quality, but a consuming step declares a carrier requirement (handoff.requires_all / requires_any) that no earlier step on the route provides; the composition is not research-ready until the interface is recorded
- `weak` — at least one constituent claim is below demonstrated (reported, theoretical, hypothesised, disputed …)
- `forbidden` — at least one physics check fails
- `circular` — the source disequilibrium and the sink carry the same energy form

## `search.engine`

Used in: `searches[].runs[].engine`, `search_runs[].runs[].engine`

- `openalex` — the OpenAlex works API (title/abstract search; boolean and phrase syntax); a discovery engine
- `semantic-scholar` — the Semantic Scholar graph API relevance search (plain keyword strings, no boolean semantics); a discovery engine
- `google-scholar` — Google Scholar, run by hand in a browser and recorded literally; a discovery engine
- `crossref` — the Crossref API; verifies DOIs and metadata, never counts as a discovery engine
- `manual` — a hand search, reference-list inspection or web search; records provenance but never counts as a discovery engine

## `search.query_form`

Used in: `searches[].runs[].query_form`, `search_runs[].runs[].query_form`

- `driver-family` — cell-search-v1: the driver's terms AND the coupling family's terms
- `driver-phenomenon` — cell-search-v1: the driver's terms AND one member phenomenon's terms (one run per member)
- `demonstration-precision` — cell-search-v1: driver AND (family OR members) AND experiment/experimental/measured/device/prototype
- `citation-chase` — reference lists and citing works of a seed paper, inspected for an experimental predecessor or successor; mandatory for negatives
- `route-driver-mechanism` — route-search-v1, key driver-mechanism:1: the driver's terms AND the first conversion phenomenon's terms
- `route-mechanism-pair` — route-search-v1, key mechanism-pair:i-(i+1): two consecutive conversion phenomena's terms (one run per consecutive pair)
- `route-whole-chain` — route-search-v1, key whole-chain: driver AND every conversion phenomenon AND the output
- `route-demonstration-precision` — route-search-v1, key demonstration-precision: the whole chain AND experiment/experimental/measured/device/prototype
- `route-composite-name` — route-search-v1, key composite-name (pass 27): the OR of the plan's frozen composition_terms — the field's own names for the composition, each supported by a recorded source — with no driver, mechanism or output term required; mandatory on every engine once any term is frozen, screened at driver-mechanism depth; supplements, never replaces, the decomposed forms

## `search.hit_decision`

Used in: `searches[].hits[].decision`

- `qualifies` — a physical experiment or device demonstrates exactly what was searched for (the direct cell relation, or the whole composition)
- `route-only` — cell searches: a real experiment whose driver reaches the family through a separately resolvable intermediate conversion — evidence for a route, never for the direct cell
- `constituent-only` — route searches: one mechanism or one adjacent pair is demonstrated, not the whole composition
- `source-variant` — route searches: the ordered mechanisms and output are demonstrated from a different causal driver (the reason names it)
- `sink-variant` — route searches: driver and ordered mechanisms match but the demonstrated output differs
- `longer-chain` — route searches: the experiment needs an additional conversion phenomenon between two steps the target records as consecutive — evidence for that longer route
- `theory-only` — a theoretical treatment; no physical experiment
- `simulation-only` — a numerical study; no physical experiment
- `proposal-only` — a proposed design or concept; not built or measured
- `review-only` — a review that cites others' work; the cited experiments are screened separately
- `wrong-driver` — the experiment's causal driver is not the searched one
- `wrong-coupling` — the measured phenomenon is not in the searched family or chain
- `driver-only-modifies` — the driver only modulates an effect that another driver causes
- `duplicate` — the same work already decided under another record
- `insufficient-information` — the accessible text does not allow a decision

## `check.result`

Used in: `paths[].checks[].result`

- `pass` — the check examined the recorded data and found no problem
- `fail` — the check found a contradiction in the recorded data
- `unresolved` — the data needed to decide is partly present
- `unknown` — none of the data needed to decide is recorded yet
