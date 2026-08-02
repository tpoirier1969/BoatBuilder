import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const parse = (source, filename) => {
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename });
  assert.ok(Array.isArray(sandbox.window.BOATBUILDER_BOATS), `${filename} did not expose the boat array`);
  return JSON.parse(JSON.stringify(sandbox.window.BOATBUILDER_BOATS));
};
const current = parse(fs.readFileSync("data/boats.js", "utf8"), "current data/boats.js");
const base = parse(execFileSync("git", ["show", "origin/main:data/boats.js"], {
  encoding: "utf8",
  maxBuffer: 100 * 1024 * 1024
}), "origin/main data/boats.js");

const expectedAddedIds = new Set([
  "boat:Smoker Craft | Stiletto 162 / 16 Stiletto LE / 165 LE listing alias",
  "boat:Smoker Craft | Millentia 162 Dual",
  "boat:Smoker Craft | Stinger 162 Dual / DC",
  "boat:Smoker Craft | Stealth 162",
  "boat:Smoker Craft | Pro Mag 162",
  "boat:Smoker Craft | Pro Mag 172",
  "boat:Smoker Craft | Pro Angler 162"
]);
assert.equal(current.length, base.length + expectedAddedIds.size, "Exactly seven boat records must be added");

const currentById = new Map(current.map(entry => [entry.id, entry]));
const baseById = new Map(base.map(entry => [entry.id, entry]));
assert.equal(currentById.size, current.length, "Current boat IDs are not unique");
assert.equal(baseById.size, base.length, "Base boat IDs are not unique");

for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Pre-existing boat disappeared: ${id}`);
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Pre-existing boat changed while adding legacy Smoker Craft rows: ${id}`);
}
const actualAddedIds = new Set(current.filter(entry => !baseById.has(entry.id)).map(entry => entry.id));
assert.deepEqual([...actualAddedIds].sort(), [...expectedAddedIds].sort(), "Unexpected added boat IDs");
for (const id of expectedAddedIds) {
  const boat = currentById.get(id);
  assert.ok(boat, `Expected addition is missing: ${id}`);
  assert.equal(boat.manufacturer, "Smoker Craft", `${id} was added under the wrong manufacturer`);
}

console.log(`Semantic diff QA passed: seven approved Smoker Craft records were added and all ${base.length} pre-existing boats remained unchanged.`);
