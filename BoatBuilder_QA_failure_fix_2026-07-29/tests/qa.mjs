import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const appSource = read("app.js");
const htmlSource = read("index.html");
const cssSource = read("styles.css");
const boatsSource = read("data/boats.js");
const equipmentSource = read("data/equipment.js");
const catalogSource = read("data/catalog.js");

const sandbox = { window: {} };
vm.runInNewContext(boatsSource, sandbox, { filename: "data/boats.js" });
vm.runInNewContext(equipmentSource, sandbox, { filename: "data/equipment.js" });
vm.runInNewContext(catalogSource, sandbox, { filename: "data/catalog.js" });
const catalog = sandbox.window.BOATBUILDER_DATA;
const item = id => catalog.items.find(entry => entry.id === id);

assert.ok(catalog, "Catalog global is missing");
assert.equal(catalog.source, "BoatBuilder canonical app data", "Catalog source is not the app repository");
assert.ok(Array.isArray(catalog.categories) && catalog.categories.length >= 8, "Expected catalog categories");
assert.ok(Array.isArray(catalog.items) && catalog.items.length > 300, "Catalog is unexpectedly small");

const ids = catalog.items.map(entry => entry.id);
assert.equal(new Set(ids).size, ids.length, "Catalog contains duplicate stable IDs");
assert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");
assert.equal(catalog.counts.items, catalog.items.length, "Catalog item count is stale");
assert.equal(
  catalog.counts.boats,
  catalog.items.filter(entry => entry.categoryId === "boats").length,
  "Catalog boat count is stale"
);
assert.equal(
  catalog.counts.equipment,
  catalog.items.filter(entry => entry.categoryId !== "boats").length,
  "Catalog equipment count is stale"
);
assert.ok(catalog.counts.boats >= 170, "Boat catalog shrank below the canonical migration baseline");
assert.ok(catalog.counts.equipment >= 181, "Equipment catalog shrank below the canonical migration baseline");

const requiredIds = [
  "boat:Lund | 1600 Pro Sport",
  "boat:Lund | Adventure Sport 1675",
  "boat:Lund | Alaskan 1800 Sport",
  "boat:Lund | Alaskan 1875 Sport (2024 redesign)",
  "boat:Lund | Impact Sport 1775",
  "boat:Lund | Pro-V 1775 (non-walk-through configurations)",
  "boat:Lund | Tyee 1850 outboard / older 18' Tyee outboard",
  "boat:Lund | Tyee 1850 I/O / ITS (older generation)",
  "boat:Lund | Tyee 1875 Sport (current generation)",
  "boat:Alumacraft | Competitor 165 Sport",
  "boat:Alumacraft | Dominator 175 Sport",
  "boat:Alumacraft | Trophy 175 Sport",
  "boat:Alumacraft | Trophy 185 Sport (Secondary; 175 is Primary)"
];
for (const id of requiredIds) {
  assert.ok(item(id), `Required canonical record is missing: ${id}`);
}
assert.ok(
  !item("boat:Lund | Tyee 1850 / older 18' Tyee"),
  "Mixed-propulsion Tyee umbrella record still exists"
);

// Focused Lund app-model audit.
const lund = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Lund");
assert.equal(lund.length, 28, "Focused Lund app-model scope changed without updating the audit");
assert.ok(
  lund.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more Lund app records lacks canonical design-generation metadata"
);

const adventure = item("boat:Lund | Adventure Sport 1675");
assert.equal(adventure.designGenerations.length, 2, "Adventure 1675 redesign generations are not separated");
assert.match(
  adventure.designGenerations.map(g => g.label).join(" | "),
  /2021[^|]*pre-redesign[^|]*\|[^|]*2024[^|]*wood-free/i,
  "Adventure 1675 does not preserve the 2021 and 2024 redesign split"
);

const oldAlaskan = item("boat:Lund | Alaskan 1800 Sport");
assert.equal(oldAlaskan.designGenerations.length, 2, "Alaskan 1800 documented specification sets are not separated");
assert.match(
  oldAlaskan.designGenerations.map(g => g.label).join(" | "),
  /2003[^|]*\|[^|]*2021/i,
  "Alaskan 1800 does not expose its documented 2003 and 2021 specification sets"
);
assert.equal(oldAlaskan.valueEras.length, 0, "Multi-generation Alaskan retained unsafe top-level value eras");

const impact = item("boat:Lund | Impact Sport 1775");
assert.equal(impact.designGenerations.length, 2, "Non-XS Impact 1775 generations are not separated");
assert.match(impact.details.find(d => d.label === "Notes")?.value || "", /non-XS/i, "Historical Impact record is not protected from Impact XS substitution");

const proV1775 = item("boat:Lund | Pro-V 1775 (non-walk-through configurations)");
assert.equal(proV1775.designGenerations.length, 2, "Pro-V 1775 2000 and 2002 specification sets are not separated");
assert.match(proV1775.designGenerations.map(g => g.label).join(" | "), /2000[^|]*\|[^|]*2002/i, "Pro-V 1775 exact-year split is missing");

const tyeeIo = item("boat:Lund | Tyee 1850 I/O / ITS (older generation)");
assert.equal(tyeeIo.lowPrice, null, "I/O Tyee inherited an unsupported low price");
assert.equal(tyeeIo.highPrice, null, "I/O Tyee inherited an unsupported high price");
assert.equal(tyeeIo.valueEras.length, 0, "I/O Tyee inherited outboard value eras");
assert.equal(tyeeIo.designGenerations.length, 1, "I/O Tyee is not narrowed to one documented package basis");

const currentTyee = item("boat:Lund | Tyee 1875 Sport (current generation)");
assert.match(
  currentTyee.designGenerations[0].specs?.["Dry Hull Weight"]?.value || "",
  /1,760 lb/i,
  "Current Tyee 1875 factory hull weight is missing"
);

// Alumacraft app-model audit batch 1.
const alumacraft = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Alumacraft");
assert.equal(alumacraft.length, 17, "Focused Alumacraft app-model scope changed without updating the audit");
assert.ok(
  alumacraft.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more Alumacraft app record lacks canonical design-generation metadata"
);
assert.ok(
  alumacraft.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0),
  "An Alumacraft record retained unsafe top-level value eras"
);

const alumacraftUnresolved = alumacraft.flatMap(entry =>
  entry.designGenerations
    .filter(generation => generation.status === "unresolved")
    .map(generation => ({ entry, generation }))
);
assert.equal(alumacraftUnresolved.length, 10, "Alumacraft exact-plus-unresolved record count changed");
for (const { entry, generation } of alumacraftUnresolved) {
  assert.equal(Object.keys(generation.specs || {}).length, 0, `${entry.id} unresolved generation inherited specifications`);
  assert.equal((generation.eras || []).length, 0, `${entry.id} unresolved generation inherited pricing`);
  assert.ok(entry.designGenerations.some(candidate => candidate.status !== "unresolved"), `${entry.id} lacks its exact factory snapshot`);
}

// Alumacraft Dominator/Navigator detailed factory audit.
const dom165Audit = item("boat:Alumacraft | Dominator 165 Sport");
assert.equal(dom165Audit.designGenerations.length, 4, "Dominator 165 factory snapshots are incomplete");
assert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Length?.value, "16'7\"", "2006 Dominator 165 length is wrong");
assert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.["Bottom Thickness"]?.value, "0.100\"", "2007 Dominator 165 plating is wrong");
assert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2008)?.endYear, 2011, "Dominator 165 2008-2011 span is missing");

const dom175Audit = item("boat:Alumacraft | Dominator 175 Sport");
assert.equal(dom175Audit.designGenerations.length, 5, "Dominator 175 factory snapshots are incomplete");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Length?.value, "17'5\"", "2006 Dominator 175 length is wrong");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.["Max / Bow Depth"]?.value, "44\"", "2007 Dominator 175 depth is wrong");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.Persons?.value, "6", "2011 Dominator 175 capacity change is missing");

const dom185Audit = item("boat:Alumacraft | Dominator 185 Sport (Secondary; 175 is Primary)");
assert.equal(dom185Audit.designGenerations.length, 1, "Dominator 185 should be limited to its 2011 factory model");
assert.equal(dom185Audit.designGenerations[0].startYear, 2011, "Dominator 185 does not start in 2011");
assert.doesNotMatch(dom185Audit.subtitle, /2000s/i, "Dominator 185 retained the false 2000s identity");

const nav175Audit = item("boat:Alumacraft | Navigator Sport 175");
assert.equal(nav175Audit.designGenerations.length, 5, "Navigator 175 factory snapshots are incomplete");
assert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Beam?.value, "93\"", "2006 Navigator beam is wrong");
assert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.Beam?.value, "95\"", "2007 Navigator redesign beam is wrong");
assert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.["Capacity Weight"]?.value, "1,370 lb", "2011 Navigator capacity change is missing");
assert.ok(nav175Audit.designGenerations.every(g => g.startYear !== 2012), "Navigator incorrectly inherited 2012 Competitor specifications");

const competitor175 = item("boat:Alumacraft | Competitor 175 Sport / FSX");
assert.equal(competitor175.designGenerations.length, 2, "Competitor 175 exact and unresolved generations are not separated");
assert.match(
  competitor175.details.find(d => d.label === "Notes")?.value || "",
  /Do not substitute the current Competitor 175X/i,
  "Older Competitor 175 is not protected from current X-generation substitution"
);
assert.equal(
  competitor175.designGenerations.find(g => g.status !== "unresolved")?.specs?.Length?.value,
  "17'8\"",
  "Competitor 175 exact 2016 length is missing"
);

const trophy175 = item("boat:Alumacraft | Trophy 175 Sport");
assert.equal(trophy175.designGenerations.length, 2, "Trophy 175 exact and unresolved generations are not separated");
assert.match(
  trophy175.details.find(d => d.label === "Notes")?.value || "",
  /Do not substitute the 2025-present Trophy 175X/i,
  "Older Trophy 175 is not protected from current X-generation substitution"
);

const trophy185 = item("boat:Alumacraft | Trophy 185 Sport (Secondary; 175 is Primary)");
const trophy185Exact = trophy185.designGenerations.find(g => g.status !== "unresolved");
assert.equal(trophy185Exact?.specs?.Length?.value, "18'8\"", "Trophy 185 exact length is wrong");
assert.equal(trophy185Exact?.specs?.Beam?.value, "98\"", "Trophy 185 exact beam is wrong");
assert.equal(trophy185Exact?.specs?.["Dry Hull Weight"]?.value, "1,780 lb", "Trophy 185 exact hull weight is wrong");
assert.equal(trophy185Exact?.specs?.["Max HP"]?.value, "175", "Trophy 185 exact horsepower is wrong");
assert.equal(trophy185Exact?.specs?.["Fuel Capacity"]?.value, "34 gal", "Trophy 185 exact fuel capacity is wrong");

const magnumCs = item("boat:Alumacraft | Magnum CS (side-console series; no walk-through windshield)");
assert.equal(magnumCs.lowPrice, null, "Magnum CS rejection row retained a blended low price");
assert.equal(magnumCs.highPrice, null, "Magnum CS rejection row retained a blended high price");
assert.equal(magnumCs.designGenerations.length, 1, "Magnum CS rejection row has unexpected generations");
assert.equal(magnumCs.designGenerations[0].status, "family-umbrella-rejection", "Magnum CS is not explicitly a family-level rejection row");
assert.match(magnumCs.generationWarning || "", /not one exact boat model/i, "Magnum CS rejection warning is missing");

// Focused Crestliner app-model audit.
const crestliner = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Crestliner");
assert.equal(crestliner.length, 15, "Focused Crestliner app-model scope changed without updating the audit");
assert.ok(
  crestliner.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more Crestliner records lacks canonical design-generation metadata"
);
assert.ok(
  crestliner.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0),
  "A Crestliner record retained unsafe top-level value eras"
);
for (const entry of crestliner) {
  for (const generation of entry.designGenerations) {
    if (generation.status !== "unresolved") continue;
    assert.equal(Object.keys(generation.specs || {}).length, 0, `${entry.id} unresolved generation inherited specifications`);
    assert.equal((generation.eras || []).length, 0, `${entry.id} unresolved generation inherited pricing`);
  }
}

const fishHawk1700 = item("boat:Crestliner | Fish Hawk 1700 WT");
assert.equal(fishHawk1700.designGenerations.find(g => g.startYear === 2007)?.endYear, 2008, "Fish Hawk 1700 2007-2008 factory span is missing");
assert.equal(fishHawk1700.designGenerations.find(g => g.startYear === 2007)?.specs?.["Bottom Thickness"]?.value, "0.090\"", "Fish Hawk 1700 bottom gauge is wrong");

const fishHawk1850 = item("boat:Crestliner | Fish Hawk 1850 WT");
assert.equal(fishHawk1850.designGenerations.length, 3, "Fish Hawk 1850 documented snapshots and unresolved span are not separated");
assert.equal(fishHawk1850.designGenerations.find(g => g.startYear === 2007)?.specs?.["Dry Hull Weight"]?.value, "1,300 lb console / 1,250 lb tiller", "2007 Fish Hawk 1850 weight is wrong");
assert.equal(fishHawk1850.designGenerations.find(g => g.startYear === 2014)?.specs?.["Dry Hull Weight"]?.value, "1,500 lb", "2014 Fish Hawk 1850 weight is missing");

const phantomV160 = item("boat:Crestliner | Phantom Sportfish V160");
const phantomV170 = item("boat:Crestliner | Phantom Sportfish V170");
const phantomV180 = item("boat:Crestliner | Phantom Sportfish V180");
assert.equal(phantomV160.designGenerations[0].specs?.Beam?.value, "78\"", "Phantom V160 beam correction is missing");
assert.equal(phantomV170.designGenerations[0].specs?.Beam?.value, "83\"", "Phantom V170 beam correction is missing");
assert.equal(phantomV180.designGenerations[0].specs?.Beam?.value, "87\"", "Phantom V180 beam correction is missing");
assert.match(phantomV170.designGenerations[0].specs?.["Max HP"]?.value || "", /Verify capacity plate/i, "Phantom horsepower was presented without factory verification");

const sportfish1750 = item("boat:Crestliner | Sportfish 1750");
assert.doesNotMatch(sportfish1750.subtitle, /1992/i, "Sportfish 1750 retained the incorrect 1992 identity");
assert.equal(sportfish1750.designGenerations.find(g => g.startYear === 2004)?.specs?.Beam?.value, "89\"", "2004 Sportfish 1750 snapshot is missing");

const sportfish1850 = item("boat:Crestliner | Sportfish 1850");
assert.equal(sportfish1850.designGenerations.length, 3, "Sportfish 1850 early, unresolved and later generations are not separated");
assert.equal(sportfish1850.designGenerations.find(g => g.startYear === 2007)?.specs?.Length?.value, "18'2\"", "Early Sportfish 1850 length is wrong");
assert.equal(sportfish1850.designGenerations.find(g => g.startYear === 2017)?.specs?.Length?.value, "18'9\" outboard", "2017 Sportfish 1850 length is wrong");
assert.equal(sportfish1850.designGenerations.find(g => g.startYear === 2017)?.specs?.["Dry Hull Weight"]?.value, "1,700 lb outboard", "2017 Sportfish 1850 weight is wrong");

const superHawk1700 = item("boat:Crestliner | Super Hawk 1700 WT");
assert.equal(superHawk1700.designGenerations.find(g => g.startYear === 2008)?.specs?.["Capacity Weight"]?.value, "1,305 lb", "Super Hawk 1700 capacity is wrong");
assert.equal(superHawk1700.designGenerations.find(g => g.startYear === 2008)?.specs?.["Side / Freeboard Thickness"]?.value, "0.090\"", "Super Hawk 1700 side gauge is wrong");

const vision1600 = item("boat:Crestliner | Vision 1600 WT");
const vision1700 = item("boat:Crestliner | Vision 1700 WT");
assert.match(vision1600.subtitle, /^2017 exact factory specification/i, "Vision 1600 source year was not corrected to 2017");
assert.match(vision1700.subtitle, /^2017 exact factory specification/i, "Vision 1700 source year was not corrected to 2017");
assert.ok(vision1600.designGenerations.every(g => g.startYear !== 2015), "Vision 1600 retained an unsupported 2015 snapshot");
assert.ok(vision1700.designGenerations.every(g => g.startYear !== 2015), "Vision 1700 retained an unsupported 2015 snapshot");

const superHawk1600 = item("boat:Crestliner | Super Hawk 1600 WT");
assert.equal(superHawk1600.designGenerations.find(g => g.startYear === 2009)?.specs?.["Capacity Weight"]?.value, "1,295 lb", "2009 Super Hawk 1600 capacity is missing");

// Focused Smoker Craft app-model audit.
const smokerCraft = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Smoker Craft");
assert.equal(smokerCraft.length, 18, "Focused Smoker Craft app-model scope changed without updating the audit");
assert.ok(smokerCraft.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1), "One or more Smoker Craft records lacks canonical generation metadata");
assert.ok(smokerCraft.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0), "A Smoker Craft record retained unsafe top-level value eras");
for (const entry of smokerCraft) {
  for (const generation of entry.designGenerations) {
    if (generation.status !== "unresolved") continue;
    assert.equal(Object.keys(generation.specs || {}).length, 0, `${entry.id} unresolved generation inherited specifications`);
    assert.equal((generation.eras || []).length, 0, `${entry.id} unresolved generation inherited pricing`);
  }
}

const fazer172Audit = item("boat:Smoker Craft | Fazer 172");
assert.equal(fazer172Audit.designGenerations.find(g => g.startYear === 1995)?.specs?.Length?.value, "17'5\"", "1995 Fazer 172 length is wrong");
assert.ok(fazer172Audit.designGenerations.every(g => g.startYear !== 1998), "Fazer 172 retained the unsupported 1998 exact snapshot");

const millentia182Audit = item("boat:Smoker Craft | Millentia 182 WT");
assert.equal(millentia182Audit.designGenerations[0].status, "alias-only", "Millentia 182 was not converted to an alias-only rejection row");
assert.equal(millentia182Audit.lowPrice, null, "Millentia 182 alias retained a low price");
assert.equal(Object.keys(millentia182Audit.designGenerations[0].specs || {}).length, 0, "Millentia 182 alias inherited specifications");

const osprey162Audit = item("boat:Smoker Craft | Osprey 162 WT (Secondary; wide WT version is 2020s)");
assert.equal(osprey162Audit.designGenerations.find(g => g.startYear === 2017)?.specs?.Beam?.value, "90\"", "2017 Osprey 162 beam is missing");
assert.equal(osprey162Audit.designGenerations.find(g => g.startYear === 2025)?.specs?.["Max HP"]?.value, "115", "Current Osprey 162 horsepower is missing");

const osprey172Audit = item("boat:Smoker Craft | Osprey 172 WT (Secondary; qualifying WT is 2020s)");
assert.equal(osprey172Audit.designGenerations.find(g => g.startYear === 2017)?.specs?.Beam?.value, "92\"", "2017 Osprey 172 beam is wrong");
assert.equal(osprey172Audit.designGenerations.find(g => g.startYear === 2025)?.specs?.Beam?.value, "90\"", "Current Osprey 172 beam change is missing");

const phaserAudit = item("boat:Smoker Craft | Phaser (seller spelling; likely Fazer)");
assert.equal(phaserAudit.designGenerations[0].status, "alias-only", "Phaser row is not alias-only");
assert.equal(phaserAudit.lowPrice, null, "Phaser alias retained a price");

const proAngler182Audit = item("boat:Smoker Craft | Pro Angler 182 XL (Secondary; 172/172 XL are Primary)");
assert.equal(proAngler182Audit.designGenerations.find(g => g.startYear === 2018)?.specs?.Length?.value, "18'5\"", "2018 Pro Angler 182 XL length is wrong");
assert.equal(proAngler182Audit.designGenerations.find(g => g.startYear === 2025)?.specs?.Length?.value, "18'2\"", "Current Pro Angler 182 XL length change is missing");

const proMag182Audit = item("boat:Smoker Craft | Pro Mag 182 (Secondary; 172-size alternatives tow easier)");
assert.equal(proMag182Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.["Fuel Capacity"]?.value, "31 gal", "2011 Pro Mag fuel capacity is wrong");
assert.equal(proMag182Audit.designGenerations.find(g => g.startYear === 2018)?.specs?.["Max HP"]?.value, "175", "2018 Pro Mag horsepower change is missing");

const ultima172Audit = item("boat:Smoker Craft | Ultima 172");
assert.equal(ultima172Audit.designGenerations.find(g => g.startYear === 2012)?.specs?.Beam?.value, "91\"", "2012 Ultima 172 beam is wrong");
assert.equal(ultima172Audit.designGenerations.find(g => g.startYear === 2014)?.specs?.Beam?.value, "96\"", "2014 Ultima 172 redesign beam is missing");

const ultima175Audit = item("boat:Smoker Craft | Ultima 175");
assert.equal(ultima175Audit.designGenerations.length, 1, "Ultima 175 should be narrowed to its verified 1995 factory snapshot");
assert.equal(ultima175Audit.designGenerations[0].startYear, 1995, "Ultima 175 retained the false 2017 year");

const ultima178Audit = item("boat:Smoker Craft | Ultima 178");
assert.equal(ultima178Audit.designGenerations[0].status, "model-identity-only", "Ultima 178 should withhold unverified specifications");
assert.equal(ultima178Audit.lowPrice, null, "Ultima 178 retained unsupported pricing");

const ultima182Audit = item("boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-2018-standard"))?.specs?.Length?.value, "18'5\"", "Standard Ultima 182 length is wrong");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-se"))?.specs?.Length?.value, "18'2\"", "Ultima 182SE configuration is missing");

// Focused Sylvan, Starcraft and Starweld app-model audit.
const nextMakers = new Map([["Sylvan",16],["Starcraft",14],["Starweld",3]]);
for (const [maker,count] of nextMakers) {
  const rows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === maker);
  assert.equal(rows.length,count,"Focused " + maker + " app-model scope changed without updating the audit");
  assert.ok(rows.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),maker + " record lacks generation metadata");
  assert.ok(rows.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0),maker + " retained unsafe top-level value eras");
  for (const entry of rows) for (const generation of entry.designGenerations) if (generation.status === "unresolved") {
    assert.equal(Object.keys(generation.specs || {}).length,0,entry.id + " unresolved generation inherited specs");
    assert.equal((generation.eras || []).length,0,entry.id + " unresolved generation inherited price");
  }
}
const sylTroller = item("boat:Sylvan | Sport Troller 1600 TL (Secondary; not Sylvan Pro Sport)");
assert.equal(sylTroller.designGenerations.find(g=>g.startYear===2008)?.specs?.Beam?.value,"69\"","2008 Sport Troller beam is wrong");
assert.equal(sylTroller.designGenerations.find(g=>g.startYear===2009)?.specs?.Beam?.value,"81\"","2009 Sport Troller redesign is missing");
const sylAdv = item("boat:Sylvan | Adventurer 1700 DC");
assert.equal(sylAdv.designGenerations.find(g=>g.startYear===2011)?.specs?.["Dry Hull Weight"]?.value,"1,325 lb","2011 Adventurer weight change is missing");
const sylViper = item("boat:Sylvan | Viper (bass-boat series; no walk-through windshield)");
assert.equal(sylViper.lowPrice,null,"Viper family rejection retained a price");
assert.equal(sylViper.designGenerations[0].status,"family-umbrella-rejection","Viper is not a family rejection");
const sc186 = item("boat:Starcraft | Superfisherman 186 (Secondary; 176 is Primary)");
assert.equal(sc186.designGenerations.find(g=>g.startYear===2014)?.specs?.["Dry Hull Weight"]?.value,"1,333 lb","2014 Superfisherman 186 exact weight is missing");
const stx2050 = item("boat:Starcraft | STX 2050 Aluminum");
assert.equal(stx2050.designGenerations.find(g=>g.startYear===2014)?.specs?.["Dry Hull Weight"]?.value,"1,535 lb","2014 STX weight is wrong");
assert.equal(stx2050.designGenerations.find(g=>g.startYear===2015)?.specs?.["Dry Hull Weight"]?.value,"1,650 lb","2015 STX weight change is missing");
const sw16 = item("boat:Starweld | Fusion 16 DC");
assert.ok(sw16.designGenerations.find(g=>g.startYear===2021)?.eras.every(e=>e.startYear===2021),"Fusion 16 inherited pre-2021 pricing");

// All-manufacturer generation-safety audit.
const allBoats = catalog.items.filter(entry => entry.categoryId === "boats");
assert.ok(
  allBoats.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more app boat record lacks canonical design-generation metadata"
);
for (const entry of allBoats) {
  for (const generation of entry.designGenerations) {
    if (generation.status !== "unresolved") continue;
    assert.equal(Object.keys(generation.specs || {}).length, 0, `${entry.id} unresolved generation inherited specifications`);
    assert.equal((generation.eras || []).length, 0, `${entry.id} unresolved generation inherited pricing`);
  }
}
assert.ok(
  allBoats.filter(entry => entry.manufacturer !== "Lund" && entry.manufacturer !== "Alumacraft").every(entry => entry.valueEras.length === 0),
  "A newly safeguarded manufacturer retained unsafe top-level value eras"
);

const dualImpact = item("boat:MirroCraft | Dual Impact 176");
assert.equal(dualImpact.designGenerations.length, 2, "Dual Impact generations are not stored with the boat data");
assert.doesNotMatch(appSource, /const DD=|,DD=/, "Model-generation data remains embedded in the controller");
assert.match(appSource, /i\.designGenerations/, "Controller does not read canonical design generations");
assert.match(appSource, /i\.valueEras/, "Controller does not read canonical value eras");
assert.ok(!appSource.includes("eras(i).length>1"), "Price decades are still treated as redesign evidence");

assert.ok(appSource.includes("currentEstimate.v5"), "Current estimate storage version is not v5");
assert.ok(appSource.includes("function gens("), "Generation resolver is missing");
assert.ok(appSource.includes("function missing("), "Required generation and era gate is missing");
assert.ok(appSource.includes("function controls("), "Generation, era and trailer controls are missing");
assert.doesNotMatch(appSource, /data-select=/, "Model-list estimate checkbox returned");

assert.match(
  htmlSource,
  /data\/boats\.js[^]*data\/equipment\.js[^]*data\/catalog\.js[^]*app\.js/,
  "Canonical data files do not load before the controller"
);
assert.doesNotMatch(htmlSource, /corrections/i, "A corrections overlay is still loaded");
assert.match(htmlSource, /id="home-button"/, "Home button is missing");
assert.match(htmlSource, /id="estimate-button"/, "Estimate button is missing");
assert.match(htmlSource, /id="clear-estimate-button"/, "Clear estimate button is missing");

assert.match(
  cssSource,
  /\.header-estimate-button\s*\{[^]*?grid-column:\s*2;/,
  "Estimate button is not centered in header column 2"
);
assert.match(
  cssSource,
  /\.clear-estimate-button\s*\{[^]*?grid-column:\s*3;/,
  "Clear estimate is not placed on the right"
);

console.log(
  `BoatBuilder QA passed: ${catalog.items.length} items, ${catalog.counts.boats} boats, ${catalog.counts.equipment} equipment records.`
);
console.log("Verified canonical app data, focused Lund and Alumacraft generations, structured value eras, data-backed hull generations, and no runtime correction overlay.");
