import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const gapPath = "research/all-manufacturer-roster-gaps.json";
const source = fs.readFileSync(boatsPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: boatsPath });
let boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Canonical boat array could not be loaded");

const deepClone = value => JSON.parse(JSON.stringify(value));
const templateId = "boat:Smoker Craft | Pro Angler 172 (Primary; not Lund Pro Angler)";
const template = boats.find(entry => entry.id === templateId);
if (!template) throw new Error(`Missing Smoker Craft template: ${templateId}`);

const setDetail = (boat, label, value) => {
  const detail = (boat.details || []).find(entry => entry.label === label);
  if (detail) detail.value = value;
  else (boat.details ||= []).push({ label, value });
};
const spec = (value, confidence = "cited-source-exact") => ({ value, confidence });
const era = (boatId, slug, startYear, endYear, low, high, basis) => ({
  id: `${boatId}:value:${slug}`,
  label: startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`,
  startYear,
  endYear,
  low,
  high,
  basis
});
const generation = (boatId, slug, label, startYear, endYear, status, specificationBasis, sourceUrl, specs, eras, evidenceUrls = []) => ({
  id: `${boatId}:gen:${slug}`,
  label,
  startYear,
  endYear,
  status,
  specificationBasis,
  sourceUrl,
  specs,
  eras,
  evidenceUrls
});
const packageBasis = "Used complete-package screening estimate. Motor condition, floor and transom condition, trailer, canvas, electronics and regional demand can move a package outside this range.";

const configureBoat = ({ id, model, subtitle, lowPrice, highPrice, sourceUrl, badge = "Secondary", bigWater, practicalHp, placement, notes, research, generations, availability = "Common to possible, condition and motor dependent" }) => {
  if (boats.some(entry => entry.id === id)) throw new Error(`Duplicate stable boat ID: ${id}`);
  const boat = deepClone(template);
  boat.id = id;
  boat.manufacturer = "Smoker Craft";
  boat.model = model;
  boat.displayName = `Smoker Craft | ${model}`;
  boat.subtitle = subtitle;
  boat.badge = badge;
  boat.idealMatch = false;
  boat.lowPrice = lowPrice;
  boat.highPrice = highPrice;
  boat.priceBasis = "Generation-contained used complete-package screening estimates. Select the documented year row before judging a listing.";
  boat.sourceUrl = sourceUrl;
  boat.valueEras = [];
  boat.designGenerations = generations;
  boat.generationWarning = "Legacy Smoker Craft hull badges, dealer wording and factory catalog names do not always match. Verify the HIN, title, capacity plate and exact windshield opening before applying a row.";
  boat.image = {
    ...(boat.image || {}),
    matchQuality: "Same-manufacturer layout stand-in",
    note: "Existing Smoker Craft image retained only as a layout stand-in; verify the exact legacy family and badge from listing photos."
  };

  setDetail(boat, "Model Years / Era", generations.map(entry => entry.startYear === entry.endYear ? `${entry.startYear}` : `${entry.startYear}-${entry.endYear}`).join("; "));
  setDetail(boat, "Recommendation", badge);
  setDetail(boat, "Big-Water Suitability", bigWater);
  setDetail(boat, "Layout", "Factory dual-console/full walk-through windshield family; verify the center opening on the individual boat");
  for (const label of ["Length", "Beam", "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth", "Cockpit / Interior Depth", "Deadrise", "Transom Height", "Transom Width", "Max HP", "Persons", "Capacity Weight", "Fuel Capacity", "Bottom Thickness", "Side / Freeboard Thickness", "Construction"]) {
    setDetail(boat, label, "Varies by selected documented year row");
  }
  setDetail(boat, "Practical Working HP", practicalHp);
  setDetail(boat, "Availability Under $14k", availability);
  setDetail(boat, "Placement Reason", placement);
  setDetail(boat, "Notes", notes);
  setDetail(boat, "Interior Finish / Deck Material", "Marine carpet was typical; inspect the deck substrate, carpet edges, seat bases and bilge for trapped moisture and prior repairs.");
  setDetail(boat, "Interior Material Basis", "Period factory configuration and surviving examples; verify the individual boat.");
  setDetail(boat, "Washdown / Carpet Fit", "POOR — These are generally carpeted boats rather than hose-down interiors.");
  setDetail(boat, "Research Status", research);
  return boat;
};

const stilettoId = "boat:Smoker Craft | Stiletto 162 / 16 Stiletto LE / 165 LE listing alias";
const stiletto = configureBoat({
  id: stilettoId,
  model: "Stiletto 162 / 16 Stiletto LE / 165 LE listing alias",
  subtitle: "2003-2005 documented 16-foot dual-console family; 165 LE badge requires HIN confirmation",
  lowPrice: 3200,
  highPrice: 7500,
  sourceUrl: "https://www.jdpower.com/boats/2005/smoker-craft-inc/162-stiletto/10242897/specs",
  bigWater: "Good for two nearshore; cramped and weather-limited for four on Lake Superior",
  practicalHp: "75-90",
  placement: "Useful inexpensive two-person boat, but its 16-foot hull, fish-and-ski furniture and carpet keep it below the stronger 17-foot trolling candidates.",
  notes: "A photographed hull may be badged 165 LE while annual databases call the same era 16 Stiletto LE or 162 Stiletto. A seller's 2005 estimate fits the 2005 162 Stiletto specifications closely, but the HIN, title and capacity plate must decide the exact model year and designation.",
  research: "The 2003 annual roster's 16 Stiletto LE and the 2004-2005 162 Stiletto rows were reconciled as one badge/name family without claiming that every 165 LE decal is automatically a Stiletto.",
  generations: [
    generation(stilettoId, "2003-le", "2003 16 Stiletto LE roster row", 2003, 2003, "annual-roster-name-row", "The 2003 manufacturer roster lists a 16 Stiletto LE at 950 lb. Complete certification-table dimensions for this exact badge were not recovered, so later dimensions are not backfilled.", "https://www.jdpower.com/boats/2003/smoker-craft-inc", {
      "Length": spec("16-foot class", "annual-roster"),
      "Dry Hull Weight": spec("950 lb", "annual-roster"),
      "Max HP": spec("Verify capacity plate", "not-reliably-published"),
      "Layout": spec("Dual-console/full windshield family; verify center opening", "period-family-evidence"),
      "Construction": spec("Riveted aluminum deep-V/fish-and-ski family", "manufacturer-family-verified")
    }, [era(stilettoId, "2003", 2003, 2003, 3200, 6000, packageBasis)]),
    generation(stilettoId, "2004-2005", "2004-2005 162 Stiletto", 2004, 2005, "year-specific-generation", "Annual rosters carry the 162 Stiletto in both years. The 2005 exact-model sheet publishes the 16-foot length, 87-inch beam, 960-lb hull, 90-hp ceiling and capacities.", "https://www.jdpower.com/boats/2005/smoker-craft-inc/162-stiletto/10242897/specs", {
      "Length": spec("16'0\""),
      "Beam": spec("87\""),
      "Dry Hull Weight": spec("960 lb"),
      "Max / Bow Depth": spec("24\""),
      "Transom Width": spec("81\""),
      "Max HP": spec("90"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,450 lb"),
      "Fuel Capacity": spec("24 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Side / Freeboard Thickness": spec("0.076\""),
      "Layout": spec("Factory dual-console/full walk-through windshield family", "model-layout-verified"),
      "Construction": spec("Riveted aluminum deep-V/fish-and-ski")
    }, [era(stilettoId, "2004-2005", 2004, 2005, 3500, 7500, packageBasis)], [
      "https://www.jdpower.com/boats/2004/smoker-craft-inc",
      "https://www.jdpower.com/boats/2005/smoker-craft-inc"
    ])
  ]
});

const millentiaId = "boat:Smoker Craft | Millentia 162 Dual";
const millentia = configureBoat({
  id: millentiaId,
  model: "Millentia 162 Dual",
  subtitle: "2001-2005 documented dual-console 16-foot family",
  lowPrice: 3500,
  highPrice: 8000,
  sourceUrl: "https://www.jdpower.com/boats/2005/smoker-craft-inc/162-millentia/10242896/specs",
  bigWater: "Good for two; compact for four and best kept to conservative nearshore weather",
  practicalHp: "75-90",
  placement: "A legitimate full-windshield budget candidate, but still a carpeted 16-foot boat with limited four-person working room.",
  notes: "The 2001 roster explicitly calls this the 162 Millentia-Dual. Later rosters shorten the name to 162 Millentia, which caused the windshield layout to disappear from name-based auditing.",
  research: "The explicit 2001 Dual identity was connected to the 2002-2005 annual 162 Millentia roster. Exact 2005 dimensions are not silently presented as proof of an undocumented redesign date.",
  generations: [
    generation(millentiaId, "2001-2005", "2001-2005 162 Millentia Dual family", 2001, 2005, "annual-roster-family", "The 2001 roster explicitly identifies the Dual model. Annual rosters continue the 162 Millentia through 2005, and the exact 2005 sheet supplies the retained late-run specifications.", "https://www.jdpower.com/boats/2005/smoker-craft-inc/162-millentia/10242896/specs", {
      "Length": spec("16'0\"", "2005-exact-model"),
      "Beam": spec("87\"", "2005-exact-model"),
      "Dry Hull Weight": spec("975 lb", "annual-roster-and-2005-exact"),
      "Max HP": spec("90", "2005-exact-model"),
      "Persons": spec("5", "2005-exact-model"),
      "Capacity Weight": spec("1,450 lb", "2005-exact-model"),
      "Fuel Capacity": spec("24 gal", "2005-exact-model"),
      "Bottom Thickness": spec("0.100\"", "2005-exact-model"),
      "Side / Freeboard Thickness": spec("0.076\"", "2005-exact-model"),
      "Layout": spec("Dual-console/full windshield", "2001-explicit-dual-roster"),
      "Construction": spec("Riveted aluminum deep-V")
    }, [era(millentiaId, "2001-2005", 2001, 2005, 3500, 8000, packageBasis)], [
      "https://www.jdpower.com/boats/2001/smoker-craft-inc",
      "https://www.jdpower.com/boats/2002/smoker-craft-inc",
      "https://www.jdpower.com/boats/2003/smoker-craft-inc",
      "https://www.jdpower.com/boats/2004/smoker-craft-inc",
      "https://www.jdpower.com/boats/2005/smoker-craft-inc"
    ])
  ]
});

const stingerId = "boat:Smoker Craft | Stinger 162 Dual / DC";
const stinger = configureBoat({
  id: stingerId,
  model: "Stinger 162 Dual / DC",
  subtitle: "2001-2006 documented dual-console family; 2006 weight conflict retained",
  lowPrice: 2800,
  highPrice: 7000,
  sourceUrl: "https://www.boats.za.net/smoker-craft/stinger-162/smoker-craft-stinger-162-2006",
  bigWater: "Fair for two nearshore; too narrow and compact for comfortable four-person Lake Superior fishing",
  practicalHp: "50-60",
  placement: "The 81-inch beam and 60-hp ceiling make this more of an inland/nearshore budget boat than a serious four-person Superior platform.",
  notes: "The 2001 roster explicitly labels the 162 Stinger-Dual. The model name later loses Dual even though the 162 identity continues. Published 2006 weights conflict sharply, so the capacity plate and actual trailer-scale weight matter.",
  research: "2001-2006 annual identities and an exact 2006 specification sheet were reconciled. The 660-lb versus 920-lb 2006 conflict is retained rather than averaged.",
  generations: [
    generation(stingerId, "2001-2005", "2001-2005 Stinger 162 Dual family", 2001, 2005, "annual-roster-family", "The 2001 roster explicitly says 162 Stinger-Dual. Exact-model specifications retained across the period describe the compact 16-foot, 81-inch-beam, 60-hp platform.", "https://www.jdpower.com/boats/2001/smoker-craft-inc", {
      "Length": spec("16'0\"", "exact-model-secondary-source"),
      "Beam": spec("81\"", "exact-model-secondary-source"),
      "Dry Hull Weight": spec("660 lb published for the family", "annual-roster-and-exact-model"),
      "Max / Bow Depth": spec("25\"", "exact-model-secondary-source"),
      "Transom Width": spec("74\"", "exact-model-secondary-source"),
      "Max HP": spec("60", "exact-model-secondary-source"),
      "Persons": spec("5", "exact-model-secondary-source"),
      "Capacity Weight": spec("1,200 lb", "exact-model-secondary-source"),
      "Fuel Capacity": spec("16 gal", "exact-model-secondary-source"),
      "Bottom Thickness": spec("0.100\"", "exact-model-secondary-source"),
      "Side / Freeboard Thickness": spec("0.064\"", "exact-model-secondary-source"),
      "Layout": spec("Dual-console/full windshield", "2001-explicit-dual-roster"),
      "Construction": spec("Riveted aluminum modified/deep-V")
    }, [era(stingerId, "2001-2005", 2001, 2005, 2800, 6000, packageBasis)]),
    generation(stingerId, "2006", "2006 Stinger 162 published-weight conflict", 2006, 2006, "cited-weight-conflict", "The 2006 annual roster reports 920 lb while an exact-model specification source reports 660 lb. Neither number is discarded; verify the capacity plate and actual package.", "https://www.boats.za.net/smoker-craft/stinger-162/smoker-craft-stinger-162-2006", {
      "Length": spec("16'0\""),
      "Beam": spec("81\""),
      "Dry Hull Weight": spec("660 lb exact-model source / 920 lb annual roster", "cited-source-conflict"),
      "Max HP": spec("60"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,200 lb"),
      "Fuel Capacity": spec("16 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Side / Freeboard Thickness": spec("0.064\""),
      "Layout": spec("Dual-console/full windshield family", "model-identity-continuation"),
      "Construction": spec("Riveted aluminum modified/deep-V")
    }, [era(stingerId, "2006", 2006, 2006, 3200, 7000, packageBasis)], ["https://www.jdpower.com/boats/2006/smoker-craft-inc"])
  ]
});

const stealthId = "boat:Smoker Craft | Stealth 162";
const stealth = configureBoat({
  id: stealthId,
  model: "Stealth 162",
  subtitle: "2002-2004 documented even-number windshield family; annual weight changes retained",
  lowPrice: 2800,
  highPrice: 6500,
  sourceUrl: "https://www.jdpower.com/boats/2004/smoker-craft-inc/162-stealth/10242911/specs",
  bigWater: "Fair for two in conservative nearshore weather; not a comfortable four-person Superior boat",
  practicalHp: "50-60",
  placement: "Compact, light and tow-friendly, but its narrow platform and modest power ceiling are below the project's preferred big-water envelope.",
  notes: "The Stealth 162 is easy to miss because the model name contains no layout suffix. The even-number 162 family belongs in the legacy dual-console screening set, but each listing still needs a windshield photo and capacity plate.",
  research: "Annual rosters establish 2002-2004 production. Published weight changes from 660 lb in 2002 to 600 lb in 2003; the 2004 exact-model identity is retained without inventing missing certification-table values.",
  generations: [
    generation(stealthId, "2002", "2002 Stealth 162", 2002, 2002, "annual-roster-row", "The 2002 annual roster lists the 162 Stealth at 660 lb.", "https://www.jdpower.com/boats/2002/smoker-craft-inc", {
      "Length": spec("16-foot class", "annual-roster"),
      "Dry Hull Weight": spec("660 lb", "annual-roster"),
      "Max HP": spec("Verify capacity plate", "not-reliably-published"),
      "Layout": spec("Even-number dual-console/full-windshield family; verify listing photos", "family-naming-evidence"),
      "Construction": spec("Riveted aluminum fishing hull", "manufacturer-family-verified")
    }, [era(stealthId, "2002", 2002, 2002, 2800, 5000, packageBasis)]),
    generation(stealthId, "2003", "2003 Stealth 162 lighter published row", 2003, 2003, "annual-roster-row", "The 2003 annual roster lists the 162 Stealth at 600 lb, so it is retained separately from 2002.", "https://www.jdpower.com/boats/2003/smoker-craft-inc", {
      "Length": spec("16-foot class", "annual-roster"),
      "Dry Hull Weight": spec("600 lb", "annual-roster"),
      "Max HP": spec("Verify capacity plate", "not-reliably-published"),
      "Layout": spec("Even-number dual-console/full-windshield family; verify listing photos", "family-naming-evidence"),
      "Construction": spec("Riveted aluminum fishing hull", "manufacturer-family-verified")
    }, [era(stealthId, "2003", 2003, 2003, 3000, 5500, packageBasis)]),
    generation(stealthId, "2004", "2004 Stealth 162 exact-model identity", 2004, 2004, "exact-model-partial", "The 2004 exact-model roster confirms the 162 Stealth identity, but a complete trustworthy certification table was not recovered.", "https://www.jdpower.com/boats/2004/smoker-craft-inc/162-stealth/10242911/specs", {
      "Length": spec("16-foot class", "exact-model-roster"),
      "Dry Hull Weight": spec("Verify title/capacity plate; retained sources are incomplete", "not-reliably-published"),
      "Max HP": spec("Verify capacity plate", "not-reliably-published"),
      "Layout": spec("Even-number dual-console/full-windshield family; verify listing photos", "family-naming-evidence"),
      "Construction": spec("Riveted aluminum fishing hull", "manufacturer-family-verified")
    }, [era(stealthId, "2004", 2004, 2004, 3200, 6500, packageBasis)])
  ]
});

const proMag162Id = "boat:Smoker Craft | Pro Mag 162";
const proMag162 = configureBoat({
  id: proMag162Id,
  model: "Pro Mag 162",
  subtitle: "Discontinuous 2001, 2003, 2006-2010 and 2019 evidence; redesigns separated",
  lowPrice: 3200,
  highPrice: 15000,
  sourceUrl: "https://www.smokercraft.com/wp-content/uploads/2007-smokercraft-fishing.pdf",
  bigWater: "Good for two; later wide versions are workable for three, but four remain crowded",
  practicalHp: "75-90",
  placement: "A useful 16-foot full-windshield family, but not a substitute for a 17-foot open-cockpit trolling boat.",
  notes: "The Pro Mag 162 appears in discontinuous annual evidence and changed hull specifications. Do not apply the 2007 16'5-inch, 86-inch-beam figures to the 2008 16-foot, 87-inch-beam hull or to the heavier 2019 boat.",
  research: "Explicit 2001 Dual and 2003 LE rows, the 2006-2010 run and a separate 2019 snapshot are encoded. Unproven intervening years remain absent.",
  availability: "Older runs are common to possible under $14k; the 2019 package often exceeds the project budget",
  generations: [
    generation(proMag162Id, "2001-dual", "2001 162 Pro Mag-Dual", 2001, 2001, "explicit-dual-roster", "The 2001 roster explicitly identifies the 162 Pro Mag-Dual. Complete dimensions were not recovered for this exact early row.", "https://www.jdpower.com/boats/2001/smoker-craft-inc", {
      "Length": spec("16-foot class", "annual-roster"),
      "Dry Hull Weight": spec("Verify exact early package", "not-reliably-published"),
      "Max HP": spec("Verify capacity plate", "not-reliably-published"),
      "Layout": spec("Dual-console/full windshield", "explicit-dual-roster"),
      "Construction": spec("Riveted aluminum deep-V family", "manufacturer-family-verified")
    }, [era(proMag162Id, "2001", 2001, 2001, 3200, 6000, packageBasis)]),
    generation(proMag162Id, "2003-le", "2003 162 Pro Mag LE", 2003, 2003, "annual-roster-name-row", "The 2003 annual roster lists the 162 Pro Mag LE at 1,115 lb. It is not joined across the missing 2002 evidence year.", "https://www.jdpower.com/boats/2003/smoker-craft-inc", {
      "Length": spec("16-foot class", "annual-roster"),
      "Dry Hull Weight": spec("1,115 lb", "annual-roster"),
      "Max HP": spec("Verify capacity plate", "not-reliably-published"),
      "Layout": spec("Dual-console/full windshield family", "model-family-evidence"),
      "Construction": spec("Riveted aluminum deep-V family", "manufacturer-family-verified")
    }, [era(proMag162Id, "2003", 2003, 2003, 3500, 6500, packageBasis)]),
    generation(proMag162Id, "2006-2007", "2006-2007 16'5-inch Pro Mag 162", 2006, 2007, "factory-catalog-generation", "The 2007 factory specification table publishes the 16'5-inch, 86-inch-beam, 960-lb configuration. Annual rosters establish the 2006-2007 run.", "https://www.smokercraft.com/wp-content/uploads/2007-smokercraft-fishing.pdf", {
      "Length": spec("16'5\""),
      "Beam": spec("86\""),
      "Dry Hull Weight": spec("960 lb"),
      "Max HP": spec("90"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,300 lb"),
      "Fuel Capacity": spec("20 gal"),
      "Bottom Thickness": spec("0.080\""),
      "Side / Freeboard Thickness": spec("0.076\""),
      "Layout": spec("Dual-console/full windshield", "factory-catalog"),
      "Construction": spec("Riveted aluminum deep-V")
    }, [era(proMag162Id, "2006-2007", 2006, 2007, 4500, 8500, packageBasis)], ["https://www.jdpower.com/boats/2006/smoker-craft-inc"]),
    generation(proMag162Id, "2008-2010", "2008-2010 16-foot Pro Mag 162 redesign", 2008, 2010, "factory-catalog-generation", "The 2008 factory table changes the boat to 16'0 inches, 87-inch beam, 24-gallon fuel and a 0.100-inch bottom while retaining a 960-lb published hull weight and 90-hp ceiling.", "https://www.smokercraft.com/wp-content/uploads/2008-smokercraft-fishing.pdf", {
      "Length": spec("16'0\""),
      "Beam": spec("87\""),
      "Dry Hull Weight": spec("960 lb"),
      "Max HP": spec("90"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,450 lb"),
      "Fuel Capacity": spec("24 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Side / Freeboard Thickness": spec("0.076\""),
      "Layout": spec("Dual-console/full windshield", "factory-catalog"),
      "Construction": spec("Riveted aluminum deep-V")
    }, [era(proMag162Id, "2008-2010", 2008, 2010, 5000, 9500, packageBasis)]),
    generation(proMag162Id, "2019", "2019 heavier Pro Mag 162 roster snapshot", 2019, 2019, "annual-roster-snapshot", "The 2019 annual roster lists a Pro Mag 162 at 1,140 lb. No continuity across the missing years is claimed.", "https://www.jdpower.com/boats/2019/smoker-craft-inc", {
      "Length": spec("16-foot class", "annual-roster"),
      "Dry Hull Weight": spec("1,140 lb", "annual-roster"),
      "Max HP": spec("Verify 2019 capacity plate", "not-reliably-published"),
      "Layout": spec("Dual-console/full-windshield family", "annual-model-identity"),
      "Construction": spec("Riveted aluminum deep-V family", "manufacturer-family-verified")
    }, [era(proMag162Id, "2019", 2019, 2019, 9000, 15000, packageBasis)])
  ]
});

const proMag172Id = "boat:Smoker Craft | Pro Mag 172";
const proMag172 = configureBoat({
  id: proMag172Id,
  model: "Pro Mag 172",
  subtitle: "2006-2007 and 2017-2020 documented runs; intervening years not assumed",
  lowPrice: 5500,
  highPrice: 18000,
  sourceUrl: "https://www.smokercraft.com/wp-content/uploads/2007-smokercraft-fishing.pdf",
  badge: "Primary",
  bigWater: "Very good for two or three; workable for four with careful cockpit layout",
  practicalHp: "90-135",
  placement: "The 17'2-inch, 91-inch-beam early hull is much closer to the project's preferred Lake Superior envelope than the 16-foot legacy families.",
  notes: "The Pro Mag 172 is a stronger big-water candidate than the photographed 16-foot boat. The retained evidence shows an early 2006-2007 run and a later 2017-2020 return; no continuous 2008-2016 production is invented.",
  research: "The exact 2007 factory table and later annual rosters were encoded as two discontinuous evidence runs. The later row retains only specifications actually supported by the surviving roster evidence.",
  availability: "Early run is plausible under $14k; later run often exceeds the project budget",
  generations: [
    generation(proMag172Id, "2006-2007", "2006-2007 early Pro Mag 172", 2006, 2007, "factory-catalog-generation", "The 2007 factory specification table publishes the early 17'2-inch, 91-inch-beam, 1,300-lb configuration. Annual rosters establish 2006-2007 identity.", "https://www.smokercraft.com/wp-content/uploads/2007-smokercraft-fishing.pdf", {
      "Length": spec("17'2\""),
      "Beam": spec("91\""),
      "Dry Hull Weight": spec("1,300 lb"),
      "Max HP": spec("135"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,400 lb"),
      "Fuel Capacity": spec("24 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Side / Freeboard Thickness": spec("0.086\""),
      "Layout": spec("Dual-console/full windshield", "factory-catalog"),
      "Construction": spec("Riveted aluminum deep-V")
    }, [era(proMag172Id, "2006-2007", 2006, 2007, 5500, 10500, packageBasis)], ["https://www.jdpower.com/boats/2006/smoker-craft-inc"]),
    generation(proMag172Id, "2017-2020", "2017-2020 later Pro Mag 172 roster run", 2017, 2020, "annual-roster-run", "Annual rosters carry the Pro Mag 172 again from 2017 through 2020. The 2019 roster publishes a 1,305-lb hull. Complete later certification-table dimensions remain year-sensitive.", "https://www.jdpower.com/boats/2019/smoker-craft-inc", {
      "Length": spec("17-foot class; verify exact later year", "annual-roster"),
      "Dry Hull Weight": spec("1,305 lb published for 2019", "annual-roster"),
      "Max HP": spec("Verify capacity plate for exact year", "not-reliably-published"),
      "Layout": spec("Dual-console/full-windshield family", "annual-model-identity"),
      "Construction": spec("Riveted aluminum deep-V family", "manufacturer-family-verified")
    }, [
      era(proMag172Id, "2017-2018", 2017, 2018, 9500, 15000, packageBasis),
      era(proMag172Id, "2019-2020", 2019, 2020, 11000, 18000, packageBasis)
    ], [
      "https://www.jdpower.com/boats/2017/smoker-craft-inc",
      "https://www.jdpower.com/boats/2018/smoker-craft-inc",
      "https://www.jdpower.com/boats/2020/smoker-craft-inc"
    ])
  ]
});

const proAngler162Id = "boat:Smoker Craft | Pro Angler 162";
const proAngler162 = configureBoat({
  id: proAngler162Id,
  model: "Pro Angler 162",
  subtitle: "2007 factory-documented compact full-windshield row; later XL kept separate",
  lowPrice: 4000,
  highPrice: 8000,
  sourceUrl: "https://www.smokercraft.com/wp-content/uploads/2007-smokercraft-fishing.pdf",
  bigWater: "Fair for two in conservative nearshore weather; too narrow for comfortable four-person Superior fishing",
  practicalHp: "50-60",
  placement: "The 81-inch beam and 60-hp ceiling make this a compact budget boat, not a robust four-person Great Lakes platform.",
  notes: "This base Pro Angler 162 is not automatically the later 162 XL. The 2007 factory table supports one exact compact full-windshield row; unsupported continuity is not added.",
  research: "The exact 2007 factory specification row was added. The later Pro Angler 162 XL remains a separate candidate until its chronology and dimensions are reconciled.",
  generations: [
    generation(proAngler162Id, "2007", "2007 Pro Angler 162", 2007, 2007, "factory-exact", "The 2007 factory specification table publishes the compact 16-foot, 81-inch-beam, 920-lb full-windshield model.", "https://www.smokercraft.com/wp-content/uploads/2007-smokercraft-fishing.pdf", {
      "Length": spec("16'0\""),
      "Beam": spec("81\""),
      "Dry Hull Weight": spec("920 lb"),
      "Max HP": spec("60"),
      "Persons": spec("5"),
      "Capacity Weight": spec("1,200 lb"),
      "Fuel Capacity": spec("16 gal"),
      "Bottom Thickness": spec("0.100\""),
      "Side / Freeboard Thickness": spec("0.064\""),
      "Layout": spec("Dual-console/full windshield", "factory-catalog"),
      "Construction": spec("Riveted aluminum modified/deep-V")
    }, [era(proAngler162Id, "2007", 2007, 2007, 4000, 8000, packageBasis)])
  ]
});

const additions = [stiletto, millentia, stinger, stealth, proMag162, proMag172, proAngler162];
const additionIds = new Set(additions.map(entry => entry.id));
boats = boats.filter(entry => !additionIds.has(entry.id));
let insertIndex = -1;
for (let i = 0; i < boats.length; i += 1) if (boats[i].manufacturer === "Smoker Craft") insertIndex = i;
if (insertIndex < 0) throw new Error("Smoker Craft group not found");
boats.splice(insertIndex + 1, 0, ...additions);

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) throw new Error("Could not locate canonical boat array wrapper");
fs.writeFileSync(boatsPath, `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`);

const gaps = JSON.parse(fs.readFileSync(gapPath, "utf8"));
const smoker = gaps.manufacturers.find(entry => entry.manufacturer === "Smoker Craft");
if (!smoker) throw new Error("Smoker Craft gap manifest entry is missing");
smoker.missingModels = (smoker.missingModels || []).map(item =>
  item.model === "Pro Angler 162 / 162 XL"
    ? { ...item, model: "Pro Angler 162 XL", reason: "The base 2007 Pro Angler 162 is now cataloged. The later XL remains unresolved until its exact chronology and hull specifications are reconciled." }
    : item
);
smoker.resolvedModels ||= [];
smoker.resolvedModels = smoker.resolvedModels.filter(item => !additionIds.has(item.stableId));
smoker.resolvedModels.push(...additions.map(entry => ({
  stableId: entry.id,
  resolvedInBatch: "smokercraft-legacy-windshield-families",
  note: entry.id === proAngler162Id
    ? "Resolved the base 2007 model; later 162 XL remains a separate candidate."
    : "Added after badge-alias and even-number dual-console audit exposed a family omitted by suffix-only searching."
})));
smoker.notes = "Legacy Smoker Craft full-windshield coverage now includes the Stiletto, Millentia, Stinger, Stealth and Pro Mag even-number families. The earlier roster audit over-relied on WT/DC/FS suffixes and missed models whose dual-console layout was encoded by the 162/172 designation or LE badge.";
gaps.candidateModelCount = gaps.manufacturers.reduce((sum, entry) => sum + (entry.missingModels || []).length, 0);
fs.writeFileSync(gapPath, `${JSON.stringify(gaps, null, 2)}\n`);

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/smokercraft-legacy-windshield-families.json", `${JSON.stringify({
  added: additions.map(entry => ({ id: entry.id, model: entry.model, generations: entry.designGenerations.map(g => [g.startYear, g.endYear]) })),
  photographedListingMatch: {
    likelyStableId: stilettoId,
    sellerEstimatedYear: 2005,
    status: "likely-match-pending-hin-title-and-capacity-plate",
    visibleBadge: "165 LE"
  },
  remainingCandidateGaps: gaps.candidateModelCount
}, null, 2)}\n`);
console.log(`Added ${additions.length} legacy Smoker Craft windshield records; ${gaps.candidateModelCount} candidate gaps remain.`);
