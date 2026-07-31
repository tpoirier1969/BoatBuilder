(()=>{
"use strict";

const K="boatbuilder.currentEstimate.v6";
const OLD=["boatbuilder.currentEstimate.v5","boatbuilder.currentEstimate.v4","boatbuilder.currentEstimate.v3","boatbuilder.currentEstimate.v2","boatbuilder.currentEstimate.v1"];
const MC=new Set(["main-motors","kickers"]);
const SC=new Set(["electronics","electrical"]);
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
let C,B,S=load(),P=new Map,H=[];

const cl=v=>v==null?"":String(v).trim();
const esc=v=>cl(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const dm=i=>new Map((i.details||[]).map(d=>[d.label,d.value]));
const cfg=v=>({
  generationId:cl(v?.generationId)||null,
  era:cl(v?.era)||null,
  condition:CONDITIONS.some(x=>x.id===v?.condition)?v.condition:"good",
  hp:Number(v?.hp)>0?Number(v.hp):null,
  trailer:cl(v?.trailer)||"standard"
});

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
  return html?`<div class="configuration-controls">${html}</div>`:"";
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
  E.app.querySelectorAll("[data-condition]").forEach(select=>select.onchange=e=>{
    if(select.dataset.condition===i.id){setc(i.id,{condition:e.target.value});rerender();}
  });
  E.app.querySelectorAll("[data-t]").forEach(select=>select.onchange=e=>{
    if(select.dataset.t===i.id){setc(i.id,{trailer:e.target.value});rerender();}
  });
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
    const p=price(i,work(i.id));
    const priceHtml=Number.isFinite(p.low)&&Number.isFinite(p.high)?`<span class="price">${fr(p)}</span>`:"";
    return `<article class="item-card"><button class="item-open" data-i="${esc(i.id)}"><strong>${esc(i.model)}</strong><span>${esc(i.subtitle||"")}${risk(i)?" · generation audit pending":""}</span></button>${priceHtml}</article>`;
  }).join("")}</section>`;
  E.app.querySelectorAll("[data-i]").forEach(button=>button.onclick=()=>nav("item/"+encodeURIComponent(button.dataset.i)));
}
function pricePanel(p){
  if(p.manual)return `<p class="selection-requirement">Manual evaluation is required for a project, structurally questionable, or mechanically unknown package.</p>`;
  if(!Number.isFinite(p.low)||!Number.isFinite(p.high))return"";
  return `<div class="price-panel"><div class="price-box"><small>Low</small><strong>${fp(p.low)}</strong></div><div class="price-box"><small>High</small><strong>${fp(p.high)}</strong></div></div>`;
}
function detail(r){
  const i=B.get(r.id);
  if(!i)return cats();
  const c=work(i.id),p=price(i,c),miss=missing(i,c),ok=selectable(i,c);
  const requirement=miss.length?`<p class="selection-requirement">Choose ${miss.join(" and ")} before adding.</p>`:p.manual?`<p class="selection-requirement">Project or unknown-condition boats require manual evaluation before adding.</p>`:"";
  E.app.innerHTML=`<article class="detail-card"><div class="detail-body"><h1>${esc(i.displayName)}</h1>${controls(i,c,"d")}${panel(i,c)}<div class="detail-select"><label><input id="pick" type="checkbox" ${S.has(i.id)?"checked":""} ${!S.has(i.id)&&!ok?"disabled":""}> Add to estimate</label><strong>${fr(p)}</strong></div>${requirement}${pricePanel(p)}<p class="data-note">${esc(p.basis||i.priceBasis||"")}</p><dl class="definition-list">${(i.details||[]).map(d=>`<div class="definition-row"><dt>${esc(d.label)}</dt><dd>${esc(d.value)}</dd></div>`).join("")}</dl></div></article>`;
  document.querySelector("#pick").onchange=e=>{e.target.checked?S.set(i.id,c):S.delete(i.id);save();detail(r);};
  bind(i,()=>detail(r));
}
function estimate(){
  const selected=[...S].map(([id,c])=>({i:B.get(id),c,p:price(B.get(id),c)})).filter(x=>x.i);
  const low=selected.reduce((sum,x)=>sum+(x.p.low||0),0),high=selected.reduce((sum,x)=>sum+(x.p.high||0),0);
  E.app.innerHTML=heading("Current estimate")+`<section class="estimate-summary"><div><small>Package low</small><strong>${fp(low)}</strong></div><div><small>Package high</small><strong>${fp(high)}</strong></div></section><section class="card-list">${selected.map(x=>`<article class="estimate-line"><input type="checkbox" data-r="${esc(x.i.id)}" checked><div><h2>${esc(x.i.displayName)}</h2>${controls(x.i,cfg(x.c),"e")}<strong>${fr(x.p)}</strong></div></article>`).join("")}</section>`;
  E.app.querySelectorAll("[data-r]").forEach(button=>button.onchange=()=>{S.delete(button.dataset.r);save();estimate();});
  for(const x of selected)bind(x.i,estimate);
}
function head(){
  let low=0,high=0,pending=0;
  for(const[id,c]of S){
    const p=price(B.get(id),c);
    if(Number.isFinite(p.low)&&Number.isFinite(p.high)){low+=p.low;high+=p.high;}else pending++;
  }
  E.range.textContent=S.size?(pending?"Review selection":fp(low)+"–"+fp(high)):"$0";
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
