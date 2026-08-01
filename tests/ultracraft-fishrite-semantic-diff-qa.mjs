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
assert.equal(current.length, base.length, "Boat record count changed during Ultracraft completeness repair");
const currentById = new Map(current.map(boat => [boat.id, boat]));
const baseById = new Map(base.map(boat => [boat.id, boat]));
assert.equal(currentById.size, baseById.size, "Stable boat ID count changed during Ultracraft completeness repair");

const expectedIds = [
  "boat:Ultracraft (Misty Harbor) | Stealth 169W",
  "boat:Ultracraft (Misty Harbor) | Stealth 178W"
].sort();
const baseTargetIds = base.filter(boat => boat.manufacturer === "Ultracraft (Misty Harbor)").map(boat => boat.id).sort();
const currentTargetIds = current.filter(boat => boat.manufacturer === "Ultracraft (Misty Harbor)").map(boat => boat.id).sort();
assert.equal(JSON.stringify(baseTargetIds), JSON.stringify(expectedIds), "Base Ultracraft stable-ID set was not the expected two records");
assert.equal(JSON.stringify(currentTargetIds), JSON.stringify(expectedIds), "Ultracraft stable-ID set changed during completeness repair");

for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Boat record disappeared during completeness repair: ${id}`);
  if (expectedIds.includes(id)) continue;
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Unrelated boat record changed during Ultracraft completeness repair: ${id}`);
}
for (const id of expectedIds) {
  assert.notEqual(JSON.stringify(currentById.get(id)), JSON.stringify(baseById.get(id)), `${id} did not change during the required completeness repair`);
}
console.log("Semantic diff QA passed: only the two reopened Ultracraft records changed.");
