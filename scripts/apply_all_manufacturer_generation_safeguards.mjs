import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const testsPath = "tests/qa.mjs";
const reportPath = "research/catalog-generation-audit-status-2026-07-29.md";
const source = fs.readFileSync(boatsPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: boatsPath });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Boat data did not load");

const SPEC_LABELS = new Set([
  "Length", "Beam", "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth",
  "Cockpit / Interior Depth", "Deadrise", "Transom Height", "Transom Width", "Max HP",
  "Persons", "Capacity Weight", "Fuel Capacity", "Bottom Thickness",
  "Side / Freeboard Thickness", "Construction"
]);

const detailValue = (boat, label) => boat.details?.find(item => item.label === label)?.value || "";
const setDetail = (boat, label, value) => {
  boat.details ||= [];
  const existing = boat.details.find(item => item.label === label);
  if (existing) existing.value = value;
  else boat.details.push({ label, value });
};

function yearFromTwoDigits(value) {
  const n = Number(value);
  return n >= 70 ? 1900 + n : 2000 + n;
}

function inferSourceYear(boat) {
  const urlText = [boat.sourceUrl, boat.image?.source, boat.image?.url].filter(Boolean).join(" ");
  const my = urlText.match(/(?:MY|my)(\d{2})(?:\D|$)/);
  if (my) return yearFromTwoDigits(my[1]);
  const fourInUrl = urlText.match(/\b(19\d{2}|20\d{2})\b/);
  if (fourInUrl) return Number(fourInUrl[1]);

  const text = `${boat.subtitle || ""} ${detailValue(boat, "Model Years / Era")}`;
  const preferred = [...text.matchAll(/\b(19\d{2}|20\d{2})\b(?=[^.;]{0,50}\b(?:factory|catalog|brochure|specification|snapshot|basis|model page|manual)\b)/gi)];
  if (preferred.length) return Number(preferred.at(-1)[1]);
  const years = [...text.matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(match => Number(match[1]));
  return years.length === 1 ? years[0] : null;
}

function claimedRange(boat) {
  const text = `${boat.subtitle || ""} ${detailValue(boat, "Model Years / Era")}`;
  const years = [...text.matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(match => Number(match[1]));
  for (const match of text.matchAll(/\b((?:19|20)\d)0s\b/g)) {
    const decade = Number(`${match[1]}0`);
    years.push(decade, decade + 9);
  }
  for (const era of boat.valueEras || []) {
    if (Number.isFinite(era.startYear)) years.push(era.startYear);
    if (Number.isFinite(era.endYear)) years.push(era.endYear);
  }
  return years.length ? { startYear: Math.min(...years), endYear: Math.max(...years) } : { startYear: null, endYear: null };
}

function isBroadRecord(boat, exactYear) {
  const text = `${boat.subtitle || ""} ${detailValue(boat, "Model Years / Era")}`;
  if (/\b(?:varies|multiple sizes|multiple years|multiple generations|by year|redesign|audit pending|production run|other advertised years|older generation|family|series)\b/i.test(text)) return true;
  if (/\b(?:19|20)\d{2}\s*[–—-]\s*(?:present|(?:19|20)\d{2})\b/i.test(text)) return true;
  if (/\b(?:19|20)\d0s\b/i.test(text)) return true;
  const eras = boat.valueEras || [];
  if (eras.some(era => Number.isFinite(era.startYear) && Number.isFinite(era.endYear) && era.endYear > era.startYear)) return true;
  if (exactYear && eras.some(era => exactYear < era.startYear || exactYear > era.endYear)) return true;
  return false;
}

function extractSpecs(boat) {
  const specs = {};
  for (const item of boat.details || []) {
    if (!SPEC_LABELS.has(item.label)) continue;
    const value = String(item.value ?? "").trim();
    if (!value || /varies by selected hull generation/i.test(value)) continue;
    const confidence = /not published|not stated|representative|about|approx|varies/i.test(value)
      ? "catalog-representative"
      : "cited-source-exact";
    specs[item.label] = { value, confidence };
  }
  return specs;
}

function nestedEras(boat) {
  return (boat.valueEras || []).map(era => ({
    id: era.id,
    label: era.label,
    startYear: era.startYear,
    endYear: era.endYear,
    low: era.lowPrice,
    high: era.highPrice,
    basis: `${era.basis || "Used complete-package screening estimate"}; use only after confirming the selected cited hull snapshot matches the listing`
  }));
}

const beforeByManufacturer = new Map();
const addedByManufacturer = new Map();
let preserved = 0;
let exactAdded = 0;
let unresolvedAdded = 0;

for (const boat of boats) {
  beforeByManufacturer.set(boat.manufacturer, (beforeByManufacturer.get(boat.manufacturer) || 0) + 1);
  if (Array.isArray(boat.designGenerations) && boat.designGenerations.length) {
    preserved++;
    continue;
  }

  const exactYear = inferSourceYear(boat);
  const broad = isBroadRecord(boat, exactYear);
  const range = claimedRange(boat);
  const originalEraText = detailValue(boat, "Model Years / Era") || boat.subtitle || "Production years not established";
  const generations = [];

  if (exactYear) {
    generations.push({
      id: `${boat.id}:gen:${exactYear}`,
      label: `${exactYear} cited specification snapshot`,
      startYear: exactYear,
      endYear: exactYear,
      status: "cited-snapshot",
      specificationBasis: `${exactYear} cited source snapshot. This is not proof that the same specifications apply across the full advertised production span.`,
      sourceUrl: boat.sourceUrl || null,
      specs: extractSpecs(boat),
      eras: nestedEras(boat)
    });
    exactAdded++;
  }

  if (broad || !exactYear) {
    generations.push({
      id: `${boat.id}:gen:unresolved`,
      label: exactYear ? "Other advertised years — specifications and pricing unresolved" : "Production years — specifications and pricing unresolved",
      startYear: range.startYear,
      endYear: range.endYear,
      status: "unresolved",
      specificationBasis: `BoatBuilder has not yet verified redesign boundaries or exact specifications for this span. Original catalog wording: ${originalEraText}`,
      sourceUrl: boat.sourceUrl || null,
      specs: {},
      eras: []
    });
    unresolvedAdded++;
  }

  boat.designGenerations = generations;
  boat.valueEras = [];
  boat.generationWarning = broad || !exactYear
    ? "Choose the cited snapshot only when the listing matches it. Other years remain unpriced and carry no inherited specifications until factory evidence establishes their hull generation."
    : "This record is limited to the cited specification snapshot; do not assume adjacent model years are identical.";

  if (generations.length > 1) {
    for (const item of boat.details || []) {
      if (SPEC_LABELS.has(item.label)) item.value = "Varies by selected hull generation";
    }
    const replacement = exactYear
      ? `${exactYear} exact cited specification; other advertised years unresolved`
      : "Production years and redesign boundaries unresolved";
    boat.subtitle = replacement;
    setDetail(boat, "Model Years / Era", replacement);
  }
  setDetail(boat, "Research Status", exactYear
    ? "Exact cited snapshot preserved; remaining advertised years require generation-by-generation factory reconciliation."
    : "No exact cited model-year snapshot could be established automatically; specifications and pricing are withheld pending research.");

  addedByManufacturer.set(boat.manufacturer, (addedByManufacturer.get(boat.manufacturer) || 0) + 1);
}

fs.writeFileSync(boatsPath, `window.BOATBUILDER_BOATS = ${JSON.stringify(boats, null, 2)};\n`);

let tests = fs.readFileSync(testsPath, "utf8");
const marker = "const dualImpact = item(\"boat:MirroCraft | Dual Impact 176\");";
const genericBlock = `// All-manufacturer generation-safety audit.\nconst allBoats = catalog.items.filter(entry => entry.categoryId === \"boats\");\nassert.ok(\n  allBoats.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),\n  \"One or more app boat records lacks canonical design-generation metadata\"\n);\nfor (const entry of allBoats) {\n  for (const generation of entry.designGenerations) {\n    if (generation.status !== \"unresolved\") continue;\n    assert.equal(Object.keys(generation.specs || {}).length, 0, \`\${entry.id} unresolved generation inherited specifications\`);\n    assert.equal((generation.eras || []).length, 0, \`\${entry.id} unresolved generation inherited pricing\`);\n  }\n}\nassert.ok(\n  allBoats.filter(entry => entry.manufacturer !== \"Lund\" && entry.manufacturer !== \"Alumacraft\").every(entry => entry.valueEras.length === 0),\n  \"A newly safeguarded manufacturer retained unsafe top-level value eras\"\n);\n\n`;
if (!tests.includes("// All-manufacturer generation-safety audit.")) {
  if (!tests.includes(marker)) throw new Error("QA insertion marker not found");
  tests = tests.replace(marker, genericBlock + marker);
  fs.writeFileSync(testsPath, tests);
}

const rows = [...beforeByManufacturer].sort((a, b) => a[0].localeCompare(b[0]));
const report = [
  "# BoatBuilder all-manufacturer generation audit status — 2026-07-29",
  "",
  "## Scope completed in this batch",
  "",
  `- Canonical boat records checked: **${boats.length}**.`,
  `- Existing researched generation records preserved: **${preserved}**.`,
  `- New exact cited snapshots created: **${exactAdded}**.`,
  `- New unresolved no-spec/no-price spans created: **${unresolvedAdded}**.`,
  "- Every boat record now has canonical design-generation metadata.",
  "- Unresolved generations contain neither inherited hull specifications nor inherited price ranges.",
  "",
  "This batch is a catalog-wide safety correction, not a claim that every historical redesign boundary has been researched. It prevents the app from presenting one cited model-year specification as fact for every year in a broad record while detailed factory-catalog reconciliation continues.",
  "",
  "## Manufacturer coverage",
  "",
  "| Manufacturer | App records | Newly safeguarded in this batch |",
  "|---|---:|---:|",
  ...rows.map(([manufacturer, count]) => `| ${manufacturer} | ${count} | ${addedByManufacturer.get(manufacturer) || 0} |`),
  "",
  "## Next research order",
  "",
  "1. Finish Alumacraft Dominator and Navigator year-by-year reconciliation.",
  "2. Crestliner app models.",
  "3. Smoker Craft, Starcraft, and Sylvan app models.",
  "4. MirroCraft and Sea Nymph app models.",
  "5. Princecraft and remaining regional manufacturers.",
  "",
  "Each detailed pass replaces unresolved spans with verified generation boundaries and compatible market eras. Stable record IDs remain unchanged unless the record itself proves to be a mixed model identity."
].join("\n") + "\n";
fs.writeFileSync(reportPath, report);

console.log(JSON.stringify({ boats: boats.length, preserved, exactAdded, unresolvedAdded, manufacturers: rows.length }, null, 2));
