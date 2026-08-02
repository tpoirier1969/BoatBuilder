import fs from "node:fs";

const read=path=>fs.readFileSync(path,"utf8");
const write=(path,value)=>fs.writeFileSync(path,value);
const mustReplace=(source,from,to,label)=>{
  if(!source.includes(from))throw new Error(`Refinement anchor missing: ${label}`);
  return source.replace(from,to);
};

let model=read("weight-model.js");
model=mustReplace(model,
'const range=(low,high,basis,confidence="estimated",required=false)=>({low:round5(low),high:round5(high),basis,confidence,required});',
'const range=(low,high,basis,confidence="estimated",required=false)=>({low:Number(low),high:Number(high),basis,confidence,required});',
"exact range preservation");
model=mustReplace(model,
'return unavailable("Fuel capacity is unpublished. Enter carried gallons or choose empty fuel.",false);',
'return unavailable("Fuel capacity is unpublished. Enter carried gallons or choose empty fuel.",true);',
"missing fuel completeness");
write("weight-model.js",model);

let app=read("app.js");
if(!app.includes("PACKAGE_WEIGHT_UI_V2")){
  app=app.replace("const PACKAGE_WEIGHT_UI_V1=true;","const PACKAGE_WEIGHT_UI_V1=true;\nconst PACKAGE_WEIGHT_UI_V2=true;");
  app=app.replace(/  const bindValue=\(selector,key,transform=value=>value\)=>E\.app\.querySelectorAll\(selector\)\.forEach\(control=>control\.onchange=e=>\{[\s\S]*?\n  \}\);\n/,"");
  const oldList=/function list\(r\)\{[\s\S]*?\n\}\nfunction pricePanel/;
  if(!oldList.test(app))throw new Error("Refinement anchor missing: list view");
  app=app.replace(oldList,`function list(r){
  const records=items(r.c,r.s).filter(i=>i.manufacturer===r.m).sort((a,b)=>a.model.localeCompare(b.model));
  E.app.innerHTML=heading(r.m)+(r.c==="boats"?\`<aside class="manufacturer-note"><strong>Generation audit:</strong> Every model identifies its specification basis. Broad spans remain flagged until redesign boundaries are verified.</aside>\`:"")+\`<section class="card-list">\${records.map(i=>{
    const c=work(i.id),p=price(i,c),w=W.itemWeight(i,c);
    const priceHtml=Number.isFinite(p.low)&&Number.isFinite(p.high)?\`<span class="price">\${fr(p)}</span>\`:"";
    const weightHtml=w.display?\`<span class="weight-brief\${w.complete?"":" incomplete"}">\${w.complete?W.formatRange(w):i.categoryId==="boats"&&choices(i).length>1&&!selectedChoice(i,c)?"Choose year for weight":"Weight incomplete"}</span>\`:"";
    return \`<article class="item-card"><button class="item-open" data-i="\${esc(i.id)}"><strong>\${esc(i.model)}</strong><span>\${esc(i.subtitle||"")}\${risk(i)?" · generation audit pending":""}</span></button><div class="item-metrics">\${priceHtml}\${weightHtml}</div></article>\`;
  }).join("")}</section>\`;
  E.app.querySelectorAll("[data-i]").forEach(button=>button.onclick=()=>nav("item/"+encodeURIComponent(button.dataset.i)));
}
function pricePanel`);
}
write("app.js",app);

let css=read("styles.css");
if(!css.includes("PACKAGE_WEIGHT_UI_V2"))css+=`

/* PACKAGE_WEIGHT_UI_V2 */
.item-metrics {
  display: grid;
  justify-items: end;
  gap: .25rem;
  min-width: 6.2rem;
}
.weight-brief {
  color: var(--muted);
  font-size: .78rem;
  font-weight: 750;
  text-align: right;
  white-space: nowrap;
}
.weight-brief.incomplete { color: var(--danger); }
@media (max-width: 24rem) {
  .item-card { grid-template-columns: minmax(0,1fr); }
  .item-metrics { justify-items: start; }
  .weight-brief { text-align: left; }
}
`;
write("styles.css",css);

let test=read("tests/package-weight-qa.mjs");
test=mustReplace(test,'assert.deepEqual([overridden.low,overridden.high],[1235,1235],`${generation.id} user override failed`);','assert.deepEqual([overridden.low,overridden.high],[1234,1234],`${generation.id} user override failed`);',"exact override test");
write("tests/package-weight-qa.mjs",test);

let html=read("index.html");
html=html.replace("weight-model.js?v=1","weight-model.js?v=2").replace("app.js?v=14","app.js?v=15").replace("styles.css?v=10","styles.css?v=11");
write("index.html",html);
console.log("Refined package-weight model and list UI");
