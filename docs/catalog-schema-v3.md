# BoatBuilder catalog schema v3

BoatBuilder keeps physical boat history and used-market value history on separate timelines.

The canonical records live in `data/boats.js`. The interface reads model-specific data from those records, not from `app.js`, a spreadsheet, or a runtime correction file.

## Boat record

A canonical boat record retains the existing catalog fields and may include:

```js
{
  id: "boat:Manufacturer | Model",
  categoryId: "boats",
  manufacturer: "Manufacturer",
  model: "Model",
  displayName: "Manufacturer | Model",
  subtitle: "Production years and source basis",
  details: [],
  designGenerations: [],
  valueEras: [],
  generationWarning: "Optional model-specific warning"
}
```

## 1. Design generations

`designGenerations` controls physical specifications.

Create a new generation when verified evidence shows a material change in:

- hull length, beam, bottom width, deadrise, freeboard, or interior depth
- dry hull weight or structural construction
- transom height or propulsion architecture
- rated horsepower
- person or weight capacity
- fuel capacity when tied to a structural redesign
- cockpit or deck structure when usable space, balance, weight, or capability changes materially

Do not create a new generation for graphics, upholstery colors, electronics packages, ordinary seating options, or calendar decade boundaries alone.

Each generation should contain:

```js
{
  id: "manufacturer-family-model-generation",
  label: "Human-readable hull generation",
  startYear: 2001,
  endYear: 2006,
  status: "factory-exact",
  specificationBasis: "2001 factory brochure",
  specs: {
    Beam: {
      value: "89\"",
      confidence: "factory-exact",
      note: "Exact model and model year"
    }
  },
  eras: []
}
```

A generation may set `catalogSpecs: true` when the record's standard detail fields are the verified generation specifications.

## 2. Value eras

`valueEras` controls used-package estimates.

These periods may split an unchanged design because age, motor technology, trailer age, condition, and market behavior change over time.

```js
{
  id: "boat:manufacturer-model:value:2000s",
  label: "2000s",
  startYear: 2000,
  endYear: 2009,
  lowPrice: 4500,
  highPrice: 7500,
  basis: "Used complete-package screening estimate"
}
```

A design generation may span several value eras. A value-era boundary does not imply a hull redesign.

When a model has multiple physical generations, generation-specific `eras` may be stored within each generation so incompatible designs cannot share a price assumption.

## 3. Source confidence

Use these statuses for specifications:

- `factory-exact` - exact model and exact model year
- `factory-generation` - exact verified hull generation using a nearby model year
- `secondary-verified` - reliable secondary evidence corroborated by another source
- `secondary-unverified` - plausible working value that still requires factory confirmation
- `catalog-representative` - existing record basis not yet verified across its full production span
- `research-required` - known generation issue with unresolved boundaries or specifications
- `unknown` - no defensible value available

## 4. Display rule

The app must identify the selected hull generation before displaying generation-specific specifications when more than one generation exists.

If the exact generation cannot be established from model year or listing evidence, show an explicit warning and do not silently substitute another generation.

If one record currently has only a representative specification basis, the app may show that basis with a clear audit warning until research establishes the generation boundaries.

## 5. Canonical update rule

When research verifies a correction:

1. Edit the appropriate record in `data/boats.js` directly.
2. Add or revise `designGenerations` and compatible `valueEras`.
3. Preserve the stable boat ID unless the underlying identity genuinely changes.
4. Record sources and confidence.
5. Run syntax checks and `node tests/qa.mjs`.

Do not add a correction file, overlay, runtime mutation script, spreadsheet snapshot, or model-specific table inside `app.js`.

If `data/boats.js` becomes too large to maintain comfortably, split it by manufacturer and update `data/catalog.js` or a dedicated boat-data assembler. The split files then become canonical; they are not overlays.
