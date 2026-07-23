(() => {
  "use strict";

  const STORAGE_KEY = "boatbuilder.currentEstimate.v1";
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
    if (parts[0] === "item" && parts[1]) return { view: "detail", itemId: parts[1] };
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
      <p class="data-note">This app is category-first. It does not use a marketplace-style search screen.</p>`;

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
        const card = app.querySelector(`[data-item-card="${CSS.escape(id)}"]`);
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

  fetch("data/catalog.json", { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      return response.json();
    })
    .then(data => {
      catalog = data;
      itemById = new Map(catalog.items.map(item => [item.id, item]));
      selected = new Set([...selected].filter(id => itemById.has(id)));
      saveSelection();
      loading.hidden = true;
      render();
    })
    .catch(error => {
      console.error(error);
      loading.textContent = "The catalog could not be loaded. Open this app through a web server or GitHub Pages rather than directly from the file system.";
    });
})();
