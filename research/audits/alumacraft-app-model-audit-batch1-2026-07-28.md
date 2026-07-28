# Alumacraft app-model audit batch 1 - 2026-07-28

## Scope

This batch is limited to the **17 Alumacraft records already present in BoatBuilder**. It does not add every Alumacraft model or claim that every production year has been reconciled.

Primary sources are Alumacraft's official catalog archive, the exact factory catalog/model URLs stored on each record, current Alumacraft model pages, and the 2014 Yamaha performance bulletin that reports Alumacraft-published Trophy 185 Sport specifications.

## Result

- 17 of 17 Alumacraft app records now have explicit canonical generation metadata.
- 11 broad records expose an exact catalog snapshot plus an unresolved-years option.
- 5 exact-year/current records are stored as single factory-backed generations.
- The Magnum CS row is explicitly a family-level rejection row, not a fake exact model.
- Unresolved years have no inherited specifications or package price.
- Current X-generation Competitor and Trophy boats are blocked from inheriting older same-numbered hull data.

## Dispositions

| App model | Disposition | Evidence basis | Result |
|---|---|---|---|
| Classic 165 Sport | Retained and generation-coded | 2025 Alumacraft factory model page and specification basis | Exact catalog snapshot is stored directly in canonical generation data. |
| Competitor 165 Sport | Narrowed and protected from unsupported later years | 2016 Alumacraft factory catalog; exact Sport specification snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Competitor 175 Sport / FSX | Narrowed and protected from current X-generation substitution | 2016 Alumacraft factory catalog; exact 17-foot-8-inch Competitor Sport/FSX snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Competitor 185 Sport (Secondary; 175 is Primary) | Narrowed and protected from current X-generation substitution | 2016 Alumacraft factory catalog; exact older Competitor 185 Sport snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Dominator 165 Sport | Narrowed to exact catalog snapshot | 2012 Alumacraft factory catalog; exact Dominator 165 Sport specification snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Dominator 175 Sport | Narrowed to exact catalog snapshot | 2012 Alumacraft factory catalog; exact Dominator 175 Sport specification snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Dominator 185 Sport (Secondary; 175 is Primary) | Narrowed to exact catalog snapshot | 2012 Alumacraft factory catalog; exact Dominator 185 Sport specification snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Edge Sport 175 | Retained and generation-coded | 2016 Alumacraft factory catalog; exact Edge Sport 175 specification | Exact catalog snapshot is stored directly in canonical generation data. |
| Edge Sport 185 | Retained and generation-coded | 2016 Alumacraft factory catalog; exact Edge Sport 185 specification | Exact catalog snapshot is stored directly in canonical generation data. |
| Magnum CS (side-console series; no walk-through windshield) | Converted to explicit family-level rejection row | 1995 Alumacraft factory catalog and CS layout identification | No blended family price or exact hull specification is presented. |
| Navigator Sport 165 | Retained and generation-coded | 2010 Alumacraft factory catalog; exact Navigator Sport 165 specification | Exact catalog snapshot is stored directly in canonical generation data. |
| Navigator Sport 175 | Narrowed and unresolved years separated | 2011 Alumacraft factory catalog; representative exact-year snapshot with some unpublished dimensions | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Tournament Pro 185 | Retained and generation-coded | 2016 Alumacraft factory catalog; exact Tournament Pro 185 specification | Exact catalog snapshot is stored directly in canonical generation data. |
| Trophy 170 (Secondary; 81-inch beam) | Narrowed and older years separated | 1995 Alumacraft factory catalog; exact Trophy 170 specification | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Trophy 175 Sport | Narrowed and protected from current X-generation substitution | 2014 Alumacraft factory catalog; exact 17-foot-8-inch Trophy 175 Sport snapshot | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Trophy 185 Sport (Secondary; 175 is Primary) | Corrected, narrowed, and protected from current X-generation substitution | 2014 Alumacraft factory specification and Yamaha performance bulletin; 18 feet 8 inches, 98-inch beam, 1,780 pounds, 175 HP, 34 gallons | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |
| Voyageur 175 Sport | Current snapshot separated from earlier advertised years | 2025 Alumacraft factory model page; exact current Voyageur 175 Sport specification | Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price. |

## Remaining Alumacraft work

This is a safety and exact-snapshot batch, not manufacturer completion. The next pass must compare the unresolved years model by model, especially Dominator, Navigator, Trophy, and early Competitor production, then replace unresolved options only when factory catalogs establish a defensible generation boundary.
