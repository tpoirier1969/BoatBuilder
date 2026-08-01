import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
}
const catalog = sandbox.window.BOATBUILDER_DATA;
assert.ok(catalog, "Canonical catalog is missing");

const expected = new Map([
  ["boat:Fisher | Hawk 160 WT", [[2004, 2005], [2006, 2007]]],
  ["boat:Fisher | Hawk 170 Sport", [[2004, 2005], [2006, 2008]]],
  ["boat:Fisher | Hawk 170 WT", [[2005, 2005], [2006, 2008]]],
  ["boat:Fisher | 16 Pro Avenger WT", [[2006, 2006], [2007, 2007], [2008, 2008]]],
  ["boat:Fisher | 17 Pro Avenger WT", [[2006, 2007], [2008, 2008]]],
  ["boat:Ultracraft (Misty Harbor) | Trophy 166W / 166W", [[2007, 2008], [2010, 2010]]]
]);

for (const [id, chronology] of expected) {
  const boat = catalog.items.find(entry => entry.id === id);
  assert.ok(boat, `Missing newly added record ${id}`);
  assert.equal((boat.valueEras || []).length, 0, `${id} retained top-level pricing`);
  assert.equal(JSON.stringify((boat.designGenerations || []).map(g => [g.startYear, g.endYear])), JSON.stringify(chronology), `${id} chronology is wrong`);
  let priorEnd = -Infinity;
  for (const generation of boat.designGenerations) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(generation.startYear > priorEnd, `${id} has overlapping generations`);
    priorEnd = generation.endYear;
    assert.ok(Object.keys(generation.specs || {}).length >= 6, `${generation.id} lacks a useful specification table`);
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained pricing`);
    for (const price of generation.eras) {
      assert.ok(Number.isFinite(price.low) && Number.isFinite(price.high) && price.low <= price.high, `${price.id} has invalid pricing`);
      assert.ok(price.startYear >= generation.startYear && price.endYear <= generation.endYear, `${price.id} crosses its generation`);
    }
  }
}

const sport = catalog.items.find(entry => entry.id === "boat:Fisher | Hawk 170 Sport");
const wt = catalog.items.find(entry => entry.id === "boat:Fisher | Hawk 170 WT");
assert.notEqual(sport.id, wt.id, "Sport and WT were incorrectly merged again");
assert.match(sport.details.find(d => d.label === "Notes")?.value || "", /separate/i, "Sport notes do not preserve the separate trim identity");
assert.equal(wt.designGenerations[0].specs.Beam.value, "94\"", "2005 Hawk 170 WT beam changed");
assert.equal(wt.designGenerations[1].specs.Beam.value, "98\"", "Later Hawk 170 WT beam changed");

const avenger16 = catalog.items.find(entry => entry.id === "boat:Fisher | 16 Pro Avenger WT");
assert.equal(avenger16.designGenerations[0].specs["Max HP"].value, "60", "2006 Pro Avenger 16 maximum changed");
assert.equal(avenger16.designGenerations[1].specs["Max HP"].value, "75", "2007 Pro Avenger 16 maximum changed");
assert.equal(avenger16.designGenerations[2].specs["Dry Hull Weight"].value, "1,194 lb", "2008 Pro Avenger 16 weight changed");

const avenger17 = catalog.items.find(entry => entry.id === "boat:Fisher | 17 Pro Avenger WT");
assert.equal(avenger17.designGenerations[0].specs["Dry Hull Weight"].value, "1,450 lb", "2006-2007 Pro Avenger 17 weight changed");
assert.equal(avenger17.designGenerations[1].specs["Dry Hull Weight"].value, "1,325 lb", "2008 Pro Avenger 17 weight changed");

const trophy = catalog.items.find(entry => entry.id === "boat:Ultracraft (Misty Harbor) | Trophy 166W / 166W");
assert.equal(trophy.designGenerations[0].specs["Dry Hull Weight"].value, "Not recovered for the W trim; do not substitute the 166C weight", "Trophy W trim was assigned an invented early weight");
assert.equal(trophy.designGenerations[1].specs["Dry Hull Weight"].value, "790 lb", "2010 166W weight changed");
assert.ok(!trophy.designGenerations.some(g => g.startYear === 2009 || g.endYear >= 2011), "Unsupported Ultracraft 166W years were reintroduced");

const gaps = JSON.parse(fs.readFileSync("research/all-manufacturer-roster-gaps.json", "utf8"));
const fisherGaps = gaps.manufacturers.find(entry => entry.manufacturer === "Fisher").missingModels.map(entry => entry.model);
const ultraGaps = gaps.manufacturers.find(entry => entry.manufacturer === "Ultracraft (Misty Harbor)").missingModels.map(entry => entry.model);
for (const resolved of ["Hawk 160 WT", "Hawk 170 Sport / WT", "Pro Avenger 160 WT", "Pro Avenger 17 WT"]) assert.ok(!fisherGaps.includes(resolved), `${resolved} remains in the missing-model report`);
assert.ok(!ultraGaps.includes("Trophy 166W"), "Trophy 166W remains in the missing-model report");
assert.equal(gaps.candidateModelCount, 121, "Missing-model candidate count was not reduced from 126 to 121");

console.log("Used-market missing-model batch QA passed: 6 records added and 5 audit candidates resolved.");
