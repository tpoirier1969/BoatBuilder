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

assert.equal(current.length, base.length, "Boat record count changed during Polar Kraft audit");
const currentById = new Map(current.map(boat => [boat.id, boat]));
const baseById = new Map(base.map(boat => [boat.id, boat]));
assert.equal(currentById.size, baseById.size, "Stable boat ID count changed during Polar Kraft audit");

const expectedPolarIds = [
  "boat:Polar Kraft | Frontier 179 WT",
  "boat:Polar Kraft | Kodiak Sport V180 (Primary; Outlander 2010 WT is Secondary)",
  "boat:Polar Kraft | Kodiak V170 FS",
  "boat:Polar Kraft | Outlander 2010 WT (Secondary; not Kodiak V180)"
].sort();
const basePolarIds = base.filter(boat => boat.manufacturer === "Polar Kraft").map(boat => boat.id).sort();
const currentPolarIds = current.filter(boat => boat.manufacturer === "Polar Kraft").map(boat => boat.id).sort();
assert.equal(JSON.stringify(basePolarIds), JSON.stringify(expectedPolarIds), "Base Polar Kraft stable-ID set was not the expected four records");
assert.equal(JSON.stringify(currentPolarIds), JSON.stringify(expectedPolarIds), "Polar Kraft stable-ID set changed during audit");

for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Boat record disappeared during Polar Kraft audit: ${id}`);
  if (expectedPolarIds.includes(id)) continue;
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Non-Polar-Kraft record changed during Polar Kraft audit: ${id}`);
}

console.log("Semantic diff QA passed: only the four approved Polar Kraft records changed.");
