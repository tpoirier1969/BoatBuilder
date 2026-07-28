# BoatBuilder generation audit status - 2026-07-28

## Current verdict

The canonical app architecture is complete, and the focused Lund audit requested for the models already in BoatBuilder is complete.

Accurate status:

- canonical app-data migration complete;
- runtime corrections and overlays removed;
- price decades no longer automatically imply a hull redesign;
- all 28 Lund records currently in BoatBuilder have an explicit audit disposition and canonical generation metadata;
- 8 Lund records expose more than one documented physical specification set;
- broad or blended Lund records were narrowed when the evidence did not support one specification across the advertised span;
- the remaining manufacturer-by-manufacturer app-model audit is still incomplete.

Do not describe the entire boat catalog as generation-audited. Do not describe this work as a complete catalog of every Lund model ever built.

## Canonical production structure

The repository on `main` is the source of truth.

Production data files:

- `data/boats.js` - 170 canonical boat records;
- `data/equipment.js` - 181 canonical equipment records;
- `data/catalog.js` - small assembler for the two data arrays.

Current total: 351 catalog records.

`index.html` loads boat data, equipment data, the catalog assembler, and then `app.js`.

The former Lund correction layer, spreadsheet builder, spreadsheet refresh workflow, and one-time migration machinery have been removed so they cannot overwrite canonical app data.

## Generation and value behavior

The app treats two timelines separately:

- `designGenerations` controls physical specifications;
- `valueEras` controls market estimates.

Multiple value decades are not evidence of a redesign. An unchanged hull can keep one specification set while its value changes across several age periods. A new generation is created only when evidence shows a material physical, structural, capacity, horsepower, layout, or propulsion change.

## Lund app-model audit completed

Scope: the 28 Lund records already present in BoatBuilder. No off-scope Lund families were added merely because a year-by-year catalog corpus was available.

Completion results:

- 28 of 28 app records have a documented disposition;
- every Lund app record has at least one canonical `designGenerations` entry;
- 8 records contain multiple documented physical specification sets;
- exact transition years remain visibly unresolved where the evidence did not establish them;
- historical Impact records are protected from current Impact XS substitution;
- older Tyee outboards remain separate from I/O and ITS packages;
- current and historical Alaskan, Adventure, Crossover, Rebel XL, Pro-V, Impact, Explorer, Fisherman, Mr Pike, Angler, and Tyee records were corrected, split, or narrowed as supported by the evidence;
- the focused audit passed syntax checks and `node tests/qa.mjs` with 351 catalog items, 170 boats, and 181 equipment records.

The detailed disposition ledger is `research/audits/lund-app-model-audit-2026-07-28.md`.

This completes the Lund app-model scope. It is not a full all-model Lund manufacturer roster audit.

## Remaining catalog work

The next manufacturer app-model audits are:

1. Alumacraft
2. Crestliner
3. Smoker Craft
4. Starcraft and Sylvan
5. MirroCraft
6. Sea Nymph
7. Princecraft

Research should stay focused on the records already in BoatBuilder unless Tod explicitly expands the scope.

## Required update process

When research verifies a model or generation:

1. Update the existing canonical record directly in `data/boats.js`.
2. Add a new canonical record only when identity or capability is materially different and the scope authorizes it.
3. Store generation-specific specifications and compatible value eras in that record.
4. Update the relevant research or audit file under `research/`.
5. Preserve stable IDs unless identity genuinely changes.
6. Run syntax checks and `node tests/qa.mjs`.
7. Verify the deployed phone behavior.

Do not create correction files, override files, runtime mutation layers, or spreadsheet rebuilds.

## Definition of focused app-model completion

A manufacturer app-model scope is complete only when:

- every existing app record has a documented disposition;
- material redesign boundaries are established or explicitly documented as unresolved;
- each verified generation has its own specification set;
- price eras are assigned only within compatible generations;
- layout and propulsion variants that materially change capability are separated or explicitly represented;
- sources and confidence are recorded;
- app selection changes specifications and values correctly;
- QA prevents incompatible generations from inheriting one another's data.
