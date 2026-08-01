import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
}

const catalog = sandbox.window.BOATBUILDER_DATA;
assert.ok(catalog, "Canonical catalog global is missing");
const targets = catalog.items.filter(entry => entry.manufacturer === "Ultracraft (Misty Harbor)" || entry.manufacturer === "Fish-Rite");
assert.equal(targets.length, 3, "Ultracraft/Fish-Rite focused record count changed");
assert.equal(targets.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 3, "Focused generation/evidence-row count changed");
assert.equal(targets.filter(boat => boat.idealMatch).length, 0, "Focused ideal-match set changed");

for (const boat of targets) {
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  let previousEnd = -Infinity;
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(Number.isInteger(generation.startYear), `${generation.id} lacks a numeric start year`);
    assert.ok(Number.isInteger(generation.endYear), `${generation.id} lacks a numeric end year`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has a reversed year range`);
    assert.ok(generation.startYear > previousEnd, `${boat.id} has overlapping generation rows`);
    previousEnd = generation.endYear;
    assert.ok(Object.keys(generation.specs || {}).length >= 1, `${generation.id} lacks a documented specification/disposition table`);
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained package pricing`);
    for (const price of generation.eras) {
      assert.ok(Number.isFinite(price.low) && Number.isFinite(price.high) && price.low <= price.high, `${price.id} has invalid pricing`);
      assert.ok(price.startYear >= generation.startYear && price.endYear <= generation.endYear, `${price.id} crosses its generation`);
    }
  }
}

const requireBoat = id => {
  const boat = targets.find(entry => entry.id === id);
  assert.ok(boat, `Missing expected record ${id}`);
  return boat;
};
const chronology = boat => (boat.designGenerations || []).map(entry => [entry.startYear, entry.endYear]);
const onlyGeneration = boat => {
  assert.equal(boat.designGenerations.length, 1, `${boat.id} should have one defensible generation/evidence row`);
  return boat.designGenerations[0];
};

const fishRite = requireBoat("boat:Fish-Rite | Stalker 17'6\"");
assert.match(fishRite.model, /custom-build screening/i, "Fish-Rite record again presents the Stalker as a standardized 17'6-inch model");
assert.equal(JSON.stringify(chronology(fishRite)), JSON.stringify([[2006, 2006]]), "Fish-Rite listing-evidence chronology changed");
const fishGeneration = onlyGeneration(fishRite);
assert.equal(fishGeneration.status, "listing-specific-evidence", "Fish-Rite disposition status changed");
assert.match(fishGeneration.specs.Length.value, /requires direct measurement|verification/i, "Fish-Rite length is again treated as a fixed factory specification");
assert.match(fishGeneration.specs.Construction.value, /vary by build/i, "Fish-Rite build variability warning disappeared");
assert.doesNotMatch(fishRite.subtitle, /other advertised years unresolved/i, "Fish-Rite retained the old unresolved subtitle");

const stealth169 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 169W");
assert.equal(JSON.stringify(chronology(stealth169)), JSON.stringify([[2006, 2008]]), "Stealth 169W production boundary changed");
const gen169 = onlyGeneration(stealth169);
assert.equal(gen169.specs.Length.value, "16'9\"", "Stealth 169W length changed");
assert.equal(gen169.specs.Beam.value, "86\"", "Stealth 169W beam changed");
assert.equal(gen169.specs["Max / Bow Depth"].value, "38\" bow height", "Stealth 169W bow height changed");
assert.equal(gen169.specs["Stern Height"].value, "32\"", "Stealth 169W stern height changed");
assert.equal(gen169.specs.Deadrise.value, "13°", "Stealth 169W deadrise changed");
assert.equal(gen169.specs["Dry Hull Weight"].value, "870 lb", "Stealth 169W dry weight changed");
assert.equal(gen169.specs.Persons.value, "6", "Stealth 169W person rating changed");
assert.equal(gen169.specs["Fuel Capacity"].value, "24 gal", "Stealth 169W fuel capacity changed");
assert.equal(gen169.specs["Max HP"].value, "90", "Stealth 169W horsepower rating changed");
assert.match(gen169.specs.Construction.value, /Riveted.*plywood/i, "Stealth 169W construction basis changed");

const stealth178 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 178W");
assert.equal(JSON.stringify(chronology(stealth178)), JSON.stringify([[2006, 2008]]), "Stealth 178W production boundary changed");
const gen178 = onlyGeneration(stealth178);
assert.equal(gen178.specs.Length.value, "17'8\"", "Stealth 178W length changed");
assert.equal(gen178.specs.Beam.value, "94\"", "Stealth 178W beam changed or old 95-inch value returned");
assert.equal(gen178.specs["Max / Bow Depth"].value, "44\" bow height", "Stealth 178W bow height changed or old 36-inch value returned");
assert.equal(gen178.specs["Stern Height"].value, "28\"", "Stealth 178W stern height changed");
assert.equal(gen178.specs.Deadrise.value, "13°", "Stealth 178W deadrise changed or old 15-degree value returned");
assert.equal(gen178.specs["Transom Height"].value, "20\" or 25\"", "Stealth 178W transom options changed");
assert.equal(gen178.specs["Dry Hull Weight"].value, "1,120 lb", "Stealth 178W dry weight changed");
assert.equal(gen178.specs.Persons.value, "6", "Stealth 178W person rating changed");
assert.equal(gen178.specs["Capacity Weight"].value, "1,500 lb", "Stealth 178W load capacity changed");
assert.equal(gen178.specs["Max HP"].value, "115", "Stealth 178W horsepower rating changed");
assert.match(gen178.specs["Bottom / Side Thickness"].value, /0\.170.*0\.090/, "Stealth 178W aluminum gauges changed");

console.log("Ultracraft/Fish-Rite QA passed: 3 records and 3 non-overlapping generation/evidence rows.");
