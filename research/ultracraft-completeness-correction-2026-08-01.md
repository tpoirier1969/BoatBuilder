# Ultracraft roster-completeness correction — 2026-08-01

## Why this audit was reopened

The first Ultracraft audit proved that the two records already in BoatBuilder were internally consistent, then incorrectly presented that result as model-history completeness. A user-supplied listing for a visibly branded **2010 Stealth 178 W** exposed the missing 2009–2012 roster run.

The failure was methodological: the regression test encoded the assumed 2006–2008 cutoff instead of comparing the canonical records with an independent annual model roster.

## Independent roster evidence

The surviving Ultracraft model index lists:

- `Stealth 169W` for 2006–2008 and `169W` for 2009–2012.
- `Stealth 178W` for 2006–2008 and `178W` for 2009–2012.

Source:

- https://www.boats.za.net/ultracraft

Additional naming evidence preserves the Stealth identity after the database shortened the model name:

- 2010 Stealth 178 W cover fitment: https://bestcovers.com/products/2010-ultracraft-stealth-178-w-bestfit-300-boat-cover
- 2012 Stealth 178 W cover fitment: https://bestcovers.com/products/2012-ultracraft-stealth-178-w-bestfit-300-boat-cover
- User-supplied 2010 listing photograph visibly carries `STEALTH 178 W` hull graphics.

The app therefore treats 2009 as a naming/evidence boundary, not a proven hull redesign.

## Published specification conflict

The retained Misty Harbor Ultracraft brochure and the year-specific records agree on the core 178W identity:

- 17 ft 8 in length
- 1,120 lb dry hull
- 115 hp maximum
- six-person / 1,500 lb capacity
- 24-gallon fuel tank

They conflict on several geometry fields:

| Field | Misty Harbor brochure | Year-specific records |
|---|---:|---:|
| Beam | 94 in | 95 in |
| Bow height | 44 in | 36 in |
| Deadrise | 13 degrees | 15 degrees |
| Transom | 20 or 25 in | 20 in |

Sources:

- Misty Harbor brochure: https://pdf.nauticexpo.com/pdf/misty-harbor/ultracraftbrochure/20877-41153.html
- 2008 year-specific record: https://www.boats.za.net/boat-specs.aspx?boat=Ultracraft-Stealth-178W-2008&bt=30126
- 2010 year-specific comparison record: https://www.boats.za.net/compare/ultracraft/178w/ultracraft-178w-2010--vs--ultracraft/modified-vee-jon-2070mvd/ultracraft-modified-vee-jon-2070mvd-2006

The correction retains both published values. It does not manufacture certainty by choosing whichever source is more convenient.

## Corrected canonical coverage

Stable IDs are preserved.

| Stable record | Corrected rows | Interpretation |
|---|---|---|
| `boat:Ultracraft (Misty Harbor) | Stealth 169W` | 2006–2008; 2009–2012 | Stealth 169W to 169W naming/evidence transition; no claimed redesign |
| `boat:Ultracraft (Misty Harbor) | Stealth 178W` | 2006–2008; 2009–2012 | Stealth 178W to 178W naming/evidence transition; published dimensional conflict retained |

## Audit-method correction

`research/manufacturer-audit-scope.json` now distinguishes:

1. partial batches;
2. generation-complete records already present in BoatBuilder;
3. custom-build dispositions;
4. relevant model-family roster verification;
5. full manufacturer-roster verification.

A manufacturer may not be marked roster-complete unless an independent roster and expected annual coverage are encoded. The new QA checks every expected year for roster-verified families and rejects unexplained gaps.

The scope review also downgrades prior broad language. Most completed audits are currently **existing-record generation complete**, not **manufacturer roster complete**.
