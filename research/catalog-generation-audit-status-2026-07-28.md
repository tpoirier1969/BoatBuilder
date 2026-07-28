# BoatBuilder generation audit status — 2026-07-28

## Executive verdict

The generation-aware catalog work is **not complete**. The production app is currently in an interim safety state:

- it is better at refusing to apply one broad specification set across obviously uncertain production spans;
- it is worse at giving useful model-specific answers because most records have not yet received researched hull-generation data;
- the warning logic currently confuses price decades with possible hull redesigns;
- the first Lund corrections were added as a runtime catalog overlay rather than being written back into the maintained Google Sheet.

Do not describe the catalog as generation-audited. The accurate description is: **generation safeguards installed; research audit largely pending**.

## Production state

Current production files:

- `data/catalog.js` contains the generated spreadsheet snapshot.
- `data/lund-corrections.js` mutates that snapshot at runtime with the first Lund correction batch.
- `app.js` contains generation-aware selection logic.
- `index.html` loads the spreadsheet snapshot, then the Lund correction overlay, then the controller.

The base snapshot contains:

- 348 total catalog items
- 167 boat records
- 181 equipment records

The Lund overlay adds three boat records, producing an effective runtime total of 170 boats.

## Quantitative audit

Applying the current `app.js` warning test to the 167 base boat records gives:

- 114 records labeled or treated as generation-audit risks
- 81 records with more than one decade value band
- 84 records with one decade value band
- 2 records with no decade value band
- 1 model with a real selectable hull-generation definition in the controller: `MirroCraft | Dual Impact 176`

This is the core reason the app became less useful. Multiple decade value bands are not evidence of a hull redesign, but the current `risk()` function treats them as one. It also treats words such as `current`, `present`, `1990s`, `2000s`, and `representative` as automatic redesign-risk signals.

## What the phone work actually completed

Three changes were merged to `main` on 2026-07-28:

1. Separate hull generations from age-based valuation.
2. Add catalog-wide safeguards against applying unresolved generation data too broadly.
3. Complete Lund audit batch one.

The governing idea is correct:

- a material hull/design change creates a specification generation;
- calendar age changes value within a generation;
- a decade boundary alone does not create a new hull generation.

The implementation and research are incomplete.

## Lund work completed

Factory-backed work completed in batch one:

- narrowed `Lund | Alaskan 1800 Sport` to the documented 2003 hull basis;
- identified the redesigned 2024-plus Alaskan 1875 as a separate generation/record;
- separated older Tyee outboards from I/O/ITS propulsion variants;
- added a current Tyee 1875 factory-specification record;
- stopped unsupported generations from inheriting values from unlike boats.

Research files:

- `research/lund-inventory.json`
- `research/lund-source-map.md`
- `research/lund-verified-findings.json`

## Lund work still pending

Highest-risk unresolved Lund records:

- `Mr Pike 17`
- `Pro-V 1775`
- `Pro-V 1800 SE`
- exact outboard generation boundaries inside the older Tyee family
- intermediate Alaskan generations between the documented 2003 hull and the 2024 redesign

The 1997 Lund factory roster contains 59 official entries. Only five roster entries have a reconciled disposition in the audit ledger; 54 remain `Needs Reconciliation`.

No other manufacturer has a complete factory-roster, model-year generation audit.

## Source-of-truth defect

The maintained Google Sheet `Aluminum boat model review` was last modified on 2026-07-23. It still contains the pre-batch broad Alaskan and Tyee records.

The first Lund corrections therefore exist only in `data/lund-corrections.js`, after the generated catalog loads. This creates source drift:

- the Google Sheet is not the complete maintained source;
- the generated snapshot does not contain all production records;
- a runtime patch is carrying permanent research data;
- documentation counts are stale;
- a future rebuild can create confusing overlap unless the source and builder are repaired first.

This conflicts with the canonical architecture in `ProjectRules.md`, which requires one maintained spreadsheet source, one generated catalog snapshot, and no runtime repair chain used to avoid fixing the canonical data.

## Correct architecture

Generation research should be stored in the maintained spreadsheet and emitted by `scripts/build_catalog.py`.

Each model needs:

- stable base boat ID;
- generation ID;
- generation label and exact start/end years;
- generation-specific specifications;
- factory/source URLs and specification basis;
- confidence/research status;
- decade or narrower value bands that belong to that generation.

Required behavior:

1. The user chooses a model.
2. The user chooses the applicable model year or generation.
3. The displayed hull specifications change to that generation.
4. The value selector shows only age/value bands valid for that generation.
5. If the hull stayed unchanged across several decades, the specifications stay fixed while value changes by decade.
6. If a redesign occurred inside a decade, the design boundary controls instead of forcing a calendar-decade split.
7. Unknown values remain explicitly unknown, but a broad global warning must not replace researched information that is available.

## Immediate repair order

1. Stop treating multiple value decades as proof of a hull-generation problem.
2. Define generation data in the maintained spreadsheet and update the catalog builder.
3. Move the verified Lund corrections out of `data/lund-corrections.js` and into the maintained source.
4. Preserve stable IDs while migrating the old Tyee umbrella record.
5. Rebuild `data/catalog.js`, remove the runtime correction overlay, update counts, and run QA.
6. Finish Lund's high-risk 16–19 foot windshield families from factory catalogs.
7. Continue manufacturer-by-manufacturer, prioritizing the largest unresolved groups relevant to the search: Alumacraft, Crestliner, Smoker Craft, Starcraft/Sylvan, MirroCraft, Sea Nymph, and Princecraft.
8. Record every official model-year disposition in `Boat Audit Ledger`; do not declare a manufacturer complete while entries remain unresolved.

## Definition of complete

A model is generation-complete only when:

- official production years are established;
- material redesign boundaries are established or explicitly documented as unresolved;
- each generation has its own specification set;
- price eras are assigned only within compatible generations;
- layout/propulsion variants that materially change weight, capability, or value are separated;
- sources and confidence are recorded;
- app selection changes both specifications and value correctly;
- QA verifies that incompatible generations cannot inherit one another's data.

A manufacturer is audit-complete only when its factory roster has been reconciled in the ledger, not merely when the currently interesting models have been researched.
