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
  if (!boat) throw new Error(`Missing expected Ultracraft record: ${id}`);
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
const packageBasis = "Current used complete-package screening estimate. Motor age, trailer condition, floor/transom condition, canvas, kicker and electronics can move an individual package outside the range.";
const rosterUrl = "https://www.boats.za.net/ultracraft";
const brochureUrl = "https://pdf.nauticexpo.com/pdf/misty-harbor/ultracraftbrochure/20877-41153.html";

const stealth169 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 169W");
stealth169.model = "Stealth 169W / 169W";
stealth169.displayName = "Ultracraft (Misty Harbor) | Stealth 169W / 169W";
stealth169.subtitle = "2006-2012 roster-verified Stealth 169W / 169W family";
stealth169.lowPrice = 5500;
stealth169.highPrice = 13000;
stealth169.priceBasis = "Roster-contained complete-package screening ranges. The 2009 naming change is an evidence boundary, not a claimed hull redesign.";
stealth169.sourceUrl = brochureUrl;
stealth169.valueEras = [];
setDetail(stealth169, "Model Years / Era", "2006-2008 Stealth 169W; 2009-2012 169W continuation");
setDetail(stealth169, "Length", "16'9\"");
setDetail(stealth169, "Beam", "86\"");
setDetail(stealth169, "Practical Working HP", "75-90");
setDetail(stealth169, "Notes", "The annual Ultracraft index continues this dual-console family through 2012 under the shortened 169W name. The evidence does not establish a 2009 hull redesign, so the app shows a naming/evidence boundary rather than inventing one. It remains light and narrow for four-person Lake Superior use.");
setDetail(stealth169, "Research Status", "Roster-checked for this relevant family through 2012. The earlier audit incorrectly stopped at 2008 because it failed to reconcile the later 169W roster name.");
stealth169.designGenerations = [
  generation(
    stealth169.id,
    "2006-2008-stealth",
    "2006-2008 Stealth 169W factory-brochure era",
    2006,
    2008,
    "factory-brochure-era",
    "The Misty Harbor Ultracraft brochure and annual index document the Stealth 169W. This is the branded Stealth era, not proof of a physical break after 2008.",
    brochureUrl,
    {
      "Length": spec("16'9\""),
      "Beam": spec("86\""),
      "Max / Bow Depth": spec("38\" bow height"),
      "Stern Height": spec("32\""),
      "Deadrise": spec("13°"),
      "Transom Height": spec("20\""),
      "Dry Hull Weight": spec("870 lb"),
      "Persons": spec("6"),
      "Capacity Weight": spec("1,400 lb"),
      "Fuel Capacity": spec("24 gal"),
      "Bottom / Side Thickness": spec("0.160\" bow/bottom; 0.080\" sides"),
      "Max HP": spec("90"),
      "Construction": spec("Riveted aluminum deep-V with treated plywood decking", "factory-brochure")
    },
    [era(stealth169.id, "2006-2008", 2006, 2008, 5500, 11000, packageBasis)],
    [rosterUrl]
  ),
  generation(
    stealth169.id,
    "2009-2012-169w",
    "2009-2012 169W annual-roster continuation",
    2009,
    2012,
    "annual-roster-continuation",
    "The annual Ultracraft model index lists a 169W for every model year from 2009 through 2012. Surviving records retain the same 16'9-inch, 86-inch, 90-hp family identity. This row records the naming/evidence transition and does not claim a redesign.",
    rosterUrl,
    {
      "Length": spec("16'9\"", "annual-database-family"),
      "Beam": spec("86\"", "annual-database-family"),
      "Dry Hull Weight": spec("870 lb", "annual-database-family"),
      "Max HP": spec("90", "annual-database-family"),
      "Persons": spec("6", "annual-database-family"),
      "Capacity Weight": spec("1,400 lb", "annual-database-family"),
      "Fuel Capacity": spec("24 gal", "annual-database-family"),
      "Layout": spec("Dual consoles with walk-through windshield", "family-continuation"),
      "Construction": spec("Aluminum deep-V; earlier family brochure documents riveted construction and treated plywood decking, so verify the exact later boat", "family-continuation-not-reverified")
    },
    [era(stealth169.id, "2009-2012", 2009, 2012, 7000, 13000, packageBasis)],
    [
      "https://www.bestcovers.com/products/2012-ultracraft-stealth-169-w-bestfit-300-boat-cover"
    ]
  )
];
stealth169.generationWarning = "The 2009 boundary reflects a published model-name transition from Stealth 169W to 169W, not a proven hull redesign. Verify the HIN, capacity plate, floor and exact construction on any listing.";

const stealth178 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 178W");
stealth178.model = "Stealth 178W / 178W";
stealth178.displayName = "Ultracraft (Misty Harbor) | Stealth 178W / 178W";
stealth178.subtitle = "2006-2012 roster-verified Stealth 178W / 178W family with published spec conflicts retained";
stealth178.lowPrice = 6500;
stealth178.highPrice = 17000;
stealth178.priceBasis = "Roster-contained complete-package screening ranges. Later well-rigged examples can exceed the project ceiling.";
stealth178.sourceUrl = brochureUrl;
stealth178.valueEras = [];
setDetail(stealth178, "Model Years / Era", "2006-2008 Stealth 178W; 2009-2012 178W continuation");
setDetail(stealth178, "Length", "17'8\"");
setDetail(stealth178, "Beam", "Published conflict: 94\" factory brochure; 95\" year-specific records");
setDetail(stealth178, "Practical Working HP", "90-115");
setDetail(stealth178, "Placement Reason", "Secondary, but physically strong: the 17'8-inch, roughly 95-inch, 1,120-lb, 115-hp hull is the better Ultracraft fit for nearshore Superior. Carpeted plywood and scarce legacy support remain drawbacks.");
setDetail(stealth178, "Notes", "The annual model index continues the hull through 2012 as 178W, while surviving cover fitment and the photographed 2010 listing retain Stealth 178 W branding. Published sources conflict on beam, bow height and deadrise; the app now shows those conflicts rather than selecting the convenient figures.");
setDetail(stealth178, "Research Status", "Roster-checked for this relevant family through 2012. The earlier audit incorrectly stopped at 2008 and overstated certainty about conflicting factory-brochure and year-specific dimensions.");
stealth178.designGenerations = [
  generation(
    stealth178.id,
    "2006-2008-stealth",
    "2006-2008 Stealth 178W conflicting published evidence",
    2006,
    2008,
    "published-conflict-era",
    "The factory-style brochure and year-specific specification records agree on the core 17'8-inch, 1,120-lb, 115-hp identity but conflict on beam, bow height, deadrise and transom options. Both published values are retained.",
    brochureUrl,
    {
      "Length": spec("17'8\""),
      "Beam": spec("94\" factory brochure; 95\" year-specific records", "published-source-conflict"),
      "Max / Bow Depth": spec("44\" factory brochure; 36\" year-specific records", "published-source-conflict"),
      "Stern Height": spec("28\""),
      "Deadrise": spec("13° factory brochure; 15° year-specific records", "published-source-conflict"),
      "Transom Height": spec("20\" or 25\" factory brochure; 20\" year-specific record", "published-source-conflict"),
      "Dry Hull Weight": spec("1,120 lb"),
      "Persons": spec("6"),
      "Capacity Weight": spec("1,500 lb"),
      "Fuel Capacity": spec("24 gal"),
      "Bottom / Side Thickness": spec("0.170\" bow/bottom; 0.090\" sides", "factory-brochure"),
      "Max HP": spec("115"),
      "Construction": spec("Riveted aluminum deep-V with treated plywood decking", "factory-brochure")
    },
    [era(stealth178.id, "2006-2008", 2006, 2008, 6500, 13000, packageBasis)],
    [
      rosterUrl,
      "https://www.boats.za.net/boat-specs.aspx?boat=Ultracraft-Stealth-178W-2008&bt=30126"
    ]
  ),
  generation(
    stealth178.id,
    "2009-2012-178w",
    "2009-2012 178W annual-roster continuation",
    2009,
    2012,
    "annual-roster-continuation",
    "The annual Ultracraft index lists a 178W for every model year from 2009 through 2012. Year-specific records publish the same core weight and horsepower while using 95-inch beam, 36-inch bow height and 15-degree deadrise. A photographed 2010 hull and fitment data retain Stealth 178 W branding, so this is treated as continuation rather than a new unrelated model.",
    rosterUrl,
    {
      "Length": spec("17'8\"", "year-specific-records"),
      "Beam": spec("95\"", "year-specific-records"),
      "Max / Bow Depth": spec("36\" bow height", "year-specific-records"),
      "Stern Height": spec("28\"", "year-specific-records"),
      "Deadrise": spec("15°", "year-specific-records"),
      "Transom Height": spec("20\"", "year-specific-records"),
      "Dry Hull Weight": spec("1,120 lb", "year-specific-records"),
      "Persons": spec("6", "year-specific-records"),
      "Capacity Weight": spec("1,500 lb", "year-specific-records"),
      "Fuel Capacity": spec("24 gal", "year-specific-records"),
      "Max HP": spec("115", "year-specific-records"),
      "Construction": spec("Aluminum deep-V; Stealth-family continuity is documented, but inspect the exact rivets, floor and transom", "family-continuation-not-reverified")
    },
    [era(stealth178.id, "2009-2012", 2009, 2012, 9000, 17000, packageBasis)],
    [
      "https://www.boats.za.net/compare/ultracraft/178w/ultracraft-178w-2010--vs--ultracraft/modified-vee-jon-2070mvd/ultracraft-modified-vee-jon-2070mvd-2006",
      "https://bestcovers.com/products/2010-ultracraft-stealth-178-w-bestfit-300-boat-cover",
      "https://bestcovers.com/products/2012-ultracraft-stealth-178-w-bestfit-300-boat-cover"
    ]
  )
];
stealth178.generationWarning = "The 2009 boundary records a model-name/evidence transition, not a proven hull redesign. Published 178W dimensions conflict; verify the HIN, capacity plate and measured beam on the actual boat.";

for (const boat of [stealth169, stealth178]) {
  boat.designGenerations.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
}

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) throw new Error("Could not locate canonical boat array wrapper");
const output = `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`;
fs.writeFileSync(boatsPath, output);
console.log("Reopened Ultracraft and restored 169W/178W roster coverage through 2012.");
