import fs from "node:fs";
import vm from "node:vm";

const path="data/boats.js";
const source=fs.readFileSync(path,"utf8");
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:path});
const boats=sandbox.window.BOATBUILDER_BOATS;
if(!Array.isArray(boats))throw new Error("Boat catalog did not load");

const touched=[];
const spec=(value,confidence="published-annual-roster")=>({value,confidence});
const requireBoat=(manufacturer,modelFragment)=>{
  const matches=boats.filter(boat=>boat.manufacturer===manufacturer&&boat.model.includes(modelFragment));
  if(matches.length!==1)throw new Error(`Expected one ${manufacturer} model containing ${modelFragment}; found ${matches.length}`);
  return matches[0];
};
const requireGeneration=(boat,startYear,endYear)=>{
  const matches=(boat.designGenerations||[]).filter(generation=>generation.startYear===startYear&&generation.endYear===endYear);
  if(matches.length!==1)throw new Error(`Expected one ${boat.id} generation ${startYear}-${endYear}; found ${matches.length}`);
  return matches[0];
};
const addEvidence=(generation,url)=>{
  generation.evidenceUrls=[...new Set([...(generation.evidenceUrls||[]),url])];
};
const setPublishedWeight=(manufacturer,modelFragment,startYear,endYear,value,url,confidence="published-annual-roster")=>{
  const boat=requireBoat(manufacturer,modelFragment);
  const generation=requireGeneration(boat,startYear,endYear);
  generation.specs||={};
  generation.specs["Dry Hull Weight"]=spec(value,confidence);
  addEvidence(generation,url);
  touched.push({boatId:boat.id,generationId:generation.id,value});
};
const setWeightEras=(manufacturer,modelFragment,startYear,endYear,eras)=>{
  const boat=requireBoat(manufacturer,modelFragment);
  const generation=requireGeneration(boat,startYear,endYear);
  generation.weightEras=eras.map(era=>({
    label:era.label,
    startYear:era.startYear,
    endYear:era.endYear,
    lowLb:era.lowLb,
    highLb:era.highLb??era.lowLb,
    basis:era.basis,
    sourceUrl:era.sourceUrl
  }));
  const template=(generation.eras||[])[0]||{};
  generation.eras=eras.map(era=>({
    ...template,
    label:era.label,
    startYear:era.startYear,
    endYear:era.endYear,
    basis:`${template.basis||"Used complete-package screening estimate"} Hull weight uses the published ${era.startYear}${era.endYear!==era.startYear?`-${era.endYear}`:""} figure.`
  }));
  for(const era of eras)addEvidence(generation,era.sourceUrl);
  touched.push({boatId:boat.id,generationId:generation.id,weightEras:generation.weightEras});
};

setWeightEras("Alumacraft","Trophy 170",1988,1989,[
  {label:"1988 Trophy 170",startYear:1988,endYear:1988,lowLb:875,basis:"1988 annual manufacturer roster lists the Trophy 170 at 875 lb.",sourceUrl:"https://www.jdpower.com/boats/1988/alumacraft-boat-co"},
  {label:"1989 Trophy 170 Combo",startYear:1989,endYear:1989,lowLb:1725,basis:"1989 annual roster lists the Trophy 170 Combo at 1,725 lb; do not carry the 1988 hull weight forward.",sourceUrl:"https://www.jdpower.com/boats/1989/alumacraft-boat-co"}
]);

setPublishedWeight("Crestliner","Fish Hawk 1750 WT",2002,2006,"1,100 lb","https://www.jdpower.com/boats/2002/crestliner-inc");
setPublishedWeight("Crestliner","Super Hawk 1800 WT",2004,2007,"1,470 lb","https://www.jdpower.com/boats/2004/crestliner-inc/power-boats");
setPublishedWeight("Crestliner","Vision 1600 WT",2014,2015,"935 lb","https://www.jdpower.com/boats/2015/crestliner-inc/1600-vision___/32048517/specs","manufacturer-reported-annual-spec");
setPublishedWeight("Crestliner","Vision 1700 WT",2015,2015,"1,190 lb","https://www.jdpower.com/boats/2015/crestliner-inc","published-annual-roster");

setPublishedWeight("G3","Angler V175 FS",2006,2009,"1,460 lb","https://www.jdpower.com/boats/2009/g3-boats","published-annual-roster");

setWeightEras("Smoker Craft","Fazer 172",1989,1994,[
  {label:"1989-1990 172 Fazer",startYear:1989,endYear:1990,lowLb:860,basis:"1989 172GZ Fazer and 1990 172FZ Fazer Mark II annual rosters list 860 lb.",sourceUrl:"https://www.jdpower.com/boats/1989/smoker-craft-inc"},
  {label:"1991-1994 172 Fazer",startYear:1991,endYear:1994,lowLb:910,basis:"1991-1994 annual rosters list the 172 Fazer at 910 lb.",sourceUrl:"https://www.jdpower.com/boats/1991/smoker-craft-inc"}
]);
setPublishedWeight("Smoker Craft","Fazer 192",1993,1994,"1,100 lb","https://www.jdpower.com/boats/1994/smoker-craft-inc");
setPublishedWeight("Smoker Craft","Fazer 192",1996,1999,"1,375 lb","https://www.jdpower.com/boats/1996/smoker-craft-inc");
setPublishedWeight("Smoker Craft","Pro Mag 182",1994,1999,"1,310 lb","https://www.jdpower.com/boats/1996/smoker-craft-inc","published-annual-roster");
setPublishedWeight("Smoker Craft","Ultima 175",1994,1994,"1,120 lb","https://www.jdpower.com/boats/1994/smoker-craft-inc","published-annual-roster");
setPublishedWeight("Smoker Craft","Ultima 175",1996,1999,"1,120 lb","https://www.jdpower.com/boats/1996/smoker-craft-inc","published-annual-roster");
setPublishedWeight("Smoker Craft","Stealth 162",2004,2004,"660 lb","https://www.jdpower.com/boats/2004/smoker-craft-inc","published-annual-roster");
setPublishedWeight("Smoker Craft","Pro Mag 162",2001,2001,"960 lb","https://www.jdpower.com/boats/2001/smoker-craft-inc","published-annual-roster");
setPublishedWeight("Smoker Craft","Ultima 182",2001,2002,"1,080 lb","https://www.jdpower.com/boats/2001/smoker-craft-inc","published-annual-roster");

setPublishedWeight("Starcraft","SFM 160 Superfisherman",1987,1989,"650 lb","https://www.jdpower.com/boats/1989/starcraft-co","published-annual-roster");
setPublishedWeight("Starcraft","SFM 180 Superfisherman",1987,1989,"900 lb","https://www.jdpower.com/boats/1989/starcraft-co","published-annual-roster");
setPublishedWeight("Starcraft","Fishmaster 196",2007,2009,"1,498 lb","https://www.jdpower.com/boats/2008/starcraft-co/power-boats","published-annual-roster");
setPublishedWeight("Starcraft","Fishmaster 196",2016,2024,"1,430 lb","https://www.jdpower.com/boats/2017/starcraft-co/power-boats","published-annual-roster");
setWeightEras("Starcraft","Superfisherman 190",1991,1997,[
  {label:"1991 Superfisherman 190",startYear:1991,endYear:1991,lowLb:930,basis:"1991 annual roster lists the Superfisherman 190 at 930 lb.",sourceUrl:"https://www.jdpower.com/boats/1991/starcraft-co/power-boats"},
  {label:"1992-1993 Superfisherman 190",startYear:1992,endYear:1993,lowLb:1050,basis:"1992-1993 annual rosters list the Superfisherman 190 at 1,050 lb.",sourceUrl:"https://www.jdpower.com/boats/1992/starcraft-co"},
  {label:"1994-1997 Superfisherman 190",startYear:1994,endYear:1997,lowLb:1183,basis:"1994-1997 annual rosters list the Superfisherman 190 at 1,183 lb.",sourceUrl:"https://www.jdpower.com/boats/1994/starcraft-co/power-boats"}
]);
setPublishedWeight("Starcraft","STX 2050 Aluminum",2025,2026,"2,160 lb","https://starcraftmarine.com/series/stx/","current-factory-spec");
setPublishedWeight("Starcraft","Superfisherman 186",2025,2026,"1,985 lb","https://starcraftmarine.com/model/186-dc/","current-factory-spec");

setPublishedWeight("Starweld","Fusion 16 DC",2018,2020,"1,045 lb","https://www.starcraftmarine.com/sites/default/files/2018-Starweld-Catalog.pdf","factory-catalog");
setPublishedWeight("Starweld","Fusion 16 DC",2022,2026,"925 lb","https://www.jdpower.com/boats/2024/starweld","published-annual-roster");
setPublishedWeight("Starweld","Fusion 18 DC",2018,2020,"1,225 lb","https://www.starcraftmarine.com/sites/default/files/2018-Starweld-Catalog.pdf","factory-catalog");
setPublishedWeight("Starweld","Fusion 18 DC",2022,2025,"1,165 lb","https://www.jdpower.com/boats/2024/starweld","published-annual-roster");

setPublishedWeight("Tracker","Pro Guide V-175 WT",2011,2011,"1,385 lb","https://www.jdpower.com/boats/2011/tracker-marine","published-annual-roster");
setPublishedWeight("Tracker","Tundra 18 DC",2003,2003,"1,460 lb","https://www.jdpower.com/boats/2003/tracker-marine","published-annual-roster");

setPublishedWeight("Triton","DV186 DC Magnum",2006,2006,"1,300 lb","https://www.jdpower.com/boats/2006/triton-boats","published-annual-roster");

const marker="window.BOATBUILDER_BOATS";
const markerIndex=source.indexOf(marker);
const arrayStart=source.indexOf("[",markerIndex);
const arrayEnd=source.lastIndexOf("]");
if(markerIndex<0||arrayStart<0||arrayEnd<=arrayStart)throw new Error("Could not locate canonical boat array wrapper");
const output=`${source.slice(0,arrayStart)}${JSON.stringify(boats,null,2)}${source.slice(arrayEnd+1)}`;
fs.writeFileSync(path,output);
fs.mkdirSync("reports",{recursive:true});
fs.writeFileSync("reports/published-hull-weight-additions.json",`${JSON.stringify({generatedAt:new Date().toISOString(),count:touched.length,touched},null,2)}\n`);
console.log(JSON.stringify({publishedHullWeightAdditions:touched.length}));
