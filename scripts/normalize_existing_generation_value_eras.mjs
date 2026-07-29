import fs from "node:fs";
import vm from "node:vm";

const path = "data/boats.js";
const source = fs.readFileSync(path, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: path });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Boat data did not load");

let moved = 0;
let cleared = 0;
for (const boat of boats) {
  const eras = Array.isArray(boat.valueEras) ? boat.valueEras : [];
  const generations = Array.isArray(boat.designGenerations) ? boat.designGenerations : [];
  if (!eras.length || !generations.length) continue;

  if (generations.length === 1 && !(generations[0].eras || []).length) {
    generations[0].eras = eras.map(era => ({
      id: era.id,
      label: era.label,
      startYear: era.startYear,
      endYear: era.endYear,
      low: era.lowPrice,
      high: era.highPrice,
      basis: `${era.basis || "Used complete-package screening estimate"}; use only with this selected hull generation`
    }));
    moved++;
  } else {
    cleared++;
  }
  boat.valueEras = [];
}

fs.writeFileSync(path, `window.BOATBUILDER_BOATS = ${JSON.stringify(boats, null, 2)};\n`);
console.log(JSON.stringify({ moved, cleared }, null, 2));
