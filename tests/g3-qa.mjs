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
const g3 = catalog.items.filter(entry => entry.manufacturer === "G3");
assert.equal(g3.length, 3, "G3 focused model count changed");
assert.equal(g3.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 8, "G3 generation/evidence-row count changed");
assert.equal(g3.filter(boat => boat.idealMatch).length, 0, "G3 ideal-match set changed");

for (const boat of g3) {
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  let previousEnd = -Infinity;
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    assert.ok(Number.isInteger(generation.startYear), `${generation.id} lacks a numeric start year`);
    assert.ok(Number.isInteger(generation.endYear), `${generation.id} lacks a numeric end year`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has a reversed year range`);
    assert.ok(generation.startYear > previousEnd, `${boat.id} has overlapping G3 generation rows`);
    previousEnd = generation.endYear;
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained pricing`);
    for (const valueEra of generation.eras) {
      assert.ok(Number.isFinite(valueEra.low) && Number.isFinite(valueEra.high) && valueEra.low <= valueEra.high, `${valueEra.id} has invalid pricing`);
      assert.ok(valueEra.startYear >= generation.startYear && valueEra.endYear <= generation.endYear, `${valueEra.id} crosses its G3 generation`);
    }
    assert.match(generation.specs?.Construction?.value || "", /Riveted/i, `${generation.id} lost the verified riveted construction identity`);
  }
  const research = (boat.details || []).find(detail => detail.label === "Research Status")?.value || "";
  assert.doesNotMatch(research, /remaining advertised years require|status.*unresolved/i, `${boat.id} still claims unfinished research`);
}

const requireBoat = id => {
  const boat = g3.find(entry => entry.id === id);
  assert.ok(boat, `Missing expected G3 record ${id}`);
  return boat;
};
const chronology = boat => (boat.designGenerations || []).map(entry => [entry.startYear, entry.endYear]);
const generation = (boat, startYear, endYear) => {
  const found = boat.designGenerations.find(entry => entry.startYear === startYear && entry.endYear === endYear);
  assert.ok(found, `${boat.id} is missing ${startYear}-${endYear}`);
  return found;
};

const v172 = requireBoat("boat:G3 | Angler V172 FS / WT");
assert.equal(v172.model, "Angler V172 FS (full-windshield / walk-through)", "V172 factory identity changed");
assert.equal(JSON.stringify(chronology(v172)), JSON.stringify([[2009, 2009], [2010, 2012], [2013, 2016]]), "V172 chronology changed");
assert.equal(generation(v172, 2010, 2012).specs["Dry Hull Weight"].value, "1,460 lb", "Early V172 weight changed");
assert.equal(generation(v172, 2013, 2016).specs["Dry Hull Weight"].value, "1,440 lb", "Later V172 weight changed");
assert.equal(generation(v172, 2013, 2016).specs["Chine / Bottom Width"].value, "79\"", "V172 bottom width changed");
assert.equal(generation(v172, 2013, 2016).specs["Max HP"].value, "115", "V172 horsepower changed");
assert.match((v172.details || []).find(detail => detail.label === "Layout")?.value || "", /FS.*factory|factory.*FS/i, "V172 layout no longer explains the factory FS suffix");
assert.ok(v172.designGenerations.every(entry => entry.endYear <= 2016), "V172 incorrectly extends into the renamed V17 era");

const v175 = requireBoat("boat:G3 | Angler V175 FS");
assert.equal(JSON.stringify(chronology(v175)), JSON.stringify([[2006, 2009], [2010, 2012], [2013, 2016]]), "V175 chronology changed");
assert.equal(generation(v175, 2010, 2012).specs.Length.value, "17'10\" in retained Yamaha bulletin", "V175 retained bulletin length changed");
assert.equal(generation(v175, 2013, 2016).specs.Length.value, "17'5\"", "V175 factory-table length changed");
assert.match(v175.generationWarning || "", /conflict/i, "V175 length-source conflict is no longer visible");
assert.equal(generation(v175, 2013, 2016).specs["Dry Hull Weight"].value, "1,680 lb", "V175 weight changed");
assert.ok(v175.designGenerations.every(entry => entry.endYear <= 2016), "V175 incorrectly extends into the renamed V17/V18 era");

const v185 = requireBoat("boat:G3 | Angler V185 FS (Secondary; V172 is Primary)");
assert.equal(v185.badge, "Secondary", "V185 recommendation changed");
assert.equal(JSON.stringify(chronology(v185)), JSON.stringify([[2005, 2012], [2013, 2014]]), "V185 FS chronology changed");
assert.equal(generation(v185, 2013, 2014).specs.Length.value, "18'5\"", "V185 length changed");
assert.equal(generation(v185, 2013, 2014).specs.Beam.value, "96\"", "V185 beam changed");
assert.equal(generation(v185, 2013, 2014).specs["Dry Hull Weight"].value, "1,800 lb", "V185 weight changed");
assert.equal(generation(v185, 2013, 2014).specs["Max HP"].value, "200", "V185 horsepower changed");
assert.ok(v185.designGenerations.every(entry => entry.endYear <= 2014), "V185 FS incorrectly extends into the SF/F-only 2015 lineup");

console.log(`G3 QA passed: ${g3.length} models and 8 non-overlapping generation/evidence rows.`);
