import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync("data/boats.js","utf8"),sandbox,{filename:"data/boats.js"});
vm.runInNewContext(fs.readFileSync("weight-model.js","utf8"),sandbox,{filename:"weight-model.js"});
const boats=sandbox.window.BOATBUILDER_BOATS;
const W=sandbox.window.BOATBUILDER_WEIGHT_MODEL;
const boat=(manufacturer,fragment)=>{
  const matches=boats.filter(entry=>entry.manufacturer===manufacturer&&entry.model.includes(fragment));
  assert.equal(matches.length,1,`${manufacturer} ${fragment} lookup is ambiguous`);
  return matches[0];
};
const generation=(entry,startYear,endYear)=>{
  const matches=entry.designGenerations.filter(g=>g.startYear===startYear&&g.endYear===endYear);
  assert.equal(matches.length,1,`${entry.id} ${startYear}-${endYear} generation is ambiguous`);
  return matches[0];
};
const expectEra=(entry,g,era,expected)=>assert.equal(W.hullWeight(entry,{generationId:g.id,era}).low,expected,`${entry.id} ${era} weight changed`);

const osprey=boat("Smoker Craft","Osprey 162 WT");
const ospreyGeneration=generation(osprey,2019,2024);
expectEra(osprey,ospreyGeneration,"2019-2023 Osprey 162",1075);
assert.equal(W.hullWeight(osprey,{generationId:ospreyGeneration.id,era:"2024 Osprey 162 identity"}).confidence,"unavailable","2024 Osprey must remain unavailable");

const fm176=boat("Starcraft","Fishmaster 176 DC");
const fm176Generation=generation(fm176,1999,2005);
expectEra(fm176,fm176Generation,"1999-2000 Fishmaster 176 DC",1176);
expectEra(fm176,fm176Generation,"2001-2004 Fishmaster 176 DC",1175);
expectEra(fm176,fm176Generation,"2005 Fishmaster 176 DC",1195);

const fm196=boat("Starcraft","Fishmaster 196");
const fm196Generation=generation(fm196,1999,2006);
expectEra(fm196,fm196Generation,"1999-2004 Fishmaster 196",1430);
expectEra(fm196,fm196Generation,"2005-2006 Fishmaster 196 DC",1470);

const starfish=boat("Starcraft","Starfish 176 DC / WT");
expectEra(starfish,generation(starfish,2006,2007),"2006-2007 Starfish 176 DC",1195);
expectEra(starfish,generation(starfish,2016,2017),"2016-2017 Starfish 176 DC",1176);

const stx=boat("Starcraft","STX 2050 Aluminum");
const stxGeneration=generation(stx,2016,2024);
expectEra(stx,stxGeneration,"2016-2020 STX 2050",1650);
expectEra(stx,stxGeneration,"2021-2024 STX 2050",2160);

const sf186=boat("Starcraft","Superfisherman 186");
const sf186Generation=generation(sf186,2017,2024);
expectEra(sf186,sf186Generation,"2017-2021 Superfisherman 186",1333);
expectEra(sf186,sf186Generation,"2022-2024 Superfisherman 186",1985);
const currentGeneration=generation(sf186,2025,2026);
assert.equal(W.hullWeight(sf186,{generationId:currentGeneration.id}).confidence,"unavailable","Current conflicted Superfisherman generation must remain unavailable");

console.log(JSON.stringify({secondPassModels:6,secondPassGenerationRows:7}));
