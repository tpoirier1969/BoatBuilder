import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const source = fs.readFileSync(boatsPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: boatsPath });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Canonical boat array could not be loaded");

const requireBoat = id => {
  const boat = boats.find(entry => entry.id === id);
  if (!boat) throw new Error(`Missing expected G3 record: ${id}`);
  return boat;
};

const setDetail = (boat, label, value) => {
  const detail = (boat.details || []).find(entry => entry.label === label);
  if (detail) detail.value = value;
  else (boat.details ||= []).push({ label, value });
};

const spec = (value, confidence = "cited-source-exact") => ({ value, confidence });
const era = (boatId, slug, startYear, endYear, low, high, basis) => ({
  id: `${boatId}:value:${slug}`,
  label: startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`,
  startYear,
  endYear,
  low,
  high,
  basis
});
const generation = (boatId, slug, label, startYear, endYear, status, specificationBasis, sourceUrl, specs, eras, evidenceUrls = []) => ({
  id: `${boatId}:gen:${slug}`,
  label,
  startYear,
  endYear,
  status,
  specificationBasis,
  sourceUrl,
  specs,
  eras,
  evidenceUrls
});
const packageBasis = "Used complete-package screening estimate; motor age, trailer, floor/transom condition, canvas and electronics can move an individual package outside the range.";
const construction = "Riveted three-piece aluminum GX2 deep-V with full-length riveted keel";

const v172 = requireBoat("boat:G3 | Angler V172 FS / WT");
v172.model = "Angler V172 FS (full-windshield / walk-through)";
v172.displayName = "G3 | Angler V172 FS (full-windshield / walk-through)";
v172.subtitle = "2009-2016 documented V172 FS production; 2010-2012 and 2013-2016 evidence generations separated";
v172.lowPrice = 4500;
v172.highPrice = 11500;
v172.priceBasis = "Generation-contained used complete-package estimates. Select the listing year before judging value.";
v172.valueEras = [];
setDetail(v172, "Model Years / Era", "2009 market/roster evidence; 2010-2012 early V172 FS; 2013-2016 factory-catalog generation");
setDetail(v172, "Layout", "Factory full wraparound, walk-through windshield; FS is the factory model suffix, not WT");
setDetail(v172, "Notes", "This is the best G3 fit of the three audited models. Factory catalogs identify a riveted GX2 deep-V, not a welded hull. The 2013 Yamaha test package weighed about 2,639 lb as tested with an F90, leaving useful but not unlimited margin under the Maverick's 4,000-lb rating.");
setDetail(v172, "Interior Finish / Deck Material", "Factory catalogs show a vinyl cockpit with optional snap-in carpet on the full-windshield FS package. Verify raised deck and trim carpeting on the exact boat.");
setDetail(v172, "Interior Material Basis", "2013-2016 factory catalog evidence for the exact V172 FS family.");
setDetail(v172, "Research Status", "The original 2009-2015 advertised span was reconciled through 2016, when G3 last listed the V172 name. The 2017 catalog replaces the numbered V172 family with V17 models.");
v172.generationWarning = "Choose the actual listing year. The stable record ID retains the older WT shorthand, but G3's factory model was V172 FS with a full walk-through windshield.";
v172.designGenerations = [
  generation(v172.id, "2009", "2009 first documented V172 full-windshield evidence", 2009, 2009, "annual-market-evidence", "A 2009 V172 full-windshield record establishes the model before the recovered 2010-2016 factory-catalog run. Only family-level physical details are retained for this evidence year.", "https://www.jdpower.com/boats/2009/g3-boats", {
    "Length": spec("17-foot class", "annual-roster"),
    "Layout": spec("Full-windshield Angler V172 family", "exact-model-market-evidence"),
    "Construction": spec(construction, "factory-series-verified")
  }, [era(v172.id, "2009", 2009, 2009, 4500, 7500, packageBasis)]),
  generation(v172.id, "2010-2012", "2010-2012 early Angler V172 FS generation", 2010, 2012, "cited-generation", "Annual model evidence and the retained exact performance-bulletin snapshot establish the early V172 FS dimensions and ratings. The GX2 construction is corrected to riveted three-piece aluminum.", "https://yamahaoutboards.com/getmedia/87968a24-1ac5-4281-9282-a4a9a487ed3f/pb_g3b_anglerv172f_f90la_2013-06-26_alm", {
    "Length": spec("17'2\""),
    "Beam": spec("92\""),
    "Chine / Bottom Width": spec("79\""),
    "Dry Hull Weight": spec("1,460 lb", "factory-spec-table"),
    "Max / Bow Depth": spec("37\""),
    "Deadrise": spec("13°", "factory-spec-table"),
    "Transom Height": spec("20\""),
    "Max HP": spec("115"),
    "Persons": spec("5", "factory-spec-table"),
    "Capacity Weight": spec("1,400 lb"),
    "Fuel Capacity": spec("33 gal"),
    "Bottom Thickness": spec("0.100\" plus 0.100\" double-plated bow", "factory-spec-table"),
    "Construction": spec(construction, "factory-catalog")
  }, [era(v172.id, "2010-2012", 2010, 2012, 5500, 9000, packageBasis)], ["https://g3boats.uberflip.com/i/97791-2013/31"]),
  generation(v172.id, "2013-2016", "2013-2016 final numbered Angler V172 FS generation", 2013, 2016, "factory-catalog-generation", "The 2013 and 2014 factory catalogs publish the exact V172 FS dimensions, GX2 riveted construction and full walk-through windshield. The 2016 catalog retains V172 FS; the 2017 catalog changes the family name to V17.", "https://g3boats.uberflip.com/i/183684-2014/55", {
    "Length": spec("17'2\"", "factory-spec-table"),
    "Beam": spec("92\"", "factory-spec-table"),
    "Chine / Bottom Width": spec("79\"", "factory-spec-table"),
    "Dry Hull Weight": spec("1,440 lb", "factory-spec-table"),
    "Max / Bow Depth": spec("37\"", "factory-spec-table"),
    "Deadrise": spec("13°", "factory-spec-table"),
    "Transom Height": spec("20\"", "factory-spec-table"),
    "Max HP": spec("115", "factory-spec-table"),
    "Persons": spec("5", "factory-spec-table"),
    "Capacity Weight": spec("1,400 lb", "factory-spec-table"),
    "Fuel Capacity": spec("33 gal", "factory-spec-table"),
    "Bottom Thickness": spec("0.100\" plus 0.100\" double-plated bow", "factory-spec-table"),
    "Construction": spec(construction, "factory-catalog")
  }, [
    era(v172.id, "2013-2014", 2013, 2014, 6500, 10000, packageBasis),
    era(v172.id, "2015-2016", 2015, 2016, 7500, 11500, packageBasis)
  ], ["https://g3boats.uberflip.com/i/97791-2013/31", "https://g3boats.uberflip.com/i/597573-2016"])
];

const v175 = requireBoat("boat:G3 | Angler V175 FS");
v175.subtitle = "2006-2016 documented V175 FS production; early and later published-length evidence kept separate";
v175.lowPrice = 5000;
v175.highPrice = 13500;
v175.priceBasis = "Generation-contained used complete-package estimates. Verify the HIN and capacity plate because published length differs between retained sources.";
v175.valueEras = [];
setDetail(v175, "Model Years / Era", "2006-2009 early V175 FS evidence; 2010-2012 retained Yamaha-bulletin generation; 2013-2016 factory-catalog generation");
setDetail(v175, "Notes", "A broad, capable full-windshield boat, but heavy for its nominal length. The retained Yamaha bulletin publishes 17'10 inches while the 2014 factory table publishes 17'5 inches; the catalog keeps those evidence generations separate instead of erasing the conflict.");
setDetail(v175, "Interior Finish / Deck Material", "Vinyl cockpit was available in the factory Angler V family, with carpet or snap-in carpet depending trim. Verify the exact FS package.");
setDetail(v175, "Interior Material Basis", "Factory Angler V feature tables and exact-model performance evidence.");
setDetail(v175, "Research Status", "The V175 FS is documented from 2006 through the final 2016 numbered-model catalog. G3 changes the family to V17/V18 naming in 2017.");
v175.generationWarning = "The 17'10-inch Yamaha performance bulletin and 17'5-inch 2014 factory table conflict. Use the listing HIN, capacity plate and measured hull rather than assuming one number applies to every V175 FS.";
v175.designGenerations = [
  generation(v175.id, "2006-2009", "2006-2009 early Angler V175 FS evidence generation", 2006, 2009, "annual-roster-partial", "Exact-model valuation records establish the V175 FS during 2006-2009. Only durable family characteristics are retained because a complete early factory specification table was not recovered.", "https://www.jdpower.com/boats/2006/g3-boats/v175fs__/10234096/specs", {
    "Length": spec("17-foot class", "annual-roster"),
    "Beam": spec("96\" class", "exact-model-roster"),
    "Max HP": spec("Up to 150; verify capacity plate", "exact-model-roster"),
    "Construction": spec(construction, "factory-series-verified")
  }, [era(v175.id, "2006-2009", 2006, 2009, 5000, 8500, packageBasis)]),
  generation(v175.id, "2010-2012", "2010-2012 retained Yamaha-bulletin V175 FS generation", 2010, 2012, "cited-generation-with-length-conflict", "The retained Yamaha performance bulletin publishes a 17'10-inch, 96-inch-beam, 1,680-lb V175 FS. A later factory specification table publishes 17'5 inches, so the dimensions are not silently blended.", "https://yamahaoutboards.com/getmedia/98584d01-282d-4195-ab24-ef68129bf468/pb_g3b_anglerv175fs_f150xa_2013-06-26_alm", {
    "Length": spec("17'10\" in retained Yamaha bulletin", "cited-source-exact"),
    "Beam": spec("96\""),
    "Dry Hull Weight": spec("1,680 lb"),
    "Max HP": spec("150"),
    "Persons": spec("7"),
    "Fuel Capacity": spec("33 gal"),
    "Bottom Thickness": spec("0.100\" GX2 double-plated bow/bottom family", "factory-series-verified"),
    "Construction": spec(construction, "factory-series-verified")
  }, [era(v175.id, "2010-2012", 2010, 2012, 7000, 11000, packageBasis)]),
  generation(v175.id, "2013-2016", "2013-2016 final numbered Angler V175 FS factory generation", 2013, 2016, "factory-catalog-generation", "The 2014 factory specification table publishes a 17'5-inch V175 FS with 96-inch beam, 82-inch bottom, 25-inch transom, 42-inch bow depth and 13-degree deadrise. The numbered model remains in the 2016 catalog and is replaced by V17/V18 naming for 2017.", "https://g3boats.uberflip.com/i/183684-2014/55", {
    "Length": spec("17'5\"", "factory-spec-table"),
    "Beam": spec("96\"", "factory-spec-table"),
    "Chine / Bottom Width": spec("82\"", "factory-spec-table"),
    "Dry Hull Weight": spec("1,680 lb", "factory-spec-table"),
    "Max / Bow Depth": spec("42\"", "factory-spec-table"),
    "Deadrise": spec("13°", "factory-spec-table"),
    "Transom Height": spec("25\"", "factory-spec-table"),
    "Max HP": spec("150", "exact-model-performance-evidence"),
    "Persons": spec("7", "exact-model-performance-evidence"),
    "Fuel Capacity": spec("33 gal", "exact-model-performance-evidence"),
    "Bottom Thickness": spec("0.100\" plus 0.100\" GX2 double-plated bow/bottom", "factory-spec-table"),
    "Construction": spec(construction, "factory-catalog")
  }, [
    era(v175.id, "2013-2014", 2013, 2014, 8000, 12000, packageBasis),
    era(v175.id, "2015-2016", 2015, 2016, 9000, 13500, packageBasis)
  ], ["https://g3boats.uberflip.com/i/597573-2016"])
];

const v185 = requireBoat("boat:G3 | Angler V185 FS (Secondary; V172 is Primary)");
v185.subtitle = "2005-2014 documented V185 FS production; 2014 final factory specification retained";
v185.lowPrice = 5500;
v185.highPrice = 14000;
v185.priceBasis = "Generation-contained used complete-package estimates. The 1,800-lb hull and 200-hp rating make loaded tow weight a first-order screening issue.";
v185.valueEras = [];
setDetail(v185, "Model Years / Era", "2005-2012 early V185 FS evidence; 2013-2014 final factory-catalog generation; FS absent from 2015 lineup");
setDetail(v185, "Practical Working HP", "150–200; verify package weight before purchase");
setDetail(v185, "Notes", "The factory 2014 table identifies a riveted 18'5-inch, 96-inch-beam hull weighing 1,800 lb dry and rated for 200 hp. That makes it an excellent big-water platform but a marginal project fit once motor, trailer, fuel and fishing gear are added.");
setDetail(v185, "Interior Finish / Deck Material", "Factory V185 FS feature tables show a vinyl cockpit with carpeted or snap-in carpet areas depending package.");
setDetail(v185, "Interior Material Basis", "Exact 2013-2014 factory V185 FS catalog and specification tables.");
setDetail(v185, "Research Status", "The V185 FS is documented from 2005 through 2014. The 2015 and 2016 factory lineups retain V185 SF and V185 F but drop V185 FS, closing this record at 2014.");
v185.generationWarning = "Do not apply V185 SF, V185 F or later V18/V1850 specifications to this FS record. At roughly 1,800 lb bare hull, many complete packages will approach the Maverick's practical towing ceiling.";
v185.designGenerations = [
  generation(v185.id, "2005-2012", "2005-2012 early Angler V185 FS evidence generation", 2005, 2012, "exact-model-evidence-generation", "Exact-model records and a contemporary 2006 review establish the V185 FS before the recovered factory catalogs. Published early dry weights range around 1,610-1,820 lb depending year/source, so one false exact weight is not imposed across the span.", "https://www.boats.com/reviews/go-boating-boat-review-g3-angler-v185-fs/", {
    "Length": spec("About 18'2\"-18'5\"; verify year", "multi-source-range"),
    "Beam": spec("About 96\"", "exact-model-evidence"),
    "Dry Hull Weight": spec("Published evidence about 1,610-1,820 lb; verify year", "multi-source-range"),
    "Max HP": spec("Up to 200; verify capacity plate", "exact-model-evidence"),
    "Construction": spec(construction, "factory-series-verified")
  }, [
    era(v185.id, "2005-2008", 2005, 2008, 5500, 9000, packageBasis),
    era(v185.id, "2009-2012", 2009, 2012, 7000, 12000, packageBasis)
  ], ["https://www.jdpower.com/boats/2005/g3-boats", "https://www.boatingworld.com/boats/g3-boats/2012-g3-v185fs"]),
  generation(v185.id, "2013-2014", "2013-2014 final Angler V185 FS factory generation", 2013, 2014, "factory-catalog-generation", "The 2013 and 2014 factory catalogs list the exact V185 FS. The 2014 specification table publishes its complete core hull data. The V185 FS disappears from the 2015 lineup while V185 SF and V185 F continue.", "https://g3boats.uberflip.com/i/183684-2014/55", {
    "Length": spec("18'5\"", "factory-spec-table"),
    "Beam": spec("96\"", "factory-spec-table"),
    "Chine / Bottom Width": spec("82\"", "factory-spec-table"),
    "Dry Hull Weight": spec("1,800 lb", "factory-spec-table"),
    "Max / Bow Depth": spec("42\"", "factory-spec-table"),
    "Deadrise": spec("13°", "factory-spec-table"),
    "Transom Height": spec("25\"", "factory-spec-table"),
    "Max HP": spec("200", "factory-spec-table"),
    "Persons": spec("8", "factory-spec-table"),
    "Capacity Weight": spec("1,800 lb", "factory-spec-table"),
    "Fuel Capacity": spec("33 gal", "factory-spec-table"),
    "Bottom Thickness": spec("0.100\" plus 0.100\" double-plated bow and bottom", "factory-spec-table"),
    "Construction": spec(construction, "factory-catalog")
  }, [era(v185.id, "2013-2014", 2013, 2014, 9000, 14000, packageBasis)], ["https://g3boats.uberflip.com/i/97791-2013", "https://g3boats.uberflip.com/i/412569-2015"])
];

for (const boat of [v172, v175, v185]) {
  boat.designGenerations.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
}

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) {
  throw new Error("Could not locate canonical boat array wrapper");
}

const output = `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`;
fs.writeFileSync(boatsPath, output);
console.log("Applied verified G3 chronology, construction, specification and pricing repairs.");
