# BoatBuilder Catalog Audit Workflow

This is the required operating procedure for completeness audits of boat manufacturers and model years. `ProjectRules.md` remains controlling when rules conflict.

## Purpose

A catalog audit is a reconciliation against a known factory roster. It is not an open-ended search for models that look missing.

The words **audited**, **complete**, or **fully reconciled** may be used only after every official roster entry in the defined scope has a documented disposition.

A search that investigates selected families, lengths, listings, or suspicious gaps must be called a **focused gap pass** or **audit in progress**.

## Control sheets

The Google workbook contains two audit-control tabs:

### Boat Audit Ledger

One row represents one official manufacturer/model/year roster entry. Required fields include:

- manufacturer;
- model year;
- official model name;
- propulsion or layout;
- primary factory source;
- secondary roster source when available;
- matching app ID, when present;
- disposition status;
- evidence and reasoning;
- date checked;
- next action;
- audit batch.

Permitted dispositions are:

- `Needs Reconciliation`
- `Present`
- `Missing – Add`
- `Added`
- `Alias of Existing`
- `Renamed / Same Hull`
- `Insufficient Evidence`
- `Not Factory Model`

A manufacturer/year scope is incomplete while any row remains `Needs Reconciliation` or `Missing – Add`.

### Unmatched Listing Queue

Every listing name that cannot be matched confidently to an app record must be added immediately. Do not rely on chat history or memory.

A queue entry remains open until it is:

- matched to an existing official model;
- documented as seller shorthand or an alias;
- added as a missing factory model;
- rejected as not being a factory model; or
- blocked pending specific seller evidence.

## Source priority

Use sources in this order:

1. year-specific manufacturer catalog or brochure;
2. manufacturer archive, owner manual, specification sheet, or factory parts/cover fitment record;
3. recognized model-year roster or valuation database;
4. period dealer literature;
5. surviving listings and owner material, used only to fill clearly labeled gaps.

Do not transfer specifications from a nearby length, layout, trim, or generation.

## Model versus configuration rule

Create one catalog record for the underlying boat model and hull generation.

List available configurations inside that record, including:

- tiller;
- side console;
- dual console;
- walk-through windshield;
- center console;
- trim or seating packages.

Do not create separate catalog records merely because the same hull was sold with different steering or console options.

Create a separate record only when the hull, length, generation, structure, capacity, propulsion architecture, value, or practical capability changes materially.

The audit ledger may still contain separate factory roster rows for configuration-specific names. Those rows should resolve to the same app ID when they are configurations of one underlying model.

## Reconciliation sequence

For each manufacturer and year range:

1. Define the exact scope in the ledger.
2. Build the complete official factory roster before deciding what is missing.
3. Enter every roster item as its own ledger row.
4. Compare each item against the app by official family, length, hull generation, structure, capacity, propulsion, and available configurations.
5. Record one disposition for every row.
6. Add missing models to `Verified Models`, `App Boats`, and `Boat Photos` with stable IDs.
7. Record aliases, configurations, and renames without creating duplicate catalog rows.
8. Leave unsupported specifications explicitly unpublished.
9. Resolve related unmatched-listing entries.
10. Rebuild `data/catalog.js`.
11. Run `tests/qa.mjs` and syntax checks.
12. Verify the production snapshot contains every newly required stable ID.
13. Mark the scope complete only when no unexplained roster rows remain.

## Post-audit market validation

Do not begin this phase until the defined factory-roster audit is complete.

After the full audit:

1. Search current online used-boat listings across the relevant geographic market and major listing platforms.
2. Record each distinct advertised manufacturer/model/year description.
3. Confirm that each listing can be matched to an app record and one of that record's documented configurations.
4. Put every unmatched or ambiguous seller description into `Unmatched Listing Queue`.
5. Resolve each queue item as an existing model, configuration, alias, renamed hull, missing model, or incorrect seller wording.
6. Add genuine gaps and rebuild the production catalog.
7. Repeat the listing sample until it no longer exposes unexplained catalog gaps.

This market-validation pass is a practical coverage test. It does not replace the factory-roster audit and must not be used to claim completeness by itself.

## Inclusion rule

The catalog is broader than Tod and Donna's current purchase requirements. A legitimate model is not excluded merely because it is:

- side-console or tiller;
- too small or too large for the current search;
- poorly suited to Lake Superior;
- above the current budget;
- missing a walk-through windshield.

Those limitations belong in recommendation and suitability fields, not at the catalog gate.

## Completion report

Every completed audit scope must report:

- manufacturer and years covered;
- number of official roster entries;
- number already present;
- number added;
- configurations consolidated under shared model records;
- aliases or renamed hulls;
- unresolved or insufficient-evidence rows;
- resulting production item and boat counts;
- QA result.

After the factory audit, the separate market-validation report must state:

- listing platforms and geographic scope checked;
- number of distinct listing descriptions sampled;
- number matched directly;
- number matched through aliases or configurations;
- number added as genuine gaps;
- number still unresolved.

Do not summarize a partial pass as a full audit.
