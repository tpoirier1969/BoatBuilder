import fs from "node:fs";
import vm from "node:vm";

const sandbox = { window: {} };
for (const file of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
}
const targetManufacturers = new Set(["MonArk", "Spectrum / Blue Fin"]);
const boats = sandbox.window.BOATBUILDER_DATA.items.filter(item => targetManufacturers.has(item.manufacturer));
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/monark-spectrum-current.json", `${JSON.stringify(boats, null, 2)}\n`);
const rows = [
  "# MonArk and Spectrum / Blue Fin Current Audit Snapshot", "", `Generated ${new Date().toISOString()}.`, "",
  `- Model records: ${boats.length}`,
  `- Generation/evidence rows: ${boats.reduce((n,b)=>n+(b.designGenerations||[]).length,0)}`,
  `- Unresolved rows: ${boats.reduce((n,b)=>n+(b.designGenerations||[]).filter(g=>g.status==="unresolved").length,0)}`,
  "", "| Manufacturer | Model | Badge | Ideal | Years | Status | Specs | Pricing | Source |",
  "|---|---|---|---|---:|---|---|---|---|"
];
const cell = v => String(v ?? "").replaceAll("|","\\|").replaceAll("\n"," ");
for (const boat of boats) for (const g of boat.designGenerations || []) {
  const specs = Object.entries(g.specs || {}).map(([k,v])=>`${k}: ${v?.value ?? v}`).join("; ") || "None";
  const pricing = (g.eras || []).map(e=>`${e.startYear}-${e.endYear}: $${e.low}-$${e.high}`).join("; ") || "Missing";
  rows.push(`| ${cell(boat.manufacturer)} | ${cell(boat.model)} | ${cell(boat.badge)} | ${boat.idealMatch?"Yes":"No"} | ${g.startYear}-${g.endYear} | ${cell(g.status)} | ${cell(specs)} | ${cell(pricing)} | ${cell(g.sourceUrl || boat.sourceUrl)} |`);
}
fs.writeFileSync("reports/monark-spectrum-current.md", `${rows.join("\n")}\n`);
console.log(`Captured ${boats.length} MonArk/Spectrum records.`);
