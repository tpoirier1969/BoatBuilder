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

assert.ok(catalog, "Catalog global is missing");
assert.equal(catalog.source, "BoatBuilder canonical app data", "Catalog source is not the app repository");
assert.ok(Array.isArray(catalog.categories) && catalog.categories.length >= 8, "Expected catalog categories");
assert.ok(Array.isArray(catalog.items) && catalog.items.length > 300, "Catalog is unexpectedly small");

const ids = catalog.items.map(item => item.id);
assert.equal(new Set(ids).size, ids.length, "Catalog contains duplicate stable IDs");
assert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");
assert.equal(catalog.counts.items, catalog.items.length, "Catalog item count is stale");
assert.equal(
  catalog.counts.boats,
  catalog.items.filter(item => item.categoryId === "boats").length,
  "Catalog boat count is stale"
);
assert.equal(
  catalog.counts.equipment,
  catalog.items.filter(item => item.categoryId !== "boats").length,
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
  "boat:Lund | Tyee 1875 Sport (current generation)"
];
for (const id of requiredIds) {
  assert.ok(catalog.items.some(item => item.id === id), `Required canonical record is missing: ${id}`);
}
assert.ok(
  !catalog.items.some(item => item.id === "boat:Lund | Tyee 1850 / older 18' Tyee"),
  "Mixed-propulsion Tyee umbrella record still exists"
);

const lund = catalog.items.filter(item => item.categoryId === "boats" && item.manufacturer === "Lund");
assert.equal(lund.length, 28, "Focused Lund app-model scope changed without updating the audit");
assert.ok(
  lund.every(item => Array.isArray(item.designGenerations) && item.designGenerations.length >= 1),
  "One or more Lund app records lacks canonical design-generation metadata"
);

const adventure = catalog.items.find(item => item.id === "boat:Lund | Adventure Sport 1675");
assert.equal(adventure.designGenerations.length, 2, "Adventure 1675 redesign generations are not separated");
assert.match(
  adventure.designGenerations.map(g => g.label).join(" | "),
  /2021[^|]*pre-redesign[^|]*\|[^|]*2024[^|]*wood-free/i,
  "Adventure 1675 does not preserve the 2021 and 2024 redesign split"
);

const oldAlaskan = catalog.items.find(item => item.id === "boat:Lund | Alaskan 1800 Sport");
assert.equal(oldAlaskan.designGenerations.length, 2, "Alaskan 1800 documented specification sets are not separated");
assert.match(
  oldAlaskan.designGenerations.map(g => g.label).join(" | "),
  /2003[^|]*\|[^|]*2021/i,
  "Alaskan 1800 does not expose its documented 2003 and 2021 specification sets"
);
assert.equal(oldAlaskan.valueEras.length, 0, "Multi-generation Alaskan retained unsafe top-level value eras");

const impact = catalog.items.find(item => item.id === "boat:Lund | Impact Sport 1775");
assert.equal(impact.designGenerations.length, 2, "Non-XS Impact 1775 generations are not separated");
assert.match(impact.details.find(d => d.label === "Notes")?.value || "", /non-XS/i, "Historical Impact record is not protected from Impact XS substitution");

const proV1775 = catalog.items.find(item => item.id === "boat:Lund | Pro-V 1775 (non-walk-through configurations)");
assert.equal(proV1775.designGenerations.length, 2, "Pro-V 1775 2000 and 2002 specification sets are not separated");
assert.match(proV1775.designGenerations.map(g => g.label).join(" | "), /2000[^|]*\|[^|]*2002/i, "Pro-V 1775 exact-year split is missing");

const tyeeIo = catalog.items.find(item => item.id === "boat:Lund | Tyee 1850 I/O / ITS (older generation)");
assert.equal(tyeeIo.lowPrice, null, "I/O Tyee inherited an unsupported low price");
assert.equal(tyeeIo.highPrice, null, "I/O Tyee inherited an unsupported high price");
assert.equal(tyeeIo.valueEras.length, 0, "I/O Tyee inherited outboard value eras");
assert.equal(tyeeIo.designGenerations.length, 1, "I/O Tyee is not narrowed to one documented package basis");

const currentTyee = catalog.items.find(item => item.id === "boat:Lund | Tyee 1875 Sport (current generation)");
assert.match(
  currentTyee.designGenerations[0].specs?.["Dry Hull Weight"]?.value || "",
  /1,760 lb/i,
  "Current Tyee 1875 factory hull weight is missing"
);

const dualImpact = catalog.items.find(item => item.id === "boat:MirroCraft | Dual Impact 176");
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
console.log("Verified canonical app data, focused Lund generations, structured value eras, data-backed hull generations, and no runtime correction overlay.");
