import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const manifest = JSON.parse(fs.readFileSync("research/manufacturer-audit-scope.json", "utf8"));
assert.equal(manifest.schemaVersion, 1, "Unsupported manufacturer audit scope schema");
assert.ok(Array.isArray(manifest.audits) && manifest.audits.length > 0, "Manufacturer audit scope manifest is empty");

const sandbox = { window: {} };
for (const path of ["data/boats.js", "data/equipment.js", "data/catalog.js"]) {
  vm.runInNewContext(fs.readFileSync(path, "utf8"), sandbox, { filename: path });
}
const boats = sandbox.window.BOATBUILDER_DATA.items.filter(item => item.categoryId === "boats");
const byId = new Map(boats.map(boat => [boat.id, boat]));

const allowedScopes = new Set([
  "partial-batch",
  "existing-record-generation-complete",
  "custom-build-disposition",
  "relevant-family-roster-verified",
  "full-manufacturer-roster-verified"
]);
const requiredManufacturers = [
  "Lund",
  "Alumacraft",
  "Princecraft",
  "Tracker",
  "MirroCraft",
  "Sea Nymph",
  "Northwood",
  "Lowe",
  "Smoker Craft",
  "Polar Kraft",
  "G3",
  "Fish-Rite",
  "Ultracraft (Misty Harbor)",
  "Fisher",
  "MonArk",
  "Spectrum / Blue Fin"
];
const auditByManufacturer = new Map();
for (const audit of manifest.audits) {
  assert.ok(audit.manufacturer, "Audit scope row lacks a manufacturer");
  assert.ok(allowedScopes.has(audit.scope), `${audit.manufacturer} has unsupported audit scope ${audit.scope}`);
  assert.equal(auditByManufacturer.has(audit.manufacturer), false, `Duplicate audit scope row for ${audit.manufacturer}`);
  auditByManufacturer.set(audit.manufacturer, audit);
  if (audit.manufacturerRosterComplete) {
    assert.equal(audit.scope, "full-manufacturer-roster-verified", `${audit.manufacturer} claims manufacturer completeness without full-roster scope`);
    assert.ok(Array.isArray(audit.coveredFamilies) && audit.coveredFamilies.length > 0, `${audit.manufacturer} claims roster completeness without encoded family coverage`);
  }
  if (audit.scope !== "full-manufacturer-roster-verified") {
    assert.equal(audit.manufacturerRosterComplete, false, `${audit.manufacturer} improperly claims full manufacturer completeness`);
  }
}
for (const manufacturer of requiredManufacturers) {
  assert.ok(auditByManufacturer.has(manufacturer), `Missing audit-scope declaration for previously audited manufacturer ${manufacturer}`);
}

const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const coveredYears = boat => {
  const years = new Set();
  for (const generation of boat.designGenerations || []) {
    assert.notEqual(generation.status, "unresolved", `${boat.id} has an unresolved row inside roster-verified coverage`);
    for (let year = generation.startYear; year <= generation.endYear; year += 1) years.add(year);
  }
  return years;
};

const rosterAudits = manifest.audits.filter(audit => audit.scope === "relevant-family-roster-verified" || audit.scope === "full-manufacturer-roster-verified");
assert.equal(rosterAudits.length, 1, "Unexpected count of roster-verified audit scopes; new claims require encoded annual coverage");
const ultracraftAudit = rosterAudits[0];
assert.equal(ultracraftAudit.manufacturer, "Ultracraft (Misty Harbor)", "Ultracraft should be the first encoded relevant-family roster audit");
assert.equal(ultracraftAudit.coveredFamilies.length, 2, "Ultracraft roster audit must cover both relevant walk-through families");

for (const family of ultracraftAudit.coveredFamilies) {
  assert.ok(Array.isArray(family.expectedYears) && family.expectedYears.length > 0, `${family.stableId} lacks expected annual coverage`);
  assert.ok(Array.isArray(family.aliases) && family.aliases.length >= 2, `${family.stableId} lacks naming-transition aliases`);
  assert.ok(Array.isArray(family.evidenceUrls) && family.evidenceUrls.length >= 2, `${family.stableId} lacks independent roster evidence`);
  const boat = byId.get(family.stableId);
  assert.ok(boat, `Roster manifest references missing stable boat ID ${family.stableId}`);
  const years = coveredYears(boat);
  for (const year of family.expectedYears) assert.ok(years.has(year), `${family.stableId} does not cover roster year ${year}`);
  const firstYear = Math.min(...family.expectedYears);
  const lastYear = Math.max(...family.expectedYears);
  for (let year = firstYear; year <= lastYear; year += 1) {
    assert.ok(family.expectedYears.includes(year), `${family.stableId} manifest has an unexplained roster gap at ${year}`);
    assert.ok(years.has(year), `${family.stableId} canonical chronology has a gap at ${year}`);
  }
  const searchable = normalize([
    boat.model,
    boat.displayName,
    boat.subtitle,
    ...(boat.details || []).map(detail => `${detail.label} ${detail.value}`),
    ...(boat.designGenerations || []).map(generation => `${generation.label} ${generation.specificationBasis}`)
  ].join(" "));
  for (const alias of family.aliases) {
    assert.ok(searchable.includes(normalize(alias)), `${family.stableId} does not disclose roster alias ${alias}`);
  }
}

const scopeCounts = manifest.audits.reduce((counts, audit) => {
  counts[audit.scope] = (counts[audit.scope] || 0) + 1;
  return counts;
}, {});
assert.equal(scopeCounts["full-manufacturer-roster-verified"] || 0, 0, "No full manufacturer roster has yet earned that claim");
console.log(`Manufacturer audit-scope QA passed: ${manifest.audits.length} declarations, ${ultracraftAudit.coveredFamilies.length} roster-verified relevant families, 0 unsupported manufacturer-complete claims.`);
