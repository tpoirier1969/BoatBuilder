#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const catalogPath = path.join(root, "data", "catalog.js");
const outputPath = path.join(root, "research", "lund-inventory.json");

const source = fs.readFileSync(catalogPath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: catalogPath });

const catalog = sandbox.window.BOATBUILDER_DATA;
if (!catalog || !Array.isArray(catalog.items)) {
  throw new Error("Catalog did not expose window.BOATBUILDER_DATA.items");
}

const lund = catalog.items
  .filter((item) => item.categoryId === "boats" && item.manufacturer === "Lund")
  .map((item) => ({
    id: item.id,
    model: item.model,
    displayName: item.displayName,
    subtitle: item.subtitle,
    badge: item.badge,
    lowPrice: item.lowPrice,
    highPrice: item.highPrice,
    priceBasis: item.priceBasis,
    sourceUrl: item.sourceUrl,
    details: Object.fromEntries((item.details || []).map(({ label, value }) => [label, value]))
  }))
  .sort((a, b) => a.model.localeCompare(b.model));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({ generatedFrom: "data/catalog.js", count: lund.length, items: lund }, null, 2)}\n`);
console.log(`Exported ${lund.length} Lund boat records to ${path.relative(root, outputPath)}`);
