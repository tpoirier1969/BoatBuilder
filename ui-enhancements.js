(() => {
  "use strict";

  const YEAR_KEY = "boatbuilder.modelYearFilter.v1";
  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const clean = value => String(value ?? "").trim();

  function generationChoices(item) {
    if (!item || item.categoryId !== "boats" || !Array.isArray(item.designGenerations)) return [];
    const out = [];
    for (const generation of item.designGenerations) {
      const eras = Array.isArray(generation.eras) ? generation.eras : [];
      if (eras.length) {
        for (const era of eras) {
          const eraLabel = clean(era.label);
          const genLabel = clean(generation.label);
          out.push({
            generation,
            era,
            label: genLabel.toLowerCase().includes(eraLabel.toLowerCase()) ? genLabel : `${eraLabel} · ${genLabel}`
          });
        }
      } else {
        out.push({ generation, era: null, label: generation.label || `${generation.startYear}–${generation.endYear}` });
      }
    }
    return out;
  }

  function detailItem(body) {
    const catalog = window.BOATBUILDER_DATA;
    if (!catalog || !Array.isArray(catalog.items)) return null;
    const title = body.querySelector("h1")?.textContent?.trim();
    if (!title) return null;
    return catalog.items.find(entry => entry.categoryId === "boats" && entry.displayName === title) || null;
  }

  function injectSingleYearHull() {
    const catalog = window.BOATBUILDER_DATA;
    if (!catalog || !Array.isArray(catalog.items)) return;

    for (const body of document.querySelectorAll(".detail-card .detail-body")) {
      if (body.querySelector("[data-choice], [data-single-year-hull]")) continue;
      const item = detailItem(body);
      if (!item) continue;
      const choices = generationChoices(item);
      if (choices.length !== 1) continue;

      const label = document.createElement("label");
      label.className = "config-field single-year-hull";
      label.dataset.singleYearHull = "true";
      label.innerHTML = `<span>Year / hull</span><select disabled aria-label="Year / hull"><option selected>${esc(choices[0].label)}</option></select><small>Only one documented hull option is currently recorded.</small>`;
      body.querySelector("h1")?.insertAdjacentElement("afterend", label);
    }
  }

  function selectedGeneration(body, item) {
    const choices = generationChoices(item);
    if (!choices.length) return null;
    const select = body.querySelector("select[data-choice]");
    if (!select) return choices.length === 1 ? choices[0].generation : null;
    if (!select.value) return null;
    const generationId = decodeURIComponent(String(select.value).split("~")[0] || "");
    return item.designGenerations.find(generation => generation.id === generationId) || null;
  }

  function sourceInfo(url) {
    try {
      const parsed = new URL(url, location.href);
      if (!/^https?:$/.test(parsed.protocol)) return null;
      return { url: parsed.href, label: parsed.hostname.replace(/^www\./, "") };
    } catch {
      return null;
    }
  }

  function evidenceSources(item, generation) {
    const candidates = generation
      ? [generation.sourceUrl, ...(generation.evidenceUrls || []), item.sourceUrl]
      : [item.sourceUrl];
    const seen = new Set();
    const sources = [];
    for (const candidate of candidates) {
      const info = sourceInfo(candidate);
      if (!info || seen.has(info.url)) continue;
      seen.add(info.url);
      sources.push(info);
    }
    return sources;
  }

  function statusLabel(status) {
    const value = clean(status);
    if (!value) return "Evidence status not labeled";
    return value.replaceAll("-", " ").replace(/\b\w/g, char => char.toUpperCase());
  }

  function injectEvidence() {
    for (const body of document.querySelectorAll(".detail-card .detail-body")) {
      if (body.querySelector("[data-evidence-note]")) continue;
      const item = detailItem(body);
      if (!item) continue;
      const generation = selectedGeneration(body, item);
      const sources = evidenceSources(item, generation);
      const note = document.createElement("aside");
      note.className = "manufacturer-note evidence-note";
      note.dataset.evidenceNote = "true";

      if (!generation && generationChoices(item).length > 1) {
        note.innerHTML = `<strong>Evidence</strong><p>Choose a year / hull above to see the sources tied to that generation.${sources.length ? ` General model source: ${sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`).join(", ")}.` : ""}</p>`;
      } else {
        const status = statusLabel(generation?.status);
        const links = sources.length
          ? sources.map((source, index) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}${sources.filter(s => s.label === source.label).length > 1 ? ` ${index + 1}` : ""}</a>`).join(" · ")
          : "No external source link is stored for this generation.";
        note.innerHTML = `<strong>Evidence</strong><p>${esc(status)}</p><p>${links}</p>`;
      }

      const existingPanel = body.querySelector(".manufacturer-note:not(.evidence-note)");
      if (existingPanel) existingPanel.insertAdjacentElement("afterend", note);
      else body.querySelector("h1")?.insertAdjacentElement("afterend", note);
    }
  }

  function boatBrowseView() {
    const parts = location.hash.replace(/^#/, "").split("/").map(part => decodeURIComponent(part));
    if (parts[0] === "category" && parts[1] === "boats") return "makers";
    if (parts[0] === "manufacturer" && parts[1] === "boats") return "models";
    return null;
  }

  function storedYear() {
    try {
      const value = Number(sessionStorage.getItem(YEAR_KEY));
      return Number.isInteger(value) && value >= 1900 && value <= 2100 ? value : null;
    } catch {
      return null;
    }
  }

  function saveYear(year) {
    try {
      if (Number.isInteger(year)) sessionStorage.setItem(YEAR_KEY, String(year));
      else sessionStorage.removeItem(YEAR_KEY);
    } catch {}
  }

  function modelHasYear(item, year) {
    if (!year || !item || item.categoryId !== "boats") return true;
    return (item.designGenerations || []).some(generation =>
      Number.isInteger(generation.startYear) && Number.isInteger(generation.endYear) &&
      year >= generation.startYear && year <= generation.endYear
    );
  }

  function documentedYears() {
    const catalog = window.BOATBUILDER_DATA;
    const years = new Set();
    for (const item of catalog?.items || []) {
      if (item.categoryId !== "boats") continue;
      for (const generation of item.designGenerations || []) {
        if (!Number.isInteger(generation.startYear) || !Number.isInteger(generation.endYear)) continue;
        for (let year = generation.startYear; year <= generation.endYear && year <= 2100; year += 1) years.add(year);
      }
    }
    return [...years].sort((a, b) => b - a);
  }

  function applyYearFilter(root, view, year) {
    const catalog = window.BOATBUILDER_DATA;
    const boats = (catalog?.items || []).filter(item => item.categoryId === "boats");
    let matches = 0;

    if (view === "makers") {
      for (const button of root.querySelectorAll("button[data-m]")) {
        const manufacturer = button.dataset.m;
        const makerBoats = boats.filter(item => item.manufacturer === manufacturer);
        const matched = year ? makerBoats.filter(item => modelHasYear(item, year)) : makerBoats;
        button.hidden = Boolean(year) && matched.length === 0;
        if (!button.hidden) matches += matched.length;
        const small = button.querySelector("small");
        if (small) {
          if (!small.dataset.baseText) small.dataset.baseText = small.textContent || "";
          small.textContent = year ? `${matched.length} documented model${matched.length === 1 ? "" : "s"} in ${year}` : small.dataset.baseText;
        }
      }
    }

    if (view === "models") {
      for (const card of root.querySelectorAll(".item-card")) {
        const id = card.querySelector("[data-i]")?.dataset.i;
        const item = boats.find(entry => entry.id === id);
        const visible = !year || modelHasYear(item, year);
        card.hidden = !visible;
        if (visible) matches += 1;
      }
    }

    let status = root.querySelector("[data-year-filter-status]");
    if (!status) {
      status = document.createElement("p");
      status.className = "data-note";
      status.dataset.yearFilterStatus = "true";
      root.querySelector("[data-year-filter]")?.insertAdjacentElement("afterend", status);
    }
    if (status) status.textContent = year ? `${matches} documented ${view === "makers" ? "boat records across visible manufacturers" : `model${matches === 1 ? "" : "s"}`} for ${year}.` : "Showing all documented model years.";
  }

  function injectYearFilter() {
    const view = boatBrowseView();
    const root = document.querySelector("#app");
    if (!view || !root || root.querySelector("[data-year-filter]")) return;
    if (view === "makers" && !root.querySelector("button[data-m]")) return;
    if (view === "models" && !root.querySelector(".item-card [data-i]")) return;

    const years = documentedYears();
    if (!years.length) return;
    const current = storedYear();
    const filter = document.createElement("label");
    filter.className = "config-field year-discovery-filter";
    filter.dataset.yearFilter = "true";
    filter.innerHTML = `<span>Filter by model year</span><select aria-label="Filter boats by documented model year"><option value="">All documented years</option>${years.map(year => `<option value="${year}"${year === current ? " selected" : ""}>${year}</option>`).join("")}</select><small>Uses documented hull-generation years, not text in the model name.</small>`;

    const list = root.querySelector(".card-list");
    if (!list) return;
    list.insertAdjacentElement("beforebegin", filter);
    applyYearFilter(root, view, current);

    filter.querySelector("select").onchange = event => {
      const year = Number(event.target.value);
      const selected = Number.isInteger(year) && year > 0 ? year : null;
      saveYear(selected);
      applyYearFilter(root, view, selected);
    };
  }

  function enhance() {
    injectSingleYearHull();
    injectEvidence();
    injectYearFilter();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("DOMContentLoaded", enhance, { once: true });
  addEventListener("hashchange", () => queueMicrotask(enhance));
  enhance();

  window.BOATBUILDER_UI_ENHANCEMENTS = {
    generationChoices,
    injectSingleYearHull,
    selectedGeneration,
    evidenceSources,
    injectEvidence,
    boatBrowseView,
    modelHasYear,
    documentedYears,
    applyYearFilter,
    injectYearFilter
  };
})();
