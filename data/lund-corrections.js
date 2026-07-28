(() => {
  "use strict";

  const data = window.BOATBUILDER_DATA;
  if (!data || !Array.isArray(data.items)) return;

  const replaceDetail = (item, label, value) => {
    const detail = (item.details || []).find(entry => entry.label === label);
    if (detail) detail.value = value;
    else (item.details ||= []).push({ label, value });
  };

  const removeDetails = (item, labels) => {
    const unwanted = new Set(labels);
    item.details = (item.details || []).filter(entry => !unwanted.has(entry.label));
  };

  const oldAlaskan = data.items.find(item => item.id === "boat:Lund | Alaskan 1800 Sport");
  if (oldAlaskan) {
    oldAlaskan.subtitle = "2003 factory hull specification basis";
    oldAlaskan.lowPrice = 4000;
    oldAlaskan.highPrice = 7000;
    oldAlaskan.priceBasis = "Used-market guidance for the documented 2003 1800 Alaskan Sport generation only. Do not apply this value or these specifications to the redesigned 2024-plus 1875 Alaskan.";
    replaceDetail(oldAlaskan, "Model Years / Era", "2003 factory hull specification basis; adjacent years still under brochure review");
    replaceDetail(oldAlaskan, "Notes", "This record now represents the documented 2003 1800 Alaskan Sport hull only: 18'9\", 83-inch beam, 1,030-pound dry hull and 90-hp maximum. Lund identified the Alaskan as redesigned for model year 2024; the 2024-plus 1875 is a separate record and must not inherit these specifications.");
    replaceDetail(oldAlaskan, "Research Status", "2003 specification set factory-documented. Exact beginning and ending years of this hull generation remain under catalog comparison.");
    replaceDetail(oldAlaskan, "2000s Value", "$4.0k–$7.0k");
    removeDetails(oldAlaskan, ["1990s Value", "2010s Value", "2020s Value"]);
  }

  const currentId = "boat:Lund | Alaskan 1875 Sport (2024 redesign)";
  if (!data.items.some(item => item.id === currentId)) {
    data.items.push({
      id: currentId,
      categoryId: "boats",
      categoryName: "Boats",
      manufacturer: "Lund",
      model: "Alaskan 1875 Sport (2024 redesign)",
      displayName: "Lund | Alaskan 1875 Sport (2024 redesign)",
      subtitle: "2024–present redesigned factory hull",
      badge: "Secondary",
      lowPrice: null,
      highPrice: null,
      priceBasis: "Used-market valuation research pending for the redesigned 2024-plus generation. Current factory package pricing is not used as a substitute for used value.",
      sourceUrl: "https://www.lundboats.com/content/dam/lund/technical/documents/23_ABG_LN_MY2024Catalog_v8b_digital3.pdf",
      image: null,
      details: [
        { label: "Model Years / Era", value: "2024–present; Lund's 2024 model-year page identifies a redesigned Alaskan" },
        { label: "Recommendation", value: "Secondary" },
        { label: "Big-Water Suitability", value: "Very good" },
        { label: "Layout", value: "Factory Sport dual-console full walk-through windshield" },
        { label: "Length", value: "18'10\"" },
        { label: "Beam", value: "90\"" },
        { label: "Chine / Bottom Width", value: "78.5\" current factory tiller basis; verify Sport capacity plate/configurator" },
        { label: "Dry Hull Weight", value: "Current factory configuration varies; 1,127 lb published for 1875 tiller" },
        { label: "Cockpit / Interior Depth", value: "21\" current factory tiller basis; verify Sport configuration" },
        { label: "Deadrise", value: "IPS deep-V; angle not published" },
        { label: "Transom Height", value: "20\" current factory tiller basis; verify Sport configuration" },
        { label: "Max HP", value: "115" },
        { label: "Practical Working HP", value: "75–115" },
        { label: "Persons", value: "7" },
        { label: "Fuel Capacity", value: "20 gal" },
        { label: "Bottom Thickness", value: "0.100\" current factory basis" },
        { label: "Side / Freeboard Thickness", value: "0.080\" current factory basis" },
        { label: "Construction", value: "Riveted IPS aluminum deep-V" },
        { label: "Availability Under $14k", value: "Not realistic for current-generation packages" },
        { label: "Placement Reason", value: "Separate generation record created because Lund identified the Alaskan as redesigned for 2024 and the new 1875 differs materially from the 2003 1800 in beam and horsepower rating." },
        { label: "Notes", value: "Do not match a 2003 1800 Alaskan Sport to this record. The redesigned 1875 is 18'10\", 90 inches wide and rated for 115 hp, versus the documented 2003 1800 at 18'9\", 83 inches and 90 hp." },
        { label: "Research Status", value: "2024 redesign boundary and principal dimensions factory-confirmed. Sport-specific weight, chine width, cockpit depth and transom details still require configuration-specific factory confirmation." },
        { label: "Interior Finish / Deck Material", value: "Current-generation package-dependent; verify the exact Sport configuration." },
        { label: "Interior Material Basis", value: "2024-plus factory family data." },
        { label: "Washdown / Carpet Fit", value: "Verify exact flooring package." }
      ]
    });
    if (data.counts) {
      data.counts.items = data.items.length;
      data.counts.boats = data.items.filter(item => item.categoryId === "boats").length;
    }
  }
})();
