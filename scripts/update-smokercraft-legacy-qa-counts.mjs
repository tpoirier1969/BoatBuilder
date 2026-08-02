import fs from "node:fs";

const path = "tests/smoker-craft-qa.mjs";
let source = fs.readFileSync(path, "utf8");
source = source
  .replace('assert.equal(smokerCraft.length, 18, "Smoker Craft focused model count changed");', 'assert.equal(smokerCraft.length, 25, "Smoker Craft focused model count changed");')
  .replace('  70,\n  "Smoker Craft generation/evidence-row count changed"', '  86,\n  "Smoker Craft generation/evidence-row count changed"')
  .replace('console.log(`Smoker Craft QA passed: ${smokerCraft.length} models and 70 non-overlapping generation/evidence rows.`);', 'console.log(`Smoker Craft QA passed: ${smokerCraft.length} models and 86 non-overlapping generation/evidence rows.`);');
if (!source.includes('assert.equal(smokerCraft.length, 25')) throw new Error("Smoker Craft model count replacement failed");
if (!source.includes('  86,\n  "Smoker Craft generation/evidence-row count changed"')) throw new Error("Smoker Craft generation count replacement failed");
fs.writeFileSync(path, source);
console.log("Updated Smoker Craft focused QA counts for seven added legacy windshield records.");
