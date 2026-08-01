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
  if (!boat) throw new Error(`Missing expected Polar Kraft record: ${id}`);
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

const frontier = requireBoat("boat:Polar Kraft | Frontier 179 WT");
frontier.subtitle = "2012-2023 documented production; published weight changes separated";
frontier.lowPrice = 7000;
frontier.highPrice = 22000;
frontier.priceBasis = "Generation-contained used complete-package screening estimates. Select the listing year before judging value.";
frontier.valueEras = [];
setDetail(frontier, "Model Years / Era", "2012-2023 documented production; 2012, 2013-2017, 2018-2019 and 2020-2023 evidence generations separated");
setDetail(frontier, "Notes", "A strong physical match for the project. The published hull weight drops from 1,282 lb in 2012 to 1,240 lb for 2013-2017 and 1,130 lb for 2018-2019, so those years are not blended into one fictional generation.");
setDetail(frontier, "Research Status", "Annual model rosters, a factory brochure, Yamaha's exact 2019 performance bulletin and the retained 2023 factory page were reconciled. No unresolved catch-all row remains.");
frontier.designGenerations = [
  generation(frontier.id, "2012", "2012 early Frontier 179 WT roster", 2012, 2012, "annual-roster-partial", "The 2012 valuation roster establishes the exact V179 WT identity and 1,282-lb published weight. Complete certification-table details were not recovered.", "https://www.jdpower.com/boats/2012/polar-kraft", {
    "Length": spec("18-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,282 lb", "annual-roster"),
    "Construction": spec("Riveted aluminum deep-V", "factory-series-verified")
  }, [era(frontier.id, "2012", 2012, 2012, 7000, 10000, packageBasis)], ["https://www.jdpower.com/boats/2012/polar-kraft"]),
  generation(frontier.id, "2013-2017", "2013-2017 factory-brochure / 1,240-lb roster generation", 2013, 2017, "factory-generation-partial", "The 2013 factory brochure establishes the Frontier 179 WT configuration and riveted reverse-chine construction; annual rosters retain a 1,240-lb published weight through 2017.", "https://pdf.nauticexpo.com/pdf/aquaspirit/2013-pok-frontier-179-wt/22309-61367.html", {
    "Length": spec("17'11\"", "factory-brochure"),
    "Beam": spec("99\"", "factory-brochure"),
    "Dry Hull Weight": spec("1,240 lb", "annual-roster"),
    "Max HP": spec("150", "factory-brochure"),
    "Fuel Capacity": spec("23 gal", "factory-brochure"),
    "Construction": spec("Riveted aluminum reverse-chine deep-V; three-piece double-riveted seams", "factory-brochure")
  }, [
    era(frontier.id, "2013-2014", 2013, 2014, 7500, 11000, packageBasis),
    era(frontier.id, "2015-2017", 2015, 2017, 8500, 13500, packageBasis)
  ], ["https://www.jdpower.com/boats/2013/polar-kraft", "https://www.jdpower.com/boats/2017/polar-kraft"]),
  generation(frontier.id, "2018-2019", "2018-2019 1,130-lb WT / WTJ generation", 2018, 2019, "cited-generation", "Annual rosters show the 1,130-lb change in 2018 and 2019. Yamaha's 2019 exact-model performance bulletin confirms the 17'11-inch, 99-inch-beam, 150-hp, 23-gallon configuration.", "https://yamahaoutboards.com/outboards/v-max-sho/v-max-in-line-4/vf115/pb_polar-kraft_frontier-179-wt_vf115la_8-28-19_alm", {
    "Length": spec("17'11\""),
    "Beam": spec("99\""),
    "Dry Hull Weight": spec("1,130 lb"),
    "Max HP": spec("150"),
    "Fuel Capacity": spec("23 gal"),
    "Construction": spec("Riveted aluminum reverse-chine deep-V", "factory-series-verified")
  }, [era(frontier.id, "2018-2019", 2018, 2019, 9500, 14500, packageBasis)], ["https://www.jdpower.com/boats/2018/polar-kraft", "https://www.jdpower.com/boats/2019/polar-kraft"]),
  generation(frontier.id, "2020-2023", "2020-2023 retained factory-page generation", 2020, 2023, "factory-current-page", "The retained Polar Kraft model page identifies the 2023 Frontier 179 WT Jump and publishes its core hull dimensions and ratings. A dry hull weight is not published on that page, so none is borrowed from 2019.", "https://www.polarkraft.com/model/details/Frontier-179-WT-Jump", {
    "Length": spec("17'11\"", "factory-exact"),
    "Beam": spec("99\"", "factory-exact"),
    "Chine / Bottom Width": spec("82.5\"", "factory-exact"),
    "Dry Hull Weight": spec("Not published", "factory-not-published"),
    "Deadrise": spec("15° bow / 11° transom", "factory-exact"),
    "Transom Height": spec("20\"", "factory-exact"),
    "Max HP": spec("150", "factory-exact"),
    "Persons": spec("6", "factory-exact"),
    "Fuel Capacity": spec("23 gal", "factory-exact"),
    "Bottom Thickness": spec("0.125\" one-piece bottom", "factory-exact"),
    "Construction": spec("Riveted aluminum; three-piece double-riveted seams", "factory-exact")
  }, [era(frontier.id, "2020-2023", 2020, 2023, 13000, 22000, packageBasis)])
];

const v180 = requireBoat("boat:Polar Kraft | Kodiak Sport V180 (Primary; Outlander 2010 WT is Secondary)");
v180.subtitle = "2011-2015 verified Kodiak Sport V180 FS production; replaced by V185 FS for 2016";
v180.lowPrice = 5500;
v180.highPrice = 12000;
v180.priceBasis = "Generation-contained 2011-2015 complete-package estimate; do not apply it to the later V185 FS.";
v180.valueEras = [];
setDetail(v180, "Model Years / Era", "2011-2015 verified V180 FS production; 2016 roster changes to V185 FS");
setDetail(v180, "Notes", "This is the actual 18-foot Kodiak Sport fish-and-ski, not the 20'11-inch Outlander 2010 WT. The prior broad 2000-2019 row has been removed, and construction is recorded as riveted rather than welded.");
setDetail(v180, "Interior Material Basis", "Kodiak Sport factory-family brochure and exact-model annual rosters; verify trim-specific flooring.");
setDetail(v180, "Research Status", "Annual 2011-2015 rosters were reconciled. The 2016 roster changes the 18-foot Kodiak Sport to V185 FS, closing the V180 production span.");
v180.designGenerations = [generation(v180.id, "2011-2015", "2011-2015 Kodiak Sport V180 FS generation", 2011, 2015, "annual-roster-generation", "The exact V180 FS is present in annual 2011-2015 rosters at 1,338 lb. The 2016 roster replaces it with the V185 FS; specifications are not carried across that model change.", "https://www.jdpower.com/boats/2012/polar-kraft/v180/32024479/specs", {
  "Length": spec("18'0\""),
  "Beam": spec("92\""),
  "Dry Hull Weight": spec("1,338 lb"),
  "Max / Bow Depth": spec("About 39\"", "cited-source-approximate"),
  "Cockpit / Interior Depth": spec("About 25\"", "cited-source-approximate"),
  "Transom Height": spec("25\""),
  "Max HP": spec("150"),
  "Persons": spec("6"),
  "Capacity Weight": spec("About 1,500 lb", "cited-source-approximate"),
  "Fuel Capacity": spec("About 30 gal", "cited-source-approximate"),
  "Construction": spec("Riveted aluminum reverse-chine deep-V", "factory-series-verified")
}, [
  era(v180.id, "2011-2012", 2011, 2012, 5500, 9000, packageBasis),
  era(v180.id, "2013-2015", 2013, 2015, 7000, 12000, packageBasis)
], ["https://www.jdpower.com/boats/2011/polar-kraft", "https://www.jdpower.com/boats/2013/polar-kraft", "https://www.jdpower.com/boats/2015/polar-kraft", "https://www.jdpower.com/boats/2016/polar-kraft"] )];

const v170 = requireBoat("boat:Polar Kraft | Kodiak V170 FS");
v170.model = "Kodiak Sport 170 FS";
v170.displayName = "Polar Kraft | Kodiak Sport 170 FS";
v170.subtitle = "2011 and 2013-2019 documented production; 1,300-lb and 1,360-lb rows separated";
v170.lowPrice = 5000;
v170.highPrice = 13000;
v170.priceBasis = "Generation-contained complete-package estimates. A listing represented as a 2012 V170 FS needs HIN/model verification because the annual roster does not show that model.";
v170.valueEras = [];
setDetail(v170, "Model Years / Era", "2011 first V170 FS roster; 2013-2019 Kodiak Sport 170 FS-20 / FS-25 production");
setDetail(v170, "Notes", "The model is properly identified as Kodiak Sport 170 FS. The 2011 1,300-lb record is kept separate from the 1,360-lb 2013-2019 run. A claimed 2012 example needs extra verification rather than inherited specifications.");
setDetail(v170, "Research Status", "The 2011 and 2013-2019 annual rosters plus the 2013 exact-model factory brochure were reconciled. No 2012 V170 FS row was found, so that year is not silently filled.");
v170.designGenerations = [
  generation(v170.id, "2011", "2011 V170 FS first documented roster", 2011, 2011, "annual-roster-partial", "The 2011 roster identifies the V170 FS at 1,300 lb. Complete factory certification details were not recovered for this one-year evidence row.", "https://www.jdpower.com/boats/2011/polar-kraft", {
    "Length": spec("17-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,300 lb", "annual-roster"),
    "Max HP": spec("115", "model-family-verified"),
    "Construction": spec("Riveted aluminum deep-V", "factory-series-verified")
  }, [era(v170.id, "2011", 2011, 2011, 5000, 8000, packageBasis)]),
  generation(v170.id, "2013-2019", "2013-2019 Kodiak Sport 170 FS-20 / FS-25 generation", 2013, 2019, "factory-generation-partial", "The 2013 exact-model factory brochure establishes the Kodiak Sport 170 FS configuration. Annual 2013-2019 rosters consistently publish a 1,360-lb weight and distinguish 20-inch and 25-inch transom packages.", "https://pdf.nauticexpo.com/pdf/aquaspirit/2013-pok-kodiak-sport-170-fs/22309-61371.html", {
    "Length": spec("17'0\"", "factory-brochure"),
    "Beam": spec("About 91\"", "factory-brochure-approximate"),
    "Dry Hull Weight": spec("1,360 lb", "annual-roster"),
    "Max HP": spec("115", "factory-brochure"),
    "Transom Height": spec("20\" or 25\" package", "annual-roster"),
    "Construction": spec("Riveted aluminum reverse-chine deep-V; three-piece double-riveted seams", "factory-brochure")
  }, [
    era(v170.id, "2013-2015", 2013, 2015, 6500, 10000, packageBasis),
    era(v170.id, "2016-2019", 2016, 2019, 8000, 13000, packageBasis)
  ], ["https://www.jdpower.com/boats/2013/polar-kraft", "https://www.jdpower.com/boats/2016/polar-kraft", "https://www.jdpower.com/boats/2019/polar-kraft"])
];

const outlander = requireBoat("boat:Polar Kraft | Outlander 2010 WT (Secondary; not Kodiak V180)");
outlander.subtitle = "2012-2023 documented Outlander 2010 WT production; model number is not a year";
outlander.lowPrice = 10000;
outlander.highPrice = 26000;
outlander.priceBasis = "Generation-contained complete-package estimates. This 21-foot platform is normally above the project's preferred size, tow margin and budget.";
outlander.valueEras = [];
setDetail(outlander, "Model Years / Era", "2012-2023 documented WT production; 2012-2017, 2018-2019 and 2020-2023 evidence generations separated");
setDetail(outlander, "Notes", "The '2010' in the name is a model designation for the 20'11-inch hull, not model year 2010. This is a capable but oversized secondary candidate for the project.");
setDetail(outlander, "Research Status", "Annual rosters, Suzuki's exact 2018 performance test and the retained 2023 factory page were reconciled. The false 2010-only generation was removed.");
outlander.designGenerations = [
  generation(outlander.id, "2012-2017", "2012-2017 first documented Outlander 2010 WT generation", 2012, 2017, "annual-roster-generation", "The WT designation appears in the 2012-2017 annual rosters at a published 1,440-lb weight. Earlier 2010-2011 records use TC rather than WT and are not silently treated as the same model.", "https://www.jdpower.com/boats/2012/polar-kraft", {
    "Length": spec("20'11.5\"", "model-family-verified"),
    "Beam": spec("96\"", "model-family-verified"),
    "Dry Hull Weight": spec("1,440 lb", "annual-roster"),
    "Max HP": spec("200", "model-family-verified"),
    "Transom Height": spec("25\"", "model-family-verified"),
    "Fuel Capacity": spec("23 gal", "model-family-verified"),
    "Construction": spec("Riveted aluminum deep-V", "factory-series-verified")
  }, [
    era(outlander.id, "2012-2014", 2012, 2014, 10000, 14500, packageBasis),
    era(outlander.id, "2015-2017", 2015, 2017, 12000, 17000, packageBasis)
  ], ["https://www.jdpower.com/boats/2017/polar-kraft"]),
  generation(outlander.id, "2018-2019", "2018-2019 revised published-weight generation", 2018, 2019, "cited-generation-with-weight-conflict", "The annual rosters publish 1,530 lb for 2018-2019, while Suzuki's exact 2018 performance test reports 1,440 lb. The conflict is preserved instead of selecting whichever number is convenient.", "https://www.suzukimarine.com/boat-tests/polar-kraft/polar-kraft-outlander-2010-wt/", {
    "Length": spec("20'11.5\""),
    "Beam": spec("96\""),
    "Dry Hull Weight": spec("1,440 lb performance test / 1,530 lb annual roster", "conflicting-cited-sources"),
    "Max HP": spec("200"),
    "Transom Height": spec("25\""),
    "Fuel Capacity": spec("23 gal"),
    "Construction": spec("Riveted aluminum deep-V", "factory-series-verified")
  }, [era(outlander.id, "2018-2019", 2018, 2019, 14000, 19500, packageBasis)], ["https://www.jdpower.com/boats/2018/polar-kraft", "https://www.jdpower.com/boats/2019/polar-kraft"]),
  generation(outlander.id, "2020-2023", "2020-2023 retained factory-page generation", 2020, 2023, "factory-current-page", "The retained 2023 factory page publishes the core hull dimensions, ratings and all-vinyl interior. It does not publish dry hull weight, so the 2018 figures are not inherited.", "https://www.polarkraft.com/model/details/Outlander-2010-WT", {
    "Length": spec("20'11\"", "factory-exact"),
    "Beam": spec("96\"", "factory-exact"),
    "Chine / Bottom Width": spec("76\"", "factory-exact"),
    "Dry Hull Weight": spec("Not published", "factory-not-published"),
    "Deadrise": spec("15° bow / 11° transom", "factory-exact"),
    "Transom Height": spec("25\"", "factory-exact"),
    "Max HP": spec("200", "factory-exact"),
    "Persons": spec("6", "factory-exact"),
    "Fuel Capacity": spec("23 gal", "factory-exact"),
    "Bottom Thickness": spec("0.125\" one-piece bottom", "factory-exact"),
    "Construction": spec("Riveted aluminum; three-piece double-riveted seams", "factory-exact")
  }, [era(outlander.id, "2020-2023", 2020, 2023, 17000, 26000, packageBasis)])
];

for (const boat of [frontier, v180, v170, outlander]) {
  delete boat.generationWarning;
  boat.designGenerations.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
}

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) throw new Error("Could not locate canonical boat array wrapper");
fs.writeFileSync(boatsPath, `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`);
console.log("Applied verified Polar Kraft chronology, naming, construction and pricing repairs.");
