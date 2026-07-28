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

  const clone = value => JSON.parse(JSON.stringify(value));

  const updateCounts = () => {
    if (!data.counts) return;
    data.counts.items = data.items.length;
    data.counts.boats = data.items.filter(item => item.categoryId === "boats").length;
  };

  const oldAlaskan = data.items.find(item => item.id === "boat:Lund | Alaskan 1800 Sport");
  if (oldAlaskan) {
    oldAlaskan.subtitle = "2003 factory hull specification basis";
    oldAlaskan.lowPrice = 4000;
    oldAlaskan.highPrice = 7000;
    oldAlaskan.priceBasis = "Used-market guidance for the documented 2003 1800 Alaskan Sport generation only. Do not apply this value or these specifications to the redesigned 2024-plus 1875 Alaskan.";
    replaceDetail(oldAlaskan, "Model Years / Era", "2003 factory hull specification basis; adjacent years still under brochure review");
    replaceDetail(oldAlaskan, "Notes", "This record represents the documented 2003 1800 Alaskan Sport hull only: 18'9\", 83-inch beam, 1,030-pound dry hull and 90-hp maximum. Lund identified the Alaskan as redesigned for model year 2024; the 2024-plus 1875 is a separate record and must not inherit these specifications.");
    replaceDetail(oldAlaskan, "Research Status", "2003 specification set factory-documented. Exact beginning and ending years of this hull generation remain under catalog comparison.");
    replaceDetail(oldAlaskan, "2000s Value", "$4.0k–$7.0k");
    removeDetails(oldAlaskan, ["1990s Value", "2010s Value", "2020s Value"]);
  }

  const currentAlaskanId = "boat:Lund | Alaskan 1875 Sport (2024 redesign)";
  if (!data.items.some(item => item.id === currentAlaskanId)) {
    data.items.push({
      id: currentAlaskanId,
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
  }

  const oldTyee = data.items.find(item => item.id === "boat:Lund | Tyee 1850 / older 18' Tyee");
  if (oldTyee) {
    const originalTyee = clone(oldTyee);

    oldTyee.id = "boat:Lund | Tyee 1850 outboard / older 18' Tyee outboard";
    oldTyee.model = "Tyee 1850 outboard / older 18' Tyee outboard";
    oldTyee.displayName = "Lund | Tyee 1850 outboard / older 18' Tyee outboard";
    oldTyee.subtitle = "Late 1980s–2000s outboard versions only; exact hull boundaries under catalog review";
    oldTyee.lowPrice = 2500;
    oldTyee.highPrice = 9000;
    oldTyee.priceBasis = "Used-market guidance applies only to older outboard-powered 18-foot Tyee packages. I/O and ITS versions are a separate record because their structure, drivetrain weight and towing implications differ materially.";
    replaceDetail(oldTyee, "Model Years / Era", "Late 1980s–2000s outboard versions only; multiple outboard hull generations remain under brochure comparison");
    replaceDetail(oldTyee, "Dry Hull Weight", "About 1,500 lb representative outboard basis; verify exact model year and capacity plate");
    replaceDetail(oldTyee, "Max HP", "150–175 outboard representative by year");
    replaceDetail(oldTyee, "Practical Working HP", "115–150 outboard");
    replaceDetail(oldTyee, "Placement Reason", "Primary only for verified outboard versions. This record no longer includes I/O or ITS boats, which are substantially heavier and have different towing and service implications.");
    replaceDetail(oldTyee, "Notes", "Older 18-foot Tyee outboard record only. Exact dimensions changed across the long production span, so verify year, HIN, capacity plate and propulsion. Do not use this record for I/O/ITS versions or the modern 1875 Tyee.");
    replaceDetail(oldTyee, "Research Status", "Propulsion architecture split is complete. Exact outboard hull-generation cutoff years remain under factory-catalog comparison.");

    const ioId = "boat:Lund | Tyee 1850 I/O / ITS (older generation)";
    if (!data.items.some(item => item.id === ioId)) {
      const ioTyee = originalTyee;
      ioTyee.id = ioId;
      ioTyee.model = "Tyee 1850 I/O / ITS (older generation)";
      ioTyee.displayName = "Lund | Tyee 1850 I/O / ITS (older generation)";
      ioTyee.subtitle = "Older I/O and ITS propulsion variants; separate heavy-package record";
      ioTyee.badge = "Secondary";
      ioTyee.lowPrice = null;
      ioTyee.highPrice = null;
      ioTyee.priceBasis = "Generation- and drivetrain-specific valuation pending. Outboard price guidance is not applied to I/O/ITS packages.";
      replaceDetail(ioTyee, "Model Years / Era", "Older I/O and ITS variants; exact years and drivetrain generations under catalog review");
      replaceDetail(ioTyee, "Dry Hull Weight", "Some I/O versions exceed 2,300 lb before trailer, fuel and gear; verify exact year and drivetrain");
      replaceDetail(ioTyee, "Max HP", "Not comparable to outboard horsepower rating; verify installed sterndrive package");
      replaceDetail(ioTyee, "Practical Working HP", "Not applicable; evaluate exact I/O/ITS drivetrain");
      replaceDetail(ioTyee, "Availability Under $14k", "Possible, but condition and obsolete drivetrain risk dominate");
      replaceDetail(ioTyee, "Placement Reason", "Secondary: substantially heavier than the outboard boat and often a poor match for a 4,000-lb tow ceiling once trailer, fuel and gear are included.");
      replaceDetail(ioTyee, "Notes", "This record exists to prevent I/O/ITS Tyees from inheriting outboard specifications, tow guidance or values. Require exact drivetrain identification and an actual scale weight.");
      replaceDetail(ioTyee, "Research Status", "Propulsion split confirmed from the existing factory-catalog evidence. Exact I/O/ITS model-year specifications and valuations remain under review.");
      removeDetails(ioTyee, ["1980s Value", "1990s Value", "2000s Value", "2010s Value", "2020s Value"]);
      data.items.push(ioTyee);
    }
  }

  const currentTyeeId = "boat:Lund | Tyee 1875 Sport (current generation)";
  if (!data.items.some(item => item.id === currentTyeeId)) {
    data.items.push({
      id: currentTyeeId,
      categoryId: "boats",
      categoryName: "Boats",
      manufacturer: "Lund",
      model: "Tyee 1875 Sport (current generation)",
      displayName: "Lund | Tyee 1875 Sport (current generation)",
      subtitle: "Current factory 1875 Tyee hull; not interchangeable with older 1850 records",
      badge: "Secondary",
      lowPrice: null,
      highPrice: null,
      priceBasis: "Used-market valuation is not inferred from current new-package pricing. Research pending for current-generation used examples.",
      sourceUrl: "https://www.lundboats.com/families/tyee.html",
      image: null,
      details: [
        { label: "Model Years / Era", value: "Current factory generation; exact introduction year under archive comparison" },
        { label: "Recommendation", value: "Secondary" },
        { label: "Big-Water Suitability", value: "Excellent hull; package weight and price exceed the preferred search target" },
        { label: "Layout", value: "Factory Sport full walk-through windshield" },
        { label: "Length", value: "18'10\"" },
        { label: "Beam", value: "98\"" },
        { label: "Max HP", value: "200" },
        { label: "Practical Working HP", value: "150–200" },
        { label: "Persons", value: "8" },
        { label: "Fuel Capacity", value: "40 gal" },
        { label: "Construction", value: "Riveted IPS aluminum deep-V" },
        { label: "Availability Under $14k", value: "Not realistic for current-generation packages" },
        { label: "Placement Reason", value: "Separate record because the current 1875 is materially wider and more powerful than the older 18-foot Tyee families and cannot inherit their tow or value assumptions." },
        { label: "Notes", value: "Current factory 1875 basis: 18'10\", 98-inch beam, 200-hp maximum, eight-person capacity and 40-gallon fuel tank. Do not match older 1850, I/O or ITS boats to this record." },
        { label: "Research Status", value: "Current factory dimensions confirmed. Exact introduction year and used-market valuation remain under archive comparison." },
        { label: "Interior Finish / Deck Material", value: "Current factory package-dependent." },
        { label: "Interior Material Basis", value: "Current Lund factory model page." },
        { label: "Washdown / Carpet Fit", value: "Verify exact flooring package." }
      ]
    });
  }

  updateCounts();
})();