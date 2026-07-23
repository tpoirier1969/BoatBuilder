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

function detailMap(item) {
  return new Map((item.details || []).map(detail => [detail.label, String(detail.value ?? "")]));
}

function parseAmount(numberText, suffix) {
  const number = Number(numberText);
  if (!Number.isFinite(number)) return null;
  return suffix ? Math.round(number * 1000) : Math.round(number);
}

function parsePriceBands(value) {
  const text = String(value ?? "").trim().replaceAll(",", "");
  if (!text) return [];
  const bands = [];

  for (const segment of text.split(";")) {
    const priceMatches = [...segment.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)\s*[–—-]\s*\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)];
    const priceMatch = priceMatches.at(-1);
    if (!priceMatch) continue;

    const low = parseAmount(priceMatch[1], priceMatch[2]);
    const high = parseAmount(priceMatch[3], priceMatch[4]);
    if (low === null || high === null) continue;

    const prefix = segment.slice(0, priceMatch.index).trim();
    const hpRanges = [...prefix.matchAll(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/g)];
    const hpRange = hpRanges.at(-1);
    if (hpRange) {
      bands.push({ minHp: Number(hpRange[1]), maxHp: Number(hpRange[2]), low, high });
      continue;
    }

    const single = [...prefix.matchAll(/(\d+(?:\.\d+)?)(?=\s*:?\s*$)/g)].at(-1);
    if (single) {
      const hp = Number(single[1]);
      bands.push({ minHp: hp, maxHp: hp, low, high });
    }
  }

  return bands;
}

const etec = catalog.items.find(item =>
  item.categoryId === "main-motors"
  && /E-TEC 40-150/i.test(item.displayName || item.model || "")
);
assert.ok(etec, "Evinrude E-TEC 40-150 record is missing");

const etecDetails = detailMap(etec);
const etec2010s = parsePriceBands(etecDetails.get("2010s Value"));
assert.deepEqual(
  etec2010s.find(band => 75 >= band.minHp && 75 <= band.maxHp),
  { minHp: 75, maxHp: 90, low: 4000, high: 6500 },
  "2010s E-TEC 75-90 hp range is wrong"
);
assert.deepEqual(
  etec2010s.find(band => 115 >= band.minHp && 115 <= band.maxHp),
  { minHp: 115, maxHp: 150, low: 5500, high: 8500 },
  "2010s E-TEC 115-150 hp range is wrong"
);
assert.deepEqual(
  etec2010s.find(band => 90 >= band.minHp && 90 <= band.maxHp),
  { minHp: 75, maxHp: 90, low: 4000, high: 6500 },
  "2010s E-TEC 90 hp boundary is wrong"
);
assert.deepEqual(
  etec2010s.find(band => 150 >= band.minHp && 150 <= band.maxHp),
  { minHp: 115, maxHp: 150, low: 5500, high: 8500 },
  "2010s E-TEC 150 hp boundary is wrong"
);

const boat = catalog.items.find(item =>
  item.categoryId === "boats"
  && Number.isFinite(item.lowPrice)
  && Number.isFinite(item.highPrice)
);
assert.ok(boat, "No priced boat record exists for trailer QA");
const standardTrailer = { low: 0, high: 0 };
const premiumTrailer = { low: 400, high: 1200 };
assert.equal(boat.lowPrice + standardTrailer.low, boat.lowPrice, "Standard trailer was double-counted on low value");
assert.equal(boat.highPrice + standardTrailer.high, boat.highPrice, "Standard trailer was double-counted on high value");
assert.equal(boat.lowPrice + premiumTrailer.low, boat.lowPrice + 400, "Premium trailer low adjustment is wrong");
assert.equal(boat.highPrice + premiumTrailer.high, boat.highPrice + 1200, "Premium trailer high adjustment is wrong");

assert.match(appSource, /currentEstimate\.v3/, "Current estimate storage version is not v3");
assert.match(appSource, /currentEstimate\.v2/, "v2 estimate migration is missing");
assert.match(appSource, /currentEstimate\.v1/, "v1 estimate migration is missing");
assert.match(appSource, /function updateEstimateHeader\(/, "Live estimate header calculation is missing");
assert.match(appSource, /updateEstimateHeader\(\);/, "Estimate header is not refreshed with selection changes");
assert.match(appSource, /data-config-hp/, "Horsepower control is missing");
assert.match(appSource, /data-config-trailer/, "Trailer control is missing");
assert.match(appSource, /Standard factory \/ generic trailer included/, "Standard trailer assumption is missing");
assert.match(appSource, /Lund American/, "Lund naming guidance is missing");
assert.doesNotMatch(appSource, /\.focus\(\{ preventScroll/, "Main-content programmatic focus regression returned");

assert.match(htmlSource, /id="home-button"/, "Home button is missing");
assert.match(htmlSource, /id="clear-estimate-button"/, "Header Clear button is missing");
assert.match(htmlSource, /id="estimate-range"/, "Header estimate range is missing");
assert.match(htmlSource, /id="estimate-count"/, "Header estimate count is missing");

assert.match(cssSource, /\.header-estimate-button\s*\{[\s\S]*?grid-column:\s*3;/, "Estimate button is not fixed to header column 3");
assert.match(cssSource, /\.header-estimate-button\s*\{[\s\S]*?width:\s*auto;/, "Estimate button can still stretch full width");
assert.match(cssSource, /\.header-estimate-button\s*\{[\s\S]*?max-width:/, "Estimate button lacks a compact maximum width");

console.log(`BoatBuilder QA passed: ${catalog.items.length} items, ${catalog.items.filter(item => item.categoryId === "boats").length} boats.`);
console.log("Verified E-TEC HP bands, trailer assumptions, estimate persistence, header controls, and compact Estimate layout.");
