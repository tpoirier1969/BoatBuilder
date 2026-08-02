import fs from "node:fs";
import vm from "node:vm";

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync("data/boats.js","utf8"),sandbox,{filename:"data/boats.js"});
const boats=sandbox.window.BOATBUILDER_BOATS;
const targetManufacturers=new Set(["Alumacraft","Crestliner","G3","Hewescraft","Legend","MonArk","North River","Northwood","Smoker Craft","Starcraft","Starweld","Tracker","Triton","Ultracraft (Misty Harbor)"]);
const pound=/\d[\d,]*(?:\.\d+)?\s*(?:lb|lbs|pound|pounds)\b/i;
const value=v=>v&&typeof v==="object"&&"value"in v?v.value:v;
const rows=[];
for(const boat of boats){
  if(!targetManufacturers.has(boat.manufacturer))continue;
  const details=Object.fromEntries((boat.details||[]).map(d=>[d.label,d.value]));
  for(const generation of boat.designGenerations||[]){
    const raw=generation.catalogSpecs?details["Dry Hull Weight"]:value(generation.specs?.["Dry Hull Weight"]);
    if(pound.test(String(raw||""))||Array.isArray(generation.weightEras)&&generation.weightEras.length)continue;
    rows.push({
      boatId:boat.id,
      manufacturer:boat.manufacturer,
      model:boat.model,
      idealMatch:Boolean(boat.idealMatch),
      generation,
      topLevelDetails:{
        "Model Years / Era":details["Model Years / Era"]||null,
        "Dry Hull Weight":details["Dry Hull Weight"]||null,
        Length:details.Length||null,
        Beam:details.Beam||null
      }
    });
  }
}
fs.mkdirSync("reports",{recursive:true});
const generatedAt=new Date().toISOString();
fs.writeFileSync("reports/weight-targets.json",`${JSON.stringify({generatedAt,count:rows.length,rows},null,2)}\n`);
const md=[
  "# Hull-weight research targets",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Remaining target generation rows: ${rows.length}`,
  "",
  ...rows.flatMap(row=>[
    `## ${row.manufacturer} | ${row.model}`,
    "",
    `- Boat ID: \`${row.boatId}\``,
    `- Generation ID: \`${row.generation.id}\``,
    `- Years: ${row.generation.startYear??"?"}–${row.generation.endYear??"?"}`,
    `- Label: ${row.generation.label||""}`,
    `- Status: ${row.generation.status||""}`,
    `- Length/beam: ${row.topLevelDetails.Length||row.generation.specs?.Length?.value||"?"} / ${row.topLevelDetails.Beam||row.generation.specs?.Beam?.value||"?"}`,
    `- Price eras: ${(row.generation.eras||[]).map(era=>`${era.label||`${era.startYear}-${era.endYear}`} [${era.startYear}-${era.endYear}]`).join("; ")||"none"}`,
    `- Basis: ${row.generation.specificationBasis||""}`,
    `- Source: ${row.generation.sourceUrl||""}`,
    ""
  ])
].join("\n");
fs.writeFileSync("reports/weight-targets.md",md);
console.log(JSON.stringify({targets:rows.length}));
