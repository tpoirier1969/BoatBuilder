# ProjectRules.md — BoatBuilder

This file is the controlling project rule file for BoatBuilder.

Before any research, audit, design, coding, QA, repository change, deployment, or data migration, review and follow:

1. The current ChatGPT project settings
2. This `ProjectRules.md`

If this file conflicts with older chats, stale handoffs, abandoned AppSheet assumptions, temporary prototypes, or outdated documentation, this file controls unless Tod explicitly says otherwise.

## 1. Project purpose

Build and maintain a trustworthy, phone-first boat package research and estimating app for Tod and Donna.

The primary workflow is:

1. Choose a category.
2. Choose a manufacturer.
3. Choose a specific model or major model variation.
4. Review the complete detail record.
5. Choose every required option and add the item to the current estimate from its detail screen.
6. Review every selected item with package low and high totals.

The app is not primarily a marketplace search tool. Do not make search the main organizing principle unless Tod asks for it.

The app should help evaluate realistic Lake Superior-capable fishing packages without making unsuitable boats or equipment look better than they are.

### Catalog breadth

Catalog breadth is broader than the current purchase search. Include relevant fishing, multispecies, fish-and-ski, side-console, tiller, windshield, and other materially distinct boat models even when they do not meet Tod and Donna's current preferred features. Recommendation, layout, and suitability fields explain fit; they are not inclusion gates. Do not omit a real model merely because it lacks a walk-through windshield, is too small, is too expensive, or is otherwise a poor current purchase candidate.

## 2. Core navigation and catalog behavior

Main navigation must be category-first.

Current categories are:

- Boats
- Main motors
- Kicker motors
- Bow trolling motors
- Downriggers
- Electronics and navigation
- Bimini, canvas, curtains, and covers
- Electrical systems

Most categories flow from category to manufacturer. Electronics & Navigation and Electrical Systems add one type layer before manufacturer:

- Electronics & Navigation → equipment type → manufacturer → model
- Electrical Systems → equipment type → manufacturer → component

Within a manufacturer, show each relevant model and each materially different variation as its own list row.

Do not collapse:

- 16-foot and 18-foot versions
- materially different hull layouts
- walk-through and non-walk-through versions
- different console configurations
- different motor generations
- other variations whose layout, capability, value, or appearance differs meaningfully

Each detail screen must show all useful available details. When an exact matching image exists, place it above the details.

Model and component lists are navigation-only. They must not contain add-to-estimate checkboxes. The Add to estimate checkbox appears on the detail screen only. When an item has configurable options, all required options must be selected before the checkbox is enabled. Clearing a required option from an already selected item removes it from the estimate rather than preserving a broad or ambiguous value.

### Official names, aliases, and seller shorthand

- Use the verified official manufacturer, family, size, and layout name as the primary catalog name.
- Do not create a second catalog row merely because a seller abbreviated, misspelled, or incompletely named the same boat.
- Put common seller shorthand, aliases, corporate/manufacturer wording, and verified suffix explanations in a manufacturer naming note or alias metadata.
- Manufacturer suffixes are brand-specific and may also be era-specific. Never assume one maker's abbreviation applies to another maker.
- A separate catalog row is appropriate only when the underlying length, hull, console, windshield, generation, value, or capability is materially different and relevant to the project.
- When a listing name is ambiguous, identify the likely official model but clearly state what evidence is still needed from the HIN, capacity plate, registration, decals, or year-specific brochure.

## 3. Mobile-first interface rules

BoatBuilder is primarily a phone app.

Requirements:

- Design for narrow phone screens first.
- Use one clear task per screen.
- Use large practical touch targets.
- Avoid horizontal scrolling.
- Avoid dense desktop tables in the primary interface.
- Keep navigation obvious and reversible.
- Preserve the user’s context when returning from a detail screen.
- Keep the current estimate reachable from every major screen.
- Show the selected-item count and current package range in the centered Estimate control.
- Place the fully labeled Clear estimate control at the right side of the header, disable it when empty, and protect it with confirmation when populated.
- Provide visible keyboard focus states on actual controls without programmatically focusing the main content container.
- Do not use color as the only indicator of selection or status.
- Respect `prefers-reduced-motion`.
- Do not require sound.

Desktop layouts may use available width more efficiently, but phone behavior controls the design.

## 4. Data honesty and model-specific accuracy

Accuracy beats visual completeness.

- Use an exact manufacturer, model, variation, length, layout, and generation image whenever possible.
- Do not use a 16-foot boat image for an 18-foot version merely because the family name is similar.
- Do not substitute another console, windshield, hull material, propulsion layout, or generation without explicit labeling.
- A blank image is better than a persuasive but incorrect image.
- The app may display a boat photo only when the `Boat Photos` record identifies the match as exact under the approved photo policy.
- Preserve warnings, limitations, inspection cautions, and negative recommendations.
- Do not spin an unsuitable Lake Superior boat into an acceptable choice.
- Keep low and high estimates honest. Do not narrow ranges merely to make a package appear affordable.
- Keep source URLs, match quality, and curation notes available in the data model.

## 5. Stable identifiers

Every catalog item and estimate line must have a stable unique ID.

Current canonical source IDs are:

- Boats: static `App Boats[AppSheet Key]`
- Equipment: `App Equipment[Equipment ID]`

`AppSheet Key` is only the name of a spreadsheet data column. BoatBuilder does not depend on AppSheet configuration or schema behavior.

Rules:

- Never use spreadsheet row numbers as identifiers.
- Never derive identity from the current row position.
- Do not reuse a retired ID for another item.
- Display names may change without intentionally changing identity.
- References and saved selections must store stable IDs, not row numbers.
- Reject or flag duplicate and blank IDs during import or QA.

## 6. Canonical application architecture

Keep one clear source of truth for each responsibility.

Canonical files and responsibilities:

- `index.html` — application shell and production script order
- `styles.css` — application styles
- `app.js` — interface, navigation, state, selection, and estimating logic
- `data/catalog.js` — generated production catalog snapshot
- `scripts/build_catalog.py` — repeatable spreadsheet-to-catalog generator
- `.github/workflows/build-catalog.yml` — automated snapshot generation on `main`
- `ProjectRules.md` — controlling project rules
- `README.md` — setup, deployment, data-source, and maintenance documentation

The application is a static web app with no application server. Do not create chains of patch files, override stylesheets, duplicate entry points, or runtime repair scripts merely to avoid fixing the canonical file.

New files must represent a real durable responsibility.

## 7. Spreadsheet and production catalog contract

The Google Sheet titled `Aluminum boat model review` is the maintained research and editing source.

Authorized source tabs are:

- `App Boats`
- `App Equipment`
- `Boat Photos`

The production app must load the generated local snapshot at `data/catalog.js`. It must not depend on a live Google Visualization or Google Sheets request in the user’s browser.

The snapshot builder may read the workbook and must:

- query only the authorized source tabs;
- ignore formula-generated blank rows;
- ignore rows lacking the required stable ID;
- validate uniqueness and required fields;
- preserve source URLs, recommendation text, model variation, price guidance, photo match quality, and curation notes;
- never silently merge materially different records;
- fail rather than publish an empty catalog;
- write the generated snapshot to `main`.

The browser app remains read-only. It must not write to the spreadsheet.

After spreadsheet changes, regenerate and validate `data/catalog.js` before treating the production catalog as current.

## 8. Estimate behavior

The current estimate is a package of selected catalog items.

Each estimate line must include:

- stable item ID
- category
- manufacturer
- model or variation display name
- low value
- high value
- selected era when the item is age-sensitive
- selected horsepower for gasoline main motors and kickers when the family includes more than one horsepower
- selected trailer assumption or upgrade for boats
- optional quantity only when the category truly requires it
- optional user note only when later authorized

Rules:

- Totals must be recalculated from selected lines.
- Removing an item must immediately remove its values from both totals.
- Duplicate selection of a single-instance item is not allowed.
- Do not invent quantity behavior for every category.
- Display low and high totals clearly and label them as estimates.
- Do not replace ranges with a midpoint unless Tod explicitly asks.
- Missing configured prices must be shown honestly, not presented as a genuine zero-dollar value.
- The current estimate may persist in browser `localStorage` in the first version.
- Items may be added only from their detail screen after all displayed required options are selected.
- Age-sensitive items require a specific era before selection; an all-era range is informational only.
- Main-motor and kicker estimates must allow horsepower selection. Use a verified source price band when one exists.
- When no horsepower-specific source band exists, any derived narrowing must be labeled as derived from the broader family range rather than represented as direct market data.
- A main-motor estimate is not considered adequately narrowed until both era and horsepower are selected when those controls are available.
- Boat values assume a standard factory or generic trailer is included. Do not add a second standard trailer line or double-count it.
- Premium trailer construction or features may add an explicit upgrade range above the standard included trailer assumption.

## 9. Storage and Supabase safety

Do not add Supabase merely because it is available.

Use Supabase only when a documented requirement needs shared, authenticated, cross-device, multi-user, or remotely editable application data.

If Supabase is added:

- Inspect all existing Supabase projects and schemas first.
- Never assume BoatBuilder is the only project.
- Use a unique project-specific prefix or schema such as `boatbuilder_`.
- Do not create generic shared-namespace objects such as `items`, `estimates`, `users`, or `settings`.
- Do not alter, drop, rename, truncate, overwrite, or reuse objects belonging to another project.
- Document every new object and naming convention before applying it.
- Never commit service-role keys, database passwords, access tokens, or private credentials.

## 10. Scope and narrow-change rule

Make the narrowest safe change that completes the authorized work.

Do not quietly bundle unrelated visual redesigns, schema changes, data reorganizations, backend changes, new categories, search systems, authentication, analytics, deployment changes, or cleanup work.

If a useful unrelated improvement is found, report it separately and leave it unchanged unless Tod authorizes it.

## 11. Better-way challenge rule

Do not blindly implement a request without checking whether it creates problems with phone usability, data accuracy, model-specific representation, estimate integrity, maintainability, storage safety, accessibility, technical debt, or existing project data.

If a better approach exists, state the concern clearly before implementing. Tod’s decision controls after the concern is explained unless the direction would violate safety, data integrity, source honesty, credential security, or project-integrity rules.

## 12. Repository and branch rules

**The working and deployed application must always be on `main`.**

Branches are only for:

- backups before risky work;
- recovery points;
- isolated sandbox experiments.

Unless Tod explicitly establishes a different workflow:

- do not use a feature branch as the working application;
- do not leave completed, approved, or production-ready changes only on a branch;
- apply working changes directly to `main`;
- treat `main` as the authoritative current app;
- use a clearly named backup branch before a substantial risky change to an established live app;
- never force-update `main` without explicit approval;
- confirm that only intended files changed;
- never commit credentials, authenticated URLs, private keys, database passwords, or tokens.

Questions and discussion alone do not authorize unrelated repository changes. When Tod explicitly asks to build, revise, fix, simplify, or redesign, do the work directly on `main` when the available files and instructions are sufficient.

## 13. QA requirements

Before calling a version complete:

- The app loads without console errors.
- `data/catalog.js` exists and contains a nonzero catalog.
- The generated item, boat, and equipment counts are validated.
- No duplicate or blank stable IDs exist.
- Standard categories follow category → manufacturer → model → detail navigation.
- Electronics and Electrical follow category → type → manufacturer → model/component → detail navigation.
- Princecraft Sport 167 / Sport 164 appears as one combined official-generation listing with both names visible.
- Back navigation preserves useful context.
- Images do not overflow the phone viewport.
- Missing or non-exact images produce a clean image-free detail screen.
- Model and component lists contain no add-to-estimate checkbox.
- Detail-screen selection remains disabled until every required option is complete.
- Clearing a required option removes an already selected item from the estimate.
- The estimate contains exactly the configured items selected from detail screens.
- Low and high totals are mathematically correct.
- Motor era and horsepower selections persist and affect the correct estimate line.
- Known horsepower-band tests pass, including 2010s Evinrude E-TEC 75–90 hp at $4,000–$6,500 and 115–150 hp at $5,500–$8,500.
- Boat estimates include the standard trailer assumption exactly once and premium trailer adjustments add only the upgrade range.
- Missing prices are disclosed honestly.
- Estimate state survives a page reload.
- The centered Estimate control shows the selected count and current package range.
- The right-side Clear estimate control uses its full label, disables when empty, and confirms before clearing populated estimates.
- No materially different model variations are silently merged.
- Seller aliases do not create duplicate catalog rows without a material model difference.
- Touch targets and focus states are usable.
- The app works at common narrow phone widths.
- The app does not depend on a live Google request from the browser.
- The spreadsheet remains read-only from the application.

## 14. Rules freshness

When Tod and the assistant make a durable workflow, architecture, data-model, proof-standard, estimate, storage, branch, deployment, or QA decision, fold it into `ProjectRules.md` in the next authorized revision.

Do not let stale AppSheet assumptions, old handoffs, or temporary prototypes override these current rules.
