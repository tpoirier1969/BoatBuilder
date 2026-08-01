import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const sandbox = { window: {} };

for (const relativePath of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(read(relativePath), sandbox, { filename: relativePath });
}

const catalog = sandbox.window.BOATBUILDER_DATA;
if (!catalog?.items?.length) throw new Error("Canonical catalog could not be loaded");

const boats = catalog.items.filter(item => item.category === "Boats" || Array.isArray(item.designGenerations));
const unresolved = [];

for (const boat of boats) {
  for (const generation of boat.designGenerations || []) {
    if (generation.status !== "unresolved") continue;
    const sources = [
      ...(generation.sources || []),
      ...(generation.specSources || []),
      ...(generation.eraSources || [])
    ].filter(Boolean);
    unresolved.push({
      manufacturer: boat.manufacturer || "Unknown",
      model: boat.model || boat.displayName || boat.id,
      id: boat.id,
      generationId: generation.id,
      generation: generation.label || `${generation.startYear ?? "?"}-${generation.endYear ?? "?"}`,
      years: `${generation.startYear ?? "?"}-${generation.endYear ?? "?"}`,
      reason: generation.reason || generation.notes || generation.statusNote || "No unresolved reason recorded",
      sourceCount: sources.length,
      pricing: (generation.eras || []).length ? "Present" : "Missing",
      relevance: boat.idealMatch || String(boat.model || "").startsWith("*") ? "Ideal-match candidate" : "Secondary / screening"
    });
  }
}

unresolved.sort((a, b) =>
  a.manufacturer.localeCompare(b.manufacturer) ||
  a.model.localeCompare(b.model) ||
  a.years.localeCompare(b.years)
);

const grouped = new Map();
for (const row of unresolved) {
  const current = grouped.get(row.manufacturer) || { models: new Set(), rows: 0, missingPricing: 0 };
  current.models.add(row.model);
  current.rows += 1;
  if (row.pricing === "Missing") current.missingPricing += 1;
  grouped.set(row.manufacturer, current);
}

const generatedAt = new Date().toISOString();
const lines = [
  "# Unfinished Boat Generation Work",
  "",
  `Generated from the canonical catalog on ${generatedAt}.`,
  "",
  `- Catalog items: ${catalog.items.length}`,
  `- Boat records: ${boats.length}`,
  `- Unresolved generation rows: ${unresolved.length}`,
  `- Manufacturers affected: ${grouped.size}`,
  "",
  "## Manufacturer summary",
  "",
  "| Manufacturer | Models affected | Unresolved rows | Rows missing pricing |",
  "|---|---:|---:|---:|"
];

for (const [manufacturer, info] of [...grouped.entries()].sort((a, b) => b[1].rows - a[1].rows || a[0].localeCompare(b[0]))) {
  lines.push(`| ${manufacturer} | ${info.models.size} | ${info.rows} | ${info.missingPricing} |`);
}

lines.push(
  "",
  "## Unresolved rows",
  "",
  "| Manufacturer | Model | Generation / evidence row | Years | Pricing | Relevance | Recorded reason |",
  "|---|---|---|---:|---|---|---|"
);

const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ").trim();
for (const row of unresolved) {
  lines.push(`| ${cell(row.manufacturer)} | ${cell(row.model)} | ${cell(row.generation)} | ${cell(row.years)} | ${cell(row.pricing)} | ${cell(row.relevance)} | ${cell(row.reason)} |`);
}

lines.push(
  "",
  "## Guardrails",
  "",
  "A manufacturer is not complete merely because its model list looks plausible. Every generation or evidence row must have documented specifications, generation-contained package pricing, and a defensible disposition. Family-name guesses and copied specifications from adjacent years remain unresolved until supported.",
  ""
);

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/unfinished-work.md"), `${lines.join("\n")}\n`);
fs.writeFileSync(path.join(root, "reports/unfinished-work.json"), `${JSON.stringify({ generatedAt, counts: { catalogItems: catalog.items.length, boats: boats.length, unresolvedRows: unresolved.length, manufacturers: grouped.size }, unresolved }, null, 2)}\n`);

const smokerCraft = boats.filter(boat => boat.manufacturer === "Smoker Craft");
fs.writeFileSync(path.join(root, "reports/smoker-craft-current.json"), `${JSON.stringify(smokerCraft, null, 2)}\n`);

console.log(`Wrote unfinished report with ${unresolved.length} unresolved generation rows across ${grouped.size} manufacturers.`);
console.log(`Captured ${smokerCraft.length} current Smoker Craft records for audit.`);
