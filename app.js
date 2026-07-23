(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v2";
  const LEGACY_STORAGE_KEY = "boatbuilder.currentEstimate.v1";
  const ERA_FIELDS = ["1980s Value", "1990s Value", "2000s Value", "2010s Value", "2020s Value"];

  const els = {
    app: document.querySelector("#app"),
    main: document.querySelector("#app-main"),
    loading: document.querySelector("#loading"),
    back: document.querySelector("#back-button"),
    home: document.querySelector("#home-button"),
    estimate: document.querySelector("#estimate-button"),
    count: document.querySelector("#estimate-count")
  };

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  let catalog = null;
  let itemById = new Map();
  let selections = loadSelections();
  let pendingEra = new Map();
  let appHistory = [];
  const eraCache = new Map();

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

  function loadSelections() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved)) {
        return new Map(saved
          .filter(entry => entry && typeof entry.id === "string")
          .map(entry => [entry.id, { era: clean(entry.era) || null }]));
      }

      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
      if (Array.isArray(legacy)) {
        return new Map(legacy
          .filter(id => typeof id === "string")
          .map(id => [id, { era: null }]));
      }
    } catch (error) {
      console.warn("Could not restore the saved estimate.", error);
    }
    return new Map();
  }

  function saveSelections() {
    const payload = [...selections].map(([id, selection]) => ({
      id,
      era: clean(selection?.era) || null
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    els.count.textContent = String(selections.size);
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
      let amount = Number(match[1]);
      if (match[2]) amount *= 1000;
      if (Number.isFinite(amount)) values.push(Math.round(amount));
    }
    return values;
  }

  function eraOptions(item) {
    if (eraCache.has(item.id)) return eraCache.get(item.id);

    const detailMap = new Map((item.details || []).map(detail => [detail.label, detail.value]));
    const options = ERA_FIELDS.flatMap(field => {
      const values = parseMoneyTokens(detailMap.get(field));
      if (!values.length) return [];
      return [{
        era: field.replace(" Value", ""),
        low: Math.min(...values),
        high: Math.max(...values)
      }];
    });

    eraCache.set(item.id, options);
    return options;
  }

  function pricingFor(item, era) {
    const match = eraOptions(item).find(option => option.era === era);
    return match
      ? { low: match.low, high: match.high, era: match.era }
      : { low: item.lowPrice, high: item.highPrice, era: null };
  }

  function formatPrice(value) {
    return Number.isFinite(value) ? money.format(value) : "Not set";
  }

  function formatPricing(pricing) {
    if (!Number.isFinite(pricing.low) && !Number.isFinite(pricing.high)) {
      return "Price not set";
    }
    return `${formatPrice(pricing.low)}–${formatPrice(pricing.high)}`;
  }

  function selectedEra(id) {
    return clean(selections.get(id)?.era) || null;
  }

  function preferredEra(id) {
    return selectedEra(id) || clean(pendingEra.get(id)) || null;
  }

  function toggleItem(id, checked, era = undefined) {
    if (checked) {
      const resolvedEra = era === undefined ? preferredEra(id) : (clean(era) || null);
      selections.set(id, { era: resolvedEra });
    } else {
      selections.delete(id);
    }
    saveSelections();
  }

  function setEra(id, era) {
    const normalized = clean(era) || null;
    if (normalized) pendingEra.set(id, normalized);
    else pendingEra.delete(id);

    if (selections.has(id)) {
      selections.set(id, { era: normalized });
      saveSelections();
    }
  }

  function eraSelectOptions(item, era) {
    const broad = pricingFor(item, null);
    const options = [`<option value=""${era ? "" : " selected"}>All listed eras · ${escapeHtml(formatPricing(broad))}</option>`];
    for (const option of eraOptions(item)) {
      options.push(`<option value="${escapeHtml(option.era)}"${option.era === era ? " selected" : ""}>${escapeHtml(option.era)} · ${escapeHtml(formatPricing(option))}</option>`);
    }
    return options.join("");
  }

  function currentRoute() {
    const parts = location.hash.replace(/^#/, "").split("/");
    if (!parts[0]) return { view: "categories" };
    if (parts[0] === "category" && parts[1]) {
      return { view: "manufacturers", categoryId: decodeURIComponent(parts[1]) };
    }
    if (parts[0] === "manufacturer" && parts[1] && parts[2]) {
      return {
        view: "items",
        categoryId: decodeURIComponent(parts[1]),
        manufacturer: decodeURIComponent(parts.slice(2).join("/"))
      };
    }
    if (parts[0] === "item" && parts[1]) {
      return { view: "detail", itemId: decodeURIComponent(parts.slice(1).join("/")) };
    }
    if (parts[0] === "estimate") return { view: "estimate" };
    return { view: "categories" };
  }

  function routeHash(route) {
    if (route.view === "manufacturers") return `category/${encodeURIComponent(route.categoryId)}`;
    if (route.view === "items") {
      return `manufacturer/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.manufacturer)}`;
    }
    if (route.view === "detail") return `item/${encodeURIComponent(route.itemId)}`;
    if (route.view === "estimate") return "estimate";
    return "";
  }

  function navigate(route, remember = true) {
    if (remember) appHistory.push(currentRoute());
    const hash = routeHash(route);
    if (hash) {
      location.hash = hash;
    } else {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      render();
    }
  }

  function goBack() {
    const previous = appHistory.pop();
    if (previous) navigate(previous, false);
    else navigate({ view: "categories" }, false);
  }

  function heading(title, description = "") {
    return `<header class="page-heading"><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</header>`;
  }

  function itemsInCategory(categoryId) {
    return catalog.items.filter(item => item.categoryId === categoryId);
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

    els.app.innerHTML = `${heading("Build a boat package", "Choose the type of item you want to review.")}
      <section class="card-list category-grid" aria-label="Categories">${cards}</section>
      <p class="data-note">The catalog is bundled with BoatBuilder from the maintained research spreadsheet. BoatBuilder does not use AppSheet.</p>`;

    els.app.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => navigate({
        view: "manufacturers",
        categoryId: button.dataset.category
      }));
    });
  }

  function renderManufacturers(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId);
    if (!category) return renderCategories();

    const counts = new Map();
    for (const item of itemsInCategory(route.categoryId)) {
      counts.set(item.manufacturer, (counts.get(item.manufacturer) || 0) + 1);
    }

    const cards = [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([manufacturer, count]) => `<button class="nav-card" type="button" data-manufacturer="${escapeHtml(manufacturer)}">
        <span><strong>${escapeHtml(manufacturer)}</strong><small>${count} ${count === 1 ? "model or variation" : "models and variations"}</small></span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>`).join("");

    els.app.innerHTML = `${heading(category.name, "Choose a manufacturer.")}
      <section class="card-list" aria-label="Manufacturers">${cards}</section>`;

    els.app.querySelectorAll("[data-manufacturer]").forEach(button => {
      button.addEventListener("click", () => navigate({
        view: "items",
        categoryId: route.categoryId,
        manufacturer: button.dataset.manufacturer
      }));
    });
  }

  function itemCard(item) {
    const checked = selections.has(item.id);
    const era = selectedEra(item.id);
    const pricing = pricingFor(item, era);
    const subtitle = [item.subtitle || item.badge, era ? `Estimate: ${era}` : ""].filter(Boolean).join(" · ");

    return `<article class="item-card${checked ? " selected" : ""}">
      <label class="select-control" aria-label="${checked ? "Remove from" : "Add to"} estimate">
        <input type="checkbox" data-select="${escapeHtml(item.id)}" ${checked ? "checked" : ""}>
      </label>
      <button class="item-open" type="button" data-open="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.model || item.displayName)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </button>
      <span class="price">${escapeHtml(formatPricing(pricing))}</span>
    </article>`;
  }

  function bindItemCards() {
    els.app.querySelectorAll("[data-select]").forEach(input => {
      input.addEventListener("change", event => {
        toggleItem(event.currentTarget.dataset.select, event.currentTarget.checked);
        event.currentTarget.closest(".item-card")?.classList.toggle("selected", event.currentTarget.checked);
      });
    });
    els.app.querySelectorAll("[data-open]").forEach(button => {
      button.addEventListener("click", () => navigate({ view: "detail", itemId: button.dataset.open }));
    });
  }

  function renderItems(route) {
    const category = catalog.categories.find(entry => entry.id === route.categoryId);
    const items = itemsInCategory(route.categoryId)
      .filter(item => item.manufacturer === route.manufacturer)
      .sort((a, b) => (a.model || a.displayName).localeCompare(b.model || b.displayName));

    els.app.innerHTML = `${heading(route.manufacturer, category?.name || "")}
      <section class="card-list" aria-label="Models and variations">${items.map(itemCard).join("")}</section>`;
    bindItemCards();
  }

  function renderDetail(route) {
    const item = itemById.get(route.itemId);
    if (!item) return renderCategories();

    const era = preferredEra(item.id);
    const pricing = pricingFor(item, era);
    const options = eraOptions(item);
    const image = item.image?.url ? `<div class="detail-image-wrap">
      <img class="detail-image" src="${escapeHtml(item.image.url)}" alt="${escapeHtml(item.displayName)}" loading="eager"
        onerror="this.closest('.detail-image-wrap').remove()">
    </div>` : "";

    const photoDetail = item.image ? `<div class="definition-row">
      <dt>Photo match</dt>
      <dd>${escapeHtml(item.image.matchQuality)}${item.image.note ? ` · ${escapeHtml(item.image.note)}` : ""}</dd>
    </div>` : "";

    const details = item.details.map(detail => `<div class="definition-row">
      <dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>
    </div>`).join("");

    const eraControl = options.length ? `<div class="era-control" style="margin:1rem 0;padding:.85rem;background:#edf3f6;border-radius:.8rem">
      <label for="detail-era"><strong>Age / era for estimate</strong></label>
      <select id="detail-era" style="display:block;width:100%;min-height:2.75rem;margin-top:.45rem;padding:.55rem;border:1px solid #cbd7dd;border-radius:.6rem;background:#fff">${eraSelectOptions(item, era)}</select>
      <small style="display:block;margin-top:.4rem;color:#60717b">Choosing an era changes the values used in the estimate.</small>
    </div>` : "";

    els.app.innerHTML = `<article class="detail-card">${image}<div class="detail-body">
      <h1 class="detail-title">${escapeHtml(item.displayName)}</h1>
      <p class="detail-subtitle">${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>
      ${item.badge ? `<span class="badge">${escapeHtml(item.badge)}</span>` : ""}
      ${eraControl}
      <div class="detail-select">
        <label><input id="detail-select" type="checkbox" ${selections.has(item.id) ? "checked" : ""}> Add to estimate</label>
        <strong id="detail-range">${escapeHtml(formatPricing(pricing))}</strong>
      </div>
      <div class="price-panel">
        <div class="price-box"><small>Low estimate</small><strong id="detail-low">${escapeHtml(formatPrice(pricing.low))}</strong></div>
        <div class="price-box"><small>High estimate</small><strong id="detail-high">${escapeHtml(formatPrice(pricing.high))}</strong></div>
      </div>
      <p id="detail-price-basis" class="data-note">${escapeHtml(era ? `${era} value guidance from the spreadsheet. Exact condition and included controls still matter.` : item.priceBasis)}</p>
      <dl class="definition-list">${photoDetail}${details}</dl>
      ${item.sourceUrl ? `<a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open source information</a>` : ""}
    </div></article>`;

    const checkbox = document.querySelector("#detail-select");
    const eraSelect = document.querySelector("#detail-era");

    checkbox.addEventListener("change", event => {
      toggleItem(item.id, event.currentTarget.checked, eraSelect?.value || null);
    });

    eraSelect?.addEventListener("change", event => {
      const chosenEra = event.currentTarget.value || null;
      setEra(item.id, chosenEra);
      const updated = pricingFor(item, chosenEra);
      document.querySelector("#detail-range").textContent = formatPricing(updated);
      document.querySelector("#detail-low").textContent = formatPrice(updated.low);
      document.querySelector("#detail-high").textContent = formatPrice(updated.high);
      document.querySelector("#detail-price-basis").textContent = chosenEra
        ? `${chosenEra} value guidance from the spreadsheet. Exact condition and included controls still matter.`
        : item.priceBasis;
    });
  }

  function renderEstimate() {
    const lines = [...selections]
      .map(([id, selection]) => {
        const item = itemById.get(id);
        if (!item) return null;
        return { item, era: clean(selection?.era) || null, pricing: pricingFor(item, selection?.era) };
      })
      .filter(Boolean)
      .sort((a, b) => a.item.categoryName.localeCompare(b.item.categoryName) || a.item.displayName.localeCompare(b.item.displayName));

    if (!lines.length) {
      els.app.innerHTML = `${heading("Current estimate", "Checked catalog items appear here.")}
        <section class="empty-state"><h2>No items selected</h2><p>Choose a category and check the items you want in the package.</p></section>`;
      return;
    }

    const lowTotal = lines.reduce((total, line) => total + (Number.isFinite(line.pricing.low) ? line.pricing.low : 0), 0);
    const highTotal = lines.reduce((total, line) => total + (Number.isFinite(line.pricing.high) ? line.pricing.high : 0), 0);
    const missing = lines.filter(line => !Number.isFinite(line.pricing.low) || !Number.isFinite(line.pricing.high)).length;
    const broad = lines.filter(line => eraOptions(line.item).length && !line.era).length;

    const rows = lines.map(({ item, era, pricing }) => {
      const options = eraOptions(item);
      const eraControl = options.length ? `<label class="estimate-era" style="display:grid;gap:.3rem;margin-top:.65rem">
        <span style="color:#60717b;font-size:.78rem;font-weight:700">Age / era</span>
        <select data-estimate-era="${escapeHtml(item.id)}" style="width:100%;min-height:2.5rem;padding:.45rem;border:1px solid #cbd7dd;border-radius:.55rem;background:#fff">${eraSelectOptions(item, era)}</select>
      </label>` : "";

      return `<article class="estimate-line">
        <label aria-label="Remove ${escapeHtml(item.displayName)} from estimate">
          <input type="checkbox" data-remove="${escapeHtml(item.id)}" checked>
        </label>
        <div><h2>${escapeHtml(item.displayName)}</h2>
          <p>${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}${era ? ` · ${escapeHtml(era)}` : ""}</p>
          ${eraControl}
          <div class="line-prices"><span>Low ${escapeHtml(formatPrice(pricing.low))}</span><span>High ${escapeHtml(formatPrice(pricing.high))}</span></div>
        </div>
      </article>`;
    }).join("");

    els.app.innerHTML = `${heading("Current estimate", `${lines.length} selected ${lines.length === 1 ? "item" : "items"}`)}
      <section class="estimate-summary">
        <div><small>Package low</small><strong>${escapeHtml(formatPrice(lowTotal))}</strong></div>
        <div><small>Package high</small><strong>${escapeHtml(formatPrice(highTotal))}</strong></div>
      </section>
      ${broad ? `<p class="data-note"><strong>${broad} age-sensitive ${broad === 1 ? "item is" : "items are"} still using broad all-era values.</strong> Choose an era below for a more useful estimate.</p>` : ""}
      ${missing ? `<p class="data-note"><strong>${missing} selected ${missing === 1 ? "item has" : "items have"} an incomplete price range.</strong> The displayed totals exclude missing values.</p>` : ""}
      <section class="card-list">${rows}</section>
      <button id="clear-estimate" class="danger-button" type="button">Clear estimate</button>`;

    els.app.querySelectorAll("[data-remove]").forEach(input => {
      input.addEventListener("change", event => {
        toggleItem(event.currentTarget.dataset.remove, false);
        renderEstimate();
      });
    });

    els.app.querySelectorAll("[data-estimate-era]").forEach(select => {
      select.addEventListener("change", event => {
        setEra(event.currentTarget.dataset.estimateEra, event.currentTarget.value || null);
        renderEstimate();
      });
    });

    document.querySelector("#clear-estimate").addEventListener("click", () => {
      selections.clear();
      saveSelections();
      renderEstimate();
    });
  }

  function render() {
    const route = currentRoute();
    els.back.hidden = route.view === "categories";

    if (route.view === "manufacturers") renderManufacturers(route);
    else if (route.view === "items") renderItems(route);
    else if (route.view === "detail") renderDetail(route);
    else if (route.view === "estimate") renderEstimate();
    else renderCategories();

    els.app.hidden = false;
    requestAnimationFrame(() => els.main.focus({ preventScroll: true }));
  }

  function initialize() {
    const data = window.BOATBUILDER_DATA;
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("The bundled catalog is missing or empty.");
    }
    const ids = data.items.map(item => item.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error("The bundled catalog contains duplicate item IDs.");
    }

    catalog = data;
    itemById = new Map(catalog.items.map(item => [item.id, item]));
    selections = new Map([...selections].filter(([id]) => itemById.has(id)));
    saveSelections();
    els.loading.hidden = true;
    render();
  }

  els.back.addEventListener("click", goBack);
  els.home.addEventListener("click", () => navigate({ view: "categories" }));
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