# BoatBuilder Catalog Audit Workflow

This is the required operating procedure for manufacturer and model-year completeness audits. `ProjectRules.md` controls when rules conflict.

## Purpose

A catalog audit is reconciliation against a known official factory roster. It is not an open-ended search for models that appear to be missing.

Use **audited**, **complete**, or **fully reconciled** only after every official roster entry in the defined scope has a documented disposition.

Research limited to selected families, lengths, listings, or suspicious gaps is a **focused gap pass** or **audit in progress**.

## Repository audit records

Audit control belongs in repository files under `research/audits/`.

Recommended structure:

```text
research/audits/
  lund-1997.json
  alumacraft-1990s.json
  crestliner-2000-2009.json
  unmatched-listings.json
```

One audit roster entry represents one official manufacturer, model, year, and configuration name.

Each entry should record:

- audit ID
- manufacturer
- model year
- official model name
- propulsion or layout
- primary factory source
- secondary roster source when useful
- matching canonical app ID when present
- disposition status
- evidence and reasoning
- date checked
- next action
- audit batch or scope

Permitted dispositions are:

- `Needs Reconciliation`
- `Present`
- `Missing - Add`
- `Added`
- `Alias of Existing`
- `Renamed / Same Hull`
- `Insufficient Evidence`
- `Not Factory Model`

A scope remains incomplete while any entry is `Needs Reconciliation` or `Missing - Add`.

## Unmatched listing queue

Every listing name that cannot be matched confidently to a canonical record should be added to `research/audits/unmatched-listings.json` or another clearly identified repository queue.

An entry remains open until it is:

- matched to an existing official model
- documented as seller shorthand or an alias
- added as a missing factory model
- rejected as not being a factory model
- blocked pending specific seller evidence

Do not rely on chat history as the only record of an unresolved model name.

## Source priority

Use sources in this order:

1. Year-specific manufacturer catalog or brochure
2. Manufacturer archive, owner manual, specification sheet, factory parts record, or cover-fitment record
3. Recognized model-year roster or valuation database
4. Period dealer literature
5. Surviving listings and owner material, used only to fill clearly labeled gaps

Do not transfer specifications from a nearby length, layout, trim, propulsion type, or generation.

## Model versus configuration

Create one canonical app record for the underlying boat model and hull generation when steering or console choices use the same hull and practical identity.

List available configurations inside that record, including:

- tiller
- side console
- dual console
- walk-through windshield
- center console
- trim or seating packages

Create a separate canonical record when hull, length, generation, structure, capacity, propulsion architecture, value, or practical capability changes materially.

The audit roster may contain separate configuration-specific factory names that all resolve to the same app ID.

## Reconciliation sequence

For each manufacturer and year range:

1. Define the exact audit scope.
2. Build the complete official factory roster before deciding what is missing.
3. Enter every official roster item in the repository audit file.
4. Compare each item against `data/boats.js` by family, length, generation, structure, capacity, propulsion, and configuration.
5. Record one disposition for every roster item.
6. Add missing models or generations directly to `data/boats.js`.
7. Record aliases, configurations, and renames without creating duplicate app rows.
8. Leave unsupported specifications explicitly unknown.
9. Resolve related unmatched-listing entries.
10. Run `node --check` on application and data files.
11. Run `node tests/qa.mjs`.
12. Verify the production app contains every newly required stable ID.
13. Mark the scope complete only when no unexplained roster entries remain.

## Generation research

For every long-running family:

1. Establish official production years.
2. Compare year-specific factory tables.
3. Identify material design boundaries.
4. Create one `designGenerations` entry for each verified physical generation.
5. Assign only compatible `valueEras` to each generation.
6. Keep sources and confidence with the generation data.
7. Do not create generation boundaries from calendar decades alone.

## Post-audit market validation

Do not call this phase a substitute for the factory-roster audit.

After a roster scope is reconciled:

1. Search current used-boat listings across the relevant geographic market and major listing platforms.
2. Record distinct advertised manufacturer, model, and year descriptions.
3. Confirm each listing maps to a canonical record and documented configuration.
4. Add unmatched seller descriptions to the repository queue.
5. Resolve each as an existing model, configuration, alias, renamed hull, missing model, or incorrect seller wording.
6. Add genuine gaps directly to the canonical data.
7. Repeat the sample until it stops exposing unexplained catalog gaps.

## Inclusion rule

The catalog is broader than Tod and Donna's current purchase requirements. A legitimate model is not excluded merely because it is:

- side-console or tiller
- too small or too large
- poorly suited to Lake Superior
- above the current budget
- missing a walk-through windshield

Those limitations belong in recommendation and suitability fields.

## Completion report

Every completed audit scope must report:

- manufacturer and years covered
- number of official roster entries
- number already present
- number added
- configurations consolidated under shared model records
- aliases or renamed hulls
- unresolved or insufficient-evidence entries
- resulting production item and boat counts
- QA result

A separate market-validation report should state:

- listing platforms and geographic scope checked
- number of distinct listing descriptions sampled
- number matched directly
- number matched through aliases or configurations
- number added as genuine gaps
- number still unresolved

Do not summarize a partial pass as a full audit.
