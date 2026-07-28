# ProjectRules.md - BoatBuilder

This is the controlling project rule file for BoatBuilder.

Before any research, audit, design, coding, QA, repository change, deployment, or data migration, review and follow:

1. The current ChatGPT project settings
2. This `ProjectRules.md`

If this file conflicts with older chats, spreadsheet workflows, AppSheet assumptions, temporary migration files, or stale documentation, this file controls unless Tod explicitly says otherwise.

## 1. Project purpose

Build and maintain a trustworthy, phone-first boat package research and estimating app for Tod and Donna.

The primary workflow is:

1. Choose a category.
2. Choose a manufacturer.
3. Choose a specific model or materially different variation.
4. Review the complete detail record.
5. Choose every required option.
6. Add the configured item to the estimate from its detail screen.
7. Review the selected package with honest low and high totals.

The app should help evaluate realistic Lake Superior fishing packages without making unsuitable boats or equipment look better than they are.

The catalog is broader than the current purchase search. A legitimate model is not excluded merely because it lacks a walk-through windshield, is too small, too large, too expensive, or poorly suited to Lake Superior. Those limitations belong in the recommendation and suitability fields.

## 2. Canonical source and file architecture

The BoatBuilder GitHub repository on `main` is the source of truth.

Canonical production files are:

- `index.html` - application shell and production script order
- `styles.css` - application styles
- `app.js` - interface, navigation, state, configuration, and estimating logic
- `data/boats.js` - canonical boat records, design generations, value eras, sources, images, and recommendations
- `data/equipment.js` - canonical motor and equipment records
- `data/catalog.js` - small assembler that combines canonical data files into `window.BOATBUILDER_DATA`
- `tests/qa.mjs` - repeatable integrity and behavior checks
- `.github/workflows/qa.yml` - automated syntax and QA checks
- `research/` - source maps, audit rosters, unresolved questions, and manufacturer research
- `docs/` - durable schema and maintenance documentation

The Google Sheet and former AppSheet work may be retained as historical references, but they are not production sources and must not overwrite repository data.

Do not create:

- runtime correction files
- override files that mutate previously loaded records
- patch chains
- generated spreadsheet snapshots that replace app-maintained data
- duplicate entry points
- hidden data embedded in `app.js`

Research corrections must be made directly in the appropriate canonical data record.

If a canonical data file becomes too large to maintain comfortably, split it by a durable responsibility such as manufacturer or equipment category and update the catalog assembler. Do not solve size by adding overlays.

## 3. Boat generations and value eras

Boat specifications and market values use separate timelines.

### Design generations

A new design generation is required when verified evidence shows a material change in one or more of these:

- overall length
- beam or bottom width
- deadrise, hull depth, freeboard, or cockpit depth
- hull weight
- construction system or plate thickness
- transom height or propulsion architecture
- horsepower, persons, or weight capacity
- fuel capacity when tied to a structural redesign
- deck or cockpit structure when practical capability changes materially

Do not create a new design generation for graphics, upholstery, electronics packages, ordinary seating options, or calendar decade boundaries alone.

Each researched generation should contain:

- stable generation ID
- human-readable label
- start and end years when known
- source and specification basis
- research status or confidence
- generation-specific specifications
- value eras that are valid for that generation

### Value eras

Value eras account for age, motor technology, trailer age, condition, and market behavior. An unchanged design may span several value eras.

A value-era boundary does not imply a hull redesign.

When the design stayed unchanged across decades, the app must keep the same specifications while changing only the applicable value range.

When a redesign happened inside a decade, the verified redesign year controls.

Unknown values remain unknown. Do not borrow values or specifications from another length, trim, propulsion type, or generation merely to fill the screen.

## 4. Navigation and catalog behavior

Main navigation is category-first.

Current categories are:

- Boats
- Main motors
- Kicker motors
- Bow trolling motors
- Downriggers
- Electronics and navigation
- Bimini, canvas, curtains, and covers
- Electrical systems

Most categories flow from category to manufacturer to model. Electronics and Electrical add an equipment-type layer before manufacturer.

Model lists are navigation-only. Add-to-estimate controls appear on detail screens only.

When an item has required configuration choices, all required choices must be selected before it can be added. Clearing a required option from an already selected item removes it from the estimate.

## 5. Official names, variants, and aliases

Use verified official manufacturer, family, size, layout, and generation names as the primary catalog identity.

Do not create a duplicate row merely because a seller abbreviated, misspelled, or incompletely named the boat.

Store seller shorthand, aliases, corporate wording, and suffix explanations as metadata or research notes.

Create a separate catalog record only when length, hull, structure, propulsion architecture, value, or practical capability differs materially.

Steering and console options may share one record when they use the same underlying hull and generation. Their configuration-specific weights, horsepower ratings, layouts, or capacities must remain visible inside that record.

## 6. Stable identifiers

Every catalog item and estimate line must have a stable unique ID.

Rules:

- Preserve existing boat and equipment IDs during ordinary corrections.
- Never derive identity from array position or file order.
- Never reuse a retired ID for another item.
- Display names may change without changing identity.
- References and saved selections store stable IDs.
- QA must reject duplicate or blank IDs.

Legacy IDs that originated in the spreadsheet remain valid identifiers. Their historical column names do not make the spreadsheet authoritative.

## 7. Data honesty

Accuracy beats visual completeness.

- Use exact manufacturer, model, length, layout, and generation information whenever possible.
- Do not substitute another size, console, windshield, material, propulsion type, or generation without explicit labeling.
- A blank image is better than a persuasive but incorrect image.
- Preserve warnings, inspection cautions, negative recommendations, and uncertainty.
- Do not spin an unsuitable Lake Superior boat into an acceptable choice.
- Keep price ranges honest and broad enough for actual used-market uncertainty.
- Keep source URLs and evidence notes with the data.
- Use factory catalogs and exact factory records first, then reliable secondary sources.

## 8. Mobile-first interface rules

BoatBuilder is primarily a phone app.

Requirements:

- Design for narrow phone screens first.
- Use one clear task per screen.
- Use large practical touch targets.
- Avoid horizontal scrolling.
- Avoid dense desktop tables in the primary interface.
- Keep navigation obvious and reversible.
- Preserve context when returning from a detail screen.
- Keep the current estimate reachable from every major screen.
- Do not use color as the only status indicator.
- Respect reduced-motion preferences.
- Do not require sound.

## 9. Estimate behavior

Each estimate line includes:

- stable item ID
- category
- manufacturer
- model or variation
- selected design generation when required
- selected value era when required
- selected horsepower when applicable
- selected trailer assumption or upgrade for boats
- low and high values

Rules:

- Recalculate totals from selected lines.
- Removing an item immediately removes its values.
- Do not duplicate a single-instance item.
- Do not replace ranges with a midpoint unless Tod asks.
- Missing prices are disclosed and never presented as genuine zero-dollar values.
- Boat values assume one standard factory or generic trailer is included.
- Premium trailer choices add only the upgrade range.
- Browser `localStorage` may retain the current estimate.

## 10. Research and audit workflow

Audit work is stored in repository files under `research/`.

A manufacturer or year-range audit begins with a complete official factory roster. Every roster entry receives a documented disposition such as:

- Present
- Added
- Alias of existing
- Renamed or same hull
- Missing - add
- Insufficient evidence
- Not a factory model

Do not call a manufacturer or scope complete while unexplained roster entries remain.

A focused search of selected families or suspicious gaps is an audit in progress, not a completed audit.

When research verifies a correction:

1. Update the canonical record in `data/boats.js` or `data/equipment.js`.
2. Update the relevant research or audit file.
3. Preserve the stable ID unless identity genuinely changes.
4. Run QA.
5. Verify the deployed app behavior.

## 11. Repository and branch rules

The working and deployed application remains on `main`.

Branches are for backups, recovery points, and isolated experiments. Completed production work must not remain only on a feature branch.

Do not force-update `main` without explicit approval.

Before committing:

- confirm the target repository and branch
- confirm only intended files changed
- never commit credentials, tokens, private keys, authenticated URLs, or database passwords

## 12. Scope and maintainability

Make the narrowest safe change that completes the authorized work.

Do not quietly bundle unrelated visual redesigns, authentication, analytics, backend systems, or new application concepts.

However, when an authorized change makes an obsolete pipeline dangerous, remove or disable that obsolete pipeline as part of the same work.

New files must represent a durable responsibility. Temporary migrations and diagnostics must be removed after successful use.

## 13. Storage and Supabase safety

Do not add Supabase merely because it is available.

Use remote storage only when a documented requirement needs shared, authenticated, cross-device, multi-user, or remotely editable data.

Never commit service-role keys, passwords, access tokens, or private credentials.

## 14. QA requirements

Before calling a version complete:

- The app loads without console errors.
- Canonical boat and equipment files load before `data/catalog.js`.
- The catalog contains nonzero and nonshrinking item counts.
- No duplicate or blank stable IDs exist.
- No runtime correction or overlay file is loaded.
- `app.js` does not contain model-specific data tables.
- Design-generation selection changes displayed specifications.
- Value-era selection changes values without falsely implying a redesign.
- Incompatible generations do not inherit one another's specifications or prices.
- Navigation works at narrow phone widths.
- Lists contain no add-to-estimate checkbox.
- Required choices gate selection correctly.
- Estimate totals and persistence work correctly.
- Images do not overflow and unverified substitutes are not shown.
- Known critical model splits remain present.
- `node --check` passes for application and data files.
- `node tests/qa.mjs` passes.

Never summarize a partial research pass as a completed audit.
