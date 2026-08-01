import fs from "node:fs";
import vm from "node:vm";

const manifest = JSON.parse(fs.readFileSync("research/manufacturer-audit-scope.json", "utf8"));
const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
}
const boats = sandbox.window.BOATBUILDER_DATA.items.filter(item => item.categoryId === "boats");
const byId = new Map(boats.map(boat => [boat.id, boat]));

const scopeLabels = {
  "partial-batch": "Partial batch",
  "existing-record-generation-complete": "Existing records only",
  "custom-build-disposition": "Custom-build disposition",
  "relevant-family-roster-verified": "Relevant family roster verified",
  "full-manufacturer-roster-verified": "Full manufacturer roster verified"
};
const counts = manifest.audits.reduce((result, audit) => {
  result[audit.scope] = (result[audit.scope] || 0) + 1;
  return result;
}, {});
const rosterFamilies = manifest.audits.flatMap(audit => audit.coveredFamilies || []);
const output = {
  generatedAt: new Date().toISOString(),
  rule: manifest.rule,
  counts,
  audits: manifest.audits.map(audit => ({
    ...audit,
    coveredFamilies: (audit.coveredFamilies || []).map(family => {
      const boat = byId.get(family.stableId);
      return {
        ...family,
        canonicalModel: boat?.model || null,
        canonicalRows: (boat?.designGenerations || []).map(row => ({ startYear: row.startYear, endYear: row.endYear, status: row.status }))
      };
    })
  }))
};
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/manufacturer-audit-scope.json", `${JSON.stringify(output, null, 2)}\n`);

const rows = [
  "# Manufacturer Audit Scope Review",
  "",
  `Generated ${output.generatedAt}.`,
  "",
  `**Rule:** ${manifest.rule}`,
  "",
  `- Audit declarations reviewed: ${manifest.audits.length}`,
  `- Full manufacturer rosters verified: ${counts["full-manufacturer-roster-verified"] || 0}`,
  `- Relevant model families with encoded annual roster coverage: ${rosterFamilies.length}`,
  `- Existing-record-only completions: ${counts["existing-record-generation-complete"] || 0}`,
  `- Partial batches: ${counts["partial-batch"] || 0}`,
  "",
  "| Manufacturer | Honest scope | Manufacturer roster complete? | Result |",
  "|---|---|---|---|"
];
const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
for (const audit of manifest.audits) {
  rows.push(`| ${cell(audit.manufacturer)} | ${cell(scopeLabels[audit.scope])} | ${audit.manufacturerRosterComplete ? "Yes" : "No"} | ${cell(audit.note)} |`);
}
rows.push("", "## Encoded annual roster coverage", "");
for (const audit of manifest.audits.filter(entry => (entry.coveredFamilies || []).length)) {
  rows.push(`### ${audit.manufacturer}`, "");
  for (const family of audit.coveredFamilies) {
    const boat = byId.get(family.stableId);
    const rowsText = (boat?.designGenerations || []).map(row => `${row.startYear}-${row.endYear} (${row.status})`).join("; ");
    rows.push(`- **${family.aliases.join(" / ")}**: expected ${Math.min(...family.expectedYears)}-${Math.max(...family.expectedYears)}; canonical coverage ${rowsText}.`);
  }
  rows.push("");
}
rows.push(
  "## Meaning",
  "",
  "A green generation audit proves that the records under test are internally consistent. It does not prove that every relevant model made by that manufacturer exists in BoatBuilder. Only an independent roster manifest can support that stronger claim."
);
fs.writeFileSync("reports/manufacturer-audit-scope.md", `${rows.join("\n")}\n`);
console.log(`Wrote manufacturer audit-scope review for ${manifest.audits.length} declarations.`);
