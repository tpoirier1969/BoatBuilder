# BoatBuilder catalog schema v3

BoatBuilder uses two independent timelines for boat records.

## 1. Design generations

`designGenerations` controls physical specifications.

Create a new design generation when a material boat design change is verified, including changes to:

- hull length, beam, chine width, deadrise, freeboard, or interior depth
- dry hull weight or structural construction
- transom height or rated horsepower
- person or weight capacity
- fuel capacity when tied to a redesigned hull or interior structure
- cockpit or deck structure when it materially changes usable space, balance, or package weight

Do not create a new design generation for graphics, upholstery colors, electronics packages, ordinary seating options, or other cosmetic/package changes.

Calendar years describe when a design was sold. They do not define the generation by themselves.

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
  }
}
```

## 2. Value eras

`valueEras` controls cost estimates. These may split an unchanged design into multiple calendar periods because age, motor technology, trailer age, condition, and used-market behavior change over time.

Example:

```js
{
  id: "manufacturer-model:value:2000s",
  label: "2000s",
  startYear: 2000,
  endYear: 2009,
  lowPrice: 4500,
  highPrice: 7500,
  basis: "Used complete-package estimate"
}
```

A design generation may span several value eras. A value-era boundary does not imply a hull redesign.

## Source confidence

Use one of these statuses for specifications:

- `factory-exact`: exact model and exact model year
- `factory-generation`: exact verified hull generation, nearby year
- `secondary-verified`: reliable secondary source corroborated by another source
- `secondary-unverified`: plausible working value that still requires factory confirmation
- `legacy-flat`: inherited catalog value not yet audited by design generation
- `unknown`: no defensible value available

## Display rule

The app must identify the selected hull generation before displaying its specifications. If the exact generation cannot be selected from the year/model information, show an explicit warning and do not silently substitute current specifications.

## Migration rule

Legacy decade-labeled price fields remain temporarily for backward compatibility. They are normalized into `valueEras` at startup. Legacy flat specifications are wrapped in a single `legacy-flat-specs` generation until the model family is researched and split properly.
