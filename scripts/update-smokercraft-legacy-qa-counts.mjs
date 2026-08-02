import fs from "node:fs";

const focusedPath = "tests/smoker-craft-qa.mjs";
let focused = fs.readFileSync(focusedPath, "utf8");
focused = focused
  .replace('assert.equal(smokerCraft.length, 18, "Smoker Craft focused model count changed");', 'assert.equal(smokerCraft.length, 25, "Smoker Craft focused model count changed");')
  .replace('  70,\n  "Smoker Craft generation/evidence-row count changed"', '  86,\n  "Smoker Craft generation/evidence-row count changed"')
  .replace('console.log(`Smoker Craft QA passed: ${smokerCraft.length} models and 70 non-overlapping generation/evidence rows.`);', 'console.log(`Smoker Craft QA passed: ${smokerCraft.length} models and 86 non-overlapping generation/evidence rows.`);');
if (!focused.includes('assert.equal(smokerCraft.length, 25')) throw new Error("Focused Smoker Craft model-count replacement failed");
if (!focused.includes('  86,\n  "Smoker Craft generation/evidence-row count changed"')) throw new Error("Focused Smoker Craft generation-count replacement failed");
fs.writeFileSync(focusedPath, focused);

const globalPath = "tests/qa.mjs";
let global = fs.readFileSync(globalPath, "utf8");
global = global.replace(
  'const smokerCraft = assertStrictMaker("Smoker Craft", 18, 70, smokerIdealIds);',
  'const smokerCraft = assertStrictMaker("Smoker Craft", 25, 86, smokerIdealIds);'
);
if (!global.includes('const smokerCraft = assertStrictMaker("Smoker Craft", 25, 86, smokerIdealIds);')) {
  throw new Error("Global Smoker Craft strict-audit count replacement failed");
}
fs.writeFileSync(globalPath, global);

const batchPath = "tests/smokercraft-legacy-windshield-families-qa.mjs";
let batch = fs.readFileSync(batchPath, "utf8");
batch = batch.replace(
  /assert\.deepEqual\(chronology\(([^)]+)\), (\[[^\n]+), ("[^"\n]+")\);/g,
  'assert.equal(JSON.stringify(chronology($1)), JSON.stringify($2), $3);'
);
if (batch.includes("assert.deepEqual(chronology(")) throw new Error("Cross-realm chronology assertions remain");
fs.writeFileSync(batchPath, batch);

console.log("Updated Smoker Craft counts and normalized cross-realm chronology assertions.");
