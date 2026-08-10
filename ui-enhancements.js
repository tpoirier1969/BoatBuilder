(() => {
  "use strict";

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

  function enhance() {
    injectSingleYearHull();
    injectEvidence();
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("DOMContentLoaded", enhance, { once: true });
  enhance();

  window.BOATBUILDER_UI_ENHANCEMENTS = {
    generationChoices,
    injectSingleYearHull,
    selectedGeneration,
    evidenceSources,
    injectEvidence
  };
})();
