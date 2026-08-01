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

const smokerCraft = catalog.items.filter(entry => entry.manufacturer === "Smoker Craft");
assert.equal(smokerCraft.length, 18, "Smoker Craft focused model count changed");
assert.equal(
  smokerCraft.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0),
  70,
  "Smoker Craft generation/evidence-row count changed"
);

const aliasStatuses = new Set(["alias-only"]);
for (const boat of smokerCraft) {
  assert.equal((boat.valueEras || []).length, 0, `${boat.id} retained unsafe top-level value eras`);
  let previousEnd = -Infinity;
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} remains unresolved`);
    if (aliasStatuses.has(generation.status)) {
      assert.equal(generation.startYear, null, `${generation.id} alias unexpectedly has a start year`);
      assert.equal(generation.endYear, null, `${generation.id} alias unexpectedly has an end year`);
      assert.equal((generation.eras || []).length, 0, `${generation.id} alias unexpectedly carries pricing`);
      continue;
    }
    assert.ok(Number.isInteger(generation.startYear), `${generation.id} lacks a numeric start year`);
    assert.ok(Number.isInteger(generation.endYear), `${generation.id} lacks a numeric end year`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has a reversed year range`);
    assert.ok(generation.startYear > previousEnd, `${boat.id} has overlapping Smoker Craft generation rows`);
    previousEnd = generation.endYear;
    assert.ok((generation.eras || []).length >= 1, `${generation.id} lacks generation-contained package pricing`);
    for (const era of generation.eras) {
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
      assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} crosses its Smoker Craft generation`);
    }
  }
}

const expectedIdealIds = [
  "boat:Smoker Craft | Millentia 172 WT",
  "boat:Smoker Craft | Pro Angler 172 (Primary; not Lund Pro Angler)",
  "boat:Smoker Craft | Pro Angler 172 XL",
  "boat:Smoker Craft | Ultima 172"
].sort();
const actualIdealIds = smokerCraft.filter(boat => boat.idealMatch).map(boat => boat.id).sort();
assert.equal(JSON.stringify(actualIdealIds), JSON.stringify(expectedIdealIds), "Smoker Craft ideal-match set changed");

const requireBoat = id => {
  const boat = smokerCraft.find(entry => entry.id === id);
  assert.ok(boat, `Missing expected Smoker Craft record ${id}`);
  return boat;
};
const generation = (boat, startYear, endYear) => {
  const found = boat.designGenerations.find(entry => entry.startYear === startYear && entry.endYear === endYear);
  assert.ok(found, `${boat.id} is missing ${startYear}-${endYear}`);
  return found;
};

const osprey162 = requireBoat("boat:Smoker Craft | Osprey 162 WT (Secondary; wide WT version is 2020s)");
assert.match(osprey162.model, /verified WT begins in 2017/, "Osprey 162 still misstates its verified WT era");
assert.doesNotMatch(osprey162.model, /2020s/, "Osprey 162 retained the false 2020s-only qualifier");
assert.match(generation(osprey162, 2025, 2026).specs["Max / Bow Depth"].value, /Verify.*69/i, "Osprey 162 current website depth typo is being treated as valid data");

const osprey172 = requireBoat("boat:Smoker Craft | Osprey 172 WT (Secondary; qualifying WT is 2020s)");
assert.match(osprey172.model, /verified WT begins in 2017/, "Osprey 172 still misstates its verified WT era");
assert.doesNotMatch(osprey172.model, /2020s/, "Osprey 172 retained the false 2020s-only qualifier");
assert.equal(generation(osprey172, 2025, 2026).specs.Length.value, "17'4\"", "Current Osprey 172 length changed");
assert.equal(generation(osprey172, 2025, 2026).specs.Beam.value, "90\"", "Current Osprey 172 beam changed");
assert.equal(generation(osprey172, 2025, 2026).specs["Dry Hull Weight"].value, "1,165 lb", "Current Osprey 172 weight changed");

const ultima182 = requireBoat("boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)");
const expectedUltima182Chronology = [[2001, 2002], [2015, 2015], [2016, 2016], [2017, 2018], [2019, 2024], [2025, 2026]];
const actualUltima182Chronology = ultima182.designGenerations.map(entry => [entry.startYear, entry.endYear]);
assert.equal(
  JSON.stringify(actualUltima182Chronology),
  JSON.stringify(expectedUltima182Chronology),
  "Ultima 182 chronology changed or the 2016 overlap returned"
);
assert.equal(generation(ultima182, 2016, 2016).specs.Length.value, "18'2\"", "2016 Ultima 182 exact hull length changed");
assert.equal(generation(ultima182, 2017, 2018).specs.Length.value, "18'5\"", "2017-2018 Ultima 182 later hull length changed");
assert.equal(generation(ultima182, 2025, 2026).specs.Length.value, "18'2\"", "Current Ultima 182 length changed");
assert.equal(generation(ultima182, 2025, 2026).specs["Dry Hull Weight"].value, "1,425 lb", "Current Ultima 182 weight changed");

const proAngler172XL = requireBoat("boat:Smoker Craft | Pro Angler 172 XL");
assert.equal(generation(proAngler172XL, 2025, 2026).specs.Length.value, "17'3\"", "Current Pro Angler 172 XL length changed");
assert.equal(generation(proAngler172XL, 2025, 2026).specs.Beam.value, "96\"", "Current Pro Angler 172 XL beam changed");
assert.equal(generation(proAngler172XL, 2025, 2026).specs["Dry Hull Weight"].value, "1,305 lb", "Current Pro Angler 172 XL weight changed");

console.log(`Smoker Craft QA passed: ${smokerCraft.length} models and 70 non-overlapping generation/evidence rows.`);
