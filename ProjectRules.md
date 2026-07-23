# ProjectRules.md — BoatBuilder

This file is the controlling project rule file for BoatBuilder.

Before any research, audit, design, coding, QA, repository change, build, package, deployment, or data migration, review and follow:

1. The current ChatGPT project settings
2. This `ProjectRules.md`

If this file conflicts with older chats, stale handoffs, temporary AppSheet assumptions, abandoned prototypes, or outdated documentation, this file controls unless Tod explicitly says otherwise.

## 1. Project purpose

Build and maintain a trustworthy, phone-first boat package research and estimating app for Tod and Donna.

The app is not a broad marketplace search tool. Its primary workflow is:

1. Choose an equipment category.
2. Choose a manufacturer.
3. Choose a specific model or major model variation.
4. Review the full detail record.
5. Check the item to add it to the current estimate.
6. Review the selected package with low and high price totals.

The app should help evaluate realistic Lake Superior-capable fishing packages without making unsuitable boats or equipment look better than they are.

## 2. Core product behavior

The main navigation must be category-first, not search-first.

Expected category examples include:

- Boats
- Main motors
- Kicker motors
- Trolling motors
- Downriggers
- Electronics and navigation
- Canvas, curtains, and covers
- Electrical equipment
- Fishing equipment
- Trailer and road gear
- Safety and deck gear
- Other equipment

Within a category, show manufacturers. Within a manufacturer, show each relevant model and each materially different variation as its own list row. Do not collapse 16-foot and 18-foot boats, different hull layouts, substantially different motor generations, or other meaningful variants into one visual record.

Each detail screen must show all available details. When a record has an image, the image belongs at the top of the detail screen.

Every selectable catalog item must have a clear checkbox or equivalent selection control. Selecting an item adds it to the current estimate. Deselecting it removes it.

The estimate must show each selected item and its low and high value. The estimate must show package low and high totals.

## 3. Mobile-first interface rules

BoatBuilder is primarily a phone app.

Requirements:

- Design for a narrow phone viewport first.
- Use one clear task per screen.
- Use large practical touch targets.
- Avoid horizontal scrolling.
- Avoid dense desktop tables in the primary interface.
- Keep navigation obvious and reversible.
- Preserve the user’s place when returning from detail screens.
- Keep the current estimate reachable from every major screen.
- Show the selected-item count near the estimate control.
- Support keyboard use and visible focus states.
- Do not use color as the only indicator of selection or status.
- Respect `prefers-reduced-motion`.
- Do not require sound.

Desktop layouts may widen and use space more efficiently, but phone behavior controls the design.

## 4. Data honesty and model-specific accuracy

Accuracy beats visual completeness.

- Use an exact manufacturer, model, variation, and length image whenever possible.
- Do not reuse a 16-foot boat image for an 18-foot version merely because the model-family name is similar.
- Do not substitute a different console, windshield, hull material, propulsion layout, or generation without clearly labeling the mismatch.
- A blank image is better than a persuasive but incorrect image.
- Each major model variation gets its own catalog record.
- Preserve warnings, limitations, and negative recommendations.
- Do not spin an unsuitable Lake Superior boat into an acceptable choice.
- Keep low and high estimates honest. Do not narrow ranges merely to make a package appear affordable.
- Keep source and match-quality information available in the data model even when it is not prominent in the interface.

## 5. Stable identifiers

Every category, manufacturer, catalog item, estimate, and estimate line must have a stable unique ID.

- IDs must not depend on spreadsheet row numbers.
- IDs must not be recalculated from mutable display labels at runtime.
- Display names may change without changing record identity.
- Do not reuse a retired ID for a different item.
- References must store stable IDs, not display text.

## 6. Canonical architecture

Keep one clear source of truth for each responsibility.

Initial architecture:

- `index.html` — application shell
- `styles.css` — canonical application styles
- `app.js` — canonical interface and state logic
- `data/catalog.json` — canonical bundled catalog data for the current static build
- `ProjectRules.md` — controlling project rules
- `README.md` — setup, deployment, and maintenance documentation

Do not create chains of patch files, override stylesheets, duplicate app entry points, or runtime repair scripts merely to avoid editing the canonical file.

New files must represent a real durable responsibility.

## 7. Storage and backend rule

Do not add Supabase merely because it is available.

The first working version may use browser `localStorage` for the current estimate and user preferences. Keep storage access behind a small adapter so another backend can replace it later.

Use Supabase only when a documented requirement needs shared, authenticated, cross-device, multi-user, or remotely editable data.

If Supabase is added:

- Inspect the existing Supabase projects and schemas first.
- Never assume BoatBuilder is the only project.
- Use a unique project-specific prefix or schema such as `boatbuilder_`.
- Do not create generic tables such as `items`, `estimates`, `users`, or `settings` in a shared namespace.
- Do not alter, drop, rename, truncate, or overwrite existing tables, functions, buckets, policies, secrets, or migrations belonging to another project.
- Document every new Supabase object and naming convention before applying it.
- Never commit service-role keys, database passwords, tokens, or private credentials.

## 8. Spreadsheet and import rules

The existing Google Sheet is research source material, not automatically the final application database.

- Import from explicit source tabs and fields.
- Do not use spreadsheet row numbers as identities.
- Do not treat formula-generated blank rows as records.
- Validate uniqueness and required fields during import.
- Preserve source URLs, recommendation text, model variation, price ranges, and image match notes.
- Never silently merge materially different records.
- Keep import/transformation logic documented and repeatable.
- Do not make the application depend on fragile AppSheet formulas or schema regeneration.

## 9. Estimate behavior

The current estimate is a package of selected catalog items.

Each estimate line must include:

- stable item ID
- category
- manufacturer
- model/variation display name
- low value
- high value
- optional quantity when the category supports it
- optional user note

Rules:

- Totals must be recomputed from selected lines.
- Removing an item must immediately remove its values from the totals.
- Duplicate selection of a single-instance item is not allowed.
- Quantity-based equipment may support quantities later, but do not invent quantity behavior for every category.
- Display low and high totals clearly and label them as estimates.
- Do not replace ranges with a single midpoint unless Tod explicitly asks.

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
- existing project data

If a better approach exists, state the concern clearly before implementing. Tod’s decision controls after the concern is explained unless the direction would violate safety, data integrity, source honesty, credential security, or project-integrity rules.

## 12. Repository and change-control rules

The `main` branch is the authoritative application unless Tod explicitly establishes another workflow.

- Do not create branches, pull requests, packages, or deployments unless requested or directly necessary for the authorized task.
- Before a substantial risky change to an established live app, create a clearly named backup branch from the current main commit.
- Do not force-update `main` without explicit approval.
- Never commit credentials, authenticated URLs, private keys, database passwords, or tokens.
- When changing files, confirm that only intended files changed.
- Do the requested work directly when the instructions and available files are sufficient.

Because this repository begins empty, the initial scaffold may be created directly on `main`.

## 13. QA requirements

Before calling a version complete:

- The app loads without console errors.
- Category → manufacturer → model → detail navigation works.
- Back navigation preserves context.
- Images do not overflow the phone viewport.
- Missing images produce a clean image-free detail screen.
- Selection controls work from list and detail views where provided.
- The estimate contains exactly the checked items.
- Low and high totals are correct.
- Estimate state survives a page reload.
- No duplicate stable IDs exist.
- No catalog record has a blank stable ID.
- No materially different model variations are silently merged.
- Touch targets and focus states are usable.
- The app works at common narrow phone widths.

## 14. Rules freshness

When Tod and the assistant make a durable workflow, architecture, data-model, proof-standard, estimate, storage, or QA decision, fold it into `ProjectRules.md` in the next authorized revision.

Do not let stale AppSheet assumptions, old handoffs, or temporary prototypes override the current project rules.
