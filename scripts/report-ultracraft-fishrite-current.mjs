import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
}

const catalog = sandbox.window.BOATBUILDER_DATA;
if (!catalog?.items) throw new Error("Canonical catalog could not be loaded");

const manufacturers = new Set(["Ultracraft (Misty Harbor)", "Fish-Rite"]);
const boats = catalog.items.filter(item => manufacturers.has(item.manufacturer));
const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ").trim();
const generatedAt = new Date().toISOString();

const lines = [
  "# Ultracraft and Fish-Rite Current Audit Snapshot",
  "",
  `Generated ${generatedAt}.`,
  "",
  `- Model records: ${boats.length}`,
  `- Generation/evidence rows: ${boats.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0)}`,
  `- Unresolved rows: ${boats.reduce((sum, boat) => sum + (boat.designGenerations || []).filter(row => row.status === "unresolved").length, 0)}`,
  "",
  "| Manufacturer | Model | Badge | Ideal | Years | Status | Specs | Pricing | Source |",
  "|---|---|---|---|---:|---|---|---|---|"
];

for (const boat of boats) {
  for (const generation of boat.designGenerations || []) {
    const specs = Object.entries(generation.specs || {}).map(([label, value]) => `${label}: ${value?.value ?? value}`).join("; ") || "None";
    const pricing = (generation.eras || []).map(era => `${era.startYear}-${era.endYear}: $${era.low}-$${era.high}`).join("; ") || "Missing";
    lines.push(`| ${cell(boat.manufacturer)} | ${cell(boat.model)} | ${cell(boat.badge)} | ${boat.idealMatch ? "Yes" : "No"} | ${generation.startYear}-${generation.endYear} | ${cell(generation.status)} | ${cell(specs)} | ${cell(pricing)} | ${cell(generation.sourceUrl || boat.sourceUrl || "None")} |`);
  }
}

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/ultracraft-fishrite-current.json", `${JSON.stringify(boats, null, 2)}\n`);
fs.writeFileSync("reports/ultracraft-fishrite-current.md", `${lines.join("\n")}\n`);
console.log(`Captured ${boats.length} Ultracraft/Fish-Rite records.`);
