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

assert.equal(current.length, base.length, "Boat record count changed during Fisher audit");
const currentById = new Map(current.map(boat => [boat.id, boat]));
const baseById = new Map(base.map(boat => [boat.id, boat]));
assert.equal(currentById.size, baseById.size, "Stable boat ID count changed during Fisher audit");

const expectedFisherIds = [
  "boat:Fisher | Hawk 170 FS",
  "boat:Fisher | Hawk 186 FS",
  "boat:Fisher | Hawk 200 FS"
].sort();
const baseFisherIds = base.filter(boat => boat.manufacturer === "Fisher").map(boat => boat.id).sort();
const currentFisherIds = current.filter(boat => boat.manufacturer === "Fisher").map(boat => boat.id).sort();
assert.equal(JSON.stringify(baseFisherIds), JSON.stringify(expectedFisherIds), "Base Fisher stable-ID set was not the expected three records");
assert.equal(JSON.stringify(currentFisherIds), JSON.stringify(expectedFisherIds), "Fisher stable-ID set changed during audit");

for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Boat record disappeared during Fisher audit: ${id}`);
  if (expectedFisherIds.includes(id)) continue;
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Non-Fisher record changed during Fisher audit: ${id}`);
}

console.log("Semantic diff QA passed: only the three approved Fisher records changed.");
