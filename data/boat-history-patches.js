(() => {
  "use strict";

  const boats = window.BOATBUILDER_BOATS;
  if (!Array.isArray(boats)) throw new Error("boat-history-patches: BOATBUILDER_BOATS is unavailable");

  const clone = value => JSON.parse(JSON.stringify(value));
  const find = id => boats.find(entry => entry.id === id);
  const requireBoat = id => {
    const boat = find(id);
    if (!boat) throw new Error(`boat-history-patches: missing expected record ${id}`);
    return boat;
  };
  const setDetail = (boat, label, value) => {
    boat.details ||= [];
    const row = boat.details.find(entry => entry.label === label);
    if (row) row.value = value;
    else boat.details.push({ label, value });
  };
  const spec = (value, confidence) => ({ value, confidence });
  const era = (id, label, startYear, endYear, low, high, basis) => ({
    id, label, startYear, endYear, low, high, basis
  });
  const priceBasis = "Used complete-package screening range assembled from current used-market listings and period valuation references. Motor age, trailer, floor/transom condition, canvas and electronics can move an individual package outside the range.";
  const roster = year => `https://www.jdpower.com/boats/${year}/crestliner-inc`;

  function replaceSingleGeneration(id, patch) {
    const boat = requireBoat(id);
    if (!Array.isArray(boat.designGenerations) || boat.designGenerations.length !== 1) {
      throw new Error(`boat-history-patches: ${id} no longer has the expected single generation`);
    }
    const generation = { ...clone(boat.designGenerations[0]), ...patch };
    boat.designGenerations = [generation];
    return boat;
  }

  // V160: preserve the existing 1991 hull and add the documented 1994 transition-name year.
  {
    const id = "boat:Crestliner | Phantom Sportfish V160";
    const boat = replaceSingleGeneration(id, {
      id: `${id}:gen:1991-1994`,
      label: "1991–1994 Phantom/V160 Sportfish",
      startYear: 1991,
      endYear: 1994,
      status: "annual-roster-generation",
      specificationBasis: "1991–1994 annual rosters retain the 16-foot aluminum Sportfish identity at 1,130 lb; the Phantom prefix disappears for 1994 without a published weight change.",
      sourceUrl: roster(1994),
      specs: {
        Length: spec("16'", "year-specific-secondary-source"),
        Beam: spec("6'6\"", "year-specific-secondary-source"),
        "Dry Hull Weight": spec("1,130 lb", "annual-roster"),
        Layout: spec("Factory full walk-through windshield Sportfish layout", "model-identity-verified"),
        Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
      },
      eras: [era(`${id}:value:1991-1994`, "1991–1994", 1991, 1994, 2500, 7000, priceBasis)],
      evidenceUrls: [roster(1991), roster(1994), "https://www.boatingworld.com/boats/crestliner-boats/1993-crestliner-phantom-sportfish-v160"]
    });
    boat.subtitle = "1991–1994 documented Phantom/V160 Sportfish generation";
    boat.sourceUrl = roster(1994);
    boat.lowPrice = 2500;
    boat.highPrice = 7000;
    boat.priceBasis = priceBasis;
    setDetail(boat, "Model Years / Era", "1991–1994 documented Phantom/V160 Sportfish generation");
    setDetail(boat, "Research Status", "Annual 1991–1994 roster continuity verified. The earlier 1987–1990 Mirage V160 Sportfish remains a separate family pending its own layout audit.");
  }

  // V170: the 1991 weight/beam change is material and must remain a generation boundary.
  {
    const id = "boat:Crestliner | Phantom Sportfish V170";
    const boat = requireBoat(id);
    const prior = clone(boat.designGenerations?.[0]);
    if (!prior) throw new Error(`boat-history-patches: ${id} lacks its later-generation basis`);
    boat.subtitle = "1987–1994 production; 1991 wider/heavier generation separated";
    boat.lowPrice = 2500;
    boat.highPrice = 8000;
    boat.priceBasis = priceBasis;
    boat.sourceUrl = roster(1988);
    boat.designGenerations = [
      {
        id: `${id}:gen:1987-1990`,
        label: "1987–1990 early Phantom V170 Sportfish",
        startYear: 1987,
        endYear: 1990,
        status: "annual-roster-generation",
        specificationBasis: "Annual rosters place the early V170 Sportfish at 1,075 lb. Retained 1987–1989 specification indexes show the 17-foot, 6-foot-6-inch aluminum hull. The 1990 roster compresses the V170/V175 name, so listing badging should still be checked.",
        sourceUrl: roster(1988),
        specs: {
          Length: spec("17'", "year-specific-secondary-source"),
          Beam: spec("6'6\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,075 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full-windshield layout; verify 1990 badging", "model-lineage-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1987-1990`, "1987–1990", 1987, 1990, 2500, 6500, priceBasis)],
        evidenceUrls: [roster(1987), roster(1988), roster(1990), "https://www.boatingworld.com/boats/crestliner-boats/1987-crestliner-phantom-v170"]
      },
      {
        ...prior,
        id: `${id}:gen:1991-1994`,
        label: "1991–1994 wider Phantom/V170 Sportfish",
        startYear: 1991,
        endYear: 1994,
        status: "annual-roster-generation",
        specificationBasis: "The 1991 redesign/weight boundary raises published weight to 1,280 lb and beam to 6 feet 11 inches. The same published weight continues through the V170 Sportfish transition name in 1994.",
        sourceUrl: roster(1991),
        specs: {
          ...(prior.specs || {}),
          Length: spec("17'", "year-specific-secondary-source"),
          Beam: spec("6'11\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,280 lb", "annual-roster"),
          Layout: spec("Factory walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1991-1994`, "1991–1994", 1991, 1994, 3000, 8000, priceBasis)],
        evidenceUrls: [roster(1991), roster(1994), "https://www.boatingworld.com/boats/crestliner-boats/1991-crestliner-phantom-v170-sportfish"]
      }
    ];
    setDetail(boat, "Model Years / Era", "1987–1990 early hull; 1991–1994 wider/heavier hull");
    setDetail(boat, "Research Status", "Annual roster reconciled through 1994. The 1991 205-lb published weight jump and 5-inch beam increase are preserved as a generation boundary.");
  }

  // V180: same 7'3" beam, but a 190-lb published jump in 1991 requires separate generations.
  {
    const id = "boat:Crestliner | Phantom Sportfish V180";
    const boat = requireBoat(id);
    const prior = clone(boat.designGenerations?.[0]);
    if (!prior) throw new Error(`boat-history-patches: ${id} lacks its later-generation basis`);
    boat.subtitle = "1987–1994 production; 1991 heavier generation separated";
    boat.lowPrice = 3000;
    boat.highPrice = 8500;
    boat.priceBasis = priceBasis;
    boat.sourceUrl = roster(1988);
    boat.designGenerations = [
      {
        id: `${id}:gen:1987-1990`,
        label: "1987–1990 early Phantom V180 Sportfish",
        startYear: 1987,
        endYear: 1990,
        status: "annual-roster-generation",
        specificationBasis: "The Sportfish lineage is rostered at 1,250 lb through 1990. Period specification indexes show an 18-foot, 7-foot-3-inch aluminum hull. The 1990 roster compresses V180/V185 naming, so listing badging should still be checked.",
        sourceUrl: roster(1988),
        specs: {
          Length: spec("18'", "year-specific-secondary-source"),
          Beam: spec("7'3\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,250 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full-windshield layout; verify 1990 badging", "model-lineage-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1987-1990`, "1987–1990", 1987, 1990, 3000, 7500, priceBasis)],
        evidenceUrls: [roster(1987), roster(1988), roster(1990), "https://www.boatingworld.com/boats/crestliner-boats/1989-crestliner-phantom-v180-sf"]
      },
      {
        ...prior,
        id: `${id}:gen:1991-1994`,
        label: "1991–1994 heavier Phantom/V180 Sportfish",
        startYear: 1991,
        endYear: 1994,
        status: "annual-roster-generation",
        specificationBasis: "Published dry weight rises from 1,250 to 1,440 lb for 1991 while the 18-foot, 7-foot-3-inch geometry remains documented. The 1,440-lb identity continues through the 1994 V180 Sportfish transition name.",
        sourceUrl: roster(1991),
        specs: {
          ...(prior.specs || {}),
          Length: spec("18'", "year-specific-secondary-source"),
          Beam: spec("7'3\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,440 lb", "annual-roster"),
          Layout: spec("Factory walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1991-1994`, "1991–1994", 1991, 1994, 3500, 8500, priceBasis)],
        evidenceUrls: [roster(1991), roster(1994), "https://www.boatingworld.com/boats/crestliner-boats/1993-crestliner-phantom-sportfish-v180"]
      }
    ];
    setDetail(boat, "Model Years / Era", "1987–1990 early 1,250-lb hull; 1991–1994 1,440-lb generation");
    setDetail(boat, "Research Status", "Annual roster reconciled through 1994. The 1988 18-foot listing belongs to the restored 1987–1990 generation, not the heavier 1991–1994 row.");
  }

  // Add the numbered 1650 family instead of hiding it inside Phantom V160.
  {
    const id = "boat:Crestliner | 1650 Sportfish";
    if (find(id)) throw new Error(`boat-history-patches: duplicate new record ${id}`);
    boats.push({
      id,
      categoryId: "boats",
      categoryName: "Boats",
      manufacturer: "Crestliner",
      model: "1650 Sportfish",
      displayName: "Crestliner | 1650 Sportfish",
      subtitle: "1995–1997 documented numbered Sportfish family",
      badge: "Secondary",
      idealMatch: false,
      lowPrice: 3500,
      highPrice: 10000,
      priceBasis,
      sourceUrl: roster(1996),
      details: [
        { label: "Model Years / Era", value: "1995–1997" },
        { label: "Recommendation", value: "Secondary" },
        { label: "Big-Water Suitability", value: "Fair for two in conservative nearshore conditions; narrow for four-person Lake Superior fishing" },
        { label: "Layout", value: "Factory Sportfish walk-through/full-windshield family" },
        { label: "Length", value: "16'" },
        { label: "Beam", value: "6'2\"" },
        { label: "Dry Hull Weight", value: "1,130 lb" },
        { label: "Construction", value: "All-welded aluminum deep-V" },
        { label: "Availability Under $14k", value: "Possible to common; motor age and structural condition dominate value" },
        { label: "Placement Reason", value: "Tow-friendly and protected by a full windshield, but the 74-inch beam is substantially narrower than preferred Lake Superior candidates." },
        { label: "Research Status", value: "1995–1997 annual production and 1,130-lb identity verified; exact listing equipment and capacity plate still control purchase evaluation." }
      ],
      valueEras: [],
      designGenerations: [{
        id: `${id}:gen:1995-1997`,
        label: "1995–1997 1650 Sportfish",
        startYear: 1995,
        endYear: 1997,
        status: "annual-roster-generation",
        specificationBasis: "Annual rosters document the 1650 Sportfish from 1995 through 1997 at 1,130 lb. Retained specification indexes publish a 16-foot, 6-foot-2-inch aluminum hull.",
        sourceUrl: roster(1996),
        specs: {
          Length: spec("16'", "year-specific-secondary-source"),
          Beam: spec("6'2\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,130 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full-windshield family", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1995-1997`, "1995–1997", 1995, 1997, 3500, 10000, priceBasis)],
        evidenceUrls: [roster(1995), roster(1996), roster(1997), "https://www.boatingworld.com/boats/crestliner-boats/1996-crestliner-1650-sportfish"]
      }],
      generationWarning: "Verify the HIN, capacity plate, floor/transom condition, exact windshield trim and motor before applying the screening range."
    });
  }

  // Restore the omitted 1995–1999 years to the existing 1750 Sportfish record.
  {
    const id = "boat:Crestliner | Sportfish 1750";
    const boat = requireBoat(id);
    const existing = clone(boat.designGenerations || []);
    if (!existing.length || existing.some(g => g.startYear < 2000)) {
      throw new Error(`boat-history-patches: ${id} chronology no longer matches the pre-patch baseline`);
    }
    boat.subtitle = "1995–2005 documented outboard line; 1997 beam change and 1998 weight conflict separated";
    boat.lowPrice = 4500;
    boat.highPrice = Math.max(Number(boat.highPrice) || 0, 13000);
    boat.priceBasis = priceBasis;
    boat.sourceUrl = roster(1995);
    boat.designGenerations = [
      {
        id: `${id}:gen:1995-1996`,
        label: "1995–1996 narrow 1750 Sportfish outboard",
        startYear: 1995,
        endYear: 1996,
        status: "annual-roster-generation",
        specificationBasis: "1995–1996 rosters publish the outboard 1750 Sportfish at 1,280 lb. Retained specifications show a 6-foot-11-inch beam before the 1997 widening.",
        sourceUrl: roster(1995),
        specs: {
          Length: spec("17'", "year-specific-secondary-source"),
          Beam: spec("6'11\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,280 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1995-1996`, "1995–1996", 1995, 1996, 4500, 9000, priceBasis)],
        evidenceUrls: [roster(1995), roster(1996), "https://www.boatingworld.com/boats/crestliner-boats/1995-crestliner-1750-sportfish"]
      },
      {
        id: `${id}:gen:1997`,
        label: "1997 wider 1750 Sportfish outboard",
        startYear: 1997,
        endYear: 1997,
        status: "year-specific-generation",
        specificationBasis: "The 1997 specification index widens beam to 7 feet 5 inches while retaining the 1,280-lb published outboard weight.",
        sourceUrl: roster(1997),
        specs: {
          Length: spec("17'", "year-specific-secondary-source"),
          Beam: spec("7'5\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,280 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1997`, "1997", 1997, 1997, 5000, 10000, priceBasis)],
        evidenceUrls: [roster(1997), "https://www.boatingworld.com/boats/crestliner-boats/1997-crestliner-1750-sportfish"]
      },
      {
        id: `${id}:gen:1998-conflict`,
        label: "1998 1750 Sportfish outboard — published weight conflict",
        startYear: 1998,
        endYear: 1998,
        status: "published-weight-conflict",
        specificationBasis: "The 1998 roster keeps the outboard 1750 identity and 7-foot-5-inch beam, but its 2,045-lb published weight duplicates the stern-drive row. The hull weight is intentionally withheld rather than copied into towing calculations.",
        sourceUrl: roster(1998),
        specs: {
          Length: spec("17'", "year-specific-secondary-source"),
          Beam: spec("7'5\"", "year-specific-secondary-source"),
          Layout: spec("Factory Sportfish walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1998`, "1998", 1998, 1998, 5000, 10000, priceBasis)],
        evidenceUrls: [roster(1998), "https://www.boatingworld.com/boats/crestliner-boats/1998-crestliner-1750-sportfish"]
      },
      {
        id: `${id}:gen:1999`,
        label: "1999 1750 Sportfish outboard",
        startYear: 1999,
        endYear: 1999,
        status: "year-specific-generation",
        specificationBasis: "The 1999 roster restores a plausible outboard weight of 1,300 lb on the 7-foot-5-inch hull.",
        sourceUrl: roster(1999),
        specs: {
          Length: spec("17'", "year-specific-secondary-source"),
          Beam: spec("7'5\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,300 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1999`, "1999", 1999, 1999, 5500, 10500, priceBasis)],
        evidenceUrls: [roster(1999), "https://www.boatingworld.com/boats/crestliner-boats/1999-crestliner-1750-sportfish"]
      },
      ...existing
    ];
    setDetail(boat, "Model Years / Era", "1995–2005 documented outboard line; 1995–1996 narrow, 1997 wider, 1998 weight-conflict, 1999+ later evidence");
    setDetail(boat, "Research Status", "The omitted 1995–1999 outboard years are restored. The suspicious 1998 2,045-lb figure is quarantined and is not allowed into package-weight calculations.");
  }

  // Restore the omitted 1997–1999 years to the existing 1850 Sportfish record.
  {
    const id = "boat:Crestliner | Sportfish 1850";
    const boat = requireBoat(id);
    const existing = clone(boat.designGenerations || []);
    if (!existing.length || existing.some(g => g.startYear < 2000)) {
      throw new Error(`boat-history-patches: ${id} chronology no longer matches the pre-patch baseline`);
    }
    boat.subtitle = "1997–2026 documented outboard line; early 1997–1999 rows restored";
    boat.lowPrice = 6000;
    boat.priceBasis = priceBasis;
    boat.sourceUrl = roster(1998);
    boat.designGenerations = [
      {
        id: `${id}:gen:1997-1998`,
        label: "1997–1998 early 1850 Sportfish outboard",
        startYear: 1997,
        endYear: 1998,
        status: "annual-roster-generation",
        specificationBasis: "1997–1998 annual rosters document the 18-foot outboard at 1,470 lb; retained specifications publish a 7-foot-11-inch beam.",
        sourceUrl: roster(1998),
        specs: {
          Length: spec("18'", "year-specific-secondary-source"),
          Beam: spec("7'11\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,470 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1997-1998`, "1997–1998", 1997, 1998, 6000, 11000, priceBasis)],
        evidenceUrls: [roster(1997), roster(1998), "https://www.boatingworld.com/boats/crestliner-boats/1998-crestliner-1850-sportfish"]
      },
      {
        id: `${id}:gen:1999`,
        label: "1999 lighter-published 1850 Sportfish outboard",
        startYear: 1999,
        endYear: 1999,
        status: "year-specific-generation",
        specificationBasis: "The 1999 roster keeps the same 18-foot/7-foot-11-inch identity but lowers published dry weight to 1,400 lb, so the annual distinction is preserved.",
        sourceUrl: roster(1999),
        specs: {
          Length: spec("18'", "year-specific-secondary-source"),
          Beam: spec("7'11\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,400 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full windshield", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1999`, "1999", 1999, 1999, 6000, 11500, priceBasis)],
        evidenceUrls: [roster(1999), "https://www.boatingworld.com/boats/crestliner-boats/1999-crestliner-1850-sportfish"]
      },
      ...existing
    ];
    setDetail(boat, "Model Years / Era", "1997–2026 documented outboard lineage with early 1997–1999 rows restored");
    setDetail(boat, "Research Status", "Annual 1997–1999 outboard identity is restored ahead of the existing 2000+ generations; the 1999 published weight drop remains a separate evidence row.");
  }

  // Add the short-lived 1950 Sportfish only for the two years actually documented.
  {
    const id = "boat:Crestliner | 1950 Sportfish (1995–1996 legacy)";
    if (find(id)) throw new Error(`boat-history-patches: duplicate new record ${id}`);
    boats.push({
      id,
      categoryId: "boats",
      categoryName: "Boats",
      manufacturer: "Crestliner",
      model: "1950 Sportfish (1995–1996 legacy)",
      displayName: "Crestliner | 1950 Sportfish (1995–1996 legacy)",
      subtitle: "1995–1996 documented legacy outboard family",
      badge: "Secondary",
      idealMatch: false,
      lowPrice: 6500,
      highPrice: 12000,
      priceBasis,
      sourceUrl: roster(1996),
      details: [
        { label: "Model Years / Era", value: "1995–1996 only" },
        { label: "Recommendation", value: "Secondary" },
        { label: "Big-Water Suitability", value: "Capable hull, but larger packages require careful tow-weight screening" },
        { label: "Layout", value: "Factory Sportfish walk-through/full-windshield family" },
        { label: "Length", value: "19'" },
        { label: "Beam", value: "8'0\"" },
        { label: "Dry Hull Weight", value: "1,440 lb" },
        { label: "Construction", value: "All-welded aluminum deep-V" },
        { label: "Availability Under $14k", value: "Possible, but uncommon" },
        { label: "Placement Reason", value: "Big-water-capable proportions, but the 19-foot package is outside the preferred size and can consume towing margin once rigged." },
        { label: "Research Status", value: "1995 and 1996 outboard rows verified. No 1997 continuation is claimed." }
      ],
      valueEras: [],
      designGenerations: [{
        id: `${id}:gen:1995-1996`,
        label: "1995–1996 legacy 1950 Sportfish outboard",
        startYear: 1995,
        endYear: 1996,
        status: "annual-roster-generation",
        specificationBasis: "1995–1996 annual rosters document the 19-foot aluminum outboard 1950 Sportfish at 1,440 lb. The model disappears from the 1997 roster.",
        sourceUrl: roster(1996),
        specs: {
          Length: spec("19'", "year-specific-secondary-source"),
          Beam: spec("8'0\"", "year-specific-secondary-source"),
          "Dry Hull Weight": spec("1,440 lb", "annual-roster"),
          Layout: spec("Factory Sportfish walk-through/full-windshield family", "model-identity-verified"),
          Construction: spec("All-welded aluminum deep-V", "manufacturer-family-verified")
        },
        eras: [era(`${id}:value:1995-1996`, "1995–1996", 1995, 1996, 6500, 12000, priceBasis)],
        evidenceUrls: [roster(1995), roster(1996), "https://www.boatingworld.com/boats/crestliner-boats/1996-crestliner-1950-sportfish"]
      }],
      generationWarning: "This is the 1995–1996 legacy outboard family, not a current 1950 Sportfish. Verify the HIN, capacity plate and actual package weight."
    });
  }

  window.BOATBUILDER_HISTORY_PATCHES = {
    version: 1,
    crestliner: {
      updatedIds: [
        "boat:Crestliner | Phantom Sportfish V160",
        "boat:Crestliner | Phantom Sportfish V170",
        "boat:Crestliner | Phantom Sportfish V180",
        "boat:Crestliner | Sportfish 1750",
        "boat:Crestliner | Sportfish 1850"
      ],
      addedIds: [
        "boat:Crestliner | 1650 Sportfish",
        "boat:Crestliner | 1950 Sportfish (1995–1996 legacy)"
      ]
    }
  };
})();
