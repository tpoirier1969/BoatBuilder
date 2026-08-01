# Lowe existing-record generation completion — rebuilt 2026-07-31

## Scope

This pass audits only the six Lowe records already present in BoatBuilder. It does not add models or expand the manufacturer roster. All six stable record IDs are preserved.

The first Lowe archive prepared on 2026-07-31 was rejected before upload because its transformation script cloned an already-generated early row. That contaminated later rows with older specifications. This rebuild starts from clean `origin/main`, defines every Lowe row explicitly, and adds exact-value regression tests.

## Primary sources

- Lowe 2013 fishing catalog: https://library.rvusa.com/brochure/2013-Lowe.pdf
- Lowe 2014 Fishboat Catalog: https://library.rvusa.com/brochure/2014-Lowe.pdf
- Lowe 2019 fishboats/pontoons catalog: https://www.loweboats.com/content/dam/lowe/catalog-archive/2019-lowe-catalog-fishboats-pontoons.pdf
- Lowe 2020 fishing catalog: https://www.cophers.com/fckimages/pdf/Lowe%20Manuals/lowe-catalog-fish.pdf
- Lowe current FM 1775 WT page: https://www.loweboats.com/fishing/deep-v/walk-through/fm-1775-wt.html
- Lowe catalog archive: https://www.loweboats.com/catalog-archive.html

The 2013 and 2014 factory tables were visually checked from rendered catalog pages, not inferred from adjacent models.

## Older annual evidence

Surviving factory specification tables are incomplete for the 2004–2012 Fish & Ski run. J.D. Power annual Lowe rosters were therefore used as secondary annual evidence for model presence and published hull weight after factory-source exhaustion:

- https://www.jdpower.com/boats/2004/lowe-ind
- https://www.jdpower.com/boats/2005/lowe-ind
- https://www.jdpower.com/boats/2006/lowe-ind
- https://www.jdpower.com/boats/2007/lowe-ind
- https://www.jdpower.com/boats/2008/lowe-ind
- https://www.jdpower.com/boats/2009/lowe-ind
- https://www.jdpower.com/boats/2010/lowe-ind
- https://www.jdpower.com/boats/2011/lowe-ind
- https://www.jdpower.com/boats/2012/lowe-ind

Fields not established by the cited row remain `Not published; verify the capacity plate`. Included-engine horsepower in the valuation roster is not treated as a maximum-horsepower certification.

## Closed chronology

| Stable record | Closed year/hull rows | Important correction |
|---|---|---|
| Fish & Ski FS165 | 2004–2005; 2006–2012; 2013–2014 | Factory 2013–2014 hull is 1,250 lb, 82-inch beam, 70.5-inch bottom and 90 hp—not the earlier approximate values. |
| Fish & Ski 175 | 2004–2005; 2006; 2007–2008; 2009–2012; 2013–2014 | Factory 2013–2014 hull is 1,446 lb and 96 inches wide. It does not retain the 1,150-lb/92-inch earlier specifications. |
| Fish & Ski FS185 | 2004–2005; 2006; 2007–2008; 2009–2012; 2013; 2014 | 2013 and 2014 are 1,700-lb/96-inch factory hulls; 2014 increases certification from 150 to 175 hp and capacity from 1,759 to 1,777 lb. |
| FM Pro 165 WT | 2013–2019 | The WT remains 1,250 lb. The 1,200-lb figure belongs to the FM 165 Pro SC side-console model. |
| FM Pro 175 WT | 2013–2014 | Short exact-name run; the FM 1710 Pro WT successor is not folded into this stable record. |
| Fishing Machine 1775 WT | 2020–2025; 2026 | Lowe publishes 1,317 lb for the earlier span and 1,274 lb currently. Geometry remains the same, so 2026 is labeled a published-specification revision rather than a fabricated redesign. |

The Fish & Ski stable records stop after 2014. Lowe's FS 1610, FS 1710 and FS 1810 successor names are not silently absorbed.

## Pricing and ideal markers

Every physical/evidence row has one or more complete-package screening price eras contained within that row. Package condition in the app narrows the selected range. These are screening ranges, not claimed book values.

The compact ideal markers are limited to:

- `*Fish & Ski 175`
- `*FM Pro 175 WT`

The 165s are too narrow, the FS185 is a heavier and more upholstery-intensive package, and the current FM1775 is generally above the target used budget.

## Regression coverage

The canonical QA now asserts:

- exactly six stable Lowe records;
- 18 non-overlapping closed year/hull rows and 24 contained price eras;
- zero unresolved Lowe rows;
- the exact two-record ideal-star set;
- exact factory weights, beams, bottom widths, horsepower and capacities at the contaminated boundaries;
- 1,250 lb for the FM 165 Pro WT and an explicit guard against the 1,200-lb side-console value;
- 1,317 lb for the 2020–2025 FM1775 and 1,274 lb for 2026.

