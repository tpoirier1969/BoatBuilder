# Crestliner Sportfish Lineage Reconciliation, 1987–1999

This is the first implementation step from the missing-model audit. It locks model identity and year boundaries only. It does **not** add prices, complete specifications, or app records.

## Conclusions

- **boat:Crestliner | Phantom Sportfish V160**: `update-existing-record`. 1991–1993 Phantom V160 Sportfish; 1994–1994 V160 Sportfish transition alias. The current record is correctly anchored in 1991, but the documented 1994 transition year is missing.
- **boat:Crestliner | Phantom Sportfish V170**: `update-existing-record`. 1987–1990 early Phantom V170 Sportfish lineage; 1991–1994 later Phantom/V170 Sportfish lineage. The 1991 weight jump is a material generation boundary; the current 1991–1993-only record omits both the early hull and 1994 transition year.
- **boat:Crestliner | Phantom Sportfish V180**: `update-existing-record`. 1987–1990 early Phantom V180 Sportfish lineage; 1991–1994 later Phantom/V180 Sportfish lineage. The 190-lb published jump in 1991 requires a separate generation. The 1988 listing belongs to the omitted early era.
- **boat:Crestliner | 1650 Sportfish**: `add-new-record`. 1995–1997 1650 Sportfish. The numbered 16-foot Sportfish family is absent and should not be hidden inside the earlier Phantom V160 record.
- **boat:Crestliner | Sportfish 1750**: `update-existing-record`. 1995–1997 1750 Sportfish outboard; 1998–1998 1750 Sportfish outboard; 1999–1999 1750 Sportfish outboard. The app begins this family in 2000, omitting five documented model years.
- **boat:Crestliner | Sportfish 1850**: `update-existing-record`. 1997–1998 1850 Sportfish outboard; 1999–1999 1850 Sportfish outboard. The app begins this family in 2000, omitting the documented 1997–1999 outboard run.
- **boat:Crestliner | 1950 Sportfish**: `add-new-record`. 1995–1996 1950 Sportfish outboard. The 19-foot numbered Sportfish existed for two documented years. The earlier audit incorrectly extended it through 1997.

## Annual lineage ledger

| Year | Relevant Sportfish names | Source |
|---:|---|---|
| 1987 | Mirage V160 Sportfish; Phantom V170 Sportfish; Phantom V180 Sportfish | https://www.jdpower.com/boats/1987/crestliner-inc |
| 1988 | Mirage V160 Sportfish; Phantom V170 Sportfish; Phantom V180 Sportfish | https://www.jdpower.com/boats/1988/crestliner-inc |
| 1989 | Mirage V160 SF; Phantom V170 SF; Phantom V180 SF | https://www.jdpower.com/boats/1989/crestliner-inc |
| 1990 | Mirage V160; Phantom V170/175; Phantom V180/185 | https://www.jdpower.com/boats/1990/crestliner-inc |
| 1991 | Phantom V160 Sportfish; Phantom V170 Sportfish; Phantom V180 Sportfish | https://www.jdpower.com/boats/1991/crestliner-inc |
| 1992 | Phantom V160 Sportfish; Phantom V170 Sportfish; Phantom V180 Sportfish | https://www.jdpower.com/boats/1992/crestliner-inc |
| 1993 | Phantom V160 Sportfish; Phantom V170 Sportfish; Phantom V180 Sportfish | https://www.jdpower.com/boats/1993/crestliner-inc |
| 1994 | V160 Sportfish; V170 Sportfish; V180 Sportfish | https://www.jdpower.com/boats/1994/crestliner-inc |
| 1995 | 1650 Sportfish; 1750 Sportfish OB; 1950 Sportfish OB | https://www.jdpower.com/boats/1995/crestliner-inc |
| 1996 | 1650 Sportfish; 1750 Sportfish OB; 1950 Sportfish OB | https://www.jdpower.com/boats/1996/crestliner-inc |
| 1997 | 1650 Sportfish; 1750 Sportfish OB; 1850 Sportfish OB | https://www.jdpower.com/boats/1997/crestliner-inc |
| 1998 | 1750 Sportfish OB; 1850 Sportfish OB | https://www.jdpower.com/boats/1998/crestliner-inc |
| 1999 | 1750 Sportfish OB; 1850 Sportfish OB | https://www.jdpower.com/boats/1999/crestliner-inc |

## Quarantined, not approved

- **Mirage V160 Sportfish / Mirage V160 (1987–1990)**: 1987–1989 explicitly use Sportfish/SF, but the 1990 annual roster drops the suffix. Do not merge into Phantom V160.
- **1600 / 1700 Super Hawk (1998–1999)**: Annual model identity is documented, but factory windshield configuration should be confirmed from catalog imagery before backdating current Super Hawk records.
- **1750 Tournament Pro / Tournament Series / Tournament TS (1997–1999)**: Annual naming shifts and exact windshield trim must be mapped before deciding whether this is one stable family.
- **1650 / 1750 / 1850 Pro AM and SC (1995–1997)**: Roster names alone do not prove full walk-through windshield configuration; side-console variants must not enter this catalog.
- **Phantom Eagle, Viking, Voyager, Fish Hawk and other 1987–1994 names (1987–1994)**: These require catalog-image layout screening outside the Sportfish lineage pass.

## Explicit exclusions

- **1680 Sport / 1880 Sport**: Annual roster classifies these as pontoons, not aluminum deep-V fishing boats.
- **Phantom Fish & Ski V175/V185 and similar stern-drive rows**: Separate stern-drive/I/O families; not outboard Sportfish lineage.
- **Center-console, tiller, utility and SC-only variants**: Outside the required full walk-through windshield scope unless a factory full-windshield trim is independently proven.

## Guardrails

- Do not extend the current V160 record backward into the Mirage family.
- Split V170 and V180 at 1991 because their published roster weights change materially.
- Treat 1994 as a documented name transition without the Phantom prefix.
- Do not use the 1998 published 1750 outboard weight until an independent source resolves it.
- Stop the 1950 Sportfish at 1996; the annual roster does not support a 1997 continuation.
- Do not add Pro AM, SC, Tournament, Super Hawk, or miscellaneous legacy families until layout evidence is reviewed.

## Next step

Collect exact hull dimensions, horsepower, capacity, construction, layout and used-package value eras for the seven approved actions. Then apply them to BoatBuilder in one Crestliner-only branch with semantic isolation and UI regression tests.
