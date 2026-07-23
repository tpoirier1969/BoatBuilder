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
5. Check the item to add it to the current estimate.
6. Review every selected item with package low and high totals.

The app is not primarily a marketplace search tool. Do not make search the main organizing principle unless Tod later asks for it.

The app should help evaluate realistic Lake Superior-capable fishing packages without making unsuitable boats or equipment look better than they are.

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

Within a category, show manufacturers. Within a manufacturer, show each relevant model and each materially different variation as its own list row.

Do not collapse:

- 16-foot and 18-foot versions
- materially different hull layouts
- walk-through and non-walk-through versions
- different console configurations
- different motor generations
- other variations whose layout, capability, value, or appearance differs meaningfully

Each detail screen must show all useful available details. When an exact matching image exists, place it above the details.

Every selectable catalog item must have a clear checkbox or equivalent selection control. Selecting an item adds it to the current estimate. Deselecting it removes it.

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
- Show the selected-item count near the estimate control.
- Provide visible keyboard focus states.
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
- The app may display a boat photo only when the `Boat Photos` record identifies the match as exact.
- Preserve warnings, limitations, inspection cautions, and negative recommendations.
- Do not spin an unsuitable Lake Superior boat into an acceptable choice.
- Keep low and high estimates honest. Do not narrow ranges merely to make a package appear affordable.
- Keep source URLs, match quality, and curation notes available in the data model.

## 5. Stable identifiers

Every catalog item and estimate line must have a stable unique ID.

Current canonical source IDs are:

- Boats: static `App Boats[AppSheet Key]`
- Equipment: `App Equipment[Equipment ID]`

`AppSheet Key` is only the name of a spreadsheet data column in this project. BoatBuilder does not depend on AppSheet configuration or AppSheet schema behavior.

Rules:

- Never use spreadsheet row numbers as identifiers.
- Never derive identity from the current row position.
- Do not reuse a retired ID for another item.
- Display names may change without intentionally changing identity.
- References and saved selections must store stable IDs, not row numbers.
- Reject or flag duplicate and blank IDs during import or QA.

## 6. Canonical application architecture

Keep one clear source of truth for each responsibility.

Canonical files:

- `index.html` — application shell
- `styles.css` — application styles
- `app.js` — interface, navigation, live data adapter, state, and estimating logic
- `ProjectRules.md` — controlling project rules
- `README.md` — setup, deployment, data-source, and maintenance documentation

The first version is a static web application with no build system and no application server.

Do not create chains of patch files, override stylesheets, duplicate entry points, or runtime repair scripts merely to avoid fixing the canonical file.

New files must represent a real durable responsibility.

## 7. Live spreadsheet data contract

The app currently reads catalog data directly and read-only from the Google Sheet titled `Aluminum boat model review`.

Authorized live source tabs are:

- `App Boats`
- `App Equipment`
- `Boat Photos`

The app uses the Google Visualization read-only endpoint. It must not write to the spreadsheet.

The spreadsheet must remain shared so anyone with the link can read it. It does not need to be publicly discoverable.

Rules:

- Do not query unrelated workbook tabs merely because they exist.
- Do not expose internal estimate, backup, scratch, or builder tabs through the app.
- Do not use spreadsheet row numbers as identities.
- Do not treat formula-generated blank rows as records.
- Ignore rows lacking the required stable ID.
- Validate uniqueness and required fields.
- Preserve source URLs, recommendation text, model variation, price guidance, photo match quality, and curation notes.
- Never silently merge materially different records.
- Keep transformation logic documented and repeatable.
- Do not make the app depend on AppSheet formulas, schema regeneration, Ref columns, or AppSheet row keys.

If the sheet-sharing arrangement becomes unreliable or a private data source is required, replace the data adapter deliberately rather than layering a patch over it.

## 8. Estimate behavior

The current estimate is a package of selected catalog items.

Each estimate line must include:

- stable item ID
- category
- manufacturer
- model or variation display name
- low value
- high value
- optional quantity only when the category truly requires it
- optional user note when later authorized

Rules:

- Totals must be recalculated from selected lines.
- Removing an item must immediately remove its values from both totals.
- Duplicate selection of a single-instance item is not allowed.
- Do not invent quantity behavior for every category.
- Display low and high totals clearly and label them as estimates.
- Do not replace ranges with a midpoint unless Tod explicitly asks.
- Missing configured prices must be shown honestly, not silently presented as a genuine $0 value.
- The current estimate may persist in browser `localStorage` in the first version.

## 9. Storage and Supabase safety

Do not add Supabase merely because it is available.

Use Supabase only when a documented requirement needs shared, authenticated, cross-device, multi-user, or remotely editable application data.

If Supabase is added:

- Inspect all existing Supabase projects and schemas first.
- Never assume BoatBuilder is the only project.
- Use a unique project-specific prefix or schema such as `boatbuilder_`.
- Do not create generic shared-namespace objects such as `items`, `estimates`, `users`, or `settings`.
- Do not alter, drop, rename, truncate, overwrite, or reuse tables, functions, buckets, policies, secrets, or migrations belonging to another project.
- Document every new object and naming convention before applying it.
- Never commit service-role keys, database passwords, access tokens, or private credentials.

## 10. Scope and narrow-change rule

Make the narrowest safe change that completes the authorized work.

Do not quietly bundle unrelated:

- visual redesigns
- schema changes
- data reorganizations
- backend changes
- new categories
- search systems
- authentication
- analytics
- deployment changes
- cleanup work

If a useful unrelated improvement is found, report it separately and leave it unchanged unless Tod authorizes it.

## 11. Better-way challenge rule

Do not blindly implement a request without checking whether it creates problems with:

- phone usability
- data accuracy
- model-specific representation
- estimate integrity
- maintainability
- storage safety
- accessibility
- technical debt
- existing spreadsheet or Supabase data

If a better approach exists, state the concern clearly before implementing. Tod’s decision controls after the concern is explained unless the direction would violate safety, data integrity, source honesty, credential security, or project-integrity rules.

## 12. Repository and change-control rules

The `main` branch is the authoritative application unless Tod explicitly establishes another workflow.

- Questions and discussion alone do not authorize unrelated repository changes.
- When Tod explicitly asks to build, revise, fix, simplify, or redesign, do the work directly when the available files and instructions are sufficient.
- Before a substantial risky change to an established live app, create a clearly named backup branch from current `main`.
- Do not force-update `main` without explicit approval.
- Never commit credentials, authenticated URLs, private keys, database passwords, or tokens.
- Confirm that only intended files changed.
- Because the repository began empty, the initial scaffold may be created directly on `main`.

## 13. QA requirements

Before calling a version complete:

- The app loads without console errors.
- Live source tabs load successfully.
- Category → manufacturer → model → detail navigation works.
- Back navigation preserves useful context.
- Images do not overflow the phone viewport.
- Missing or non-exact images produce a clean image-free detail screen.
- Selection controls work from model lists and detail views.
- The estimate contains exactly the checked items.
- Low and high totals are mathematically correct.
- Missing prices are disclosed honestly.
- Estimate state survives a page reload.
- No duplicate stable IDs exist.
- No catalog record has a blank stable ID.
- No materially different model variations are silently merged.
- Touch targets and focus states are usable.
- The app works at common narrow phone widths.
- The sheet remains read-only from the application.

## 14. Rules freshness

When Tod and the assistant make a durable workflow, architecture, data-model, proof-standard, estimate, storage, or QA decision, fold it into `ProjectRules.md` in the next authorized revision.

Do not let stale AppSheet assumptions, old handoffs, or temporary prototypes override these current rules.
