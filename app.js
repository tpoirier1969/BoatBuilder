(()=>{
"use strict";

const PACKAGE_WEIGHT_UI_V1=true;
const PACKAGE_WEIGHT_UI_V2=true;
const K="boatbuilder.currentEstimate.v7";
const OLD=["boatbuilder.currentEstimate.v6","boatbuilder.currentEstimate.v5","boatbuilder.currentEstimate.v4","boatbuilder.currentEstimate.v3","boatbuilder.currentEstimate.v2","boatbuilder.currentEstimate.v1"];
const GEAR_KEY="boatbuilder.gearAllowance.v1";
const MC=new Set(["main-motors","kickers"]);
const SC=new Set(["electronics","electrical"]);
const WC=new Set(["boats","main-motors","kickers","bow-trolling-motors","downriggers","electrical","canvas"]);
const SL=new Set(["Length","Beam","Chine / Bottom Width","Dry Hull Weight","Max / Bow Depth","Cockpit / Interior Depth","Deadrise","Transom Height","Transom Width","Max HP","Persons","Capacity Weight","Fuel Capacity","Bottom Thickness","Side / Freeboard Thickness","Construction"]);
const TR=[
  {id:"standard",label:"Standard factory / generic trailer included",low:0,high:0},
  {id:"premium-single",label:"Premium single axle",low:400,high:1200},
  {id:"galvanized-single",label:"Galvanized single axle",low:700,high:1600},
  {id:"aluminum-single",label:"Aluminum single axle",low:1200,high:2500},
  {id:"tandem",label:"Tandem axle",low:1500,high:3000},
  {id:"tandem-premium",label:"Premium tandem / aluminum",low:2500,high:4500}
];
const CONDITIONS=[
  {id:"excellent",label:"Excellent / turnkey",from:0.70,to:1,description:"Solid floor and transom, healthy serviced motor, clean trailer, working systems, and good upholstery or canvas."},
  {id:"good",label:"Good / normal used condition",from:0.35,to:0.70,description:"Structurally sound and fully usable, with ordinary cosmetic wear and only routine maintenance or minor accessory work expected."},
  {id:"fair",label:"Fair / needs work",from:0,to:0.35,description:"Usable, but with tired upholstery, neglected maintenance, trailer work, wiring issues, or other repairable deficiencies."},
  {id:"project",label:"Project / poor or unknown",manual:true,description:"Bad or untested motor, questionable floor or transom, major trailer problems, or uncertain structural condition. Manual evaluation required."}
];
const E={
  app:document.querySelector("#app"),
  loading:document.querySelector("#loading"),
  back:document.querySelector("#back-button"),
  home:document.querySelector("#home-button"),
  clear:document.querySelector("#clear-estimate-button"),
  estimate:document.querySelector("#estimate-button"),
  count:document.querySelector("#estimate-count"),
  range:document.querySelector("#estimate-range")
};
const M=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
const W=window.BOATBUILDER_WEIGHT_MODEL;
let C,B,S=load(),P=new Map,H=[],G=loadGear();

const cl=v=>v==null?"":String(v).trim();
const esc=v=>cl(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const dm=i=>new Map((i.details||[]).map(d=>[d.label,d.value]));
const cfg=v=>({
  generationId:cl(v?.generationId)||null,
  era:cl(v?.era)||null,
  condition:CONDITIONS.some(x=>x.id===v?.condition)?v.condition:"good",
  hp:Number(v?.hp)>0?Number(v.hp):null,
  trailer:cl(v?.trailer)||"standard",
  weightOverride:Number(v?.weightOverride)>0?Number(v.weightOverride):null,
  trailerWeightOverride:Number(v?.trailerWeightOverride)>0?Number(v.trailerWeightOverride):null,
  fuelPercent:[0,25,50,75,100].includes(Number(v?.fuelPercent))?Number(v.fuelPercent):100,
  fuelGallons:Number(v?.fuelGallons)>0?Number(v.fuelGallons):null,
  voltage:[12,24,36].includes(Number(v?.voltage))?Number(v.voltage):null,
  batterySetup:["flooded","agm","lithium","none"].includes(v?.batterySetup)?v.batterySetup:"flooded",
  startingBattery:v?.startingBattery==="none"?"none":"included",
  quantity:Math.max(1,Math.min(4,Math.round(Number(v?.quantity)||1)))
});

function loadGear(){
  const value=Number(localStorage.getItem(GEAR_KEY));
  return Number.isFinite(value)&&value>=0?value:150;
}
function saveGear(){localStorage.setItem(GEAR_KEY,String(G));}
function load(){
  for(const k of[K,...OLD]){
    try{
      const x=JSON.parse(localStorage.getItem(k)||"null");
      if(Array.isArray(x))return new Map(x.map(e=>typeof e==="string"?[e,cfg()]:[e.id,cfg(e)]));
    }catch{}
  }
  return new Map();
}
function save(){
  localStorage.setItem(K,JSON.stringify([...S].map(([id,c])=>({id,...cfg(c)}))));
  E.count.textContent=S.size;
  E.clear.disabled=!S.size;
  head();
}
function eras(i){
  return Array.isArray(i.valueEras)?i.valueEras.map(v=>({label:v.label,low:v.lowPrice,high:v.highPrice,basis:v.basis||"Used complete-package screening estimate"})):[];
}
function span(i){return cl(dm(i).get("Model Years / Era"))||cl(i.subtitle)||"Production years not established";}
function risk(i){return /varies|representative|multiple distinct|multiple generations|exact year|by year|redesign|audit pending/i.test(span(i));}
function specs(i){return Object.fromEntries((i.details||[]).filter(d=>SL.has(d.label)).map(d=>[d.label,{value:d.value,confidence:"catalog-representative"}]));}
function gens(i){
  if(i.categoryId!=="boats")return[];
  if(Array.isArray(i.designGenerations)&&i.designGenerations.length){
    return i.designGenerations.map(g=>({...g,basis:g.specificationBasis||g.basis||"",specs:g.catalogSpecs?specs(i):g.specs}));
  }
  return [{
    id:i.id+":catalog",
    label:risk(i)?"Catalog specification basis, redesign audit pending":"Catalog specification basis",
    status:risk(i)?"generation-audit-required":"single-record-basis",
    basis:span(i)+(risk(i)?". The app has not verified that this design stayed unchanged across the full span.":". No conflicting design generation is currently documented."),
    specs:specs(i),
    eras:eras(i),
    synthetic:true
  }];
}
function generationEras(i,g){return g?.eras?.length?g.eras:(g?.synthetic||g?.catalogSpecs?eras(i):[]);}
function choiceLabel(g,e){
  if(!e)return g.label;
  const eraText=cl(e.label).replaceAll("-","–");
  const generationText=cl(g.label).replaceAll("-","–");
  if(generationText.toLowerCase().includes(eraText.toLowerCase()))return g.label;
  return `${e.label} · ${g.label}`;
}
function choiceKey(generationId,era){return `${encodeURIComponent(generationId)}~${encodeURIComponent(era||"")}`;}
function parseChoiceKey(value){
  const [generationId="",era=""]=String(value||"").split("~");
  return {generationId:decodeURIComponent(generationId)||null,era:decodeURIComponent(era)||null};
}
function choices(i){
  if(i.categoryId!=="boats")return[];
  const out=[];
  for(const g of gens(i)){
    const list=generationEras(i,g);
    if(list.length){
      for(const e of list)out.push({generation:g,era:e,key:choiceKey(g.id,e.label),label:choiceLabel(g,e)});
    }else{
      out.push({generation:g,era:null,key:choiceKey(g.id,null),label:g.label});
    }
  }
  return out;
}
function selectedChoice(i,c0={}){
  const c=cfg(c0),list=choices(i);
  if(list.length===1)return list[0];
  let match=list.find(x=>x.generation.id===c.generationId&&(x.era?.label||null)===(c.era||null));
  if(match)return match;
  if(c.generationId&&!c.era){
    const within=list.filter(x=>x.generation.id===c.generationId);
    if(within.length===1)return within[0];
  }
  if(!c.generationId&&c.era){
    const within=list.filter(x=>(x.era?.label||null)===c.era);
    if(within.length===1)return within[0];
  }
  return null;
}
function gen(i,c){return selectedChoice(i,c)?.generation||null;}
function eraList(i,c){const chosen=selectedChoice(i,c);return chosen?.generation?generationEras(i,chosen.generation):[];}
function round100(v){return Math.round(v/100)*100;}
function applyCondition(p,c){
  if(!Number.isFinite(p.low)||!Number.isFinite(p.high))return p;
  const condition=CONDITIONS.find(x=>x.id===c.condition)||CONDITIONS[1];
  p.condition=condition;
  if(condition.manual){
    p.low=null;
    p.high=null;
    p.manual=true;
    p.basis=`Manual evaluation required. ${condition.description}`;
    return p;
  }
  const baseLow=p.low,baseHigh=p.high,spread=Math.max(0,baseHigh-baseLow);
  p.low=round100(baseLow+spread*condition.from);
  p.high=round100(baseLow+spread*condition.to);
  p.basis=`${p.basis||"Used complete-package screening estimate"} Package condition: ${condition.label}. ${condition.description}`;
  return p;
}
function price(i,c0={}){
  const c=cfg(c0),chosen=selectedChoice(i,c),all=choices(i);
  let p;
  if(i.categoryId==="boats"&&all.length>1&&!chosen){
    p={low:null,high:null,basis:"Choose a year / hull option."};
  }else if(chosen?.era&&Number.isFinite(chosen.era.low)&&Number.isFinite(chosen.era.high)){
    p={low:chosen.era.low,high:chosen.era.high,basis:chosen.era.basis,generation:chosen.generation,era:chosen.era.label};
  }else if(i.categoryId==="boats"&&chosen?.generation&&!chosen.generation.synthetic){
    p={low:null,high:null,basis:"This entry requires model identification or manual evaluation.",generation:chosen.generation};
  }else{
    p={low:i.lowPrice,high:i.highPrice,basis:i.priceBasis,generation:chosen?.generation||null};
  }
  if(i.categoryId==="boats"){
    p=applyCondition(p,c);
    const t=TR.find(x=>x.id===c.trailer)||TR[0];
    p.low=Number.isFinite(p.low)?p.low+t.low:p.low;
    p.high=Number.isFinite(p.high)?p.high+t.high:p.high;
    p.trailer=t;
  }
  return p;
}
const fp=v=>Number.isFinite(v)?M.format(v):"Not set";
const fr=p=>p.manual?"Manual evaluation required":Number.isFinite(p.low)&&Number.isFinite(p.high)?fp(p.low)+"–"+fp(p.high):"Choose year / hull";
const work=id=>cfg(S.get(id)||P.get(id)||{});
function missing(i,c0={}){
  const list=choices(i),m=[];
  if(i.categoryId==="boats"&&list.length>1&&!selectedChoice(i,c0))m.push("year / hull");
  return m;
}
function selectable(i,c0={}){
  const p=price(i,c0);
  return !missing(i,c0).length&&!p.manual&&Number.isFinite(p.low)&&Number.isFinite(p.high);
}
function setc(id,patch){
  const n=cfg({...work(id),...patch});
  P.set(id,n);
  if(S.has(id)){
    const i=B.get(id);
    selectable(i,n)?S.set(id,n):S.delete(id);
  }
  save();
}
function hasNumericPricing(i){
  if(Number.isFinite(i.lowPrice)&&Number.isFinite(i.highPrice))return true;
  return choices(i).some(x=>Number.isFinite(x.era?.low)&&Number.isFinite(x.era?.high));
}
function weightControls(i,c0,prefix){
  const c=cfg(c0),preview=W.itemWeight(i,c);
  if(!WC.has(i.categoryId)&&!preview.display)return"";
  let html="";
  if(MC.has(i.categoryId)){
    const hp=W.horsepowerOptions(i);
    html+=`<label class="config-field"><span>Horsepower for weight</span><input type="number" min="1" max="350" step="0.1" data-hp="${esc(i.id)}" value="${c.hp||""}" placeholder="${hp.length>1?hp[0]+"–"+hp.at(-1):hp[0]||"Enter hp"}"><small>Choose the actual horsepower to narrow the motor-weight range.</small></label>`;
    if(i.categoryId==="main-motors")html+=`<label class="config-field"><span>Starting battery</span><select data-starting-battery="${esc(i.id)}"><option value="included"${c.startingBattery==="included"?" selected":""}>Include typical starting battery</option><option value="none"${c.startingBattery==="none"?" selected":""}>Battery counted separately</option></select></label>`;
  }
  if(i.categoryId==="bow-trolling-motors"){
    const volts=W.voltageOptions(i);
    if(volts.length>1)html+=`<label class="config-field"><span>Motor voltage</span><select data-voltage="${esc(i.id)}"><option value="">Choose voltage</option>${volts.map(v=>`<option value="${v}"${c.voltage===v?" selected":""}>${v}V</option>`).join("")}</select></label>`;
    html+=`<label class="config-field"><span>Trolling battery bank</span><select data-battery="${esc(i.id)}">${Object.entries(W.BATTERIES).map(([id,value])=>`<option value="${id}"${c.batterySetup===id?" selected":""}>${esc(value.label)}</option>`).join("")}</select><small>Choose “counted separately” when a battery-bank item is also in the estimate.</small></label>`;
  }
  if(i.categoryId==="downriggers")html+=`<label class="config-field"><span>Installed quantity</span><select data-quantity="${esc(i.id)}">${[1,2,3,4].map(n=>`<option value="${n}"${c.quantity===n?" selected":""}>${n}</option>`).join("")}</select></label>`;
  if(i.categoryId==="boats"){
    html+=`<label class="config-field"><span>Fuel carried</span><select data-fuel-percent="${esc(i.id)}">${[0,25,50,75,100].map(n=>`<option value="${n}"${c.fuelPercent===n?" selected":""}>${n===0?"Empty":n+"% of capacity"}</option>`).join("")}</select></label>`;
    html+=`<label class="config-field"><span>Fuel capacity override, gallons</span><input type="number" min="0" max="150" step="0.5" data-fuel-gallons="${esc(i.id)}" value="${c.fuelGallons||""}" placeholder="Use published capacity"><small>Use only when the selected hull's tank differs from the catalog.</small></label>`;
    html+=`<label class="config-field"><span>Actual trailer weight, optional</span><input type="number" min="0" max="5000" step="5" data-trailer-weight="${esc(i.id)}" value="${c.trailerWeightOverride||""}" placeholder="Use trailer estimate"><small>Enter a scale, title or manufacturer figure to replace the trailer estimate.</small></label>`;
  }
  const label=i.categoryId==="boats"?"Documented or measured dry-hull weight, optional":"Actual installed weight, optional";
  html+=`<label class="config-field"><span>${label}</span><input type="number" min="0" max="10000" step="1" data-weight="${esc(i.id)}" value="${c.weightOverride||""}" placeholder="Use catalog weight"><small>Overrides only this item. Published hull data remains the default.</small></label>`;
  return `<div class="weight-controls"><h3>Weight setup</h3>${html}</div>`;
}
function controls(i,c0,prefix){
  const c=cfg(c0),list=choices(i),chosen=selectedChoice(i,c);
  let html="";
  if(list.length>1){
    html+=`<label class="config-field"><span>Year / hull</span><select data-choice="${esc(i.id)}" id="${prefix}-choice"><option value="">Choose year / hull</option>${list.map(x=>`<option value="${esc(x.key)}"${chosen?.key===x.key?" selected":""}>${esc(x.label)}</option>`).join("")}</select><small>Each option stays inside one documented hull design.</small></label>`;
  }
  if(i.categoryId==="boats"&&hasNumericPricing(i)){
    const condition=CONDITIONS.find(x=>x.id===c.condition)||CONDITIONS[1];
    html+=`<label class="config-field"><span>Package condition</span><select data-condition="${esc(i.id)}">${CONDITIONS.map(x=>`<option value="${x.id}"${x.id===c.condition?" selected":""}>${esc(x.label)}</option>`).join("")}</select><small>${esc(condition.description)}</small></label>`;
  }
  if(i.categoryId==="boats"){
    html+=`<label class="config-field"><span>Trailer included</span><select data-t="${esc(i.id)}">${TR.map(x=>`<option value="${x.id}"${x.id===c.trailer?" selected":""}>${esc(x.label)}</option>`).join("")}</select></label>`;
  }
  const pricing=html?`<div class="configuration-controls">${html}</div>`:"";
  return pricing+weightControls(i,c,prefix);
}
function panel(i,c){
  if(i.categoryId!=="boats")return"";
  const g=gen(i,c),w=i.generationWarning||(g?.status==="generation-audit-required"?"Specs are representative of the cited source, not guaranteed for every production year.":"");
  const rows=g?Object.entries(g.specs||{}).map(([k,v])=>`<div class="definition-row"><dt>${esc(k)}</dt><dd>${esc(v.value)}${v.confidence?" · "+esc(v.confidence):""}</dd></div>`).join(""):"";
  return `<aside class="manufacturer-note">${w?`<strong>Generation warning:</strong> ${esc(w)}`:""}${g?`<p><strong>${esc(g.label)}</strong><br>${esc(g.basis)}</p>${rows?`<dl class="definition-list">${rows}</dl>`:""}`:""}</aside>`;
}
function bind(i,rerender){
  E.app.querySelectorAll("[data-choice]").forEach(select=>select.onchange=e=>{
    if(select.dataset.choice===i.id){
      const selected=e.target.value?parseChoiceKey(e.target.value):{generationId:null,era:null};
      setc(i.id,selected);
      rerender();
    }
  });
  E.app.querySelectorAll("[data-condition]").forEach(select=>select.onchange=e=>{if(select.dataset.condition===i.id){setc(i.id,{condition:e.target.value});rerender();}});
  E.app.querySelectorAll("[data-t]").forEach(select=>select.onchange=e=>{if(select.dataset.t===i.id){setc(i.id,{trailer:e.target.value});rerender();}});
  E.app.querySelectorAll("[data-hp]").forEach(control=>control.onchange=e=>{if(control.dataset.hp===i.id){setc(i.id,{hp:Number(e.target.value)||null});rerender();}});
  E.app.querySelectorAll("[data-weight]").forEach(control=>control.onchange=e=>{if(control.dataset.weight===i.id){setc(i.id,{weightOverride:Number(e.target.value)||null});rerender();}});
  E.app.querySelectorAll("[data-trailer-weight]").forEach(control=>control.onchange=e=>{if(control.dataset.trailerWeight===i.id){setc(i.id,{trailerWeightOverride:Number(e.target.value)||null});rerender();}});
  E.app.querySelectorAll("[data-fuel-percent]").forEach(control=>control.onchange=e=>{if(control.dataset.fuelPercent===i.id){setc(i.id,{fuelPercent:Number(e.target.value)});rerender();}});
  E.app.querySelectorAll("[data-fuel-gallons]").forEach(control=>control.onchange=e=>{if(control.dataset.fuelGallons===i.id){setc(i.id,{fuelGallons:Number(e.target.value)||null});rerender();}});
  E.app.querySelectorAll("[data-voltage]").forEach(control=>control.onchange=e=>{if(control.dataset.voltage===i.id){setc(i.id,{voltage:Number(e.target.value)||null});rerender();}});
  E.app.querySelectorAll("[data-battery]").forEach(control=>control.onchange=e=>{if(control.dataset.battery===i.id){setc(i.id,{batterySetup:e.target.value});rerender();}});
  E.app.querySelectorAll("[data-starting-battery]").forEach(control=>control.onchange=e=>{if(control.dataset.startingBattery===i.id){setc(i.id,{startingBattery:e.target.value});rerender();}});
  E.app.querySelectorAll("[data-quantity]").forEach(control=>control.onchange=e=>{if(control.dataset.quantity===i.id){setc(i.id,{quantity:Number(e.target.value)||1});rerender();}});
}
const heading=(title,description="")=>`<header class="page-heading"><h1>${esc(title)}</h1>${description?`<p>${esc(description)}</p>`:""}</header>`;
const items=(category,subtype=null)=>C.items.filter(i=>i.categoryId===category&&(!subtype||i.subtypeId===subtype));
function route(){
  const parts=location.hash.replace(/^#/,"").split("/");
  if(!parts[0])return{v:"cats"};
  if(parts[0]==="category")return{v:SC.has(decodeURIComponent(parts[1]))?"subs":"makers",c:decodeURIComponent(parts[1])};
  if(parts[0]==="subtype")return{v:"makers",c:decodeURIComponent(parts[1]),s:decodeURIComponent(parts[2])};
  if(parts[0]==="manufacturer")return{v:"list",c:decodeURIComponent(parts[1]),s:SC.has(decodeURIComponent(parts[1]))?decodeURIComponent(parts[2]):null,m:decodeURIComponent(parts.slice(SC.has(decodeURIComponent(parts[1]))?3:2).join("/"))};
  if(parts[0]==="item")return{v:"detail",id:decodeURIComponent(parts.slice(1).join("/"))};
  if(parts[0]==="estimate")return{v:"estimate"};
  return{v:"cats"};
}
function nav(hash){H.push(route());location.hash=hash;}
function cats(){
  E.app.innerHTML=heading("Build a used aluminum outboard boat package","Choose the type of item.")+`<section class="card-list category-grid">${C.categories.sort((a,b)=>a.order-b.order).map(c=>`<button class="nav-card" data-c="${c.id}"><span><strong>${esc(c.name)}</strong><small>${items(c.id).length} catalog items</small></span></button>`).join("")}</section>`;
  E.app.querySelectorAll("[data-c]").forEach(button=>button.onclick=()=>nav("category/"+button.dataset.c));
}
function subs(r){
  const groups=new Map();
  for(const i of items(r.c)){
    const id=i.subtypeId||"other";
    if(!groups.has(id))groups.set(id,{id,name:i.subtypeName||"Other",n:0});
    groups.get(id).n++;
  }
  E.app.innerHTML=heading(C.categories.find(x=>x.id===r.c)?.name||r.c)+`<section class="card-list">${[...groups.values()].map(x=>`<button class="nav-card" data-s="${x.id}"><strong>${esc(x.name)}</strong><small>${x.n} items</small></button>`).join("")}</section>`;
  E.app.querySelectorAll("[data-s]").forEach(button=>button.onclick=()=>nav(`subtype/${r.c}/${button.dataset.s}`));
}
function makers(r){
  const groups=new Map();
  for(const i of items(r.c,r.s))groups.set(i.manufacturer,(groups.get(i.manufacturer)||0)+1);
  E.app.innerHTML=heading("Choose a manufacturer")+`<section class="card-list">${[...groups].sort().map(([manufacturer,n])=>`<button class="nav-card" data-m="${esc(manufacturer)}"><strong>${esc(manufacturer)}</strong><small>${n} models</small></button>`).join("")}</section>`;
  E.app.querySelectorAll("[data-m]").forEach(button=>button.onclick=()=>nav(`manufacturer/${r.c}/${r.s?r.s+"/":""}${encodeURIComponent(button.dataset.m)}`));
}
function list(r){
  const records=items(r.c,r.s).filter(i=>i.manufacturer===r.m).sort((a,b)=>a.model.localeCompare(b.model));
  E.app.innerHTML=heading(r.m)+(r.c==="boats"?`<aside class="manufacturer-note"><strong>Generation audit:</strong> Every model identifies its specification basis. Broad spans remain flagged until redesign boundaries are verified.</aside>`:"")+`<section class="card-list">${records.map(i=>{
    const c=work(i.id),p=price(i,c),w=W.itemWeight(i,c);
    const priceHtml=Number.isFinite(p.low)&&Number.isFinite(p.high)?`<span class="price">${fr(p)}</span>`:"";
    const weightHtml=w.display?`<span class="weight-brief${w.complete?"":" incomplete"}">${w.complete?W.formatRange(w):i.categoryId==="boats"&&choices(i).length>1&&!selectedChoice(i,c)?"Choose year for weight":"Weight incomplete"}</span>`:"";
    return `<article class="item-card"><button class="item-open" data-i="${esc(i.id)}"><strong>${esc(i.model)}</strong><span>${esc(i.subtitle||"")}${risk(i)?" · generation audit pending":""}</span></button><div class="item-metrics">${priceHtml}${weightHtml}</div></article>`;
  }).join("")}</section>`;
  E.app.querySelectorAll("[data-i]").forEach(button=>button.onclick=()=>nav("item/"+encodeURIComponent(button.dataset.i)));
}
function pricePanel(p){
  if(p.manual)return `<p class="selection-requirement">Manual evaluation is required for a project, structurally questionable, or mechanically unknown package.</p>`;
  if(!Number.isFinite(p.low)||!Number.isFinite(p.high))return"";
  return `<div class="price-panel"><div class="price-box"><small>Low</small><strong>${fp(p.low)}</strong></div><div class="price-box"><small>High</small><strong>${fp(p.high)}</strong></div></div>`;
}
function weightPanel(i,c,compact=false){
  const w=W.itemWeight(i,c);
  if(!w.display&&i.categoryId!=="boats")return"";
  const rows=w.components.filter(component=>!Number.isFinite(component.high)||component.high>0).map(component=>`<div class="weight-component"><span>${esc(component.label)}</span><strong>${W.formatRange(component)}</strong><small>${esc(component.basis)} · ${esc(component.confidence)}</small></div>`).join("");
  const missing=w.complete?"":`<p class="weight-warning">Weight total incomplete: ${esc(w.missing.join(", "))}.</p>`;
  return `<section class="weight-panel${compact?" compact":""}"><header><span>${compact?"Selected weight":"Item weight"}</span><strong>${W.formatRange(w)}</strong></header>${missing}${compact?"":rows}</section>`;
}
function detail(r){
  const i=B.get(r.id);
  if(!i)return cats();
  const c=work(i.id),p=price(i,c),miss=missing(i,c),ok=selectable(i,c);
  const requirement=miss.length?`<p class="selection-requirement">Choose ${miss.join(" and ")} before adding.</p>`:p.manual?`<p class="selection-requirement">Project or unknown-condition boats require manual evaluation before adding.</p>`:"";
  E.app.innerHTML=`<article class="detail-card"><div class="detail-body"><h1>${esc(i.displayName)}</h1>${controls(i,c,"d")}${panel(i,c)}<div class="detail-select"><label><input id="pick" type="checkbox" ${S.has(i.id)?"checked":""} ${!S.has(i.id)&&!ok?"disabled":""}> Add to estimate</label><strong>${fr(p)}</strong></div>${requirement}${pricePanel(p)}${weightPanel(i,c)}<p class="data-note">${esc(p.basis||i.priceBasis||"")}</p><dl class="definition-list">${(i.details||[]).map(d=>`<div class="definition-row"><dt>${esc(d.label)}</dt><dd>${esc(d.value)}</dd></div>`).join("")}</dl></div></article>`;
  document.querySelector("#pick").onchange=e=>{e.target.checked?S.set(i.id,c):S.delete(i.id);save();detail(r);};
  bind(i,()=>detail(r));
}
function estimate(){
  const selected=[...S].map(([id,c])=>({i:B.get(id),c,p:price(B.get(id),c)})).filter(x=>x.i);
  const low=selected.reduce((sum,x)=>sum+(x.p.low||0),0),high=selected.reduce((sum,x)=>sum+(x.p.high||0),0);
  const packageWeight=W.packageWeight(selected,G);
  const margin=packageWeight.complete?(packageWeight.marginLow>=0?W.format(packageWeight.marginLow)+" minimum":W.format(Math.abs(packageWeight.marginLow))+" over"):"Unavailable";
  const warning=packageWeight.complete?"":`<p class="weight-warning package-warning">Known subtotal shown. Missing: ${esc(packageWeight.missing.join("; "))}</p>`;
  E.app.innerHTML=heading("Current estimate","Price and ready-to-tow package weight")+`<section class="estimate-summary weight-status-${packageWeight.status}"><div><small>Package low</small><strong>${fp(low)}</strong></div><div><small>Package high</small><strong>${fp(high)}</strong></div><div><small>Tow weight</small><strong>${W.formatRange(packageWeight)}</strong></div><div><small>Margin to 4,000 lb</small><strong>${margin}</strong></div><p class="summary-status">${esc(packageWeight.label)}</p></section>${warning}<section class="gear-control"><label class="config-field"><span>Loose gear allowance</span><input id="gear-allowance" type="number" min="0" max="2000" step="10" value="${G}"><small>Anchors, safety gear, rods, tackle, dock lines and loose equipment. Editable; passengers in the tow vehicle are not included.</small></label></section><section class="card-list">${selected.map(x=>{const iw=W.itemWeight(x.i,x.c);return `<article class="estimate-line"><input type="checkbox" data-r="${esc(x.i.id)}" checked><div><h2>${esc(x.i.displayName)}</h2>${controls(x.i,cfg(x.c),"e")}<div class="line-prices"><span>Value: ${fr(x.p)}</span><span>Weight: ${W.formatRange(iw)}</span></div>${!iw.complete?`<p class="weight-warning">Missing ${esc(iw.missing.join(", "))}</p>`:""}</div></article>`;}).join("")}</section>`;
  E.app.querySelectorAll("[data-r]").forEach(button=>button.onchange=()=>{S.delete(button.dataset.r);save();estimate();});
  const gear=document.querySelector("#gear-allowance");
  if(gear)gear.onchange=e=>{G=Math.max(0,Number(e.target.value)||0);saveGear();head();estimate();};
  for(const x of selected)bind(x.i,estimate);
}
function head(){
  let low=0,high=0,pending=0;
  const selected=[];
  for(const[id,c]of S){
    const item=B.get(id),p=price(item,c);
    if(Number.isFinite(p.low)&&Number.isFinite(p.high)){low+=p.low;high+=p.high;}else pending++;
    if(item)selected.push({i:item,c});
  }
  const weight=W.packageWeight(selected,G);
  const priceText=pending?"Review price":fp(low)+"–"+fp(high);
  const weightText=weight.complete?W.format(weight.high)+" max":"weight incomplete";
  E.range.textContent=S.size?priceText+" · "+weightText:"$0";
}
function top(){
  window.scrollTo(0,0);
  requestAnimationFrame(()=>window.scrollTo(0,0));
}
function render(){
  const r=route();
  E.back.hidden=r.v==="cats";
  ({cats,subs,makers,list,detail,estimate}[r.v]||cats)(r);
  E.app.hidden=false;
  top();
}
function init(){
  if(!W)throw Error("Weight model missing");
  C=window.BOATBUILDER_DATA;
  if(!C?.items?.length)throw Error("Catalog missing");
  B=new Map(C.items.map(i=>[i.id,i]));
  S=new Map([...S].filter(([id,c])=>B.has(id)&&selectable(B.get(id),c)));
  save();
  E.loading.hidden=true;
  render();
}

if("scrollRestoration"in history)history.scrollRestoration="manual";
E.back.onclick=()=>{const r=H.pop();r?history.back():nav("");};
E.home.onclick=()=>nav("");
E.clear.onclick=()=>{S.clear();save();render();};
E.estimate.onclick=()=>nav("estimate");
onhashchange=render;
try{init();}catch(e){console.error(e);E.loading.innerHTML="<strong>The catalog could not be loaded.</strong>";}
})();
