import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync("data/boats.js", "utf8"), sandbox, { filename: "data/boats.js" });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Boat catalog did not load");

const clean = value => value == null ? "" : String(value).trim();
const detailMap = item => new Map((item.details || []).map(detail => [detail.label, detail.value]));
const specText = value => clean(value && typeof value === "object" && "value" in value ? value.value : value);
const pounds = text => {
  const normalized = clean(text).replaceAll(",", "");
  const values = [];
  const regex = /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b/gi;
  let match;
  while ((match = regex.exec(normalized))) values.push(Number(match[1]));
  return [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
};

const rows = [];
for (const boat of boats) {
  const catalogDetails = detailMap(boat);
  const generations = Array.isArray(boat.designGenerations) && boat.designGenerations.length
    ? boat.designGenerations
    : [{
        id: `${boat.id}:catalog`,
        label: "Catalog record",
        startYear: null,
        endYear: null,
        catalogSpecs: true,
        status: "catalog-only"
      }];

  for (const generation of generations) {
    const raw = generation.catalogSpecs
      ? clean(catalogDetails.get("Dry Hull Weight"))
      : specText(generation.specs?.["Dry Hull Weight"]);
    const values = pounds(raw);
    const unavailable = !values.length;
    rows.push({
      boatId: boat.id,
      manufacturer: boat.manufacturer,
      model: boat.model,
      generationId: generation.id,
      generationLabel: generation.label || `${generation.startYear || "?"}-${generation.endYear || "?"}`,
      startYear: Number.isInteger(generation.startYear) ? generation.startYear : null,
      endYear: Number.isInteger(generation.endYear) ? generation.endYear : null,
      status: generation.status || null,
      rawWeight: raw || null,
      lowLb: unavailable ? null : values[0],
      highLb: unavailable ? null : values.at(-1),
      classification: unavailable ? "missing-published-weight" : values.length > 1 ? "published-range-or-conflict" : "published-single",
      needsResearch: unavailable
    });
  }
}

const missing = rows.filter(row => row.needsResearch);
const ranges = rows.filter(row => row.classification === "published-range-or-conflict");
const byManufacturer = [...new Set(rows.map(row => row.manufacturer))].sort().map(manufacturer => {
  const group = rows.filter(row => row.manufacturer === manufacturer);
  return {
    manufacturer,
    generations: group.length,
    published: group.filter(row => !row.needsResearch).length,
    missing: group.filter(row => row.needsResearch).length,
    rangeOrConflict: group.filter(row => row.classification === "published-range-or-conflict").length
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  scope: "Every BoatBuilder boat record and every documented design generation/evidence row",
  policy: {
    hullWeights: "Published era-specific dry-hull weights only. Missing values remain unavailable until sourced.",
    conflicts: "Retain conflicting published figures as a range with notes; do not average them.",
    estimates: "No inferred hull-weight fallback is permitted."
  },
  totals: {
    boats: boats.length,
    generations: rows.length,
    publishedGenerations: rows.length - missing.length,
    missingPublishedGenerations: missing.length,
    publishedRangesOrConflicts: ranges.length
  },
  byManufacturer,
  missing,
  ranges,
  rows
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/weight-coverage.json", `${JSON.stringify(report, null, 2)}\n`);

const md = [
  "# BoatBuilder hull-weight coverage",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Policy",
  "",
  "- Use published, era-specific dry-hull weights.",
  "- Preserve source conflicts as ranges.",
  "- Do not estimate a missing hull weight.",
  "",
  "## Totals",
  "",
  `- Boats: ${report.totals.boats}`,
  `- Generation/evidence rows: ${report.totals.generations}`,
  `- Rows with a usable published weight: ${report.totals.publishedGenerations}`,
  `- Rows still needing published weight research: ${report.totals.missingPublishedGenerations}`,
  `- Published ranges/conflicts: ${report.totals.publishedRangesOrConflicts}`,
  "",
  "## Coverage by manufacturer",
  "",
  "| Manufacturer | Generations | Published | Missing | Range/conflict |",
  "|---|---:|---:|---:|---:|",
  ...byManufacturer.map(row => `| ${row.manufacturer} | ${row.generations} | ${row.published} | ${row.missing} | ${row.rangeOrConflict} |`),
  "",
  "## Missing published hull weights",
  "",
  ...(missing.length ? missing.map(row => `- **${row.manufacturer} ${row.model}** · ${row.generationLabel} · \`${row.generationId}\``) : ["None"]),
  "",
  "## Published ranges or conflicts",
  "",
  ...(ranges.length ? ranges.map(row => `- **${row.manufacturer} ${row.model}** · ${row.generationLabel}: ${row.rawWeight}`) : ["None"]),
  ""
].join("\n");
fs.writeFileSync("reports/weight-coverage.md", md);

console.log(JSON.stringify(report.totals));
