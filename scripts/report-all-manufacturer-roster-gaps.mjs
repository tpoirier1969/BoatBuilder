import fs from "node:fs";

const manifestPath = "research/all-manufacturer-roster-gaps.json";
const baselinePath = "reports/all-manufacturer-roster-baseline.json";
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

const allCandidates = manifest.manufacturers.flatMap(entry =>
  (entry.missingModels || []).map(model => ({ manufacturer: entry.manufacturer, ...model }))
);
const countBy = key => Object.fromEntries(
  [...allCandidates.reduce((map, item) => map.set(item[key], (map.get(item[key]) || 0) + 1), new Map())]
    .sort(([a], [b]) => a.localeCompare(b))
);
const summary = {
  generatedAt: new Date().toISOString(),
  scope: manifest.scope,
  catalogBoatRecords: baseline.boatRecords,
  catalogManufacturers: baseline.manufacturerCount,
  auditedManufacturers: manifest.manufacturers.length,
  candidateModelCount: allCandidates.length,
  highConfidence: allCandidates.filter(item => item.confidence === "high").length,
  mediumConfidence: allCandidates.filter(item => item.confidence === "medium").length,
  primaryCandidates: allCandidates.filter(item => item.classification === "primary-candidate").length,
  secondaryScreening: allCandidates.filter(item => item.classification === "secondary-screening").length,
  continuityAliasReviews: allCandidates.filter(item => item.classification === "continuity-alias-review").length,
  byConfidence: countBy("confidence"),
  byClassification: countBy("classification"),
  manufacturers: manifest.manufacturers.map(entry => ({
    manufacturer: entry.manufacturer,
    status: entry.status,
    candidateCount: entry.missingModels?.length || 0,
    highConfidence: (entry.missingModels || []).filter(model => model.confidence === "high").length,
    mediumConfidence: (entry.missingModels || []).filter(model => model.confidence === "medium").length,
    primaryCandidates: (entry.missingModels || []).filter(model => model.classification === "primary-candidate").length,
    notes: entry.notes,
    reviewedSources: entry.reviewedSources,
    missingModels: entry.missingModels || [],
  })),
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/all-manufacturer-roster-gaps.json", `${JSON.stringify(summary, null, 2)}\n`);

const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const lines = [
  "# All-Manufacturer Missing-Model Audit",
  "",
  `Generated ${summary.generatedAt}.`,
  "",
  "## Scope",
  "",
  manifest.scope.purpose,
  "",
  `- Catalog baseline: ${summary.catalogBoatRecords} boat records across ${summary.catalogManufacturers} manufacturers`,
  `- Manufacturers audited: ${summary.auditedManufacturers}`,
  `- Candidate missing models or continuity gaps: ${summary.candidateModelCount}`,
  `- High-confidence: ${summary.highConfidence}`,
  `- Medium-confidence: ${summary.mediumConfidence}`,
  `- Primary-size/use candidates: ${summary.primaryCandidates}`,
  `- Secondary screening entries: ${summary.secondaryScreening}`,
  `- Continuity or alias reviews: ${summary.continuityAliasReviews}`,
  "",
  `**Claim rule:** ${manifest.scope.claimPolicy}`,
  "",
  "A candidate is not automatically a new BoatBuilder row. Continuity/alias entries may belong inside an existing stable record, and medium-confidence entries require exact layout confirmation before catalog insertion.",
  "",
  "## Manufacturer summary",
  "",
  "| Manufacturer | Status | Candidates | High | Medium | Primary |",
  "|---|---|---:|---:|---:|---:|",
];
for (const entry of summary.manufacturers) {
  lines.push(`| ${cell(entry.manufacturer)} | ${cell(entry.status)} | ${entry.candidateCount} | ${entry.highConfidence} | ${entry.mediumConfidence} | ${entry.primaryCandidates} |`);
}

lines.push("", "## High-confidence primary candidates", "",
  "| Manufacturer | Missing model/family | Years | Why it matters |",
  "|---|---|---|---|");
for (const item of allCandidates
  .filter(item => item.confidence === "high" && item.classification === "primary-candidate")
  .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.model.localeCompare(b.model))) {
  lines.push(`| ${cell(item.manufacturer)} | ${cell(item.model)} | ${cell(item.years)} | ${cell(item.reason)} |`);
}

lines.push("", "## Full manufacturer findings", "");
for (const entry of summary.manufacturers) {
  lines.push(`### ${entry.manufacturer}`, "", `**Status:** ${entry.status}. ${entry.notes}`, "");
  if (!entry.missingModels.length) {
    lines.push("No fixed model rows were generated. This manufacturer requires listing-by-listing manual screening.", "");
    continue;
  }
  lines.push("| Candidate model/family | Years | Confidence | Classification | Finding | Evidence |",
    "|---|---|---|---|---|---|");
  for (const model of entry.missingModels) {
    const evidence = model.evidenceUrls.map(url => `<${url}>`).join("<br>");
    lines.push(`| ${cell(model.model)} | ${cell(model.years)} | ${cell(model.confidence)} | ${cell(model.classification)} | ${cell(model.reason)} | ${evidence} |`);
  }
  lines.push("");
}

lines.push("## Interpretation", "",
  "The previous generation audits proved that selected existing records were internally consistent. They did not prove that the app contained every relevant factory model. This report is the first catalog-wide missing-model comparison.",
  "",
  "The next catalog work should begin with high-confidence Primary candidates, grouped by manufacturer. Secondary and continuity candidates should not be allowed to crowd the first repair batches.",
  "");

fs.writeFileSync("reports/all-manufacturer-roster-gaps.md", `${lines.join("\n")}\n`);
console.log(`Reported ${summary.candidateModelCount} candidate roster gaps: ${summary.highConfidence} high-confidence and ${summary.mediumConfidence} medium-confidence.`);
