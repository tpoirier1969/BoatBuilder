(function(root){
"use strict";
const PUBLISHED_WEIGHT_ERAS_V1=true;

const TOW_LIMIT_LB=4000;
const DISPLAY_THRESHOLD_LB=30;
const FUEL_LB_PER_GAL=6.2;
const BATTERIES={
  flooded:{label:"Typical flooded lead-acid bank",low:55,high:70},
  agm:{label:"Typical AGM bank",low:60,high:75},
  lithium:{label:"Typical LiFePO4 bank",low:25,high:40},
  none:{label:"Batteries counted separately",low:0,high:0}
};
const TRAILERS={
  standard:"Standard steel single axle",
  "premium-single":"Premium steel single axle",
  "galvanized-single":"Galvanized single axle",
  "aluminum-single":"Aluminum single axle",
  tandem:"Steel tandem axle",
  "tandem-premium":"Premium / aluminum tandem"
};

const clean=value=>value==null?"":String(value).trim();
const number=value=>Number.isFinite(Number(value))?Number(value):null;
const round5=value=>Math.max(0,Math.round(value/5)*5);
const detailMap=item=>new Map((item?.details||[]).map(detail=>[detail.label,detail.value]));
const specText=value=>clean(value&&typeof value==="object"&&"value"in value?value.value:value);
const range=(low,high,basis,confidence="estimated",required=false)=>({low:Number(low),high:Number(high),basis,confidence,required});
const unavailable=(basis,required=true)=>({low:null,high:null,basis,confidence:"unavailable",required});

function numericRange(values){
  const valid=values.filter(Number.isFinite);
  return valid.length?{low:Math.min(...valid),high:Math.max(...valid)}:null;
}
function valuesWithUnits(text,units){
  const source=clean(text).replaceAll(",","");
  const found=[];
  const regex=new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${units.join("|")})\\b`,"gi");
  let match;
  while((match=regex.exec(source)))found.push(Number(match[1]));
  return [...new Set(found.filter(Number.isFinite))];
}
function weightRangeFromText(text){return numericRange(valuesWithUnits(text,["lb","lbs","pound","pounds"]));}
function gallonRangeFromText(text){return numericRange(valuesWithUnits(text,["gal","gals","gallon","gallons"]));}
function parseLengthFeet(text){
  const source=clean(text).toLowerCase().replace(/[–—]/g,"-");
  let match=source.match(/(\d{1,2}(?:\.\d+)?)\s*(?:ft|feet|')\s*(?:(\d{1,2})\s*(?:in|inches|")?)?/);
  if(match)return Number(match[1])+Number(match[2]||0)/12;
  match=source.match(/\b(1[4-9]|2[0-4])(?:\.(\d+))?\s*(?:foot|footer|ft)\b/);
  return match?Number(`${match[1]}${match[2]?`.${match[2]}`:""}`):null;
}
function selectedGeneration(item,config={}){
  const generations=Array.isArray(item?.designGenerations)?item.designGenerations:[];
  if(!generations.length)return null;
  return generations.find(generation=>generation.id===config.generationId)||(generations.length===1?generations[0]:null);
}
function specs(item,config={}){
  const catalog=Object.fromEntries((item?.details||[]).map(detail=>[detail.label,{value:detail.value}]));
  const generation=selectedGeneration(item,config);
  return {generation,values:generation?(generation.catalogSpecs?catalog:(generation.specs||{})):catalog};
}
function spec(item,config,label){return specText(specs(item,config).values?.[label]);}
function horsepowerOptions(item){
  const text=[item?.model,detailMap(item).get("Specs / Role"),detailMap(item).get("Horsepower / Family")].map(clean).join(" ");
  const values=[];
  for(const match of text.matchAll(/(\d{1,3}(?:\.\d+)?)\s*(?:hp|horsepower)\b/gi))values.push(Number(match[1]));
  if(!values.length){
    const model=clean(item?.model).replace(/[–—]/g,"-");
    for(const match of model.matchAll(/\b(\d{1,3}(?:\.\d+)?)\b/g)){
      const value=Number(match[1]);
      if(value>=4&&value<=300)values.push(value);
    }
  }
  return [...new Set(values.filter(value=>value>=4&&value<=300))].sort((a,b)=>a-b);
}
function voltageOptions(item){
  const text=[item?.model,detailMap(item).get("Specs / Role")].map(clean).join(" ");
  return [...new Set([...text.matchAll(/\b(12|24|36)V\b/gi)].map(match=>Number(match[1])))].sort((a,b)=>a-b);
}
function selectedWeightEra(generation,config={}){
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
    if(selected)return range(selected.lowLb,selected.highLb,selected.basis||`Published dry-hull weight for ${selected.label}`,selected.lowLb===selected.highLb?"published":"published-range",true);
    const low=Math.min(...weightEras.map(era=>Number(era.lowLb)).filter(Number.isFinite));
    const high=Math.max(...weightEras.map(era=>Number(era.highLb??era.lowLb)).filter(Number.isFinite));
    if(Number.isFinite(low)&&Number.isFinite(high))return range(low,high,"Published hull-weight span across documented year-specific variants. Choose a narrower year option when available.",low===high?"published":"published-range",true);
  }
  const raw=spec(item,config,"Dry Hull Weight");
  const parsed=weightRangeFromText(raw);
  if(parsed){
    const conflict=parsed.low!==parsed.high;
    return range(parsed.low,parsed.high,conflict?`Published hull-weight range/conflict: ${raw}`:`Published dry-hull weight: ${raw}`,conflict?"published-range":"published",true);
  }
  return unavailable("Published dry-hull weight is not available for the selected hull generation. Enter a documented or measured weight to complete the package total.",true);
}
function fuelWeight(item,config={}){
  const percent=[0,25,50,75,100].includes(Number(config.fuelPercent))?Number(config.fuelPercent):100;
  if(percent===0)return range(0,0,"Fuel set to empty","user");
  const gallonsOverride=number(config.fuelGallons);
  let gallons=gallonsOverride>0?{low:gallonsOverride,high:gallonsOverride}:gallonRangeFromText(spec(item,config,"Fuel Capacity"));
  if(!gallons)return unavailable("Fuel capacity is unpublished. Enter carried gallons or choose empty fuel.",true);
  return range(gallons.low*FUEL_LB_PER_GAL*(percent/100),gallons.high*FUEL_LB_PER_GAL*(percent/100),gallonsOverride>0?`${percent}% of user-entered ${gallonsOverride} gal fuel capacity`:`${percent}% of published fuel capacity at 6.2 lb/gal`,gallonsOverride>0?"user":"published-derived");
}
function boatLength(item,config={}){
  return parseLengthFeet(spec(item,config,"Length"))||parseLengthFeet(item?.model)||parseLengthFeet(item?.subtitle)||17;
}
function trailerWeight(item,config={}){
  const override=number(config.trailerWeightOverride);
  if(override>0)return range(override,override,"User-entered actual trailer weight","user",true);
  const length=boatLength(item,config);
  let low,high;
  if(length<=15){low=450;high=650;}
  else if(length<=16.5){low=550;high=775;}
  else if(length<=17.5){low=650;high=925;}
  else if(length<=18.5){low=800;high=1100;}
  else if(length<=19.5){low=925;high=1250;}
  else if(length<=20.5){low=1050;high=1425;}
  else {low=1200;high=1650;}
  const type=clean(config.trailer)||"standard";
  if(type==="premium-single"){low+=75;high+=150;}
  if(type==="galvanized-single"){low+=40;high+=100;}
  if(type==="aluminum-single"){low*=.74;high*=.82;}
  if(type==="tandem"){low=Math.max(low+250,1050);high=Math.max(high+400,1450);}
  if(type==="tandem-premium"){low=Math.max(low+175,950);high=Math.max(high+325,1400);}
  return range(low,high,`${TRAILERS[type]||TRAILERS.standard} estimate for a ${length.toFixed(1)} ft hull`,"estimated",true);
}
function motorTechnology(item){
  const text=[item?.manufacturer,item?.model,item?.subtitle,...Object.values(Object.fromEntries(detailMap(item)))].map(clean).join(" ").toLowerCase();
  if(/fourstroke|four-stroke|4-stroke|bf-series|df-series|f-series|suzuki-built/.test(text))return"four-stroke";
  if(/e-tec|optimax|ficht|tldi|hpdi|direct injection|dfi/.test(text))return"dfi-two-stroke";
  if(/two-stroke|2-stroke|carbureted|precision blend|dt-series|force \/ chrysler/.test(text))return"two-stroke";
  return"unknown";
}
function mainMotorBand(hp,technology){
  const four=technology==="four-stroke";
  const dfi=technology==="dfi-two-stroke";
  if(hp<=40)return four?[205,235]:dfi?[235,275]:[150,225];
  if(hp<=60)return four?[215,280]:dfi?[240,320]:[185,280];
  if(hp<=75)return four?[335,400]:dfi?[305,380]:[225,340];
  if(hp<=90)return four?[350,420]:dfi?[320,410]:[275,380];
  if(hp<=115)return four?[355,440]:dfi?[365,445]:[300,430];
  if(hp<=150)return four?[445,540]:dfi?[410,520]:[375,510];
  if(hp<=175)return four?[480,570]:dfi?[430,545]:[405,535];
  if(hp<=200)return four?[500,610]:dfi?[475,590]:[440,575];
  return four?[525,675]:dfi?[500,650]:[475,625];
}
function kickerBand(hp,technology,text){
  const four=technology==="four-stroke"||/fourstroke|four-stroke|4-stroke|bf|df|mfs|efi/.test(text);
  const high=/high thrust|power thrust|prokicker|bfp|t8|t9\.9/.test(text);
  if(hp<=6)return four?[52,65]:[42,60];
  if(hp<=8)return four?[80,100]:[60,80];
  if(hp<=10)return high?[95,125]:four?[82,110]:[65,88];
  return four?[100,135]:[75,100];
}
function combustionMotorWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered actual motor weight","user",true);
  const options=horsepowerOptions(item);
  const chosen=number(config.hp);
  const hpLow=chosen>0?chosen:(options[0]||((item.categoryId==="kickers")?9.9:90));
  const hpHigh=chosen>0?chosen:(options.at(-1)||hpLow);
  const technology=motorTechnology(item);
  const text=[item.manufacturer,item.model,item.subtitle].map(clean).join(" ").toLowerCase();
  const lowBand=item.categoryId==="kickers"?kickerBand(hpLow,technology,text):mainMotorBand(hpLow,technology);
  const highBand=item.categoryId==="kickers"?kickerBand(hpHigh,technology,text):mainMotorBand(hpHigh,technology);
  return range(lowBand[0],highBand[1],`${chosen>0?`${chosen} hp`:`${hpLow}–${hpHigh} hp family`} ${technology.replaceAll("-"," ")} dry-motor screening range`,"estimated",true);
}
function bowMotorUnit(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered actual trolling-motor weight","user",true);
  const text=[item.manufacturer,item.model,item.subtitle,detailMap(item).get("Specs / Role")].map(clean).join(" ").toLowerCase();
  const voltages=voltageOptions(item);
  const voltage=number(config.voltage)||(voltages[0]||24);
  let low=voltage===12?32:voltage===24?42:48;
  let high=voltage===12?50:voltage===24?68:78;
  if(/gps|spot-lock|terrova|powerdrive|xi3|xi5|recon|rhodan/.test(text)){low+=8;high+=15;}
  if(/quest|force|ghost|ultrex|ulterra|fortrex|tour pro/.test(text)){low+=12;high+=23;}
  if(/ulterra/.test(text)){low+=5;high+=10;}
  if(/63|72|60 in|60\b/.test(text)){low+=5;high+=12;}
  return range(low,high,`${voltage}V trolling-motor assembly screening range`,"estimated",true);
}
function bowBatteryBank(item,config={}){
  const setup=BATTERIES[config.batterySetup]||BATTERIES.flooded;
  if(setup===BATTERIES.none)return range(0,0,"Battery bank counted separately","user");
  const voltages=voltageOptions(item);
  const voltage=number(config.voltage)||(voltages[0]||24);
  const count=Math.max(1,Math.round(voltage/12));
  return range(setup.low*count,setup.high*count,`${count} × 12V ${setup.label.toLowerCase()}`,setup===BATTERIES.lithium?"estimated":"estimated",true);
}
function downriggerWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered installed downrigger weight","user",false);
  const text=[item.manufacturer,item.model,item.subtitle].map(clean).join(" ").toLowerCase();
  const pair=/\bpair\b/.test(text);
  const quantity=pair?2:Math.max(1,Math.min(4,Math.round(number(config.quantity)||1)));
  const electric=/electric|digi|mag |magnum|optimum|depthpower|high performance|tournament series|elite series|800|825|826/.test(text);
  const mini=/mini|lake-troll|laketroller|easi-troll|gadabout|runabout/.test(text);
  const unit=electric?[34,52]:mini?[18,30]:[25,40];
  return range(unit[0]*quantity,unit[1]*quantity,`${quantity} installed ${electric?"electric":"manual"} downrigger${quantity===1?"":"s"}, including typical cannonball allowance`,"estimated",false);
}
function electricalWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered installed electrical-system weight","user",false);
  const text=[item.manufacturer,item.model,item.subtitle].map(clean).join(" ").toLowerCase();
  if(/36v series/.test(text))return range(165,225,"Typical three-battery flooded/AGM bank","estimated",true);
  if(/24v series/.test(text))return range(110,150,"Typical two-battery flooded/AGM bank","estimated",true);
  if(/separated starting/.test(text))return range(110,150,"Typical starting plus house/trolling battery pair","estimated",true);
  if(/12v single/.test(text))return range(55,75,"Typical single marine battery","estimated",true);
  if(/lifepo4/.test(text))return range(25,40,"Typical marine LiFePO4 battery","estimated",false);
  if(/agm/.test(text))return range(60,75,"Typical AGM deep-cycle battery","estimated",true);
  if(/flooded/.test(text))return range(55,70,"Typical flooded deep-cycle battery","estimated",true);
  if(/4 bank|x4/.test(text))return range(18,32,"Four-bank charger and leads","estimated",false);
  if(/3 bank|x3/.test(text))return range(14,26,"Three-bank charger and leads","estimated",false);
  return range(0,25,"Electrical component is below the 30 lb display threshold","estimated",false);
}
function canvasWeight(item,config={}){
  const override=number(config.weightOverride);
  if(override>0)return range(override,override,"User-entered canvas-system weight","user",false);
  const text=[item.manufacturer,item.model,item.subtitle].map(clean).join(" ").toLowerCase();
  if(/full camper|full canvas enclosure|complete fitted full|weather enclosure/.test(text))return range(35,65,"Complete canvas/enclosure with frame and panels","estimated",false);
  if(/convertible windshield top|factory \/ oem bimini|complete fitted bimini|bimini/.test(text))return range(18,38,"Bimini/top with frame and mounting hardware","estimated",false);
  return range(0,28,"Canvas component is normally below the 30 lb display threshold","estimated",false);
}
function itemWeight(item,config={}){
  if(!item)return unavailable("Catalog item missing",true);
  const components=[];
  if(item.categoryId==="boats"){
    components.push({label:"Dry hull",...hullWeight(item,config)});
    components.push({label:"Trailer",...trailerWeight(item,config)});
    components.push({label:"Fuel",...fuelWeight(item,config)});
  }else if(item.categoryId==="main-motors"||item.categoryId==="kickers"){
    components.push({label:item.categoryId==="main-motors"?"Main outboard":"Kicker",...combustionMotorWeight(item,config)});
    if(item.categoryId==="main-motors"&&config.startingBattery!=="none")components.push({label:"Starting battery",...range(45,65,"Typical marine starting battery","estimated",true)});
  }else if(item.categoryId==="bow-trolling-motors"){
    components.push({label:"Bow motor",...bowMotorUnit(item,config)});
    components.push({label:"Trolling battery bank",...bowBatteryBank(item,config)});
  }else if(item.categoryId==="downriggers"){
    components.push({label:"Downrigger system",...downriggerWeight(item,config)});
  }else if(item.categoryId==="electrical"){
    components.push({label:"Electrical system",...electricalWeight(item,config)});
  }else if(item.categoryId==="canvas"){
    components.push({label:"Canvas system",...canvasWeight(item,config)});
  }else{
    const override=number(config.weightOverride);
    components.push({label:"Installed item",...(override>0?range(override,override,"User-entered installed weight","user",false):range(0,25,"Normally below the 30 lb display threshold","estimated",false))});
  }
  const known=components.filter(component=>Number.isFinite(component.low)&&Number.isFinite(component.high));
  const missing=components.filter(component=>component.required&&(!Number.isFinite(component.low)||!Number.isFinite(component.high)));
  return {
    low:known.reduce((sum,component)=>sum+component.low,0),
    high:known.reduce((sum,component)=>sum+component.high,0),
    complete:missing.length===0,
    missing:missing.map(component=>component.label),
    components,
    display:components.some(component=>!Number.isFinite(component.high)||component.high>DISPLAY_THRESHOLD_LB)
  };
}
function packageWeight(selected,gearAllowance=150){
  const rows=selected.map(entry=>({entry,weight:itemWeight(entry.item||entry.i,entry.config||entry.c||{})}));
  const gear=Math.max(0,number(gearAllowance)||0);
  const low=rows.reduce((sum,row)=>sum+row.weight.low,0)+gear;
  const high=rows.reduce((sum,row)=>sum+row.weight.high,0)+gear;
  const missing=rows.flatMap(row=>row.weight.missing.map(label=>`${(row.entry.item||row.entry.i).displayName}: ${label}`));
  const complete=missing.length===0;
  let status="comfortable",label="Comfortable towing margin";
  if(!complete){status="incomplete";label="Incomplete weight total";}
  else if(high>TOW_LIMIT_LB){status="over";label="Over 4,000 lb tow rating";}
  else if(high>=3600){status="near";label="Very near tow limit";}
  else if(high>=3200){status="caution";label="Reduced towing margin";}
  return {low,high,complete,missing,gearAllowance:gear,status,label,marginLow:TOW_LIMIT_LB-high,marginHigh:TOW_LIMIT_LB-low,rows};
}
function format(value){return Number.isFinite(value)?`${Math.round(value).toLocaleString("en-US")} lb`:"Unavailable";}
function formatRange(result){
  if(!result||!Number.isFinite(result.low)||!Number.isFinite(result.high))return"Unavailable";
  return Math.round(result.low)===Math.round(result.high)?format(result.low):`${Math.round(result.low).toLocaleString("en-US")}–${Math.round(result.high).toLocaleString("en-US")} lb`;
}

root.BOATBUILDER_WEIGHT_MODEL={
  TOW_LIMIT_LB,
  DISPLAY_THRESHOLD_LB,
  BATTERIES,
  TRAILERS,
  horsepowerOptions,
  voltageOptions,
  selectedGeneration,
  hullWeight,
  trailerWeight,
  fuelWeight,
  itemWeight,
  packageWeight,
  format,
  formatRange
};
})(typeof window!=="undefined"?window:globalThis);
