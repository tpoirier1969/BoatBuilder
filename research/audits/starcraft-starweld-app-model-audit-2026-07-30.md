# Starcraft and Starweld existing-model completion audit

Date: 2026-07-30

## Scope

This audit covers only the 14 Starcraft and 3 Starweld records already present in BoatBuilder. It does not add every model the manufacturers ever produced.

Completion rules applied:

1. No physical generation may remain `unresolved`.
2. Every known production interval for an existing record must be investigated.
3. Exact factory specifications are used only where the surviving evidence supports them.
4. When surviving records cannot recover a complete specification set, the interval closes as `source-exhausted-partial` or `model-identity-source-exhausted`; adjacent specifications are not borrowed.
5. Every physical/evidence generation receives at least one used complete-package screening range.
6. Stable record IDs remain unchanged.

## Sources examined

Primary specification evidence:

- Starcraft factory legacy catalog archive: https://starcraftmarine.com/resources/legacy-catalogs/
- 1986 Starcraft fishing catalog
- 2010 Starcraft fishing catalog
- 2011 Starcraft fishing catalog
- 2013 Starcraft fishing catalog
- 2014–2016 factory catalog reproductions and annual model records
- Current Starcraft Fishmaster, Superfisherman and builder pages
- 2013 Starweld factory fishing catalog
- Current Starweld manufacturer material

Supporting production and value evidence:

- Annual model rosters and model-fitment records
- JD Power year/model records
- Used dealer listings and archived asking prices
- Model-specific auction and market examples

Used listings establish screening values, not factory specifications.

## Result

- Existing records audited: 17
- Starcraft records: 14
- Starweld records: 3
- Physical/evidence generations after audit: 45
- Starcraft generations: 38
- Starweld generations: 7
- Remaining unresolved rows in these manufacturers: 0
- Physical generations without a numeric used-package range: 0
- Stable IDs added, removed or renamed: 0

## Important corrections

### Superfisherman 176

Closed as one documented 2011–2016 physical generation. Multiple annual records agree on the 17'8-inch, 100-inch-beam, 1,248-pound, 150-hp hull. Calendar value was split into 2011–2013 and 2014–2016 without inventing a hull redesign.

### Superfisherman 186

The 2011–2016 factory generation retains the documented 1,333-pound dry hull weight. The current Starcraft page lists 1,985 pounds as dry weight, but earlier factory tables use 1,985 pounds as total capacity. BoatBuilder now withholds the current dry-weight field and labels the conflict rather than repeating a likely website-field error.

### Starfish 176

The record now separates:

- 2006–2007 early Star Fish identity, source-exhausted
- 2011–2012 1,195-pound factory generation
- 2013–2015 1,176-pound factory generation
- 2016–2017 final production identity, source-exhausted

### Fishmaster 196

The long-running name is no longer treated as one hull. The record now separates early source-exhausted spans, the 2010 175-hp table, the 2011–2014 200-hp generation, the 2015 plating revision, the 2016–2024 evidence gap, and the 2025–2026 current generation.

### STX 2050

The 2010–2014 1,535-pound generation is separated from the 1,650-pound 2015 revision and the current 20'10-inch generation.

### Starweld 1700 DC

Closed as one documented 2013–2016 generation: 16'6 inches, 90-inch beam, 1,075-pound dry weight, 27-inch interior, 115-hp maximum and all-welded construction.

## Compact ideal-match marker

A leading asterisk was added directly to the visible model text for three strong search matches:

- `*Starcraft | Starfish 176 DC / WT`
- `*Starcraft | Superfisherman 176`
- `*Starweld | 1700 DC / WT`

The marker occupies no extra line. Stable IDs remain unchanged. Boats were not starred merely for being capable; size, towing burden, price, windshield, beam, depth and flooring suitability were considered together.

## Value-method note

The price ranges are screening values for complete used packages, not formal appraisals. Motor age, motor technology, trailer, electronics, canvas, structural condition and local Great Lakes demand can move an individual package outside the range.
