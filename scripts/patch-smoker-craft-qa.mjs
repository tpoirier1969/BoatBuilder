import fs from "node:fs";

const path = "tests/qa.mjs";
let source = fs.readFileSync(path, "utf8");

const oldBlock = `const ultima182Audit = item("boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-2018-standard"))?.specs?.Length?.value, "18'5\\\"", "Standard Ultima 182 length is wrong");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-se"))?.specs?.Length?.value, "18'2\\\"", "Parallel 2016 Ultima 182SE variation is missing");`;

const newBlock = `const ultima182Audit = item("boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)");
assert.equal(JSON.stringify(ultima182Audit.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[2001, 2002], [2015, 2015], [2016, 2016], [2017, 2018], [2019, 2024], [2025, 2026]]), "Ultima 182 chronology overlaps or is incomplete");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2017-2018-standard"))?.specs?.Length?.value, "18'5\\\"", "2017-2018 standard Ultima 182 length is wrong");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-se"))?.specs?.Length?.value, "18'2\\\"", "Exact 2016 Ultima 182 variation is missing");`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes(newBlock)) {
  throw new Error("Could not locate old or updated Ultima 182 QA block");
}

fs.writeFileSync(path, source);
console.log("Updated the legacy Ultima 182 QA guard.");
