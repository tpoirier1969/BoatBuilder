import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const appSource = read("app.js");
const htmlSource = read("index.html");
const cssSource = read("styles.css");
const catalogSource = read("data/catalog.js");
const lundCorrectionsSource = read("data/lund-corrections.js");

const sandbox = { window: {} };
vm.runInNewContext(catalogSource, sandbox, { filename: "data/catalog.js" });
vm.runInNewContext(lundCorrectionsSource, sandbox, { filename: "data/lund-corrections.js" });
const catalog = sandbox.window.BOATBUILDER_DATA;

assert.ok(catalog, "Catalog global is missing");
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

const requiredIds = [
  "boat:Lund | 1600 Pro Sport",
  "boat:Lund | Alaskan 1800 Sport",
  "boat:Lund | Alaskan 1875 Sport (2024 redesign)",
  "boat:Lund | Tyee 1850 outboard / older 18' Tyee outboard",
  "boat:Lund | Tyee 1850 I/O / ITS (older generation)",
  "boat:Lund | Tyee 1875 Sport (current generation)"
];
for (const id of requiredIds) {
  assert.ok(catalog.items.some(item => item.id === id), `Required corrected record is missing: ${id}`);
}
assert.ok(
  !catalog.items.some(item => item.id === "boat:Lund | Tyee 1850 / older 18' Tyee"),
  "Mixed-propulsion Tyee umbrella record still exists"
);

const oldAlaskan = catalog.items.find(item => item.id === "boat:Lund | Alaskan 1800 Sport");
const oldAlaskanDetails = new Map(oldAlaskan.details.map(detail => [detail.label, detail.value]));
assert.match(oldAlaskan.subtitle, /2003 factory hull/i, "Old Alaskan was not narrowed to its documented hull");
assert.ok(!oldAlaskanDetails.has("1990s Value"), "Old Alaskan still carries an unsupported 1990s value");
assert.ok(!oldAlaskanDetails.has("2010s Value"), "Old Alaskan still carries an unsupported 2010s value");
assert.ok(!oldAlaskanDetails.has("2020s Value"), "Old Alaskan still carries an unsupported 2020s value");

const tyeeIo = catalog.items.find(item => item.id === "boat:Lund | Tyee 1850 I/O / ITS (older generation)");
assert.equal(tyeeIo.lowPrice, null, "I/O Tyee inherited an unsupported low price");
assert.equal(tyeeIo.highPrice, null, "I/O Tyee inherited an unsupported high price");
assert.ok(
  !tyeeIo.details.some(detail => /Value$/.test(detail.label)),
  "I/O Tyee inherited outboard value eras"
);

assert.match(appSource, /currentEstimate\.v5/, "Current estimate storage version is not v5");
assert.match(appSource, /function gens\(/, "Generation resolver is missing");
assert.match(appSource, /function missing\(/, "Required generation and era gate is missing");
assert.match(appSource, /function controls\(/, "Generation, era and trailer controls are missing");
assert.match(appSource, /Choose hull generation/, "Hull-generation selection guidance is missing");
assert.match(appSource, /Choose age \/ era/, "Age-era selection guidance is missing");
assert.match(appSource, /Standard factory \/ generic trailer included/, "Standard trailer assumption is missing");
assert.doesNotMatch(appSource, /data-select=/, "Model-list estimate checkbox returned");

assert.match(htmlSource, /data\/catalog\.js[^]*data\/lund-corrections\.js[^]*app\.js/, "Catalog corrections do not load before the controller");
assert.match(htmlSource, /id="home-button"/, "Home button is missing");
assert.match(htmlSource, /id="estimate-button"/, "Estimate button is missing");
assert.match(htmlSource, /id="clear-estimate-button"/, "Clear estimate button is missing");
assert.match(htmlSource, /id="estimate-range"/, "Header estimate range is missing");
assert.match(htmlSource, /id="estimate-count"/, "Header estimate count is missing");

assert.match(cssSource, /\.header-estimate-button\s*\{[^]*?grid-column:\s*2;/, "Estimate button is not centered in header column 2");
assert.match(cssSource, /\.clear-estimate-button\s*\{[^]*?grid-column:\s*3;/, "Clear estimate is not placed on the right");

console.log(
  `BoatBuilder QA passed: ${catalog.items.length} items, ${catalog.items.filter(item => item.categoryId === "boats").length} boats.`
);
console.log("Verified current v5 controller, stable IDs, correction load order, Lund Alaskan split, and Tyee propulsion/generation separation.");