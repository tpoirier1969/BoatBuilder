import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
for (const file of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
}

const boats = sandbox.window.BOATBUILDER_DATA.items
  .filter(item => item.categoryId === "boats")
  .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.model.localeCompare(b.model));

const getDetail = (boat, label) => boat.details?.find(detail => detail.label === label)?.value ?? "";
const manufacturers = new Map();
for (const boat of boats) {
  if (!manufacturers.has(boat.manufacturer)) manufacturers.set(boat.manufacturer, []);
  const generations = (boat.designGenerations || []).map(g => ({
    startYear: g.startYear,
    endYear: g.endYear,
    status: g.status,
    label: g.label,
    sourceUrl: g.sourceUrl || boat.sourceUrl || "",
  }));
  manufacturers.get(boat.manufacturer).push({
    id: boat.id,
    model: boat.model,
    badge: boat.badge,
    idealMatch: Boolean(boat.idealMatch),
    subtitle: boat.subtitle || "",
    layout: getDetail(boat, "Layout"),
    construction: getDetail(boat, "Construction"),
    bigWaterSuitability: getDetail(boat, "Big-Water Suitability"),
    modelYears: getDetail(boat, "Model Years / Era"),
    generations,
  });
}

const json = {
  generatedAt: new Date().toISOString(),
  boatRecords: boats.length,
  manufacturerCount: manufacturers.size,
  manufacturers: [...manufacturers.entries()].map(([manufacturer, models]) => ({
    manufacturer,
    modelCount: models.length,
    models,
  })),
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/all-manufacturer-roster-baseline.json", `${JSON.stringify(json, null, 2)}\n`);

const lines = [
  "# All-Manufacturer Roster Baseline",
  "",
  `Generated ${json.generatedAt}.`,
  "",
  `- Boat records: ${json.boatRecords}`,
  `- Manufacturers represented: ${json.manufacturerCount}`,
  "",
  "This is the catalog side of the missing-model audit. It does not claim that any manufacturer roster is complete.",
  "",
  "| Manufacturer | Models in BoatBuilder | Model names |",
  "|---|---:|---|",
];
const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
for (const entry of json.manufacturers) {
  lines.push(`| ${cell(entry.manufacturer)} | ${entry.modelCount} | ${cell(entry.models.map(model => model.model).join("; "))} |`);
}
lines.push("", "## Detailed model coverage", "");
for (const entry of json.manufacturers) {
  lines.push(`### ${entry.manufacturer}`, "", "| Model | Tier | Existing year/evidence coverage | Layout |", "|---|---|---|---|");
  for (const model of entry.models) {
    const coverage = model.generations.length
      ? model.generations.map(g => `${g.startYear}-${g.endYear} (${g.status})`).join("; ")
      : model.modelYears || "No structured coverage";
    lines.push(`| ${cell(model.model)} | ${cell(model.badge)} | ${cell(coverage)} | ${cell(model.layout)} |`);
  }
  lines.push("");
}
fs.writeFileSync("reports/all-manufacturer-roster-baseline.md", `${lines.join("\n")}\n`);
console.log(`Captured ${boats.length} boat records across ${manufacturers.size} manufacturers.`);
