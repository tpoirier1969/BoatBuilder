import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
}
const catalog = sandbox.window.BOATBUILDER_DATA;
assert.ok(catalog, "Canonical catalog is missing");

const expectedIds = [
  "boat:Smoker Craft | Stiletto 162 / 16 Stiletto LE / 165 LE listing alias",
  "boat:Smoker Craft | Millentia 162 Dual",
  "boat:Smoker Craft | Stinger 162 Dual / DC",
  "boat:Smoker Craft | Stealth 162",
  "boat:Smoker Craft | Pro Mag 162",
  "boat:Smoker Craft | Pro Mag 172",
  "boat:Smoker Craft | Pro Angler 162"
];
const boats = expectedIds.map(id => {
  const boat = catalog.items.find(entry => entry.id === id);
  assert.ok(boat, `Missing added Smoker Craft record: ${id}`);
  return boat;
});
assert.equal(new Set(boats.map(entry => entry.id)).size, 7, "Added Smoker Craft stable IDs are not unique");

for (const boat of boats) {
  assert.equal(boat.manufacturer, "Smoker Craft", `${boat.id} manufacturer changed`);
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  assert.ok((boat.designGenerations || []).length >= 1, `${boat.id} lacks evidence rows`);
  let priorEnd = -Infinity;
  for (const generation of boat.designGenerations) {
    assert.ok(Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear), `${generation.id} lacks numeric years`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has reversed years`);
    assert.ok(generation.startYear > priorEnd, `${boat.id} has overlapping evidence rows`);
    priorEnd = generation.endYear;
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(Object.keys(generation.specs || {}).length >= 4, `${generation.id} lacks useful specifications`);
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks contained pricing`);
    for (const price of generation.eras) {
      assert.ok(Number.isFinite(price.low) && Number.isFinite(price.high) && price.low <= price.high, `${price.id} has invalid pricing`);
      assert.ok(price.startYear >= generation.startYear && price.endYear <= generation.endYear, `${price.id} crosses its evidence row`);
    }
  }
  assert.match((boat.details || []).find(detail => detail.label === "Washdown / Carpet Fit")?.value || "", /POOR/i, `${boat.id} hides the carpet penalty`);
}

const byId = id => boats.find(entry => entry.id === id);
const chronology = boat => boat.designGenerations.map(entry => [entry.startYear, entry.endYear]);
const gen = (boat, start, end) => {
  const found = boat.designGenerations.find(entry => entry.startYear === start && entry.endYear === end);
  assert.ok(found, `${boat.id} lacks ${start}-${end}`);
  return found;
};

const stiletto = byId(expectedIds[0]);
assert.deepEqual(chronology(stiletto), [[2003, 2003], [2004, 2005]], "Stiletto/LE chronology changed");
assert.match(stiletto.model, /165 LE listing alias/, "165 LE badge alias disappeared");
assert.equal(gen(stiletto, 2004, 2005).specs.Length.value, "16'0\"", "2005 Stiletto length changed");
assert.equal(gen(stiletto, 2004, 2005).specs.Beam.value, "87\"", "2005 Stiletto beam changed");
assert.equal(gen(stiletto, 2004, 2005).specs["Dry Hull Weight"].value, "960 lb", "2005 Stiletto weight changed");
assert.equal(gen(stiletto, 2004, 2005).specs["Max HP"].value, "90", "2005 Stiletto horsepower changed");
assert.match(stiletto.generationWarning || "", /HIN.*title.*capacity plate/i, "Stiletto alias warning is incomplete");

const millentia = byId(expectedIds[1]);
assert.deepEqual(chronology(millentia), [[2001, 2005]], "Millentia 162 chronology changed");
assert.equal(gen(millentia, 2001, 2005).specs["Dry Hull Weight"].value, "975 lb", "Millentia weight changed");
assert.match(gen(millentia, 2001, 2005).specs.Layout.value, /Dual-console/, "Millentia dual identity disappeared");

const stinger = byId(expectedIds[2]);
assert.deepEqual(chronology(stinger), [[2001, 2005], [2006, 2006]], "Stinger 162 chronology changed");
assert.match(gen(stinger, 2006, 2006).specs["Dry Hull Weight"].value, /660.*920|920.*660/, "Stinger 2006 weight conflict was hidden");
assert.equal(gen(stinger, 2001, 2005).specs.Beam.value, "81\"", "Stinger beam changed");

const stealth = byId(expectedIds[3]);
assert.deepEqual(chronology(stealth), [[2002, 2002], [2003, 2003], [2004, 2004]], "Stealth 162 annual distinctions changed");
assert.equal(gen(stealth, 2002, 2002).specs["Dry Hull Weight"].value, "660 lb", "2002 Stealth weight changed");
assert.equal(gen(stealth, 2003, 2003).specs["Dry Hull Weight"].value, "600 lb", "2003 Stealth weight changed");

const proMag162 = byId(expectedIds[4]);
assert.deepEqual(chronology(proMag162), [[2001, 2001], [2003, 2003], [2006, 2007], [2008, 2010], [2019, 2019]], "Pro Mag 162 discontinuous evidence was smoothed over");
assert.equal(gen(proMag162, 2006, 2007).specs.Length.value, "16'5\"", "Early Pro Mag 162 length changed");
assert.equal(gen(proMag162, 2008, 2010).specs.Length.value, "16'0\"", "Redesigned Pro Mag 162 length changed");
assert.equal(gen(proMag162, 2008, 2010).specs.Beam.value, "87\"", "Redesigned Pro Mag 162 beam changed");
assert.equal(gen(proMag162, 2019, 2019).specs["Dry Hull Weight"].value, "1,140 lb", "2019 Pro Mag 162 weight changed");

const proMag172 = byId(expectedIds[5]);
assert.deepEqual(chronology(proMag172), [[2006, 2007], [2017, 2020]], "Pro Mag 172 discontinuous runs changed");
assert.equal(gen(proMag172, 2006, 2007).specs.Length.value, "17'2\"", "Early Pro Mag 172 length changed");
assert.equal(gen(proMag172, 2006, 2007).specs.Beam.value, "91\"", "Early Pro Mag 172 beam changed");
assert.equal(gen(proMag172, 2006, 2007).specs["Max HP"].value, "135", "Early Pro Mag 172 horsepower changed");
assert.equal(proMag172.badge, "Primary", "Pro Mag 172 practical tier changed");

const proAngler162 = byId(expectedIds[6]);
assert.deepEqual(chronology(proAngler162), [[2007, 2007]], "Base Pro Angler 162 should remain an exact 2007 row");
assert.equal(gen(proAngler162, 2007, 2007).specs.Beam.value, "81\"", "Pro Angler 162 beam changed");
assert.equal(gen(proAngler162, 2007, 2007).specs["Max HP"].value, "60", "Pro Angler 162 horsepower changed");

const batch = JSON.parse(fs.readFileSync("reports/smokercraft-legacy-windshield-families.json", "utf8"));
assert.equal(batch.added.length, 7, "Batch report does not contain seven additions");
assert.equal(batch.photographedListingMatch.sellerEstimatedYear, 2005, "Listing-year clue disappeared");
assert.equal(batch.photographedListingMatch.status, "likely-match-pending-hin-title-and-capacity-plate", "Listing match became falsely certain");

console.log("Legacy Smoker Craft QA passed: seven added records, sixteen non-overlapping evidence rows, and the 2005 165 LE alias remains conditional.");
