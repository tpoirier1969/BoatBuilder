import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const write = (path, content) => fs.writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`);

const sandbox = { window: {} };
vm.runInNewContext(read("data/catalog.js"), sandbox, { filename: "data/catalog.js" });
vm.runInNewContext(read("data/lund-corrections.js"), sandbox, { filename: "data/lund-corrections.js" });

const catalog = sandbox.window.BOATBUILDER_DATA;
assert.ok(catalog?.items?.length, "Existing catalog did not load");

const valueLabels = [
  ["1980s Value", "1980s", 1980, 1989],
  ["1990s Value", "1990s", 1990, 1999],
  ["2000s Value", "2000s", 2000, 2009],
  ["2010s Value", "2010s", 2010, 2019],
  ["2020s Value", "2020s", 2020, 2029]
];

const moneyTokens = value => [
  ...String(value ?? "")
    .replaceAll(",", "")
    .matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)
]
  .filter(match => match[0].includes("$") || match[2])
  .map(match => Math.round(Number(match[1]) * (match[2] ? 1000 : 1)));

for (const item of catalog.items) {
  if (item.categoryId !== "boats") continue;

  const detailMap = new Map((item.details || []).map(detail => [detail.label, detail.value]));
  const valueEras = [];

  for (const [detailLabel, label, startYear, endYear] of valueLabels) {
    const values = moneyTokens(detailMap.get(detailLabel));
    if (!values.length) continue;
    valueEras.push({
      id: `${item.id}:value:${label}`,
      label,
      startYear,
      endYear,
      lowPrice: Math.min(...values),
      highPrice: Math.max(...values),
      basis: "Used complete-package screening estimate"
    });
  }

  item.valueEras = valueEras;
  item.details = (item.details || []).filter(detail => !valueLabels.some(([label]) => label === detail.label));
}

const dualImpact = catalog.items.find(item => item.id === "boat:MirroCraft | Dual Impact 176");
assert.ok(dualImpact, "MirroCraft Dual Impact 176 is missing");
dualImpact.generationWarning = "This model name spans more than one hull design.";
dualImpact.designGenerations = [
  {
    id: "mirrocraft-dual-impact-176-early",
    label: "Early 17-foot Dual Impact design",
    status: "research-required",
    specificationBasis: "A 2001 example is documented; exact factory specifications and redesign cutoff remain unverified.",
    specs: {
      Beam: {
        value: "About 89\"",
        confidence: "secondary-unverified"
      }
    },
    eras: [
      {
        label: "2000s",
        low: null,
        high: null,
        basis: "Early-design market research pending"
      }
    ]
  },
  {
    id: "mirrocraft-dual-impact-176-current",
    label: "Current 176 design",
    status: "factory-current",
    specificationBasis: "Current MirroCraft factory specifications",
    catalogSpecs: true,
    eras: []
  }
];

const boats = catalog.items
  .filter(item => item.categoryId === "boats")
  .sort((a, b) => `${a.manufacturer}\u0000${a.model}`.localeCompare(`${b.manufacturer}\u0000${b.model}`));
const equipment = catalog.items
  .filter(item => item.categoryId !== "boats")
  .sort((a, b) => `${a.categoryId}\u0000${a.manufacturer}\u0000${a.model}`.localeCompare(`${b.categoryId}\u0000${b.manufacturer}\u0000${b.model}`));

assert.equal(boats.length, 170, "Unexpected migrated boat count");
assert.equal(equipment.length, 181, "Unexpected migrated equipment count");
assert.equal(new Set([...boats, ...equipment].map(item => item.id)).size, boats.length + equipment.length, "Duplicate IDs after migration");

write("data/boats.js", `window.BOATBUILDER_BOATS = ${JSON.stringify(boats, null, 2)};`);
write("data/equipment.js", `window.BOATBUILDER_EQUIPMENT = ${JSON.stringify(equipment, null, 2)};`);
write(
  "data/catalog.js",
  `(() => {\n  "use strict";\n\n  const categories = ${JSON.stringify(catalog.categories, null, 2)};\n  const boats = Array.isArray(window.BOATBUILDER_BOATS) ? window.BOATBUILDER_BOATS : [];\n  const equipment = Array.isArray(window.BOATBUILDER_EQUIPMENT) ? window.BOATBUILDER_EQUIPMENT : [];\n  const items = [...boats, ...equipment];\n\n  window.BOATBUILDER_DATA = {\n    schemaVersion: 3,\n    source: "BoatBuilder canonical app data",\n    counts: {\n      items: items.length,\n      boats: boats.length,\n      equipment: equipment.length\n    },\n    categories,\n    items\n  };\n})();`
);

let app = read("app.js");
const replaceChecked = (pattern, replacement, label) => {
  const next = app.replace(pattern, replacement);
  assert.notEqual(next, app, `Could not update app.js: ${label}`);
  app = next;
};

replaceChecked(
  /,DD=\{"boat:MirroCraft \| Dual Impact 176":\{.*?\}\},E=/s,
  ",E=",
  "remove inline model data"
);
replaceChecked(
  /function eras\(i\)\{.*?\}\nfunction span/s,
  `function eras(i){if(Array.isArray(i.valueEras))return i.valueEras.map(v=>({label:v.label,low:v.lowPrice,high:v.highPrice,basis:v.basis||"Used complete-package screening estimate"}));const d=dm(i);return EF.flatMap(f=>{const x=moneyTokens(d.get(f));return x.length?[{label:f.replace(" Value",""),low:Math.min(...x),high:Math.max(...x),basis:"Legacy calendar-era market estimate"}]:[]})}\nfunction span`,
  "use structured value eras"
);
replaceChecked(
  /function risk\(i\)\{.*?\}\nfunction specs/s,
  `function risk(i){return /varies|representative|multiple distinct|multiple generations|exact year|by year|redesign|audit pending/i.test(span(i))}\nfunction specs`,
  "stop treating price decades as hull redesigns"
);
replaceChecked(
  /function gens\(i\)\{.*?\}\nfunction gen/s,
  `function gens(i){if(i.categoryId!=="boats")return[];if(Array.isArray(i.designGenerations)&&i.designGenerations.length)return i.designGenerations.map(g=>({...g,basis:g.specificationBasis||g.basis||"",specs:g.catalogSpecs?specs(i):g.specs}));return[{id:i.id+":catalog",label:risk(i)?"Catalog specification basis, redesign audit pending":"Catalog specification basis",status:risk(i)?"generation-audit-required":"single-record-basis",basis:span(i)+(risk(i)?". The app has not verified that this design stayed unchanged across the full span.":". No conflicting design generation is currently documented."),specs:specs(i),eras:eras(i),synthetic:true}]}\nfunction gen`,
  "read design generations from catalog data"
);
replaceChecked(
  /function panel\(i,c\)\{.*?\}\nfunction bind/s,
  `function panel(i,c){if(i.categoryId!=="boats")return"";const g=gen(i,c),w=i.generationWarning||(g?.status==="generation-audit-required"?"Specs are representative of the cited source, not guaranteed for every production year.":"");const r=g?Object.entries(g.specs||{}).map(([k,v])=>\`<div class="definition-row"><dt>\${esc(k)}</dt><dd>\${esc(v.value)}\${v.confidence?" · "+esc(v.confidence):""}</dd></div>\`).join(""):"";return\`<aside class="manufacturer-note">\${w?\`<strong>Generation warning:</strong> \${esc(w)}\`:""}\${g?\`<p><strong>\${esc(g.label)}</strong><br>\${esc(g.basis)}</p>\${r?\`<dl class="definition-list">\${r}</dl>\`:""}\`:""}</aside>\`}\nfunction bind`,
  "read generation warnings from catalog data"
);
write("app.js", app);

let html = read("index.html");
const oldScripts = `  <script src="data/catalog.js?v=8" defer></script>\n  <script src="data/lund-corrections.js?v=1" defer></script>\n  <script src="app.js?v=12" defer></script>`;
const newScripts = `  <script src="data/boats.js?v=1" defer></script>\n  <script src="data/equipment.js?v=1" defer></script>\n  <script src="data/catalog.js?v=9" defer></script>\n  <script src="app.js?v=13" defer></script>`;
assert.ok(html.includes(oldScripts), "Expected production script block was not found");
html = html.replace(oldScripts, newScripts);
write("index.html", html);

write(
  "tests/qa.mjs",
  `import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport vm from "node:vm";\n\nconst read = path => fs.readFileSync(path, "utf8");\nconst appSource = read("app.js");\nconst htmlSource = read("index.html");\nconst cssSource = read("styles.css");\nconst boatsSource = read("data/boats.js");\nconst equipmentSource = read("data/equipment.js");\nconst catalogSource = read("data/catalog.js");\n\nconst sandbox = { window: {} };\nvm.runInNewContext(boatsSource, sandbox, { filename: "data/boats.js" });\nvm.runInNewContext(equipmentSource, sandbox, { filename: "data/equipment.js" });\nvm.runInNewContext(catalogSource, sandbox, { filename: "data/catalog.js" });\nconst catalog = sandbox.window.BOATBUILDER_DATA;\n\nassert.ok(catalog, "Catalog global is missing");\nassert.equal(catalog.source, "BoatBuilder canonical app data", "Catalog source is not the app repository");\nassert.ok(Array.isArray(catalog.categories) && catalog.categories.length >= 8, "Expected catalog categories");\nassert.ok(Array.isArray(catalog.items) && catalog.items.length > 300, "Catalog is unexpectedly small");\n\nconst ids = catalog.items.map(item => item.id);\nassert.equal(new Set(ids).size, ids.length, "Catalog contains duplicate stable IDs");\nassert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");\nassert.equal(catalog.counts.items, catalog.items.length, "Catalog item count is stale");\nassert.equal(catalog.counts.boats, catalog.items.filter(item => item.categoryId === "boats").length, "Catalog boat count is stale");\nassert.equal(catalog.counts.boats, 170, "Unexpected boat count");\nassert.equal(catalog.counts.equipment, 181, "Unexpected equipment count");\n\nconst requiredIds = [\n  "boat:Lund | 1600 Pro Sport",\n  "boat:Lund | Alaskan 1800 Sport",\n  "boat:Lund | Alaskan 1875 Sport (2024 redesign)",\n  "boat:Lund | Tyee 1850 outboard / older 18' Tyee outboard",\n  "boat:Lund | Tyee 1850 I/O / ITS (older generation)",\n  "boat:Lund | Tyee 1875 Sport (current generation)"\n];\nfor (const id of requiredIds) assert.ok(catalog.items.some(item => item.id === id), \`Required canonical record is missing: \${id}\`);\nassert.ok(!catalog.items.some(item => item.id === "boat:Lund | Tyee 1850 / older 18' Tyee"), "Mixed-propulsion Tyee umbrella record still exists");\n\nconst oldAlaskan = catalog.items.find(item => item.id === "boat:Lund | Alaskan 1800 Sport");\nassert.match(oldAlaskan.subtitle, /2003 factory hull/i, "Old Alaskan was not narrowed to its documented hull");\nassert.deepEqual(oldAlaskan.valueEras.map(era => era.label), ["2000s"], "Old Alaskan retained unsupported value eras");\n\nconst tyeeIo = catalog.items.find(item => item.id === "boat:Lund | Tyee 1850 I/O / ITS (older generation)");\nassert.equal(tyeeIo.lowPrice, null, "I/O Tyee inherited an unsupported low price");\nassert.equal(tyeeIo.highPrice, null, "I/O Tyee inherited an unsupported high price");\nassert.equal(tyeeIo.valueEras.length, 0, "I/O Tyee inherited outboard value eras");\n\nconst dualImpact = catalog.items.find(item => item.id === "boat:MirroCraft | Dual Impact 176");\nassert.equal(dualImpact.designGenerations.length, 2, "Dual Impact generations are not stored with the boat data");\nassert.doesNotMatch(appSource, /const DD=|,DD=/, "Model-generation data remains embedded in the controller");\nassert.match(appSource, /i\.designGenerations/, "Controller does not read canonical design generations");\nassert.match(appSource, /i\.valueEras/, "Controller does not read canonical value eras");\nassert.doesNotMatch(appSource, /eras\(i\)\.length>1/, "Price decades are still treated as redesign evidence");\n\nassert.match(appSource, /currentEstimate\.v5/, "Current estimate storage version is not v5");\nassert.match(appSource, /function gens\(/, "Generation resolver is missing");\nassert.match(appSource, /function missing\(/, "Required generation and era gate is missing");\nassert.match(appSource, /function controls\(/, "Generation, era and trailer controls are missing");\nassert.doesNotMatch(appSource, /data-select=/, "Model-list estimate checkbox returned");\n\nassert.match(htmlSource, /data\\/boats\.js[^]*data\\/equipment\.js[^]*data\\/catalog\.js[^]*app\.js/, "Canonical data files do not load before the controller");\nassert.doesNotMatch(htmlSource, /corrections/i, "A corrections overlay is still loaded");\nassert.match(htmlSource, /id="home-button"/, "Home button is missing");\nassert.match(htmlSource, /id="estimate-button"/, "Estimate button is missing");\nassert.match(htmlSource, /id="clear-estimate-button"/, "Clear estimate button is missing");\n\nassert.match(cssSource, /\.header-estimate-button\\s*\\{[^]*?grid-column:\\s*2;/, "Estimate button is not centered in header column 2");\nassert.match(cssSource, /\.clear-estimate-button\\s*\\{[^]*?grid-column:\\s*3;/, "Clear estimate is not placed on the right");\n\nconsole.log(\`BoatBuilder QA passed: \${catalog.items.length} items, \${catalog.counts.boats} boats, \${catalog.counts.equipment} equipment records.\`);\nconsole.log("Verified canonical app data, structured value eras, data-backed hull generations, and no runtime correction overlay.");`
);

write(
  ".github/workflows/qa.yml",
  `name: BoatBuilder QA\n\non:\n  push:\n    branches: [main]\n    paths:\n      - index.html\n      - styles.css\n      - app.js\n      - data/boats.js\n      - data/equipment.js\n      - data/catalog.js\n      - tests/qa.mjs\n      - .github/workflows/qa.yml\n  pull_request:\n    branches: [main]\n    paths:\n      - index.html\n      - styles.css\n      - app.js\n      - data/boats.js\n      - data/equipment.js\n      - data/catalog.js\n      - tests/qa.mjs\n      - .github/workflows/qa.yml\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  qa:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - name: Check out repository\n        uses: actions/checkout@v4\n\n      - name: Set up Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: "22"\n          package-manager-cache: false\n\n      - name: Check JavaScript syntax\n        run: |\n          node --check app.js\n          node --check data/boats.js\n          node --check data/equipment.js\n          node --check data/catalog.js\n          node --check tests/qa.mjs\n\n      - name: Run catalog and estimate QA\n        run: node tests/qa.mjs`
);

console.log(`Prepared canonical catalog: ${boats.length} boats and ${equipment.length} equipment records.`);
