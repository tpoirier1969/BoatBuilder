# Starcraft and Starweld app-model generation audit — 2026-07-29

## Scope

This pass audits all **14 Starcraft** and **3 Starweld** records currently present in BoatBuilder. It corrects unsafe cross-year pricing, replaces approximate values where official tables are available, and isolates current same-name boats from older generations.

## Result

- All 17 records have an explicit researched disposition.
- Every unresolved generation has no specifications and no price.
- A documented generation can no longer borrow a price range from an unrelated decade.
- The official Starcraft archive is used as the controlling roster/source location.

## High-impact Starcraft corrections

| Record | Correction |
|---|---|
| Explorer 160 DC | Split 2014 at 900 lb from the 2015 935-lb factory table. |
| Fishmaster 196 | Split the 2014 0.100-inch-bottom table from the 2015 0.125-inch-bottom table. Added the much heavier current same-name generation as an unpriced reference to block substitution. |
| Starfish 176 DC | Grouped 2014–2015 only; removed 1990s and 2000s pricing inherited by a 2014 snapshot. |
| STX 2050 Aluminum | Split the 2014 1,535-lb boat from the 2015 1,650-lb boat. |
| Superfisherman 176 | Grouped the matching 2014–2015 factory tables. |
| Superfisherman 186 | Replaced approximate values with the exact 2014–2015 18'7", 1,333-lb, 32-gallon table. Added the current 1,985-lb generation as an unpriced reference. |
| SFM 160 / SFM 180 | Retained as exact 1986 factory-catalog snapshots only. |
| Tournament 170 / 180 | Retained as 1995 catalog snapshots and kept rejected for the required windshield layout. |
| Fishmaster 170 | Retained as secondary-verified because the current record's year-specific specification source is secondary; unrelated years remain empty. |
| Fishmaster 176 DC | Retained as a 2006 factory-catalog snapshot only. |

## Starweld corrections

- Fusion 16 DC and Fusion 18 DC retain their 2021 factory-catalog snapshots, but no longer borrow 2010s values. The retired direct PDF link is replaced by the manufacturer owner-resource archive, and the confidence label is deliberately narrower than `factory-exact`.
- Current SXF/SXT boats are explicitly not treated as the same models as Fusion.
- The 1700 DC/WT remains a 2013 secondary-verified snapshot because the legacy archive confirms historical catalog availability but the exact official PDF was not machine-readable in this pass.

## Primary official sources

- Starcraft factory catalog archive: https://starcraftmarine.com/resources/legacy-catalogs/
- 1986 fishing catalog: https://starcraftmarine.com/wp-content/uploads/StarCraftFishingBoats1986_web.pdf
- 1995 catalog: https://starcraftmarine.com/wp-content/uploads/1995-Starcraft-Catalog.pdf
- 1998 catalog: https://starcraftmarine.com/wp-content/uploads/1998-Starcraft-Catalog_0.pdf
- 2014 fishing catalog: https://starcraftmarine.com/wp-content/uploads/2014-Starcraft-Fishing.pdf
- 2015 fishing catalog: https://starcraftmarine.com/sites/default/files/2015-starcraft-fishing-web.pdf
- Current Fishmaster factory page: https://starcraftmarine.com/series/fishmaster/
- Current Superfisherman factory page: https://starcraftmarine.com/series/superfisherman/
- Starweld owner resources and legacy-catalog statement: https://starcraftstarweld.com/owner-resources/

## Remaining limitations

The older scanned Starcraft catalogs are retained as year-specific factory snapshots rather than extrapolated generations. The next Starcraft pass could reconcile the 1990s Fishmaster and Superfisherman transitions year by year, but the current app records are now safe and explicitly dispositioned.
