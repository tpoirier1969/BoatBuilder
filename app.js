(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v1";
  const SHEET_ID = "17-WMY8q2cCw7smmwLoMWzHbqZTlahi0Atsqe7gh7Wqs";
  const SHEETS = ["App Boats", "App Equipment", "Boat Photos"];
  const REQUIRED_HEADERS = {
    "App Boats": ["Boat ID", "AppSheet Key"],
    "App Equipment": ["Equipment ID", "Category"],
    "Boat Photos": ["Boat ID", "Representative Photo URL", "Match Quality"]
  };

  const CATEGORIES = [
    { id: "boats", name: "Boats", order: 10 },
    { id: "main-motors", name: "Main Motors", order: 20 },
    { id: "kickers", name: "Kicker Motors", order: 30 },
    { id: "bow-trolling-motors", name: "Bow Trolling Motors", order: 40 },
    { id: "downriggers", name: "Downriggers", order: 50 },
    { id: "electronics", name: "Electronics & Navigation", order: 60 },
    { id: "canvas", name: "Bimini, Canvas & Covers", order: 70 },
    { id: "electrical", name: "Electrical Systems", order: 80 }
  ];

  const EQUIPMENT_CATEGORY = {
    "Main Motor": "main-motors",
    Kicker: "kickers",
    "Bow Trolling Motor": "bow-trolling-motors",
    Downrigger: "downriggers",
    Electronics: "electronics",
    "Bimini / Canvas": "canvas",
    Electrical: "electrical"
  };

  const DECADE_FIELDS = [
    "1980s Value",
    "1990s Value",
    "2000s Value",
    "2010s Value",
    "2020s Value"
  ];

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

  let catalog = { categories: CATEGORIES, items: [] };
  let itemById = new Map();
  let selected = loadSelected();
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

  function loadSelected() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  }

  function saveSelected() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    els.count.textContent = String(selected.size);
  }

  function finiteOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
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

  function broadRange(row) {
    const values = DECADE_FIELDS.flatMap(field => parseMoneyTokens(row[field]));
    return values.length
      ? { low: Math.min(...values), high: Math.max(...values) }
      : { low: null, high: null };
  }

  function formatPrice(value) {
    return Number.isFinite(value) ? money.format(value) : "Not set";
  }

  function formatRange(item) {
    if (!Number.isFinite(item.lowPrice) && !Number.isFinite(item.highPrice)) {
      return "Price not set";
    }
    return `${formatPrice(item.lowPrice)}–${formatPrice(item.highPrice)}`;
  }

  function detailRows(row, fields) {
    return fields
      .filter(field => {
        const value = clean(row[field]);
        return value && value !== "—";
      })
      .map(field => ({ label: field, value: row[field] }));
  }

  function loadSheet(sheetName) {
    return new Promise((resolve, reject) => {
      const callback = `boatbuilder_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => finish(new Error(`Timed out loading ${sheetName}`)), 20000);

      function finish(error, rows) {
        window.clearTimeout(timeout);
        delete window[callback];
        script.remove();
        if (error) reject(error);
        else resolve(rows);
      }

      window[callback] = response => {
        if (!response?.table || response.status === "error") {
          finish(new Error(`Google Sheets returned an error for ${sheetName}`));
          return;
        }
        try {
          finish(null, tableToRows(response.table, sheetName));
        } catch (error) {
          finish(error);
        }
      };

      const tqx = `out:json;responseHandler:${callback}`;
      script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&headers=1&tqx=${encodeURIComponent(tqx)}`;
      script.async = true;
      script.onerror = () => finish(new Error(`Could not load ${sheetName}`));
      document.head.append(script);
    });
  }

  function tableToRows(table, sheetName) {
    let headers = table.cols.map(column => clean(column.label || column.id));
    let rows = table.rows || [];
    const required = REQUIRED_HEADERS[sheetName] || [];

    if (!required.every(header => headers.includes(header)) && rows.length) {
      const firstRowHeaders = headers.map((_, index) => {
        const cell = rows[0].c?.[index];
        return clean(cell ? (cell.v ?? cell.f ?? "") : "");
      });

      if (required.every(header => firstRowHeaders.includes(header))) {
        headers = firstRowHeaders;
        rows = rows.slice(1);
      }
    }

    const missing = required.filter(header => !headers.includes(header));
    if (missing.length) {
      throw new Error(`${sheetName} is missing expected columns: ${missing.join(", ")}`);
    }

    return rows
      .map(row => Object.fromEntries(headers.map((header, index) => {
        const cell = row.c?.[index];
        return [header, cell ? (cell.v ?? cell.f ?? "") : ""];
      })))
      .filter(row => Object.values(row).some(value => clean(value)));
  }

  function isApprovedExactPhoto(matchQuality) {
    const value = clean(matchQuality).toLowerCase();
    return value === "exact"
      || value === "exact model and era"
      || value === "exact model and close era"
      || value === "exact model; close era"
      || value === "exact model; current generation"
      || value === "exact factory deck plan; later era";
  }

  function buildCatalog(boatRows, equipmentRows, photoRows) {
    const categoryName = new Map(CATEGORIES.map(category => [category.id, category.name]));
    const photos = new Map(photoRows.map(row => [clean(row["Boat ID"]), row]));
    const items = [];

    const boatFields = [
      "Model Years / Era", "Recommendation", "Big-Water Suitability", "Layout", "Length", "Beam",
      "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth", "Cockpit / Interior Depth",
      "Deadrise", "Transom Height", "Transom Width", "Max HP", "Practical Working HP", "Persons",
      "Capacity Weight", "Fuel Capacity", "Bottom Thickness", "Side / Freeboard Thickness", "Construction",
      "Availability Under $14k", "Placement Reason", "Notes", "Interior Finish / Deck Material",
      "Interior Material Basis", "Washdown / Carpet Fit", ...DECADE_FIELDS
    ];

    for (const row of boatRows) {
      const boatId = clean(row["Boat ID"]);
      const stableKey = clean(row["AppSheet Key"]);
      if (!boatId || !stableKey) continue;

      const price = broadRange(row);
      const photoRow = photos.get(boatId);
      const photoUrl = clean(photoRow?.["Representative Photo URL"]);
      const matchQuality = clean(photoRow?.["Match Quality"]);
      const image = photoUrl && isApprovedExactPhoto(matchQuality)
        ? {
            url: photoUrl,
            source: clean(photoRow["Photo Source Page"]),
            matchQuality,
            note: clean(photoRow["Curation Notes"])
          }
        : null;

      items.push({
        id: `boat:${stableKey}`,
        categoryId: "boats",
        categoryName: "Boats",
        manufacturer: clean(row.Brand) || "Unknown",
        model: clean(row["Exact Model / Variant"])
          || clean(row["Variant / Size"])
          || clean(row["Model Family"])
          || clean(row["Display Name"]),
        displayName: clean(row["Display Name"]) || boatId,
        subtitle: clean(row["Model Years / Era"]),
        badge: clean(row.Recommendation),
        lowPrice: price.low,
        highPrice: price.high,
        priceBasis: "Broad hull guidance across the listed model eras. Choose the applicable era when judging a specific listing.",
        sourceUrl: clean(row["Source URL"]),
        image,
        details: detailRows(row, boatFields)
      });
    }

    const equipmentFields = [
      "Era / Status", "Specs / Role", "Features / Controls", "Known Concerns", "Inspect Before Valuing",
      "Great Lakes / Fit", "Desirability", "Value Guidance", "Audit / Notes", ...DECADE_FIELDS
    ];

    for (const row of equipmentRows) {
      const id = clean(row["Equipment ID"]);
      const categoryId = EQUIPMENT_CATEGORY[clean(row.Category)];
      if (!id || !categoryId) continue;

      const broad = broadRange(row);
      const enteredLow = finiteOrNull(row["Est Low"]);
      const enteredHigh = finiteOrNull(row["Est High"]);
      const low = enteredLow ?? broad.low;
      const high = enteredHigh ?? broad.high;

      items.push({
        id,
        categoryId,
        categoryName: categoryName.get(categoryId),
        manufacturer: clean(row["Manufacturer / System"]) || "Unknown",
        model: clean(row["Model / Component"]) || clean(row["Display Name"]),
        displayName: clean(row["Display Name"]) || clean(row["Model / Component"]),
        subtitle: clean(row["Era / Status"]),
        badge: clean(row.Desirability),
        lowPrice: low,
        highPrice: high,
        priceBasis: enteredLow !== null || enteredHigh !== null
          ? "Configured equipment estimate from the spreadsheet."
          : "Broad family and era guidance. Exact year, size, horsepower, and condition can narrow this range.",
        sourceUrl: clean(row["Source URL"]),
        image: null,
        details: detailRows(row, equipmentFields)
      });
    }

    return { categories: CATEGORIES, items };
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

  function heading(title, description = "") {
    return `<header class="page-heading"><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</header>`;
  }

  function itemsInCategory(categoryId) {
    return catalog.items.filter(item => item.categoryId === categoryId);
  }

  function toggleItem(id, checked) {
    if (checked) selected.add(id);
    else selected.delete(id);
    saveSelected();
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
      <p class="data-note">The catalog is read directly and read-only from the Google Sheet. BoatBuilder does not use AppSheet.</p>`;

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
    const checked = selected.has(item.id);
    return `<article class="item-card${checked ? " selected" : ""}">
      <label class="select-control" aria-label="${checked ? "Remove from" : "Add to"} estimate">
        <input type="checkbox" data-select="${escapeHtml(item.id)}" ${checked ? "checked" : ""}>
      </label>
      <button class="item-open" type="button" data-open="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.model || item.displayName)}</strong>
        <span>${escapeHtml(item.subtitle || item.badge)}</span>
      </button>
      <span class="price">${escapeHtml(formatRange(item))}</span>
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

    const image = item.image?.url ? `<div class="detail-image-wrap">
      <img class="detail-image" src="${escapeHtml(item.image.url)}" alt="${escapeHtml(item.displayName)}" loading="eager"
        onerror="this.closest('.detail-image-wrap').remove()">
    </div>` : "";

    const photoDetail = item.image ? `<div class="definition-row">
      <dt>Photo match</dt>
      <dd>${escapeHtml(item.image.matchQuality)}${item.image.note ? ` — ${escapeHtml(item.image.note)}` : ""}</dd>
    </div>` : "";

    const details = item.details.map(detail => `<div class="definition-row">
      <dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>
    </div>`).join("");

    els.app.innerHTML = `<article class="detail-card">${image}<div class="detail-body">
      <h1 class="detail-title">${escapeHtml(item.displayName)}</h1>
      <p class="detail-subtitle">${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>
      ${item.badge ? `<span class="badge">${escapeHtml(item.badge)}</span>` : ""}
      <div class="detail-select">
        <label><input id="detail-select" type="checkbox" ${selected.has(item.id) ? "checked" : ""}> Add to estimate</label>
        <strong>${escapeHtml(formatRange(item))}</strong>
      </div>
      <div class="price-panel">
        <div class="price-box"><small>Low estimate</small><strong>${escapeHtml(formatPrice(item.lowPrice))}</strong></div>
        <div class="price-box"><small>High estimate</small><strong>${escapeHtml(formatPrice(item.highPrice))}</strong></div>
      </div>
      <p class="data-note">${escapeHtml(item.priceBasis)}</p>
      <dl class="definition-list">${photoDetail}${details}</dl>
      ${item.sourceUrl ? `<a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open source information</a>` : ""}
    </div></article>`;

    document.querySelector("#detail-select").addEventListener("change", event => {
      toggleItem(item.id, event.currentTarget.checked);
    });
  }

  function renderEstimate() {
    const lines = [...selected]
      .map(id => itemById.get(id))
      .filter(Boolean)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.displayName.localeCompare(b.displayName));

    if (!lines.length) {
      els.app.innerHTML = `${heading("Current estimate", "Checked catalog items appear here.")}
        <section class="empty-state"><h2>No items selected</h2><p>Choose a category and check the items you want in the package.</p></section>`;
      return;
    }

    const lowTotal = lines.reduce((total, item) => total + (item.lowPrice ?? 0), 0);
    const highTotal = lines.reduce((total, item) => total + (item.highPrice ?? 0), 0);
    const missing = lines.filter(item => !Number.isFinite(item.lowPrice) || !Number.isFinite(item.highPrice)).length;

    const rows = lines.map(item => `<article class="estimate-line">
      <label aria-label="Remove ${escapeHtml(item.displayName)} from estimate">
        <input type="checkbox" data-remove="${escapeHtml(item.id)}" checked>
      </label>
      <div><h2>${escapeHtml(item.displayName)}</h2>
        <p>${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>
        <div class="line-prices"><span>Low ${escapeHtml(formatPrice(item.lowPrice))}</span><span>High ${escapeHtml(formatPrice(item.highPrice))}</span></div>
      </div>
    </article>`).join("");

    els.app.innerHTML = `${heading("Current estimate", `${lines.length} selected ${lines.length === 1 ? "item" : "items"}`)}
      <section class="estimate-summary">
        <div><small>Package low</small><strong>${escapeHtml(formatPrice(lowTotal))}</strong></div>
        <div><small>Package high</small><strong>${escapeHtml(formatPrice(highTotal))}</strong></div>
      </section>
      ${missing ? `<p class="data-note"><strong>${missing} selected ${missing === 1 ? "item has" : "items have"} an incomplete price range.</strong> The displayed totals exclude missing values.</p>` : ""}
      <section class="card-list">${rows}</section>
      <button id="clear-estimate" class="danger-button" type="button">Clear estimate</button>`;

    els.app.querySelectorAll("[data-remove]").forEach(input => {
      input.addEventListener("change", event => {
        toggleItem(event.currentTarget.dataset.remove, false);
        renderEstimate();
      });
    });

    document.querySelector("#clear-estimate").addEventListener("click", () => {
      selected.clear();
      saveSelected();
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

  els.back.addEventListener("click", goBack);
  els.home.addEventListener("click", () => navigate({ view: "categories" }));
  els.estimate.addEventListener("click", () => navigate({ view: "estimate" }));
  window.addEventListener("hashchange", render);

  saveSelected();

  Promise.all(SHEETS.map(loadSheet))
    .then(([boats, equipment, photos]) => {
      catalog = buildCatalog(boats, equipment, photos);
      itemById = new Map(catalog.items.map(item => [item.id, item]));
      selected = new Set([...selected].filter(id => itemById.has(id)));
      saveSelected();
      els.loading.hidden = true;
      render();
    })
    .catch(error => {
      console.error(error);
      els.loading.innerHTML = "<strong>The catalog could not be loaded.</strong><br>The source Google Sheet must remain shared for anyone with the link.";
    });
})();