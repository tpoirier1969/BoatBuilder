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
  if (!boat) throw new Error(`Missing expected Fisher record: ${id}`);
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
const packageBasis = "Used complete-package screening estimate; motor age, trailer, structural condition, canvas and electronics can move an individual package outside the range.";

const hawk170 = requireBoat("boat:Fisher | Hawk 170 FS");
hawk170.subtitle = "1997-2002 documented production; 2000 redesign and later weight changes separated";
hawk170.lowPrice = 3000;
hawk170.highPrice = 9500;
hawk170.priceBasis = "Generation-contained used complete-package screening estimates. Confirm the model year and capacity plate before applying a range.";
hawk170.valueEras = [];
hawk170.sourceUrl = "https://www.boats.com/bird-of-prey/";
setDetail(hawk170, "Model Years / Era", "1997-2002 documented outboard production; 1997-1999, 2000 and 2001-2002 evidence generations separated");
setDetail(hawk170, "Notes", "The old 2020 row was a transcription error for a 2000 on-water test. The 1997-1999 hull is listed at 995 lb, while the redesigned 2000 boat is 1,300 lb and the 2001-2002 rosters rise to 1,400-1,450 lb. Do not blend them. The 2000 test also warns that four-person cockpit fishing is cramped; two is excellent and three is workable.");
setDetail(hawk170, "Research Status", "Annual 1997-2002 rosters, exact-fit 1997-1999 canvas evidence and the detailed 2000 on-water test were reconciled. No unresolved catch-all row remains.");
hawk170.designGenerations = [
  generation(hawk170.id, "1997-1999", "1997-1999 early Hawk 170 FS generation", 1997, 1999, "annual-roster-generation", "Annual Fisher rosters consistently list the Hawk 170 FS at 995 lb for 1997-1999, and exact-fit canvas records establish the three-year full-windshield identity. Complete certification-table dimensions were not recovered for this early hull.", "https://www.jdpower.com/boats/1997/fisher-boats", {
    "Length": spec("17-foot class", "annual-roster"),
    "Dry Hull Weight": spec("995 lb", "annual-roster"),
    "Layout": spec("Full walk-through windshield / fish-and-ski", "exact-fit-canvas-evidence"),
    "Max HP": spec("Verify capacity plate; factory packages ranged from 60 to 115 hp", "annual-roster-package-evidence"),
    "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
  }, [era(hawk170.id, "1997-1999", 1997, 1999, 3000, 6500, packageBasis)], [
    "https://www.jdpower.com/boats/1998/fisher-boats",
    "https://www.jdpower.com/boats/1999/fisher-boats",
    "https://rnr-marine.com/auto/Fisher_Hawk-170-FS%2C-OB_%281997-1999%29.shtml"
  ]),
  generation(hawk170.id, "2000", "2000 redesigned Hawk 170 FS on-water test", 2000, 2000, "cited-exact-test", "The detailed 2000 test publishes the redesigned hull, rigged and trailered weights, construction, ratings and capacities. It is not a 2020 boat.", "https://www.boats.com/bird-of-prey/", {
    "Length": spec("17'8\""),
    "Beam": spec("92.75\""),
    "Dry Hull Weight": spec("1,300 lb"),
    "Rigged Test Weight": spec("1,688 lb"),
    "Trailered Test Weight": spec("2,328 lb"),
    "Deadrise": spec("17°"),
    "Max HP": spec("125"),
    "Persons / Capacity": spec("6 persons / 1,300 lb"),
    "Fuel Capacity": spec("30 gal"),
    "Bottom Thickness": spec("0.100\" welded aluminum"),
    "Floor": spec("Aluminum floor"),
    "Construction": spec("All-welded aluminum deep-V")
  }, [era(hawk170.id, "2000", 2000, 2000, 4500, 8000, packageBasis)]),
  generation(hawk170.id, "2001-2002", "2001-2002 later published-weight generation", 2001, 2002, "annual-roster-generation-with-weight-conflict", "The Hawk 170 FS remains in the 2001-2002 line, but published dry weight rises to 1,400 lb in 2001 and 1,450 lb in the 2002 annual roster. A secondary 2002 specification source reports about 1,400 lb, so the conflict is retained rather than averaged away.", "https://www.jdpower.com/boats/2002/fisher-boats", {
    "Length": spec("17'8\" reported for 2002; verify HIN", "secondary-spec-source"),
    "Beam": spec("About 93\" reported for 2002", "secondary-spec-source"),
    "Dry Hull Weight": spec("1,400 lb (2001 roster); 1,450 lb (2002 roster), with about 1,400 lb in a secondary 2002 spec source", "cited-weight-conflict"),
    "Layout": spec("Full walk-through windshield / fish-and-ski", "model-identity-verified"),
    "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
  }, [
    era(hawk170.id, "2001", 2001, 2001, 5000, 8500, packageBasis),
    era(hawk170.id, "2002", 2002, 2002, 5500, 9500, packageBasis)
  ], [
    "https://www.jdpower.com/boats/2001/fisher-boats",
    "https://www.jdpower.com/boats/2002/fisher-boats/hawk-170-fs_/10068980/values",
    "https://www.boats.za.net/boat-specs.aspx?boat=Fisher-Hawk-170-FS-2002&bt=43855"
  ])
];

const hawk186 = requireBoat("boat:Fisher | Hawk 186 FS");
hawk186.subtitle = "2001-2002 documented outboard production; I/O variant excluded";
hawk186.lowPrice = 5500;
hawk186.highPrice = 10000;
hawk186.priceBasis = "Generation-contained estimate for the outboard Hawk 186 FS. The 1,535-lb sterndrive version is a different package and is not included.";
hawk186.valueEras = [];
hawk186.sourceUrl = "https://www.jdpower.com/boats/2002/fisher-boats";
setDetail(hawk186, "Model Years / Era", "2001-2002 documented Hawk 186 FS outboard production");
setDetail(hawk186, "Notes", "The outboard Hawk 186 FS is a short-lived 18'6-inch model at about 1,430 lb bare hull. Fisher also sold an I/O version around 1,535 lb; do not use the I/O weight or drivetrain when evaluating an outboard listing. This is capable but already beyond the project's preferred 17'6-inch size.");
setDetail(hawk186, "Research Status", "The 2001 and 2002 annual rosters plus exact-model secondary dimensions were reconciled. The outboard and I/O variants are explicitly separated, and no unresolved catch-all row remains.");
hawk186.designGenerations = [generation(hawk186.id, "2001-2002-outboard", "2001-2002 Hawk 186 FS outboard generation", 2001, 2002, "cited-outboard-generation", "Annual rosters list the outboard Hawk 186 FS at 1,430 lb in both 2001 and 2002. Exact-model secondary data supplies the 18'6-inch length, 93-inch beam, 37-gallon fuel capacity and six-person rating. The separate I/O package is excluded.", "https://www.jdpower.com/boats/2002/fisher-boats", {
  "Length": spec("18'6\"", "secondary-spec-source"),
  "Beam": spec("93\"", "secondary-spec-source"),
  "Dry Hull Weight": spec("1,430 lb outboard; 1,535 lb I/O variant excluded", "annual-roster"),
  "Max HP": spec("Up to 175 reported; verify capacity plate", "secondary-spec-source"),
  "Persons": spec("6", "secondary-spec-source"),
  "Fuel Capacity": spec("37 gal", "secondary-spec-source"),
  "Layout": spec("Full walk-through windshield / fish-and-ski", "model-identity-verified"),
  "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
}, [
  era(hawk186.id, "2001", 2001, 2001, 5500, 9000, packageBasis),
  era(hawk186.id, "2002", 2002, 2002, 6000, 10000, packageBasis)
], [
  "https://www.jdpower.com/boats/2001/fisher-boats",
  "https://www.jdpower.com/boats/2001/fisher-boats/hawk-186-fs___/10069046/specs",
  "https://www.boats.za.net/boat-specs.aspx?boat=Fisher-Hawk-186-FS-2002&bt=10834",
  "https://www.boats.za.net/fisher/hawk-186-fs-i-o"
])];

const hawk200 = requireBoat("boat:Fisher | Hawk 200 FS");
hawk200.subtitle = "1997-2001 documented production; early narrow and later wide hulls separated";
hawk200.lowPrice = 4500;
hawk200.highPrice = 10000;
hawk200.priceBasis = "Generation-contained used package estimates. This 20-foot platform is generally outside the preferred size and comfortable tow margin.";
hawk200.valueEras = [];
hawk200.sourceUrl = "https://www.boats.com/reviews/boats/small-fishing-boats-and-motors-1998-359/";
setDetail(hawk200, "Model Years / Era", "1997-2001 documented production; 1997-1998, 1999 and 2000-2001 evidence rows separated");
setDetail(hawk200, "Notes", "The early 1997-1998 Hawk 200 FS is a narrower 19'6-inch, 88-inch-beam hull around 1,245 lb. Published weight jumps to 1,560 lb in 1999, and the 2000-2001 version is 19'8 inches with a 98-inch beam at 1,550-1,580 lb. This is not one unchanging five-year hull. It remains Secondary because a fully rigged package can consume most of the Maverick's tow rating.");
setDetail(hawk200, "Research Status", "Annual 1997-2001 rosters, period boats.com specifications and exact-model 2000-2001 secondary dimensions were reconciled. No 2002 Hawk 200 FS appears in the retained roster, and no unresolved catch-all row remains.");
hawk200.designGenerations = [
  generation(hawk200.id, "1997-1998", "1997-1998 early narrow Hawk 200 FS", 1997, 1998, "period-spec-generation", "Period boats.com coverage publishes the early 19'6-inch, 7'4-inch-beam, 150-hp configuration. Annual rosters list a 1,245-lb hull for both 1997 and 1998.", "https://www.boats.com/reviews/boats/small-fishing-boats-and-motors-1998-359/", {
    "Length": spec("19'6\""),
    "Beam": spec("88\""),
    "Dry Hull Weight": spec("1,245 lb", "annual-roster"),
    "Max HP": spec("150"),
    "Layout": spec("Full walk-through windshield / fish-and-ski", "period-model-description"),
    "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
  }, [era(hawk200.id, "1997-1998", 1997, 1998, 4500, 8000, packageBasis)], [
    "https://www.jdpower.com/boats/1997/fisher-boats",
    "https://www.jdpower.com/boats/1998/fisher-boats"
  ]),
  generation(hawk200.id, "1999", "1999 heavier transitional Hawk 200 FS", 1999, 1999, "annual-roster-partial", "The 1999 annual roster raises published dry weight to 1,560 lb. Complete dimensions for that exact year were not recovered, so neither the earlier 88-inch beam nor the later 98-inch beam is silently inherited.", "https://www.jdpower.com/boats/1999/fisher-boats", {
    "Length": spec("20-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,560 lb", "annual-roster"),
    "Layout": spec("Full walk-through windshield / fish-and-ski", "model-identity-verified"),
    "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
  }, [era(hawk200.id, "1999", 1999, 1999, 5000, 8500, packageBasis)]),
  generation(hawk200.id, "2000-2001", "2000-2001 later wide Hawk 200 FS", 2000, 2001, "cited-later-generation", "Exact-model 2000-2001 secondary specifications publish a 19'8-inch length, 98-inch beam, 37-gallon tank and eight-person rating. Annual rosters list 1,550 lb in 2000 and 1,580 lb in 2001.", "https://www.boats.za.net/fisher/hawk-200-fs", {
    "Length": spec("19'8\"", "secondary-spec-source"),
    "Beam": spec("98\"", "secondary-spec-source"),
    "Dry Hull Weight": spec("1,550 lb (2000) / 1,580 lb (2001)", "annual-roster"),
    "Persons": spec("8", "secondary-spec-source"),
    "Fuel Capacity": spec("37 gal", "secondary-spec-source"),
    "Max HP": spec("Capacity plate required; retained databases misparse this field", "not-reliably-published"),
    "Layout": spec("Full walk-through windshield / fish-and-ski", "model-identity-verified"),
    "Construction": spec("All-welded aluminum deep-V", "manufacturer-family-verified")
  }, [
    era(hawk200.id, "2000", 2000, 2000, 5500, 9000, packageBasis),
    era(hawk200.id, "2001", 2001, 2001, 6000, 10000, packageBasis)
  ], [
    "https://www.jdpower.com/boats/2000/fisher-boats",
    "https://www.jdpower.com/boats/2001/fisher-boats",
    "https://www.boats.za.net/boat-specs.aspx?boat=Fisher-Hawk-200-FS-2000&bt=4799",
    "https://www.boats.za.net/boat-specs.aspx?boat=Fisher-Hawk-200-FS-2001&bt=31459"
  ])
];

for (const boat of [hawk170, hawk186, hawk200]) {
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
console.log("Applied verified Fisher Hawk chronology, specification and pricing repairs.");
