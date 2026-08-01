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
const base = parseBoats(execFileSync("git", ["show", "origin/main:data/boats.js"], { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 }), "origin/main data/boats.js");
assert.equal(current.length, base.length, "Boat record count changed during MonArk/Spectrum audit");
const currentById = new Map(current.map(boat => [boat.id, boat]));
const baseById = new Map(base.map(boat => [boat.id, boat]));
assert.equal(currentById.size, baseById.size, "Stable boat ID count changed during MonArk/Spectrum audit");
const approved = new Set([
  "boat:MonArk | Pro 1700 DC",
  "boat:MonArk | Pro 1800 DC / FS (fiberglass; fails aluminum requirement)",
  "boat:Spectrum / Blue Fin | 1906"
]);
for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Boat record disappeared: ${id}`);
  if (approved.has(id)) continue;
  assert.equal(JSON.stringify(currentById.get(id)), JSON.stringify(baseBoat), `Unapproved record changed: ${id}`);
}
for (const id of approved) assert.notEqual(JSON.stringify(currentById.get(id)), JSON.stringify(baseById.get(id)), `Approved record did not change: ${id}`);
console.log("Semantic diff QA passed: only the three approved MonArk/Spectrum records changed.");
