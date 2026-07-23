(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v3";
  const LEGACY_STORAGE_KEYS = [
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

  const MANUFACTURER_NOTES = {
    Lund: "Current and many recent Lund families use SS for side console, Sport for a full windshield, and Tiller for tiller steering. That is not a timeless rule for every Lund ever built. Older paperwork may say Lund American, which is manufacturer wording rather than a model name. Verify the year, full family name, length designation, layout suffix, HIN, and capacity plate.",
    Princecraft: "Princecraft suffixes are layout and trim clues, not interchangeable model names. WS means windshield, SC means side console, BT means back-troller, and DL, DLX, SE, or MAX describe a series or trim level that can change by year. Princecraft also renamed some nearly identical hulls, including Sport 167 becoming Sport 164. Verify the year, complete model name, suffix, HIN, and capacity plate before matching a listing."
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

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  let catalog = null;
  let itemById = new Map();
  let selections = loadSelections();
  const pendingConfig = new Map();
  const eraCache = new Map();
  const hpCache = new Map();
  let appHistory = [];

  function clean(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function escapeHtml(value) {
    return clean(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizedConfig(value = {}) {
    const hp = Number(value.hp);
    return {
      era: clean(value.era) || null,
      hp: Number.isFinite(hp) && hp > 0 ? hp : null,
      trailer: clean(value.trailer) || "standard"
    };
  }

  function loadSelections() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(current)) {
        return new Map(current
          .filter(entry => entry && typeof entry.id === "string")
          .map(entry => [entry.id, normalizedConfig(entry)]));
      }

      const v2 = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEYS[0]) || "null");
      if (Array.isArray(v2)) {
        return new Map(v2
          .filter(entry => entry && typeof entry.id === "string")
          .map(entry => [entry.id, normalizedConfig(entry)]));
      }

      const v1 = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEYS[1]) || "[]");
      if (Array.isArray(v1)) {
        return new Map(v1
          .filter(id => typeof id === "string")
          .map(id => [id, normalizedConfig()]));
      }
    } catch (error) {
      console.warn("Could not restore the saved estimate.", error);
    }
    return new Map();
  }

  function saveSelections() {
    const payload = [...selections].map(([id, config]) => ({ id, ...normalizedConfig(config) }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    els.count.textContent = String(selections.size);
    if (els.clear) els.clear.disabled = selections.size === 0;
    updateEstimateHeader();
  }

  function detailMap(item) {
    return new Map((item.details || []).map(detail => [detail.label, detail.value]));
  }

  function parseAmount(numberText, suffix) {
    const number = Number(numberText);
    if (!Number.isFinite(number)) return null;
    return suffix ? Math.round(number * 1000) : Math.round(number);
  }

  function parseMoneyTokens(value) {
    const text = clean(value).replaceAll(",", "");
    if (!text) return [];
    const values = [];
    const pattern = /\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const token = match[0];
      if (!token.includes("$") && !match[2]) continue;
      const amount = parseAmount(match[1], match[2]);
      if (amount !== null) values.push(amount);
    }
    return values;
  }

  function parsePriceBands(value) {
    const text = clean(value).replaceAll(",", "");
    if (!text) return [];
    const bands = [];

    for (const segment of text.split(";")) {
      const priceMatches = [...segment.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)\s*[–—-]\s*\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)];
      const priceMatch = priceMatches.at(-1);
      if (!priceMatch) continue;

      const low = parseAmount(priceMatch[1], priceMatch[2]);
      const high = parseAmount(priceMatch[3], priceMatch[4]);
      if (low === null || high === null) continue;

      const prefix = segment.slice(0, priceMatch.index).trim();
      const hpRanges = [...prefix.matchAll(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/g)];
      const hpRange = hpRanges.at(-1);
      if (hpRange) {
        bands.push({ minHp: Number(hpRange[1]), maxHp: Number(hpRange[2]), low, high });
        continue;
      }

      const single = [...prefix.matchAll(/(\d+(?:\.\d+)?)(?=\s*:?\s*$)/g)].at(-1);
      if (single) {
        const hp = Number(single[1]);
        bands.push({ minHp: hp, maxHp: hp, low, high });
      }
    }

    return bands.filter(band => Number.isFinite(band.minHp) && Number.isFinite(band.maxHp));
  }

  function eraOptions(item) {
    if (eraCache.has(item.id)) return eraCache.get(item.id);
    const details = detailMap(item);
    const options = ERA_FIELDS.flatMap(field => {
      const value = details.get(field);
      const bands = parsePriceBands(value);
      const values = bands.length ? bands.flatMap(band => [band.low, band.high]) : parseMoneyTokens(value);
      if (!values.length) return [];
      return [{
        era: field.replace(" Value", ""),
        low: Math.min(...values),
        high: Math.max(...values),
        bands
      }];
    });
    eraCache.set(item.id, options);
    return options;
  }

  function motorSpecsText(item) {
    const details = detailMap(item);
    return clean(details.get("Specs / Role")) || clean(item.model);
  }

  function hpOptions(item) {
    if (!MOTOR_CATEGORIES.has(item.categoryId)) return [];
    if (hpCache.has(item.id)) return hpCache.get(item.id);

    const values = new Set();
    for (const era of eraOptions(item)) {
      for (const band of era.bands) {
        values.add(band.minHp);
        values.add(band.maxHp);
        for (const hp of COMMON_HP) {
          if (hp >= band.minHp && hp <= band.maxHp) values.add(hp);
        }
      }
    }

    const specs = motorSpecsText(item).split("•")[0];
    const range = specs.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/);
    if (range) {
      const min = Number(range[1]);
      const max = Number(range[2]);
      values.add(min);
      values.add(max);
      for (const hp of COMMON_HP) {
        if (hp >= min && hp <= max) values.add(hp);
      }
    } else {
      for (const match of specs.matchAll(/\d+(?:\.\d+)?/g)) {
        const hp = Number(match[0]);
        if (hp > 0 && hp <= 300) values.add(hp);
      }
    }

    const result = [...values].filter(Number.isFinite).sort((a, b) => a - b);
    hpCache.set(item.id, result);
    return result;
  }

  function trailerOption(id) {
    return TRAILER_OPTIONS.find(option => option.id === id) || TRAILER_OPTIONS[0];
  }

  function hpAdjustedRange(base, item, hp) {
    const options = hpOptions(item);
    if (!Number.isFinite(base.low) || !Number.isFinite(base.high) || options.length < 2 || !Number.isFinite(hp)) {
      return { ...base, hpMethod: null };
    }

    const minHp = options[0];
    const maxHp = options.at(-1);
    const ratio = maxHp === minHp ? 0.5 : Math.max(0, Math.min(1, (hp - minHp) / (maxHp - minHp)));
    const span = Math.max(0, base.high - base.low);
    const window = span * 0.55;
    const center = base.low + ratio * span;
    const roundTo = span >= 2000 ? 100 : 25;
    const low = Math.round(Math.max(base.low, center - window / 2) / roundTo) * roundTo;
    const high = Math.round(Math.min(base.high, center + window / 2) / roundTo) * roundTo;
    return { ...base, low, high, hpMethod: "derived" };
  }

  function pricingFor(item, rawConfig = {}) {
    const config = normalizedConfig(rawConfig);
    const era = eraOptions(item).find(option => option.era === config.era) || null;
    let pricing = era
      ? { low: era.low, high: era.high, era: era.era, hpMethod: null }
      : { low: item.lowPrice, high: item.highPrice, era: null, hpMethod: null };

    if (MOTOR_CATEGORIES.has(item.categoryId) && Number.isFinite(config.hp)) {
      const exactBand = era?.bands.find(band => config.hp >= band.minHp && config.hp <= band.maxHp);
      pricing = exactBand
        ? { low: exactBand.low, high: exactBand.high, era: era.era, hpMethod: "source" }
        : hpAdjustedRange(pricing, item, config.hp);
    }

    if (item.categoryId === "boats") {
      const trailer = trailerOption(config.trailer);
      pricing = {
        ...pricing,
        low: Number.isFinite(pricing.low) ? pricing.low + trailer.low : pricing.low,
        high: Number.isFinite(pricing.high) ? pricing.high + trailer.high : pricing.high,
        trailer
      };
    }

    return pricing;
  }

  function formatPrice(value) {
    return Number.isFinite(value) ? money.format(value) : "Not set";
  }

  function formatPricing(pricing) {
    if (!Number.isFinite(pricing.low) && !Number.isFinite(pricing.high)) return "Price not set";
    return `${formatPrice(pricing.low)}–${formatPrice(pricing.high)}`;
  }

  function formatCompactPrice(value) {
    if (!Number.isFinite(value)) return "?";
    const absolute = Math.abs(value);
    if (absolute >= 1000000) {
      const scaled = value / 1000000;
      return `$${scaled >= 10 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, "")}m`;
    }
    if (absolute >= 1000) {
      const scaled = value / 1000;
      return `$${scaled >= 10 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, "")}k`;
    }
    return `$${Math.round(value)}`;
  }

  function updateEstimateHeader() {
    if (!els.range || !els.estimate) return;
    if (!selections.size || !itemById.size) {
      els.range.textContent = "$0";
      els.estimate.setAttribute("aria-label", "Open estimate, no items selected");
      return;
    }

    let low = 0;
    let high = 0;
    let priced = 0;
    let missing = 0;

    for (const [id, config] of selections) {
      const item = itemById.get(id);
      if (!item) continue;
      const pricing = pricingFor(item, config);
      if (Number.isFinite(pricing.low) && Number.isFinite(pricing.high)) {
        low += pricing.low;
        high += pricing.high;
        priced += 1;
      } else {
        missing += 1;
      }
    }

    if (!priced) {
      els.range.textContent = "Price pending";
      els.estimate.setAttribute("aria-label", `Open estimate, ${selections.size} selected items, prices pending`);
      return;
    }

    const compact = low === high ? formatCompactPrice(low) : `${formatCompactPrice(low)}–${formatCompactPrice(high)}`;
    els.range.textContent = missing ? `${compact}+` : compact;
    const missingText = missing ? `, plus ${missing} ${missing === 1 ? "item" : "items"} with incomplete pricing` : "";
    els.estimate.setAttribute(
      "aria-label",
      `Open estimate, ${selections.size} selected ${selections.size === 1 ? "item" : "items"}, ${formatPrice(low)} to ${formatPrice(high)}${missingText}`
    );
  }

  function selectedConfig(id) {
    return selections.get(id) || null;
  }

  function workingConfig(id) {
    return normalizedConfig(selectedConfig(id) || pendingConfig.get(id) || {});
  }

  function missingConfiguration(item, rawConfig = {}) {
    const config = normalizedConfig(rawConfig);
    const missing = [];
    if (eraOptions(item).length && !config.era) missing.push("age / era");
    if (hpOptions(item).length && !config.hp) missing.push("horsepower");
    return missing;
  }

  function configurationComplete(item, rawConfig = {}) {
    return missingConfiguration(item, rawConfig).length === 0;
  }

  function configurationRequirementText(item, rawConfig = {}) {
    const missing = missingConfiguration(item, rawConfig);
    if (!missing.length) return "";
    if (missing.length === 1) return `Choose ${missing[0]} before adding this item to the estimate.`;
    return `Choose ${missing.slice(0, -1).join(", ")} and ${missing.at(-1)} before adding this item to the estimate.`;
  }

  function setConfig(id, patch) {
    const next = normalizedConfig({ ...workingConfig(id), ...patch });
    pendingConfig.set(id, next);
    if (selections.has(id)) {
      const item = itemById.get(id);
      if (item && configurationComplete(item, next)) selections.set(id, next);
      else selections.delete(id);
    }
    saveSelections();
  }

  function toggleItem(id, checked, suppliedConfig = null) {
    if (checked) selections.set(id, normalizedConfig(suppliedConfig || workingConfig(id)));
    else selections.delete(id);
    saveSelections();
  }

  function eraSelectOptions(item, era) {
    const broad = pricingFor(item, { era: null });
    const options = [`<option value=""${era ? "" : " selected"}>Choose age / era · broad range ${escapeHtml(formatPricing(broad))}</option>`];
    for (const option of eraOptions(item)) {
      options.push(`<option value="${escapeHtml(option.era)}"${option.era === era ? " selected" : ""}>${escapeHtml(option.era)} · ${escapeHtml(formatPricing(option))}</option>`);
    }
    return options.join("");
  }

  function hpSelectOptions(item, hp) {
    const options = [`<option value=""${hp ? "" : " selected"}>Choose horsepower</option>`];
    for (const value of hpOptions(item)) {
      options.push(`<option value="${value}"${Number(hp) === value ? " selected" : ""}>${value} hp</option>`);
    }
    return options.join("");
  }

  function trailerSelectOptions(selected) {
    return TRAILER_OPTIONS.map(option => `<option value="${option.id}"${option.id === selected ? " selected" : ""}>${escapeHtml(option.label)}${option.low || option.high ? ` · +${formatPrice(option.low)}–${formatPrice(option.high)}` : ""}</option>`).join("");
  }

  function configurationControls(item, config, prefix) {
    const controls = [];
    const eras = eraOptions(item);
    const hpValues = hpOptions(item);

    if (eras.length) {
      controls.push(`<label class="config-field">
        <span>Age / era</span>
        <select data-config-era="${escapeHtml(item.id)}" id="${prefix}-era">${eraSelectOptions(item, config.era)}</select>
      </label>`);
    }

    if (hpValues.length) {
      controls.push(`<label class="config-field">
        <span>Horsepower</span>
        <select data-config-hp="${escapeHtml(item.id)}" id="${prefix}-hp">${hpSelectOptions(item, config.hp)}</select>
      </label>`);
    }

    if (item.categoryId === "boats") {
      controls.push(`<label class="config-field">
        <span>Trailer included with boat</span>
        <select data-config-trailer="${escapeHtml(item.id)}" id="${prefix}-trailer">${trailerSelectOptions(config.trailer)}</select>
        <small>Boat values already assume a standard factory or generic trailer. Only the selected upgrade is added.</small>
      </label>`);
    }

    return controls.length ? `<div class="configuration-controls">${controls.join("")}</div>` : "";
  }

  function pricingNote(item, config, pricing) {
    const notes = [];
    if (pricing.era) notes.push(`${pricing.era} value guidance`);
    if (MOTOR_CATEGORIES.has(item.categoryId)) {
      if (!config.hp) notes.push("Choose horsepower to narrow this motor estimate");
      else if (pricing.hpMethod === "source") notes.push(`${config.hp} hp source price band`);
      else if (pricing.hpMethod === "derived") notes.push(`${config.hp} hp adjustment derived from the family range because no separate source band exists`);
    }
    if (item.categoryId === "boats") notes.push(trailerOption(config.trailer).label);
    return notes.length ? `${notes.join(". ")}. Exact condition and included rigging still matter.` : item.priceBasis;
  }

  function currentRoute() {
    const parts = location.hash.replace(/^#/, "").split("/");
    if (!parts[0]) return { view: "categories" };
    if (parts[0] === "category" && parts[1]) {
      const categoryId = decodeURIComponent(parts[1]);
      return { view: SUBTYPE_CATEGORIES.has(categoryId) ? "subtypes" : "manufacturers", categoryId };
    }
    if (parts[0] === "subtype" && parts[1] && parts[2]) {
      return { view: "manufacturers", categoryId: decodeURIComponent(parts[1]), subtypeId: decodeURIComponent(parts[2]) };
    }
    if (parts[0] === "manufacturer" && parts[1] && parts[2]) {
      const categoryId = decodeURIComponent(parts[1]);
      if (SUBTYPE_CATEGORIES.has(categoryId) && parts[3]) {
        return {
          view: "items",
          categoryId,
          subtypeId: decodeURIComponent(parts[2]),
          manufacturer: decodeURIComponent(parts.slice(3).join("/"))
        };
      }
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

  function navigate(route, remember = true) {
    if (remember) appHistory.push(currentRoute());
    const hash = routeHash(route);
    if (hash) location.hash = hash;
    else {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      render();
    }
  }

  function goBack() {
    const previous = appHistory.pop();
    if (previous) navigate(previous, false);
    else navigate({ view: "categories" }, false);
  }

  function clearEstimate() {
    if (!selections.size) return;
    if (!window.confirm(`Clear all ${selections.size} selected ${selections.size === 1 ? "item" : "items"} from the estimate?`)) return;
    selections.clear();
    pendingConfig.clear();
    saveSelections();
    render();
  }

  function heading(title, description = "") {
    return `<header class="page-heading"><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</header>`;
  }

  function itemsInCategory(categoryId, subtypeId = null) {
    return catalog.items.filter(item => item.categoryId === categoryId && (!subtypeId || item.subtypeId === subtypeId));
  }

  function subtypesInCategory(categoryId) {
    const groups = new Map();
    for (const item of itemsInCategory(categoryId)) {
      const id = clean(item.subtypeId) || "other";
      if (!groups.has(id)) {
        groups.set(id, {
          id,
          name: clean(item.subtypeName) || "Other",
          order: Number.isFinite(item.subtypeOrder) ? item.subtypeOrder : 999,
          count: 0
        });
      }
      groups.get(id).count += 1;
    }
    return [...groups.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }

  function subtypeInCategory(categoryId, subtypeId) {
    return subtypesInCategory(categoryId).find(entry => entry.id === subtypeId) || null;
  }

  function renderSubtypes(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId);
    if (!category) return renderCategories();
    const cards = subtypesInCategory(route.categoryId).map(group => `<button class="nav-card" type="button" data-subtype="${escapeHtml(group.id)}">
      <span><strong>${escapeHtml(group.name)}</strong><small>${group.count} catalog ${group.count === 1 ? "item" : "items"}</small></span>
      <span class="chevron" aria-hidden="true">›</span>
    </button>`).join("");

    els.app.innerHTML = `${heading(category.name, "Choose the type of equipment.")}
      <section class="card-list" aria-label="Equipment types">${cards}</section>`;

    els.app.querySelectorAll("[data-subtype]").forEach(button => {
      button.addEventListener("click", () => navigate({ view: "manufacturers", categoryId: route.categoryId, subtypeId: button.dataset.subtype }));
    });
  }

  function renderCategories() {
    const cards = catalog.categories
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(category => {
        const count = itemsInCategory(category.id).length;
        return `<button class="nav-card" type="button" data-category="${escapeHtml(category.id)}">
          <span><strong>${escapeHtml(category.name)}</strong><small>${count} catalog ${count === 1 ? "item" : "items"}</small></span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>`;
      }).join("");

    els.app.innerHTML = `${heading("Build a used boat package", "Choose the type of item you want to review.")}
      <section class="card-list category-grid" aria-label="Categories">${cards}</section>
      <p class="data-note">The catalog is bundled with BoatBuilder from the maintained research spreadsheet. BoatBuilder does not use AppSheet.</p>`;

    els.app.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => navigate({
        view: SUBTYPE_CATEGORIES.has(button.dataset.category) ? "subtypes" : "manufacturers",
        categoryId: button.dataset.category
      }));
    });
  }

  function renderManufacturers(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId);
    if (!category) return renderCategories();
    const subtype = route.subtypeId ? subtypeInCategory(route.categoryId, route.subtypeId) : null;
    const counts = new Map();
    for (const item of itemsInCategory(route.categoryId, route.subtypeId)) {
      counts.set(item.manufacturer, (counts.get(item.manufacturer) || 0) + 1);
    }

    const cards = [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([manufacturer, count]) => `<button class="nav-card" type="button" data-manufacturer="${escapeHtml(manufacturer)}">
        <span><strong>${escapeHtml(manufacturer)}</strong><small>${count} ${count === 1 ? "model or variation" : "models and variations"}</small></span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>`).join("");

    els.app.innerHTML = `${heading(subtype?.name || category.name, subtype ? `${category.name} · Choose a manufacturer.` : "Choose a manufacturer.")}
      <section class="card-list" aria-label="Manufacturers">${cards}</section>`;

    els.app.querySelectorAll("[data-manufacturer]").forEach(button => {
      button.addEventListener("click", () => navigate({
        view: "items",
        categoryId: route.categoryId,
        subtypeId: route.subtypeId || null,
        manufacturer: button.dataset.manufacturer
      }));
    });
  }

  function itemCard(item) {
    const config = workingConfig(item.id);
    const pricing = pricingFor(item, config);
    const status = selections.has(item.id) ? " · In estimate" : "";
    const subtitle = `${item.subtitle || item.badge || ""}${status}`;

    return `<article class="item-card">
      <button class="item-open" type="button" data-open="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.model || item.displayName)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </button>
      <span class="price">${escapeHtml(formatPricing(pricing))}</span>
    </article>`;
  }

  function bindItemCards() {
    els.app.querySelectorAll("[data-open]").forEach(button => {
      button.addEventListener("click", () => navigate({ view: "detail", itemId: button.dataset.open }));
    });
  }

  function renderItems(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId);
    const subtype = route.subtypeId ? subtypeInCategory(route.categoryId, route.subtypeId) : null;
    const items = itemsInCategory(route.categoryId, route.subtypeId)
      .filter(item => item.manufacturer === route.manufacturer)
      .sort((a, b) => (a.model || a.displayName).localeCompare(b.model || b.displayName));

    const specific = MANUFACTURER_NOTES[route.manufacturer];
    const namingNote = route.categoryId === "boats"
      ? `<aside class="manufacturer-note"><strong>Listing-name note:</strong> Sellers often abbreviate, omit, or misstate model names. BoatBuilder uses the official family, size, and layout name when it can be verified. Brand suffixes are not universal.${specific ? ` ${escapeHtml(specific)}` : ""}</aside>`
      : "";
    const context = [category?.name, subtype?.name].filter(Boolean).join(" · ");

    els.app.innerHTML = `${heading(route.manufacturer, context)}${namingNote}
      <section class="card-list" aria-label="Models and variations">${items.map(itemCard).join("")}</section>`;
    bindItemCards();
  }

  function bindConfigurationControls(item, rerender) {
    els.app.querySelectorAll("[data-config-era]").forEach(select => {
      if (select.dataset.configEra !== item.id) return;
      select.addEventListener("change", event => {
        setConfig(item.id, { era: event.currentTarget.value || null });
        rerender();
      });
    });
    els.app.querySelectorAll("[data-config-hp]").forEach(select => {
      if (select.dataset.configHp !== item.id) return;
      select.addEventListener("change", event => {
        setConfig(item.id, { hp: event.currentTarget.value ? Number(event.currentTarget.value) : null });
        rerender();
      });
    });
    els.app.querySelectorAll("[data-config-trailer]").forEach(select => {
      if (select.dataset.configTrailer !== item.id) return;
      select.addEventListener("change", event => {
        setConfig(item.id, { trailer: event.currentTarget.value });
        rerender();
      });
    });
  }

  function renderDetail(route) {
    const item = itemById.get(route.itemId);
    if (!item) return renderCategories();

    const config = workingConfig(item.id);
    const pricing = pricingFor(item, config);
    const isSelected = selections.has(item.id);
    const canAdd = configurationComplete(item, config);
    const requirementText = configurationRequirementText(item, config);
    const disableAdd = !isSelected && !canAdd;
    const image = item.image?.url ? `<div class="detail-image-wrap">
      <img class="detail-image" src="${escapeHtml(item.image.url)}" alt="${escapeHtml(item.displayName)}" loading="eager" onerror="this.closest('.detail-image-wrap').remove()">
    </div>` : "";
    const photoDetail = item.image ? `<div class="definition-row"><dt>Photo match</dt><dd>${escapeHtml(item.image.matchQuality)}${item.image.note ? ` · ${escapeHtml(item.image.note)}` : ""}</dd></div>` : "";
    const details = item.details.map(detail => `<div class="definition-row"><dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd></div>`).join("");

    els.app.innerHTML = `<article class="detail-card">${image}<div class="detail-body">
      <h1 class="detail-title">${escapeHtml(item.displayName)}</h1>
      <p class="detail-subtitle">${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>
      ${item.badge ? `<span class="badge">${escapeHtml(item.badge)}</span>` : ""}
      ${configurationControls(item, config, "detail")}
      <div class="detail-select">
        <label><input id="detail-select" type="checkbox" ${isSelected ? "checked" : ""} ${disableAdd ? "disabled" : ""}> Add to estimate</label>
        <strong>${escapeHtml(formatPricing(pricing))}</strong>
      </div>
      ${requirementText && !isSelected ? `<p class="selection-requirement">${escapeHtml(requirementText)}</p>` : ""}
      <div class="price-panel">
        <div class="price-box"><small>Low estimate</small><strong>${escapeHtml(formatPrice(pricing.low))}</strong></div>
        <div class="price-box"><small>High estimate</small><strong>${escapeHtml(formatPrice(pricing.high))}</strong></div>
      </div>
      <p class="data-note">${escapeHtml(pricingNote(item, config, pricing))}</p>
      <dl class="definition-list">${photoDetail}${details}</dl>
      ${item.sourceUrl ? `<a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open source information</a>` : ""}
    </div></article>`;

    document.querySelector("#detail-select").addEventListener("change", event => {
      if (event.currentTarget.checked && !configurationComplete(item, config)) {
        event.currentTarget.checked = false;
        return;
      }
      toggleItem(item.id, event.currentTarget.checked, config);
      renderDetail(route);
    });
    bindConfigurationControls(item, () => renderDetail(route));
  }

  function renderEstimate() {
    const lines = [...selections]
      .map(([id, config]) => {
        const item = itemById.get(id);
        if (!item) return null;
        const normalized = normalizedConfig(config);
        return { item, config: normalized, pricing: pricingFor(item, normalized) };
      })
      .filter(Boolean)
      .sort((a, b) => a.item.categoryName.localeCompare(b.item.categoryName) || a.item.displayName.localeCompare(b.item.displayName));

    if (!lines.length) {
      els.app.innerHTML = `${heading("Current estimate", "Configured catalog items appear here.")}
        <section class="empty-state"><h2>No items selected</h2><p>Open an item, choose its required options, and add it from the detail screen.</p></section>`;
      return;
    }

    const lowTotal = lines.reduce((total, line) => total + (Number.isFinite(line.pricing.low) ? line.pricing.low : 0), 0);
    const highTotal = lines.reduce((total, line) => total + (Number.isFinite(line.pricing.high) ? line.pricing.high : 0), 0);
    const missing = lines.filter(line => !Number.isFinite(line.pricing.low) || !Number.isFinite(line.pricing.high)).length;

    const rows = lines.map(({ item, config, pricing }) => `<article class="estimate-line">
      <label aria-label="Remove ${escapeHtml(item.displayName)} from estimate"><input type="checkbox" data-remove="${escapeHtml(item.id)}" checked></label>
      <div><h2>${escapeHtml(item.displayName)}</h2>
        <p>${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}${config.era ? ` · ${escapeHtml(config.era)}` : ""}${config.hp ? ` · ${config.hp} hp` : ""}</p>
        ${configurationControls(item, config, `estimate-${item.id.replace(/[^a-z0-9]/gi, "-")}`)}
        <div class="line-prices"><span>Low ${escapeHtml(formatPrice(pricing.low))}</span><span>High ${escapeHtml(formatPrice(pricing.high))}</span></div>
        <p class="data-note">${escapeHtml(pricingNote(item, config, pricing))}</p>
      </div>
    </article>`).join("");

    els.app.innerHTML = `${heading("Current estimate", `${lines.length} configured ${lines.length === 1 ? "item" : "items"}`)}
      <section class="estimate-summary"><div><small>Package low</small><strong>${escapeHtml(formatPrice(lowTotal))}</strong></div><div><small>Package high</small><strong>${escapeHtml(formatPrice(highTotal))}</strong></div></section>
      ${missing ? `<p class="data-note"><strong>${missing} selected ${missing === 1 ? "item has" : "items have"} an incomplete price range.</strong> Missing values are excluded from totals.</p>` : ""}
      <section class="card-list">${rows}</section>
      <button id="clear-estimate" class="danger-button" type="button">Clear estimate</button>`;

    els.app.querySelectorAll("[data-remove]").forEach(input => {
      input.addEventListener("change", event => {
        toggleItem(event.currentTarget.dataset.remove, false);
        renderEstimate();
      });
    });
    for (const { item } of lines) bindConfigurationControls(item, renderEstimate);
    document.querySelector("#clear-estimate").addEventListener("click", clearEstimate);
  }

  function render() {
    const route = currentRoute();
    els.back.hidden = route.view === "categories";
    if (route.view === "subtypes") renderSubtypes(route);
    else if (route.view === "manufacturers") renderManufacturers(route);
    else if (route.view === "items") renderItems(route);
    else if (route.view === "detail") renderDetail(route);
    else if (route.view === "estimate") renderEstimate();
    else renderCategories();
    els.app.hidden = false;
  }

  function initialize() {
    const data = window.BOATBUILDER_DATA;
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.items) || !data.items.length) {
      throw new Error("The bundled catalog is missing or empty.");
    }
    const ids = data.items.map(item => item.id);
    if (new Set(ids).size !== ids.length) throw new Error("The bundled catalog contains duplicate item IDs.");

    catalog = data;
    itemById = new Map(catalog.items.map(item => [item.id, item]));
    selections = new Map([...selections].filter(([id, config]) => {
      const item = itemById.get(id);
      return item && configurationComplete(item, config);
    }));
    saveSelections();
    els.loading.hidden = true;
    render();
  }

  els.back.addEventListener("click", goBack);
  els.home.addEventListener("click", () => navigate({ view: "categories" }));
  els.clear?.addEventListener("click", clearEstimate);
  els.estimate.addEventListener("click", () => navigate({ view: "estimate" }));
  window.addEventListener("hashchange", render);

  try {
    initialize();
  } catch (error) {
    console.error(error);
    els.app.hidden = true;
    els.loading.hidden = false;
    els.loading.innerHTML = "<strong>The catalog could not be loaded.</strong><br>Refresh after the GitHub Pages deployment finishes.";
  }
})();
