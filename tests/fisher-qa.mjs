import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(read(path), sandbox, { filename: path });
}
const catalog = sandbox.window.BOATBUILDER_DATA;
assert.ok(catalog, "Canonical catalog global is missing");
const fisher = catalog.items.filter(entry => entry.manufacturer === "Fisher");
assert.equal(fisher.length, 3, "Fisher focused model count changed");
assert.equal(fisher.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 7, "Fisher generation/evidence-row count changed");
assert.equal(fisher.filter(boat => boat.idealMatch).length, 0, "Fisher ideal-match set changed");

for (const boat of fisher) {
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  let previousEnd = -Infinity;
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(Number.isInteger(generation.startYear), `${generation.id} lacks a numeric start year`);
    assert.ok(Number.isInteger(generation.endYear), `${generation.id} lacks a numeric end year`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has a reversed year range`);
    assert.ok(generation.startYear > previousEnd, `${boat.id} has overlapping Fisher generation rows`);
    previousEnd = generation.endYear;
    assert.ok(Object.keys(generation.specs || {}).length >= 1, `${generation.id} lacks documented specifications`);
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained pricing`);
    for (const era of generation.eras) {
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
      assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} crosses its Fisher generation`);
    }
  }
  const research = (boat.details || []).find(detail => detail.label === "Research Status")?.value || "";
  assert.doesNotMatch(research, /remaining advertised years require|generation-by-generation factory reconciliation/i, `${boat.id} still claims unfinished research`);
}

const requireBoat = id => {
  const boat = fisher.find(entry => entry.id === id);
  assert.ok(boat, `Missing expected Fisher record ${id}`);
  return boat;
};
const chronology = boat => (boat.designGenerations || []).map(entry => [entry.startYear, entry.endYear]);
const generation = (boat, startYear, endYear) => {
  const found = boat.designGenerations.find(entry => entry.startYear === startYear && entry.endYear === endYear);
  assert.ok(found, `${boat.id} is missing ${startYear}-${endYear}`);
  return found;
};

const hawk170 = requireBoat("boat:Fisher | Hawk 170 FS");
assert.equal(JSON.stringify(chronology(hawk170)), JSON.stringify([[1997, 1999], [2000, 2000], [2001, 2002]]), "Hawk 170 FS chronology changed");
assert.ok(hawk170.designGenerations.every(entry => entry.startYear !== 2020), "The false 2020 Hawk 170 row returned");
assert.equal(generation(hawk170, 1997, 1999).specs["Dry Hull Weight"].value, "995 lb", "Early Hawk 170 weight changed");
assert.equal(generation(hawk170, 2000, 2000).specs.Length.value, "17'8\"", "2000 Hawk 170 length changed");
assert.equal(generation(hawk170, 2000, 2000).specs.Beam.value, "92.75\"", "2000 Hawk 170 beam changed");
assert.equal(generation(hawk170, 2000, 2000).specs["Dry Hull Weight"].value, "1,300 lb", "2000 Hawk 170 weight changed");
assert.equal(generation(hawk170, 2000, 2000).specs["Trailered Test Weight"].value, "2,328 lb", "2000 Hawk 170 trailered test weight changed");
assert.match(generation(hawk170, 2001, 2002).specs["Dry Hull Weight"].value, /1,400.*1,450|1,450.*1,400/, "Later Hawk 170 published-weight distinction was erased");

const hawk186 = requireBoat("boat:Fisher | Hawk 186 FS");
assert.equal(JSON.stringify(chronology(hawk186)), JSON.stringify([[2001, 2002]]), "Hawk 186 FS chronology changed");
assert.equal(generation(hawk186, 2001, 2002).specs.Length.value, "18'6\"", "Hawk 186 length changed");
assert.equal(generation(hawk186, 2001, 2002).specs.Beam.value, "93\"", "Hawk 186 beam changed");
assert.match(generation(hawk186, 2001, 2002).specs["Dry Hull Weight"].value, /1,430.*1,535.*excluded/i, "Hawk 186 outboard/I-O distinction disappeared");
assert.match((hawk186.details || []).find(detail => detail.label === "Notes")?.value || "", /I\/O|sterndrive/i, "Hawk 186 notes no longer warn about the I/O variant");

const hawk200 = requireBoat("boat:Fisher | Hawk 200 FS");
assert.equal(JSON.stringify(chronology(hawk200)), JSON.stringify([[1997, 1998], [1999, 1999], [2000, 2001]]), "Hawk 200 FS chronology changed");
assert.equal(generation(hawk200, 1997, 1998).specs.Beam.value, "88\"", "Early Hawk 200 beam changed");
assert.equal(generation(hawk200, 1997, 1998).specs["Dry Hull Weight"].value, "1,245 lb", "Early Hawk 200 weight changed");
assert.equal(generation(hawk200, 1999, 1999).specs["Dry Hull Weight"].value, "1,560 lb", "1999 Hawk 200 transitional weight changed");
assert.equal(generation(hawk200, 2000, 2001).specs.Beam.value, "98\"", "Later Hawk 200 beam changed");
assert.match(generation(hawk200, 2000, 2001).specs["Dry Hull Weight"].value, /1,550.*1,580|1,580.*1,550/, "Later Hawk 200 annual weights changed");

console.log(`Fisher QA passed: ${fisher.length} models and 7 non-overlapping generation/evidence rows.`);
