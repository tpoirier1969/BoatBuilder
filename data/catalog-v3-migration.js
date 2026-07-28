(function () {
  "use strict";

  const catalog = window.BOATBUILDER_DATA;
  if (!catalog || !Array.isArray(catalog.items)) {
    throw new Error("BoatBuilder catalog must load before catalog-v3-migration.js");
  }

  const VALUE_ERA_PATTERN = /^(1980s|1990s|2000s|2010s|2020s) Value$/;
  const SPEC_LABELS = new Set([
    "Length", "Beam", "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth",
    "Cockpit / Interior Depth", "Deadrise", "Transom Height", "Transom Width", "Max HP",
    "Persons", "Capacity Weight", "Fuel Capacity", "Bottom Thickness",
    "Side / Freeboard Thickness", "Construction"
  ]);

  function detailValue(item, label) {
    const detail = (item.details || []).find((entry) => entry.label === label);
    return detail ? detail.value : null;
  }

  function parseMoney(value) {
    if (typeof value !== "string") return null;
    const normalized = value.toLowerCase().replace(/,/g, "");
    const numbers = normalized.match(/\d+(?:\.\d+)?k?/g);
    if (!numbers || numbers.length < 2) return null;
    const expand = (token) => token.endsWith("k") ? Number.parseFloat(token) * 1000 : Number.parseFloat(token);
    return { low: expand(numbers[0]), high: expand(numbers[1]) };
  }

  function legacyValueEras(item, generationIds = []) {
    return (item.details || []).flatMap((detail) => {
      const match = detail.label.match(VALUE_ERA_PATTERN);
      if (!match) return [];
      const prices = parseMoney(detail.value);
      return [{
        id: `${item.id}:value:${match[1]}`,
        label: match[1],
        startYear: Number(match[1].slice(0, 4)),
        endYear: Number(match[1].slice(0, 4)) + 9,
        lowPrice: prices ? prices.low : null,
        highPrice: prices ? prices.high : null,
        displayValue: detail.value,
        generationIds: [...generationIds],
        basis: "Legacy calendar-era estimate. Generation applicability must be audited when a model name spans multiple hulls."
      }];
    });
  }

  function legacySpecs(item) {
    return Object.fromEntries(
      (item.details || [])
        .filter((detail) => SPEC_LABELS.has(detail.label))
        .map((detail) => [detail.label, {
          value: detail.value,
          confidence: "legacy-flat",
          note: "Not yet separated by verified hull design generation."
        }])
    );
  }

  function addDetailFirst(item, label, value) {
    item.details = (item.details || []).filter((detail) => detail.label !== label);
    item.details.unshift({ label, value });
  }

  function replaceDetail(item, label, value) {
    const detail = (item.details || []).find((entry) => entry.label === label);
    if (detail) detail.value = value;
    else item.details.push({ label, value });
  }

  for (const item of catalog.items) {
    if (item.categoryId !== "boats") continue;

    item.modelFamily = item.modelFamily || item.model;
    if (!Array.isArray(item.designGenerations) || !item.designGenerations.length) {
      item.designGenerations = [{
        id: `${item.id}:legacy-generation`,
        label: detailValue(item, "Model Years / Era") || item.subtitle || "Unverified generation",
        startYear: null,
        endYear: null,
        status: "legacy-flat-specs",
        specificationBasis: detailValue(item, "Model Years / Era") || item.subtitle || "Legacy catalog record",
        specs: legacySpecs(item)
      }];
    }

    item.valueEras = Array.isArray(item.valueEras) && item.valueEras.length
      ? item.valueEras
      : legacyValueEras(item, item.designGenerations.length === 1 ? [item.designGenerations[0].id] : []);
  }

  const dualImpact = catalog.items.find((item) => item.id === "boat:MirroCraft | Dual Impact 176");
  if (dualImpact) {
    const earlyGenerationId = "mirrocraft-dual-impact-176-early";
    const laterGenerationId = "mirrocraft-dual-impact-176-later";

    dualImpact.modelFamily = "Dual Impact";
    dualImpact.subtitle = "Multiple hull generations; select both hull generation and market era";
    dualImpact.designGenerations = [
      {
        id: earlyGenerationId,
        label: "Early Dual Impact 17-foot design",
        startYear: 2001,
        endYear: 2009,
        status: "research-required",
        specificationBasis: "A 2001 listing is documented, but the exact factory model designation and complete brochure specifications still require verification.",
        specs: {
          Beam: {
            value: "About 89\"",
            confidence: "secondary-unverified",
            note: "Working estimate only. Do not treat as factory-confirmed until the exact brochure or capacity plate is obtained."
          }
        }
      },
      {
        id: laterGenerationId,
        label: "Later / current 176 design",
        startYear: 2010,
        endYear: null,
        status: "factory-current-plus-era-family",
        specificationBasis: "Current MirroCraft factory specifications. Earlier boats in this later family still require year-specific confirmation.",
        specs: legacySpecs(dualImpact)
      }
    ];

    const inherited = legacyValueEras(dualImpact);
    dualImpact.valueEras = inherited.map((entry) => ({
      ...entry,
      generationIds: entry.label === "2010s" || entry.label === "2020s" ? [laterGenerationId] : [],
      basis: entry.label === "2010s" || entry.label === "2020s"
        ? "Calendar-era estimate restricted to the later/current hull family."
        : "No verified hull-generation assignment yet."
    }));

    addDetailFirst(
      dualImpact,
      "Valuation Warning",
      "Hull generation affects value independently of age. Early-generation pricing remains unavailable until comparable sales or period guidance are verified; it must not inherit later-hull price bands."
    );
    addDetailFirst(
      dualImpact,
      "Specification Warning",
      "This model name spans more than one hull design. The current 93-inch beam and related specifications must not be applied to a 2001 boat."
    );
    addDetailFirst(
      dualImpact,
      "Design Generation Status",
      "Early-generation research in progress; later/current specifications and value eras are retained only as a separate design record."
    );
    replaceDetail(dualImpact, "Length", "17'3\" — later/current design only");
    replaceDetail(dualImpact, "Beam", "93\" — later/current design only; early design approximately 89\" pending factory verification");
    replaceDetail(dualImpact, "Max / Bow Depth", "33.5\" — later/current design only");
    replaceDetail(dualImpact, "Transom Height", "20\" — later/current design only");
    replaceDetail(dualImpact, "Max HP", "150 — later/current design only");
    replaceDetail(dualImpact, "Side / Freeboard Thickness", "0.100\" — later/current design only");
  }

  catalog.schemaVersion = 3;
  catalog.schemaNotes = {
    specificationTimeline: "designGenerations",
    valuationTimeline: "valueEras",
    valuationRule: "A value era may apply to one or more explicit hull generation IDs. Multi-generation models require both selections before pricing.",
    compatibility: "Legacy flat details remain available while records are audited and migrated."
  };
})();
