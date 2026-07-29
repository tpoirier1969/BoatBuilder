# BoatBuilder all-manufacturer generation audit status — 2026-07-29

## Scope completed in this batch

- Canonical boat records checked: **170**.
- Existing researched generation records preserved: **46**.
- New exact cited snapshots created: **100**.
- New unresolved no-spec/no-price spans created: **124**.
- Every boat record now has canonical design-generation metadata.
- Unresolved generations contain neither inherited hull specifications nor inherited price ranges.
- Unsafe top-level value eras were removed from all boat records and moved into a single compatible generation only where that relationship was unambiguous.

This batch is a catalog-wide safety correction, not a claim that every historical redesign boundary has been researched. It prevents the app from presenting one cited model-year specification as fact for every year in a broad record while detailed factory-catalog reconciliation continues.

## Manufacturer coverage

| Manufacturer | App records | Newly safeguarded in this batch |
|---|---:|---:|
| Alumacraft | 17 | 0 |
| Crestliner | 15 | 15 |
| Fish-Rite | 1 | 1 |
| Fisher | 3 | 3 |
| G3 | 3 | 3 |
| Hewescraft | 1 | 1 |
| Legend | 3 | 3 |
| Lowe | 6 | 6 |
| Lund | 28 | 0 |
| MirroCraft | 7 | 6 |
| MonArk | 2 | 2 |
| North River | 1 | 1 |
| Northwood | 1 | 1 |
| Polar Kraft | 4 | 4 |
| Princecraft | 9 | 9 |
| Sea Nymph | 5 | 5 |
| Smoker Craft | 18 | 18 |
| Spectrum / Blue Fin | 1 | 1 |
| Starcraft | 14 | 14 |
| Starweld | 3 | 3 |
| Sylvan | 16 | 16 |
| Tracker | 8 | 8 |
| Triton | 2 | 2 |
| Ultracraft (Misty Harbor) | 2 | 2 |

## What this means in the app

Every manufacturer and every model is now generation-safe. A listing year that has not been reconciled against factory evidence receives no borrowed hull specifications and no borrowed price estimate. The cited model-year snapshot remains available when the listing actually matches it.

## Detailed research still required

This safety pass does not establish every historical redesign boundary. Detailed catalog reconciliation remains in progress, beginning with Alumacraft Dominator and Navigator, followed by Crestliner, Smoker Craft, Starcraft, Sylvan, MirroCraft, Sea Nymph, Princecraft, and the remaining regional manufacturers.

Each detailed pass replaces unresolved spans with verified generation boundaries and compatible market eras. Stable record IDs remain unchanged unless the record itself proves to be a mixed model identity.
