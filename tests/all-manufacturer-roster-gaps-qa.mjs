import assert from "node:assert/strict";
import fs from "node:fs";

const baseline = JSON.parse(fs.readFileSync("reports/all-manufacturer-roster-baseline.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync("research/all-manufacturer-roster-gaps.json", "utf8"));
const report = JSON.parse(fs.readFileSync("reports/all-manufacturer-roster-gaps.json", "utf8"));

const allowedStatuses = new Set([
  "missing-models-found",
  "continuity-review",
  "no-high-confidence-gap-in-sampled-roster",
  "custom-build-manual-audit",
]);
const allowedConfidence = new Set(["high", "medium"]);
const allowedClassification = new Set([
  "primary-candidate",
  "secondary-screening",
  "continuity-alias-review",
]);

assert.equal(manifest.schemaVersion, 1, "Unexpected roster-gap schema version");
assert.ok(manifest.scope?.purpose, "Audit purpose is required");
assert.ok(Array.isArray(manifest.scope?.criteria) && manifest.scope.criteria.length, "Audit criteria are required");
assert.ok(Array.isArray(manifest.scope?.exclusions) && manifest.scope.exclusions.length, "Audit exclusions are required");
assert.ok(manifest.scope?.claimPolicy?.includes("No manufacturer"), "Claim policy must forbid unsupported roster-complete claims");
assert.notEqual(manifest.manufacturerRosterComplete, true, "Manifest cannot claim all manufacturers roster complete");

const baselineNames = baseline.manufacturers.map(entry => entry.manufacturer).sort();
const auditNames = manifest.manufacturers.map(entry => entry.manufacturer).sort();
assert.deepEqual(auditNames, baselineNames, "Roster audit must cover every and only every baseline manufacturer");
assert.equal(new Set(auditNames).size, auditNames.length, "Duplicate manufacturer audit entry");
assert.equal(manifest.manufacturerCount, baseline.manufacturerCount, "Manufacturer count mismatch");

let candidateCount = 0;
const globalKeys = new Set();
for (const entry of manifest.manufacturers) {
  assert.ok(allowedStatuses.has(entry.status), `${entry.manufacturer}: unsupported status ${entry.status}`);
  assert.notEqual(entry.manufacturerRosterComplete, true, `${entry.manufacturer}: unsupported roster-complete claim`);
  assert.ok(Array.isArray(entry.reviewedSources) && entry.reviewedSources.length, `${entry.manufacturer}: reviewed source or manual-audit source required`);
  for (const url of entry.reviewedSources) assert.match(url, /^https?:\/\//, `${entry.manufacturer}: invalid reviewed source URL`);
  assert.ok(typeof entry.notes === "string" && entry.notes.trim(), `${entry.manufacturer}: notes required`);
  assert.ok(Array.isArray(entry.missingModels), `${entry.manufacturer}: missingModels must be an array`);

  if (entry.status === "custom-build-manual-audit") {
    assert.equal(entry.missingModels.length, 0, `${entry.manufacturer}: custom-build audit must not invent fixed missing rows`);
  }
  if (entry.status === "missing-models-found") {
    assert.ok(entry.missingModels.length > 0, `${entry.manufacturer}: missing-model status requires candidates`);
  }

  const localModels = new Set();
  for (const model of entry.missingModels) {
    candidateCount += 1;
    assert.ok(model.model?.trim(), `${entry.manufacturer}: candidate model name required`);
    assert.ok(model.years?.trim(), `${entry.manufacturer} ${model.model}: years/evidence era required`);
    assert.ok(allowedConfidence.has(model.confidence), `${entry.manufacturer} ${model.model}: invalid confidence`);
    assert.ok(allowedClassification.has(model.classification), `${entry.manufacturer} ${model.model}: invalid classification`);
    assert.ok(model.reason?.trim(), `${entry.manufacturer} ${model.model}: reason required`);
    assert.ok(Array.isArray(model.evidenceUrls) && model.evidenceUrls.length, `${entry.manufacturer} ${model.model}: evidence URL required`);
    for (const url of model.evidenceUrls) assert.match(url, /^https?:\/\//, `${entry.manufacturer} ${model.model}: invalid evidence URL`);
    const normalized = model.model.toLowerCase().replace(/\s+/g, " ").trim();
    assert.ok(!localModels.has(normalized), `${entry.manufacturer}: duplicate candidate ${model.model}`);
    localModels.add(normalized);
    const globalKey = `${entry.manufacturer}::${normalized}`;
    assert.ok(!globalKeys.has(globalKey), `Duplicate global candidate ${globalKey}`);
    globalKeys.add(globalKey);
  }
}

assert.equal(candidateCount, manifest.candidateModelCount, "Candidate count mismatch in manifest");
assert.equal(report.candidateModelCount, candidateCount, "Generated report candidate count mismatch");
assert.equal(report.auditedManufacturers, baseline.manufacturerCount, "Generated report manufacturer count mismatch");
assert.equal(report.highConfidence + report.mediumConfidence, candidateCount, "Confidence totals do not reconcile");
assert.equal(report.primaryCandidates + report.secondaryScreening + report.continuityAliasReviews, candidateCount, "Classification totals do not reconcile");
assert.ok(report.highConfidence > 0, "Audit produced no high-confidence candidates");
assert.ok(report.primaryCandidates > 0, "Audit produced no primary candidates");

console.log(`All-manufacturer roster-gap QA passed: ${auditNames.length} manufacturers, ${candidateCount} candidates, ${report.highConfidence} high-confidence.`);
