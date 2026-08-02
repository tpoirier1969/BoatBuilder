import fs from "node:fs";

const read=path=>fs.readFileSync(path,"utf8");
const write=(path,value)=>fs.writeFileSync(path,value);
const replace=(source,pattern,replacement,label)=>{
  if(!pattern.test(source))throw new Error(`Package-weight migration anchor missing: ${label}`);
  return source.replace(pattern,replacement);
};

let app=read("app.js");
if(!app.includes("PACKAGE_WEIGHT_UI_V1")){
  app=replace(app,/const K="boatbuilder\.currentEstimate\.v6";\nconst OLD=\["boatbuilder\.currentEstimate\.v5","boatbuilder\.currentEstimate\.v4","boatbuilder\.currentEstimate\.v3","boatbuilder\.currentEstimate\.v2","boatbuilder\.currentEstimate\.v1"\];/,
`const PACKAGE_WEIGHT_UI_V1=true;
const K="boatbuilder.currentEstimate.v7";
const OLD=["boatbuilder.currentEstimate.v6","boatbuilder.currentEstimate.v5","boatbuilder.currentEstimate.v4","boatbuilder.currentEstimate.v3","boatbuilder.currentEstimate.v2","boatbuilder.currentEstimate.v1"];
const GEAR_KEY="boatbuilder.gearAllowance.v1";`,"storage version");

  app=replace(app,/const SC=new Set\(\["electronics","electrical"\]\);/,
`const SC=new Set(["electronics","electrical"]);
const WC=new Set(["boats","main-motors","kickers","bow-trolling-motors","downriggers","electrical","canvas"]);`,"weight categories");

  app=replace(app,/const M=new Intl\.NumberFormat\("en-US",\{style:"currency",currency:"USD",maximumFractionDigits:0\}\);\nlet C,B,S=load\(\),P=new Map,H=\[\];/,
`const M=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
const W=window.BOATBUILDER_WEIGHT_MODEL;
let C,B,S=load(),P=new Map,H=[],G=loadGear();`,"weight model binding");

  app=replace(app,/const cfg=v=>\(\{[\s\S]*?trailer:cl\(v\?\.trailer\)\|\|"standard"\n\}\);/,
`const cfg=v=>({
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
});`,"configuration schema");

  app=replace(app,/function load\(\)\{/,`function loadGear(){
  const value=Number(localStorage.getItem(GEAR_KEY));
  return Number.isFinite(value)&&value>=0?value:150;
}
function saveGear(){localStorage.setItem(GEAR_KEY,String(G));}
function load(){`,"gear storage");

  const controlBlock=`function weightControls(i,c0,prefix){
  const c=cfg(c0),preview=W.itemWeight(i,c);
  if(!WC.has(i.categoryId)&&!preview.display)return"";
  let html="";
  if(MC.has(i.categoryId)){
    const hp=W.horsepowerOptions(i);
    html+=\`<label class="config-field"><span>Horsepower for weight</span><input type="number" min="1" max="350" step="0.1" data-hp="\${esc(i.id)}" value="\${c.hp||""}" placeholder="\${hp.length>1?hp[0]+"–"+hp.at(-1):hp[0]||"Enter hp"}"><small>Choose the actual horsepower to narrow the motor-weight range.</small></label>\`;
    if(i.categoryId==="main-motors")html+=\`<label class="config-field"><span>Starting battery</span><select data-starting-battery="\${esc(i.id)}"><option value="included"\${c.startingBattery==="included"?" selected":""}>Include typical starting battery</option><option value="none"\${c.startingBattery==="none"?" selected":""}>Battery counted separately</option></select></label>\`;
  }
  if(i.categoryId==="bow-trolling-motors"){
    const volts=W.voltageOptions(i);
    if(volts.length>1)html+=\`<label class="config-field"><span>Motor voltage</span><select data-voltage="\${esc(i.id)}"><option value="">Choose voltage</option>\${volts.map(v=>\`<option value="\${v}"\${c.voltage===v?" selected":""}>\${v}V</option>\`).join("")}</select></label>\`;
    html+=\`<label class="config-field"><span>Trolling battery bank</span><select data-battery="\${esc(i.id)}">\${Object.entries(W.BATTERIES).map(([id,value])=>\`<option value="\${id}"\${c.batterySetup===id?" selected":""}>\${esc(value.label)}</option>\`).join("")}</select><small>Choose “counted separately” when a battery-bank item is also in the estimate.</small></label>\`;
  }
  if(i.categoryId==="downriggers")html+=\`<label class="config-field"><span>Installed quantity</span><select data-quantity="\${esc(i.id)}">\${[1,2,3,4].map(n=>\`<option value="\${n}"\${c.quantity===n?" selected":""}>\${n}</option>\`).join("")}</select></label>\`;
  if(i.categoryId==="boats"){
    html+=\`<label class="config-field"><span>Fuel carried</span><select data-fuel-percent="\${esc(i.id)}">\${[0,25,50,75,100].map(n=>\`<option value="\${n}"\${c.fuelPercent===n?" selected":""}>\${n===0?"Empty":n+"% of capacity"}</option>\`).join("")}</select></label>\`;
    html+=\`<label class="config-field"><span>Fuel capacity override, gallons</span><input type="number" min="0" max="150" step="0.5" data-fuel-gallons="\${esc(i.id)}" value="\${c.fuelGallons||""}" placeholder="Use published capacity"><small>Use only when the selected hull's tank differs from the catalog.</small></label>\`;
    html+=\`<label class="config-field"><span>Actual trailer weight, optional</span><input type="number" min="0" max="5000" step="5" data-trailer-weight="\${esc(i.id)}" value="\${c.trailerWeightOverride||""}" placeholder="Use trailer estimate"><small>Enter a scale, title or manufacturer figure to replace the trailer estimate.</small></label>\`;
  }
  const label=i.categoryId==="boats"?"Documented or measured dry-hull weight, optional":"Actual installed weight, optional";
  html+=\`<label class="config-field"><span>\${label}</span><input type="number" min="0" max="10000" step="1" data-weight="\${esc(i.id)}" value="\${c.weightOverride||""}" placeholder="Use catalog weight"><small>Overrides only this item. Published hull data remains the default.</small></label>\`;
  return \`<div class="weight-controls"><h3>Weight setup</h3>\${html}</div>\`;
}
function controls(i,c0,prefix){
  const c=cfg(c0),list=choices(i),chosen=selectedChoice(i,c);
  let html="";
  if(list.length>1){
    html+=\`<label class="config-field"><span>Year / hull</span><select data-choice="\${esc(i.id)}" id="\${prefix}-choice"><option value="">Choose year / hull</option>\${list.map(x=>\`<option value="\${esc(x.key)}"\${chosen?.key===x.key?" selected":""}>\${esc(x.label)}</option>\`).join("")}</select><small>Each option stays inside one documented hull design.</small></label>\`;
  }
  if(i.categoryId==="boats"&&hasNumericPricing(i)){
    const condition=CONDITIONS.find(x=>x.id===c.condition)||CONDITIONS[1];
    html+=\`<label class="config-field"><span>Package condition</span><select data-condition="\${esc(i.id)}">\${CONDITIONS.map(x=>\`<option value="\${x.id}"\${x.id===c.condition?" selected":""}>\${esc(x.label)}</option>\`).join("")}</select><small>\${esc(condition.description)}</small></label>\`;
  }
  if(i.categoryId==="boats"){
    html+=\`<label class="config-field"><span>Trailer included</span><select data-t="\${esc(i.id)}">\${TR.map(x=>\`<option value="\${x.id}"\${x.id===c.trailer?" selected":""}>\${esc(x.label)}</option>\`).join("")}</select></label>\`;
  }
  const pricing=html?\`<div class="configuration-controls">\${html}</div>\`:"";
  return pricing+weightControls(i,c,prefix);
}
function panel`;
  app=replace(app,/function controls\(i,c0,prefix\)\{[\s\S]*?\n\}\nfunction panel/,controlBlock,"configuration controls");

  app=replace(app,/function bind\(i,rerender\)\{[\s\S]*?\n\}\nconst heading/,
`function bind(i,rerender){
  E.app.querySelectorAll("[data-choice]").forEach(select=>select.onchange=e=>{
    if(select.dataset.choice===i.id){
      const selected=e.target.value?parseChoiceKey(e.target.value):{generationId:null,era:null};
      setc(i.id,selected);
      rerender();
    }
  });
  const bindValue=(selector,key,transform=value=>value)=>E.app.querySelectorAll(selector).forEach(control=>control.onchange=e=>{
    const id=control.dataset[selector.slice(6,-1).replaceAll("-","")];
    if(id===i.id){setc(i.id,{[key]:transform(e.target.value)});rerender();}
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
const heading`,"control binding");

  app=replace(app,/function pricePanel\(p\)\{[\s\S]*?\n\}\nfunction detail/,
`function pricePanel(p){
  if(p.manual)return \`<p class="selection-requirement">Manual evaluation is required for a project, structurally questionable, or mechanically unknown package.</p>\`;
  if(!Number.isFinite(p.low)||!Number.isFinite(p.high))return"";
  return \`<div class="price-panel"><div class="price-box"><small>Low</small><strong>\${fp(p.low)}</strong></div><div class="price-box"><small>High</small><strong>\${fp(p.high)}</strong></div></div>\`;
}
function weightPanel(i,c,compact=false){
  const w=W.itemWeight(i,c);
  if(!w.display&&i.categoryId!=="boats")return"";
  const rows=w.components.filter(component=>!Number.isFinite(component.high)||component.high>0).map(component=>\`<div class="weight-component"><span>\${esc(component.label)}</span><strong>\${W.formatRange(component)}</strong><small>\${esc(component.basis)} · \${esc(component.confidence)}</small></div>\`).join("");
  const missing=w.complete?"":\`<p class="weight-warning">Weight total incomplete: \${esc(w.missing.join(", "))}.</p>\`;
  return \`<section class="weight-panel\${compact?" compact":""}"><header><span>\${compact?"Selected weight":"Item weight"}</span><strong>\${W.formatRange(w)}</strong></header>\${missing}\${compact?"":rows}</section>\`;
}
function detail`,"weight panel");

  app=replace(app,/function detail\(r\)\{[\s\S]*?\n\}\nfunction estimate/,
`function detail(r){
  const i=B.get(r.id);
  if(!i)return cats();
  const c=work(i.id),p=price(i,c),miss=missing(i,c),ok=selectable(i,c);
  const requirement=miss.length?\`<p class="selection-requirement">Choose \${miss.join(" and ")} before adding.</p>\`:p.manual?\`<p class="selection-requirement">Project or unknown-condition boats require manual evaluation before adding.</p>\`:"";
  E.app.innerHTML=\`<article class="detail-card"><div class="detail-body"><h1>\${esc(i.displayName)}</h1>\${controls(i,c,"d")}\${panel(i,c)}<div class="detail-select"><label><input id="pick" type="checkbox" \${S.has(i.id)?"checked":""} \${!S.has(i.id)&&!ok?"disabled":""}> Add to estimate</label><strong>\${fr(p)}</strong></div>\${requirement}\${pricePanel(p)}\${weightPanel(i,c)}<p class="data-note">\${esc(p.basis||i.priceBasis||"")}</p><dl class="definition-list">\${(i.details||[]).map(d=>\`<div class="definition-row"><dt>\${esc(d.label)}</dt><dd>\${esc(d.value)}</dd></div>\`).join("")}</dl></div></article>\`;
  document.querySelector("#pick").onchange=e=>{e.target.checked?S.set(i.id,c):S.delete(i.id);save();detail(r);};
  bind(i,()=>detail(r));
}
function estimate`,"detail view");

  app=replace(app,/function estimate\(\)\{[\s\S]*?\n\}\nfunction head/,
`function estimate(){
  const selected=[...S].map(([id,c])=>({i:B.get(id),c,p:price(B.get(id),c)})).filter(x=>x.i);
  const low=selected.reduce((sum,x)=>sum+(x.p.low||0),0),high=selected.reduce((sum,x)=>sum+(x.p.high||0),0);
  const packageWeight=W.packageWeight(selected,G);
  const margin=packageWeight.complete?(packageWeight.marginLow>=0?W.format(packageWeight.marginLow)+" minimum":W.format(Math.abs(packageWeight.marginLow))+" over"):"Unavailable";
  const warning=packageWeight.complete?"":\`<p class="weight-warning package-warning">Known subtotal shown. Missing: \${esc(packageWeight.missing.join("; "))}</p>\`;
  E.app.innerHTML=heading("Current estimate","Price and ready-to-tow package weight")+\`<section class="estimate-summary weight-status-\${packageWeight.status}"><div><small>Package low</small><strong>\${fp(low)}</strong></div><div><small>Package high</small><strong>\${fp(high)}</strong></div><div><small>Tow weight</small><strong>\${W.formatRange(packageWeight)}</strong></div><div><small>Margin to 4,000 lb</small><strong>\${margin}</strong></div><p class="summary-status">\${esc(packageWeight.label)}</p></section>\${warning}<section class="gear-control"><label class="config-field"><span>Loose gear allowance</span><input id="gear-allowance" type="number" min="0" max="2000" step="10" value="\${G}"><small>Anchors, safety gear, rods, tackle, dock lines and loose equipment. Editable; passengers in the tow vehicle are not included.</small></label></section><section class="card-list">\${selected.map(x=>{const iw=W.itemWeight(x.i,x.c);return \`<article class="estimate-line"><input type="checkbox" data-r="\${esc(x.i.id)}" checked><div><h2>\${esc(x.i.displayName)}</h2>\${controls(x.i,cfg(x.c),"e")}<div class="line-prices"><span>Value: \${fr(x.p)}</span><span>Weight: \${W.formatRange(iw)}</span></div>\${!iw.complete?\`<p class="weight-warning">Missing \${esc(iw.missing.join(", "))}</p>\`:""}</div></article>\`;}).join("")}</section>\`;
  E.app.querySelectorAll("[data-r]").forEach(button=>button.onchange=()=>{S.delete(button.dataset.r);save();estimate();});
  const gear=document.querySelector("#gear-allowance");
  if(gear)gear.onchange=e=>{G=Math.max(0,Number(e.target.value)||0);saveGear();head();estimate();};
  for(const x of selected)bind(x.i,estimate);
}
function head`,"estimate view");

  app=replace(app,/function head\(\)\{[\s\S]*?\n\}\nfunction top/,
`function head(){
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
function top`,"header summary");

  app=replace(app,/function init\(\)\{\n  C=window\.BOATBUILDER_DATA;/,
`function init(){
  if(!W)throw Error("Weight model missing");
  C=window.BOATBUILDER_DATA;`,"init guard");
}
write("app.js",app);

let html=read("index.html");
if(!html.includes("weight-model.js"))html=html.replace('<script src="app.js?v=13" defer></script>','<script src="weight-model.js?v=1" defer></script>\n  <script src="app.js?v=14" defer></script>');
html=html.replace('styles.css?v=9','styles.css?v=10');
write("index.html",html);

let css=read("styles.css");
if(!css.includes("PACKAGE_WEIGHT_UI_V1"))css+=`

/* PACKAGE_WEIGHT_UI_V1 */
.config-field input {
  width: 100%;
  min-height: 2.7rem;
  padding: .5rem;
  border: 1px solid var(--line);
  border-radius: .55rem;
  background: white;
}
.weight-controls,
.gear-control {
  display: grid;
  gap: .75rem;
  margin: 1rem 0;
  padding: .85rem;
  background: #f7fafb;
  border: 1px solid var(--line);
  border-radius: .8rem;
}
.weight-controls h3 { margin: 0; font-size: .95rem; }
.weight-panel {
  margin: 1rem 0;
  padding: .85rem;
  background: #f8fafb;
  border: 1px solid var(--line);
  border-radius: .8rem;
}
.weight-panel header {
  display: flex;
  justify-content: space-between;
  gap: .75rem;
  align-items: baseline;
}
.weight-panel header span { color: var(--muted); font-weight: 700; }
.weight-panel header strong { font-size: 1.15rem; }
.weight-component {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap: .15rem .75rem;
  padding: .65rem 0;
  border-top: 1px solid var(--line);
}
.weight-component:first-of-type { margin-top: .65rem; }
.weight-component small {
  grid-column: 1 / -1;
  color: var(--muted);
  line-height: 1.35;
}
.weight-warning {
  margin: .6rem 0 0;
  color: var(--danger);
  font-size: .82rem;
  font-weight: 700;
  line-height: 1.4;
}
.package-warning { margin: 0 0 .8rem; padding: .8rem; background: white; border: 1px solid var(--danger); border-radius: .75rem; }
.estimate-summary { grid-template-columns: repeat(2,minmax(0,1fr)); }
.estimate-summary .summary-status {
  grid-column: 1 / -1;
  margin: 0;
  padding-top: .55rem;
  border-top: 1px solid rgba(255,255,255,.25);
  font-weight: 800;
}
.weight-status-over,
.weight-status-incomplete { background: #6f2d2d; }
.weight-status-near { background: #6a4920; }
.weight-status-caution { background: #3f5962; }
@media (min-width: 48rem) {
  .estimate-summary { grid-template-columns: repeat(4,minmax(0,1fr)); }
}
`;
write("styles.css",css);

console.log("Applied package-weight UI migration");
