# BoatBuilder generation audit status - 2026-07-28

## Current verdict

The app architecture has been repaired. The generation research itself is still incomplete.

Accurate status:

- canonical app-data migration complete
- runtime corrections and overlays removed
- price decades no longer automatically imply a hull redesign
- first Lund generation batch preserved in canonical data
- manufacturer-by-manufacturer research audit still largely pending

Do not describe the boat catalog as fully generation-audited.

## Canonical production structure

The repository on `main` is now the source of truth.

Production data files:

- `data/boats.js` - 170 canonical boat records
- `data/equipment.js` - 181 canonical equipment records
- `data/catalog.js` - small assembler for the two data arrays

Current total: 351 catalog records.

`index.html` loads boat data, equipment data, the catalog assembler, and then `app.js`.

The former `data/lund-corrections.js` file has been deleted. The spreadsheet builder, spreadsheet refresh workflow, and one-time migration machinery have also been removed so they cannot overwrite canonical app data.

## Generation and value behavior

The app now treats two timelines separately:

- `designGenerations` controls physical specifications.
- `valueEras` controls market estimates.

Multiple value decades are not evidence of a redesign.

An unchanged hull can keep one specification set while its value changes across several age periods. A new generation is created only when evidence shows a material physical, structural, capacity, horsepower, or propulsion change.

## Lund work preserved

The first Lund batch remains in canonical boat data:

- the documented 2003 Alaskan 1800 Sport was narrowed to its actual hull basis;
- the 2024-plus Alaskan 1875 redesign was separated;
- older Tyee outboards were separated from materially heavier I/O and ITS versions;
- the current Tyee 1875 Sport was added;
- incompatible propulsion and generation records no longer inherit one another's prices.

## Remaining Lund work

Highest-risk unresolved Lund families include:

- Mr Pike 17
- Pro-V 1775
- Pro-V 1800 SE
- exact outboard generation boundaries in the older Tyee family
- intermediate Alaskan generations between the documented 2003 hull and the 2024 redesign
- Explorer Sport, Fisherman, Crossover, Impact, and other long-running families that still need year-by-year factory comparison

The existing 1997 Lund roster research remains an audit in progress, not a completed manufacturer audit.

## Remaining catalog work

No manufacturer has yet received a complete all-years factory-roster and generation audit.

Priority manufacturers for continued research are:

1. Lund
2. Alumacraft
3. Crestliner
4. Smoker Craft
5. Starcraft and Sylvan
6. MirroCraft
7. Sea Nymph
8. Princecraft

Research should focus first on models that are common in the regional used market and relevant to 16-to-19-foot aluminum fishing boats.

## Required update process

When research verifies a model or generation:

1. Update the existing canonical record directly in `data/boats.js`.
2. Add a new canonical record only when identity or capability is materially different.
3. Store generation-specific specifications and compatible value eras in that record.
4. Update the relevant research or audit file under `research/`.
5. Preserve stable IDs unless identity genuinely changes.
6. Run syntax checks and `node tests/qa.mjs`.
7. Verify the deployed phone behavior.

Do not create correction files, override files, runtime mutation layers, or spreadsheet rebuilds.

## Definition of generation-complete

A model is generation-complete only when:

- official production years are established;
- material redesign boundaries are established or explicitly documented as unresolved;
- each verified generation has its own specification set;
- price eras are assigned only within compatible generations;
- layout and propulsion variants that materially change capability are separated or explicitly represented;
- sources and confidence are recorded;
- app selection changes specifications and values correctly;
- QA prevents incompatible generations from inheriting one another's data.

A manufacturer is audit-complete only when every official roster entry in the defined scope has a documented disposition.
