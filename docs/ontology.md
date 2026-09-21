# Ontology

## Entity types

| type | what it is | in a path? |
|---|---|---|
| `disequilibrium` | a difference or gradient that can drive change; the matrix row | source |
| `phenomenon` | a physical effect that turns one thing into another | yes |
| `carrier` | what physically moves the energy between phenomena (charge carriers, ionic current, photons, magnons, a shaft) | yes |
| `output` | useful work in a form somebody wants: electricity, mechanical work, heat, cooling, light, fuel | sink |
| `coupling` | a family of mechanisms (thermoelectric, piezoelectric, osmotic…); the matrix column | no — attached to phenomena by `member_of` |
| `transducer` | a real engineered device, with a knowledge level | no — attached by `implemented_by` |
| `constraint` | a bound: Carnot, Shockley–Queisser, Betz, second law; may carry `max_efficiency` and `applies_to_sources` | no — attached by `bounded_by` |
| `material`, `interaction`, `quantity`, `system`, `state`, `transition` | conditions, mediators, measurable quantities with SI dimensions | no |

Ids are `<type>:<slug>`. The slug is kebab-case ASCII.

## Fields worth knowing

- `disequilibrium.exergy`: `positive`, `conditional` or `none`. A source with `none` fails the conservation check and makes its matrix row *forbidden* when a `bounded_by constraint:second-law` claim records why.
- `disequilibrium.energy_form`, `carrier.energy_form`, `output.energy_form`: used by the energy-form continuity check and to detect *same-form* routes (source and sink share a form — a statement about the two ends, not a round trip).
- `quantity.dimension`: exponents over M L T I Θ N J. Needed by every `relation` that names the quantity.
- `condition_tags` on entities and claims: `env-*`, `temp-*`, `state-*`, `field-*`, `medium-*`. Declared in `ontology/conditions.yaml` with the pairs that conflict.
- `transducer.knowledge_level`: K0–K8 (see `status-model.md`).

## Predicates

Process predicates (followed by the path search; should carry an `energy` ledger):

| predicate | allowed types |
|---|---|
| `drives` | disequilibrium → phenomenon · carrier → phenomenon |
| `produces` | phenomenon → carrier · phenomenon → disequilibrium |
| `couples_to` | phenomenon → phenomenon |
| `converts_into` | phenomenon → output · carrier → output |

Descriptive predicates: `member_of`, `implemented_by`, `demonstrated_with`, `bounded_by`, `requires`, `observed_in`, `predicted_in`, `governed_by`, `mediated_by`, `enhanced_by`, `inhibited_by`, `conserves`, `dissipates_to`.

## Design choices

- Coupling families are attributes of phenomena, not nodes in the path. A path never "passes through" a family; the matrix asks whether a path from a row passes through a phenomenon that belongs to a column's family.
- Mechanical front ends (elastic deformation, resonant vibration, flow-induced vibration) belong to no family. Giving them one made "pressure × piezoelectric" look established when the honest reading is a two-step candidate.
- Nuclear heat is its own family (`coupling:nuclear-thermal`) so that decay, fission and fusion heat are not filed under chemistry.
