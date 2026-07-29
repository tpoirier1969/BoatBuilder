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
  "One or more Alumacraft app records lacks canonical design-generation metadata"
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
assert.equal(alumacraftUnresolved.length, 11, "Alumacraft exact-plus-unresolved record count changed");
for (const { entry, generation } of alumacraftUnresolved) {
  assert.equal(Object.keys(generation.specs || {}).length, 0, `${entry.id} unresolved generation inherited specifications`);
  assert.equal((generation.eras || []).length, 0, `${entry.id} unresolved generation inherited pricing`);
  assert.ok(entry.designGenerations.some(candidate => candidate.status !== "unresolved"), `${entry.id} lacks its exact factory snapshot`);
}

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

// All-manufacturer generation-safety audit.
const allBoats = catalog.items.filter(entry => entry.categoryId === "boats");
assert.ok(
  allBoats.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more app boat records lacks canonical design-generation metadata"
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
