import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const testsPath = "tests/qa.mjs";
const reportPath = "research/alumacraft-dominator-navigator-generation-audit-2006-2012.md";
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(boatsPath, "utf8"), sandbox, { filename: boatsPath });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Boat data did not load");

const SPEC_LABELS = new Set([
  "Length", "Beam", "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth",
  "Cockpit / Interior Depth", "Deadrise", "Transom Height", "Transom Width", "Max HP",
  "Persons", "Capacity Weight", "Fuel Capacity", "Bottom Thickness",
  "Side / Freeboard Thickness", "Construction"
]);

const urls = Object.fromEntries([2006,2007,2008,2009,2010,2011,2012].map(year => {
  const yy = String(year).slice(-2);
  const decade = year < 2010 ? "2000-2009" : "2010-2019";
  return [year, `https://www.alumacraft.com/original-content/content/dam/global/en/alumacraft/catalogs/${decade}/Catalogs/ALUMA-MY${yy}-Catalog-ENUS.pdf`];
}));

const find = id => {
  const boat = boats.find(entry => entry.id === id);
  if (!boat) throw new Error(`Missing record: ${id}`);
  return boat;
};

const setDetail = (boat, label, value) => {
  boat.details ||= [];
  const existing = boat.details.find(item => item.label === label);
  if (existing) existing.value = value;
  else boat.details.push({ label, value });
};

const spec = (value, confidence = "factory-exact") => ({ value, confidence });
const specs = values => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, spec(value)]));
const era = (id, label, startYear, endYear, low, high) => ({
  id,
  label,
  startYear,
  endYear,
  low,
  high,
  basis: "Used complete-package screening estimate; limited to the selected factory-documented hull snapshot"
});
const unresolved = (boat, label = "Earlier advertised years through 2005 — unresolved") => ({
  id: `${boat.id}:gen:pre-2006-unresolved`,
  label,
  startYear: null,
  endYear: 2005,
  status: "unresolved",
  specificationBasis: "Factory tables for these earlier advertised years have not yet been reconciled. No later specifications or prices are inherited.",
  sourceUrl: boat.sourceUrl || null,
  specs: {},
  eras: []
});
const generation = (boat, key, label, startYear, endYear, basis, sourceYears, values, eras) => ({
  id: `${boat.id}:gen:${key}`,
  label,
  startYear,
  endYear,
  status: "factory-documented-snapshot",
  specificationBasis: basis,
  sourceUrl: urls[sourceYears.at(-1)],
  evidenceUrls: sourceYears.map(year => urls[year]),
  specs: specs(values),
  eras
});

function prepare(boat, subtitle, notes, sourceYear) {
  boat.subtitle = subtitle;
  boat.sourceUrl = urls[sourceYear];
  boat.valueEras = [];
  boat.generationWarning = "Select the listing's documented year range. Alumacraft changed dimensions, capacity certification, fuel capacity, hull plating, or model identity across this family; no adjacent-year substitution is allowed.";
  for (const item of boat.details || []) if (SPEC_LABELS.has(item.label)) item.value = "Varies by selected hull generation";
  setDetail(boat, "Model Years / Era", subtitle);
  setDetail(boat, "Notes", notes);
  setDetail(boat, "Research Status", "Official Alumacraft annual catalog tables reconciled for 2006 through 2012. Unverified earlier years remain specification- and price-free.");
  boat.priceBasis = "Generation-specific used complete-package screening estimate. Choose the documented factory year range before pricing.";
}

const dom165 = find("boat:Alumacraft | Dominator 165 Sport");
prepare(dom165, "2006, 2007, and 2008–2011 factory snapshots; earlier years unresolved", "The 2006 165 is a 16'7-inch, 90-inch-beam hull. The 2007 table changes it to 16'8 inches and 91 inches wide with higher capacity and different plating. The 2008–2011 hull dimensions remain stable, while fuel and equipment differ from 2007. The 2012 catalog replaces the Dominator name with Competitor; do not apply 2012 Competitor specifications to a Dominator.", 2011);
dom165.lowPrice = 3500;
dom165.highPrice = 8500;
dom165.designGenerations = [
  unresolved(dom165),
  generation(dom165, "2006", "2006 factory specification", 2006, 2006, "2006 Alumacraft Dominator 165 Sport factory table.", [2006], {
    "Length":"16'7\"", "Beam":"90\"", "Dry Hull Weight":"1,250 lb", "Max / Bow Depth":"42\"", "Cockpit / Interior Depth":"21.4\"", "Transom Height":"20\"", "Transom Width":"90\"", "Max HP":"90", "Persons":"5", "Capacity Weight":"700 lb", "Fuel Capacity":"23 gal", "Bottom Thickness":"0.098\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow second plate"
  }, [era(`${dom165.id}:value:2006`, "2006", 2006, 2006, 3500, 6000)]),
  generation(dom165, "2007", "2007 factory specification", 2007, 2007, "2007 Alumacraft Dominator 165 Sport factory table; dimensions, capacity, fuel, and bottom plating differ from 2006 and 2008.", [2007], {
    "Length":"16'8\"", "Beam":"91\"", "Dry Hull Weight":"1,250 lb", "Max / Bow Depth":"42\"", "Cockpit / Interior Depth":"22\"", "Transom Height":"20\"", "Transom Width":"91\"", "Max HP":"90", "Persons":"5", "Capacity Weight":"1,100 lb", "Fuel Capacity":"22 gal", "Bottom Thickness":"0.100\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow second plate"
  }, [era(`${dom165.id}:value:2007`, "2007", 2007, 2007, 3500, 6000)]),
  generation(dom165, "2008-2011", "2008–2011 documented hull specification", 2008, 2011, "The 2008, 2009, 2010, and 2011 factory tables repeat the same core 165 Sport hull dimensions, capacity, weight, fuel, and plating. Interior/livewell equipment can vary by catalog year.", [2008,2009,2010,2011], {
    "Length":"16'8\"", "Beam":"91\"", "Dry Hull Weight":"1,250 lb", "Max / Bow Depth":"42\"", "Cockpit / Interior Depth":"22\"", "Transom Height":"20\"", "Transom Width":"91\"", "Max HP":"90", "Persons":"5", "Capacity Weight":"1,100 lb", "Fuel Capacity":"20 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow second plate"
  }, [
    era(`${dom165.id}:value:2008-2009`, "2008–2009", 2008, 2009, 3500, 6000),
    era(`${dom165.id}:value:2010-2011`, "2010–2011", 2010, 2011, 5500, 8500)
  ])
];

const dom175 = find("boat:Alumacraft | Dominator 175 Sport");
prepare(dom175, "2006, 2007, 2008–2010, and 2011 factory snapshots; earlier years unresolved", "The 2006 Dominator 175 is a smaller 17'5-inch, 93-inch-beam hull. It changes materially for 2007 to 17'9 inches and 94 inches wide. The 2008–2010 tables reduce depth and fuel from the 2007 values. The 2011 table retains the core hull but changes passenger/load certification. The 2012 catalog replaces Dominator with Competitor.", 2011);
dom175.lowPrice = 5000;
dom175.highPrice = 11000;
dom175.designGenerations = [
  unresolved(dom175),
  generation(dom175, "2006", "2006 factory specification", 2006, 2006, "2006 Alumacraft Dominator 175 Sport factory table.", [2006], {
    "Length":"17'5\"", "Beam":"93\"", "Dry Hull Weight":"1,415 lb", "Max / Bow Depth":"41\"", "Cockpit / Interior Depth":"22.5\"", "Transom Height":"25\"", "Transom Width":"93\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"740 lb", "Fuel Capacity":"40 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and 0.060-inch aft-bottom second plates"
  }, [era(`${dom175.id}:value:2006`, "2006", 2006, 2006, 5000, 8500)]),
  generation(dom175, "2007", "2007 factory specification", 2007, 2007, "2007 Alumacraft Dominator 175 Sport factory table; materially larger than the 2006 hull.", [2007], {
    "Length":"17'9\"", "Beam":"94\"", "Dry Hull Weight":"1,482 lb", "Max / Bow Depth":"44\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"94\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"1,245 lb", "Fuel Capacity":"40 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [era(`${dom175.id}:value:2007`, "2007", 2007, 2007, 5000, 8500)]),
  generation(dom175, "2008-2010", "2008–2010 documented hull specification", 2008, 2010, "The 2008, 2009, and 2010 factory tables repeat this specification set.", [2008,2009,2010], {
    "Length":"17'9\"", "Beam":"94\"", "Dry Hull Weight":"1,482 lb", "Max / Bow Depth":"43\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"94\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"1,245 lb", "Fuel Capacity":"38 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [
    era(`${dom175.id}:value:2008-2009`, "2008–2009", 2008, 2009, 5000, 8500),
    era(`${dom175.id}:value:2010`, "2010", 2010, 2010, 7000, 11000)
  ]),
  generation(dom175, "2011", "2011 factory specification", 2011, 2011, "2011 factory table retains the 2008–2010 hull dimensions but changes certified capacity from five persons/1,245 lb to six persons/1,370 lb.", [2011], {
    "Length":"17'9\"", "Beam":"94\"", "Dry Hull Weight":"1,482 lb", "Max / Bow Depth":"43\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"94\"", "Max HP":"150", "Persons":"6", "Capacity Weight":"1,370 lb", "Fuel Capacity":"38 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [era(`${dom175.id}:value:2011`, "2011", 2011, 2011, 7000, 11000)])
];

const dom185 = find("boat:Alumacraft | Dominator 185 Sport (Secondary; 175 is Primary)");
prepare(dom185, "2011 factory model only; replaced by Competitor 185 for 2012", "Alumacraft labels the Dominator 185 as new for 2011. The 2012 factory catalog no longer lists a Dominator series and instead lists Competitor 185 models. The previous broad 2000s–2010s identity was incorrect.", 2011);
dom185.lowPrice = 8000;
dom185.highPrice = 12500;
dom185.designGenerations = [
  generation(dom185, "2011", "2011 factory specification", 2011, 2011, "2011 Alumacraft catalog identifies the 185 as new for 2011.", [2011], {
    "Length":"18'9\"", "Beam":"94\"", "Dry Hull Weight":"1,530 lb", "Max / Bow Depth":"43\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"94\"", "Max HP":"150", "Persons":"6", "Capacity Weight":"1,600 lb", "Fuel Capacity":"38 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [era(`${dom185.id}:value:2011`, "2011", 2011, 2011, 8000, 12500)])
];

const nav175 = find("boat:Alumacraft | Navigator Sport 175");
prepare(nav175, "2006, 2007, 2008–2010, and 2011 factory snapshots; earlier years unresolved", "The 2006 Navigator 175 Sport is a 17'6-inch, 93-inch-beam hull. The 2007 model changes to 17'8 inches and 95 inches wide with substantially greater depth. The 2008–2010 tables retain those core dimensions but reduce fuel capacity. The 2011 table changes certified load capacity. Navigator disappears from the 2012 catalog and is replaced by Competitor; do not substitute Competitor specifications.", 2011);
nav175.lowPrice = 4500;
nav175.highPrice = 9500;
nav175.designGenerations = [
  unresolved(nav175),
  generation(nav175, "2006", "2006 factory specification", 2006, 2006, "2006 Alumacraft Navigator 175 Sport factory table.", [2006], {
    "Length":"17'6\"", "Beam":"93\"", "Dry Hull Weight":"1,345 lb", "Max / Bow Depth":"39\"", "Cockpit / Interior Depth":"22\"", "Transom Height":"25\"", "Transom Width":"93\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"1,345 lb", "Fuel Capacity":"40 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [era(`${nav175.id}:value:2006`, "2006", 2006, 2006, 4500, 7500)]),
  generation(nav175, "2007", "2007 factory specification", 2007, 2007, "2007 factory table documents the larger 17'8-inch, 95-inch-beam Navigator hull.", [2007], {
    "Length":"17'8\"", "Beam":"95\"", "Dry Hull Weight":"1,357 lb", "Max / Bow Depth":"43\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"93\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"1,245 lb", "Fuel Capacity":"40 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [era(`${nav175.id}:value:2007`, "2007", 2007, 2007, 4500, 7500)]),
  generation(nav175, "2008-2010", "2008–2010 documented hull specification", 2008, 2010, "The 2008, 2009, and 2010 factory tables repeat this specification set.", [2008,2009,2010], {
    "Length":"17'8\"", "Beam":"95\"", "Dry Hull Weight":"1,357 lb", "Max / Bow Depth":"43\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"93\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"1,245 lb", "Fuel Capacity":"38 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [
    era(`${nav175.id}:value:2008-2009`, "2008–2009", 2008, 2009, 4500, 7500),
    era(`${nav175.id}:value:2010`, "2010", 2010, 2010, 6000, 9500)
  ]),
  generation(nav175, "2011", "2011 factory specification", 2011, 2011, "2011 factory table retains the 2008–2010 core hull but changes certified load capacity to 1,370 lb.", [2011], {
    "Length":"17'8\"", "Beam":"95\"", "Dry Hull Weight":"1,357 lb", "Max / Bow Depth":"43\"", "Cockpit / Interior Depth":"23\"", "Transom Height":"25\"", "Transom Width":"93\"", "Max HP":"150", "Persons":"5", "Capacity Weight":"1,370 lb", "Fuel Capacity":"38 gal", "Bottom Thickness":"0.080\"", "Side / Freeboard Thickness":"0.080\"", "Construction":"Riveted 2XB aluminum; 0.080-inch bow and aft-bottom second plates"
  }, [era(`${nav175.id}:value:2011`, "2011", 2011, 2011, 6000, 9500)])
];

fs.writeFileSync(boatsPath, `window.BOATBUILDER_BOATS = ${JSON.stringify(boats, null, 2)};\n`);

let tests = fs.readFileSync(testsPath, "utf8");
const marker = "const competitor175 = item(\"boat:Alumacraft | Competitor 175 Sport / FSX\");";
const block = `// Alumacraft Dominator/Navigator detailed factory audit.\nconst dom165Audit = item(\"boat:Alumacraft | Dominator 165 Sport\");\nassert.equal(dom165Audit.designGenerations.length, 4, \"Dominator 165 factory snapshots are incomplete\");\nassert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Length?.value, \"16'7\\\"\", \"2006 Dominator 165 length is wrong\");\nassert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.[\"Bottom Thickness\"]?.value, \"0.100\\\"\", \"2007 Dominator 165 plating is wrong\");\nassert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2008)?.endYear, 2011, \"Dominator 165 2008-2011 span is missing\");\n\nconst dom175Audit = item(\"boat:Alumacraft | Dominator 175 Sport\");\nassert.equal(dom175Audit.designGenerations.length, 5, \"Dominator 175 factory snapshots are incomplete\");\nassert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Length?.value, \"17'5\\\"\", \"2006 Dominator 175 length is wrong\");\nassert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.[\"Max / Bow Depth\"]?.value, \"44\\\"\", \"2007 Dominator 175 depth is wrong\");\nassert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.Persons?.value, \"6\", \"2011 Dominator 175 capacity change is missing\");\n\nconst dom185Audit = item(\"boat:Alumacraft | Dominator 185 Sport (Secondary; 175 is Primary)\");\nassert.equal(dom185Audit.designGenerations.length, 1, \"Dominator 185 should be limited to its 2011 factory model\");\nassert.equal(dom185Audit.designGenerations[0].startYear, 2011, \"Dominator 185 does not start in 2011\");\nassert.doesNotMatch(dom185Audit.subtitle, /2000s/i, \"Dominator 185 retained the false 2000s identity\");\n\nconst nav175Audit = item(\"boat:Alumacraft | Navigator Sport 175\");\nassert.equal(nav175Audit.designGenerations.length, 5, \"Navigator 175 factory snapshots are incomplete\");\nassert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Beam?.value, \"93\\\"\", \"2006 Navigator beam is wrong\");\nassert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.Beam?.value, \"95\\\"\", \"2007 Navigator redesign beam is wrong\");\nassert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.[\"Capacity Weight\"]?.value, \"1,370 lb\", \"2011 Navigator capacity change is missing\");\nassert.ok(nav175Audit.designGenerations.every(g => g.startYear !== 2012), \"Navigator incorrectly inherited 2012 Competitor specifications\");\n\n`;
if (!tests.includes("// Alumacraft Dominator/Navigator detailed factory audit.")) {
  if (!tests.includes(marker)) throw new Error("QA insertion marker not found");
  tests = tests.replace(marker, block + marker);
  fs.writeFileSync(testsPath, tests);
}

const report = `# Alumacraft Dominator and Navigator generation audit — 2006–2012\n\n## Canonical corrections\n\n- **Dominator 165 Sport:** separated into 2006, 2007, and 2008–2011 factory specification sets, plus an unresolved pre-2006 span.\n- **Dominator 175 Sport:** separated into 2006, 2007, 2008–2010, and 2011 factory specification sets, plus an unresolved pre-2006 span.\n- **Dominator 185 Sport:** narrowed to the 2011 factory model. Alumacraft explicitly introduced the 185 as new for 2011.\n- **Navigator Sport 175:** separated into 2006, 2007, 2008–2010, and 2011 factory specification sets, plus an unresolved pre-2006 span.\n- The 2012 catalog uses the **Competitor** name and materially different specifications. No 2012 Competitor specification is inherited by a Dominator or Navigator record.\n\n## Important documented changes\n\n| Model | Transition | Factory-table change |\n|---|---|---|\n| Dominator 165 Sport | 2006 to 2007 | 16'7\"/90\" becomes 16'8\"/91\"; capacity, fuel, and bottom plating change |\n| Dominator 165 Sport | 2007 to 2008 | fuel changes from 22 to 20 gal; bottom plating changes from 0.100 to 0.080 in |\n| Dominator 175 Sport | 2006 to 2007 | 17'5\"/93\" becomes 17'9\"/94\"; depth, capacity, weight, and aft-bottom plate change |\n| Dominator 175 Sport | 2007 to 2008 | depth changes from 44 to 43 in; fuel changes from 40 to 38 gal |\n| Dominator 175 Sport | 2010 to 2011 | certified capacity changes from 5 persons/1,245 lb to 6 persons/1,370 lb |\n| Navigator 175 Sport | 2006 to 2007 | 17'6\"/93\"/39\" depth becomes 17'8\"/95\"/43\" depth |\n| Navigator 175 Sport | 2007 to 2008 | fuel changes from 40 to 38 gal |\n| Navigator 175 Sport | 2010 to 2011 | certified load changes from 1,245 to 1,370 lb |\n\n## Official evidence\n\n${[2006,2007,2008,2009,2010,2011,2012].map(year => `- ${year}: ${urls[year]}`).join("\n")}\n\nThe annual factory tables were compared visually. Exact repeated hull sets were grouped only when the core dimensions, dry hull weight, horsepower, fuel, plating, and capacity table supported doing so. Earlier advertised years remain unpriced and carry no specifications until their catalogs are reconciled.\n`;
fs.writeFileSync(reportPath, report);
console.log("Applied detailed Alumacraft Dominator/Navigator generation audit");
