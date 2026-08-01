import fs from "node:fs";
import vm from "node:vm";

const boatsPath = "data/boats.js";
const source = fs.readFileSync(boatsPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: boatsPath });
const boats = sandbox.window.BOATBUILDER_BOATS;
if (!Array.isArray(boats)) throw new Error("Canonical boat array could not be loaded");

const requireBoat = id => {
  const boat = boats.find(entry => entry.id === id);
  if (!boat) throw new Error(`Missing expected record: ${id}`);
  return boat;
};
const setDetail = (boat, label, value) => {
  const detail = (boat.details || []).find(entry => entry.label === label);
  if (detail) detail.value = value;
  else (boat.details ||= []).push({ label, value });
};
const spec = (value, confidence = "cited-source-exact") => ({ value, confidence });
const era = (boatId, slug, startYear, endYear, low, high, basis) => ({
  id: `${boatId}:value:${slug}`,
  label: startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`,
  startYear, endYear, low, high, basis
});
const generation = (boatId, slug, label, startYear, endYear, status, specificationBasis, sourceUrl, specs, eras, evidenceUrls = []) => ({
  id: `${boatId}:gen:${slug}`,
  label, startYear, endYear, status, specificationBasis, sourceUrl, specs, eras, evidenceUrls
});
const packageBasis = "Used complete-package screening estimate; motor age, trailer, flooring, transom, flotation, canvas and electronics can move an individual package outside the range.";

const pro1700 = requireBoat("boat:MonArk | Pro 1700 DC");
pro1700.subtitle = "1993 Pro 1700 DC plus 1995-1998 Pro 1700 evidence; 1994 not silently filled";
pro1700.lowPrice = 2500;
pro1700.highPrice = 7000;
pro1700.priceBasis = "Evidence-row package estimates. Verify HIN, capacity plate and windshield layout because the DC suffix disappears from later annual rosters.";
pro1700.valueEras = [];
setDetail(pro1700, "Model Years / Era", "1993 exact Pro 1700 DC; 1995-1997 Pro 1700 annual-roster run; 1998 period-review evidence. No 1994 factory row recovered.");
setDetail(pro1700, "Notes", "A practical older walk-through candidate, but the name changes matter. The 1993 Pro 1700 DC is a 1,050-lb aluminum boat; 1995-1997 rosters list a 1,000-lb Pro 1700; the 1998 review publishes 17 feet, 85-inch beam and 125 hp but does not publish dry weight.");
setDetail(pro1700, "Research Status", "Annual rosters and the 1998 period review were reconciled. The missing 1994 factory data is disclosed rather than bridged with inherited specifications.");
pro1700.designGenerations = [
  generation(pro1700.id, "1993-dc", "1993 Pro 1700 DC annual-roster evidence", 1993, 1993, "annual-roster-generation", "The 1993 roster identifies the exact Pro 1700 DC as a 17-foot, 1,050-lb aluminum outboard. The listed 75 hp is package horsepower, not a verified capacity-plate maximum.", "https://www.jdpower.com/boats/1993/mon-ark-boat-co/power-boats", {
    "Length": spec("17-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,050 lb", "annual-roster"),
    "Factory Package HP": spec("75 hp listed package; max rating not published", "annual-roster"),
    "Layout": spec("Dual-console / walk-through windshield", "exact-model-fitment-evidence"),
    "Construction": spec("Aluminum outboard hull; exact seam method not published", "annual-roster")
  }, [era(pro1700.id, "1993", 1993, 1993, 2500, 5000, packageBasis)], ["https://rnr-marine.com/Purchase.php?manufacturer=MonArk&model=Pro+1700+DC&partno=72N17A&product=Boat-Cover-CSF-Model&yearfrom=1993&yearto=1997"]),
  generation(pro1700.id, "1995-1997", "1995-1997 Pro 1700 annual-roster run", 1995, 1997, "annual-roster-generation", "The 1995-1997 rosters shorten the name to Pro 1700 and consistently publish a 17-foot, 1,000-lb aluminum boat with 90-hp factory packages. Treat a listing as the DC/windshield configuration only after checking photos and the HIN.", "https://www.jdpower.com/boats/1997/mon-ark-boat-co", {
    "Length": spec("17-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,000 lb", "annual-roster"),
    "Factory Package HP": spec("90 hp listed package; max rating not published", "annual-roster"),
    "Layout": spec("Pro 1700 family; confirm DC/walk-through configuration", "model-name-transition"),
    "Construction": spec("Aluminum outboard hull", "annual-roster")
  }, [era(pro1700.id, "1995-1997", 1995, 1997, 3000, 6500, packageBasis)], ["https://www.jdpower.com/boats/1995/mon-ark-boat-co", "https://www.jdpower.com/boats/1996/mon-ark-boat-co/power-boats"]),
  generation(pro1700.id, "1998-review", "1998 period-review Pro 1700 evidence", 1998, 1998, "period-review-evidence", "A 1998 multispecies guide publishes the Pro 1700 at 17 feet, 85-inch beam and 125 maximum hp, describing rough-water intent and seating for four. The 1998 annual valuation roster does not list a Pro 1700 under that name, so HIN verification is mandatory.", "https://www.boats.com/reviews/boats/small-fishing-boats-and-motors-1998-359/", {
    "Length": spec("17'0\""),
    "Beam": spec("85\""),
    "Dry Hull Weight": spec("Not published", "source-not-published"),
    "Max HP": spec("125"),
    "Persons / Seating": spec("Cockpit seating for four", "period-review"),
    "Construction": spec("Welded aluminum reverse-chine hull", "period-review")
  }, [era(pro1700.id, "1998", 1998, 1998, 3500, 7000, packageBasis)], ["https://www.jdpower.com/boats/1998/mon-ark-boat-co/power-boats"])
];

const pro1800 = requireBoat("boat:MonArk | Pro 1800 DC / FS (fiberglass; fails aluminum requirement)");
pro1800.subtitle = "1996 documented fiberglass DC/FS; deliberate material rejection";
pro1800.lowPrice = 3000;
pro1800.highPrice = 7000;
pro1800.priceBasis = "Screening value only. This model fails the project's aluminum-hull requirement regardless of price.";
pro1800.valueEras = [];
setDetail(pro1800, "Model Years / Era", "1996 documented Pro 1800 DC and Pro 1800 FS fiberglass variants");
setDetail(pro1800, "Recommendation", "Reject for this project");
setDetail(pro1800, "Placement Reason", "Deliberate exclude: the 1996 Pro 1800 DC and FS are fiberglass, contrary to the required aluminum deep-V hull.");
setDetail(pro1800, "Notes", "This row is retained as a searchable warning. Do not confuse it with MonArk's aluminum Pro 180 or other 18-foot utility models.");
setDetail(pro1800, "Research Status", "The 1996 annual roster directly identifies both DC and FS variants as fiberglass at 1,415 lb. They disappear from the 1997 and 1998 MonArk rosters.");
pro1800.designGenerations = [
  generation(pro1800.id, "1996-fiberglass", "1996 Pro 1800 DC / FS fiberglass variants", 1996, 1996, "documented-material-rejection", "The 1996 roster lists both Pro 1800 DC and Pro 1800 FS as 18-foot fiberglass outboards weighing 1,415 lb with 125-hp factory packages. That is sufficient to reject them for this aluminum-only project.", "https://www.jdpower.com/boats/1996/mon-ark-boat-co/power-boats", {
    "Length": spec("18-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,415 lb", "annual-roster"),
    "Factory Package HP": spec("125 hp listed package", "annual-roster"),
    "Layout": spec("DC and FS variants", "annual-roster"),
    "Construction": spec("Fiberglass", "annual-roster")
  }, [era(pro1800.id, "1996", 1996, 1996, 3000, 7000, packageBasis)], ["https://www.jdpower.com/boats/1997/mon-ark-boat-co", "https://www.jdpower.com/boats/1998/mon-ark-boat-co/power-boats"])
];

const spectrum = requireBoat("boat:Spectrum / Blue Fin | 1906");
spectrum.subtitle = "1990-1993 documented aluminum 1906; 1,050-lb and 1,150-lb rows separated";
spectrum.lowPrice = 2500;
spectrum.highPrice = 6500;
spectrum.priceBasis = "Generation-contained complete-package screening estimates. Old Force/Chrysler-family power, floors and transoms dominate value.";
spectrum.valueEras = [];
setDetail(spectrum, "Model Years / Era", "1990-1993 documented production; 1990-1991 1,050-lb and 1992-1993 1,150-lb roster generations separated");
setDetail(spectrum, "Notes", "The 1906 is a large, relatively light aluminum package, but documentation is sparse and the original engine package is often the weak link. Do not assume welded construction from an owner description; inspect seams, floor, transom and capacity plate.");
setDetail(spectrum, "Research Status", "Annual 1990-1993 rosters were reconciled. Published dry weight increases by 100 lb in 1992, so the years are not blended into one fictional generation.");
spectrum.designGenerations = [
  generation(spectrum.id, "1990-1991", "1990-1991 1,050-lb roster generation", 1990, 1991, "annual-roster-generation", "Annual rosters identify the 1906 as a 19-foot aluminum outboard weighing 1,050 lb. The package horsepower changes from 120 in 1990 to 90 in 1991 and is not treated as the hull's maximum rating.", "https://www.jdpower.com/boats/1990/blue-fin-ind-spectrum", {
    "Length": spec("19-foot class", "annual-roster"),
    "Dry Hull Weight": spec("1,050 lb", "annual-roster"),
    "Factory Package HP": spec("120 hp in 1990; 90 hp in 1991", "annual-roster"),
    "Max HP": spec("Verify capacity plate", "not-published"),
    "Construction": spec("Aluminum; seam construction not verified", "annual-roster")
  }, [era(spectrum.id, "1990-1991", 1990, 1991, 2500, 6000, packageBasis)], ["https://www.jdpower.com/boats/1991/blue-fin-ind-spectrum/power-boats"]),
  generation(spectrum.id, "1992-1993", "1992-1993 1,150-lb roster generation", 1992, 1993, "annual-roster-generation", "The 1992 and 1993 rosters publish a 1,150-lb 1906. The retained 1993 source adds an 89-inch beam. Factory packages are listed at 90 hp, but the capacity-plate maximum remains unverified.", "https://www.jdpower.com/boats/1993/blue-fin-ind-spectrum", {
    "Length": spec("19'0\"", "annual-roster"),
    "Beam": spec("89\" published for 1993", "cited-source-exact"),
    "Dry Hull Weight": spec("1,150 lb", "annual-roster"),
    "Factory Package HP": spec("90 hp listed package", "annual-roster"),
    "Max HP": spec("Verify capacity plate", "not-published"),
    "Construction": spec("Aluminum; seam construction not verified", "annual-roster")
  }, [era(spectrum.id, "1992-1993", 1992, 1993, 3000, 6500, packageBasis)], ["https://www.jdpower.com/boats/1992/blue-fin-ind-spectrum/power-boats"])
];

for (const boat of [pro1700, pro1800, spectrum]) {
  boat.designGenerations.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
}

const marker = "window.BOATBUILDER_BOATS";
const markerIndex = source.indexOf(marker);
const arrayStart = source.indexOf("[", markerIndex);
const arrayEnd = source.lastIndexOf("]");
if (markerIndex < 0 || arrayStart < 0 || arrayEnd <= arrayStart) throw new Error("Could not locate canonical boat array wrapper");
const output = `${source.slice(0, arrayStart)}${JSON.stringify(boats, null, 2)}${source.slice(arrayEnd + 1)}`;
fs.writeFileSync(boatsPath, output);
console.log("Applied verified MonArk and Spectrum chronology, material and pricing repairs.");
