import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync("data/boats.js","utf8"),sandbox,{filename:"data/boats.js"});
const boats=sandbox.window.BOATBUILDER_BOATS;
assert.equal(boats.length,183,"Published-weight pass must not add or remove boats");

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
const weight=(entry,startYear,endYear)=>generation(entry,startYear,endYear).specs?.["Dry Hull Weight"]?.value;

assert.equal(weight(boat("Crestliner","Fish Hawk 1750 WT"),2002,2006),"1,100 lb");
assert.equal(weight(boat("Crestliner","Super Hawk 1800 WT"),2004,2007),"1,470 lb");
assert.equal(weight(boat("Crestliner","Vision 1600 WT"),2014,2015),"935 lb");
assert.equal(weight(boat("Crestliner","Vision 1700 WT"),2015,2015),"1,190 lb");
assert.equal(weight(boat("G3","Angler V175 FS"),2006,2009),"1,460 lb");
assert.equal(weight(boat("Smoker Craft","Fazer 192"),1993,1994),"1,100 lb");
assert.equal(weight(boat("Smoker Craft","Fazer 192"),1996,1999),"1,375 lb");
assert.equal(weight(boat("Smoker Craft","Pro Mag 182"),1994,1999),"1,310 lb");
assert.equal(weight(boat("Smoker Craft","Pro Mag 162"),2001,2001),"960 lb");
assert.equal(weight(boat("Starcraft","Fishmaster 196"),2007,2009),"1,498 lb");
assert.equal(weight(boat("Starcraft","Fishmaster 196"),2016,2024),"1,430 lb");
assert.equal(weight(boat("Starcraft","Superfisherman 186"),2025,2026),"1,985 lb");
assert.equal(weight(boat("Tracker","Pro Guide V-175 WT"),2011,2011),"1,385 lb");
assert.equal(weight(boat("Triton","DV186 DC Magnum"),2006,2006),"1,300 lb");

const trophy=generation(boat("Alumacraft","Trophy 170"),1988,1989);
assert.deepEqual(JSON.parse(JSON.stringify(trophy.weightEras.map(({startYear,endYear,lowLb,highLb})=>({startYear,endYear,lowLb,highLb})))),[
  {startYear:1988,endYear:1988,lowLb:875,highLb:875},
  {startYear:1989,endYear:1989,lowLb:1725,highLb:1725}
]);
assert.deepEqual(JSON.parse(JSON.stringify(trophy.eras.map(({startYear,endYear})=>({startYear,endYear})))),[
  {startYear:1988,endYear:1988},
  {startYear:1989,endYear:1989}
]);

const fazer=generation(boat("Smoker Craft","Fazer 172"),1989,1994);
assert.deepEqual(JSON.parse(JSON.stringify(fazer.weightEras.map(({startYear,endYear,lowLb})=>({startYear,endYear,lowLb})))),[
  {startYear:1989,endYear:1990,lowLb:860},
  {startYear:1991,endYear:1994,lowLb:910}
]);
const superfisherman=generation(boat("Starcraft","Superfisherman 190"),1991,1997);
assert.deepEqual(JSON.parse(JSON.stringify(superfisherman.weightEras.map(({startYear,endYear,lowLb})=>({startYear,endYear,lowLb})))),[
  {startYear:1991,endYear:1991,lowLb:930},
  {startYear:1992,endYear:1993,lowLb:1050},
  {startYear:1994,endYear:1997,lowLb:1183}
]);

for(const entry of boats){
  for(const g of entry.designGenerations||[]){
    if(g.status==="alias-only"||g.status==="family-umbrella-rejection"||g.status==="unresolved"){
      assert.ok(!g.weightEras?.length,`${g.id} received year-specific weight despite unresolved/alias identity`);
    }
  }
}

const additions=JSON.parse(fs.readFileSync("reports/published-hull-weight-additions.json","utf8"));
assert.ok(additions.count>=25,"Published hull-weight addition count unexpectedly small");
console.log(JSON.stringify({boats:boats.length,publishedWeightAdditions:additions.count}));
