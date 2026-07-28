(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v4";
  const LEGACY_KEYS = ["boatbuilder.currentEstimate.v3", "boatbuilder.currentEstimate.v2", "boatbuilder.currentEstimate.v1"];
  const MOTOR_CATEGORIES = new Set(["main-motors", "kickers"]);
  const SUBTYPE_CATEGORIES = new Set(["electronics", "electrical"]);
  const ERA_FIELDS = ["1980s Value", "1990s Value", "2000s Value", "2010s Value", "2020s Value"];
  const COMMON_HP = [4, 5, 6, 8, 9.8, 9.9, 15, 20, 25, 30, 40, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100, 110, 115, 125, 130, 135, 140, 150, 175, 200];
  const TRAILERS = [
    { id: "standard", label: "Standard factory / generic trailer included", low: 0, high: 0 },
    { id: "premium-single", label: "Premium single axle", low: 400, high: 1200 },
    { id: "galvanized-single", label: "Galvanized single axle", low: 700, high: 1600 },
    { id: "aluminum-single", label: "Aluminum single axle", low: 1200, high: 2500 },
    { id: "tandem", label: "Tandem axle steel / galvanized", low: 1500, high: 3000 },
    { id: "tandem-premium", label: "Premium tandem / aluminum trailer", low: 2500, high: 4500 }
  ];

  const els = {
    app: document.querySelector("#app"), loading: document.querySelector("#loading"),
    back: document.querySelector("#back-button"), home: document.querySelector("#home-button"),
    clear: document.querySelector("#clear-estimate-button"), estimate: document.querySelector("#estimate-button"),
    count: document.querySelector("#estimate-count"), range: document.querySelector("#estimate-range")
  };
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  let catalog;
  let itemById = new Map();
  let selections = loadSelections();
  const pending = new Map();
  let appHistory = [];

  const clean = value => value == null ? "" : String(value).trim();
  const esc = value => clean(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const price = value => Number.isFinite(value) ? money.format(value) : "Not set";
  const priceRange = value => Number.isFinite(value.low) && Number.isFinite(value.high) ? `${price(value.low)}–${price(value.high)}` : "Price pending";
  const compact = value => !Number.isFinite(value) ? "?" : value >= 1000 ? `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : `$${Math.round(value)}`;
  const detailsMap = item => new Map((item.details || []).map(entry => [entry.label, entry.value]));

  function config(value = {}) {
    const hp = Number(value.hp);
    return {
      era: clean(value.era) || null,
      generationId: clean(value.generationId) || null,
      hp: Number.isFinite(hp) && hp > 0 ? hp : null,
      trailer: clean(value.trailer) || "standard"
    };
  }

  function loadSelections() {
    try {
      for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        if (!Array.isArray(parsed)) continue;
        if (parsed.every(entry => typeof entry === "string")) return new Map(parsed.map(id => [id, config()]));
        return new Map(parsed.filter(entry => entry && typeof entry.id === "string").map(entry => [entry.id, config(entry)]));
      }
    } catch (error) { console.warn("Could not restore estimate", error); }
    return new Map();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selections].map(([id, value]) => ({ id, ...config(value) }))));
    els.count.textContent = String(selections.size);
    if (els.clear) els.clear.disabled = selections.size === 0;
    updateHeader();
  }

  function generations(item) {
    return item.categoryId === "boats" && Array.isArray(item.designGenerations) ? item.designGenerations : [];
  }

  function generation(item, generationId) {
    const list = generations(item);
    if (generationId) return list.find(entry => entry.id === generationId) || null;
    return list.length === 1 ? list[0] : null;
  }

  function parseAmount(number, suffix) {
    const parsed = Number(number);
    return Number.isFinite(parsed) ? Math.round(parsed * (suffix ? 1000 : 1)) : null;
  }

  function parseBands(value) {
    const text = clean(value).replaceAll(",", "");
    const bands = [];
    for (const segment of text.split(";")) {
      const match = [...segment.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)\s*[–—-]\s*\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)].at(-1);
      if (!match) continue;
      const low = parseAmount(match[1], match[2]);
      const high = parseAmount(match[3], match[4]);
      const prefix = segment.slice(0, match.index).trim();
      const hpRange = [...prefix.matchAll(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/g)].at(-1);
      if (hpRange) bands.push({ minHp: Number(hpRange[1]), maxHp: Number(hpRange[2]), low, high });
    }
    return bands;
  }

  function legacyEras(item) {
    const details = detailsMap(item);
    return ERA_FIELDS.flatMap(field => {
      const value = clean(details.get(field));
      const numbers = [...value.replaceAll(",", "").matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*([kK]?)/g)]
        .filter(match => match[0].includes("$") || match[2])
        .map(match => parseAmount(match[1], match[2]));
      if (numbers.length < 2) return [];
      return [{ id: `${item.id}:${field}`, label: field.replace(" Value", ""), lowPrice: Math.min(...numbers), highPrice: Math.max(...numbers), bands: parseBands(value), generationIds: [] }];
    });
  }

  function eras(item) {
    if (item.categoryId === "boats" && Array.isArray(item.valueEras) && item.valueEras.length) {
      return item.valueEras.map(entry => ({
        id: entry.id, label: entry.label, lowPrice: entry.lowPrice, highPrice: entry.highPrice,
        bands: entry.bands || [], generationIds: entry.generationIds || (entry.generationId ? [entry.generationId] : [])
      }));
    }
    return legacyEras(item);
  }

  function applicableEras(item, generationId) {
    return eras(item).filter(entry => !entry.generationIds.length || (generationId && entry.generationIds.includes(generationId)));
  }

  function hpOptions(item) {
    if (!MOTOR_CATEGORIES.has(item.categoryId)) return [];
    const values = new Set();
    for (const era of eras(item)) for (const band of era.bands) {
      values.add(band.minHp); values.add(band.maxHp);
      for (const hp of COMMON_HP) if (hp >= band.minHp && hp <= band.maxHp) values.add(hp);
    }
    const specs = clean(detailsMap(item).get("Specs / Role") || item.model).split("•")[0];
    const range = specs.match(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/);
    if (range) for (const hp of COMMON_HP) if (hp >= Number(range[1]) && hp <= Number(range[2])) values.add(hp);
    return [...values].sort((a, b) => a - b);
  }

  function trailer(id) { return TRAILERS.find(entry => entry.id === id) || TRAILERS[0]; }

  function pricingFor(item, raw = {}) {
    const selected = config(raw);
    const chosenGeneration = generation(item, selected.generationId);
    const chosenEra = applicableEras(item, chosenGeneration?.id).find(entry => entry.label === selected.era) || null;
    let low = chosenEra?.lowPrice ?? (item.categoryId === "boats" && generations(item).length > 1 ? null : item.lowPrice);
    let high = chosenEra?.highPrice ?? (item.categoryId === "boats" && generations(item).length > 1 ? null : item.highPrice);
    let hpMethod = null;
    if (MOTOR_CATEGORIES.has(item.categoryId) && selected.hp && chosenEra) {
      const band = chosenEra.bands.find(entry => selected.hp >= entry.minHp && selected.hp <= entry.maxHp);
      if (band) { low = band.low; high = band.high; hpMethod = "source"; }
    }
    const selectedTrailer = item.categoryId === "boats" ? trailer(selected.trailer) : null;
    if (selectedTrailer) {
      if (Number.isFinite(low)) low += selectedTrailer.low;
      if (Number.isFinite(high)) high += selectedTrailer.high;
    }
    return { low, high, era: chosenEra?.label || null, generation: chosenGeneration, trailer: selectedTrailer, hpMethod };
  }

  function working(id) { return config(selections.get(id) || pending.get(id) || {}); }
  function missing(item, raw = {}) {
    const selected = config(raw); const result = [];
    if (generations(item).length > 1 && !selected.generationId) result.push("hull generation");
    if (applicableEras(item, generation(item, selected.generationId)?.id).length && !selected.era) result.push("age / value era");
    if (hpOptions(item).length && !selected.hp) result.push("horsepower");
    return result;
  }
  function complete(item, raw) { return missing(item, raw).length === 0; }
  function setConfig(id, patch) {
    const item = itemById.get(id);
    const previous = working(id);
    const next = config({ ...previous, ...patch });
    if (patch.generationId !== undefined && patch.generationId !== previous.generationId) {
      const allowed = applicableEras(item, next.generationId).map(entry => entry.label);
      if (!allowed.includes(next.era)) next.era = null;
    }
    pending.set(id, next);
    if (selections.has(id)) complete(item, next) ? selections.set(id, next) : selections.delete(id);
    save();
  }

  function generationOptions(item, selected) {
    return [`<option value=""${selected ? "" : " selected"}>Choose hull generation</option>`, ...generations(item).map(entry =>
      `<option value="${esc(entry.id)}"${entry.id === selected ? " selected" : ""}>${esc(entry.label)}${entry.startYear ? ` · ${entry.startYear}${entry.endYear ? `–${entry.endYear}` : "+"}` : ""}</option>`
    )].join("");
  }
  function eraOptions(item, selected, generationId) {
    const list = applicableEras(item, generation(item, generationId)?.id);
    return [`<option value=""${selected ? "" : " selected"}>Choose age / value era</option>`, ...list.map(entry =>
      `<option value="${esc(entry.label)}"${entry.label === selected ? " selected" : ""}>${esc(entry.label)} · ${esc(priceRange({ low: entry.lowPrice, high: entry.highPrice }))}</option>`
    )].join("");
  }
  function controls(item, selected, prefix) {
    const fields = [];
    if (generations(item).length > 1) fields.push(`<label class="config-field"><span>Hull design generation</span><select data-generation="${esc(item.id)}" id="${prefix}-generation">${generationOptions(item, selected.generationId)}</select><small>Hull geometry and construction can change value independently of age.</small></label>`);
    if (applicableEras(item, generation(item, selected.generationId)?.id).length) fields.push(`<label class="config-field"><span>Age / value era</span><select data-era="${esc(item.id)}" id="${prefix}-era">${eraOptions(item, selected.era, selected.generationId)}</select></label>`);
    const hp = hpOptions(item);
    if (hp.length) fields.push(`<label class="config-field"><span>Horsepower</span><select data-hp="${esc(item.id)}" id="${prefix}-hp"><option value="">Choose horsepower</option>${hp.map(value => `<option value="${value}"${value === selected.hp ? " selected" : ""}>${value} hp</option>`).join("")}</select></label>`);
    if (item.categoryId === "boats") fields.push(`<label class="config-field"><span>Trailer included with boat</span><select data-trailer="${esc(item.id)}" id="${prefix}-trailer">${TRAILERS.map(entry => `<option value="${entry.id}"${entry.id === selected.trailer ? " selected" : ""}>${esc(entry.label)}${entry.low || entry.high ? ` · +${price(entry.low)}–${price(entry.high)}` : ""}</option>`).join("")}</select></label>`);
    return fields.length ? `<div class="configuration-controls">${fields.join("")}</div>` : "";
  }

  function bindControls(item, rerender) {
    for (const [selector, key, convert] of [["[data-generation]", "generationId", value => value || null], ["[data-era]", "era", value => value || null], ["[data-hp]", "hp", value => value ? Number(value) : null], ["[data-trailer]", "trailer", value => value]]) {
      els.app.querySelectorAll(selector).forEach(select => {
        const id = select.dataset.generation || select.dataset.era || select.dataset.hp || select.dataset.trailer;
        if (id !== item.id) return;
        select.addEventListener("change", event => { setConfig(item.id, { [key]: convert(event.currentTarget.value) }); rerender(); });
      });
    }
  }

  function generationSpecs(pricing) {
    if (!pricing.generation) return "";
    const rows = Object.entries(pricing.generation.specs || {}).map(([label, spec]) => `<div class="definition-row"><dt>${esc(label)}</dt><dd>${esc(spec.value)}${spec.confidence ? ` · ${esc(spec.confidence)}` : ""}${spec.note ? `<br><small>${esc(spec.note)}</small>` : ""}</dd></div>`).join("");
    return `<section class="generation-panel"><h2>${esc(pricing.generation.label)}</h2><p>${esc(pricing.generation.specificationBasis || "")}</p><dl class="definition-list">${rows}</dl></section>`;
  }

  function note(item, selected, pricing) {
    const parts = [];
    if (pricing.generation) parts.push(`${pricing.generation.label} hull`);
    if (pricing.era) parts.push(`${pricing.era} market era`);
    if (item.categoryId === "boats") parts.push(trailer(selected.trailer).label);
    return `${parts.join(". ") || item.priceBasis}. Hull generation and age are both included when generation-specific valuation exists. Exact condition and rigging still matter.`;
  }

  function updateHeader() {
    let low = 0, high = 0, priced = 0, missingCount = 0;
    for (const [id, selected] of selections) {
      const item = itemById.get(id); if (!item) continue;
      const pricing = pricingFor(item, selected);
      if (Number.isFinite(pricing.low) && Number.isFinite(pricing.high)) { low += pricing.low; high += pricing.high; priced++; } else missingCount++;
    }
    els.range.textContent = !priced ? (selections.size ? "Price pending" : "$0") : `${compact(low)}–${compact(high)}${missingCount ? "+" : ""}`;
  }

  function route() {
    const parts = location.hash.replace(/^#/, "").split("/");
    if (parts[0] === "category" && parts[1]) return { view: SUBTYPE_CATEGORIES.has(decodeURIComponent(parts[1])) ? "subtypes" : "manufacturers", categoryId: decodeURIComponent(parts[1]) };
    if (parts[0] === "subtype" && parts[1] && parts[2]) return { view: "manufacturers", categoryId: decodeURIComponent(parts[1]), subtypeId: decodeURIComponent(parts[2]) };
    if (parts[0] === "manufacturer" && parts[1] && parts[2]) return { view: "items", categoryId: decodeURIComponent(parts[1]), manufacturer: decodeURIComponent(parts.at(-1)), subtypeId: parts.length > 3 ? decodeURIComponent(parts[2]) : null };
    if (parts[0] === "item" && parts[1]) return { view: "detail", itemId: decodeURIComponent(parts.slice(1).join("/")) };
    if (parts[0] === "estimate") return { view: "estimate" };
    return { view: "categories" };
  }
  function hash(next) {
    if (next.view === "subtypes") return `category/${encodeURIComponent(next.categoryId)}`;
    if (next.view === "manufacturers" && next.subtypeId) return `subtype/${encodeURIComponent(next.categoryId)}/${encodeURIComponent(next.subtypeId)}`;
    if (next.view === "manufacturers") return `category/${encodeURIComponent(next.categoryId)}`;
    if (next.view === "items" && next.subtypeId) return `manufacturer/${encodeURIComponent(next.categoryId)}/${encodeURIComponent(next.subtypeId)}/${encodeURIComponent(next.manufacturer)}`;
    if (next.view === "items") return `manufacturer/${encodeURIComponent(next.categoryId)}/${encodeURIComponent(next.manufacturer)}`;
    if (next.view === "detail") return `item/${encodeURIComponent(next.itemId)}`;
    if (next.view === "estimate") return "estimate";
    return "";
  }
  function navigate(next, remember = true) { if (remember) appHistory.push(route()); const target = hash(next); if (target) location.hash = target; else { history.replaceState(null, "", location.pathname); render(); } }
  const heading = (title, description = "") => `<header class="page-heading"><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ""}</header>`;
  const items = (categoryId, subtypeId = null) => catalog.items.filter(item => item.categoryId === categoryId && (!subtypeId || item.subtypeId === subtypeId));

  function renderCategories() {
    els.app.innerHTML = `${heading("Build a used aluminum outboard boat package", "Choose the type of item you want to review.")}<section class="card-list category-grid">${catalog.categories.slice().sort((a,b) => a.order-b.order).map(category => `<button class="nav-card" data-category="${esc(category.id)}"><span><strong>${esc(category.name)}</strong><small>${items(category.id).length} catalog items</small></span><span class="chevron">›</span></button>`).join("")}</section>`;
    els.app.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => navigate({ view: SUBTYPE_CATEGORIES.has(button.dataset.category) ? "subtypes" : "manufacturers", categoryId: button.dataset.category })));
  }
  function renderSubtypes(current) {
    const groups = new Map(); for (const item of items(current.categoryId)) { const id = item.subtypeId || "other"; if (!groups.has(id)) groups.set(id, { id, name: item.subtypeName || "Other", order: item.subtypeOrder || 999, count: 0 }); groups.get(id).count++; }
    els.app.innerHTML = `${heading(catalog.categories.find(entry => entry.id === current.categoryId)?.name || "Category", "Choose the type of equipment.")}<section class="card-list">${[...groups.values()].sort((a,b)=>a.order-b.order).map(group => `<button class="nav-card" data-subtype="${esc(group.id)}"><span><strong>${esc(group.name)}</strong><small>${group.count} items</small></span><span class="chevron">›</span></button>`).join("")}</section>`;
    els.app.querySelectorAll("[data-subtype]").forEach(button => button.addEventListener("click", () => navigate({ view: "manufacturers", categoryId: current.categoryId, subtypeId: button.dataset.subtype })));
  }
  function renderManufacturers(current) {
    const counts = new Map(); for (const item of items(current.categoryId, current.subtypeId)) counts.set(item.manufacturer, (counts.get(item.manufacturer)||0)+1);
    els.app.innerHTML = `${heading(current.subtypeId || catalog.categories.find(entry=>entry.id===current.categoryId)?.name || "Manufacturers", "Choose a manufacturer.")}<section class="card-list">${[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([name,count]) => `<button class="nav-card" data-manufacturer="${esc(name)}"><span><strong>${esc(name)}</strong><small>${count} models and variations</small></span><span class="chevron">›</span></button>`).join("")}</section>`;
    els.app.querySelectorAll("[data-manufacturer]").forEach(button => button.addEventListener("click", () => navigate({ view:"items", categoryId:current.categoryId, subtypeId:current.subtypeId, manufacturer:button.dataset.manufacturer })));
  }
  function renderItems(current) {
    const list = items(current.categoryId, current.subtypeId).filter(item=>item.manufacturer===current.manufacturer).sort((a,b)=>a.model.localeCompare(b.model));
    els.app.innerHTML = `${heading(current.manufacturer, "Models and variations")}<section class="card-list">${list.map(item => { const pricing = pricingFor(item, working(item.id)); return `<article class="item-card"><button class="item-open" data-open="${esc(item.id)}"><strong>${esc(item.model)}</strong><span>${esc(item.subtitle || item.badge || "")}${selections.has(item.id)?" · In estimate":""}</span></button><span class="price">${esc(priceRange(pricing))}</span></article>`; }).join("")}</section>`;
    els.app.querySelectorAll("[data-open]").forEach(button=>button.addEventListener("click",()=>navigate({view:"detail",itemId:button.dataset.open})));
  }
  function renderDetail(current) {
    const item = itemById.get(current.itemId); if (!item) return renderCategories();
    const selected = working(item.id); const pricing = pricingFor(item, selected); const isSelected = selections.has(item.id); const unmet = missing(item, selected);
    const image = item.image?.url ? `<div class="detail-image-wrap"><img class="detail-image" src="${esc(item.image.url)}" alt="${esc(item.displayName)}" onerror="this.closest('.detail-image-wrap').remove()"></div>` : "";
    const details = (item.details||[]).map(entry=>`<div class="definition-row"><dt>${esc(entry.label)}</dt><dd>${esc(entry.value)}</dd></div>`).join("");
    els.app.innerHTML = `<article class="detail-card">${image}<div class="detail-body"><h1 class="detail-title">${esc(item.displayName)}</h1><p class="detail-subtitle">${esc(item.categoryName)} · ${esc(item.manufacturer)}</p>${item.badge?`<span class="badge">${esc(item.badge)}</span>`:""}${controls(item,selected,"detail")}<div class="detail-select"><label><input id="detail-select" type="checkbox" ${isSelected?"checked":""} ${!isSelected&&unmet.length?"disabled":""}> Add to estimate</label><strong>${esc(priceRange(pricing))}</strong></div>${unmet.length&&!isSelected?`<p class="selection-requirement">Choose ${esc(unmet.join(" and "))} before adding this item.</p>`:""}<div class="price-panel"><div class="price-box"><small>Low estimate</small><strong>${esc(price(pricing.low))}</strong></div><div class="price-box"><small>High estimate</small><strong>${esc(price(pricing.high))}</strong></div></div><p class="data-note">${esc(note(item,selected,pricing))}</p>${generationSpecs(pricing)}<dl class="definition-list">${details}</dl>${item.sourceUrl?`<a class="source-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">Open source information</a>`:""}</div></article>`;
    document.querySelector("#detail-select").addEventListener("change", event=>{ if(event.currentTarget.checked) selections.set(item.id,selected); else selections.delete(item.id); save(); renderDetail(current); });
    bindControls(item,()=>renderDetail(current));
  }
  function renderEstimate() {
    const lines=[...selections].map(([id,selected])=>{const item=itemById.get(id);return item?{item,selected:config(selected),pricing:pricingFor(item,selected)}:null;}).filter(Boolean);
    if(!lines.length){els.app.innerHTML=`${heading("Current estimate","Configured catalog items appear here.")}<section class="empty-state"><h2>No items selected</h2><p>Open an item, configure it, and add it from the detail screen.</p></section>`;return;}
    const low=lines.reduce((sum,line)=>sum+(Number.isFinite(line.pricing.low)?line.pricing.low:0),0), high=lines.reduce((sum,line)=>sum+(Number.isFinite(line.pricing.high)?line.pricing.high:0),0);
    els.app.innerHTML=`${heading("Current estimate",`${lines.length} configured items`)}<section class="estimate-summary"><div><small>Package low</small><strong>${price(low)}</strong></div><div><small>Package high</small><strong>${price(high)}</strong></div></section><section class="card-list">${lines.map(({item,selected,pricing})=>`<article class="estimate-line"><label><input type="checkbox" data-remove="${esc(item.id)}" checked></label><div><h2>${esc(item.displayName)}</h2><p>${esc(item.categoryName)}${pricing.generation?` · ${esc(pricing.generation.label)}`:""}${selected.era?` · ${esc(selected.era)}`:""}</p>${controls(item,selected,`estimate-${item.id.replace(/[^a-z0-9]/gi,"-")}`)}<div class="line-prices"><span>Low ${price(pricing.low)}</span><span>High ${price(pricing.high)}</span></div><p class="data-note">${esc(note(item,selected,pricing))}</p></div></article>`).join("")}</section><button id="clear-estimate" class="danger-button">Clear estimate</button>`;
    els.app.querySelectorAll("[data-remove]").forEach(input=>input.addEventListener("change",event=>{selections.delete(event.currentTarget.dataset.remove);save();renderEstimate();})); for(const {item} of lines) bindControls(item,renderEstimate); document.querySelector("#clear-estimate").addEventListener("click",clearEstimate);
  }
  function clearEstimate(){if(!selections.size||!confirm(`Clear all ${selections.size} selected items?`))return;selections.clear();pending.clear();save();render();}
  function render(){const current=route();els.back.hidden=current.view==="categories";if(current.view==="subtypes")renderSubtypes(current);else if(current.view==="manufacturers")renderManufacturers(current);else if(current.view==="items")renderItems(current);else if(current.view==="detail")renderDetail(current);else if(current.view==="estimate")renderEstimate();else renderCategories();els.app.hidden=false;}
  function initialize(){const data=window.BOATBUILDER_DATA;if(!data||!Array.isArray(data.items)||!data.items.length)throw new Error("Catalog missing");catalog=data;itemById=new Map(data.items.map(item=>[item.id,item]));selections=new Map([...selections].filter(([id,selected])=>itemById.has(id)&&complete(itemById.get(id),selected)));save();els.loading.hidden=true;render();}

  els.back.addEventListener("click",()=>{const previous=appHistory.pop();previous?navigate(previous,false):navigate({view:"categories"},false);});
  els.home.addEventListener("click",()=>navigate({view:"categories"}));
  els.clear?.addEventListener("click",clearEstimate);
  els.estimate.addEventListener("click",()=>navigate({view:"estimate"}));
  window.addEventListener("hashchange",render);
  try{initialize();}catch(error){console.error(error);els.loading.innerHTML="<strong>The catalog could not be loaded.</strong>";}
})();
