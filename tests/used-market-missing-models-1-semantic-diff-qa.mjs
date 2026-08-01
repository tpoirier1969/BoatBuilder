import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const parseBoats = (source, filename) => {
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename });
  assert.ok(Array.isArray(sandbox.window.BOATBUILDER_BOATS), `${filename} did not expose BOATBUILDER_BOATS`);
  return JSON.parse(JSON.stringify(sandbox.window.BOATBUILDER_BOATS));
};
const current = parseBoats(fs.readFileSync("data/boats.js", "utf8"), "current data/boats.js");
const base = parseBoats(execFileSync("git", ["show", "origin/main:data/boats.js"], {
  encoding: "utf8",
  maxBuffer: 100 * 1024 * 1024
}), "origin/main data/boats.js");

const addedIds = new Set([
  "boat:Fisher | Hawk 160 WT",
  "boat:Fisher | Hawk 170 Sport",
  "boat:Fisher | Hawk 170 WT",
  "boat:Fisher | 16 Pro Avenger WT",
  "boat:Fisher | 17 Pro Avenger WT",
  "boat:Ultracraft (Misty Harbor) | Trophy 166W / 166W"
]);
assert.equal(current.length, base.length + addedIds.size, "Unexpected boat-record count change");
const currentById = new Map(current.map(boat => [boat.id, boat]));
const baseById = new Map(base.map(boat => [boat.id, boat]));
for (const id of addedIds) {
  assert.ok(!baseById.has(id), `New stable ID already existed on main: ${id}`);
  assert.ok(currentById.has(id), `Expected new stable ID is missing: ${id}`);
}
for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Pre-existing boat disappeared: ${id}`);
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Pre-existing boat changed during additive batch: ${id}`);
}
const unexpected = current.filter(boat => !baseById.has(boat.id) && !addedIds.has(boat.id));
assert.equal(unexpected.length, 0, `Unexpected new boat records appeared: ${unexpected.map(boat => boat.id).join(", ")}`);

console.log("Semantic diff QA passed: six approved rows were added and all 170 pre-existing boats remained unchanged.");
