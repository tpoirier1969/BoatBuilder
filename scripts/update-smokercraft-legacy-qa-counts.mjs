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

console.log("Updated global and focused Smoker Craft QA counts for seven added legacy windshield records.");
