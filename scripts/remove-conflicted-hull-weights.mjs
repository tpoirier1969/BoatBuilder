import fs from "node:fs";
import vm from "node:vm";

const path="data/boats.js";
const source=fs.readFileSync(path,"utf8");
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:path});
const boats=sandbox.window.BOATBUILDER_BOATS;
const boat=boats.find(entry=>entry.id==="boat:Starcraft | Superfisherman 186 (Secondary; 176 is Primary)");
if(!boat)throw new Error("Superfisherman 186 record missing");
const generation=boat.designGenerations.find(entry=>entry.startYear===2025&&entry.endYear===2026);
if(!generation)throw new Error("Current Superfisherman 186 generation missing");
if(generation.specs)delete generation.specs["Dry Hull Weight"];
generation.weightNote="Current published dry-weight figures conflict across retained sources. BoatBuilder leaves hull weight unavailable until the conflict is resolved or the listing provides a documented actual weight.";

const marker="window.BOATBUILDER_BOATS";
const markerIndex=source.indexOf(marker);
const arrayStart=source.indexOf("[",markerIndex);
const arrayEnd=source.lastIndexOf("]");
const output=`${source.slice(0,arrayStart)}${JSON.stringify(boats,null,2)}${source.slice(arrayEnd+1)}`;
fs.writeFileSync(path,output);

const reportPath="reports/published-hull-weight-additions.json";
if(fs.existsSync(reportPath)){
  const report=JSON.parse(fs.readFileSync(reportPath,"utf8"));
  report.touched=report.touched.filter(entry=>entry.generationId!==generation.id);
  report.count=report.touched.length;
  report.excludedConflicts=[...(report.excludedConflicts||[]),{boatId:boat.id,generationId:generation.id,reason:generation.weightNote}];
  fs.writeFileSync(reportPath,`${JSON.stringify(report,null,2)}\n`);
}
console.log("Retained conflicted Superfisherman 186 hull weight as unavailable");
