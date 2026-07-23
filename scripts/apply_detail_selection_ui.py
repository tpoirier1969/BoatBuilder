#!/usr/bin/env python3
from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    result, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return result


# index.html
path = Path("index.html")
text = path.read_text(encoding="utf-8")
old = '''    <div class="header-row">
      <button id="back-button" class="icon-button" type="button" aria-label="Go back" hidden>‹</button>
      <div class="header-home-actions">
        <button id="home-button" class="brand-button" type="button" aria-label="Go to BoatBuilder home">
          <span class="brand-mark" aria-hidden="true">⌂</span>
          <span><strong>Home</strong></span>
        </button>
        <button id="clear-estimate-button" class="estimate-button clear-estimate-button" type="button" aria-label="Clear estimate" disabled>Clear</button>
      </div>
      <button id="estimate-button" class="estimate-button header-estimate-button" type="button" aria-label="Open estimate">
        <span class="estimate-button-label">Estimate <span id="estimate-count" class="count-badge">0</span></span>
        <span id="estimate-range" class="estimate-range">$0</span>
      </button>
    </div>'''
new = '''    <div class="header-row">
      <div class="header-left-actions">
        <button id="back-button" class="icon-button" type="button" aria-label="Go back" hidden>‹</button>
        <button id="home-button" class="brand-button" type="button" aria-label="Go to BoatBuilder home">
          <span class="brand-mark" aria-hidden="true">⌂</span>
          <span><strong>Home</strong></span>
        </button>
      </div>
      <button id="estimate-button" class="estimate-button header-estimate-button" type="button" aria-label="Open estimate">
        <span class="estimate-button-label">Estimate <span id="estimate-count" class="count-badge">0</span></span>
        <span id="estimate-range" class="estimate-range">$0</span>
      </button>
      <button id="clear-estimate-button" class="estimate-button clear-estimate-button" type="button" aria-label="Clear estimate" disabled>Clear estimate</button>
    </div>'''
text = replace_once(text, old, new, "header markup")
text = text.replace('styles.css?v=8', 'styles.css?v=9')
text = text.replace('app.js?v=9', 'app.js?v=10')
path.write_text(text, encoding="utf-8")


# styles.css
path = Path("styles.css")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '  grid-template-columns: auto minmax(0, 1fr) auto;',
    '  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);',
    "header grid"
)
text = regex_once(
    text,
    r'#back-button \{ grid-column: 1; \}\n\n\.header-home-actions \{.*?\n\}',
    '''.header-left-actions {
  grid-column: 1;
  display: flex;
  align-items: center;
  justify-self: start;
  min-width: 0;
  gap: .15rem;
}''',
    "left header actions"
)
text = regex_once(
    text,
    r'\.clear-estimate-button \{.*?\n\}\n\n\.header-estimate-button \{.*?\n\}',
    '''.clear-estimate-button {
  grid-column: 3;
  justify-self: end;
  min-height: 2.45rem;
  max-width: 6.25rem;
  padding: .35rem .5rem;
  font-size: .76rem;
  line-height: 1.05;
  white-space: nowrap;
}

.header-estimate-button {
  grid-column: 2;
  justify-self: center;
  display: grid;
  justify-items: center;
  width: auto;
  min-width: 6.8rem;
  max-width: 8.5rem;
  gap: .12rem;
  padding: .35rem .5rem;
  line-height: 1.05;
}''',
    "header button placement"
)
text = replace_once(
    text,
    '  grid-template-columns: auto minmax(0, 1fr) auto;',
    '  grid-template-columns: minmax(0, 1fr) auto;',
    "item card columns"
)
text = regex_once(
    text,
    r'\n\.item-card\.selected \{.*?\n\}\n\n\.select-control \{.*?\n\}\n\n\.select-control input \{.*?\n\}',
    '',
    "remove list selection styles"
)
text = replace_once(
    text,
    '''.detail-select input {
  width: 1.55rem;
  height: 1.55rem;
  accent-color: var(--selected-line);
}
''',
    '''.detail-select input {
  width: 1.55rem;
  height: 1.55rem;
  accent-color: var(--selected-line);
}

.detail-select input:disabled {
  cursor: not-allowed;
}

.selection-requirement {
  margin: -.45rem 0 1rem;
  color: var(--danger);
  font-size: .82rem;
  font-weight: 700;
  line-height: 1.35;
}
''',
    "selection requirement styles"
)
text = replace_once(
    text,
    '''  .clear-estimate-button {
    padding: .3rem .4rem;
    font-size: .72rem;
  }

  .header-estimate-button {
    min-width: 6.1rem;
    padding-right: .4rem;
    padding-left: .4rem;
  }''',
    '''  .header-left-actions { gap: 0; }

  .clear-estimate-button {
    max-width: 5.15rem;
    padding: .3rem .35rem;
    font-size: .66rem;
    white-space: normal;
  }

  .header-estimate-button {
    min-width: 5.8rem;
    max-width: 6.6rem;
    padding-right: .35rem;
    padding-left: .35rem;
  }''',
    "small header layout"
)
path.write_text(text, encoding="utf-8")


# app.js
path = Path("app.js")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'const options = [`<option value=""${era ? "" : " selected"}>All listed eras · ${escapeHtml(formatPricing(broad))}</option>`];',
    'const options = [`<option value=""${era ? "" : " selected"}>Choose age / era · broad range ${escapeHtml(formatPricing(broad))}</option>`];',
    "era placeholder"
)
old = '''  function setConfig(id, patch) {
    const next = normalizedConfig({ ...workingConfig(id), ...patch });
    pendingConfig.set(id, next);
    if (selections.has(id)) selections.set(id, next);
    saveSelections();
  }'''
new = '''  function missingConfiguration(item, rawConfig = {}) {
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
  }'''
text = replace_once(text, old, new, "configuration gating")
text = regex_once(
    text,
    r'  function itemCard\(item\) \{.*?\n  \}\n\n  function bindItemCards\(\) \{.*?\n  \}',
    '''  function itemCard(item) {
    const config = workingConfig(item.id);
    const pricing = pricingFor(item, config);
    const selectedText = selections.has(item.id) ? " · In estimate" : "";
    const subtitle = `${item.subtitle || item.badge || ""}${selectedText}`;

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
  }''',
    "list cards"
)
old = '''    const config = workingConfig(item.id);
    const pricing = pricingFor(item, config);
    const image = item.image?.url ? `<div class="detail-image-wrap">'''
new = '''    const config = workingConfig(item.id);
    const pricing = pricingFor(item, config);
    const isSelected = selections.has(item.id);
    const canAdd = configurationComplete(item, config);
    const requirementText = configurationRequirementText(item, config);
    const disableAdd = !isSelected && !canAdd;
    const image = item.image?.url ? `<div class="detail-image-wrap">'''
text = replace_once(text, old, new, "detail configuration state")
old = '''      <div class="detail-select">
        <label><input id="detail-select" type="checkbox" ${selections.has(item.id) ? "checked" : ""}> Add to estimate</label>
        <strong>${escapeHtml(formatPricing(pricing))}</strong>
      </div>
      <div class="price-panel">'''
new = '''      <div class="detail-select">
        <label><input id="detail-select" type="checkbox" ${isSelected ? "checked" : ""} ${disableAdd ? "disabled" : ""}> Add to estimate</label>
        <strong>${escapeHtml(formatPricing(pricing))}</strong>
      </div>
      ${requirementText && !isSelected ? `<p class="selection-requirement">${escapeHtml(requirementText)}</p>` : ""}
      <div class="price-panel">'''
text = replace_once(text, old, new, "detail checkbox")
old = '''    document.querySelector("#detail-select").addEventListener("change", event => {
      toggleItem(item.id, event.currentTarget.checked, config);
      renderDetail(route);
    });'''
new = '''    document.querySelector("#detail-select").addEventListener("change", event => {
      if (event.currentTarget.checked && !configurationComplete(item, config)) {
        event.currentTarget.checked = false;
        return;
      }
      toggleItem(item.id, event.currentTarget.checked, config);
      renderDetail(route);
    });'''
text = replace_once(text, old, new, "detail change guard")
text = replace_once(
    text,
    '        <section class="empty-state"><h2>No items selected</h2><p>Choose a category and check the items you want in the package.</p></section>`;',
    '        <section class="empty-state"><h2>No items selected</h2><p>Open an item, choose its required options, and add it from the detail screen.</p></section>`;',
    "empty estimate help"
)
path.write_text(text, encoding="utf-8")


# ProjectRules.md
path = Path("ProjectRules.md")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    '''Every selectable catalog item must have a clear checkbox or equivalent selection control. Selecting an item adds it to the current estimate. Deselecting it removes it.''',
    '''Model and component lists are navigation-only and must not contain add-to-estimate checkboxes. The Add to estimate checkbox appears on the detail screen only. When an item has configurable options, all required options must be selected before the checkbox is enabled. Removing or clearing a required option from an already selected item removes it from the estimate rather than preserving a broad or ambiguous value.''',
    "project selection rule"
)
text = replace_once(
    text,
    '- Selection controls work from model lists and detail views.',
    '- Model lists contain no selection checkbox; detail-screen selection works only after required options are complete.',
    "project QA selection rule"
)
path.write_text(text, encoding="utf-8")


# tests/qa.mjs
path = Path("tests/qa.mjs")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'assert.match(appSource, /data-config-trailer/, "Trailer control is missing");',
    '''assert.match(appSource, /data-config-trailer/, "Trailer control is missing");
assert.match(appSource, /function configurationComplete\(/, "Required-option selection gate is missing");
assert.match(appSource, /function configurationRequirementText\(/, "Required-option guidance is missing");
assert.doesNotMatch(appSource, /data-select=/, "Model-list estimate checkbox returned");
assert.match(appSource, /id="detail-select"[\\s\\S]*?disabled/, "Detail selection is not disabled while required options are missing");''',
    "QA selection assertions"
)
text = replace_once(
    text,
    'assert.match(htmlSource, /id="clear-estimate-button"/, "Header Clear button is missing");',
    '''assert.match(htmlSource, /id="clear-estimate-button"/, "Header Clear button is missing");
assert.match(htmlSource, /id="clear-estimate-button"[\\s\\S]*?>Clear estimate<\\/button>/, "Header Clear estimate label is incomplete");''',
    "QA clear label"
)
text = replace_once(
    text,
    'assert.match(cssSource, /\\.header-estimate-button\\s*\\{[\\s\\S]*?grid-column:\\s*3;/, "Estimate button is not fixed to header column 3");',
    '''assert.match(cssSource, /\\.header-estimate-button\\s*\\{[\\s\\S]*?grid-column:\\s*2;/, "Estimate button is not centered in header column 2");
assert.match(cssSource, /\\.clear-estimate-button\\s*\\{[\\s\\S]*?grid-column:\\s*3;/, "Clear estimate is not placed on the right");''',
    "QA header placement"
)
path.write_text(text, encoding="utf-8")

print("Applied detail-only selection and centered estimate header update.")
