# BoatBuilder pricing and selection workflow revision

Date: 2026-07-31

## Scope

This patch changes the estimator interface and two Smoker Craft Osprey value-era records. It does not alter hull specifications or stable boat IDs.

## Interface corrections

### Model-list pricing

The manufacturer/model list no longer displays `Price pending` when a model requires a year or hull choice. The price area is omitted until the record has a usable selected price. Models with one unambiguous priced option may still show their calculated range.

### Combined year and hull selection

The separate `Hull generation` and `Age / era` selectors are replaced by one `Year / hull` selector.

Each option is generated from one value era nested inside one physical generation. An option therefore cannot span two hull designs. Existing saved v5 selections remain readable, while new selections are stored under estimator state v6.

### Package condition

Priced boats now include one package-condition choice:

- **Excellent / turnkey:** solid floor and transom, healthy serviced motor, clean trailer, working systems, good upholstery or canvas.
- **Good / normal used condition:** structurally sound and usable, ordinary wear, routine maintenance or minor accessory work expected.
- **Fair / needs work:** usable but affected by tired upholstery, neglected maintenance, trailer work, wiring issues or other repairable deficiencies.
- **Project / poor or unknown:** bad or untested motor, questionable floor or transom, major trailer problems or uncertain structure. This returns `Manual evaluation required` rather than a numeric estimate.

For Excellent, Good and Fair, BoatBuilder divides the selected era's screening range into narrower rounded bands. The condition band is applied before optional trailer-type adjustments.

### Navigation position

Every route render now resets the document to the top. Opening a model no longer preserves the previous list's mid-page scroll position.

## Osprey value-era refinement

The first Smoker Craft Osprey value spans were divided without crossing their existing 2009–2016 hull/evidence generation:

| Model | Earlier era | Later era |
|---|---|---|
| Osprey 172 | 2009–2012: $7,000–$10,500 | 2013–2016: $10,000–$15,000 |
| Osprey 162 | 2009–2012: $6,000–$9,500 | 2013–2016: $9,000–$14,000 |

The condition selector narrows these era ranges further. For example, the default Good estimate for a 2009–2012 Osprey 172 is $8,200–$9,500 before a nonstandard trailer adjustment.

## Validation

- JavaScript syntax checks passed for `app.js`, `data/boats.js` and `tests/qa.mjs`.
- Full BoatBuilder QA passed using repository-compatible unchanged-file fixtures: 351 items, 170 boats and 181 equipment records.
- Headless Chromium interaction test passed for the Osprey 172 route, combined selector, scroll reset, condition bands and project/manual state.
- Boat record count remains 170 and the stable ID set is unchanged.
- Exactly two boat records changed: Smoker Craft Osprey 162 and Osprey 172.
