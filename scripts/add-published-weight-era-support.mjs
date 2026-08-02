import fs from "node:fs";

const read=path=>fs.readFileSync(path,"utf8");
const write=(path,value)=>fs.writeFileSync(path,value);

let model=read("weight-model.js");
if(!model.includes("PUBLISHED_WEIGHT_ERAS_V1")){
  model=model.replace('"use strict";','"use strict";\nconst PUBLISHED_WEIGHT_ERAS_V1=true;');
  const old=`function hullWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered actual dry-hull weight","user",true);
  const raw=spec(item,config,"Dry Hull Weight");
  const parsed=weightRangeFromText(raw);
  if(parsed){
    const conflict=parsed.low!==parsed.high;
    return range(parsed.low,parsed.high,conflict?\`Published hull-weight range/conflict: \${raw}\`:\`Published dry-hull weight: \${raw}\`,conflict?"published-range":"published",true);
  }
  return unavailable("Published dry-hull weight is not available for the selected hull generation. Enter a documented or measured weight to complete the package total.",true);
}`;
  const replacement=`function selectedWeightEra(generation,config={}){
  const weightEras=Array.isArray(generation?.weightEras)?generation.weightEras:[];
  if(!weightEras.length)return null;
  const selected=(generation.eras||[]).find(era=>clean(era.label)===clean(config.era));
  if(selected&&Number.isInteger(selected.startYear)&&Number.isInteger(selected.endYear)){
    const matches=weightEras.filter(era=>selected.startYear>=era.startYear&&selected.endYear<=era.endYear);
    if(matches.length===1)return matches[0];
  }
  const exact=weightEras.find(era=>clean(era.label)===clean(config.era));
  return exact||null;
}
function hullWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered actual dry-hull weight","user",true);
  const generation=selectedGeneration(item,config);
  const weightEras=Array.isArray(generation?.weightEras)?generation.weightEras:[];
  if(weightEras.length){
    const selected=selectedWeightEra(generation,config);
    if(selected)return range(selected.lowLb,selected.highLb,selected.basis||\`Published dry-hull weight for \${selected.label}\`,selected.lowLb===selected.highLb?"published":"published-range",true);
    if(clean(config.era))return unavailable("Published dry-hull weight is not available for the selected year option. Enter a documented or measured weight to complete the package total.",true);
    const low=Math.min(...weightEras.map(era=>Number(era.lowLb)).filter(Number.isFinite));
    const high=Math.max(...weightEras.map(era=>Number(era.highLb??era.lowLb)).filter(Number.isFinite));
    if(Number.isFinite(low)&&Number.isFinite(high))return range(low,high,"Published hull-weight span across documented year-specific variants. Choose a narrower year option when available.",low===high?"published":"published-range",true);
  }
  const raw=spec(item,config,"Dry Hull Weight");
  const parsed=weightRangeFromText(raw);
  if(parsed){
    const conflict=parsed.low!==parsed.high;
    return range(parsed.low,parsed.high,conflict?\`Published hull-weight range/conflict: \${raw}\`:\`Published dry-hull weight: \${raw}\`,conflict?"published-range":"published",true);
  }
  return unavailable("Published dry-hull weight is not available for the selected hull generation. Enter a documented or measured weight to complete the package total.",true);
}`;
  if(!model.includes(old))throw new Error("Hull-weight function anchor changed");
  model=model.replace(old,replacement);
  write("weight-model.js",model);
}

let coverage=read("scripts/report-weight-coverage.mjs");
if(!coverage.includes("WEIGHT_ERAS_COVERAGE_V1")){
  coverage=coverage.replace('const rows = [];','const WEIGHT_ERAS_COVERAGE_V1=true;\nconst rows = [];');
  coverage=coverage.replace(
`    const values = pounds(raw);
    const unavailable = !values.length;
    rows.push({`,
`    const weightEras=Array.isArray(generation.weightEras)?generation.weightEras:[];
    const eraValues=weightEras.flatMap(era=>[Number(era.lowLb),Number(era.highLb??era.lowLb)]).filter(Number.isFinite);
    const values = [...pounds(raw),...eraValues];
    const unavailable = !values.length;
    const rawWeight=raw||(weightEras.length?weightEras.map(era=>\`${'${'}era.label}: ${'${'}era.lowLb}${'${'}(era.highLb??era.lowLb)!==era.lowLb?\`-${'${'}era.highLb}\`:""} lb\`).join("; "):null);
    rows.push({`);
  coverage=coverage.replace('      rawWeight: raw || null,','      rawWeight,');
  coverage=coverage.replace('      classification: unavailable ? "missing-published-weight" : values.length > 1 ? "published-range-or-conflict" : "published-single",','      classification: unavailable ? "missing-published-weight" : new Set(values).size > 1 ? "published-range-or-conflict" : "published-single",');
  write("scripts/report-weight-coverage.mjs",coverage);
}

let test=read("tests/package-weight-qa.mjs");
if(!test.includes("PUBLISHED_WEIGHT_ERAS_QA_V1")){
  test=test.replace('const pounds=text=>','const PUBLISHED_WEIGHT_ERAS_QA_V1=true;\nconst pounds=text=>');
  test=test.replace(
'    const hasPublished=pounds(raw).length>0;',
'    const hasPublished=pounds(raw).length>0||(Array.isArray(generation.weightEras)&&generation.weightEras.some(era=>Number.isFinite(Number(era.lowLb))));');
  test=test.replace(
'assert.ok(published>=421,"Published generation-weight coverage regressed");',
'assert.ok(published>=440,"Published generation-weight coverage regressed");');
  const insert=`
const trophy=boats.find(boat=>boat.manufacturer==="Alumacraft"&&boat.model.includes("Trophy 170"));
assert.ok(trophy,"Trophy 170 weight-era test boat missing");
const trophyGeneration=trophy.designGenerations.find(generation=>generation.startYear===1988&&generation.endYear===1989);
assert.equal(W.hullWeight(trophy,{generationId:trophyGeneration.id,era:"1988 Trophy 170"}).low,875,"1988 Trophy 170 weight changed");
assert.equal(W.hullWeight(trophy,{generationId:trophyGeneration.id,era:"1989 Trophy 170 Combo"}).low,1725,"1989 Trophy 170 weight changed");
const trophySpan=W.hullWeight(trophy,{generationId:trophyGeneration.id});
assert.deepEqual([trophySpan.low,trophySpan.high],[875,1725],"Unspecified Trophy year must retain the published span");
`;
  test=test.replace('const app=read("app.js");',insert+'\nconst app=read("app.js");');
  write("tests/package-weight-qa.mjs",test);
}

console.log("Added year-specific published hull-weight support");
