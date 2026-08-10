(() => {
  "use strict";

  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function generationChoices(item) {
    if (!item || item.categoryId !== "boats" || !Array.isArray(item.designGenerations)) return [];
    const out = [];
    for (const generation of item.designGenerations) {
      const eras = Array.isArray(generation.eras) ? generation.eras : [];
      if (eras.length) {
        for (const era of eras) {
          const eraLabel = String(era.label || "").trim();
          const genLabel = String(generation.label || "").trim();
          out.push({
            label: genLabel.toLowerCase().includes(eraLabel.toLowerCase()) ? genLabel : `${eraLabel} · ${genLabel}`
          });
        }
      } else {
        out.push({ label: generation.label || `${generation.startYear}–${generation.endYear}` });
      }
    }
    return out;
  }

  function injectSingleYearHull() {
    const catalog = window.BOATBUILDER_DATA;
    if (!catalog || !Array.isArray(catalog.items)) return;

    for (const body of document.querySelectorAll(".detail-card .detail-body")) {
      if (body.querySelector("[data-choice], [data-single-year-hull]")) continue;
      const title = body.querySelector("h1")?.textContent?.trim();
      if (!title) continue;
      const item = catalog.items.find(entry => entry.categoryId === "boats" && entry.displayName === title);
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

  const observer = new MutationObserver(injectSingleYearHull);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("DOMContentLoaded", injectSingleYearHull, { once: true });
  injectSingleYearHull();

  window.BOATBUILDER_UI_ENHANCEMENTS = { generationChoices, injectSingleYearHull };
})();
