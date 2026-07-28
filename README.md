# BoatBuilder

BoatBuilder is a phone-first boat package research and estimating app for Tod and Donna.

The GitHub repository is the maintained source of truth. The production app does not depend on Google Sheets, AppSheet, a live data request, or a runtime correction layer.

## Current workflow

1. Choose a category.
2. Choose a manufacturer.
3. Choose a model or materially different variation.
4. Review the complete detail record.
5. Select the applicable hull generation, value era, horsepower, or trailer options when required.
6. Add the configured item from its detail screen.
7. Open **Estimate** to review the package low and high totals.

## Canonical data files

- `data/boats.js` - boat records, generation-specific specifications, value eras, sources, images, and recommendations
- `data/equipment.js` - motors, downriggers, electronics, canvas, and electrical equipment
- `data/catalog.js` - small production assembler that combines the canonical data arrays

`index.html` loads those files in this order:

1. `data/boats.js`
2. `data/equipment.js`
3. `data/catalog.js`
4. `app.js`

Do not add `corrections.js`, overrides, runtime mutation layers, or spreadsheet-generated replacement snapshots. A researched correction belongs directly in the canonical record.

If a data file becomes awkwardly large, split it by a durable responsibility such as manufacturer or equipment category and update the assembler.

## Design generations and values

Boat records separate physical design history from market value history.

- `designGenerations` controls hull specifications.
- `valueEras` controls used-package estimates.

A design generation changes only when factory or strong supporting evidence shows a material change in hull dimensions, weight, construction, transom, horsepower, capacity, fuel system, propulsion architecture, or usable cockpit/deck structure.

A calendar decade does not automatically create a hull generation. One unchanged hull may use several value eras as the boat, motor, and trailer age.

## Research and audits

Research lives under `research/` and durable schema documentation lives under `docs/`.

A completed manufacturer audit requires a full official factory roster and a documented disposition for every entry. Selected-model research or gap hunting is an audit in progress, not a completed audit.

When research verifies a change:

1. Update `data/boats.js` or `data/equipment.js` directly.
2. Preserve the stable item ID unless the identity genuinely changes.
3. Update the relevant research file.
4. Run QA.
5. Verify the production behavior.

## Stable IDs

Every boat and equipment record has a stable unique ID. Existing IDs are retained even when names or specifications are corrected.

Never use array position or file order as identity, and never reuse a retired ID for another item.

## Estimate storage

The current estimate is stored in browser `localStorage`.

Saved selections retain the stable item ID plus applicable generation, era, horsepower, and trailer choices. The estimate survives reloads on that browser but is not automatically shared between devices.

## Price behavior

Price ranges are screening values, not automatic appraisals of a particular listing.

- Age-sensitive items require a value era.
- Generation-specific records cannot borrow values from incompatible hulls or propulsion types.
- Main motors and kickers may require horsepower selection.
- Boat values include one standard factory or generic trailer assumption.
- Premium trailer choices add only an upgrade range.
- Missing values remain visibly unset rather than becoming zero.

## Photo policy

Use an exact manufacturer, model, size, layout, and generation image whenever possible.

A missing image is preferable to a convincing but incorrect substitute.

## Main files

- `index.html` - application shell and script order
- `styles.css` - phone-first presentation
- `app.js` - navigation, configuration, selection, and estimating
- `data/boats.js` - canonical boat data
- `data/equipment.js` - canonical equipment data
- `data/catalog.js` - canonical data assembler
- `tests/qa.mjs` - repeatable integrity and behavior checks
- `.github/workflows/qa.yml` - automated syntax and QA checks
- `research/` - research findings and audit material
- `docs/catalog-schema-v3.md` - design-generation and value-era schema
- `AUDIT_WORKFLOW.md` - controlled roster-reconciliation procedure
- `ProjectRules.md` - controlling project rules

## Deploy with GitHub Pages

GitHub Pages deploys from branch `main`, folder `/(root)`.

The working app and completed production changes remain on `main`. Other branches are reserved for backups, recovery, and isolated experiments unless Tod establishes another workflow.

## Local testing

Start a local server:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Run QA:

```bash
node --check app.js
node --check data/boats.js
node --check data/equipment.js
node --check data/catalog.js
node --check tests/qa.mjs
node tests/qa.mjs
```

## Current canonical baseline

At the app-data migration checkpoint, the catalog contains:

- 170 boat records
- 181 equipment records
- 351 total records

QA treats those numbers as minimum anti-regression baselines, not permanent maximums. Research should increase or refine the catalog without requiring a spreadsheet rebuild.
