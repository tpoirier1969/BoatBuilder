import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync("data/equipment.js", "utf8"), sandbox, { filename: "data/equipment.js" });
const equipment = sandbox.window.BOATBUILDER_EQUIPMENT;
if (!Array.isArray(equipment)) throw new Error("Equipment catalog did not load");

const relevant = new Set(["main-motors", "kickers", "bow-trolling-motors", "downriggers", "electrical", "canvas"]);
const rows = equipment.map(item => ({
  id: item.id,
  categoryId: item.categoryId,
  subtypeId: item.subtypeId || null,
  subtypeName: item.subtypeName || null,
  manufacturer: item.manufacturer,
  model: item.model,
  displayName: item.displayName,
  subtitle: item.subtitle || null,
  details: Object.fromEntries((item.details || []).map(detail => [detail.label, detail.value])),
  relevantToWeightModel: relevant.has(item.categoryId)
}));

const byCategory = [...new Set(rows.map(row => row.categoryId))].sort().map(categoryId => ({
  categoryId,
  count: rows.filter(row => row.categoryId === categoryId).length,
  relevant: relevant.has(categoryId)
}));

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    equipment: rows.length,
    relevantCategoryItems: rows.filter(row => row.relevantToWeightModel).length
  },
  byCategory,
  rows
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/equipment-weight-scope.json", `${JSON.stringify(report, null, 2)}\n`);
const md = [
  "# BoatBuilder equipment weight scope",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `- Equipment records: ${report.totals.equipment}`,
  `- Records in weight-relevant categories: ${report.totals.relevantCategoryItems}`,
  "",
  "## Categories",
  "",
  "| Category | Records | Weight model |",
  "|---|---:|---|",
  ...byCategory.map(row => `| ${row.categoryId} | ${row.count} | ${row.relevant ? "Yes" : "Only when a published/item estimate exceeds 30 lb"} |`),
  "",
  "## Records",
  "",
  ...rows.filter(row => row.relevantToWeightModel).map(row => {
    const clues = Object.entries(row.details).filter(([key]) => /weight|hp|horse|thrust|voltage|shaft|battery|capacity/i.test(key)).map(([key,value]) => `${key}: ${value}`).join("; ");
    return `- **${row.displayName}** · \`${row.id}\`${clues ? ` · ${clues}` : ""}`;
  }),
  ""
].join("\n");
fs.writeFileSync("reports/equipment-weight-scope.md", md);
console.log(JSON.stringify(report.totals));
