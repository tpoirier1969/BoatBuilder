import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const source = fs.readFileSync(boatsPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: boatsPath });

const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Canonical boat array could not be loaded");

const requireBoat = id => {
  const boat = boats.find(entry => entry.id === id);
  if (!boat) throw new Error(`Missing expected Smoker Craft record: ${id}`);
  return boat;
};

const setDetail = (boat, label, value) => {
  const detail = (boat.details || []).find(entry => entry.label === label);
  if (detail) detail.value = value;
  else (boat.details ||= []).push({ label, value });
};

const replaceYearSpan = (value, from, to) => {
  if (typeof value !== "string") return value;
  return value.replaceAll(from.hyphen, to.hyphen).replaceAll(from.dash, to.dash);
};

const renameOsprey = ({ id, model, displayName, notes }) => {
  const boat = requireBoat(id);
  boat.model = model;
  boat.displayName = displayName;
  setDetail(boat, "Notes", notes);
};

renameOsprey({
  id: "boat:Smoker Craft | Osprey 162 WT (Secondary; wide WT version is 2020s)",
  model: "Osprey 162 WT (Secondary; verified WT begins in 2017)",
  displayName: "Smoker Craft | Osprey 162 WT (Secondary; verified WT begins in 2017)",
  notes: "The verified wide walk-through, all-welded factory generation begins in 2017. It is a capable compact boat, but complete packages from the verified WT years are generally above the project’s ideal budget."
});

renameOsprey({
  id: "boat:Smoker Craft | Osprey 172 WT (Secondary; qualifying WT is 2020s)",
  model: "Osprey 172 WT (Secondary; verified WT begins in 2017)",
  displayName: "Smoker Craft | Osprey 172 WT (Secondary; verified WT begins in 2017)",
  notes: "The verified dual-console walk-through, all-welded factory generation begins in 2017. The hull is a strong Lake Superior platform, but complete packages from the verified WT years are usually above the $14,000 ceiling."
});

const ultima182 = requireBoat("boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)");
const laterUltimaGeneration = (ultima182.designGenerations || []).find(generation =>
  generation.startYear === 2016 &&
  generation.endYear === 2018 &&
  generation.specs?.Length?.value === "18'5\""
);

if (laterUltimaGeneration) {
  const from = { hyphen: "2016-2018", dash: "2016–2018" };
  const to = { hyphen: "2017-2018", dash: "2017–2018" };
  laterUltimaGeneration.id = replaceYearSpan(laterUltimaGeneration.id, from, to);
  laterUltimaGeneration.label = replaceYearSpan(laterUltimaGeneration.label, from, to);
  laterUltimaGeneration.specificationBasis = replaceYearSpan(laterUltimaGeneration.specificationBasis, from, to);
  laterUltimaGeneration.startYear = 2017;
  for (const era of laterUltimaGeneration.eras || []) {
    era.id = replaceYearSpan(era.id, from, to);
    era.label = replaceYearSpan(era.label, from, to);
    era.basis = replaceYearSpan(era.basis, from, to);
    if (era.startYear === 2016) era.startYear = 2017;
  }
}

ultima182.designGenerations.sort((a, b) =>
  (a.startYear ?? Number.MAX_SAFE_INTEGER) - (b.startYear ?? Number.MAX_SAFE_INTEGER) ||
  (a.endYear ?? Number.MAX_SAFE_INTEGER) - (b.endYear ?? Number.MAX_SAFE_INTEGER)
);
setDetail(
  ultima182,
  "Notes",
  "The chronology now keeps the exact 2016 18'2-inch hull separate from the 2017–2018 18'5-inch generation. Later 18'2-inch records are also retained separately rather than blending the two hull lengths."
);

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) {
  throw new Error("Could not locate canonical boat array wrapper");
}

const output = `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`;
fs.writeFileSync(boatsPath, output);

console.log("Applied verified Smoker Craft chronology and labeling repairs.");
