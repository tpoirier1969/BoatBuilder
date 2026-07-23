# BoatBuilder

BoatBuilder is a phone-first boat package research and estimating app for Tod and Donna.

It replaces the attempted AppSheet interface while continuing to use the existing Google Sheet as the maintained research source.

## Current workflow

1. Choose a category.
2. Choose a manufacturer.
3. Choose a model or major model variation.
4. Open the item to see its complete details.
5. Configure age, horsepower, or trailer options when applicable.
6. Check an item to add it to the current estimate.
7. Open **Estimate** to see every selected item and the package low/high totals.

The header Estimate control shows the current item count and live package range. There is intentionally no search-first home screen.

## Current categories

- Boats
- Main motors
- Kicker motors
- Bow trolling motors
- Downriggers
- Electronics and navigation
- Bimini, canvas, and covers
- Electrical systems

## Data source and production snapshot

The maintained Google Sheet **Aluminum boat model review** supplies three authorized source tabs:

- `App Boats`
- `App Equipment`
- `Boat Photos`

The deployed browser app does **not** query Google Sheets at runtime. It loads the generated local file `data/catalog.js` from the same GitHub Pages site.

The generator is `scripts/build_catalog.py`. The GitHub Action in `.github/workflows/build-catalog.yml` downloads the workbook, validates the data, creates `data/catalog.js`, and commits an updated snapshot to `main`.

Current validated snapshot counts:

- 344 total catalog items
- 163 boats
- 181 equipment records

### Stable IDs

- Boats use the static `AppSheet Key` value from `App Boats`.
- Equipment uses `Equipment ID` from `App Equipment`.
- Spreadsheet row numbers are never used as item identities.

Despite its name, `AppSheet Key` is simply a spreadsheet data column. The custom app does not depend on AppSheet.

## Updating the catalog

After changing the spreadsheet, update `data/catalog-refresh.txt` on `main`. The **Build catalog snapshot** workflow then:

1. downloads the current workbook;
2. validates nonzero item, boat, and equipment counts;
3. rebuilds `data/catalog.js`;
4. commits the updated snapshot to `main`.

The builder can also be run locally:

```bash
python -m pip install openpyxl
python scripts/build_catalog.py --output data/catalog.js
```

## Photo policy

Boat photos appear only when the `Boat Photos` tab identifies the image as an approved exact-model match.

The app deliberately hides:

- same-family substitutes
- different-length substitutes
- unverified exact-size substitutes
- earlier- or later-generation stand-ins

A missing picture is preferable to showing the wrong boat.

## Estimate storage

The current estimate is stored in the phone or browser using `localStorage`.

Saved estimate lines retain:

- stable item ID
- selected era
- selected horsepower when applicable
- selected trailer assumption or upgrade

This means the estimate survives a reload on that browser, requires no account, is not automatically shared between devices, and is erased when browser site data is cleared.

Supabase is not used in the first version. It should be added only when cross-device or multi-user storage becomes a real requirement.

## Price ranges

Equipment records use `Est Low` and `Est High` when those fields are populated. Otherwise, the app derives a broad family/era range from the decade guidance columns.

Main motors and kickers allow horsepower selection. When a verified horsepower-specific source band exists, that band controls the estimate. When no separate source band exists, the app labels the narrower horsepower result as derived from the broader family range.

Boat values assume a standard factory or generic trailer is already included. Premium trailer selections add only the upgrade range, avoiding a second standard-trailer charge.

Boat ranges are screening values, not a replacement for evaluating a particular listing's year, condition, motor, trailer, and included equipment.

If a selected item has an incomplete price range, the estimate screen identifies it and excludes the missing value from the displayed total rather than presenting it as a genuine zero-dollar value.

## Files

- `index.html` — application shell and production script order
- `styles.css` — phone-first presentation
- `app.js` — navigation, item selection, configuration, and estimating
- `data/catalog.js` — generated production catalog snapshot
- `scripts/build_catalog.py` — snapshot generator
- `scripts/qa_app.mjs` — repeatable catalog and estimate checks
- `.github/workflows/build-catalog.yml` — automated snapshot builder
- `.github/workflows/qa.yml` — JavaScript syntax and application QA
- `ProjectRules.md` — controlling project rules
- `README.md` — this documentation

## Deploy with GitHub Pages

GitHub Pages deploys the working application from branch `main`, folder `/(root)`.

The production app, working code, and completed fixes must remain on `main`. Branches are reserved for backup, recovery, and sandbox experiments unless Tod explicitly establishes another workflow.

## Local testing

Start a simple local web server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Run the repeatable QA checks with:

```bash
node --check app.js
node scripts/qa_app.mjs
```

## Current limitations

- The estimate is browser-local, not cross-device.
- Equipment does not yet have a separate photo catalog.
- Horsepower narrowing is derived and explicitly labeled when the source provides only a broad family range.
- A final visual phone check still requires a real browser after deployment.

## Project rules

`ProjectRules.md` is controlling. It includes mobile-first requirements, exact-photo rules, stable-ID rules, estimate behavior, official-name and alias rules, `main` branch discipline, catalog generation, QA, and Supabase collision protections.
