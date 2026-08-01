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

assert.equal(current.length, base.length, "Boat record count changed during G3 audit");
const currentById = new Map(current.map(boat => [boat.id, boat]));
const baseById = new Map(base.map(boat => [boat.id, boat]));
assert.equal(currentById.size, baseById.size, "Stable boat ID count changed during G3 audit");

const expectedG3Ids = [
  "boat:G3 | Angler V172 FS / WT",
  "boat:G3 | Angler V175 FS",
  "boat:G3 | Angler V185 FS (Secondary; V172 is Primary)"
].sort();
const baseG3Ids = base.filter(boat => boat.manufacturer === "G3").map(boat => boat.id).sort();
const currentG3Ids = current.filter(boat => boat.manufacturer === "G3").map(boat => boat.id).sort();
assert.equal(JSON.stringify(baseG3Ids), JSON.stringify(expectedG3Ids), "Base G3 stable-ID set was not the expected three records");
assert.equal(JSON.stringify(currentG3Ids), JSON.stringify(expectedG3Ids), "G3 stable-ID set changed during audit");

for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Boat record disappeared during G3 audit: ${id}`);
  if (expectedG3Ids.includes(id)) continue;
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Non-G3 record changed during G3 audit: ${id}`);
}

console.log("Semantic diff QA passed: only the three approved G3 records changed.");
