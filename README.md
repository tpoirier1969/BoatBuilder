# BoatBuilder

BoatBuilder is a phone-first boat package research and estimating app for Tod and Donna.

It replaces the attempted AppSheet interface with a small static web app while continuing to use the existing Google Sheet as the catalog source.

## Current workflow

1. Choose a category.
2. Choose a manufacturer.
3. Choose a model or major model variation.
4. Open the item to see its complete details.
5. Check an item to add it to the current estimate.
6. Open **Estimate** to see every selected item and the package low/high totals.

There is intentionally no search-first home screen.

## Current categories

- Boats
- Main motors
- Kicker motors
- Bow trolling motors
- Downriggers
- Electronics and navigation
- Bimini, canvas, and covers
- Electrical systems

## Data source

The app reads these three tabs from the Google Sheet **Aluminum boat model review**:

- `App Boats`
- `App Equipment`
- `Boat Photos`

The app uses Google Sheets' read-only Visualization endpoint. It does not write to the spreadsheet and does not use AppSheet.

The sheet must remain shared so **anyone with the link** can read it. It does not need to be discoverable in search.

### Stable IDs

- Boats use the static `AppSheet Key` value from `App Boats`.
- Equipment uses `Equipment ID` from `App Equipment`.
- Spreadsheet row numbers are never used as item identities.

Despite its name, `AppSheet Key` is now simply a spreadsheet data column. The custom app does not depend on AppSheet.

## Photo policy

Boat photos appear only when the `Boat Photos` tab identifies the image as an exact or close-era exact-model match.

The app deliberately hides:

- same-family substitutes
- different-length substitutes
- unverified exact-size substitutes
- earlier- or later-generation stand-ins

A missing picture is preferable to showing the wrong boat.

## Estimate storage

The current estimate is stored in the phone or browser using `localStorage`.

This means:

- it survives a reload on that browser;
- it does not require an account;
- it is not automatically shared between phones, computers, or browsers;
- clearing browser site data clears the saved estimate.

Supabase is not used in the first version. It should be added only when cross-device or multi-user storage becomes a real requirement.

## Price ranges

Equipment records use `Est Low` and `Est High` when those fields are populated. Otherwise, the app derives a broad family/era range from the decade guidance columns.

Boat ranges are broad hull-guidance ranges across the eras currently listed for that model. They are screening values, not a replacement for evaluating a particular listing's year, condition, motor, trailer, and included equipment.

If a selected item has an incomplete price range, the estimate screen identifies it and excludes the missing value from the displayed total rather than presenting it as a genuine zero-dollar value.

## Files

- `index.html` — application shell
- `styles.css` — phone-first presentation
- `app.js` — live sheet loader, navigation, item selection, and estimating
- `ProjectRules.md` — controlling project rules
- `README.md` — this documentation

No build process or package installation is required.

## Deploy with GitHub Pages

In the GitHub repository:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/(root)**.
5. Save.

The published site will load the current catalog from the Google Sheet whenever the app opens.

## Local testing

Because the app loads remote spreadsheet data, test it through a web server rather than opening `index.html` directly as a local file.

One simple local command is:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Current limitations

- The estimate is browser-local, not cross-device.
- Equipment does not yet have a separate photo catalog.
- Broad motor-family rows can cover multiple horsepower and year ranges.
- The live Google Sheets connection still needs a deployed browser test after GitHub Pages is enabled.
- The spreadsheet must remain link-readable for the app to load.

## Project rules

`ProjectRules.md` is controlling. It includes the mobile-first requirements, exact-photo rules, stable-ID rules, estimate behavior, repository discipline, and Supabase collision protections for this project.
