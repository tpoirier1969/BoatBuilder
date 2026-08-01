import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const gapPath = "research/all-manufacturer-roster-gaps.json";
const source = fs.readFileSync(boatsPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: boatsPath });
let boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Canonical boat array could not be loaded");

const deepClone = value => JSON.parse(JSON.stringify(value));
const requireBoat = id => {
  const boat = boats.find(entry => entry.id === id);
  if (!boat) throw new Error(`Missing template boat ${id}`);
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
const packageBasis = "Used complete-package screening estimate. Motor age, trailer, floor/transom condition, canvas, electronics and regional demand can move an individual package outside the range.";

const configureBoat = ({ baseId, id, manufacturer, model, subtitle, lowPrice, highPrice, sourceUrl, layout, bigWater, practicalHp, placement, notes, research, generations, imageNote }) => {
  const boat = deepClone(requireBoat(baseId));
  boat.id = id;
  boat.manufacturer = manufacturer;
  boat.model = model;
  boat.displayName = `${manufacturer} | ${model}`;
  boat.subtitle = subtitle;
  boat.badge = "Primary";
  boat.idealMatch = false;
  boat.lowPrice = lowPrice;
  boat.highPrice = highPrice;
  boat.priceBasis = "Generation-contained used complete-package screening estimates. Choose the year-specific evidence row before judging a listing.";
  boat.sourceUrl = sourceUrl;
  boat.valueEras = [];
  boat.designGenerations = generations;
  boat.generationWarning = "Verify the HIN, capacity plate, exact windshield trim, floor, transom and motor before applying these specifications or price ranges.";
  boat.image = {
    ...(boat.image || {}),
    matchQuality: "Same manufacturer/family stand-in",
    note: imageNote
  };
  setDetail(boat, "Model Years / Era", generations.map(entry => entry.startYear === entry.endYear ? `${entry.startYear}` : `${entry.startYear}-${entry.endYear}`).join("; "));
  setDetail(boat, "Recommendation", "Primary");
  setDetail(boat, "Big-Water Suitability", bigWater);
  setDetail(boat, "Layout", layout);
  for (const label of ["Length", "Beam", "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth", "Cockpit / Interior Depth", "Deadrise", "Transom Height", "Transom Width", "Max HP", "Persons", "Capacity Weight", "Fuel Capacity", "Bottom Thickness", "Side / Freeboard Thickness", "Construction"]) {
    setDetail(boat, label, "Varies by selected hull generation");
  }
  setDetail(boat, "Practical Working HP", practicalHp);
  setDetail(boat, "Availability Under $14k", "Common to possible, condition and motor dependent");
  setDetail(boat, "Placement Reason", placement);
  setDetail(boat, "Notes", notes);
  setDetail(boat, "Interior Finish / Deck Material", "Marine carpet over an aging deck substrate was typical; inspect for replacement work, moisture and soft spots.");
  setDetail(boat, "Interior Material Basis", "Period-family configuration; verify the individual boat rather than trusting clean carpet or seller wording.");
  setDetail(boat, "Washdown / Carpet Fit", "POOR — These are generally carpeted boats, not hose-down interiors.");
  setDetail(boat, "Research Status", research);
  return boat;
};

const fisherBase = "boat:Fisher | Hawk 170 FS";
const ultraBase = "boat:Ultracraft (Misty Harbor) | Stealth 169W";

const hawk160Id = "boat:Fisher | Hawk 160 WT";
const hawk160 = configureBoat({
  baseId: fisherBase,
  id: hawk160Id,
  manufacturer: "Fisher",
  model: "Hawk 160 WT",
  subtitle: "2004-2007 documented walk-through family; 2006 weight change separated",
  lowPrice: 4000,
  highPrice: 10000,
  sourceUrl: "https://www.boats.za.net/fisher/hawk-160-wt/fisher-hawk-160-wt-2007",
  layout: "Factory dual-console walk-through windshield",
  bigWater: "Good for two; compact for four on Lake Superior",
  practicalHp: "75-90",
  placement: "Primary-size welded deep-V with a full windshield, but the 16'2-inch hull is compact for four-person big-water fishing.",
  notes: "The annual rosters show the Hawk 160 WT from 2004 through 2007, not 2005-2007. Published dry weight is 1,340 lb in 2004-2005 and 1,345 lb in 2006-2007. It is tow-friendly, but four anglers would be crowded.",
  research: "Annual Fisher rosters and year-specific specification sheets were reconciled; no unsupported 2008 continuation is claimed.",
  imageNote: "Existing Fisher Hawk-family image used as a layout stand-in; verify the exact 160 WT listing.",
  generations: [
    generation(hawk160Id, "2004-2005", "2004-2005 Hawk 160 WT", 2004, 2005, "annual-roster-generation", "Annual rosters list the Hawk 160 WT at 1,340 lb in both years. The 2005 year sheet publishes the 16'2-inch length, 92-inch beam, 25-inch depth, 24-gallon tank, five-person rating and 90-hp maximum.", "https://www.jdpower.com/boats/2005/fisher-boats", {
      "Length": spec("16'2\"", "year-specific-secondary-source"),
      "Beam": spec("92\"", "year-specific-secondary-source"),
      "Dry Hull Weight": spec("1,340 lb", "annual-roster"),
      "Max / Bow Depth": spec("25\"", "year-specific-secondary-source"),
      "Max HP": spec("90", "year-specific-secondary-source"),
      "Persons": spec("5", "year-specific-secondary-source"),
      "Capacity Weight": spec("1,300 lb", "year-specific-secondary-source"),
      "Fuel Capacity": spec("24 gal", "year-specific-secondary-source"),
      "Layout": spec("Dual-console walk-through windshield", "model-identity-verified"),
      "Construction": spec("All-welded aluminum modified-V/deep-V family", "manufacturer-family-verified")
    }, [era(hawk160Id, "2004-2005", 2004, 2005, 4000, 8000, packageBasis)], [
      "https://www.jdpower.com/boats/2004/fisher-boats/power-boats",
      "https://www.boats.za.net/boat-specs.aspx?boat=Fisher-Hawk-160-WT-2005&bt=40676"
    ]),
    generation(hawk160Id, "2006-2007", "2006-2007 Hawk 160 WT", 2006, 2007, "year-specific-generation", "The 2006-2007 rosters raise dry weight to about 1,345 lb. The 2007 sheet publishes the 74-inch bottom width, 0.090-inch hull thickness and 22-inch depth.", "https://www.boats.za.net/fisher/hawk-160-wt/fisher-hawk-160-wt-2007", {
      "Length": spec("16'2\""),
      "Beam": spec("92\""),
      "Chine / Bottom Width": spec("74\""),
      "Dry Hull Weight": spec("1,345 lb"),
      "Max / Bow Depth": spec("22\""),
      "Max HP": spec("90"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,300 lb"),
      "Fuel Capacity": spec("24 gal"),
      "Bottom Thickness": spec("0.090\""),
      "Layout": spec("Dual-console walk-through windshield", "model-identity-verified"),
      "Construction": spec("All-welded aluminum modified-V")
    }, [era(hawk160Id, "2006-2007", 2006, 2007, 5000, 10000, packageBasis)], [
      "https://www.jdpower.com/boats/2006/fisher-boats",
      "https://www.jdpower.com/boats/2007/fisher-boats"
    ])
  ]
});

const hawk170WtId = "boat:Fisher | Hawk 170 WT";
const hawk170Wt = configureBoat({
  baseId: fisherBase,
  id: hawk170WtId,
  manufacturer: "Fisher",
  model: "Hawk 170 WT",
  subtitle: "2005-2008 documented WT trim; 2006 wider-hull change separated",
  lowPrice: 5000,
  highPrice: 12000,
  sourceUrl: "https://www.boats.za.net/fisher/hawk-170-wt/fisher-hawk-170-wt-2005",
  layout: "Factory walk-through windshield fishing trim",
  bigWater: "Very good for two or three; workable for four",
  practicalHp: "90-150",
  placement: "Strong Primary candidate: welded 17'4-inch platform with a full windshield and useful cockpit depth.",
  notes: "Fisher listed the Hawk 170 WT separately from the Hawk 170 Sport. The 2005 WT is a 94-inch-beam, 125-hp boat; the 2006-2008 WT uses the wider 98-inch family hull and should not be blended backward.",
  research: "The separate WT identity and its 2005 versus 2006-2008 hull dimensions were retained; it is not merged with the Sport trim.",
  imageNote: "Existing Fisher Hawk-family image used as a stand-in; verify WT versus Sport badging and seating.",
  generations: [
    generation(hawk170WtId, "2005", "2005 Hawk 170 WT", 2005, 2005, "year-specific-generation", "The 2005 WT sheet publishes the narrower 94-inch beam, 1,400-lb hull and 125-hp maximum.", "https://www.boats.za.net/fisher/hawk-170-wt/fisher-hawk-170-wt-2005", {
      "Length": spec("17'4\""),
      "Beam": spec("94\""),
      "Chine / Bottom Width": spec("74\""),
      "Dry Hull Weight": spec("1,400 lb"),
      "Max / Bow Depth": spec("25\""),
      "Max HP": spec("125"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,530 lb"),
      "Fuel Capacity": spec("30 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(hawk170WtId, "2005", 2005, 2005, 5000, 9000, packageBasis)]),
    generation(hawk170WtId, "2006-2008", "2006-2008 wider Hawk 170 WT", 2006, 2008, "year-specific-generation", "Later year sheets document the wider 98-inch family hull, 82-inch bottom, 1,400-lb dry weight and 150-hp ceiling.", "https://www.boats.za.net/fisher/hawk-170-wt", {
      "Length": spec("17'4\""),
      "Beam": spec("98\""),
      "Chine / Bottom Width": spec("82\""),
      "Dry Hull Weight": spec("1,400 lb"),
      "Max / Bow Depth": spec("27\"", "2008-year-sheet"),
      "Deadrise": spec("19°", "2008-year-sheet"),
      "Max HP": spec("150"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,650 lb"),
      "Fuel Capacity": spec("30 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(hawk170WtId, "2006-2008", 2006, 2008, 6000, 12000, packageBasis)], [
      "https://www.jdpower.com/boats/2006/fisher-boats",
      "https://www.jdpower.com/boats/2007/fisher-boats",
      "https://www.jdpower.com/boats/2008/fisher-boats"
    ])
  ]
});

const hawk170SportId = "boat:Fisher | Hawk 170 Sport";
const hawk170Sport = configureBoat({
  baseId: fisherBase,
  id: hawk170SportId,
  manufacturer: "Fisher",
  model: "Hawk 170 Sport",
  subtitle: "2004-2008 separate Sport trim; 2006 wider-hull change separated",
  lowPrice: 5000,
  highPrice: 12500,
  sourceUrl: "https://www.boats.za.net/fisher/hawk-170-sport",
  layout: "Factory dual-console walk-through windshield with sport/family seating",
  bigWater: "Very good hull; sport seating can reduce open fishing room",
  practicalHp: "90-150",
  placement: "Primary hull geometry, but the Sport interior is less fishing-efficient than the WT trim.",
  notes: "The Sport and WT were separate Fisher roster entries. The Sport carries more family-oriented seating and should not be treated as an alias for the WT. Verify cockpit openness before buying for four-person trolling.",
  research: "Annual rosters and year sheets establish a separate 2004-2008 Sport trim with a 2006 beam and hull-family change.",
  imageNote: "Fisher Hawk-family stand-in; the Sport seating layout must be confirmed from listing photos.",
  generations: [
    generation(hawk170SportId, "2004-2005", "2004-2005 narrow Hawk 170 Sport", 2004, 2005, "year-specific-generation", "The 2004-2005 Sport sheets publish the 17'4-inch, 94-inch-beam, 1,450-lb configuration with a 125-hp maximum.", "https://www.boats.za.net/compare/fisher/hawk-170-sport/fisher-hawk-170-sport-2004--vs--fisher/hawk-170-sport/fisher-hawk-170-sport-2005", {
      "Length": spec("17'4\""),
      "Beam": spec("94\""),
      "Chine / Bottom Width": spec("74\"", "2005-year-sheet"),
      "Dry Hull Weight": spec("1,450 lb"),
      "Max / Bow Depth": spec("25\"", "2005-year-sheet"),
      "Max HP": spec("125"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,530 lb"),
      "Fuel Capacity": spec("30 gal"),
      "Bottom Thickness": spec("0.100\"", "2005-year-sheet"),
      "Layout": spec("Dual-console walk-through windshield with sport seating"),
      "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
    }, [era(hawk170SportId, "2004-2005", 2004, 2005, 5000, 9000, packageBasis)], [
      "https://www.jdpower.com/boats/2004/fisher-boats/hawk-170-sport_/10228327/specs",
      "https://rnr-marine.com/auto/Fisher_Hawk-170-Sport--WT-dual-console%2C-OB_%282004-2008%29.shtml"
    ]),
    generation(hawk170SportId, "2006-2008", "2006-2008 wider Hawk 170 Sport", 2006, 2008, "published-hp-conflict-generation", "The Sport moves to the 98-inch family hull. Published maximum horsepower is 150 in 2006 and 2008 but 135 in the retained 2007 sheet, so the annual distinction is preserved.", "https://www.boats.za.net/fisher/hawk-170-sport/fisher-hawk-170-sport-2008", {
      "Length": spec("17'4\""),
      "Beam": spec("98\""),
      "Chine / Bottom Width": spec("82\""),
      "Dry Hull Weight": spec("1,400 lb"),
      "Max / Bow Depth": spec("27\""),
      "Deadrise": spec("19°"),
      "Max HP": spec("150 (2006 and 2008); 135 published for 2007", "year-specific-conflict"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,650 lb"),
      "Fuel Capacity": spec("30 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Layout": spec("Dual-console walk-through windshield with sport seating"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(hawk170SportId, "2006-2008", 2006, 2008, 6000, 12500, packageBasis)], [
      "https://www.boats.za.net/fisher/hawk-170-sport/fisher-hawk-170-sport-2006",
      "https://www.boats.za.net/fisher/hawk-170-sport"
    ])
  ]
});

const avenger16Id = "boat:Fisher | 16 Pro Avenger WT";
const avenger16 = configureBoat({
  baseId: fisherBase,
  id: avenger16Id,
  manufacturer: "Fisher",
  model: "16 Pro Avenger WT",
  subtitle: "2006-2008 compact Pro Avenger WT; annual weight and horsepower changes separated",
  lowPrice: 4500,
  highPrice: 9500,
  sourceUrl: "https://www.boats.za.net/fisher/16-pro-avenger-wt",
  layout: "Factory walk-through windshield fishing layout",
  bigWater: "Adequate nearshore for two; narrow and compact for four",
  practicalHp: "60-75",
  placement: "Budget-friendly Primary-size option, but its 85-inch beam is materially narrower than stronger Lake Superior candidates.",
  notes: "This is the 16 Pro Avenger WT, not the side-console 160 Pro Avenger. The annual rosters show 1,225 lb in 2006-2007 and 1,194 lb in 2008; the 2006 maximum was 60 hp before the later 75-hp rating.",
  research: "The exact WT identity and annual roster changes were reconciled for 2006-2008.",
  imageNote: "Fisher-family stand-in; confirm the Pro Avenger WT windshield and interior from the listing.",
  generations: [
    generation(avenger16Id, "2006", "2006 16 Pro Avenger WT", 2006, 2006, "annual-roster-and-year-sheet", "The 2006 roster lists a 1,225-lb WT package; the year sheet reports a 60-hp maximum.", "https://www.jdpower.com/boats/2006/fisher-boats", {
      "Length": spec("16-foot class", "annual-roster"),
      "Beam": spec("85\"", "year-specific-secondary-source"),
      "Dry Hull Weight": spec("1,225 lb", "annual-roster"),
      "Max HP": spec("60", "year-specific-secondary-source"),
      "Persons": spec("5", "year-specific-secondary-source"),
      "Fuel Capacity": spec("24 gal", "year-specific-secondary-source"),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(avenger16Id, "2006", 2006, 2006, 4500, 8000, packageBasis)]),
    generation(avenger16Id, "2007", "2007 16 Pro Avenger WT", 2007, 2007, "annual-roster-generation", "The 2007 roster retains the 1,225-lb hull while the published maximum rises to 75 hp.", "https://www.jdpower.com/boats/2007/fisher-boats", {
      "Length": spec("16-foot class", "annual-roster"),
      "Beam": spec("85\"", "year-specific-secondary-source"),
      "Dry Hull Weight": spec("1,225 lb", "annual-roster"),
      "Max HP": spec("75", "year-specific-secondary-source"),
      "Persons": spec("5", "year-specific-secondary-source"),
      "Fuel Capacity": spec("24 gal", "year-specific-secondary-source"),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(avenger16Id, "2007", 2007, 2007, 5000, 9000, packageBasis)]),
    generation(avenger16Id, "2008", "2008 lighter published 16 Pro Avenger WT", 2008, 2008, "annual-roster-generation", "The 2008 roster lowers published dry weight to 1,194 lb while retaining the WT model and 75-hp family rating.", "https://www.jdpower.com/boats/2008/fisher-boats", {
      "Length": spec("16-foot class", "annual-roster"),
      "Beam": spec("85\"", "year-specific-secondary-source"),
      "Dry Hull Weight": spec("1,194 lb", "annual-roster"),
      "Max HP": spec("75", "year-specific-secondary-source"),
      "Persons": spec("5", "year-specific-secondary-source"),
      "Fuel Capacity": spec("24 gal", "year-specific-secondary-source"),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(avenger16Id, "2008", 2008, 2008, 5500, 9500, packageBasis)])
  ]
});

const avenger17Id = "boat:Fisher | 17 Pro Avenger WT";
const avenger17 = configureBoat({
  baseId: fisherBase,
  id: avenger17Id,
  manufacturer: "Fisher",
  model: "17 Pro Avenger WT",
  subtitle: "2006-2008 Pro Avenger WT; 2008 published weight drop separated",
  lowPrice: 5500,
  highPrice: 11000,
  sourceUrl: "https://www.boats.za.net/fisher/17-pro-avenger-wt",
  layout: "Factory walk-through windshield fishing layout",
  bigWater: "Good to very good for two or three; workable for four",
  practicalHp: "90-135",
  placement: "Strong budget-era candidate with useful 17'4-inch length, though narrower and less refined than top-tier Primary boats.",
  notes: "The annual rosters call this both 17 Pro Avenger WT and 170 Pro Avenger WT. The 2006-2007 boats are listed at 1,450 lb, while 2008 drops to 1,325 lb; that change is retained rather than averaged.",
  research: "Annual 2006-2008 rosters and exact-model specification sheets were reconciled, including the 17/170 naming variation.",
  imageNote: "Fisher-family stand-in; confirm the exact Pro Avenger WT trim and seating.",
  generations: [
    generation(avenger17Id, "2006-2007", "2006-2007 17/170 Pro Avenger WT", 2006, 2007, "annual-roster-generation", "The 2006 and 2007 rosters list the WT at 1,450 lb. The exact 2006 sheet supplies the 17'4-inch length, 92-inch beam, 74-inch bottom, 30-gallon tank and 135-hp maximum.", "https://www.boats.za.net/fisher/17-pro-avenger-wt/fisher-17-pro-avenger-wt-2006", {
      "Length": spec("17'4\""),
      "Beam": spec("92\""),
      "Chine / Bottom Width": spec("74\""),
      "Dry Hull Weight": spec("1,450 lb"),
      "Max HP": spec("135"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,530 lb"),
      "Fuel Capacity": spec("30 gal"),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(avenger17Id, "2006-2007", 2006, 2007, 5500, 10000, packageBasis)], [
      "https://www.jdpower.com/boats/2006/fisher-boats",
      "https://www.jdpower.com/boats/2007/fisher-boats"
    ]),
    generation(avenger17Id, "2008", "2008 lighter published 17/170 Pro Avenger WT", 2008, 2008, "annual-roster-generation", "The 2008 annual roster retains the WT but lowers published dry weight to 1,325 lb.", "https://www.jdpower.com/boats/2008/fisher-boats", {
      "Length": spec("17'4\"", "family-continuation"),
      "Beam": spec("92\"", "family-continuation"),
      "Chine / Bottom Width": spec("74\"", "family-continuation"),
      "Dry Hull Weight": spec("1,325 lb", "annual-roster"),
      "Max HP": spec("135", "family-continuation"),
      "Persons": spec("5", "family-continuation"),
      "Capacity Weight": spec("1,530 lb", "family-continuation"),
      "Fuel Capacity": spec("30 gal", "family-continuation"),
      "Layout": spec("Factory walk-through windshield"),
      "Construction": spec("All-welded aluminum deep-V")
    }, [era(avenger17Id, "2008", 2008, 2008, 6000, 11000, packageBasis)])
  ]
});

const trophy166Id = "boat:Ultracraft (Misty Harbor) | Trophy 166W / 166W";
const trophy166 = configureBoat({
  baseId: ultraBase,
  id: trophy166Id,
  manufacturer: "Ultracraft (Misty Harbor)",
  model: "Trophy 166W / 166W",
  subtitle: "2007-2008 Trophy 166W and documented 2010 166W; no invented continuous 2006-2012 run",
  lowPrice: 5000,
  highPrice: 11000,
  sourceUrl: "https://www.boats.za.net/ultracraft",
  layout: "Factory dual-console/windshield compact fishing layout",
  bigWater: "Fair nearshore for two; too narrow for four-person Superior fishing",
  practicalHp: "50-75",
  placement: "Secondary despite target length: the 80-inch beam is substantially narrower than preferred big-water candidates.",
  notes: "The earlier roster audit overstated this as a continuous 2006-2012 family. Retained model indexes support Trophy 166W in 2007-2008 and a model named simply 166W in 2010. No 2006, 2009, 2011 or 2012 W year is claimed here.",
  research: "The Trophy and shortened-name evidence is split honestly. The exact dry weight of the 2007-2008 W trim was not recovered, so it is not borrowed from the single-console 166C.",
  imageNote: "Existing Ultracraft family image used as a stand-in; exact Trophy 166W/166W layout must be verified.",
  generations: [
    generation(trophy166Id, "2007-2008-trophy", "2007-2008 Trophy 166W roster and family-hull evidence", 2007, 2008, "roster-and-family-hull-evidence", "Annual indexes document the Trophy 166W in 2007-2008. The factory Trophy 166 family brochure supports the 16'6-inch, 80-inch-beam, riveted hull, but the exact W-trim dry weight was not recovered and is left unpublished.", "https://www.boats.za.net/ultracraft", {
      "Length": spec("16'6\"", "factory-family-hull"),
      "Beam": spec("80\"", "factory-family-hull"),
      "Dry Hull Weight": spec("Not recovered for the W trim; do not substitute the 166C weight", "not-published"),
      "Max / Bow Depth": spec("32\"", "factory-family-hull"),
      "Transom Height": spec("20\"", "factory-family-hull"),
      "Max HP": spec("75", "family-and-roster-evidence"),
      "Persons": spec("5", "family-and-roster-evidence"),
      "Capacity Weight": spec("1,320 lb", "factory-family-hull"),
      "Fuel Capacity": spec("16 gal", "factory-family-hull"),
      "Side / Freeboard Thickness": spec("0.080\"", "factory-family-hull"),
      "Layout": spec("Dual-console/windshield W trim", "model-identity-verified"),
      "Construction": spec("Riveted aluminum modified-V with treated plywood decking", "factory-family-brochure")
    }, [era(trophy166Id, "2007-2008", 2007, 2008, 5000, 9000, packageBasis)], [
      "https://www.littlegullmarina.ca/wordpress/wp-content/uploads/Ultracraft-boats.pdf",
      "https://www.boatcovers.com/product_info1.php?cPath=1_185&products_id=4462&sc_products_id=174"
    ]),
    generation(trophy166Id, "2010-166w", "2010 Ultracraft 166W exact published row", 2010, 2010, "year-specific-generation", "The retained 2010 sheet documents the shortened 166W name and exact 790-lb, 75-hp configuration. It does not prove continuous production through 2012.", "https://www.boats.za.net/ultracraft/166w", {
      "Length": spec("16'6\""),
      "Beam": spec("80\""),
      "Dry Hull Weight": spec("790 lb"),
      "Max / Bow Depth": spec("32\""),
      "Transom Height": spec("20\""),
      "Max HP": spec("75"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,320 lb"),
      "Fuel Capacity": spec("16 gal"),
      "Side / Freeboard Thickness": spec("0.080\""),
      "Layout": spec("Dual-console/windshield W trim", "model-identity-verified"),
      "Construction": spec("Riveted aluminum modified-V; verify exact deck and transom condition", "family-continuation")
    }, [era(trophy166Id, "2010", 2010, 2010, 6000, 11000, packageBasis)])
  ]
});

const additions = [hawk160, hawk170Sport, hawk170Wt, avenger16, avenger17, trophy166];
const additionIds = new Set(additions.map(entry => entry.id));
boats = boats.filter(entry => !additionIds.has(entry.id));
const insertAfterManufacturer = (manufacturer, entries) => {
  let index = -1;
  for (let i = 0; i < boats.length; i += 1) if (boats[i].manufacturer === manufacturer) index = i;
  if (index < 0) throw new Error(`Manufacturer group not found: ${manufacturer}`);
  boats.splice(index + 1, 0, ...entries);
};
insertAfterManufacturer("Fisher", additions.filter(entry => entry.manufacturer === "Fisher"));
insertAfterManufacturer("Ultracraft (Misty Harbor)", additions.filter(entry => entry.manufacturer === "Ultracraft (Misty Harbor)"));

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) throw new Error("Could not locate canonical boat array wrapper");
fs.writeFileSync(boatsPath, `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`);

const gaps = JSON.parse(fs.readFileSync(gapPath, "utf8"));
const resolve = (manufacturer, models, stableIds, note) => {
  const entry = gaps.manufacturers.find(item => item.manufacturer === manufacturer);
  if (!entry) throw new Error(`Gap manifest manufacturer missing: ${manufacturer}`);
  entry.missingModels = (entry.missingModels || []).filter(item => !models.includes(item.model));
  entry.resolvedModels ||= [];
  entry.resolvedModels = entry.resolvedModels.filter(item => !stableIds.includes(item.stableId));
  entry.resolvedModels.push(...stableIds.map(stableId => ({ stableId, resolvedInBatch: "used-market-missing-models-1", note })));
};
resolve("Fisher", ["Hawk 160 WT", "Hawk 170 Sport / WT", "Pro Avenger 160 WT", "Pro Avenger 17 WT"], [hawk160Id, hawk170SportId, hawk170WtId, avenger16Id, avenger17Id], "Added with corrected separate model identities, year boundaries, specifications and generation-contained pricing.");
resolve("Ultracraft (Misty Harbor)", ["Trophy 166W"], [trophy166Id], "Added with 2007-2008 and 2010 evidence rows; the former unsupported continuous 2006-2012 claim was rejected.");
gaps.candidateModelCount = gaps.manufacturers.reduce((sum, entry) => sum + (entry.missingModels || []).length, 0);
fs.writeFileSync(gapPath, `${JSON.stringify(gaps, null, 2)}\n`);

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/used-market-missing-models-1.json", `${JSON.stringify({ added: additions.map(entry => ({ id: entry.id, manufacturer: entry.manufacturer, model: entry.model, generations: entry.designGenerations.map(g => [g.startYear, g.endYear]) })), remainingCandidateGaps: gaps.candidateModelCount }, null, 2)}\n`);
console.log(`Added ${additions.length} boat records and reduced the missing-model candidate list to ${gaps.candidateModelCount}.`);
