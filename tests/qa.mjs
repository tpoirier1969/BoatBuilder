import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const appSource = fs.readFileSync("app.js", "utf8");
const htmlSource = fs.readFileSync("index.html", "utf8");
const cssSource = fs.readFileSync("styles.css", "utf8");
const catalogSource = fs.readFileSync("data/catalog.js", "utf8");

const sandbox = { window: {} };
vm.runInNewContext(catalogSource, sandbox, { filename: "data/catalog.js" });
const catalog = sandbox.window.BOATBUILDER_DATA;

assert.ok(catalog, "Catalog global is missing");
assert.ok(Array.isArray(catalog.categories) && catalog.categories.length >= 8, "Expected catalog categories");
assert.ok(Array.isArray(catalog.items) && catalog.items.length > 300, "Catalog is unexpectedly small");

const ids = catalog.items.map(item => item.id);
assert.equal(new Set(ids).size, ids.length, "Catalog contains duplicate stable IDs");
assert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");

const princecraftSport = catalog.items.find(item =>
  item.categoryId === "boats"
  && /Sport 167\s*\/\s*Sport 164/i.test(item.displayName || item.model || "")
);
assert.ok(princecraftSport, "Princecraft Sport 167 / Sport 164 record is missing");

const lund1600ProSport = catalog.items.find(item =>
  item.categoryId === "boats"
  && item.id === "boat:Lund | 1600 Pro Sport"
  && /1600 Pro Sport/i.test(item.displayName || item.model || "")
);
assert.ok(lund1600ProSport, "Lund 1600 Pro Sport record is missing");

const electronics = catalog.items.filter(item => item.categoryId === "electronics");
const electrical = catalog.items.filter(item => item.categoryId === "electrical");
assert.ok(electronics.length > 0 && electronics.every(item => item.subtypeId && item.subtypeName), "Electronics subtype metadata is incomplete");
assert.ok(electrical.length > 0 && electrical.every(item => item.subtypeId && item.subtypeName), "Electrical subtype metadata is incomplete");

assert.match(appSource, /currentEstimate\.v3/, "Current estimate storage version is not v3");
assert.match(appSource, /function updateEstimateHeader\(/, "Live estimate header calculation is missing");
assert.match(appSource, /function renderSubtypes\(/, "Subtype navigation screen is missing");
assert.match(appSource, /function configurationComplete\(/, "Required-option selection gate is missing");
assert.match(appSource, /function configurationRequirementText\(/, "Required-option guidance is missing");
assert.match(appSource, /data-config-hp/, "Horsepower control is missing");
assert.match(appSource, /data-config-trailer/, "Trailer control is missing");
assert.doesNotMatch(appSource, /data-select=/, "Model-list estimate checkbox returned");
assert.match(appSource, /id="detail-select"[\s\S]*?disabled/, "Detail selection is not disabled while required options are missing");
assert.match(appSource, /Standard factory \/ generic trailer included/, "Standard trailer assumption is missing");
assert.match(appSource, /Lund American/, "Lund naming guidance is missing");
assert.doesNotMatch(appSource, /\.focus\(\{ preventScroll/, "Main-content programmatic focus regression returned");

assert.match(htmlSource, /id="home-button"/, "Home button is missing");
assert.match(htmlSource, /id="estimate-button"/, "Estimate button is missing");
assert.match(htmlSource, /id="clear-estimate-button"[\s\S]*?>Clear estimate<\/button>/, "Header Clear estimate label is incomplete");
assert.match(htmlSource, /id="estimate-range"/, "Header estimate range is missing");
assert.match(htmlSource, /id="estimate-count"/, "Header estimate count is missing");

assert.match(cssSource, /\.header-estimate-button\s*\{[\s\S]*?grid-column:\s*2;/, "Estimate button is not centered in header column 2");
assert.match(cssSource, /\.clear-estimate-button\s*\{[\s\S]*?grid-column:\s*3;/, "Clear estimate is not placed on the right");
assert.match(cssSource, /\.item-card\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto;/, "Model list still reserves a checkbox column");

console.log(`BoatBuilder QA passed: ${catalog.items.length} items, ${catalog.items.filter(item => item.categoryId === "boats").length} boats.`);
console.log("Verified detail-only selection, required options, centered estimate header, right-side Clear estimate, subtype navigation, stable catalog IDs, and required reconciled boat records.");
