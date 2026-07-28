(() => {
  "use strict";

  const categories = [
  {
    "id": "boats",
    "name": "Boats",
    "order": 10
  },
  {
    "id": "main-motors",
    "name": "Main Motors",
    "order": 20
  },
  {
    "id": "kickers",
    "name": "Kicker Motors",
    "order": 30
  },
  {
    "id": "bow-trolling-motors",
    "name": "Bow Trolling Motors",
    "order": 40
  },
  {
    "id": "downriggers",
    "name": "Downriggers",
    "order": 50
  },
  {
    "id": "electronics",
    "name": "Electronics & Navigation",
    "order": 60
  },
  {
    "id": "canvas",
    "name": "Bimini, Canvas & Covers",
    "order": 70
  },
  {
    "id": "electrical",
    "name": "Electrical Systems",
    "order": 80
  }
];
  const boats = Array.isArray(window.BOATBUILDER_BOATS) ? window.BOATBUILDER_BOATS : [];
  const equipment = Array.isArray(window.BOATBUILDER_EQUIPMENT) ? window.BOATBUILDER_EQUIPMENT : [];
  const items = [...boats, ...equipment];

  window.BOATBUILDER_DATA = {
    schemaVersion: 3,
    source: "BoatBuilder canonical app data",
    counts: {
      items: items.length,
      boats: boats.length,
      equipment: equipment.length
    },
    categories,
    items
  };
})();
