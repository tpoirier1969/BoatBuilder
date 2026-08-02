import fs from "node:fs";

const path="weight-model.js";
let source=fs.readFileSync(path,"utf8");
if(!source.includes("SELECTED_HULL_GENERATION_REQUIRED_V1")){
  source=source.replace('const PUBLISHED_WEIGHT_ERAS_V1=true;','const PUBLISHED_WEIGHT_ERAS_V1=true;\nconst SELECTED_HULL_GENERATION_REQUIRED_V1=true;');
  const anchor=`function hullWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered actual dry-hull weight","user",true);
  const generation=selectedGeneration(item,config);`;
  const replacement=`function hullWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered actual dry-hull weight","user",true);
  const generations=Array.isArray(item?.designGenerations)?item.designGenerations:[];
  const generation=selectedGeneration(item,config);
  if(generations.length>1&&!generation)return unavailable("Choose a year / hull generation before calculating dry-hull weight.",true);`;
  if(!source.includes(anchor))throw new Error("Hull-generation selection anchor changed");
  source=source.replace(anchor,replacement);
  fs.writeFileSync(path,source);
}

const testPath="tests/package-weight-qa.mjs";
let test=fs.readFileSync(testPath,"utf8");
if(!test.includes("SELECTED_HULL_GENERATION_REQUIRED_QA_V1")){
  test=test.replace('const PUBLISHED_WEIGHT_ERAS_QA_V1=true;','const PUBLISHED_WEIGHT_ERAS_QA_V1=true;\nconst SELECTED_HULL_GENERATION_REQUIRED_QA_V1=true;');
  const insert=`
const multipleGenerationBoat=boats.find(boat=>boat.designGenerations?.length>1&&boat.designGenerations.some(generation=>pounds(generation.specs?.["Dry Hull Weight"]?.value).length||generation.weightEras?.length));
assert.ok(multipleGenerationBoat,"No multi-generation boat found for selection guard");
const unselectedHull=W.hullWeight(multipleGenerationBoat,{});
assert.equal(unselectedHull.confidence,"unavailable","Multi-generation hull weight leaked before a year/hull was selected");
assert.match(unselectedHull.basis,/choose a year/i,"Missing year-selection instruction");
`;
  test=test.replace('const knownBoat=boats.find(',insert+'\nconst knownBoat=boats.find(');
  fs.writeFileSync(testPath,test);
}
console.log("Enforced selected generation for hull weight");
