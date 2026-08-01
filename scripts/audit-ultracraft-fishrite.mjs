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
  if (!boat) throw new Error(`Missing expected audit record: ${id}`);
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
const packageBasis = "Current used complete-package screening estimate; motor age, trailer, structural condition, canvas, kicker and electronics can move an individual package outside the range.";

const fishRite = requireBoat("boat:Fish-Rite | Stalker 17'6\"");
fishRite.model = "Stalker 17–17'6\" custom-build screening";
fishRite.displayName = "Fish-Rite | Stalker 17–17'6\" custom-build screening";
fishRite.subtitle = "2006 documented 17-foot Stalker example; 17'6-inch listings require direct verification";
fishRite.lowPrice = 10000;
fishRite.highPrice = 22000;
fishRite.priceBasis = "Listing-specific complete-package screening only. Fish-Rite reused the Stalker name and varied hull geometry and outfitting, so select no other year by inference.";
fishRite.sourceUrl = "https://www.smartmarineguide.com/fish_rite-boats-for-sale-in-oregon";
fishRite.valueEras = [];
setDetail(fishRite, "Model Years / Era", "2006 documented 17-foot Stalker listing; seller-described 17'6-inch examples require HIN, measurement and capacity-plate verification");
setDetail(fishRite, "Layout", "Listing-specific fishing configuration; windshield, canvas and interior arrangement vary by build");
setDetail(fishRite, "Length", "Varies by exact build; do not infer from the Stalker name");
setDetail(fishRite, "Practical Working HP", "Documented 2006 package used 60 hp; verify the exact capacity plate");
setDetail(fishRite, "Availability Under $14k", "Occasional, usually older or less-equipped");
setDetail(fishRite, "Placement Reason", "Secondary: excellent welded-hull potential, but inconsistent model naming, regional scarcity and package prices make exact-listing inspection mandatory.");
setDetail(fishRite, "Notes", "Fish-Rite used the Stalker name on different lengths and built configurable welded boats. This record is deliberately a screening aid, not a promise that every Stalker called 17 or 17'6 inches shares dimensions, weight, horsepower or layout.");
setDetail(fishRite, "Interior Material Basis", "Fish-Rite build options vary; verify the exact floor, trays, carpet and welded structure on the listing.");
setDetail(fishRite, "Research Status", "Resolved by disposition: the broad 2000-2019 pseudo-generation was removed. Only a documented 2006 17-foot Stalker example is retained, and 17'6-inch claims must be verified on the boat.");
fishRite.designGenerations = [generation(
  fishRite.id,
  "2006-listing",
  "2006 documented 17-foot Stalker listing example",
  2006,
  2006,
  "listing-specific-evidence",
  "An archived dealer listing documents a 2006 Fish-Rite Stalker sold as a 17-foot boat with a 60-hp four-stroke and extensive fishing equipment. It does not establish a standardized 17'6-inch factory generation, so unreported specifications remain explicitly unverified.",
  "https://www.smartmarineguide.com/fish_rite-boats-for-sale-in-oregon",
  {
    "Length": spec("17' seller-listed; any 17'6\" claim requires direct measurement and HIN verification", "listing-specific"),
    "Beam": spec("Not published for the documented 2006 listing", "not-published"),
    "Dry Hull Weight": spec("Not published for the documented 2006 listing", "not-published"),
    "Max HP": spec("Capacity plate not published; documented package used a 60-hp main", "listing-specific"),
    "Layout": spec("Fishing configuration with options; windshield, canvas and seating vary by build", "manufacturer-family"),
    "Construction": spec("Welded aluminum Fish-Rite family; exact gauge and geometry vary by build", "manufacturer-family")
  },
  [era(fishRite.id, "2006", 2006, 2006, 10000, 22000, packageBasis)],
  [
    "https://fishrite.com/boats/angler/",
    "https://www.boats.za.net/boat-specs.aspx?boat=Fish-Rite-Stalker-Open-Series-2009&bt=40440"
  ]
)];
fishRite.generationWarning = "Use this record only to screen an exact Fish-Rite listing. The Stalker name was reused across different lengths and configurations; verify HIN, measured length, beam, capacity plate, hull gauge, floor and canvas before valuing the boat.";

const stealth169 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 169W");
stealth169.subtitle = "2006-2008 verified Stealth 169W generation; later 169W naming is not inherited";
stealth169.lowPrice = 7000;
stealth169.highPrice = 15500;
stealth169.priceBasis = "Generation-contained current used complete-package estimate. Heavily equipped dealer packages can exceed the project's ceiling.";
stealth169.valueEras = [];
setDetail(stealth169, "Model Years / Era", "2006-2008 verified Stealth 169W production identity");
setDetail(stealth169, "Length", "16'9\"");
setDetail(stealth169, "Beam", "86\"");
setDetail(stealth169, "Practical Working HP", "75–90");
setDetail(stealth169, "Notes", "A light, tow-friendly dual-console fish-and-ski boat. Its 86-inch beam, 13-degree deadrise and carpeted plywood interior make it better for inland lakes and carefully chosen nearshore Superior days than as a four-person big-water-first platform.");
setDetail(stealth169, "Interior Material Basis", "Factory brochure documents treated plywood decking and riveted construction; inspect carpet, floor fasteners and flotation for moisture damage.");
setDetail(stealth169, "Research Status", "The factory brochure and 2006-2008 model rosters were reconciled. Later Ultracraft 169W records are not silently treated as the same Stealth generation.");
stealth169.designGenerations = [generation(
  stealth169.id,
  "2006-2008",
  "2006-2008 Stealth 169W factory generation",
  2006,
  2008,
  "factory-generation",
  "The Misty Harbor Ultracraft brochure publishes the exact Stealth 169W dimensions, ratings and construction. Annual model indexes retain the Stealth 169W identity through 2008; later 169W naming is treated separately rather than inheriting these specifications.",
  "https://www.littlegullmarina.ca/wordpress/wp-content/uploads/Ultracraft-boats.pdf",
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
  [era(stealth169.id, "2006-2008", 2006, 2008, 7000, 15500, packageBasis)],
  [
    "https://www.boats.za.net/ultracraft",
    "https://www.haywardpowersports.com/inventory/2006-ultracraft-stealth-169w-hayward-wi-54843-14452861i"
  ]
)];
stealth169.generationWarning = "Apply these specifications only to a verified 2006-2008 Stealth 169W. Seller-advertised 2005 examples and later models labeled simply 169W require separate HIN and brochure verification.";

const stealth178 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 178W");
stealth178.subtitle = "2006-2008 verified Stealth 178W generation; corrected factory dimensions and ratings";
stealth178.lowPrice = 7500;
stealth178.highPrice = 16000;
stealth178.priceBasis = "Generation-contained current used complete-package estimate; kicker, electronics, canvas and structural condition materially affect value.";
stealth178.valueEras = [];
setDetail(stealth178, "Model Years / Era", "2006-2008 verified Stealth 178W production identity");
setDetail(stealth178, "Length", "17'8\"");
setDetail(stealth178, "Beam", "94\"");
setDetail(stealth178, "Practical Working HP", "90–115");
setDetail(stealth178, "Placement Reason", "Secondary, but physically strong: 17'8 inches, 94-inch beam, 1,120-lb hull and full windshield suit nearshore Superior use; scarcity, carpeted plywood and defunct-model support keep it opportunistic.");
setDetail(stealth178, "Notes", "The factory brochure corrects the old blended numbers: 94-inch beam, 44-inch bow height, 13-degree deadrise and 115-hp rating. It is materially more suitable than the 169W for the intended use, but four-person Superior fishing still depends on weather discipline and total loaded weight.");
setDetail(stealth178, "Interior Material Basis", "Factory brochure documents treated plywood decking and riveted construction; inspect carpet, floor, transom and flotation carefully.");
setDetail(stealth178, "Research Status", "The factory brochure and 2006-2008 model rosters were reconciled. The prior 95-inch beam, 36-inch bow and 15-degree deadrise values were removed as unsupported for this Stealth generation.");
stealth178.designGenerations = [generation(
  stealth178.id,
  "2006-2008",
  "2006-2008 Stealth 178W factory generation",
  2006,
  2008,
  "factory-generation",
  "The Misty Harbor Ultracraft brochure publishes exact Stealth 178W specifications. Annual model indexes retain the Stealth 178W identity through 2008; later models called 178W are not assumed to share this hull without separate evidence.",
  "https://www.littlegullmarina.ca/wordpress/wp-content/uploads/Ultracraft-boats.pdf",
  {
    "Length": spec("17'8\""),
    "Beam": spec("94\""),
    "Max / Bow Depth": spec("44\" bow height"),
    "Stern Height": spec("28\""),
    "Deadrise": spec("13°"),
    "Transom Height": spec("20\" or 25\""),
    "Dry Hull Weight": spec("1,120 lb"),
    "Persons": spec("6"),
    "Capacity Weight": spec("1,500 lb"),
    "Bottom / Side Thickness": spec("0.170\" bow/bottom; 0.090\" sides"),
    "Max HP": spec("115"),
    "Construction": spec("Riveted aluminum deep-V with treated plywood decking", "factory-brochure")
  },
  [era(stealth178.id, "2006-2008", 2006, 2008, 7500, 16000, packageBasis)],
  [
    "https://www.boats.za.net/ultracraft",
    "https://www.boats.za.net/boat-specs.aspx?boat=Ultracraft-Stealth-178W-2008&bt=30126"
  ]
)];
stealth178.generationWarning = "Apply these specifications only to a verified 2006-2008 Stealth 178W. Later Ultracraft models labeled 178W require separate brochure and HIN verification.";

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) {
  throw new Error("Could not locate canonical boat array wrapper");
}

const output = `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`;
fs.writeFileSync(boatsPath, output);
console.log("Applied verified Ultracraft chronology/specification repairs and Fish-Rite custom-build disposition.");
