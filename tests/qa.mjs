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

// Strict Lund existing-model hidden-gap completion audit.
const lund = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Lund");
assert.equal(lund.length, 28, "Focused Lund app-model scope changed without updating the audit");
assert.equal(
  lund.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
  55,
  "Lund generation/evidence-row count changed without updating the strict audit"
);
assert.ok(lund.every(entry => Array.isArray(entry.valueEras) && entry.valueEras.length === 0), "A Lund record retained unsafe top-level value eras");
const lundIdealIds = new Set([
  "boat:Lund | Explorer Sport 1725 (Primary; not Starcraft Explorer 160 or Fish-Rite Explorer)",
  "boat:Lund | Explorer Sport 1825",
  "boat:Lund | Fisherman 1750 (Pro Fisherman-era name)",
  "boat:Lund | Fisherman 1800 OB / full-windshield",
  "boat:Lund | Impact Sport 1775",
  "boat:Lund | Pro-V 1800 SE (Primary; exact SE full-windshield version)",
  "boat:Lund | Tyee 1700 (Primary; not the much heavier 1850 ITS/I-O)",
  "boat:Lund | Tyee 1750"
]);
for (const entry of lund) {
  assert.ok(Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1, `${entry.id} lacks canonical generations`);
  assert.equal(Boolean(entry.idealMatch), lundIdealIds.has(entry.id), `${entry.id} ideal-match marker is wrong`);
  assert.equal(entry.model.startsWith("*"), lundIdealIds.has(entry.id), `${entry.id} model star is wrong`);
  assert.equal(entry.displayName.startsWith("Lund | *"), lundIdealIds.has(entry.id), `${entry.id} display-name star is wrong`);
  let priorEnd = -Infinity;
  for (const generation of entry.designGenerations) {
    assert.notEqual(generation.status, "unresolved", `${generation.id} is still unresolved`);
    assert.ok(Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear), `${generation.id} lacks closed year boundaries`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has reversed years`);
    assert.ok(generation.startYear > priorEnd, `${entry.id} has overlapping generation rows`);
    priorEnd = generation.endYear;
    assert.ok(Array.isArray(generation.eras) && generation.eras.length >= 1, `${generation.id} lacks package values`);
    for (const era of generation.eras) {
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid pricing`);
      assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} falls outside its generation`);
    }
  }
}

const adventure = item("boat:Lund | Adventure Sport 1675");
assert.equal(JSON.stringify(adventure.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2020,2023],[2024,2026]]), "Adventure 1675 redesign boundary is wrong");
assert.match(adventure.designGenerations[1].specs?.Construction?.value || "", /wood-free/i, "Adventure wood-free redesign is missing");

const oldAlaskan = item("boat:Lund | Alaskan 1800 Sport");
assert.equal(JSON.stringify(oldAlaskan.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2003,2003],[2019,2020],[2021,2023]]), "Alaskan Sport discontinuous lineage is wrong");

const crossover1775 = item("boat:Lund | Crossover XS 1775");
assert.equal(crossover1775.designGenerations.at(-1).startYear, 2026, "Crossover 1775 current redesign is not separated");
assert.equal(crossover1775.designGenerations.at(-1).specs?.["Dry Hull Weight"]?.value, "1,625 lb", "Crossover 1775 current weight is wrong");

const fisherman1800 = item("boat:Lund | Fisherman 1800 OB / full-windshield");
assert.equal(fisherman1800.designGenerations.length, 3, "Fisherman 1800 historical weight changes are not separated");
assert.equal(fisherman1800.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "1,291 lb", "Early Fisherman 1800 weight is missing");

const impact = item("boat:Lund | Impact Sport 1775");
assert.equal(JSON.stringify(impact.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2012,2017],[2018,2021]]), "Impact 1775 redesign split is wrong");
assert.match(impact.details.find(d => d.label === "Notes")?.value || "", /full windshield/i, "Impact recommendation note is incomplete");

const mrPike = item("boat:Lund | Mr Pike 17");
assert.equal(mrPike.designGenerations.length, 3, "Mr Pike 17 production variations are incomplete");
assert.match(mrPike.details.find(d => d.label === "Notes")?.value || "", /listing photos/i, "Mr Pike layout warning is missing");

const proV1775 = item("boat:Lund | Pro-V 1775 (non-walk-through configurations)");
assert.equal(proV1775.designGenerations.length, 5, "Pro-V 1775 history is still compressed");
assert.match(proV1775.details.find(d => d.label === "Notes")?.value || "", /non-walk-through/i, "Pro-V 1775 layout rejection is missing");

const proV1800 = item("boat:Lund | Pro-V 1800 SE (Primary; exact SE full-windshield version)");
assert.equal(proV1800.designGenerations[0].startYear, 2003, "Pro-V 1800 SE start year is wrong");
assert.equal(proV1800.designGenerations[0].endYear, 2010, "Pro-V 1800 SE end year is wrong");

const tyee1700 = item("boat:Lund | Tyee 1700 (Primary; not the much heavier 1850 ITS/I-O)");
assert.equal(JSON.stringify(tyee1700.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[1997,1997],[2011,2012]]), "Tyee 1700 discontinuous evidence is still falsely continuous");

const tyeeIo = item("boat:Lund | Tyee 1850 I/O / ITS (older generation)");
assert.match(tyeeIo.details.find(d => d.label === "Notes")?.value || "", /Not recommended/i, "I/O Tyee warning is missing");
assert.ok(tyeeIo.designGenerations[0].eras.every(e => Number.isFinite(e.low) && Number.isFinite(e.high)), "I/O Tyee lacks screening pricing");

const currentTyee = item("boat:Lund | Tyee 1875 Sport (current generation)");
assert.equal(JSON.stringify(currentTyee.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2021,2026]]), "Current Tyee platform was split on a capacity figure rather than a hull redesign");
assert.equal(currentTyee.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "1,760 lb", "Current Tyee standard boat weight is missing");
assert.equal(currentTyee.designGenerations[0].specs?.["Capacity Weight"]?.value, "1,950 lb", "Current Tyee maximum weight capacity is missing");
assert.equal(currentTyee.designGenerations[0].eras.length, 2, "Current Tyee price eras should not create false hull generations");

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

// Strict Princecraft existing-model completion audit.
const princecraftRows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Princecraft");
assert.equal(princecraftRows.length, 9, "Focused Princecraft app-model scope changed without updating the audit");
assert.equal(
  princecraftRows.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
  19,
  "Princecraft generation/evidence-row count changed without updating the strict audit"
);
assert.equal(
  princecraftRows.flatMap(entry => entry.designGenerations.flatMap(generation => generation.eras || [])).length,
  28,
  "Princecraft value-era count changed without updating the strict audit"
);
const princecraftIdealIds = new Set([
  "boat:Princecraft | Nanook 168 DLX WS",
  "boat:Princecraft | Pro 179 WS",
  "boat:Princecraft | Sport 172 (Primary; Princecraft model, not a generic Sport trim)",
  "boat:Princecraft | Super Pro 176",
  "boat:Princecraft | Sport 167 / Sport 164",
  "boat:Princecraft | Xpedition 170 WS"
]);
for (const entry of princecraftRows) {
  assert.ok(Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1, `${entry.id} lacks Princecraft generations`);
  assert.equal(entry.valueEras.length, 0, `${entry.id} retained unsafe top-level value eras`);
  assert.equal(Boolean(entry.idealMatch), princecraftIdealIds.has(entry.id), `${entry.id} ideal-match marker is wrong`);
  assert.equal(entry.model.startsWith("*"), princecraftIdealIds.has(entry.id), `${entry.id} compact model star is wrong`);
  assert.equal(entry.displayName.startsWith("*"), princecraftIdealIds.has(entry.id), `${entry.id} compact display star is wrong`);
  for (const generation of entry.designGenerations) {
    assert.notEqual(generation.status, "unresolved", `${entry.id} still has an unresolved generation`);
    assert.ok(
      Array.isArray(generation.eras) && generation.eras.some(era => Number.isFinite(era.low) && Number.isFinite(era.high)),
      `${generation.id} lacks numeric complete-package pricing`
    );
    for (const era of generation.eras) {
      assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} falls outside its Princecraft generation`);
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid Princecraft pricing`);
    }
  }
}
const pcHoliday = item("boat:Princecraft | Holiday 162 WS");
assert.equal(JSON.stringify(pcHoliday.designGenerations.map(g => [g.startYear, g.endYear])), JSON.stringify([[2012,2012],[2013,2016],[2017,2019],[2020,2024]]), "Holiday 162 WS boundaries are incomplete");
assert.equal(pcHoliday.designGenerations.find(g => g.startYear === 2012)?.specs?.["Max HP"]?.value, "60", "2012 Holiday lower horsepower certification is missing");
assert.equal(pcHoliday.designGenerations.find(g => g.startYear === 2020)?.specs?.Beam?.value, '85"', "2020 Holiday wider hull is missing");
assert.equal(pcHoliday.designGenerations.find(g => g.startYear === 2020)?.specs?.["Dry Hull Weight"]?.value, "960 lb", "2020 Holiday weight change is missing");
const pcNanook = item("boat:Princecraft | Nanook 168 DLX WS");
assert.equal(pcNanook.designGenerations.find(g => g.startYear === 2017)?.specs?.["Bottom Thickness"]?.value, '.087"', "Nanook 2017 plating revision is missing");
assert.equal(Math.max(...pcNanook.designGenerations.map(g => g.endYear)), 2023, "Nanook production end is incomplete");
const pcPlatinum = item("boat:Princecraft | Platinum SE 176");
assert.equal(Math.max(...pcPlatinum.designGenerations.map(g => g.endYear)), 2019, "Platinum SE 176 production end is incomplete");
assert.equal(pcPlatinum.designGenerations.find(g => g.startYear === 2018)?.specs?.["Fuel Capacity"]?.value, "37 gal", "Platinum 2018 fuel revision is missing");
const pcPro179 = item("boat:Princecraft | Pro 179 WS");
assert.equal(JSON.stringify(pcPro179.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2009,2011]]), "Pro 179 WS short production lineage is wrong");
const pcSport172 = item("boat:Princecraft | Sport 172 (Primary; Princecraft model, not a generic Sport trim)");
assert.equal(pcSport172.designGenerations.length, 4, "Sport 172 redesign/certification rows are incomplete");
assert.equal(pcSport172.designGenerations.find(g => g.startYear === 2010)?.specs?.Beam?.value, '92"', "Early Sport 172 beam is missing");
assert.equal(pcSport172.designGenerations.find(g => g.startYear === 2012)?.specs?.["Dry Hull Weight"]?.value, "1,255 lb", "2012 Sport 172 hull change is missing");
assert.equal(pcSport172.designGenerations.find(g => g.startYear === 2017)?.specs?.["Dry Hull Weight"]?.value, "1,377 lb", "2017 Sport 172 weight change is missing");
assert.equal(pcSport172.designGenerations.find(g => g.startYear === 2023)?.specs?.["Max HP"]?.value, "150", "2023 Sport 172 horsepower certification is missing");
const pcSport187 = item("boat:Princecraft | Sport 187 (Secondary; Sport 172 is Primary)");
assert.equal(Math.max(...pcSport187.designGenerations.map(g => g.endYear)), 2021, "Sport 187 should end before the Sport 182 replacement");
const pcSuperPro = item("boat:Princecraft | Super Pro 176");
assert.equal(JSON.stringify(pcSuperPro.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2011,2015]]), "Super Pro 176 production span is wrong");
const pcSport164 = item("boat:Princecraft | Sport 167 / Sport 164");
assert.equal(pcSport164.designGenerations.find(g => g.startYear === 2017)?.endYear, 2021, "Sport 164 continuation through 2021 is missing");
const pcXpedition = item("boat:Princecraft | Xpedition 170 WS");
assert.equal(JSON.stringify(pcXpedition.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2014,2016]]), "Xpedition 170 WS exact production span is wrong");

// Strict Tracker existing-model completion audit.
const trackerRows = catalog.items.filter(entry => entry.categoryId === "boats" && entry.manufacturer === "Tracker");
assert.equal(trackerRows.length, 8, "Focused Tracker app-model scope changed without updating the audit");
assert.equal(
  trackerRows.reduce((sum, entry) => sum + entry.designGenerations.length, 0),
  29,
  "Tracker generation/evidence-row count changed without updating the strict audit"
);
assert.equal(
  trackerRows.reduce((sum, entry) => sum + entry.designGenerations.reduce((n, generation) => n + generation.eras.length, 0), 0),
  34,
  "Tracker value-era count changed without updating the strict audit"
);
const trackerIdealIds = new Set([
  "boat:Tracker | Pro Guide V-175 WT",
  "boat:Tracker | Targa 17 WT (early generation)",
  "boat:Tracker | Targa 17 WT (2003–2005 redesign)",
  "boat:Tracker | Targa V-17 WT",
  "boat:Tracker | Pro Guide V-17 WT"
]);
for (const entry of trackerRows) {
  assert.ok(Array.isArray(entry.designGenerations) && entry.designGenerations.length >= 1, `${entry.id} lacks Tracker generations`);
  assert.equal(entry.valueEras.length, 0, `${entry.id} retained unsafe top-level value eras`);
  assert.equal(Boolean(entry.idealMatch), trackerIdealIds.has(entry.id), `${entry.id} ideal-match marker is wrong`);
  assert.equal(entry.model.startsWith("*"), trackerIdealIds.has(entry.id), `${entry.id} compact model star is wrong`);
  assert.equal(entry.displayName.startsWith("*"), trackerIdealIds.has(entry.id), `${entry.id} compact display star is wrong`);
  for (const generation of entry.designGenerations) {
    assert.notEqual(generation.status, "unresolved", `${entry.id} still has an unresolved generation`);
    assert.ok(Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear), `${generation.id} lacks closed years`);
    assert.ok(generation.startYear <= generation.endYear, `${generation.id} has reversed years`);
    assert.ok(Array.isArray(generation.eras) && generation.eras.length >= 1, `${generation.id} lacks package pricing`);
    for (const era of generation.eras) {
      assert.ok(Number.isFinite(era.low) && Number.isFinite(era.high) && era.low <= era.high, `${era.id} has invalid Tracker pricing`);
      assert.ok(era.startYear >= generation.startYear && era.endYear <= generation.endYear, `${era.id} falls outside its Tracker generation`);
    }
  }
}
const trackerPg175 = item("boat:Tracker | Pro Guide V-175 WT");
assert.equal(JSON.stringify(trackerPg175.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2010,2010],[2011,2011],[2012,2012],[2013,2017],[2018,2026]]), "Pro Guide V-175 history remains compressed");
assert.equal(trackerPg175.designGenerations.at(-1).specs?.["Dry Hull Weight"]?.value, "1,525 lb", "Current Pro Guide V-175 weight is wrong");
assert.equal(trackerPg175.designGenerations.at(-1).specs?.["Average Package Weight"]?.value, "2,985 lb", "Current Pro Guide package weight is missing");
const trackerV18 = item("boat:Tracker | Targa V-18 WT");
assert.equal(JSON.stringify(trackerV18.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2010,2011],[2012,2014],[2015,2016],[2017,2019],[2020,2020],[2021,2026]]), "Targa V-18 weight/construction changes are incomplete");
assert.equal(trackerV18.designGenerations.find(g => g.startYear === 2019 || (g.startYear === 2017 && g.endYear === 2019))?.specs?.["Average Package Weight"]?.value, "3,704 lb in 2019", "2019 Targa V-18 package weight is missing");
assert.equal(trackerV18.designGenerations.find(g => g.startYear === 2020)?.specs?.["Bottom Thickness"]?.value, '.125"', "2020 Targa V-18 plating revision is missing");
const trackerV19 = item("boat:Tracker | Targa V-19 WT (exceeds Maverick tow rating)");
assert.equal(JSON.stringify(trackerV19.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2018,2019],[2020,2022],[2023,2026]]), "Targa V-19 weight rows are incomplete");
assert.equal(trackerV19.designGenerations.at(-1).specs?.["Average Package Weight"]?.value, "4,245 lb", "Current Targa V-19 overweight package is missing");
assert.match(trackerV19.details.find(d => d.label === "Placement Reason")?.value || "", /too heavy|4,019|4,245/i, "Targa V-19 tow rejection is missing");
const trackerTundra = item("boat:Tracker | Tundra 18 DC / WT");
assert.equal(trackerTundra.designGenerations.length, 6, "Tundra DC/WT variations are incomplete");
assert.equal(trackerTundra.designGenerations.filter(g => g.startYear === 2006 && g.endYear === 2007).length, 2, "Tundra 2006-2007 parallel DC/WT rows are missing");
assert.equal(new Set(trackerTundra.designGenerations.filter(g => g.startYear === 2006).map(g => g.specs?.["Dry Hull Weight"]?.value)).size, 2, "Tundra parallel layouts lost their distinct weights");
const trackerEarly17 = item("boat:Tracker | Targa 17 WT (early generation)");
assert.equal(JSON.stringify(trackerEarly17.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2000,2000],[2001,2001],[2002,2002]]), "Early Targa 17 year evidence is incomplete");
assert.equal(trackerEarly17.designGenerations.at(-1).specs?.["Dry Hull Weight"]?.value, "1,370 lb", "2002 early Targa weight change is missing");
const trackerRedesign17 = item("boat:Tracker | Targa 17 WT (2003–2005 redesign)");
assert.equal(JSON.stringify(trackerRedesign17.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2003,2003],[2004,2005]]), "Targa 17 redesign certification rows are incomplete");
assert.match(trackerRedesign17.designGenerations[0].specs?.["Max HP"]?.value || "", /verify capacity plate/i, "2003 Targa horsepower conflict warning is missing");
assert.equal(trackerRedesign17.designGenerations[1].specs?.["Max HP"]?.value, "125", "2004-2005 Targa certification is wrong");
const trackerV17 = item("boat:Tracker | Targa V-17 WT");
assert.equal(JSON.stringify(trackerV17.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2009,2009],[2010,2010]]), "Targa V-17 annual weight rows are incomplete");
assert.equal(trackerV17.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "1,375 lb", "2009 Targa V-17 weight is wrong");
assert.equal(trackerV17.designGenerations[1].specs?.["Dry Hull Weight"]?.value, "1,401 lb", "2010 Targa V-17 weight is wrong");
const trackerPg17 = item("boat:Tracker | Pro Guide V-17 WT");
assert.equal(JSON.stringify(trackerPg17.designGenerations.map(g => [g.startYear,g.endYear])), JSON.stringify([[2006,2006],[2007,2008]]), "Pro Guide V-17 weight rows are incomplete");
assert.equal(trackerPg17.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "1,450 lb", "2006 Pro Guide V-17 weight is wrong");
assert.equal(trackerPg17.designGenerations[1].specs?.["Dry Hull Weight"]?.value, "1,325 lb", "2007-2008 Pro Guide V-17 weight is wrong");

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
assert.equal(dualImpact.designGenerations.length, 5, "Dual Impact lineage is missing a generation");
assert.equal(
  JSON.stringify(dualImpact.designGenerations.map(generation => [generation.startYear, generation.endYear])),
  JSON.stringify([[1995, 2002], [2003, 2007], [2008, 2010], [2011, 2020], [2021, 2026]]),
  "Dual Impact generation boundaries changed"
);
assert.equal(dualImpact.designGenerations[0].specs?.["Dry Hull Weight"]?.value, "985 lb", "2001-era F1745 weight is wrong");
assert.equal(dualImpact.designGenerations[4].specs?.["Dry Hull Weight"]?.value, "1,550 lb", "Current F176 weight is wrong");
const mirroCraftBoats = allBoats.filter(entry => entry.manufacturer === "MirroCraft");
assert.equal(mirroCraftBoats.length, 7, "MirroCraft record count changed");
assert.ok(mirroCraftBoats.every(entry => entry.designGenerations.every(generation => generation.status !== "unresolved")), "MirroCraft still has an unresolved generation");
for (const entry of mirroCraftBoats) {
  for (const generation of entry.designGenerations) {
    if (generation.status === "family-umbrella-rejection") continue;
    assert.ok(generation.eras.length >= 1, `${entry.id} ${generation.label} lacks a value era`);
    for (const valueEra of generation.eras) {
      assert.ok(valueEra.startYear >= generation.startYear && valueEra.endYear <= generation.endYear, `${valueEra.id} crosses its hull generation`);
    }
  }
}
const mirroCraftStars = mirroCraftBoats.filter(entry => entry.model.startsWith("*")).map(entry => entry.id).sort();
assert.equal(JSON.stringify(mirroCraftStars), JSON.stringify([
  "boat:MirroCraft | Aggressor Pro MX 1773 WT",
  "boat:MirroCraft | Dual Impact 176",
  "boat:MirroCraft | Holiday 1768 (Primary; not Starcraft Holiday or MirroCraft 1628/168)"
].sort()), "MirroCraft ideal-match stars changed");
const holiday1628 = item("boat:MirroCraft | Holiday 1628");
assert.equal(JSON.stringify(holiday1628.designGenerations.map(generation => [generation.startYear, generation.endYear])), JSON.stringify([[2002, 2010], [2011, 2026]]), "Holiday 1628 generations changed");
const holiday1768 = item("boat:MirroCraft | Holiday 1768 (Primary; not Starcraft Holiday or MirroCraft 1628/168)");
assert.equal(holiday1768.designGenerations[2].specs?.Beam?.value, "93\"", "F1738 beam is wrong");
const trollerFamily = item("boat:MirroCraft | Troller (Secondary; not a verified full-windshield model)");
assert.equal(trollerFamily.designGenerations[0].status, "family-umbrella-rejection", "Troller is not explicitly closed as a family rejection");
assert.equal(trollerFamily.lowPrice, null, "Troller family rejection retained a blended price");
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
