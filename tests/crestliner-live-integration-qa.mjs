import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
const run = path => vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
run("data/boats.js");
assert.equal(sandbox.window.BOATBUILDER_BOATS.length, 183);
run("data/boat-history-patches.js");
run("data/equipment.js");
run("data/catalog.js");

const boats = sandbox.window.BOATBUILDER_BOATS;
const get = id => boats.find(boat => boat.id === id);
const ranges = id => get(id).designGenerations.map(g => [g.startYear, g.endYear]);
const weight = g => g.specs?.["Dry Hull Weight"]?.value ?? null;

assert.equal(boats.length, 185);
assert.equal(sandbox.window.BOATBUILDER_DATA.counts.boats, 185);
assert.equal(new Set(boats.map(boat => boat.id)).size, 185);
assert.deepEqual(ranges("boat:Crestliner | Phantom Sportfish V160"), [[1991, 1994]]);
assert.deepEqual(ranges("boat:Crestliner | Phantom Sportfish V170"), [[1987, 1990], [1991, 1994]]);
assert.deepEqual(ranges("boat:Crestliner | Phantom Sportfish V180"), [[1987, 1990], [1991, 1994]]);
assert.equal(weight(get("boat:Crestliner | Phantom Sportfish V170").designGenerations[0]), "1,075 lb");
assert.equal(weight(get("boat:Crestliner | Phantom Sportfish V170").designGenerations[1]), "1,280 lb");
assert.equal(weight(get("boat:Crestliner | Phantom Sportfish V180").designGenerations[0]), "1,250 lb");
assert.equal(weight(get("boat:Crestliner | Phantom Sportfish V180").designGenerations[1]), "1,440 lb");
assert.deepEqual(ranges("boat:Crestliner | 1650 Sportfish"), [[1995, 1997]]);
assert.deepEqual(ranges("boat:Crestliner | Sportfish 1750").slice(0, 4), [[1995, 1996], [1997, 1997], [1998, 1998], [1999, 1999]]);
const conflict = get("boat:Crestliner | Sportfish 1750").designGenerations[2];
assert.equal(conflict.status, "published-weight-conflict");
assert.equal(weight(conflict), null);
assert.deepEqual(ranges("boat:Crestliner | Sportfish 1850").slice(0, 2), [[1997, 1998], [1999, 1999]]);
assert.deepEqual(ranges("boat:Crestliner | 1950 Sportfish (1995–1996 legacy)"), [[1995, 1996]]);

for (const id of sandbox.window.BOATBUILDER_HISTORY_PATCHES.crestliner.updatedIds.concat(sandbox.window.BOATBUILDER_HISTORY_PATCHES.crestliner.addedIds)) {
  let end = -Infinity;
  for (const generation of get(id).designGenerations) {
    assert.ok(generation.startYear > end, `${id} overlaps generations`);
    end = generation.endYear;
  }
}

const index = fs.readFileSync("index.html", "utf8");
assert.ok(index.indexOf("data/boats.js") < index.indexOf("data/boat-history-patches.js"));
assert.ok(index.indexOf("data/boat-history-patches.js") < index.indexOf("data/catalog.js"));
assert.ok(index.indexOf("app.js") < index.indexOf("ui-enhancements.js"));
const ui = fs.readFileSync("ui-enhancements.js", "utf8");
assert.ok(ui.includes("single-year-hull"));
assert.ok(ui.includes("select disabled"));

console.log("Crestliner live integration QA passed.");
