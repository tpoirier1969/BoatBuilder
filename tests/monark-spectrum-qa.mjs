import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("data/boats.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "data/boats.js" });
const boats = JSON.parse(JSON.stringify(sandbox.window.BOATBUILDER_BOATS));

const ids = [
  "boat:MonArk | Pro 1700 DC",
  "boat:MonArk | Pro 1800 DC / FS (fiberglass; fails aluminum requirement)",
  "boat:Spectrum / Blue Fin | 1906"
];
const selected = ids.map(id => {
  const boat = boats.find(entry => entry.id === id);
  assert.ok(boat, `Missing target record ${id}`);
  return boat;
});
assert.equal(selected.length, 3);

for (const boat of selected) {
  assert.ok(Array.isArray(boat.designGenerations) && boat.designGenerations.length > 0, `${boat.id} lacks generations`);
  assert.equal(boat.designGenerations.some(g => g.status === "unresolved"), false, `${boat.id} still contains unresolved rows`);
  const sorted = [...boat.designGenerations].sort((a,b)=>a.startYear-b.startYear || a.endYear-b.endYear);
  for (let i=0; i<sorted.length; i++) {
    const g = sorted[i];
    assert.ok(Number.isInteger(g.startYear) && Number.isInteger(g.endYear) && g.startYear <= g.endYear, `${g.id} has invalid years`);
    if (i > 0) assert.ok(sorted[i-1].endYear < g.startYear, `${boat.id} has overlapping generation rows`);
    assert.ok(g.specs && Object.keys(g.specs).length > 0, `${g.id} lacks specs`);
    assert.ok(Array.isArray(g.eras) && g.eras.length > 0, `${g.id} lacks pricing`);
    for (const e of g.eras) {
      assert.ok(e.startYear >= g.startYear && e.endYear <= g.endYear, `${e.id} escapes its generation`);
      assert.ok(Number.isFinite(e.low) && Number.isFinite(e.high) && e.low <= e.high, `${e.id} has invalid price range`);
    }
  }
}

const pro1700 = selected[0];
assert.deepEqual(pro1700.designGenerations.map(g => [g.startYear,g.endYear]), [[1993,1993],[1995,1997],[1998,1998]]);
assert.match(pro1700.designGenerations[0].specs["Dry Hull Weight"].value, /1,050/);
assert.match(pro1700.designGenerations[1].specs["Dry Hull Weight"].value, /1,000/);
assert.equal(pro1700.designGenerations[2].specs["Max HP"].value, "125");
assert.match(pro1700.details.find(d=>d.label==="Research Status")?.value || "", /1994/);

const pro1800 = selected[1];
assert.deepEqual(pro1800.designGenerations.map(g => [g.startYear,g.endYear]), [[1996,1996]]);
assert.equal(pro1800.designGenerations[0].specs.Construction.value, "Fiberglass");
assert.match(pro1800.designGenerations[0].specs["Dry Hull Weight"].value, /1,415/);
assert.equal(pro1800.details.find(d=>d.label==="Recommendation")?.value, "Reject for this project");

const spectrum = selected[2];
assert.deepEqual(spectrum.designGenerations.map(g => [g.startYear,g.endYear]), [[1990,1991],[1992,1993]]);
assert.match(spectrum.designGenerations[0].specs["Dry Hull Weight"].value, /1,050/);
assert.match(spectrum.designGenerations[1].specs["Dry Hull Weight"].value, /1,150/);
for (const g of spectrum.designGenerations) assert.doesNotMatch(g.specs.Construction.value, /welded/i);

console.log("MonArk/Spectrum QA passed: 3 records and 6 non-overlapping generation/evidence rows.");
