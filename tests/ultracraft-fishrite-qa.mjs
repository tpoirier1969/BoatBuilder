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
assert.equal(targets.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 5, "Focused generation/evidence-row count changed");
assert.equal(targets.filter(boat => boat.idealMatch).length, 0, "Focused ideal-match set changed");

for (const boat of targets) {
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  let previousEnd = -Infinity;
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear), `${generation.id} lacks numeric years`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has a reversed year range`);
    assert.ok(generation.startYear > previousEnd, `${boat.id} has overlapping generation/evidence rows`);
    previousEnd = generation.endYear;
    assert.ok(Object.keys(generation.specs || {}).length >= 1, `${generation.id} lacks a documented specification/disposition table`);
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained package pricing`);
    for (const price of generation.eras) {
      assert.ok(Number.isFinite(price.low) && Number.isFinite(price.high) && price.low <= price.high, `${price.id} has invalid pricing`);
      assert.ok(price.startYear >= generation.startYear && price.endYear <= generation.endYear, `${price.id} crosses its evidence row`);
    }
  }
}

const requireBoat = id => {
  const boat = targets.find(entry => entry.id === id);
  assert.ok(boat, `Missing expected record ${id}`);
  return boat;
};
const chronology = boat => (boat.designGenerations || []).map(entry => [entry.startYear, entry.endYear]);

const fishRite = requireBoat("boat:Fish-Rite | Stalker 17'6\"");
assert.match(fishRite.model, /custom-build screening/i, "Fish-Rite again presents the Stalker as a standardized model");
assert.equal(JSON.stringify(chronology(fishRite)), JSON.stringify([[2006, 2006]]), "Fish-Rite listing-evidence chronology changed");
assert.equal(fishRite.designGenerations[0].status, "listing-specific-evidence", "Fish-Rite disposition status changed");

const stealth169 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 169W");
assert.equal(JSON.stringify(chronology(stealth169)), JSON.stringify([[2006, 2008], [2009, 2012]]), "169W roster coverage changed or again stops at 2008");
assert.match(stealth169.model, /Stealth 169W \/ 169W/, "169W naming transition disappeared");
const early169 = stealth169.designGenerations[0];
const later169 = stealth169.designGenerations[1];
assert.equal(early169.specs.Length.value, "16'9\"", "Stealth 169W length changed");
assert.equal(early169.specs.Beam.value, "86\"", "Stealth 169W beam changed");
assert.equal(early169.specs["Dry Hull Weight"].value, "870 lb", "Stealth 169W dry weight changed");
assert.equal(early169.specs["Max HP"].value, "90", "Stealth 169W horsepower changed");
assert.equal(later169.status, "annual-roster-continuation", "Later 169W row no longer records roster continuation");
assert.match(later169.specificationBasis, /does not claim a redesign/i, "169W naming boundary is again presented as an invented redesign");

const stealth178 = requireBoat("boat:Ultracraft (Misty Harbor) | Stealth 178W");
assert.equal(JSON.stringify(chronology(stealth178)), JSON.stringify([[2006, 2008], [2009, 2012]]), "178W roster coverage changed or again stops at 2008");
assert.match(stealth178.model, /Stealth 178W \/ 178W/, "178W naming transition disappeared");
const early178 = stealth178.designGenerations[0];
const later178 = stealth178.designGenerations[1];
assert.equal(early178.specs.Length.value, "17'8\"", "Stealth 178W length changed");
assert.match(early178.specs.Beam.value, /94.*95/, "178W published beam conflict was hidden");
assert.match(early178.specs["Max / Bow Depth"].value, /44.*36/, "178W published bow-height conflict was hidden");
assert.match(early178.specs.Deadrise.value, /13.*15/, "178W published deadrise conflict was hidden");
assert.equal(early178.specs["Dry Hull Weight"].value, "1,120 lb", "Stealth 178W dry weight changed");
assert.equal(early178.specs["Max HP"].value, "115", "Stealth 178W horsepower changed");
assert.equal(later178.status, "annual-roster-continuation", "Later 178W row no longer records roster continuation");
assert.equal(later178.specs.Beam.value, "95\"", "2009-2012 178W published beam changed");
assert.equal(later178.specs.Deadrise.value, "15°", "2009-2012 178W published deadrise changed");
assert.match(later178.specificationBasis, /continuation rather than a new unrelated model/i, "Later Stealth branding evidence disappeared");

console.log("Ultracraft/Fish-Rite QA passed: 3 records, 5 evidence rows, and Ultracraft roster coverage through 2012.");
