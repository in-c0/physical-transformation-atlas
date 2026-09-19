# Status model

Two independent dimensions, plus a knowledge scale.

## Evidence status (per claim; a route inherits its weakest step)

established · replicated · demonstrated · reported · theoretically-predicted · hypothesised · disputed · contradicted · invalid

## Search status (per route, per matrix cell)

| status | meaning |
|---|---|
| `not-searched` | no record of anyone looking |
| `search-incomplete` | an automated index query has run; hits not reviewed |
| `searched-no-demonstration-found` | a reviewed search found no qualifying direct demonstration, as of the record's date |
| `candidate` | reserved for reviewed candidates (not yet used) |
| `under-review`, `experiment-proposed`, `experiment-tested` | reserved for the review queue |
| `demonstrated` | a named pathway or a reviewed search says a demonstration exists |

## Frontier class (per route, computed)

| class | rule |
|---|---|
| `demonstrated` | search status demonstrated |
| `candidate` | every constituent claim at least demonstrated, no check fails, source and sink differ in energy form |
| `weak` | a constituent is theoretical or worse |
| `forbidden` | a check fails (typed chain, energy continuity, conservation, bound, dimensional, or a within-step boundary conflict) |
| `circular` | source and sink share an energy form |

## Matrix cell status (computed)

`established`, `demonstrated`, `theoretical`, `contradicted` or `insufficient` when a direct `drives` claim links the row to a phenomenon of the column's family; otherwise `forbidden` (row has no exergy and a second-law claim), `demonstrated` (a reviewed search found one), `candidate` (a bridge with every constituent at least demonstrated), `searched-none`, `search-incomplete`, `not-searched`.

## Knowledge levels

| level | label |
|---|---|
| K0 | known physical quantity |
| K1 | known interaction |
| K2 | known transition |
| K3 | theoretically quantified |
| K4 | experimentally observed |
| K5 | energy harvested |
| K6 | working transducer |
| K7 | engineering prototype |
| K8 | commercial technology |

A named pathway sets its own level. A composed route with no demonstration takes the lowest level of its claims, capped at K4.
