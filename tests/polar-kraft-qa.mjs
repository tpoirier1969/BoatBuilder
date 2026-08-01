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
const polar = catalog.items.filter(entry => entry.manufacturer === "Polar Kraft");
assert.equal(polar.length, 4, "Polar Kraft focused model count changed");
assert.equal(
  polar.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0),
  10,
  "Polar Kraft generation/evidence-row count changed"
);
assert.equal(polar.filter(boat => boat.idealMatch).length, 0, "Polar Kraft ideal-match set changed");

for (const boat of polar) {
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  let previousEnd = -Infinity;
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(Number.isInteger(generation.startYear), `${generation.id} lacks a numeric start year`);
    assert.ok(Number.isInteger(generation.endYear), `${generation.id} lacks a numeric end year`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has a reversed year range`);
    assert.ok(generation.startYear > previousEnd, `${boat.id} has overlapping Polar Kraft generation rows`);
    previousEnd = generation.endYear;
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained package pricing`);
    for (const era of generation.eras) {
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
      assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} crosses its Polar Kraft generation`);
    }
  }
  const research = (boat.details || []).find(detail => detail.label === "Research Status")?.value || "";
  assert.doesNotMatch(research, /require generation-by-generation|unresolved/i, `${boat.id} still claims unresolved research`);
}

const requireBoat = id => {
  const boat = polar.find(entry => entry.id === id);
  assert.ok(boat, `Missing expected Polar Kraft record ${id}`);
  return boat;
};
const chronology = boat => (boat.designGenerations || []).map(entry => [entry.startYear, entry.endYear]);
const generation = (boat, startYear, endYear) => {
  const found = boat.designGenerations.find(entry => entry.startYear === startYear && entry.endYear === endYear);
  assert.ok(found, `${boat.id} is missing ${startYear}-${endYear}`);
  return found;
};

const frontier = requireBoat("boat:Polar Kraft | Frontier 179 WT");
assert.equal(JSON.stringify(chronology(frontier)), JSON.stringify([[2012, 2012], [2013, 2017], [2018, 2019], [2020, 2023]]), "Frontier 179 WT chronology changed");
assert.equal(generation(frontier, 2012, 2012).specs["Dry Hull Weight"].value, "1,282 lb", "2012 Frontier weight changed");
assert.equal(generation(frontier, 2013, 2017).specs["Dry Hull Weight"].value, "1,240 lb", "2013-2017 Frontier weight changed");
assert.equal(generation(frontier, 2018, 2019).specs["Dry Hull Weight"].value, "1,130 lb", "2018-2019 Frontier weight changed");
assert.equal(generation(frontier, 2020, 2023).specs["Dry Hull Weight"].value, "Not published", "Current Frontier inherited an unsupported weight");
assert.equal(generation(frontier, 2020, 2023).specs["Chine / Bottom Width"].value, "82.5\"", "Current Frontier bottom width changed");

const v180 = requireBoat("boat:Polar Kraft | Kodiak Sport V180 (Primary; Outlander 2010 WT is Secondary)");
assert.equal(JSON.stringify(chronology(v180)), JSON.stringify([[2011, 2015]]), "Kodiak Sport V180 production boundary changed");
assert.equal(generation(v180, 2011, 2015).specs["Dry Hull Weight"].value, "1,338 lb", "Kodiak Sport V180 weight changed");
assert.match(generation(v180, 2011, 2015).specs.Construction.value, /Riveted/i, "Kodiak Sport V180 reverted to the false welded construction claim");
assert.ok(v180.designGenerations.every(entry => entry.endYear < 2016), "Kodiak Sport V180 incorrectly extends into the V185 era");

const v170 = requireBoat("boat:Polar Kraft | Kodiak V170 FS");
assert.equal(v170.model, "Kodiak Sport 170 FS", "Kodiak Sport 170 display identity changed");
assert.equal(JSON.stringify(chronology(v170)), JSON.stringify([[2011, 2011], [2013, 2019]]), "Kodiak Sport 170 chronology changed or 2012 was silently filled");
assert.equal(generation(v170, 2011, 2011).specs["Dry Hull Weight"].value, "1,300 lb", "2011 Kodiak Sport 170 weight changed");
assert.equal(generation(v170, 2013, 2019).specs["Dry Hull Weight"].value, "1,360 lb", "2013-2019 Kodiak Sport 170 weight changed");
assert.ok(v170.designGenerations.every(entry => !(entry.startYear <= 2012 && entry.endYear >= 2012)), "Kodiak Sport 170 improperly invents a 2012 generation");

const outlander = requireBoat("boat:Polar Kraft | Outlander 2010 WT (Secondary; not Kodiak V180)");
assert.equal(outlander.badge, "Secondary", "Outlander 2010 WT recommendation changed");
assert.equal(JSON.stringify(chronology(outlander)), JSON.stringify([[2012, 2017], [2018, 2019], [2020, 2023]]), "Outlander 2010 WT chronology changed");
assert.ok(outlander.designGenerations.every(entry => entry.startYear !== 2010), "Outlander model number is again being treated as model year 2010");
assert.match(generation(outlander, 2018, 2019).specs["Dry Hull Weight"].value, /1,440.*1,530|1,530.*1,440/, "Outlander cited weight conflict was erased");
assert.equal(generation(outlander, 2020, 2023).specs.Length.value, "20'11\"", "Current Outlander length changed");
assert.equal(generation(outlander, 2020, 2023).specs.Beam.value, "96\"", "Current Outlander beam changed");
assert.equal(generation(outlander, 2020, 2023).specs["Chine / Bottom Width"].value, "76\"", "Current Outlander bottom width changed");
assert.match((outlander.details || []).find(detail => detail.label === "Notes")?.value || "", /model designation|model number/i, "Outlander notes no longer explain the 2010 model designation");

console.log(`Polar Kraft QA passed: ${polar.length} models and 10 non-overlapping generation/evidence rows.`);
