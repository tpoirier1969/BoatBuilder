# Smoker Craft app-model generation audit — 2026-07-29

## Scope

This batch audits all **18 Smoker Craft records currently present in BoatBuilder**. It corrects false exact-year claims, separates documented physical/configuration changes, and converts seller aliases or nonexistent model combinations into no-spec/no-price rejection rows.

## Result

- 18 of 18 Smoker Craft records now have an explicit researched disposition.
- The Fazer 172, Fazer 192, Ultima 175, Phantom 170 DC, and Ultima 178 false exact-year claims were removed or narrowed.
- Millentia 182 and “Phaser” are alias-only rejection rows with no inherited specifications or pricing.
- Osprey 162 and 172 now preserve both the 2017–2018 factory boats and current factory specifications rather than claiming the walk-through layout began in the 2020s.
- Millentia, Pro Angler, Pro Mag, and Ultima records expose documented changes in length, beam, weight, horsepower, capacity certification, fuel, depth, and structure.
- All unresolved spans remain empty of specifications and prices.

## High-impact corrections

| Record | Correction |
|---|---|
| Fazer 172 | Replaced unsupported 1998 exact claim with the 1995 factory 17'5" × 80.5" × 910-lb specification |
| Fazer 192 | Replaced unsupported 1998 exact claim with the 1995 factory 18'10" × 87" × 1,375-lb specification |
| Millentia 182 WT | No verified factory model; converted to alias-only rejection |
| Osprey 162/172 WT | 2017–2018 WT factory specifications preserved; current generations separated |
| Phantom 170 DC | Narrowed to verified 1996–1997 model identity; unverified welded/spec claims removed |
| Phaser | Converted to a seller-spelling alias for Fazer, with no specs or price |
| Pro Angler 182 XL | 2018 18'5" hull separated from current 18'2" specification |
| Pro Mag 182 | 2018 18'5"/175-hp redesign separated from earlier 18'2"/150-hp boats |
| Ultima 172 | 2012 91-inch-beam hull separated from 2014-plus 96-inch-beam redesign |
| Ultima 175 | Corrected from false 2017 attribution to exact 1995 factory specification |
| Ultima 178 | Retained as 2001 model identity only; unverified specs and price withheld |
| Ultima 182 | Standard 18'5", 2016 182SE 18'2", and current 18'2" configurations separated |

## Primary official evidence

- Catalog archive: https://www.smokercraft.com/resources/legacy-catalogs/
- 2013 catalog: https://www.smokercraft.com/wp-content/uploads/2013-Smokercraft-Brochure.pdf
- 2014 catalog: https://www.smokercraft.com/wp-content/uploads/2014-Smokercraft-Brochure.pdf
- 2017 catalog: https://www.smokercraft.com/wp-content/uploads/2017-smokercraft-fishing.pdf
- 2018 catalog: https://www.smokercraft.com/wp-content/uploads/2018-smokercraft-fishing.pdf
- 2025 catalog/current lineup: https://www.smokercraft.com/wp-content/uploads/2025-Smoker-Craft-BrochureWeb.pdf
- Current Osprey 162: https://www.smokercraft.com/model/osprey-162/
- Current Osprey 172: https://www.smokercraft.com/model/osprey-172/

## Remaining limitations

Some historical factory catalogs are image-based and do not expose machine-readable specification tables. Where model identity or principal dimensions could be corroborated but a complete table was not recovered, the record is labeled secondary-verified or model-identity-only rather than promoted to factory exact. That restraint is intentional.
