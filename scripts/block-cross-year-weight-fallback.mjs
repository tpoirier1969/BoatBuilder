import fs from "node:fs";

const path="weight-model.js";
let source=fs.readFileSync(path,"utf8");
if(!source.includes("BLOCK_CROSS_YEAR_WEIGHT_FALLBACK_V1")){
  source=source.replace(
    'const PUBLISHED_WEIGHT_ERAS_V1=true;',
    'const PUBLISHED_WEIGHT_ERAS_V1=true;\nconst BLOCK_CROSS_YEAR_WEIGHT_FALLBACK_V1=true;'
  );
  const anchor=`    if(selected)return range(selected.lowLb,selected.highLb,selected.basis||\`Published dry-hull weight for \${selected.label}\`,selected.lowLb===selected.highLb?"published":"published-range",true);
    const low=Math.min(...weightEras.map(era=>Number(era.lowLb)).filter(Number.isFinite));`;
  const replacement=`    if(selected)return range(selected.lowLb,selected.highLb,selected.basis||\`Published dry-hull weight for \${selected.label}\`,selected.lowLb===selected.highLb?"published":"published-range",true);
    if(clean(config.era))return unavailable("Published dry-hull weight is not available for the selected year option. Enter a documented or measured weight to complete the package total.",true);
    const low=Math.min(...weightEras.map(era=>Number(era.lowLb)).filter(Number.isFinite));`;
  if(!source.includes(anchor))throw new Error("Cross-year hull-weight fallback anchor changed");
  source=source.replace(anchor,replacement);
  fs.writeFileSync(path,source);
}
console.log("Blocked selected-year hull-weight fallback");
