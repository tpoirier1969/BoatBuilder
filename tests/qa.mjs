import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const appSource = read("app.js");
const htmlSource = read("index.html");
const cssSource = read("styles.css");
const boatsSource = read("data/boats.js");
const equipmentSource = read("data/equipment.js");
const catalogSource = read("data/catalog.js");

const sandbox = { window: {} };
vm.runInNewContext(boatsSource, sandbox, { filename: "data/boats.js" });
vm.runInNewContext(equipmentSource, sandbox, { filename: "data/equipment.js" });
vm.runInNewContext(catalogSource, sandbox, { filename: "data/catalog.js" });
const catalog = sandbox.window.BOATBUILDER_DATA;
const item = id => catalog.items.find(entry => entry.id === id);

assert.ok(catalog, "Catalog global is missing");
assert.equal(catalog.source, "BoatBuilder canonical app data", "Catalog source is not the app repository");
assert.ok(Array.isArray(catalog.categories) && catalog.categories.length >= 8, "Expected catalog categories");
assert.ok(Array.isArray(catalog.items) && catalog.items.length > 300, "Catalog is unexpectedly small");

const ids = catalog.items.map(entry => entry.id);
assert.equal(new Set(ids).size, ids.length, "Catalog contains duplicate stable IDs");
assert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");
assert.equal(catalog.counts.items, catalog.items.length, "Catalog item count is stale");
assert.equal(
  catalog.counts.boats,
  catalog.items.filter(entry => entry.categoryId === "boats").length,
  "Catalog boat count is stale"
);
assert.equal(
  catalog.counts.equipment,
  catalog.items.filter(entry => entry.categoryId !== "boats").length,
  "Catalog equipment count is stale"
);
assert.ok(catalog.counts.boats >= 170, "Boat catalog shrank below the canonical migration baseline");
assert.ok(catalog.counts.equipment >= 181, "Equipment catalog shrank below the canonical migration baseline");

const requiredIds = [
  "boat:Lund | 1600 Pro Sport",
  "boat:Lund | Adventure Sport 1675",
  "boat:Lund | Alaskan 1800 Sport",
  "boat:Lund | Alaskan 1875 Sport (2024 redesign)",
  "boat:Lund | Impact Sport 1775",
  "boat:Lund | Pro-V 1775 (non-walk-through configurations)",
  "boat:Lund | Tyee 1850 outboard / older 18' Tyee outboard",
  "boat:Lund | Tyee 1850 I/O / ITS (older generation)",
  "boat:Lund | Tyee 1875 Sport (current generation)",
  "boat:Alumacraft | Competitor 165 Sport",
  "boat:Alumacraft | Dominator 175 Sport",
  "boat:Alumacraft | Trophy 175 Sport",
  "boat:Alumacraft | Trophy 185 Sport (Secondary; 175 is Primary)"
];
for (const id of requiredIds) {
  assert.ok(item(id), `Required canonical record is missing: ${id}`);
}
assert.ok(
  !item("boat:Lund | Tyee 1850 / older 18' Tyee"),
  "Mixed-propulsion Tyee umbrella record still exists"
);

// Focused Lund app-model audit.
const lund = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Lund");
assert.equal(lund.length, 28, "Focused Lund app-model scope changed without updating the audit");
assert.ok(
  lund.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more Lund app records lacks canonical design-generation metadata"
);

const adventure = item("boat:Lund | Adventure Sport 1675");
assert.equal(adventure.designGenerations.length, 2, "Adventure 1675 redesign generations are not separated");
assert.match(
  adventure.designGenerations.map(g => g.label).join(" | "),
  /2021[^|]*pre-redesign[^|]*\|[^|]*2024[^|]*wood-free/i,
  "Adventure 1675 does not preserve the 2021 and 2024 redesign split"
);

const oldAlaskan = item("boat:Lund | Alaskan 1800 Sport");
assert.equal(oldAlaskan.designGenerations.length, 2, "Alaskan 1800 documented specification sets are not separated");
assert.match(
  oldAlaskan.designGenerations.map(g => g.label).join(" | "),
  /2003[^|]*\|[^|]*2021/i,
  "Alaskan 1800 does not expose its documented 2003 and 2021 specification sets"
);
assert.equal(oldAlaskan.valueEras.length, 0, "Multi-generation Alaskan retained unsafe top-level value eras");

const impact = item("boat:Lund | Impact Sport 1775");
assert.equal(impact.designGenerations.length, 2, "Non-XS Impact 1775 generations are not separated");
assert.match(impact.details.find(d => d.label === "Notes")?.value || "", /non-XS/i, "Historical Impact record is not protected from Impact XS substitution");

const proV1775 = item("boat:Lund | Pro-V 1775 (non-walk-through configurations)");
assert.equal(proV1775.designGenerations.length, 2, "Pro-V 1775 2000 and 2002 specification sets are not separated");
assert.match(proV1775.designGenerations.map(g => g.label).join(" | "), /2000[^|]*\|[^|]*2002/i, "Pro-V 1775 exact-year split is missing");

const tyeeIo = item("boat:Lund | Tyee 1850 I/O / ITS (older generation)");
assert.equal(tyeeIo.lowPrice, null, "I/O Tyee inherited an unsupported low price");
assert.equal(tyeeIo.highPrice, null, "I/O Tyee inherited an unsupported high price");
assert.equal(tyeeIo.valueEras.length, 0, "I/O Tyee inherited outboard value eras");
assert.equal(tyeeIo.designGenerations.length, 1, "I/O Tyee is not narrowed to one documented package basis");

const currentTyee = item("boat:Lund | Tyee 1875 Sport (current generation)");
assert.match(
  currentTyee.designGenerations[0].specs?.["Dry Hull Weight"]?.value || "",
  /1,760 lb/i,
  "Current Tyee 1875 factory hull weight is missing"
);

// Strict Alumacraft existing-model completion audit.
const alumacraft = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Alumacraft");
assert.equal(alumacraft.length, 17, "Focused Alumacraft app-model scope changed without updating the audit");
assert.equal(
  alumacraft.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
  52,
  "Alumacraft generation/evidence-row count changed without updating the strict audit"
);
assert.ok(alumacraft.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0), "An Alumacraft record retained unsafe top-level value eras");
const alumacraftIdealIds = new Set([
  "boat:Alumacraft | Competitor 165 Sport",
  "boat:Alumacraft | Competitor 175 Sport / FSX",
  "boat:Alumacraft | Dominator 165 Sport",
  "boat:Alumacraft | Dominator 175 Sport",
  "boat:Alumacraft | Navigator Sport 165",
  "boat:Alumacraft | Navigator Sport 175",
  "boat:Alumacraft | Trophy 175 Sport"
]);
for (const entry of alumacraft) {
  assert.ok(Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1, `${entry.id} lacks canonical generations`);
  assert.equal(Boolean(entry.idealMatch), alumacraftIdealIds.has(entry.id), `${entry.id} ideal-match marker is wrong`);
  assert.equal(entry.model.startsWith("*"), alumacraftIdealIds.has(entry.id), `${entry.id} compact model star is wrong`);
  assert.equal(entry.displayName.startsWith("*"), alumacraftIdealIds.has(entry.id), `${entry.id} compact display star is wrong`);
  for (const generation of entry.designGenerations) {
    assert.notEqual(generation.status, "unresolved", `${entry.id} still contains an unresolved generation`);
    if (["alias-only", "family-umbrella-rejection"].includes(generation.status)) continue;
    assert.ok(
      Array.isArray(generation.eras) && generation.eras.some(era => Number.isFinite(era.low) && Number.isFinite(era.high)),
      `${entry.id} ${generation.id} lacks a used complete-package range`
    );
    for (const era of generation.eras) {
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
      assert.ok(
        Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear)
        && era.startYear >= generation.startYear && era.endYear <= generation.endYear,
        `${era.id} falls outside its generation`
      );
    }
  }
}

const alumacraftGenerationIds = alumacraft.flatMap(entry => entry.designGenerations.map(generation => generation.id));
assert.equal(new Set(alumacraftGenerationIds).size, alumacraftGenerationIds.length, "Alumacraft generation IDs are not unique");

const dom165Audit = item("boat:Alumacraft | Dominator 165 Sport");
assert.equal(dom165Audit.designGenerations.length, 3, "Dominator 165 evidence ranges are incomplete");
assert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Length?.value, "16'7\"", "2006 Dominator 165 length is wrong");
assert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.["Bottom Thickness"]?.value, "0.100\"", "2007 Dominator 165 plating is wrong");
assert.equal(dom165Audit.designGenerations.find(g => g.startYear === 2008)?.endYear, 2013, "Dominator 165 roster continuity through 2013 is missing");

const dom175Audit = item("boat:Alumacraft | Dominator 175 Sport");
assert.equal(dom175Audit.designGenerations.length, 5, "Dominator 175 evidence ranges are incomplete");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Length?.value, "17'5\"", "2006 Dominator 175 length is wrong");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.["Max / Bow Depth"]?.value, "44\"", "2007 Dominator 175 depth is wrong");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.Persons?.value, "6", "2011 Dominator 175 capacity change is missing");
assert.equal(dom175Audit.designGenerations.find(g => g.startYear === 2012)?.endYear, 2015, "Dominator 175 production through 2015 is missing");

const dom185Audit = item("boat:Alumacraft | Dominator 185 Sport (Secondary; 175 is Primary)");
assert.equal(dom185Audit.designGenerations.length, 2, "Dominator 185 production run is incomplete");
assert.equal(dom185Audit.designGenerations[0].startYear, 2011, "Dominator 185 does not start in 2011");
assert.equal(dom185Audit.designGenerations.at(-1).endYear, 2015, "Dominator 185 production through 2015 is missing");

const nav165Audit = item("boat:Alumacraft | Navigator Sport 165");
assert.equal(nav165Audit.designGenerations[0].startYear, 2005, "Navigator 165 early production is missing");
assert.equal(nav165Audit.designGenerations.at(-1).endYear, 2013, "Navigator 165 production through 2013 is missing");
assert.equal(nav165Audit.designGenerations.find(g => g.startYear === 2010)?.specs?.Beam?.value, "91\"", "Navigator 165 exact beam is wrong");

const nav175Audit = item("boat:Alumacraft | Navigator Sport 175");
assert.equal(nav175Audit.designGenerations.length, 6, "Navigator 175 evidence ranges are incomplete");
assert.equal(nav175Audit.designGenerations[0].startYear, 2004, "Navigator 175 early production is missing");
assert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2006)?.specs?.Beam?.value, "93\"", "2006 Navigator beam is wrong");
assert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2007)?.specs?.Beam?.value, "95\"", "2007 Navigator redesign beam is wrong");
assert.equal(nav175Audit.designGenerations.find(g => g.startYear === 2011)?.specs?.["Capacity Weight"]?.value, "1,370 lb", "2011 Navigator capacity change is missing");
assert.equal(nav175Audit.designGenerations.at(-1).endYear, 2013, "Navigator 175 production through 2013 is missing");

const competitor165 = item("boat:Alumacraft | Competitor 165 Sport");
assert.equal(competitor165.designGenerations[0].startYear, 2012, "Competitor 165 start year is wrong");
assert.equal(competitor165.designGenerations.at(-1).endYear, 2019, "Competitor 165 end year is wrong");
assert.equal(competitor165.designGenerations.find(g => g.startYear === 2016)?.specs?.Beam?.value, "87\"", "Competitor 165 exact 2016 beam is missing");

const competitor175 = item("boat:Alumacraft | Competitor 175 Sport / FSX");
assert.equal(competitor175.designGenerations.find(g => g.startYear === 2016)?.specs?.Length?.value, "17'8\"", "Competitor 175 exact 2016 length is missing");
assert.equal(competitor175.designGenerations.find(g => g.startYear === 2017)?.endYear, 2024, "Competitor 175 pre-X continuity is incomplete");
assert.equal(competitor175.designGenerations.find(g => g.startYear === 2025)?.specs?.Length?.value, "19'2\"", "Competitor 175 X redesign is missing");
assert.match(competitor175.details.find(d => d.label === "Notes")?.value || "", /materially larger/i, "Competitor 175 X-platform warning is missing");

const competitor185 = item("boat:Alumacraft | Competitor 185 Sport (Secondary; 175 is Primary)");
assert.equal(competitor185.designGenerations.find(g => g.startYear === 2015)?.specs?.["Dry Hull Weight"]?.value, "1,500 lb", "Competitor 185 pre-X weight is missing");
assert.equal(competitor185.designGenerations.find(g => g.startYear === 2025)?.specs?.Length?.value, "20'2\"", "Competitor 185 X redesign is missing");

const edge175 = item("boat:Alumacraft | Edge Sport 175");
assert.equal(edge175.designGenerations[0].startYear, 2016, "Edge 175 start year is wrong");
assert.equal(edge175.designGenerations[0].endYear, 2021, "Edge 175 production through 2021 is missing");
assert.equal(edge175.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "1,488 lb", "Edge 175 dry weight is wrong");

const tournament185 = item("boat:Alumacraft | Tournament Pro 185");
assert.equal(JSON.stringify(tournament185.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[2002, 2006], [2007, 2010], [2015, 2021]]), "Tournament Pro 185 production identities are not separated");
assert.equal(tournament185.designGenerations.find(g => g.startYear === 2015)?.specs?.Beam?.value, "97\"", "Modern Tournament Pro 185 exact beam is missing");

const trophy170 = item("boat:Alumacraft | Trophy 170 (Secondary; 81-inch beam)");
assert.equal(trophy170.designGenerations.find(g => g.startYear === 1988)?.status, "model-identity-source-exhausted", "Conflicting early Trophy 170 evidence is not withheld");
assert.equal(trophy170.designGenerations.find(g => g.startYear === 1995)?.specs?.Beam?.value, "81\"", "1995 Trophy 170 exact beam is missing");
assert.equal(trophy170.designGenerations.find(g => g.startYear === 1996)?.specs?.["Dry Hull Weight"]?.value, "1,084 lb", "1996 Trophy 170 roster variation is missing");

const trophy175 = item("boat:Alumacraft | Trophy 175 Sport");
assert.equal(trophy175.designGenerations.find(g => g.startYear === 2007)?.endYear, 2024, "Trophy 175 pre-X generation is incomplete");
assert.equal(trophy175.designGenerations.find(g => g.startYear === 2007)?.specs?.Beam?.value, "94\"", "Trophy 175 pre-X beam is missing");
assert.equal(trophy175.designGenerations.find(g => g.startYear === 2025)?.specs?.Length?.value, "19'2\"", "Trophy 175X redesign is missing");

const trophy185 = item("boat:Alumacraft | Trophy 185 Sport (Secondary; 175 is Primary)");
assert.equal(trophy185.designGenerations.find(g => g.startYear === 2007)?.specs?.Length?.value, "18'8\"", "Trophy 185 pre-X length is wrong");
assert.equal(trophy185.designGenerations.find(g => g.startYear === 2007)?.specs?.Beam?.value, "98\"", "Trophy 185 pre-X beam is wrong");
assert.equal(trophy185.designGenerations.find(g => g.startYear === 2007)?.specs?.["Dry Hull Weight"]?.value, "1,780 lb", "Trophy 185 pre-X hull weight is wrong");
assert.equal(trophy185.designGenerations.find(g => g.startYear === 2025)?.specs?.Length?.value, "20'2\"", "Trophy 185X redesign is missing");

const voyageur175 = item("boat:Alumacraft | Voyageur 175 Sport");
assert.equal(voyageur175.designGenerations.length, 1, "Voyageur 175 should close as one documented generation");
assert.equal(voyageur175.designGenerations[0].startYear, 2014, "Voyageur 175 start year is wrong");
assert.equal(voyageur175.designGenerations[0].endYear, 2026, "Voyageur 175 current continuity is incomplete");
assert.equal(voyageur175.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "1,070 lb", "Voyageur 175 dry weight is wrong");

const magnumCs = item("boat:Alumacraft | Magnum CS (side-console series; no walk-through windshield)");
assert.equal(magnumCs.lowPrice, null, "Magnum CS rejection row retained a blended low price");
assert.equal(magnumCs.highPrice, null, "Magnum CS rejection row retained a blended high price");
assert.equal(magnumCs.designGenerations.length, 1, "Magnum CS rejection row has unexpected generations");
assert.equal(magnumCs.designGenerations[0].status, "family-umbrella-rejection", "Magnum CS is not explicitly a family-level rejection row");

// Strict Crestliner and Smoker Craft existing-model completion audit.
function assertStrictMaker(maker, expectedRecords, expectedGenerations, idealIds) {
  const rows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === maker);
  assert.equal(rows.length, expectedRecords, `${maker} existing-model scope changed`);
  assert.equal(
    rows.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
    expectedGenerations,
    `${maker} generation/evidence-row count changed without updating the strict audit`
  );
  assert.ok(rows.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0), `${maker} retained unsafe top-level value eras`);
  for (const entry of rows) {
    assert.ok(Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1, `${entry.id} lacks canonical generation metadata`);
    assert.equal(Boolean(entry.idealMatch), idealIds.has(entry.id), `${entry.id} ideal-match marker is wrong`);
    assert.equal(entry.model.startsWith("*"), idealIds.has(entry.id), `${entry.id} compact model star is wrong`);
    assert.equal(entry.displayName.startsWith("*"), idealIds.has(entry.id), `${entry.id} compact display star is wrong`);
    for (const generation of entry.designGenerations) {
      assert.notEqual(generation.status, "unresolved", `${entry.id} still contains an unresolved generation`);
      if (["alias-only", "family-umbrella-rejection"].includes(generation.status)) continue;
      assert.ok(
        Array.isArray(generation.eras) && generation.eras.some(era => Number.isFinite(era.low) && Number.isFinite(era.high)),
        `${entry.id} ${generation.id} lacks a used complete-package range`
      );
      for (const era of generation.eras) {
        assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
        assert.ok(
          Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear)
          && era.startYear >= generation.startYear && era.endYear <= generation.endYear,
          `${era.id} falls outside its generation`
        );
      }
    }
  }
  return rows;
}

const crestlinerIdealIds = new Set([
  "boat:Crestliner | Fish Hawk 1700 WT",
  "boat:Crestliner | Fish Hawk 1750 WT / full-windshield DC",
  "boat:Crestliner | Sport Angler 1750",
  "boat:Crestliner | Super Hawk 1700 WT"
]);
const smokerIdealIds = new Set([
  "boat:Smoker Craft | Millentia 172 WT",
  "boat:Smoker Craft | Pro Angler 172 (Primary; not Lund Pro Angler)",
  "boat:Smoker Craft | Pro Angler 172 XL",
  "boat:Smoker Craft | Ultima 172"
]);
const crestliner = assertStrictMaker("Crestliner", 15, 34, crestlinerIdealIds);
const smokerCraft = assertStrictMaker("Smoker Craft", 18, 70, smokerIdealIds);

const fishHawk1700 = item("boat:Crestliner | Fish Hawk 1700 WT");
assert.equal(fishHawk1700.designGenerations.length, 1, "Fish Hawk 1700 should close as one 2007-2010 generation");
assert.equal(JSON.stringify([fishHawk1700.designGenerations[0].startYear, fishHawk1700.designGenerations[0].endYear]), JSON.stringify([2007, 2010]), "Fish Hawk 1700 production span is wrong");
assert.equal(fishHawk1700.designGenerations[0].specs?.["Bottom Thickness"]?.value, "0.090\"", "Fish Hawk 1700 bottom gauge is wrong");

const fishHawk1750 = item("boat:Crestliner | Fish Hawk 1750 WT / full-windshield DC");
assert.equal(Math.min(...fishHawk1750.designGenerations.map(g => g.startYear)), 2002, "Fish Hawk 1750 early production is missing");
assert.equal(Math.max(...fishHawk1750.designGenerations.map(g => g.endYear)), 2026, "Fish Hawk 1750 current production is incomplete");
assert.equal(fishHawk1750.designGenerations.find(g => g.startYear === 2024)?.specs?.Length?.value, "17'7\"", "Current Fish Hawk 1750 AP-X length is missing");

const fishHawk1850 = item("boat:Crestliner | Fish Hawk 1850 WT");
assert.equal(fishHawk1850.designGenerations.length, 3, "Fish Hawk 1850 early, heavier and AP-X generations are not separated");
assert.equal(fishHawk1850.designGenerations.find(g => g.startYear === 2024)?.specs?.["Dry Hull Weight"]?.value, "1,527–1,689 lb by SC/WT configuration", "Current Fish Hawk 1850 weight range is missing");

const phantomV160 = item("boat:Crestliner | Phantom Sportfish V160");
const phantomV170 = item("boat:Crestliner | Phantom Sportfish V170");
const phantomV180 = item("boat:Crestliner | Phantom Sportfish V180");
assert.equal(phantomV160.designGenerations[0].specs?.Beam?.value, "78\"", "Phantom V160 beam correction is missing");
assert.equal(phantomV170.designGenerations[0].specs?.Beam?.value, "83\"", "Phantom V170 beam correction is missing");
assert.equal(phantomV180.designGenerations[0].specs?.Beam?.value, "87\"", "Phantom V180 beam correction is missing");

const sportfish1750 = item("boat:Crestliner | Sportfish 1750");
assert.equal(Math.min(...sportfish1750.designGenerations.map(g => g.startYear)), 2000, "Sportfish 1750 outboard start year is wrong");
assert.equal(Math.max(...sportfish1750.designGenerations.map(g => g.endYear)), 2005, "Sportfish 1750 outboard end year is wrong");
assert.doesNotMatch(sportfish1750.subtitle, /199[0-9]/, "Sportfish 1750 still mixes in the older V175 sterndrive");

const sportfish1850 = item("boat:Crestliner | Sportfish 1850");
assert.equal(JSON.stringify(sportfish1850.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[2000, 2014], [2015, 2023], [2024, 2026]]), "Sportfish 1850 generation boundaries are incomplete");
assert.equal(sportfish1850.designGenerations.find(g => g.startYear === 2024)?.specs?.Length?.value, "18'11\"", "Current Sportfish 1850 length is wrong");

const superHawk1700 = item("boat:Crestliner | Super Hawk 1700 WT");
assert.equal(Math.max(...superHawk1700.designGenerations.map(g => g.endYear)), 2012, "Super Hawk 1700 production end is incomplete");
assert.equal(superHawk1700.designGenerations.find(g => g.startYear === 2008)?.specs?.["Capacity Weight"]?.value, "1,305 lb", "Super Hawk 1700 capacity is wrong");
const superHawk1800 = item("boat:Crestliner | Super Hawk 1800 WT");
assert.equal(Math.max(...superHawk1800.designGenerations.map(g => g.endYear)), 2012, "Super Hawk 1800 should end before the 1850 replacement");
const vision1600 = item("boat:Crestliner | Vision 1600 WT");
const vision1700 = item("boat:Crestliner | Vision 1700 WT");
assert.equal(JSON.stringify(vision1600.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[2014, 2015], [2016, 2018]]), "Vision 1600 span is incomplete");
assert.equal(JSON.stringify(vision1700.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[2015, 2015], [2016, 2018]]), "Vision 1700 span is incomplete");

const fazer172Audit = item("boat:Smoker Craft | Fazer 172");
assert.equal(Math.max(...fazer172Audit.designGenerations.map(g => g.endYear)), 1995, "Fazer 172 incorrectly continues beyond 1995");
assert.equal(fazer172Audit.designGenerations.find(g => g.startYear === 1995)?.specs?.Length?.value, "17'5\"", "1995 Fazer 172 length is wrong");
const fazer178Audit = item("boat:Smoker Craft | Fazer 178");
assert.equal(JSON.stringify([fazer178Audit.designGenerations[0].startYear, fazer178Audit.designGenerations[0].endYear]), JSON.stringify([1998, 1999]), "Fazer 178 production span is wrong");
const fazer192Audit = item("boat:Smoker Craft | Fazer 192");
assert.equal(JSON.stringify(fazer192Audit.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[1993, 1994], [1995, 1995], [1996, 1999]]), "Fazer 192 span is incomplete");

const millentia182Audit = item("boat:Smoker Craft | Millentia 182 WT");
assert.equal(millentia182Audit.designGenerations[0].status, "alias-only", "Millentia 182 was not retained as an alias-only rejection row");
assert.equal(millentia182Audit.lowPrice, null, "Millentia 182 alias retained a low price");
const phaserAudit = item("boat:Smoker Craft | Phaser (seller spelling; likely Fazer)");
assert.equal(phaserAudit.designGenerations[0].status, "alias-only", "Phaser row is not alias-only");
assert.equal(phaserAudit.lowPrice, null, "Phaser alias retained a price");

const proAngler172Audit = item("boat:Smoker Craft | Pro Angler 172 (Primary; not Lund Pro Angler)");
assert.equal(Math.min(...proAngler172Audit.designGenerations.map(g => g.startYear)), 2004, "Pro Angler 172 start year is incomplete");
assert.equal(Math.max(...proAngler172Audit.designGenerations.map(g => g.endYear)), 2024, "Pro Angler 172 should close before the current 165-only line");
const proAngler182Audit = item("boat:Smoker Craft | Pro Angler 182 XL (Secondary; 172/172 XL are Primary)");
assert.equal(proAngler182Audit.designGenerations.find(g => g.startYear === 2025)?.specs?.Length?.value, "18'2\"", "Current Pro Angler 182 XL length change is missing");

const ultima172Audit = item("boat:Smoker Craft | Ultima 172");
assert.equal(Math.min(...ultima172Audit.designGenerations.map(g => g.startYear)), 2005, "Ultima 172 start year is incomplete");
assert.equal(Math.max(...ultima172Audit.designGenerations.map(g => g.endYear)), 2026, "Ultima 172 current production is incomplete");
assert.equal(ultima172Audit.designGenerations.find(g => g.startYear === 2014)?.specs?.Beam?.value, "96\"", "2014 Ultima 172 redesign beam is missing");
const ultima175Audit = item("boat:Smoker Craft | Ultima 175");
assert.equal(JSON.stringify(ultima175Audit.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[1994, 1994], [1995, 1995], [1996, 1999]]), "Ultima 175 1994-1999 history is incomplete");
const ultima178Audit = item("boat:Smoker Craft | Ultima 178");
assert.equal(ultima178Audit.designGenerations[0].status, "model-identity-source-exhausted", "Ultima 178 should remain source-exhausted rather than inherit specifications");
assert.ok(Number.isFinite(ultima178Audit.designGenerations[0].eras[0].low), "Ultima 178 source-exhausted row lacks a market range");
const ultima182Audit = item("boat:Smoker Craft | Ultima 182 (Secondary; 172 is Primary)");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-2018-standard"))?.specs?.Length?.value, "18'5\"", "Standard Ultima 182 length is wrong");
assert.equal(ultima182Audit.designGenerations.find(g => g.id.endsWith(":gen:2016-se"))?.specs?.Length?.value, "18'2\"", "Parallel 2016 Ultima 182SE variation is missing");

// Focused Sylvan, Starcraft and Starweld app-model audit.
const nextMakers = new Map([["Sylvan",16],["Starcraft",14],["Starweld",3]]);
for (const [maker,count] of nextMakers) {
  const rows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === maker);
  assert.equal(rows.length,count,"Focused " + maker + " app-model scope changed without updating the audit");
  assert.ok(rows.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),maker + " record lacks generation metadata");
  assert.ok(rows.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0),maker + " retained unsafe top-level value eras");
  for (const entry of rows) for (const generation of entry.designGenerations) if (generation.status === "unresolved") {
    assert.equal(Object.keys(generation.specs || {}).length,0,entry.id + " unresolved generation inherited specs");
    assert.equal((generation.eras || []).length,0,entry.id + " unresolved generation inherited price");
  }
}
const sylvanRows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Sylvan");
const sylvanUnresolved = sylvanRows.flatMap(entry =>
  entry.designGenerations.filter(generation => generation.status === "unresolved").map(generation => ({ entry, generation }))
);
assert.equal(sylvanUnresolved.length, 0, "Sylvan still contains unresolved generation rows");
for (const entry of sylvanRows) {
  const closedWithoutPricing = entry.designGenerations.every(generation =>
    ["alias-only", "family-umbrella-rejection"].includes(generation.status)
  );
  if (!closedWithoutPricing) {
    assert.ok(
      entry.designGenerations.every(generation =>
        Array.isArray(generation.eras)
        && generation.eras.some(era => Number.isFinite(era.low) && Number.isFinite(era.high))
      ),
      `${entry.id} has a physical generation without a used-package value range`
    );
  }
}

const sylTroller = item("boat:Sylvan | Sport Troller 1600 TL (Secondary; not Sylvan Pro Sport)");
assert.equal(
  JSON.stringify(sylTroller.designGenerations.map(g => [g.startYear, g.endYear])),
  JSON.stringify([[1985, 1993], [1994, 2005], [2006, 2008], [2009, 2012]]),
  "Sport Troller production span or redesign boundaries are incomplete"
);
assert.equal(sylTroller.designGenerations.find(g => g.startYear === 2006)?.specs?.Beam?.value, "69\"", "2006-2008 Sport Troller beam is wrong");
assert.equal(sylTroller.designGenerations.find(g => g.startYear === 2009)?.specs?.Beam?.value, "81\"", "2009 Sport Troller redesign is missing");

const sylExplorer = item("boat:Sylvan | Explorer 1600 DC");
assert.equal(sylExplorer.designGenerations.find(g => g.startYear === 2002)?.specs?.["Dry Hull Weight"]?.value, "785 lb", "2002-2005 Explorer weight is missing");
assert.equal(sylExplorer.designGenerations.find(g => g.startYear === 2006)?.specs?.["Dry Hull Weight"]?.value, "880 lb", "2006 Explorer revision is missing");
assert.equal(sylExplorer.designGenerations.find(g => g.startYear === 2011)?.specs?.["Dry Hull Weight"]?.value, "900 lb", "2011 Explorer revision is missing");

const sylSS18 = item("boat:Sylvan | Super Sportster 18 OB");
assert.equal(sylSS18.designGenerations.find(g => g.startYear === 1983)?.specs?.["Dry Hull Weight"]?.value, "1,020 lb", "Early Super Sportster 18 weight is missing");
assert.equal(sylSS18.designGenerations.find(g => g.startYear === 1988)?.specs?.["Dry Hull Weight"]?.value, "990 lb", "1988 Super Sportster 18 revision is missing");

const sylAdv = item("boat:Sylvan | Adventurer 1700 DC");
assert.equal(sylAdv.designGenerations.find(g => g.startYear === 2000)?.specs?.["Dry Hull Weight"]?.value, "1,260 lb", "2000 18-foot Adventurer predecessor is missing");
assert.equal(sylAdv.designGenerations.find(g => g.startYear === 2006)?.specs?.["Dry Hull Weight"]?.value, "1,220 lb", "2006 17-foot Adventurer return is missing");
assert.equal(sylAdv.designGenerations.find(g => g.startYear === 2011)?.specs?.["Dry Hull Weight"]?.value, "1,325 lb", "2011 Adventurer weight change is missing");

const sylProFish = item("boat:Sylvan | Pro Fish 1700 DC");
assert.equal(sylProFish.designGenerations.length, 1, "Pro Fish 1700 should close as the 2003-2005 generation");
assert.equal(sylProFish.designGenerations[0].startYear, 2003, "Pro Fish 1700 start year is wrong");
assert.equal(sylProFish.designGenerations[0].endYear, 2005, "Pro Fish 1700 inherited later Pro Sport years");

const sylSelect16 = item("boat:Sylvan | Pro Select Dual 16");
assert.equal(Math.min(...sylSelect16.designGenerations.map(g => g.startYear)), 1993, "Pro Select Dual 16 start year is incomplete");
assert.equal(Math.max(...sylSelect16.designGenerations.map(g => g.endYear)), 1998, "Pro Select Dual 16 end year is incomplete");
const sylSelect17 = item("boat:Sylvan | Pro Select Dual 17");
assert.equal(Math.min(...sylSelect17.designGenerations.map(g => g.startYear)), 1993, "Pro Select Dual 17 start year is incomplete");
assert.equal(Math.max(...sylSelect17.designGenerations.map(g => g.endYear)), 1999, "Pro Select Dual 17 end year is incomplete");

const sylViper = item("boat:Sylvan | Viper (bass-boat series; no walk-through windshield)");
assert.equal(sylViper.lowPrice, null, "Viper family rejection retained a price");
assert.equal(sylViper.designGenerations[0].status, "family-umbrella-rejection", "Viper is not a family rejection");
const sc186 = item("boat:Starcraft | Superfisherman 186 (Secondary; 176 is Primary)");
assert.equal(sc186.designGenerations.find(g=>g.startYear===2011)?.specs?.["Dry Hull Weight"]?.value,"1,333 lb","2011-2016 Superfisherman 186 exact weight is missing");
const stx2050 = item("boat:Starcraft | STX 2050 Aluminum");
assert.equal(stx2050.designGenerations.find(g=>g.startYear===2010)?.specs?.["Dry Hull Weight"]?.value,"1,535 lb","2010-2014 STX weight is wrong");
assert.equal(stx2050.designGenerations.find(g=>g.startYear===2015)?.specs?.["Dry Hull Weight"]?.value,"1,650 lb","2015 STX weight change is missing");
const sw16 = item("boat:Starweld | Fusion 16 DC");
assert.ok(sw16.designGenerations.find(g=>g.startYear===2021)?.eras.every(e=>e.startYear===2021),"Fusion 16 inherited pre-2021 pricing");

// Strict Starcraft and Starweld completion pass.
const starcraftRows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Starcraft");
const starweldRows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Starweld");
for (const [maker, rows, expected] of [["Starcraft", starcraftRows, 14], ["Starweld", starweldRows, 3]]) {
  assert.equal(rows.length, expected, `${maker} existing-model scope changed`);
  const unresolved = rows.flatMap(entry => entry.designGenerations.filter(generation => generation.status === "unresolved"));
  assert.equal(unresolved.length, 0, `${maker} still contains unresolved generation rows`);
  for (const entry of rows) {
    for (const generation of entry.designGenerations) {
      assert.ok(
        Array.isArray(generation.eras)
        && generation.eras.some(era => Number.isFinite(era.low) && Number.isFinite(era.high)),
        `${entry.id} ${generation.id} lacks a used complete-package range`
      );
      for (const era of generation.eras) {
        assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} falls outside its generation`);
        assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
      }
    }
  }
}
assert.equal(
  starcraftRows.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
  38,
  "Starcraft generation count changed without updating the strict audit"
);
assert.equal(
  starweldRows.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
  7,
  "Starweld generation count changed without updating the strict audit"
);
const idealStarIds = new Set([
  "boat:Starcraft | Starfish 176 DC / WT",
  "boat:Starcraft | Superfisherman 176",
  "boat:Starweld | 1700 DC / WT"
]);
for (const entry of [...starcraftRows, ...starweldRows]) {
  assert.equal(Boolean(entry.idealMatch), idealStarIds.has(entry.id), `${entry.id} ideal-match marker is wrong`);
  assert.equal(entry.model.startsWith("*"), idealStarIds.has(entry.id), `${entry.id} compact model star is wrong`);
  assert.equal(entry.displayName.startsWith("*"), idealStarIds.has(entry.id), `${entry.id} compact display star is wrong`);
}
const sc176Strict = item("boat:Starcraft | Superfisherman 176");
assert.equal(sc176Strict.designGenerations.length, 1, "Superfisherman 176 should close as one 2011-2016 physical generation");
assert.equal(sc176Strict.designGenerations[0].startYear, 2011, "Superfisherman 176 start year is wrong");
assert.equal(sc176Strict.designGenerations[0].endYear, 2016, "Superfisherman 176 end year is wrong");
assert.equal(sc176Strict.designGenerations[0].specs.Beam.value, '100"', "Superfisherman 176 beam is wrong");
const sc186Strict = item("boat:Starcraft | Superfisherman 186 (Secondary; 176 is Primary)");
assert.equal(sc186Strict.designGenerations.find(g => g.startYear === 2025)?.status, "factory-current-conflicted", "Current Superfisherman 186 conflict is not documented");
assert.ok(!sc186Strict.designGenerations.find(g => g.startYear === 2025)?.specs?.["Dry Hull Weight"], "Conflicted current Superfisherman 186 dry weight leaked into specs");
const scExplorerStrict = item("boat:Starcraft | Explorer 160 DC (Secondary; not Lund Explorer Sport, Primary)");
assert.equal(scExplorerStrict.designGenerations.find(g => g.startYear === 2013)?.endYear, 2014, "Explorer 160 2013-2014 generation is incomplete");
assert.equal(scExplorerStrict.designGenerations.find(g => g.startYear === 2015)?.specs?.["Dry Hull Weight"]?.value, "935 lb", "Explorer 160 2015 revision is missing");
const sw1700Strict = item("boat:Starweld | 1700 DC / WT");
assert.equal(sw1700Strict.designGenerations.length, 1, "Starweld 1700 should close as one 2013-2016 generation");
assert.equal(sw1700Strict.designGenerations[0].endYear, 2016, "Starweld 1700 production end is incomplete");
assert.equal(sw1700Strict.designGenerations[0].specs?.Beam?.value, '90"', "Starweld 1700 beam is missing");

// All-manufacturer generation-safety audit.
const allBoats = catalog.items.filter(entry => entry.categoryId === "boats");
assert.ok(
  allBoats.every(entry => Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1),
  "One or more app boat record lacks canonical design-generation metadata"
);
for (const entry of allBoats) {
  for (const generation of entry.designGenerations) {
    if (generation.status !== "unresolved") continue;
    assert.equal(Object.keys(generation.specs || {}).length, 0, `${entry.id} unresolved generation inherited specifications`);
    assert.equal((generation.eras || []).length, 0, `${entry.id} unresolved generation inherited pricing`);
  }
}
assert.ok(
  allBoats.filter(entry => entry.manufacturer !== "Lund" && entry.manufacturer !== "Alumacraft").every(entry => entry.valueEras.length === 0),
  "A newly safeguarded manufacturer retained unsafe top-level value eras"
);

const dualImpact = item("boat:MirroCraft | Dual Impact 176");
assert.equal(dualImpact.designGenerations.length, 2, "Dual Impact generations are not stored with the boat data");
assert.doesNotMatch(appSource, /const DD=|,DD=/, "Model-generation data remains embedded in the controller");
assert.match(appSource, /i\.designGenerations/, "Controller does not read canonical design generations");
assert.match(appSource, /i\.valueEras/, "Controller does not read canonical value eras");
assert.ok(!appSource.includes("eras(i).length>1"), "Price decades are still treated as redesign evidence");

assert.ok(appSource.includes("currentEstimate.v6"), "Current estimate storage version is not v6");
assert.ok(appSource.includes("function gens("), "Generation resolver is missing");
assert.ok(appSource.includes("function missing("), "Required generation and era gate is missing");
assert.ok(appSource.includes("function controls("), "Generation, era and trailer controls are missing");
assert.doesNotMatch(appSource, /data-select=/, "Model-list estimate checkbox returned");
assert.doesNotMatch(appSource, /Price pending/, "Misleading Price pending text remains in the controller");
assert.match(appSource, /Year \/ hull/, "Combined year and hull selector is missing");
assert.doesNotMatch(appSource, /<span>Hull generation<\/span>/, "Separate hull-generation selector remains");
assert.doesNotMatch(appSource, /<span>Age \/ era<\/span>/, "Separate age-era selector remains");
assert.match(appSource, /Package condition/, "Package-condition selector is missing");
assert.match(appSource, /Excellent \/ turnkey/, "Excellent condition guidance is missing");
assert.match(appSource, /Project \/ poor or unknown/, "Project/manual-evaluation condition is missing");
assert.match(appSource, /window\.scrollTo\(0,0\)/, "Route rendering does not reset the page to the top");

const osprey172Ui = item("boat:Smoker Craft | Osprey 172 WT (Secondary; qualifying WT is 2020s)");
const osprey172Early = osprey172Ui.designGenerations.find(g => g.startYear === 2009 && g.endYear === 2016);
assert.equal(JSON.stringify(osprey172Early.eras.map(e => [e.startYear,e.endYear])), JSON.stringify([[2009,2012],[2013,2016]]), "Osprey 172 early value era remains excessively broad");
assert.equal(JSON.stringify(osprey172Early.eras.map(e => [e.low,e.high])), JSON.stringify([[7000,10500],[10000,15000]]), "Osprey 172 split pricing is wrong");
const osprey162Ui = item("boat:Smoker Craft | Osprey 162 WT (Secondary; wide WT version is 2020s)");
const osprey162Early = osprey162Ui.designGenerations.find(g => g.startYear === 2009 && g.endYear === 2016);
assert.equal(JSON.stringify(osprey162Early.eras.map(e => [e.startYear,e.endYear])), JSON.stringify([[2009,2012],[2013,2016]]), "Osprey 162 early value era remains excessively broad");

assert.match(
  htmlSource,
  /data\/boats\.js[^]*data\/equipment\.js[^]*data\/catalog\.js[^]*app\.js/,
  "Canonical data files do not load before the controller"
);
assert.doesNotMatch(htmlSource, /corrections/i, "A corrections overlay is still loaded");
assert.match(htmlSource, /id="home-button"/, "Home button is missing");
assert.match(htmlSource, /id="estimate-button"/, "Estimate button is missing");
assert.match(htmlSource, /id="clear-estimate-button"/, "Clear estimate button is missing");

assert.match(
  cssSource,
  /\.header-estimate-button\s*\{[^]*?grid-column:\s*2;/,
  "Estimate button is not centered in header column 2"
);
assert.match(
  cssSource,
  /\.clear-estimate-button\s*\{[^]*?grid-column:\s*3;/,
  "Clear estimate is not placed on the right"
);

console.log(
  `BoatBuilder QA passed: ${catalog.items.length} items, ${catalog.counts.boats} boats, ${catalog.counts.equipment} equipment records.`
);
console.log("Verified canonical app data, focused Lund and Alumacraft generations, structured value eras, data-backed hull generations, and no runtime correction overlay.");
