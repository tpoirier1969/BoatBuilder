(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v4";
  const LEGACY_STORAGE_KEYS = [
    "boatbuilder.currentEstimate.v3",
    "boatbuilder.currentEstimate.v2",
    "boatbuilder.currentEstimate.v1"
  ];
  const ERA_FIELDS = ["1980s Value", "1990s Value", "2000s Value", "2010s Value", "2020s Value"];
  const MOTOR_CATEGORIES = new Set(["main-motors", "kickers"]);
  const SUBTYPE_CATEGORIES = new Set(["electronics", "electrical"]);
  const COMMON_HP = [4, 5, 6, 8, 9.8, 9.9, 15, 20, 25, 30, 40, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100, 110, 115, 125, 130, 135, 140, 150, 175, 200];

  const TRAILER_OPTIONS = [
    { id: "standard", label: "Standard factory / generic trailer included", low: 0, high: 0 },
    { id: "premium-single", label: "Premium single axle: brakes, swing tongue, upgraded hardware", low: 400, high: 1200 },
    { id: "galvanized-single", label: "Galvanized single axle", low: 700, high: 1600 },
    { id: "aluminum-single", label: "Aluminum single axle", low: 1200, high: 2500 },
    { id: "tandem", label: "Tandem axle steel / galvanized", low: 1500, high: 3000 },
    { id: "tandem-premium", label: "Premium tandem / aluminum trailer", low: 2500, high: 4500 }
  ];

  const DESIGN_DATA = {
    "boat:MirroCraft | Dual Impact 176": {
      family: "Dual Impact",
      warning: "This model name spans more than one hull design. Select the matching hull generation before using specifications or value guidance.",
      generations: [
        {
          id: "mirrocraft-dual-impact-176-early",
          label: "Early 17-foot Dual Impact design",
          startYear: 2001,
          endYear: null,
          status: "research-required",
          specificationBasis: "A 2001 example is documented. Exact factory specifications and the redesign cutoff still require verification.",
          specs: {
            Beam: { value: "About 89\"", confidence: "secondary-unverified", note: "Working estimate only; verify against factory literature or the capacity plate." }
          },
          valueEras: [
            { id: "early-2000s", label: "2000s", startYear: 2000, endYear: 2009, lowPrice: null, highPrice: null, basis: "Early-design market research pending" }
          ]
        },
        {
          id: "mirrocraft-dual-impact-176-current",
          label: "Current 176 design",
          startYear: null,
          endYear: null,
          status: "factory-current",
          specificationBasis: "Current MirroCraft factory specifications",
          specsFromLegacy: true,
          valueEras: []
        }
      ]
    }
  };

  const MANUFACTURER_NOTES = {
    Lund: "Current and many recent Lund families use SS for side console, Sport for a full windshield, and Tiller for tiller steering. That is not a timeless rule for every Lund ever built. Verify the year, full family name, length designation, layout suffix, HIN, and capacity plate.",
    Princecraft: "Princecraft suffixes are layout and trim clues, not interchangeable model names. Verify the year, complete model name, suffix, HIN, and capacity plate before matching a listing."
  };

  const els = {
    app: document.querySelector("#app"),
    loading: document.querySelector("#loading"),
    back: document.querySelector("#back-button"),
    home: document.querySelector("#home-button"),
    clear: document.querySelector("#clear-estimate-button"),
    estimate: document.querySelector("#estimate-button"),
    count: document.querySelector("#estimate-count"),
    range: document.querySelector("#estimate-range")
  };

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  let catalog = null;
  let itemById = new Map();
  let selections = loadSelections();
  const pendingConfig = new Map();
  const eraCache = new Map();
  const hpCache = new Map();
  let appHistory = [];

  function clean(value) { return value === null || value === undefined ? "" : String(value).trim(); }
  function escapeHtml(value) {
    return clean(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function normalizedConfig(value = {}) {
    const hp = Number(value.hp);
    return {
      generationId: clean(value.generationId) || null,
      era: clean(value.era) || null,
      hp: Number.isFinite(hp) && hp > 0 ? hp : null,
      trailer: clean(value.trailer) || "standard"
    };
  }
  function loadSelections() {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || "null");
        if (!Array.isArray(raw)) continue;
        if (raw.every(entry => typeof entry === "string")) return new Map(raw.map(id => [id, normalizedConfig()]));
        return new Map(raw.filter(entry => entry && typeof entry.id === "string").map(entry => [entry.id, normalizedConfig(entry)]));
      } catch (error) { console.warn("Could not restore saved estimate.", error); }
    }
    return new Map();
  }
  function saveSelections() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selections].map(([id, config]) => ({ id, ...normalizedConfig(config) }))));
    els.count.textContent = String(selections.size);
    if (els.clear) els.clear.disabled = selections.size === 0;
    updateEstimateHeader();
  }
  function detailMap(item) { return new Map((item.details || []).map(detail => [detail.label, detail.value])); }
  function parseAmount(numberText, suffix) {
    const number = Number(numberText);
    return Number.isFinite(number) ? Math.round(number * (suffix ? 1000 : 1)) : null;
  }
  function parseMoneyTokens(value) {
    const text = clean(value).replaceAll(",", "");
    const values = [];
    for (const match of text.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)) {
      if (!match[0].includes("$") && !match[2]) continue;
      const amount = parseAmount(match[1], match[2]);
      if (amount !== null) values.push(amount);
    }
    return values;
  }
  function parsePriceBands(value) {
    const text = clean(value).replaceAll(",", "");
    const bands = [];
    for (const segment of text.split(";")) {
      const priceMatch = [...segment.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)\s*[–—-]\s*\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)].at(-1);
      if (!priceMatch) continue;
      const low = parseAmount(priceMatch[1], priceMatch[2]);
      const high = parseAmount(priceMatch[3], priceMatch[4]);
      const prefix = segment.slice(0, priceMatch.index).trim();
      const hpRange = [...prefix.matchAll(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/g)].at(-1);
      if (hpRange) bands.push({ minHp: Number(hpRange[1]), maxHp: Number(hpRange[2]), low, high });
    }
    return bands;
  }

  function generationOptions(item) {
    const configured = DESIGN_DATA[item.id]?.generations;
    if (Array.isArray(configured) && configured.length) return configured;
    if (Array.isArray(item.designGenerations) && item.designGenerations.length) return item.designGenerations;
    return [];
  }
  function selectedGeneration(item, config) {
    return generationOptions(item).find(generation => generation.id === config.generationId) || null;
  }
  function legacyEraOptions(item) {
    const details = detailMap(item);
    return ERA_FIELDS.flatMap(field => {
      const value = details.get(field);
      const bands = parsePriceBands(value);
      const values = bands.length ? bands.flatMap(band => [band.low, band.high]) : parseMoneyTokens(value);
      if (!values.length) return [];
      return [{ id: `${item.id}:${field}`, era: field.replace(" Value", ""), label: field.replace(" Value", ""), low: Math.min(...values), high: Math.max(...values), bands, generationId: null }];
    });
  }
  function eraOptions(item, generationId = null) {
    const cacheKey = `${item.id}|${generationId || "none"}`;
    if (eraCache.has(cacheKey)) return eraCache.get(cacheKey);
    const generation = generationOptions(item).find(entry => entry.id === generationId);
    let options = [];
    if (generation && Array.isArray(generation.valueEras) && generation.valueEras.length) {
      options = generation.valueEras.map(era => ({
        id: era.id,
        era: era.label,
        label: era.label,
        low: Number.isFinite(era.lowPrice) ? era.lowPrice : null,
        high: Number.isFinite(era.highPrice) ? era.highPrice : null,
        bands: era.bands || [],
        generationId: generation.id,
        basis: era.basis || null
      }));
    } else {
      options = legacyEraOptions(item).map(era => ({ ...era, generationId: generation?.id || null }));
    }
    eraCache.set(cacheKey, options);
    return options;
  }
  function motorSpecsText(item) { return clean(detailMap(item).get("Specs / Role")) || clean(item.model); }
  function hpOptions(item) {
    if (!MOTOR_CATEGORIES.has(item.categoryId)) return [];
    if (hpCache.has(item.id)) return hpCache.get(item.id);
    const values = new Set();
    for (const era of legacyEraOptions(item)) for (const band of era.bands) {
      values.add(band.minHp); values.add(band.maxHp);
      for (const hp of COMMON_HP) if (hp >= band.minHp && hp <= band.maxHp) values.add(hp);
    }
    const specs = motorSpecsText(item).split("•")[0];
    const range = specs.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/);
    if (range) {
      const min = Number(range[1]); const max = Number(range[2]);
      values.add(min); values.add(max);
      for (const hp of COMMON_HP) if (hp >= min && hp <= max) values.add(hp);
    }
    const result = [...values].filter(Number.isFinite).sort((a, b) => a - b);
    hpCache.set(item.id, result);
    return result;
  }
  function trailerOption(id) { return TRAILER_OPTIONS.find(option => option.id === id) || TRAILER_OPTIONS[0]; }
  function hpAdjustedRange(base, item, hp) {
    const options = hpOptions(item);
    if (!Number.isFinite(base.low) || !Number.isFinite(base.high) || options.length < 2 || !Number.isFinite(hp)) return { ...base, hpMethod: null };
    const ratio = Math.max(0, Math.min(1, (hp - options[0]) / (options.at(-1) - options[0] || 1)));
    const span = base.high - base.low;
    const window = span * 0.55;
    const center = base.low + ratio * span;
    const roundTo = span >= 2000 ? 100 : 25;
    return { ...base, low: Math.round(Math.max(base.low, center - window / 2) / roundTo) * roundTo, high: Math.round(Math.min(base.high, center + window / 2) / roundTo) * roundTo, hpMethod: "derived" };
  }
  function pricingFor(item, rawConfig = {}) {
    const config = normalizedConfig(rawConfig);
    const generation = selectedGeneration(item, config);
    const era = eraOptions(item, generation?.id || null).find(option => option.era === config.era) || null;
    let pricing = era && Number.isFinite(era.low) && Number.isFinite(era.high)
      ? { low: era.low, high: era.high, era: era.era, generation, hpMethod: null, basis: era.basis || null }
      : { low: item.lowPrice, high: item.highPrice, era: null, generation, hpMethod: null, basis: null };
    if (MOTOR_CATEGORIES.has(item.categoryId) && Number.isFinite(config.hp)) {
      const exactBand = era?.bands.find(band => config.hp >= band.minHp && config.hp <= band.maxHp);
      pricing = exactBand ? { ...pricing, low: exactBand.low, high: exactBand.high, hpMethod: "source" } : hpAdjustedRange(pricing, item, config.hp);
    }
    if (item.categoryId === "boats") {
      const trailer = trailerOption(config.trailer);
      pricing = { ...pricing, low: Number.isFinite(pricing.low) ? pricing.low + trailer.low : pricing.low, high: Number.isFinite(pricing.high) ? pricing.high + trailer.high : pricing.high, trailer };
    }
    return pricing;
  }

  function formatPrice(value) { return Number.isFinite(value) ? money.format(value) : "Not set"; }
  function formatPricing(pricing) { return Number.isFinite(pricing.low) || Number.isFinite(pricing.high) ? `${formatPrice(pricing.low)}–${formatPrice(pricing.high)}` : "Price not set"; }
  function formatCompactPrice(value) { return !Number.isFinite(value) ? "?" : value >= 1000 ? `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : `$${Math.round(value)}`; }
  function selectedConfig(id) { return selections.get(id) || null; }
  function workingConfig(id) { return normalizedConfig(selectedConfig(id) || pendingConfig.get(id) || {}); }
  function missingConfiguration(item, rawConfig = {}) {
    const config = normalizedConfig(rawConfig);
    const missing = [];
    if (generationOptions(item).length > 1 && !config.generationId) missing.push("hull generation");
    if (eraOptions(item, config.generationId).length && !config.era) missing.push("age / era");
    if (hpOptions(item).length && !config.hp) missing.push("horsepower");
    return missing;
  }
  function configurationComplete(item, config = {}) { return missingConfiguration(item, config).length === 0; }
  function configurationRequirementText(item, config = {}) {
    const missing = missingConfiguration(item, config);
    if (!missing.length) return "";
    return `Choose ${missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`} before adding this item to the estimate.`;
  }
  function setConfig(id, patch) {
    const current = workingConfig(id);
    const nextPatch = { ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, "generationId") && patch.generationId !== current.generationId) nextPatch.era = null;
    const next = normalizedConfig({ ...current, ...nextPatch });
    pendingConfig.set(id, next);
    if (selections.has(id)) {
      const item = itemById.get(id);
      if (item && configurationComplete(item, next)) selections.set(id, next); else selections.delete(id);
    }
    saveSelections();
  }
  function toggleItem(id, checked, suppliedConfig = null) { if (checked) selections.set(id, normalizedConfig(suppliedConfig || workingConfig(id))); else selections.delete(id); saveSelections(); }

  function generationSelectOptions(item, selected) {
    return [`<option value=""${selected ? "" : " selected"}>Choose hull generation</option>`, ...generationOptions(item).map(g => `<option value="${escapeHtml(g.id)}"${g.id === selected ? " selected" : ""}>${escapeHtml(g.label)}</option>`)].join("");
  }
  function eraSelectOptions(item, config) {
    const options = eraOptions(item, config.generationId);
    const broad = pricingFor(item, { ...config, era: null });
    return [`<option value=""${config.era ? "" : " selected"}>Choose age / era · broad range ${escapeHtml(formatPricing(broad))}</option>`, ...options.map(option => `<option value="${escapeHtml(option.era)}"${option.era === config.era ? " selected" : ""}>${escapeHtml(option.label)} · ${escapeHtml(formatPricing(option))}</option>`)].join("");
  }
  function hpSelectOptions(item, hp) { return [`<option value=""${hp ? "" : " selected"}>Choose horsepower</option>`, ...hpOptions(item).map(value => `<option value="${value}"${Number(hp) === value ? " selected" : ""}>${value} hp</option>`)].join(""); }
  function trailerSelectOptions(selected) { return TRAILER_OPTIONS.map(option => `<option value="${option.id}"${option.id === selected ? " selected" : ""}>${escapeHtml(option.label)}${option.low || option.high ? ` · +${formatPrice(option.low)}–${formatPrice(option.high)}` : ""}</option>`).join(""); }
  function configurationControls(item, config, prefix) {
    const controls = [];
    const generations = generationOptions(item);
    if (generations.length > 1) controls.push(`<label class="config-field"><span>Hull generation</span><select data-config-generation="${escapeHtml(item.id)}" id="${prefix}-generation">${generationSelectOptions(item, config.generationId)}</select><small>Hull design affects both specifications and market value.</small></label>`);
    if (eraOptions(item, config.generationId).length) controls.push(`<label class="config-field"><span>Age / era</span><select data-config-era="${escapeHtml(item.id)}" id="${prefix}-era">${eraSelectOptions(item, config)}</select></label>`);
    if (hpOptions(item).length) controls.push(`<label class="config-field"><span>Horsepower</span><select data-config-hp="${escapeHtml(item.id)}" id="${prefix}-hp">${hpSelectOptions(item, config.hp)}</select></label>`);
    if (item.categoryId === "boats") controls.push(`<label class="config-field"><span>Trailer included with boat</span><select data-config-trailer="${escapeHtml(item.id)}" id="${prefix}-trailer">${trailerSelectOptions(config.trailer)}</select><small>Boat values assume a standard trailer; only upgrades are added.</small></label>`);
    return controls.length ? `<div class="configuration-controls">${controls.join("")}</div>` : "";
  }
  function generationPanel(item, config) {
    const generation = selectedGeneration(item, config);
    const warning = DESIGN_DATA[item.id]?.warning;
    if (!generation && !warning) return "";
    const rows = generation ? Object.entries(generation.specs || {}).map(([label, spec]) => `<div class="definition-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(spec.value)}${spec.confidence ? ` · ${escapeHtml(spec.confidence)}` : ""}${spec.note ? `<br><small>${escapeHtml(spec.note)}</small>` : ""}</dd></div>`).join("") : "";
    return `<aside class="manufacturer-note">${warning ? `<strong>Generation warning:</strong> ${escapeHtml(warning)}` : ""}${generation ? `<p><strong>${escapeHtml(generation.label)}</strong><br>${escapeHtml(generation.specificationBasis || "")}</p>${rows ? `<dl class="definition-list">${rows}</dl>` : ""}` : ""}</aside>`;
  }
  function pricingNote(item, config, pricing) {
    const notes = [];
    if (pricing.generation) notes.push(`${pricing.generation.label} value basis`);
    if (pricing.era) notes.push(`${pricing.era} age guidance`);
    if (pricing.basis) notes.push(pricing.basis);
    if (MOTOR_CATEGORIES.has(item.categoryId) && config.hp) notes.push(pricing.hpMethod === "source" ? `${config.hp} hp source price band` : `${config.hp} hp derived adjustment`);
    if (item.categoryId === "boats") notes.push(trailerOption(config.trailer).label);
    return notes.length ? `${notes.join(". ")}. Exact condition and included rigging still matter.` : item.priceBasis;
  }

  function updateEstimateHeader() {
    if (!selections.size || !itemById.size) { els.range.textContent = "$0"; els.estimate.setAttribute("aria-label", "Open estimate, no items selected"); return; }
    let low = 0, high = 0, priced = 0, missing = 0;
    for (const [id, config] of selections) {
      const item = itemById.get(id); if (!item) continue;
      const pricing = pricingFor(item, config);
      if (Number.isFinite(pricing.low) && Number.isFinite(pricing.high)) { low += pricing.low; high += pricing.high; priced += 1; } else missing += 1;
    }
    if (!priced) { els.range.textContent = "Price pending"; return; }
    const compact = low === high ? formatCompactPrice(low) : `${formatCompactPrice(low)}–${formatCompactPrice(high)}`;
    els.range.textContent = missing ? `${compact}+` : compact;
  }
  function currentRoute() {
    const parts = location.hash.replace(/^#/, "").split("/");
    if (!parts[0]) return { view: "categories" };
    if (parts[0] === "category" && parts[1]) return { view: SUBTYPE_CATEGORIES.has(decodeURIComponent(parts[1])) ? "subtypes" : "manufacturers", categoryId: decodeURIComponent(parts[1]) };
    if (parts[0] === "subtype" && parts[1] && parts[2]) return { view: "manufacturers", categoryId: decodeURIComponent(parts[1]), subtypeId: decodeURIComponent(parts[2]) };
    if (parts[0] === "manufacturer" && parts[1] && parts[2]) {
      const categoryId = decodeURIComponent(parts[1]);
      if (SUBTYPE_CATEGORIES.has(categoryId) && parts[3]) return { view: "items", categoryId, subtypeId: decodeURIComponent(parts[2]), manufacturer: decodeURIComponent(parts.slice(3).join("/")) };
      return { view: "items", categoryId, manufacturer: decodeURIComponent(parts.slice(2).join("/")) };
    }
    if (parts[0] === "item" && parts[1]) return { view: "detail", itemId: decodeURIComponent(parts.slice(1).join("/")) };
    if (parts[0] === "estimate") return { view: "estimate" };
    return { view: "categories" };
  }
  function routeHash(route) {
    if (route.view === "subtypes") return `category/${encodeURIComponent(route.categoryId)}`;
    if (route.view === "manufacturers" && route.subtypeId) return `subtype/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.subtypeId)}`;
    if (route.view === "manufacturers") return `category/${encodeURIComponent(route.categoryId)}`;
    if (route.view === "items" && route.subtypeId) return `manufacturer/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.subtypeId)}/${encodeURIComponent(route.manufacturer)}`;
    if (route.view === "items") return `manufacturer/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.manufacturer)}`;
    if (route.view === "detail") return `item/${encodeURIComponent(route.itemId)}`;
    if (route.view === "estimate") return "estimate";
    return "";
  }
  function navigate(route, remember = true) { if (remember) appHistory.push(currentRoute()); const hash = routeHash(route); if (hash) location.hash = hash; else { history.replaceState(null, "", `${location.pathname}${location.search}`); render(); } }
  function goBack() { const previous = appHistory.pop(); navigate(previous || { view: "categories" }, false); }
  function clearEstimate() { if (!selections.size || !window.confirm(`Clear all ${selections.size} selected items from the estimate?`)) return; selections.clear(); pendingConfig.clear(); saveSelections(); render(); }
  function heading(title, description = "") { return `<header class="page-heading"><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</header>`; }
  function itemsInCategory(categoryId, subtypeId = null) { return catalog.items.filter(item => item.categoryId === categoryId && (!subtypeId || item.subtypeId === subtypeId)); }
  function subtypesInCategory(categoryId) {
    const groups = new Map();
    for (const item of itemsInCategory(categoryId)) { const id = clean(item.subtypeId) || "other"; if (!groups.has(id)) groups.set(id, { id, name: clean(item.subtypeName) || "Other", order: Number.isFinite(item.subtypeOrder) ? item.subtypeOrder : 999, count: 0 }); groups.get(id).count += 1; }
    return [...groups.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }
  function renderCategories() {
    const cards = catalog.categories.slice().sort((a, b) => a.order - b.order).map(category => `<button class="nav-card" type="button" data-category="${escapeHtml(category.id)}"><span><strong>${escapeHtml(category.name)}</strong><small>${itemsInCategory(category.id).length} catalog items</small></span><span class="chevron">›</span></button>`).join("");
    els.app.innerHTML = `${heading("Build a used aluminum outboard boat package", "Choose the type of item you want to review.")}<section class="card-list category-grid">${cards}</section>`;
    els.app.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => navigate({ view: SUBTYPE_CATEGORIES.has(button.dataset.category) ? "subtypes" : "manufacturers", categoryId: button.dataset.category })));
  }
  function renderSubtypes(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId); if (!category) return renderCategories();
    const cards = subtypesInCategory(route.categoryId).map(group => `<button class="nav-card" data-subtype="${escapeHtml(group.id)}"><span><strong>${escapeHtml(group.name)}</strong><small>${group.count} items</small></span><span class="chevron">›</span></button>`).join("");
    els.app.innerHTML = `${heading(category.name, "Choose the type of equipment.")}<section class="card-list">${cards}</section>`;
    els.app.querySelectorAll("[data-subtype]").forEach(button => button.addEventListener("click", () => navigate({ view: "manufacturers", categoryId: route.categoryId, subtypeId: button.dataset.subtype })));
  }
  function renderManufacturers(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId); if (!category) return renderCategories();
    const counts = new Map(); for (const item of itemsInCategory(route.categoryId, route.subtypeId)) counts.set(item.manufacturer, (counts.get(item.manufacturer) || 0) + 1);
    const cards = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([manufacturer, count]) => `<button class="nav-card" data-manufacturer="${escapeHtml(manufacturer)}"><span><strong>${escapeHtml(manufacturer)}</strong><small>${count} models and variations</small></span><span class="chevron">›</span></button>`).join("");
    els.app.innerHTML = `${heading(category.name, "Choose a manufacturer.")}<section class="card-list">${cards}</section>`;
    els.app.querySelectorAll("[data-manufacturer]").forEach(button => button.addEventListener("click", () => navigate({ view: "items", categoryId: route.categoryId, subtypeId: route.subtypeId || null, manufacturer: button.dataset.manufacturer })));
  }
  function itemCard(item) { const pricing = pricingFor(item, workingConfig(item.id)); return `<article class="item-card"><button class="item-open" data-open="${escapeHtml(item.id)}"><strong>${escapeHtml(item.model || item.displayName)}</strong><span>${escapeHtml(item.subtitle || item.badge || "")}${selections.has(item.id) ? " · In estimate" : ""}</span></button><span class="price">${escapeHtml(formatPricing(pricing))}</span></article>`; }
  function renderItems(route) {
    const items = itemsInCategory(route.categoryId, route.subtypeId).filter(item => item.manufacturer === route.manufacturer).sort((a, b) => (a.model || a.displayName).localeCompare(b.model || b.displayName));
    const note = route.categoryId === "boats" ? `<aside class="manufacturer-note"><strong>Listing-name note:</strong> Sellers often abbreviate or misstate model names.${MANUFACTURER_NOTES[route.manufacturer] ? ` ${escapeHtml(MANUFACTURER_NOTES[route.manufacturer])}` : ""}</aside>` : "";
    els.app.innerHTML = `${heading(route.manufacturer)}${note}<section class="card-list">${items.map(itemCard).join("")}</section>`;
    els.app.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => navigate({ view: "detail", itemId: button.dataset.open })));
  }
  function bindConfigurationControls(item, rerender) {
    els.app.querySelectorAll("[data-config-generation]").forEach(select => select.addEventListener("change", event => { if (select.dataset.configGeneration === item.id) { setConfig(item.id, { generationId: event.currentTarget.value || null }); rerender(); } }));
    els.app.querySelectorAll("[data-config-era]").forEach(select => select.addEventListener("change", event => { if (select.dataset.configEra === item.id) { setConfig(item.id, { era: event.currentTarget.value || null }); rerender(); } }));
    els.app.querySelectorAll("[data-config-hp]").forEach(select => select.addEventListener("change", event => { if (select.dataset.configHp === item.id) { setConfig(item.id, { hp: event.currentTarget.value ? Number(event.currentTarget.value) : null }); rerender(); } }));
    els.app.querySelectorAll("[data-config-trailer]").forEach(select => select.addEventListener("change", event => { if (select.dataset.configTrailer === item.id) { setConfig(item.id, { trailer: event.currentTarget.value }); rerender(); } }));
  }
  function renderDetail(route) {
    const item = itemById.get(route.itemId); if (!item) return renderCategories();
    const config = workingConfig(item.id); const pricing = pricingFor(item, config); const isSelected = selections.has(item.id); const canAdd = configurationComplete(item, config);
    const details = (item.details || []).map(detail => `<div class="definition-row"><dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd></div>`).join("");
    els.app.innerHTML = `<article class="detail-card"><div class="detail-body"><h1 class="detail-title">${escapeHtml(item.displayName)}</h1><p class="detail-subtitle">${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>${configurationControls(item, config, "detail")}${generationPanel(item, config)}<div class="detail-select"><label><input id="detail-select" type="checkbox" ${isSelected ? "checked" : ""} ${!isSelected && !canAdd ? "disabled" : ""}> Add to estimate</label><strong>${escapeHtml(formatPricing(pricing))}</strong></div>${!isSelected && !canAdd ? `<p class="selection-requirement">${escapeHtml(configurationRequirementText(item, config))}</p>` : ""}<div class="price-panel"><div class="price-box"><small>Low estimate</small><strong>${escapeHtml(formatPrice(pricing.low))}</strong></div><div class="price-box"><small>High estimate</small><strong>${escapeHtml(formatPrice(pricing.high))}</strong></div></div><p class="data-note">${escapeHtml(pricingNote(item, config, pricing))}</p><dl class="definition-list">${details}</dl></div></article>`;
    document.querySelector("#detail-select").addEventListener("change", event => { if (event.currentTarget.checked && !configurationComplete(item, config)) { event.currentTarget.checked = false; return; } toggleItem(item.id, event.currentTarget.checked, config); renderDetail(route); });
    bindConfigurationControls(item, () => renderDetail(route));
  }
  function renderEstimate() {
    const lines = [...selections].map(([id, config]) => { const item = itemById.get(id); return item ? { item, config: normalizedConfig(config), pricing: pricingFor(item, config) } : null; }).filter(Boolean);
    if (!lines.length) { els.app.innerHTML = `${heading("Current estimate", "Configured catalog items appear here.")}<section class="empty-state"><h2>No items selected</h2></section>`; return; }
    const lowTotal = lines.reduce((sum, line) => sum + (Number.isFinite(line.pricing.low) ? line.pricing.low : 0), 0); const highTotal = lines.reduce((sum, line) => sum + (Number.isFinite(line.pricing.high) ? line.pricing.high : 0), 0);
    const rows = lines.map(({ item, config, pricing }) => `<article class="estimate-line"><label><input type="checkbox" data-remove="${escapeHtml(item.id)}" checked></label><div><h2>${escapeHtml(item.displayName)}</h2><p>${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}${pricing.generation ? ` · ${escapeHtml(pricing.generation.label)}` : ""}${config.era ? ` · ${escapeHtml(config.era)}` : ""}</p>${configurationControls(item, config, `estimate-${item.id.replace(/[^a-z0-9]/gi, "-")}`)}<div class="line-prices"><span>Low ${escapeHtml(formatPrice(pricing.low))}</span><span>High ${escapeHtml(formatPrice(pricing.high))}</span></div><p class="data-note">${escapeHtml(pricingNote(item, config, pricing))}</p></div></article>`).join("");
    els.app.innerHTML = `${heading("Current estimate", `${lines.length} configured items`)}<section class="estimate-summary"><div><small>Package low</small><strong>${escapeHtml(formatPrice(lowTotal))}</strong></div><div><small>Package high</small><strong>${escapeHtml(formatPrice(highTotal))}</strong></div></section><section class="card-list">${rows}</section><button id="clear-estimate" class="danger-button">Clear estimate</button>`;
    els.app.querySelectorAll("[data-remove]").forEach(input => input.addEventListener("change", event => { toggleItem(event.currentTarget.dataset.remove, false); renderEstimate(); }));
    for (const { item } of lines) bindConfigurationControls(item, renderEstimate);
    document.querySelector("#clear-estimate").addEventListener("click", clearEstimate);
  }
  function render() {
    const route = currentRoute(); els.back.hidden = route.view === "categories";
    if (route.view === "subtypes") renderSubtypes(route); else if (route.view === "manufacturers") renderManufacturers(route); else if (route.view === "items") renderItems(route); else if (route.view === "detail") renderDetail(route); else if (route.view === "estimate") renderEstimate(); else renderCategories();
    els.app.hidden = false;
  }
  function initialize() {
    const data = window.BOATBUILDER_DATA;
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.items) || !data.items.length) throw new Error("The bundled catalog is missing or empty.");
    catalog = data; itemById = new Map(catalog.items.map(item => [item.id, item]));
    selections = new Map([...selections].filter(([id, config]) => { const item = itemById.get(id); return item && configurationComplete(item, config); }));
    saveSelections(); els.loading.hidden = true; render();
  }

  els.back.addEventListener("click", goBack);
  els.home.addEventListener("click", () => navigate({ view: "categories" }));
  els.clear?.addEventListener("click", clearEstimate);
  els.estimate.addEventListener("click", () => navigate({ view: "estimate" }));
  window.addEventListener("hashchange", render);
  try { initialize(); } catch (error) { console.error(error); els.app.hidden = true; els.loading.hidden = false; els.loading.innerHTML = "<strong>The catalog could not be loaded.</strong>"; }
})();