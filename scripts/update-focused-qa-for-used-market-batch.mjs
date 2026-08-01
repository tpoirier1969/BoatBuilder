import fs from "node:fs";

const update = (path, replacements) => {
  let source = fs.readFileSync(path, "utf8");
  for (const [from, to] of replacements) source = source.replace(from, to);
  fs.writeFileSync(path, source);
};

update("tests/fisher-qa.mjs", [
  ["assert.equal(fisher.length, 3, \"Fisher focused model count changed\");", "assert.equal(fisher.length, 8, \"Fisher focused model count changed\");"],
  ["assert.equal(fisher.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 7, \"Fisher generation/evidence-row count changed\");", "assert.equal(fisher.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 18, \"Fisher generation/evidence-row count changed\");"],
  ["console.log(`Fisher QA passed: ${fisher.length} models and 7 non-overlapping generation/evidence rows.`);", "console.log(`Fisher QA passed: ${fisher.length} models and 18 non-overlapping generation/evidence rows.`);"]
]);

update("tests/ultracraft-fishrite-qa.mjs", [
  ["assert.equal(targets.length, 3, \"Ultracraft/Fish-Rite focused record count changed\");", "assert.equal(targets.length, 4, \"Ultracraft/Fish-Rite focused record count changed\");"],
  ["assert.equal(targets.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 5, \"Focused generation/evidence-row count changed\");", "assert.equal(targets.reduce((sum, boat) => sum + (boat.designGenerations || []).length, 0), 7, \"Focused generation/evidence-row count changed\");"],
  ["console.log(\"Ultracraft/Fish-Rite QA passed: 3 records, 5 evidence rows, and Ultracraft roster coverage through 2012.\");", "console.log(\"Ultracraft/Fish-Rite QA passed: 4 records, 7 evidence rows, and corrected Ultracraft windshield-family coverage.\");"]
]);

console.log("Updated Fisher and Ultracraft focused QA counts for the first missing-model batch.");
