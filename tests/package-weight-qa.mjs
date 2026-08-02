import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read=path=>fs.readFileSync(path,"utf8");
const sandbox={window:{}};
vm.runInNewContext(read("data/boats.js"),sandbox,{filename:"data/boats.js"});
vm.runInNewContext(read("data/equipment.js"),sandbox,{filename:"data/equipment.js"});
vm.runInNewContext(read("data/catalog.js"),sandbox,{filename:"data/catalog.js"});
vm.runInNewContext(read("weight-model.js"),sandbox,{filename:"weight-model.js"});
const catalog=sandbox.window.BOATBUILDER_DATA;
const W=sandbox.window.BOATBUILDER_WEIGHT_MODEL;
const boats=catalog.items.filter(item=>item.categoryId==="boats");
const equipment=catalog.items.filter(item=>item.categoryId!=="boats");

assert.ok(W,"Weight model global is missing");
assert.equal(W.TOW_LIMIT_LB,4000,"Tow limit changed unexpectedly");
assert.equal(W.DISPLAY_THRESHOLD_LB,30,"Display threshold must remain 30 lb");
assert.equal(boats.length,183,"Boat baseline changed without updating package-weight QA");

const PUBLISHED_WEIGHT_ERAS_QA_V1=true;
const pounds=text=>[...String(text||"").replaceAll(",","").matchAll(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b/gi)].map(match=>Number(match[1]));
let published=0,missing=0;
for(const boat of boats){
  const generations=boat.designGenerations?.length?boat.designGenerations:[{id:`${boat.id}:catalog`,catalogSpecs:true}];
  const details=Object.fromEntries((boat.details||[]).map(detail=>[detail.label,detail.value]));
  for(const generation of generations){
    const raw=generation.catalogSpecs?details["Dry Hull Weight"]:generation.specs?.["Dry Hull Weight"]?.value;
    const hasPublished=pounds(raw).length>0||(Array.isArray(generation.weightEras)&&generation.weightEras.some(era=>Number.isFinite(Number(era.lowLb))));
    const config={generationId:generation.id,trailer:"standard",fuelPercent:0};
    const hull=W.hullWeight(boat,config);
    const item=W.itemWeight(boat,config);
    if(hasPublished){
      published++;
      assert.ok(Number.isFinite(hull.low)&&Number.isFinite(hull.high),`${generation.id} lost its published hull weight`);
      assert.match(hull.confidence,/published/,`${generation.id} is not labeled published`);
      assert.doesNotMatch(hull.basis,/estimated from hull|length.*beam/i,`${generation.id} used a hull estimate`);
      assert.ok(item.complete,`${generation.id} should have a complete hull/trailer total with empty fuel`);
    }else{
      missing++;
      assert.equal(hull.confidence,"unavailable",`${generation.id} must remain unavailable instead of estimated`);
      assert.equal(item.complete,false,`${generation.id} incorrectly claims a complete package weight`);
      const overridden=W.hullWeight(boat,{...config,weightOverride:1234});
      assert.deepEqual([overridden.low,overridden.high],[1234,1234],`${generation.id} user override failed`);
      assert.equal(overridden.confidence,"user",`${generation.id} override is not labeled user-entered`);
    }
  }
}
assert.ok(published>=440,"Published generation-weight coverage regressed");
assert.ok(missing>=1,"Missing published hull weights were silently filled without updating evidence QA");

for(const item of equipment.filter(entry=>entry.categoryId==="main-motors"||entry.categoryId==="kickers")){
  const hp=W.horsepowerOptions(item)[0]||null;
  const result=W.itemWeight(item,{hp,startingBattery:"included"});
  assert.ok(result.complete,`${item.id} motor weight is incomplete`);
  assert.ok(result.high>30,`${item.id} motor weight does not cross the display threshold`);
  assert.ok(result.display,`${item.id} motor weight is hidden`);
}
for(const item of equipment.filter(entry=>entry.categoryId==="bow-trolling-motors")){
  const voltage=W.voltageOptions(item)[0]||24;
  const result=W.itemWeight(item,{voltage,batterySetup:"flooded"});
  assert.ok(result.complete,`${item.id} bow-motor package weight is incomplete`);
  assert.ok(result.high>30,`${item.id} bow-motor package does not cross the display threshold`);
}

const knownBoat=boats.find(boat=>boat.designGenerations?.some(generation=>pounds(generation.specs?.["Dry Hull Weight"]?.value).length));
assert.ok(knownBoat,"No generation-specific published-weight boat found");
const knownGeneration=knownBoat.designGenerations.find(generation=>pounds(generation.specs?.["Dry Hull Weight"]?.value).length);
const trailer=W.trailerWeight(knownBoat,{generationId:knownGeneration.id,trailer:"standard"});
assert.ok(trailer.low>30&&trailer.high>=trailer.low,"Trailer estimate is invalid");
const main=equipment.find(item=>item.categoryId==="main-motors");
const packageResult=W.packageWeight([
  {i:knownBoat,c:{generationId:knownGeneration.id,trailer:"standard",fuelPercent:0}},
  {i:main,c:{hp:90,startingBattery:"included"}}
],150);
assert.ok(packageResult.complete,"Known boat + motor package should be complete");
assert.ok(packageResult.high>packageResult.low,"Package should retain a realistic range");
assert.ok(packageResult.gearAllowance===150,"Gear allowance was not included");


const trophy=boats.find(boat=>boat.manufacturer==="Alumacraft"&&boat.model.includes("Trophy 170"));
assert.ok(trophy,"Trophy 170 weight-era test boat missing");
const trophyGeneration=trophy.designGenerations.find(generation=>generation.startYear===1988&&generation.endYear===1989);
assert.equal(W.hullWeight(trophy,{generationId:trophyGeneration.id,era:"1988 Trophy 170"}).low,875,"1988 Trophy 170 weight changed");
assert.equal(W.hullWeight(trophy,{generationId:trophyGeneration.id,era:"1989 Trophy 170 Combo"}).low,1725,"1989 Trophy 170 weight changed");
const trophySpan=W.hullWeight(trophy,{generationId:trophyGeneration.id});
assert.deepEqual([trophySpan.low,trophySpan.high],[875,1725],"Unspecified Trophy year must retain the published span");

const app=read("app.js");
const html=read("index.html");
const css=read("styles.css");
assert.match(app,/PACKAGE_WEIGHT_UI_V1/,"Package-weight UI migration is missing");
assert.match(app,/Loose gear allowance/,"Gear allowance control is missing");
assert.match(app,/Margin to 4,000 lb/,"Tow-margin summary is missing");
assert.ok(html.indexOf("weight-model.js")<html.indexOf("app.js"),"Weight model must load before app.js");
assert.match(css,/PACKAGE_WEIGHT_UI_V1/,"Package-weight CSS is missing");

console.log(JSON.stringify({boats:boats.length,publishedGenerationWeights:published,missingPublishedGenerationWeights:missing,motorsTested:equipment.filter(item=>item.categoryId==="main-motors"||item.categoryId==="kickers").length,bowMotorsTested:equipment.filter(item=>item.categoryId==="bow-trolling-motors").length}));
