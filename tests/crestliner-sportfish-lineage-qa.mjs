import assert from "node:assert/strict";
import fs from "node:fs";

const path = "research/crestliner-sportfish-lineage-1987-1999.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));

assert.equal(data.schemaVersion, 1);
assert.equal(data.scope.manufacturer, "Crestliner");
assert.deepEqual(data.scope.years, { start: 1987, end: 1999 });

const expectedYears = Array.from({ length: 13 }, (_, index) => 1987 + index);
const rosterYears = data.annualRosters.map(entry => entry.year);
assert.deepEqual(rosterYears, expectedYears, "Annual Crestliner roster coverage must be continuous from 1987 through 1999");
assert.equal(new Set(rosterYears).size, rosterYears.length, "Annual roster contains duplicate years");

for (const entry of data.annualRosters) {
  assert.match(entry.sourceUrl, new RegExp(`/boats/${entry.year}/crestliner-inc$`), `${entry.year} source URL is wrong`);
  assert.ok(Array.isArray(entry.models) && entry.models.length >= 2, `${entry.year} lacks the relevant lineage rows`);
  for (const model of entry.models) {
    assert.ok(model.publishedName, `${entry.year} contains a blank model name`);
    assert.ok(model.lineage, `${entry.year} ${model.publishedName} lacks a lineage`);
    assert.ok(model.identityStatus, `${entry.year} ${model.publishedName} lacks identity status`);
  }
}

const actions = data.approvedActions;
assert.equal(actions.length, 7, "Approved Sportfish action count changed without review");
assert.equal(new Set(actions.map(action => action.key)).size, actions.length, "Approved actions contain duplicate keys");
assert.ok(actions.every(action => action.status === "ready-for-spec-research"), "An approved action is not ready for specification research");

const byKey = new Map(actions.map(action => [action.key, action]));
assert.deepEqual(
  byKey.get("phantom-v180").approvedCoverage.map(row => [row.startYear, row.endYear, row.publishedWeightLb]),
  [[1987, 1990, 1250], [1991, 1994, 1440]],
  "Phantom V180 generation boundary drifted"
);
assert.deepEqual(
  byKey.get("phantom-v170").approvedCoverage.map(row => [row.startYear, row.endYear, row.publishedWeightLb]),
  [[1987, 1990, 1075], [1991, 1994, 1280]],
  "Phantom V170 generation boundary drifted"
);
assert.deepEqual(
  byKey.get("1950-sportfish").approvedCoverage.map(row => [row.startYear, row.endYear]),
  [[1995, 1996]],
  "1950 Sportfish was extended beyond documented production"
);

const y1998 = data.annualRosters.find(entry => entry.year === 1998);
const sportfish1750 = y1998.models.find(model => model.lineage === "numbered-1750");
assert.equal(sportfish1750.identityStatus, "exact-name-weight-conflict", "1998 1750 weight conflict was hidden");
assert.match(sportfish1750.note, /do not treat/i, "1998 1750 weight guardrail is missing");

const v160 = byKey.get("phantom-v160");
assert.ok(v160.doNotMerge.some(row => /Mirage/.test(row.identity)), "Mirage V160 separation guardrail is missing");

assert.ok(
  data.explicitExclusions.some(entry => /1680 Sport/.test(entry.family) && /pontoons/i.test(entry.reason)),
  "Pontoon false-positive exclusion is missing"
);
assert.ok(
  data.quarantinedReviews.some(entry => /Pro AM/.test(entry.family) && /layout/i.test(entry.status)),
  "Ambiguous Pro AM layouts are not quarantined"
);

console.log(`Crestliner Sportfish roster QA passed: ${rosterYears.length} years, ${actions.length} approved actions.`);
