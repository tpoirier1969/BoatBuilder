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

const currentSource = fs.readFileSync("data/boats.js", "utf8");
const baseSource = execFileSync("git", ["show", "origin/main:data/boats.js"], { encoding: "utf8" });
const current = parseBoats(currentSource, "current data/boats.js");
const base = parseBoats(baseSource, "origin/main data/boats.js");

assert.equal(current.length, base.length, "Boat record count changed during the Smoker Craft audit");

const byId = boats => new Map(boats.map(boat => [boat.id, boat]));
const currentById = byId(current);
const baseById = byId(base);
assert.equal(currentById.size, baseById.size, "Stable boat ID count changed during the Smoker Craft audit");

const smokerIds = new Set(base.filter(boat => boat.manufacturer === "Smoker Craft").map(boat => boat.id));
for (const [id, baseBoat] of baseById) {
  assert.ok(currentById.has(id), `Boat record disappeared during Smoker Craft audit: ${id}`);
  if (smokerIds.has(id)) continue;
  assert.equal(
    JSON.stringify(currentById.get(id)),
    JSON.stringify(baseBoat),
    `Non-Smoker-Craft record changed during Smoker Craft audit: ${id}`
  );
}

const allowedOspreyIds = new Set([
  "boat:Smoker Craft | Osprey 162 WT (Secondary; wide WT version is 2020s)",
  "boat:Smoker Craft | Osprey 172 WT (Secondary; qualifying WT is 2020s)"
]);
const ultimaId = "boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)";

const normalizeNotes = boat => {
  for (const detail of boat.details || []) {
    if (detail.label === "Notes") detail.value = "<AUDITED NOTES>";
  }
};

const normalizeYearText = value => {
  if (typeof value !== "string") return value;
  return value.replaceAll("2017-2018", "2016-2018").replaceAll("2017–2018", "2016–2018");
};

const normalizeUltima = boat => {
  normalizeNotes(boat);
  for (const generation of boat.designGenerations || []) {
    const isLaterHull = generation.specs?.Length?.value === "18'5\"" &&
      ((generation.startYear === 2016 && generation.endYear === 2018) ||
       (generation.startYear === 2017 && generation.endYear === 2018));
    if (!isLaterHull) continue;
    generation.startYear = 2016;
    generation.id = normalizeYearText(generation.id);
    generation.label = normalizeYearText(generation.label);
    generation.specificationBasis = normalizeYearText(generation.specificationBasis);
    for (const era of generation.eras || []) {
      if (era.startYear === 2017) era.startYear = 2016;
      era.id = normalizeYearText(era.id);
      era.label = normalizeYearText(era.label);
      era.basis = normalizeYearText(era.basis);
    }
  }
};

for (const id of smokerIds) {
  const baseBoat = structuredClone(baseById.get(id));
  const currentBoat = structuredClone(currentById.get(id));

  if (allowedOspreyIds.has(id)) {
    baseBoat.model = currentBoat.model;
    baseBoat.displayName = currentBoat.displayName;
    normalizeNotes(baseBoat);
    normalizeNotes(currentBoat);
  } else if (id === ultimaId) {
    normalizeUltima(baseBoat);
    normalizeUltima(currentBoat);
  }

  assert.equal(
    JSON.stringify(currentBoat),
    JSON.stringify(baseBoat),
    `Unexpected semantic change in Smoker Craft record: ${id}`
  );
}

console.log("Semantic diff QA passed: only the approved Osprey labels/notes and Ultima 182 chronology changed.");
