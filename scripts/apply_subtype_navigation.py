#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one exact match, found {count}")
    return text.replace(old, new, 1)


def replace_regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one regex match, found {count}")
    return updated


# ---------------------------------------------------------------------------
# Catalog builder: add durable subtype metadata to electronics and electrical.
# ---------------------------------------------------------------------------
builder_path = Path("scripts/build_catalog.py")
builder = builder_path.read_text(encoding="utf-8")

if "def equipment_subtype(" not in builder:
    marker = "\n\n\ndef clean(value: Any) -> str:\n"
    subtype_code = '''\n\nEQUIPMENT_SUBTYPES = {\n    "electronics": {\n        "sonar": ("Fish Finders & Sonar", 10),\n        "combo": ("Fish Finder / Chartplotter Combos", 20),\n        "mfd": ("Chartplotters & Multifunction Displays", 30),\n        "vhf": ("VHF Marine Radios", 40),\n    },\n    "electrical": {\n        "batteries": ("Batteries & Banks", 10),\n        "charging": ("Chargers & Charge Management", 20),\n        "protection": ("Circuit Protection & Distribution", 30),\n        "switching": ("Switching & Isolation", 40),\n        "monitoring": ("Monitoring", 50),\n        "wiring": ("Wiring & Installation", 60),\n    },\n}\n\n\ndef equipment_subtype(row: dict[str, Any], category_id: str) -> dict[str, Any] | None:\n    name = " ".join(\n        clean(row.get(field))\n        for field in ("Display Name", "Manufacturer / System", "Model / Component")\n    ).lower()\n    role = clean(row.get("Specs / Role")).lower()\n\n    subtype_id: str | None = None\n\n    if category_id == "electronics":\n        if "vhf" in name or "vhf" in role or "marine radio" in name:\n            subtype_id = "vhf"\n        elif any(token in name for token in ("apex", "solix", "xplore", "hds live", "hds pro", "axiom /", "axiom+")) \\\n                or "premium multifunction" in role or role.startswith("multifunction chartplotter"):\n            subtype_id = "mfd"\n        elif "no gps" in role or "no internal chartplotter" in role or "gps waypoint plotting" in role:\n            subtype_id = "sonar"\n        elif "chartplotter" in role or "gps plotter" in role or "fish finder / gps" in role or "fishfinder / gps" in role:\n            subtype_id = "combo"\n        else:\n            subtype_id = "sonar"\n\n    elif category_id == "electrical":\n        if name.startswith("battery bank") or name.startswith("battery chemistry"):\n            subtype_id = "batteries"\n        elif any(token in name for token in ("smartshunt", "battery monitor", "monitoring")):\n            subtype_id = "monitoring"\n        elif any(token in name for token in ("add-a-battery", "battery switch", "low-voltage disconnect", "m-lvd")):\n            subtype_id = "switching"\n        elif any(token in name for token in ("circuit breaker", "breaker", "fuse block")):\n            subtype_id = "protection"\n        elif any(token in name for token in ("charger", "charging relay", "si-acr", "dc-dc", "charger inlet")):\n            subtype_id = "charging"\n        else:\n            subtype_id = "wiring"\n\n    if subtype_id is None:\n        return None\n\n    label, order = EQUIPMENT_SUBTYPES[category_id][subtype_id]\n    return {"id": subtype_id, "name": label, "order": order}\n'''
    builder = replace_once(builder, marker, subtype_code + marker, "insert equipment subtype classifier")

builder = replace_once(
    builder,
    '''        if not item_id or not category_id:\n            continue\n        broad_low, broad_high = broad_range(row)\n''',
    '''        if not item_id or not category_id:\n            continue\n        subtype = equipment_subtype(row, category_id)\n        broad_low, broad_high = broad_range(row)\n''',
    "compute equipment subtype",
)

builder = replace_once(
    builder,
    '''            "categoryId": category_id,\n            "categoryName": category_name[category_id],\n            "manufacturer": clean(row.get("Manufacturer / System")) or "Unknown",\n''',
    '''            "categoryId": category_id,\n            "categoryName": category_name[category_id],\n            "subtypeId": subtype["id"] if subtype else None,\n            "subtypeName": subtype["name"] if subtype else None,\n            "subtypeOrder": subtype["order"] if subtype else None,\n            "manufacturer": clean(row.get("Manufacturer / System")) or "Unknown",\n''',
    "write equipment subtype metadata",
)

builder_path.write_text(builder, encoding="utf-8")


# ---------------------------------------------------------------------------
# App routing: category -> subtype -> manufacturer -> item for two categories.
# ---------------------------------------------------------------------------
app_path = Path("app.js")
app = app_path.read_text(encoding="utf-8")

if "const SUBTYPE_CATEGORIES" not in app:
    app = replace_once(
        app,
        '  const MOTOR_CATEGORIES = new Set(["main-motors", "kickers"]);\n',
        '  const MOTOR_CATEGORIES = new Set(["main-motors", "kickers"]);\n  const SUBTYPE_CATEGORIES = new Set(["electronics", "electrical"]);\n',
        "insert subtype category set",
    )

route_block = '''  function currentRoute() {\n    const parts = location.hash.replace(/^#/, "").split("/");\n    if (!parts[0]) return { view: "categories" };\n    if (parts[0] === "category" && parts[1]) {\n      const categoryId = decodeURIComponent(parts[1]);\n      return { view: SUBTYPE_CATEGORIES.has(categoryId) ? "subtypes" : "manufacturers", categoryId };\n    }\n    if (parts[0] === "subtype" && parts[1] && parts[2]) {\n      return {\n        view: "manufacturers",\n        categoryId: decodeURIComponent(parts[1]),\n        subtypeId: decodeURIComponent(parts[2])\n      };\n    }\n    if (parts[0] === "manufacturer" && parts[1] && parts[2]) {\n      const categoryId = decodeURIComponent(parts[1]);\n      if (SUBTYPE_CATEGORIES.has(categoryId) && parts[3]) {\n        return {\n          view: "items",\n          categoryId,\n          subtypeId: decodeURIComponent(parts[2]),\n          manufacturer: decodeURIComponent(parts.slice(3).join("/"))\n        };\n      }\n      return { view: "items", categoryId, manufacturer: decodeURIComponent(parts.slice(2).join("/")) };\n    }\n    if (parts[0] === "item" && parts[1]) return { view: "detail", itemId: decodeURIComponent(parts.slice(1).join("/")) };\n    if (parts[0] === "estimate") return { view: "estimate" };\n    return { view: "categories" };\n  }\n\n  function routeHash(route) {\n    if (route.view === "subtypes") return `category/${encodeURIComponent(route.categoryId)}`;\n    if (route.view === "manufacturers" && route.subtypeId) return `subtype/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.subtypeId)}`;\n    if (route.view === "manufacturers") return `category/${encodeURIComponent(route.categoryId)}`;\n    if (route.view === "items" && route.subtypeId) return `manufacturer/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.subtypeId)}/${encodeURIComponent(route.manufacturer)}`;\n    if (route.view === "items") return `manufacturer/${encodeURIComponent(route.categoryId)}/${encodeURIComponent(route.manufacturer)}`;\n    if (route.view === "detail") return `item/${encodeURIComponent(route.itemId)}`;\n    if (route.view === "estimate") return "estimate";\n    return "";\n  }\n\n  function navigate(route, remember = true) {'''

app = replace_regex_once(
    app,
    r'  function currentRoute\(\) \{.*?  function navigate\(route, remember = true\) \{',
    route_block,
    "replace routing block",
)

category_helpers = '''  function itemsInCategory(categoryId, subtypeId = null) {\n    return catalog.items.filter(item =>\n      item.categoryId === categoryId\n      && (!subtypeId || item.subtypeId === subtypeId)\n    );\n  }\n\n  function subtypesInCategory(categoryId) {\n    const groups = new Map();\n    for (const item of itemsInCategory(categoryId)) {\n      const id = clean(item.subtypeId) || "other";\n      if (!groups.has(id)) {\n        groups.set(id, {\n          id,\n          name: clean(item.subtypeName) || "Other",\n          order: Number.isFinite(item.subtypeOrder) ? item.subtypeOrder : 999,\n          count: 0\n        });\n      }\n      groups.get(id).count += 1;\n    }\n    return [...groups.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));\n  }\n\n  function subtypeInCategory(categoryId, subtypeId) {\n    return subtypesInCategory(categoryId).find(entry => entry.id === subtypeId) || null;\n  }\n\n  function renderSubtypes(route) {\n    const category = catalog.categories.find(entry => entry.id === route.categoryId);\n    if (!category) return renderCategories();\n    const groups = subtypesInCategory(route.categoryId);\n    const cards = groups.map(group => `<button class="nav-card" type="button" data-subtype="${escapeHtml(group.id)}">\n      <span><strong>${escapeHtml(group.name)}</strong><small>${group.count} catalog ${group.count === 1 ? "item" : "items"}</small></span>\n      <span class="chevron" aria-hidden="true">›</span>\n    </button>`).join("");\n\n    els.app.innerHTML = `${heading(category.name, "Choose the type of equipment.")}\n      <section class="card-list" aria-label="Equipment types">${cards}</section>`;\n\n    els.app.querySelectorAll("[data-subtype]").forEach(button => {\n      button.addEventListener("click", () => navigate({\n        view: "manufacturers",\n        categoryId: route.categoryId,\n        subtypeId: button.dataset.subtype\n      }));\n    });\n  }\n\n  function renderCategories() {'''

app = replace_regex_once(
    app,
    r'  function itemsInCategory\(categoryId\) \{.*?  function renderCategories\(\) \{',
    category_helpers,
    "replace category helpers and add subtype screen",
)

app = replace_once(
    app,
    '      button.addEventListener("click", () => navigate({ view: "manufacturers", categoryId: button.dataset.category }));\n',
    '      button.addEventListener("click", () => navigate({ view: SUBTYPE_CATEGORIES.has(button.dataset.category) ? "subtypes" : "manufacturers", categoryId: button.dataset.category }));\n',
    "route category cards through subtype layer",
)

manufacturers_block = '''  function renderManufacturers(route) {\n    const category = catalog.categories.find(entry => entry.id === route.categoryId);\n    if (!category) return renderCategories();\n    const subtype = route.subtypeId ? subtypeInCategory(route.categoryId, route.subtypeId) : null;\n    const counts = new Map();\n    for (const item of itemsInCategory(route.categoryId, route.subtypeId)) {\n      counts.set(item.manufacturer, (counts.get(item.manufacturer) || 0) + 1);\n    }\n\n    const cards = [...counts.entries()]\n      .sort(([a], [b]) => a.localeCompare(b))\n      .map(([manufacturer, count]) => `<button class="nav-card" type="button" data-manufacturer="${escapeHtml(manufacturer)}">\n        <span><strong>${escapeHtml(manufacturer)}</strong><small>${count} ${count === 1 ? "model or variation" : "models and variations"}</small></span>\n        <span class="chevron" aria-hidden="true">›</span>\n      </button>`).join("");\n\n    els.app.innerHTML = `${heading(subtype?.name || category.name, subtype ? `${category.name} · Choose a manufacturer.` : "Choose a manufacturer.")}\n      <section class="card-list" aria-label="Manufacturers">${cards}</section>`;\n\n    els.app.querySelectorAll("[data-manufacturer]").forEach(button => {\n      button.addEventListener("click", () => navigate({\n        view: "items",\n        categoryId: route.categoryId,\n        subtypeId: route.subtypeId || null,\n        manufacturer: button.dataset.manufacturer\n      }));\n    });\n  }\n\n  function itemCard(item) {'''

app = replace_regex_once(
    app,
    r'  function renderManufacturers\(route\) \{.*?  function itemCard\(item\) \{',
    manufacturers_block,
    "replace manufacturer screen",
)

items_block = '''  function renderItems(route) {\n    const category = catalog.categories.find(entry => entry.id === route.categoryId);\n    const subtype = route.subtypeId ? subtypeInCategory(route.categoryId, route.subtypeId) : null;\n    const items = itemsInCategory(route.categoryId, route.subtypeId)\n      .filter(item => item.manufacturer === route.manufacturer)\n      .sort((a, b) => (a.model || a.displayName).localeCompare(b.model || b.displayName));\n\n    const specific = MANUFACTURER_NOTES[route.manufacturer];\n    const namingNote = route.categoryId === "boats"\n      ? `<aside class="data-note" style="margin:0 0 1rem;padding:.85rem;background:#fff;border:1px solid #cbd7dd;border-radius:.8rem"><strong>Listing-name note:</strong> Sellers often abbreviate, omit, or misstate model names. BoatBuilder uses the official family, size, and layout name when it can be verified. Brand suffixes are not universal.${specific ? ` ${escapeHtml(specific)}` : ""}</aside>`\n      : "";\n    const context = [category?.name, subtype?.name].filter(Boolean).join(" · ");\n\n    els.app.innerHTML = `${heading(route.manufacturer, context)}${namingNote}\n      <section class="card-list" aria-label="Models and variations">${items.map(itemCard).join("")}</section>`;\n    bindItemCards();\n  }\n\n  function bindConfigurationControls(item, rerender) {'''

app = replace_regex_once(
    app,
    r'  function renderItems\(route\) \{.*?  function bindConfigurationControls\(item, rerender\) \{',
    items_block,
    "replace item listing screen",
)

app = replace_once(
    app,
    '''    if (route.view === "manufacturers") renderManufacturers(route);\n    else if (route.view === "items") renderItems(route);\n''',
    '''    if (route.view === "subtypes") renderSubtypes(route);\n    else if (route.view === "manufacturers") renderManufacturers(route);\n    else if (route.view === "items") renderItems(route);\n''',
    "render subtype route",
)

app_path.write_text(app, encoding="utf-8")


# ---------------------------------------------------------------------------
# QA: enforce subtype coverage and the combined Princecraft Sport record.
# ---------------------------------------------------------------------------
qa_path = Path("scripts/qa_app.mjs")
qa = qa_path.read_text(encoding="utf-8")

if "Princecraft Sport 167 / Sport 164 record is missing" not in qa:
    qa = replace_once(
        qa,
        '''assert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");\n''',
        '''assert.ok(ids.every(Boolean), "Catalog contains a blank stable ID");\n\nconst princecraftSport = catalog.items.find(item =>\n  item.categoryId === "boats"\n  && /Sport 167\\s*\\/\\s*Sport 164/i.test(item.displayName || item.model || "")\n);\nassert.ok(princecraftSport, "Princecraft Sport 167 / Sport 164 record is missing");\n\nconst electronics = catalog.items.filter(item => item.categoryId === "electronics");\nconst electrical = catalog.items.filter(item => item.categoryId === "electrical");\nassert.ok(electronics.length > 0 && electronics.every(item => item.subtypeId && item.subtypeName), "Electronics subtype metadata is incomplete");\nassert.ok(electrical.length > 0 && electrical.every(item => item.subtypeId && item.subtypeName), "Electrical subtype metadata is incomplete");\nassert.deepEqual(\n  [...new Set(electronics.map(item => item.subtypeId))].sort(),\n  ["combo", "mfd", "sonar", "vhf"],\n  "Electronics subtype set is wrong"\n);\nassert.deepEqual(\n  [...new Set(electrical.map(item => item.subtypeId))].sort(),\n  ["batteries", "charging", "monitoring", "protection", "switching", "wiring"],\n  "Electrical subtype set is wrong"\n);\n''',
        "add catalog subtype and Princecraft QA",
    )

    qa = replace_once(
        qa,
        '''assert.match(appSource, /data-config-trailer/, "Trailer control is missing");\n''',
        '''assert.match(appSource, /data-config-trailer/, "Trailer control is missing");\nassert.match(appSource, /function renderSubtypes\(/, "Subtype navigation screen is missing");\nassert.match(appSource, /subtype\//, "Subtype route is missing");\nassert.match(appSource, /SUBTYPE_CATEGORIES/, "Subtype category routing is missing");\n''',
        "add app subtype QA",
    )

qa_path.write_text(qa, encoding="utf-8")


# ---------------------------------------------------------------------------
# Project rules: catalog breadth and subtype navigation are durable rules.
# ---------------------------------------------------------------------------
rules_path = Path("ProjectRules.md")
rules = rules_path.read_text(encoding="utf-8")

if "Catalog breadth is broader than the current purchase search" not in rules:
    rules = replace_once(
        rules,
        '''The app should help evaluate realistic Lake Superior-capable fishing packages without making unsuitable boats or equipment look better than they are.\n''',
        '''The app should help evaluate realistic Lake Superior-capable fishing packages without making unsuitable boats or equipment look better than they are.\n\n### Catalog breadth\n\nCatalog breadth is broader than the current purchase search. Include relevant fishing, multispecies, fish-and-ski, side-console, tiller, windshield, and other materially distinct boat models even when they do not meet Tod and Donna's current preferred features. Recommendation, layout, and suitability fields explain fit; they are not inclusion gates. Do not omit a real model merely because it lacks a walk-through windshield, is too small, is too expensive, or is otherwise a poor current purchase candidate.\n''',
        "add catalog breadth rule",
    )

    rules = replace_once(
        rules,
        '''Within a category, show manufacturers. Within a manufacturer, show each relevant model and each materially different variation as its own list row.\n''',
        '''Most categories flow from category to manufacturer. Electronics & Navigation and Electrical Systems add one type layer before manufacturer:\n\n- Electronics & Navigation → equipment type → manufacturer → model\n- Electrical Systems → equipment type → manufacturer → component\n\nWithin a manufacturer, show each relevant model and each materially different variation as its own list row.\n''',
        "document subtype navigation",
    )

    rules = replace_once(
        rules,
        '''- Category → manufacturer → model → detail navigation works.\n''',
        '''- Standard categories follow category → manufacturer → model → detail navigation.\n- Electronics and Electrical follow category → type → manufacturer → model/component → detail navigation.\n- Princecraft Sport 167 / Sport 164 appears as one combined official-generation listing with both names visible.\n''',
        "add subtype and Princecraft QA rules",
    )

rules_path.write_text(rules, encoding="utf-8")


# Remove one-time scaffolding before the workflow commits the canonical changes.
for temporary in (
    Path("scripts/apply_subtype_navigation.py"),
    Path(".github/workflows/apply-subtype-navigation.yml"),
    Path("data/subtype-navigation-trigger.txt"),
):
    temporary.unlink(missing_ok=True)
