(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v1";
  const SHEET_ID = "17-WMY8q2cCw7smmwLoMWzHbqZTlahi0Atsqe7gh7Wqs";
  const SHEETS = {
    boats: "App Boats",
    equipment: "App Equipment",
    photos: "Boat Photos"
  };

  const app = document.querySelector("#app");
  const loading = document.querySelector("#loading");
  const backButton = document.querySelector("#back-button");
  const homeButton = document.querySelector("#home-button");
  const estimateButton = document.querySelector("#estimate-button");
  const estimateCount = document.querySelector("#estimate-count");

  let catalog = null;
  let itemById = new Map();
  let selected = loadSelection();
  let historyStack = [];

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const categoryDefinitions = [
    { id: "boats", name: "Boats", order: 10 },
    { id: "main-motors", name: "Main Motors", order: 20 },
    { id: "kickers", name: "Kicker Motors", order: 30 },
    { id: "bow-trolling-motors", name: "Bow Trolling Motors", order: 40 },
    { id: "downriggers", name: "Downriggers", order: 50 },
    { id: "electronics", name: "Electronics & Navigation", order: 60 },
    { id: "canvas", name: "Bimini, Canvas & Covers", order: 70 },
    { id: "electrical", name: "Electrical Systems", order: 80 }
  ];

  const equipmentCategoryMap = {
    "Main Motor": "main-motors",
    "Kicker": "kickers",
    "Bow Trolling Motor": "bow-trolling-motors",
    "Downrigger": "downriggers",
    "Electronics": "electronics",
    "Bimini / Canvas": "canvas",
    "Electrical": "electrical"
  };

  function loadSelection() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function saveSelection() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    updateEstimateCount();
  }

  function updateEstimateCount() {
    estimateCount.textContent = String(selected.size);
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseMoneyTokens(value) {
    if (value === null || value === undefined || value === "") return [];
    const text = String(value).replaceAll(",", "");
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

  function broadRange(row, fields) {
    const values = fields.flatMap(field => parseMoneyTokens(row[field]));
    if (!values.length) return { low: null, high: null };
    return { low: Math.min(...values), high: Math.max(...values) };
  }

  function detailRows(row, fields) {
    return fields
      .filter(field => row[field] !== "" && row[field] !== null && row[field] !== undefined && row[field] !== "—")
      .map(field => ({ label: field, value: row[field] }));
  }

  function loadSheet(sheetName) {
    return new Promise((resolve, reject) => {
      const callbackName = `boatbuilder_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out loading ${sheetName}`));
      }, 20000);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = response => {
        cleanup();
        if (!response || response.status === "error" || !response.table) {
          reject(new Error(`Google Sheets returned an error for ${sheetName}`));
          return;
        }
        resolve(tableToRows(response.table));
      };

      const tqx = `out:json;responseHandler:${callbackName}`;
      script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=${encodeURIComponent(tqx)}`;
      script.async = true;
      script.onerror = () => {
        cleanup();
        reject(new Error(`Could not load ${sheetName}`));
      };
      document.head.append(script);
    });
  }

  function tableToRows(table) {
    const headers = table.cols.map(column => column.label || column.id || "");
    return table.rows.map(row => {
      const record = {};
      headers.forEach((header, index) => {
        const cell = row.c?.[index];
        record[header] = cell ? (cell.v ?? cell.f ?? "") : "";
      });
      return record;
    }).filter(row => Object.values(row).some(value => value !== ""));
  }

  function buildCatalog(boatRows, equipmentRows, photoRows) {
    const priceFields = ["1980s Value", "1990s Value", "2000s Value", "2010s Value", "2020s Value"];
    const categoryNameById = new Map(categoryDefinitions.map(category => [category.id, category.name]));
    const photosByBoatId = new Map(photoRows.map(row => [row["Boat ID"], row]));
    const items = [];

    const boatDetailFields = [
      "Model Years / Era", "Recommendation", "Big-Water Suitability", "Layout", "Length", "Beam",
      "Chine / Bottom Width", "Dry Hull Weight", "Max / Bow Depth", "Cockpit / Interior Depth",
      "Deadrise", "Transom Height", "Transom Width", "Max HP", "Practical Working HP", "Persons",
      "Capacity Weight", "Fuel Capacity", "Bottom Thickness", "Side / Freeboard Thickness",
      "Construction", "Availability Under $14k", "Placement Reason", "Notes",
      "Interior Finish / Deck Material", "Interior Material Basis", "Washdown / Carpet Fit",
      ...priceFields
    ];

    boatRows.forEach(row => {
      if (!row["Boat ID"]) return;
      const price = broadRange(row, priceFields);
      const photo = photosByBoatId.get(row["Boat ID"]);
      const matchQuality = String(photo?.["Match Quality"] || "");
      const exactPhoto = matchQuality.toLowerCase().startsWith("exact") && photo?.["Representative Photo URL"];
      const sourceKey = row["AppSheet Key"] || row["Boat ID"];

      items.push({
        id: `boat:${sourceKey}`,
        sourceId: sourceKey,
        categoryId: "boats",
        categoryName: "Boats",
        manufacturer: row["Brand"] || "Unknown",
        model: row["Exact Model / Variant"] || row["Variant / Size"] || row["Model Family"] || row["Display Name"],
        displayName: row["Display Name"] || row["Boat ID"],
        subtitle: row["Model Years / Era"] || "",
        badge: row["Recommendation"] || "",
        lowPrice: price.low,
        highPrice: price.high,
        priceBasis: "Broad model-era hull guidance from the spreadsheet",
        image: exactPhoto ? {
          url: photo["Representative Photo URL"],
          source: photo["Photo Source Page"] || "",
          matchQuality,
          note: photo["Curation Notes"] || ""
        } : null,
        sourceUrl: row["Source URL"] || "",
        details: detailRows(row, boatDetailFields)
      });
    });

    const equipmentDetailFields = [
      "Era / Status", "Specs / Role", "Features / Controls", "Known Concerns", "Inspect Before Valuing",
      "Great Lakes / Fit", "Desirability", "Value Guidance", "Audit / Notes", ...priceFields
    ];

    equipmentRows.forEach(row => {
      const categoryId = equipmentCategoryMap[row["Category"]];
      if (!categoryId || !row["Equipment ID"]) return;

      let low = Number(row["Est Low"]);
      let high = Number(row["Est High"]);
      if (!Number.isFinite(low) || !Number.isFinite(high)) {
        const price = broadRange(row, priceFields);
        if (!Number.isFinite(low)) low = price.low;
        if (!Number.isFinite(high)) high = price.high;
      }

      items.push({
        id: row["Equipment ID"],
        sourceId: row["Equipment ID"],
        categoryId,
        categoryName: categoryNameById.get(categoryId),
        manufacturer: row["Manufacturer / System"] || "Unknown",
        model: row["Model / Component"] || row["Display Name"],
        displayName: row["Display Name"] || row["Model / Component"],
        subtitle: row["Era / Status"] || "",
        badge: row["Desirability"] || "",
        lowPrice: Number.isFinite(low) ? low : null,
        highPrice: Number.isFinite(high) ? high : null,
        priceBasis: row["Est Low"] !== "" ? "Spreadsheet estimate range" : "Broad family/era guidance from the spreadsheet",
        image: null,
        sourceUrl: row["Source URL"] || "",
        details: detailRows(row, equipmentDetailFields)
      });
    });

    return {
      schemaVersion: 1,
      source: "Live read-only Google Sheets data",
      categories: categoryDefinitions,
      items
    };
  }

  function routeKey(route) {
    return JSON.stringify(route);
  }

  function currentRoute() {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return { view: "categories" };
    const parts = hash.split("/").map(decodeURIComponent);
    if (parts[0] === "category" && parts[1]) return { view: "manufacturers", categoryId: parts[1] };
    if (parts[0] === "manufacturer" && parts[1] && parts[2]) {
      return { view: "items", categoryId: parts[1], manufacturer: parts.slice(2).join("/") };
    }
    if (parts[0] === "item" && parts[1]) return { view: "detail", itemId: parts.slice(1).join("/") };
    if (parts[0] === "estimate") return { view: "estimate" };
    return { view: "categories" };
  }

  function routeToHash(route) {
    if (route.view === "categories") return "";
    if (route.view === "manufacturers") return `category/${encodeURIComponent(route.categoryId)}`;
    if (route.view === "items") {
      return `manufacturer/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.manufacturer)}`;
    }
    if (route.view === "detail") return `item/${encodeURIComponent(route.itemId)}`;
    if (route.view === "estimate") return "estimate";
    return "";
  }

  function navigate(route, remember = true) {
    const nextHash = routeToHash(route);
    if (remember) {
      const current = currentRoute();
      if (routeKey(current) !== routeKey(route)) historyStack.push(current);
    }
    location.hash = nextHash;
    if (nextHash === "" && location.hash !== "") {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
      render();
    }
  }

  function goBack() {
    const prior = historyStack.pop();
    if (prior) {
      navigate(prior, false);
      return;
    }
    if (history.length > 1) {
      history.back();
      return;
    }
    navigate({ view: "categories" }, false);
  }

  function categoryById(id) {
    return catalog.categories.find(category => category.id === id);
  }

  function itemsInCategory(categoryId) {
    return catalog.items.filter(item => item.categoryId === categoryId);
  }

  function toggleItem(id, checked) {
    if (checked) selected.add(id);
    else selected.delete(id);
    saveSelection();
  }

  function pageHeading(title, description = "") {
    return `<header class="page-heading"><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ""}</header>`;
  }

  function renderCategories() {
    const categories = [...catalog.categories]
      .sort((a, b) => a.order - b.order)
      .map(category => {
        const count = itemsInCategory(category.id).length;
        return `<button class="nav-card" type="button" data-category="${escapeHtml(category.id)}">
          <span><strong>${escapeHtml(category.name)}</strong><small>${count} catalog ${count === 1 ? "item" : "items"}</small></span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>`;
      }).join("");

    app.innerHTML = `${pageHeading("Build a boat package", "Choose the type of item you want to review.")}
      <section class="card-list category-grid" aria-label="Categories">${categories}</section>
      <p class="data-note">The catalog is read directly from the Google Sheet. The app does not use AppSheet or a marketplace-style search screen.</p>`;

    app.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => navigate({ view: "manufacturers", categoryId: button.dataset.category }));
    });
  }

  function renderManufacturers(route) {
    const category = categoryById(route.categoryId);
    if (!category) return renderCategories();

    const groups = new Map();
    itemsInCategory(route.categoryId).forEach(item => {
      groups.set(item.manufacturer, (groups.get(item.manufacturer) || 0) + 1);
    });

    const cards = [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([manufacturer, count]) => `<button class="nav-card" type="button" data-manufacturer="${escapeHtml(manufacturer)}">
        <span><strong>${escapeHtml(manufacturer)}</strong><small>${count} ${count === 1 ? "model or variation" : "models and variations"}</small></span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>`).join("");

    app.innerHTML = `${pageHeading(category.name, "Choose a manufacturer.")}
      <section class="card-list" aria-label="${escapeHtml(category.name)} manufacturers">${cards}</section>`;

    app.querySelectorAll("[data-manufacturer]").forEach(button => {
      button.addEventListener("click", () => navigate({
        view: "items",
        categoryId: route.categoryId,
        manufacturer: button.dataset.manufacturer
      }));
    });
  }

  function itemCard(item) {
    const checked = selected.has(item.id);
    return `<article class="item-card${checked ? " selected" : ""}" data-item-card="${escapeHtml(item.id)}">
      <label class="select-control" aria-label="${checked ? "Remove" : "Add"} ${escapeHtml(item.displayName)} ${checked ? "from" : "to"} estimate">
        <input type="checkbox" data-select-item="${escapeHtml(item.id)}" ${checked ? "checked" : ""}>
      </label>
      <button class="item-open" type="button" data-open-item="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.model || item.displayName)}</strong>
        <span>${escapeHtml(item.subtitle || item.badge || "")}</span>
      </button>
      <span class="price">${escapeHtml(formatRange(item))}</span>
    </article>`;
  }

  function bindItemCards() {
    app.querySelectorAll("[data-select-item]").forEach(input => {
      input.addEventListener("change", event => {
        const id = event.currentTarget.dataset.selectItem;
        toggleItem(id, event.currentTarget.checked);
        const card = event.currentTarget.closest(".item-card");
        card?.classList.toggle("selected", event.currentTarget.checked);
      });
    });

    app.querySelectorAll("[data-open-item]").forEach(button => {
      button.addEventListener("click", () => navigate({ view: "detail", itemId: button.dataset.openItem }));
    });
  }

  function renderItems(route) {
    const category = categoryById(route.categoryId);
    const list = itemsInCategory(route.categoryId)
      .filter(item => item.manufacturer === route.manufacturer)
      .sort((a, b) => (a.model || a.displayName).localeCompare(b.model || b.displayName));

    app.innerHTML = `${pageHeading(route.manufacturer, category ? category.name : "")}
      <section class="card-list" aria-label="${escapeHtml(route.manufacturer)} models">${list.map(itemCard).join("")}</section>`;
    bindItemCards();
  }

  function renderDetail(route) {
    const item = itemById.get(route.itemId);
    if (!item) return renderCategories();

    const checked = selected.has(item.id);
    const image = item.image?.url ? `<div class="detail-image-wrap">
      <img class="detail-image" src="${escapeHtml(item.image.url)}" alt="${escapeHtml(item.displayName)}" loading="eager"
        onerror="this.closest('.detail-image-wrap').remove()">
    </div>` : "";

    const details = item.details.map(detail => `<div class="definition-row">
      <dt>${escapeHtml(detail.label)}</dt>
      <dd>${escapeHtml(detail.value)}</dd>
    </div>`).join("");

    const imageNote = item.image ? `<div class="definition-row">
      <dt>Photo match</dt>
      <dd>${escapeHtml(item.image.matchQuality)}${item.image.note ? ` — ${escapeHtml(item.image.note)}` : ""}</dd>
    </div>` : "";

    app.innerHTML = `<article class="detail-card">
      ${image}
      <div class="detail-body">
        <h1 class="detail-title">${escapeHtml(item.displayName)}</h1>
        <p class="detail-subtitle">${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>
        ${item.badge ? `<span class="badge">${escapeHtml(item.badge)}</span>` : ""}
        <div class="detail-select">
          <label><input id="detail-select" type="checkbox" ${checked ? "checked" : ""}> Add to estimate</label>
          <strong>${escapeHtml(formatRange(item))}</strong>
        </div>
        <div class="price-panel" aria-label="Estimated value range">
          <div class="price-box"><small>Low estimate</small><strong>${escapeHtml(formatPrice(item.lowPrice))}</strong></div>
          <div class="price-box"><small>High estimate</small><strong>${escapeHtml(formatPrice(item.highPrice))}</strong></div>
        </div>
        <p class="data-note">${escapeHtml(item.priceBasis || "")}</p>
        <dl class="definition-list">${imageNote}${details}</dl>
        ${item.sourceUrl ? `<a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open source information</a>` : ""}
      </div>
    </article>`;

    document.querySelector("#detail-select").addEventListener("change", event => {
      toggleItem(item.id, event.currentTarget.checked);
    });
  }

  function renderEstimate() {
    const lines = [...selected]
      .map(id => itemById.get(id))
      .filter(Boolean)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.displayName.localeCompare(b.displayName));

    const lowTotal = lines.reduce((sum, item) => sum + (Number.isFinite(item.lowPrice) ? item.lowPrice : 0), 0);
    const highTotal = lines.reduce((sum, item) => sum + (Number.isFinite(item.highPrice) ? item.highPrice : 0), 0);

    if (!lines.length) {
      app.innerHTML = `${pageHeading("Current estimate", "Checked catalog items appear here.")}
        <section class="empty-state"><h2>No items selected</h2><p>Choose a category and check the items you want in the package.</p></section>`;
      return;
    }

    const lineHtml = lines.map(item => `<article class="estimate-line">
      <label aria-label="Remove ${escapeHtml(item.displayName)} from estimate">
        <input type="checkbox" data-estimate-item="${escapeHtml(item.id)}" checked>
      </label>
      <div>
        <h2>${escapeHtml(item.displayName)}</h2>
        <p>${escapeHtml(item.categoryName)} · ${escapeHtml(item.manufacturer)}</p>
        <div class="line-prices"><span>Low ${escapeHtml(formatPrice(item.lowPrice))}</span><span>High ${escapeHtml(formatPrice(item.highPrice))}</span></div>
      </div>
    </article>`).join("");

    app.innerHTML = `${pageHeading("Current estimate", `${lines.length} selected ${lines.length === 1 ? "item" : "items"}`)}
      <section class="estimate-summary" aria-label="Package totals">
        <div><small>Package low</small><strong>${escapeHtml(formatPrice(lowTotal))}</strong></div>
        <div><small>Package high</small><strong>${escapeHtml(formatPrice(highTotal))}</strong></div>
      </section>
      <section class="card-list">${lineHtml}</section>
      <button id="clear-estimate" class="danger-button" type="button">Clear estimate</button>
      <p class="data-note">Totals use the broad low and high guidance currently stored for each checked item. Items without a configured price contribute $0 until their data is refined.</p>`;

    app.querySelectorAll("[data-estimate-item]").forEach(input => {
      input.addEventListener("change", event => {
        toggleItem(event.currentTarget.dataset.estimateItem, false);
        renderEstimate();
      });
    });

    document.querySelector("#clear-estimate").addEventListener("click", () => {
      selected.clear();
      saveSelection();
      renderEstimate();
    });
  }

  function render() {
    if (!catalog) return;
    const route = currentRoute();
    backButton.hidden = route.view === "categories";
    if (route.view === "categories") renderCategories();
    else if (route.view === "manufacturers") renderManufacturers(route);
    else if (route.view === "items") renderItems(route);
    else if (route.view === "detail") renderDetail(route);
    else if (route.view === "estimate") renderEstimate();
    else renderCategories();
    app.hidden = false;
    requestAnimationFrame(() => document.querySelector("#app-main")?.focus({ preventScroll: true }));
  }

  backButton.addEventListener("click", goBack);
  homeButton.addEventListener("click", () => navigate({ view: "categories" }));
  estimateButton.addEventListener("click", () => navigate({ view: "estimate" }));
  window.addEventListener("hashchange", render);

  updateEstimateCount();

  Promise.all([
    loadSheet(SHEETS.boats),
    loadSheet(SHEETS.equipment),
    loadSheet(SHEETS.photos)
  ]).then(([boatRows, equipmentRows, photoRows]) => {
    catalog = buildCatalog(boatRows, equipmentRows, photoRows);
    itemById = new Map(catalog.items.map(item => [item.id, item]));
    selected = new Set([...selected].filter(id => itemById.has(id)));
    saveSelection();
    loading.hidden = true;
    render();
  }).catch(error => {
    console.error(error);
    loading.innerHTML = "<strong>The catalog could not be loaded.</strong><br>The Google Sheet must remain shared for anyone with the link to view, comment, or edit.";
  });
})();
