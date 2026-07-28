/* eslint-env node */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);

for (const relativePath of ["data/catalog.js", "data/catalog-v3-migration.js"]) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

const catalog = context.window.BOATBUILDER_DATA;
const errors = [];
const warnings = [];
const seenGenerationIds = new Set();

function report(collection, item, message) {
  collection.push(`${item.id}: ${message}`);
}

for (const item of catalog.items) {
  if (item.categoryId !== "boats") continue;

  if (!Array.isArray(item.designGenerations) || item.designGenerations.length === 0) {
    report(errors, item, "missing designGenerations");
  } else {
    for (const generation of item.designGenerations) {
      if (!generation.id) report(errors, item, "generation missing id");
      if (seenGenerationIds.has(generation.id)) {
        report(errors, item, `duplicate generation id ${generation.id}`);
      }
      seenGenerationIds.add(generation.id);

      if (!generation.specificationBasis) {
        report(errors, item, `generation ${generation.id} missing specificationBasis`);
      }

      if (generation.startYear && generation.endYear && generation.startYear > generation.endYear) {
        report(errors, item, `generation ${generation.id} has reversed year range`);
      }

      if (generation.status === "legacy-flat-specs") {
        report(warnings, item, "physical specifications still need design-generation audit");
      }
    }
  }

  if (!Array.isArray(item.valueEras) || item.valueEras.length === 0) {
    report(warnings, item, "missing structured valueEras");
  } else {
    for (const era of item.valueEras) {
      if (era.startYear > era.endYear) report(errors, item, `value era ${era.id} has reversed years`);
      if (era.lowPrice != null && era.highPrice != null && era.lowPrice > era.highPrice) {
        report(errors, item, `value era ${era.id} has lowPrice greater than highPrice`);
      }
    }
  }
}

console.log(`Catalog schema version: ${catalog.schemaVersion}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
