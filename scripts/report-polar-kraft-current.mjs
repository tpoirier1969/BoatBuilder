import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("data/boats.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "data/boats.js" });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Canonical boat array could not be loaded");

const polar = boats.filter(boat => boat.manufacturer === "Polar Kraft");
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/polar-kraft-current.json", `${JSON.stringify(polar, null, 2)}\n`);

const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ").trim();
const lines = [
  "# Polar Kraft Current Audit Snapshot",
  "",
  `Generated ${new Date().toISOString()}.`,
  "",
  `- Model records: ${polar.length}`,
  `- Generation/evidence rows: ${polar.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0)}`,
  `- Unresolved rows: ${polar.reduce((sum, boat) => sum + (boat.designGenerations || []).filter(g => g.status === "unresolved").length, 0)}`,
  "",
  "| Model | Badge | Ideal | Years | Status | Specs | Pricing | Source |",
  "|---|---|---|---:|---|---|---|---|"
];

for (const boat of polar) {
  for (const generation of boat.designGenerations || []) {
    const specs = Object.entries(generation.specs || {}).map(([label, spec]) => `${label}: ${spec?.value ?? spec}`).join("; ") || "None";
    const pricing = (generation.eras || []).map(era => `${era.startYear}-${era.endYear}: $${Number(era.low || 0).toLocaleString("en-US")}-$${Number(era.high || 0).toLocaleString("en-US")}`).join("; ") || "Missing";
    lines.push(`| ${cell(boat.model)} | ${cell(boat.badge)} | ${boat.idealMatch ? "Yes" : "No"} | ${generation.startYear ?? "?"}-${generation.endYear ?? "?"} | ${cell(generation.status)} | ${cell(specs)} | ${cell(pricing)} | ${cell(generation.sourceUrl || boat.sourceUrl || "None")} |`);
  }
}

fs.writeFileSync("reports/polar-kraft-current.md", `${lines.join("\n")}\n`);
console.log(`Captured ${polar.length} Polar Kraft records.`);
