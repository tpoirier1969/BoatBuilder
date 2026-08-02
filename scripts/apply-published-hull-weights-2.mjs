import fs from "node:fs";
import vm from "node:vm";

const path="data/boats.js";
const source=fs.readFileSync(path,"utf8");
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:path});
const boats=sandbox.window.BOATBUILDER_BOATS;
if(!Array.isArray(boats))throw new Error("Boat catalog did not load");

const touched=[];
const requireBoat=(manufacturer,fragment)=>{
  const matches=boats.filter(boat=>boat.manufacturer===manufacturer&&boat.model.includes(fragment));
  if(matches.length!==1)throw new Error(`Expected one ${manufacturer} model containing ${fragment}; found ${matches.length}`);
  return matches[0];
};
const requireGeneration=(boat,startYear,endYear)=>{
  const matches=(boat.designGenerations||[]).filter(g=>g.startYear===startYear&&g.endYear===endYear);
  if(matches.length!==1)throw new Error(`Expected one ${boat.id} generation ${startYear}-${endYear}; found ${matches.length}`);
  return matches[0];
};
const setEraWeights=(manufacturer,fragment,startYear,endYear,eras)=>{
  const boat=requireBoat(manufacturer,fragment);
  const generation=requireGeneration(boat,startYear,endYear);
  const template=(generation.eras||[])[0]||{};
  generation.weightEras=eras.filter(era=>Number.isFinite(era.lowLb)).map(era=>({
    label:era.label,
    startYear:era.startYear,
    endYear:era.endYear,
    lowLb:era.lowLb,
    highLb:era.highLb??era.lowLb,
    basis:era.basis,
    sourceUrl:era.sourceUrl
  }));
  generation.eras=eras.map(era=>({
    ...template,
    label:era.label,
    startYear:era.startYear,
    endYear:era.endYear,
    basis:`${template.basis||"Used complete-package screening estimate"} ${Number.isFinite(era.lowLb)?`Hull weight uses the published ${era.startYear}${era.endYear!==era.startYear?`-${era.endYear}`:""} figure.`:"Published hull weight remains unavailable for this year."}`
  }));
  generation.evidenceUrls=[...new Set([...(generation.evidenceUrls||[]),...eras.map(era=>era.sourceUrl).filter(Boolean)])];
  touched.push({boatId:boat.id,generationId:generation.id,weightEras:generation.weightEras,choiceEras:generation.eras.map(era=>({label:era.label,startYear:era.startYear,endYear:era.endYear}))});
};

setEraWeights("Smoker Craft","Osprey 162 WT",2019,2024,[
  {label:"2019-2023 Osprey 162",startYear:2019,endYear:2023,lowLb:1075,basis:"2019, 2020, 2022 and 2023 annual rosters list the Osprey 162 at 1,075 lb.",sourceUrl:"https://www.jdpower.com/boats/2023/smoker-craft-inc"},
  {label:"2024 Osprey 162 identity",startYear:2024,endYear:2024,lowLb:null,basis:"The 2024 Smoker Craft roster does not list the Osprey 162; do not carry the 2023 weight forward.",sourceUrl:"https://www.jdpower.com/boats/2024/smoker-craft-inc"}
]);

setEraWeights("Starcraft","Fishmaster 176 DC",1999,2005,[
  {label:"1999-2000 Fishmaster 176 DC",startYear:1999,endYear:2000,lowLb:1176,basis:"1999 and 2000 annual rosters list the Fishmaster 176 DC at 1,176 lb.",sourceUrl:"https://www.jdpower.com/boats/2000/starcraft-co/power-boats"},
  {label:"2001-2004 Fishmaster 176 DC",startYear:2001,endYear:2004,lowLb:1175,basis:"2002 through 2004 annual rosters list the Fishmaster 176 DC at 1,175 lb.",sourceUrl:"https://www.jdpower.com/boats/2004/starcraft-co/power-boats"},
  {label:"2005 Fishmaster 176 DC",startYear:2005,endYear:2005,lowLb:1195,basis:"2005 annual roster lists the Fishmaster 176 DC at 1,195 lb.",sourceUrl:"https://www.jdpower.com/boats/2005/starcraft-co/power-boats"}
]);

setEraWeights("Starcraft","Fishmaster 196",1999,2006,[
  {label:"1999-2004 Fishmaster 196",startYear:1999,endYear:2004,lowLb:1430,basis:"1999 through 2004 annual rosters list the aluminum Fishmaster 196/DC at 1,430 lb.",sourceUrl:"https://www.jdpower.com/boats/2004/starcraft-co/power-boats"},
  {label:"2005-2006 Fishmaster 196 DC",startYear:2005,endYear:2006,lowLb:1470,basis:"2005 and 2006 annual rosters list the Fishmaster 196 DC at 1,470 lb.",sourceUrl:"https://www.jdpower.com/boats/2006/starcraft-co/power-boats"}
]);

setEraWeights("Starcraft","Starfish 176 DC / WT",2006,2007,[
  {label:"2006-2007 Starfish 176 DC",startYear:2006,endYear:2007,lowLb:1195,basis:"2006 and 2007 annual rosters list the Starfish 176 DC at 1,195 lb.",sourceUrl:"https://www.jdpower.com/boats/2007/starcraft-co/power-boats"}
]);
setEraWeights("Starcraft","Starfish 176 DC / WT",2016,2017,[
  {label:"2016-2017 Starfish 176 DC",startYear:2016,endYear:2017,lowLb:1176,basis:"2016 and 2017 annual rosters list the Starfish 176 DC at 1,176 lb.",sourceUrl:"https://www.jdpower.com/boats/2017/starcraft-co/power-boats"}
]);

setEraWeights("Starcraft","STX 2050 Aluminum",2016,2024,[
  {label:"2016-2020 STX 2050",startYear:2016,endYear:2020,lowLb:1650,basis:"2016 through 2020 annual rosters list the 20-foot STX 2050 at 1,650 lb.",sourceUrl:"https://www.jdpower.com/boats/2020/starcraft-co"},
  {label:"2021-2024 STX 2050",startYear:2021,endYear:2024,lowLb:2160,basis:"2021 through 2024 annual rosters list the redesigned 21-foot STX 2050 at 2,160 lb.",sourceUrl:"https://www.jdpower.com/boats/2024/starcraft-co"}
]);

setEraWeights("Starcraft","Superfisherman 186",2017,2024,[
  {label:"2017-2021 Superfisherman 186",startYear:2017,endYear:2021,lowLb:1333,basis:"2017 through 2021 annual rosters list the Superfisherman 186 at 1,333 lb.",sourceUrl:"https://www.jdpower.com/boats/2020/starcraft-co"},
  {label:"2022-2024 Superfisherman 186",startYear:2022,endYear:2024,lowLb:1985,basis:"2022 through 2024 annual rosters list the redesigned Superfisherman 186 at 1,985 lb.",sourceUrl:"https://www.jdpower.com/boats/2024/starcraft-co"}
]);

const marker="window.BOATBUILDER_BOATS";
const markerIndex=source.indexOf(marker);
const arrayStart=source.indexOf("[",markerIndex);
const arrayEnd=source.lastIndexOf("]");
if(markerIndex<0||arrayStart<0||arrayEnd<=arrayStart)throw new Error("Could not locate canonical boat array wrapper");
fs.writeFileSync(path,`${source.slice(0,arrayStart)}${JSON.stringify(boats,null,2)}${source.slice(arrayEnd+1)}`);

const reportPath="reports/published-hull-weight-additions.json";
const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,"utf8")):{generatedAt:new Date().toISOString(),count:0,touched:[]};
report.touched=[...(report.touched||[]),...touched];
report.count=report.touched.length;
report.generatedAt=new Date().toISOString();
fs.writeFileSync(reportPath,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({secondPass:touched.length,totalPublishedHullWeightAdditions:report.count}));
