import fs from 'node:fs';
import vm from 'node:vm';

const BOATS_PATH = 'data/boats.js';
const AUDIT_PATH = 'research/audits/alumacraft-app-model-audit-batch1-2026-07-28.md';
const source = fs.readFileSync(BOATS_PATH, 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: BOATS_PATH });
const boats = sandbox.window.BOATBUILDER_BOATS;

const SPEC_LABELS = [
  'Length','Beam','Chine / Bottom Width','Dry Hull Weight','Max / Bow Depth',
  'Cockpit / Interior Depth','Deadrise','Transom Height','Transom Width','Max HP',
  'Persons','Capacity Weight','Fuel Capacity','Bottom Thickness',
  'Side / Freeboard Thickness','Construction'
];

const ARCHIVE_URL = 'https://www.alumacraft.com/About-Alumacraft.php?content=explore_owner-zone_catalog-archive&og=1';

const configs = [
  {
    id: 'boat:Alumacraft | Classic 165 Sport',
    year: 2025,
    exactLabel: '2025 current-generation factory specification',
    disposition: 'Retained and generation-coded',
    status: 'factory-current',
    basis: '2025 Alumacraft factory model page and specification basis',
    modelYears: '2025 current-generation factory specification basis'
  },
  {
    id: 'boat:Alumacraft | Competitor 165 Sport',
    year: 2016,
    exactLabel: '2016 factory catalog specification',
    disposition: 'Narrowed and protected from unsupported later years',
    status: 'factory-exact',
    basis: '2016 Alumacraft factory catalog; exact Sport specification snapshot',
    modelYears: '2016 exact factory specification; other advertised years unresolved',
    unresolved: 'Other 2012-2019 advertised years, design generation unresolved',
    extraNote: 'The current 2026 Alumacraft lineup does not establish a continuing Competitor 165 Sport. Do not treat the 2016 hull as a present-day model.'
  },
  {
    id: 'boat:Alumacraft | Competitor 175 Sport / FSX',
    year: 2016,
    exactLabel: '2016 pre-X factory specification',
    disposition: 'Narrowed and protected from current X-generation substitution',
    status: 'factory-exact',
    basis: '2016 Alumacraft factory catalog; exact 17-foot-8-inch Competitor Sport/FSX snapshot',
    modelYears: '2016 exact pre-X factory specification; other 2014-2019 years unresolved',
    unresolved: 'Other 2014-2019 advertised years, design generation unresolved',
    extraNote: 'Do not substitute the current Competitor 175X/175 Sport platform. Alumacraft now lists the current boat at roughly 19 feet 2 inches, materially longer than this 17-foot-8-inch record.'
  },
  {
    id: 'boat:Alumacraft | Competitor 185 Sport (Secondary; 175 is Primary)',
    year: 2016,
    exactLabel: '2016 pre-X factory specification',
    disposition: 'Narrowed and protected from current X-generation substitution',
    status: 'factory-exact',
    basis: '2016 Alumacraft factory catalog; exact older Competitor 185 Sport snapshot',
    modelYears: '2016 exact pre-X factory specification; other 2010s years unresolved',
    unresolved: 'Other advertised 2010s years, design generation unresolved',
    extraNote: 'Do not substitute the current Competitor 185 platform. Alumacraft now lists the current model at roughly 20 feet 2 inches, materially longer than the older 18-foot-8-inch boat represented here.'
  },
  {
    id: 'boat:Alumacraft | Dominator 165 Sport',
    year: 2012,
    exactLabel: '2012 factory catalog specification',
    disposition: 'Narrowed to exact catalog snapshot',
    status: 'factory-exact',
    basis: '2012 Alumacraft factory catalog; exact Dominator 165 Sport specification snapshot',
    modelYears: '2012 exact factory specification; earlier 2000s-2011 boats unresolved',
    unresolved: 'Earlier advertised 2000s-2011 years, design generation unresolved'
  },
  {
    id: 'boat:Alumacraft | Dominator 175 Sport',
    year: 2012,
    exactLabel: '2012 factory catalog specification',
    disposition: 'Narrowed to exact catalog snapshot',
    status: 'factory-exact',
    basis: '2012 Alumacraft factory catalog; exact Dominator 175 Sport specification snapshot',
    modelYears: '2012 exact factory specification; earlier 2000s-2011 boats unresolved',
    unresolved: 'Earlier advertised 2000s-2011 years, design generation unresolved'
  },
  {
    id: 'boat:Alumacraft | Dominator 185 Sport (Secondary; 175 is Primary)',
    year: 2012,
    exactLabel: '2012 factory catalog specification',
    disposition: 'Narrowed to exact catalog snapshot',
    status: 'factory-exact',
    basis: '2012 Alumacraft factory catalog; exact Dominator 185 Sport specification snapshot',
    modelYears: '2012 exact factory specification; other 2000s-2010s boats unresolved',
    unresolved: 'Other advertised 2000s-2010s years, design generation unresolved'
  },
  {
    id: 'boat:Alumacraft | Edge Sport 175',
    year: 2016,
    exactLabel: '2016 factory catalog specification',
    disposition: 'Retained and generation-coded',
    status: 'factory-exact',
    basis: '2016 Alumacraft factory catalog; exact Edge Sport 175 specification',
    modelYears: '2016 exact factory catalog specification basis'
  },
  {
    id: 'boat:Alumacraft | Edge Sport 185',
    year: 2016,
    exactLabel: '2016 factory catalog specification',
    disposition: 'Retained and generation-coded',
    status: 'factory-exact',
    basis: '2016 Alumacraft factory catalog; exact Edge Sport 185 specification',
    modelYears: '2016 exact factory catalog specification basis'
  },
  {
    id: 'boat:Alumacraft | Navigator Sport 165',
    year: 2010,
    exactLabel: '2010 factory catalog specification',
    disposition: 'Retained and generation-coded',
    status: 'factory-exact',
    basis: '2010 Alumacraft factory catalog; exact Navigator Sport 165 specification',
    modelYears: '2010 exact factory catalog specification basis'
  },
  {
    id: 'boat:Alumacraft | Navigator Sport 175',
    year: 2011,
    exactLabel: '2011 factory catalog snapshot',
    disposition: 'Narrowed and unresolved years separated',
    status: 'factory-catalog-snapshot',
    basis: '2011 Alumacraft factory catalog; representative exact-year snapshot with some unpublished dimensions',
    modelYears: '2011 factory catalog snapshot; 2006-2010 generation boundaries unresolved',
    unresolved: '2006-2010 advertised years, design generation unresolved'
  },
  {
    id: 'boat:Alumacraft | Tournament Pro 185',
    year: 2016,
    exactLabel: '2016 factory catalog specification',
    disposition: 'Retained and generation-coded',
    status: 'factory-exact',
    basis: '2016 Alumacraft factory catalog; exact Tournament Pro 185 specification',
    modelYears: '2016 exact factory catalog specification basis'
  },
  {
    id: 'boat:Alumacraft | Trophy 170 (Secondary; 81-inch beam)',
    year: 1995,
    exactLabel: '1995 factory catalog specification',
    disposition: 'Narrowed and older years separated',
    status: 'factory-exact',
    basis: '1995 Alumacraft factory catalog; exact Trophy 170 specification',
    modelYears: '1995 exact factory specification; other late-1980s/1990s years unresolved',
    unresolved: 'Other advertised late-1980s and 1990s years, design generation unresolved'
  },
  {
    id: 'boat:Alumacraft | Trophy 175 Sport',
    year: 2014,
    exactLabel: '2014 pre-X factory specification',
    disposition: 'Narrowed and protected from current X-generation substitution',
    status: 'factory-exact',
    basis: '2014 Alumacraft factory catalog; exact 17-foot-8-inch Trophy 175 Sport snapshot',
    modelYears: '2014 exact pre-X factory specification; other advertised 1990s-2016 years unresolved',
    unresolved: 'Other advertised 1990s-2016 years, design generation unresolved',
    extraNote: 'Do not substitute the 2025-present Trophy 175X platform. Alumacraft lists the redesigned current boat at roughly 19 feet 1-2 inches and about 1,845 pounds, materially different from this 17-foot-8-inch, 1,550-pound hull.'
  },
  {
    id: 'boat:Alumacraft | Trophy 185 Sport (Secondary; 175 is Primary)',
    year: 2014,
    exactLabel: '2014 pre-X factory specification',
    disposition: 'Corrected, narrowed, and protected from current X-generation substitution',
    status: 'factory-exact',
    basis: '2014 Alumacraft factory specification and Yamaha performance bulletin; 18 feet 8 inches, 98-inch beam, 1,780 pounds, 175 HP, 34 gallons',
    modelYears: '2014 exact pre-X factory specification; other advertised 1990s-2010s years unresolved',
    unresolved: 'Other advertised 1990s-2010s years, design generation unresolved',
    overrides: {
      'Length': '18\'8"',
      'Beam': '98"',
      'Dry Hull Weight': '1,780 lb',
      'Max HP': '175',
      'Fuel Capacity': '34 gal'
    },
    extraNote: 'Do not substitute the current Trophy 185X platform. Alumacraft now lists the current model at roughly 20 feet 2 inches, materially longer than the 2014 boat represented here.'
  },
  {
    id: 'boat:Alumacraft | Voyageur 175 Sport',
    year: 2025,
    exactLabel: '2025 current-generation factory specification',
    disposition: 'Current snapshot separated from earlier advertised years',
    status: 'factory-current',
    basis: '2025 Alumacraft factory model page; exact current Voyageur 175 Sport specification',
    modelYears: '2025 current factory specification; 2016-2024 generation boundaries unresolved',
    unresolved: '2016-2024 advertised years, design generation unresolved'
  }
];

function get(id) {
  const record = boats.find(b => b.id === id);
  if (!record) throw new Error(`Missing Alumacraft record: ${id}`);
  return record;
}
function detail(record, label) {
  return (record.details || []).find(d => d.label === label)?.value ?? null;
}
function setDetail(record, label, value) {
  record.details ||= [];
  const item = record.details.find(d => d.label === label);
  if (item) item.value = value;
  else record.details.push({ label, value });
}
function confidence(value) {
  const text = String(value || '');
  return /about|varies|not published|not stated|representative|by year|multiple|\d+\s*[–-]\s*\d+/i.test(text)
    ? 'catalog-representative'
    : 'factory-exact';
}
function specsFromRecord(record, overrides = {}) {
  const specs = {};
  for (const label of SPEC_LABELS) {
    const value = Object.prototype.hasOwnProperty.call(overrides, label) ? overrides[label] : detail(record, label);
    if (value == null || value === '') continue;
    specs[label] = { value: String(value), confidence: confidence(value) };
  }
  return specs;
}
function erasForYear(record, year) {
  return (record.valueEras || [])
    .filter(e => year >= e.startYear && year <= e.endYear)
    .map(e => ({
      id: e.id,
      label: e.label,
      startYear: e.startYear,
      endYear: e.endYear,
      low: e.lowPrice,
      high: e.highPrice,
      basis: `${e.basis || 'Used complete-package screening estimate'}; use only after confirming the selected factory hull snapshot`
    }));
}
function exactGeneration(record, config) {
  return {
    id: `${record.id}:gen:${config.year}`,
    label: config.exactLabel,
    startYear: config.year,
    endYear: config.year,
    status: config.status,
    specificationBasis: config.basis,
    sourceUrl: record.sourceUrl,
    specs: specsFromRecord(record, config.overrides || {}),
    eras: erasForYear(record, config.year)
  };
}
function unresolvedGeneration(record, config) {
  return {
    id: `${record.id}:gen:unresolved-other-years`,
    label: config.unresolved,
    startYear: null,
    endYear: null,
    status: 'unresolved',
    specificationBasis: 'No factory specification set is assigned to this option. Research must establish the exact model year and redesign generation before specifications or price are used.',
    sourceUrl: ARCHIVE_URL,
    specs: {},
    eras: []
  };
}
function markVariable(record) {
  for (const label of SPEC_LABELS) {
    if ((record.details || []).some(d => d.label === label)) setDetail(record, label, 'Varies by selected hull generation');
  }
}
function appendNote(record, note) {
  if (!note) return;
  const current = detail(record, 'Notes') || '';
  if (!current.includes(note)) setDetail(record, 'Notes', `${current}${current ? ' ' : ''}${note}`);
}

const auditRows = [];
for (const config of configs) {
  const record = get(config.id);
  const exact = exactGeneration(record, config);
  record.designGenerations = config.unresolved ? [exact, unresolvedGeneration(record, config)] : [exact];
  record.valueEras = [];
  record.subtitle = config.modelYears;
  setDetail(record, 'Model Years / Era', config.modelYears);
  setDetail(record, 'Research Status', config.unresolved
    ? 'Exact cited factory snapshot preserved; all other advertised years remain unresolved and cannot inherit its specifications or price.'
    : 'Exact cited factory snapshot preserved as canonical generation data.');
  if (config.unresolved) {
    record.generationWarning = 'Choose the exact factory snapshot only when the listing matches the cited model year. The unresolved option intentionally has no specifications or price.';
    markVariable(record);
  } else {
    delete record.generationWarning;
  }
  appendNote(record, config.extraNote);
  if (config.overrides) {
    for (const [label, value] of Object.entries(config.overrides)) setDetail(record, label, value);
    if (config.unresolved) markVariable(record);
  }
  auditRows.push({
    model: record.model,
    disposition: config.disposition,
    basis: config.basis,
    result: config.unresolved
      ? 'Exact catalog snapshot is selectable; all other advertised years are explicit unresolved options with no inherited specification or price.'
      : 'Exact catalog snapshot is stored directly in canonical generation data.'
  });
}

// Keep the Magnum CS as a searchable rejection row, not a fake single model.
{
  const record = get('boat:Alumacraft | Magnum CS (side-console series; no walk-through windshield)');
  record.designGenerations = [{
    id: `${record.id}:gen:family-rejection`,
    label: 'Family-level rejection row; multiple CS sizes and years',
    startYear: null,
    endYear: null,
    status: 'family-umbrella-rejection',
    specificationBasis: '1995 Alumacraft factory catalog and family identification. CS denotes side-console configurations; this row is retained only to reject the layout from the required full-windshield search.',
    sourceUrl: record.sourceUrl,
    specs: specsFromRecord(record),
    eras: []
  }];
  record.valueEras = [];
  record.lowPrice = null;
  record.highPrice = null;
  record.priceBasis = 'Deliberate rejection row; package pricing is not used.';
  record.subtitle = 'Family-level rejection row; multiple CS sizes and years';
  setDetail(record, 'Model Years / Era', 'Family-level rejection row; multiple CS sizes and years');
  setDetail(record, 'Research Status', 'Retained only so listings can be rejected for side-console layout. Not treated as one hull generation.');
  record.generationWarning = 'This is not one exact boat model. CS is a side-console family label and does not meet the required full walk-through windshield layout.';
  auditRows.push({
    model: record.model,
    disposition: 'Converted to explicit family-level rejection row',
    basis: '1995 Alumacraft factory catalog and CS layout identification',
    result: 'No blended family price or exact hull specification is presented.'
  });
}

const alumacraft = boats.filter(b => b.manufacturer === 'Alumacraft');
if (alumacraft.length !== 17) throw new Error(`Expected 17 Alumacraft records, found ${alumacraft.length}`);
if (!alumacraft.every(b => Array.isArray(b.designGenerations) && b.designGenerations.length)) {
  throw new Error('One or more Alumacraft records lacks designGenerations');
}

fs.writeFileSync(BOATS_PATH, `window.BOATBUILDER_BOATS = ${JSON.stringify(boats, null, 2)};\n`);

const rows = auditRows
  .sort((a,b) => a.model.localeCompare(b.model))
  .map(r => `| ${r.model.replaceAll('|','/')} | ${r.disposition} | ${r.basis.replaceAll('|','/')} | ${r.result} |`)
  .join('\n');

const audit = `# Alumacraft app-model audit batch 1 - 2026-07-28\n\n## Scope\n\nThis batch is limited to the **17 Alumacraft records already present in BoatBuilder**. It does not add every Alumacraft model or claim that every production year has been reconciled.\n\nPrimary sources are Alumacraft's official catalog archive, the exact factory catalog/model URLs stored on each record, current Alumacraft model pages, and the 2014 Yamaha performance bulletin that reports Alumacraft-published Trophy 185 Sport specifications.\n\n## Result\n\n- 17 of 17 Alumacraft app records now have explicit canonical generation metadata.\n- 11 broad records expose an exact catalog snapshot plus an unresolved-years option.\n- 5 exact-year/current records are stored as single factory-backed generations.\n- The Magnum CS row is explicitly a family-level rejection row, not a fake exact model.\n- Unresolved years have no inherited specifications or package price.\n- Current X-generation Competitor and Trophy boats are blocked from inheriting older same-numbered hull data.\n\n## Dispositions\n\n| App model | Disposition | Evidence basis | Result |\n|---|---|---|---|\n${rows}\n\n## Remaining Alumacraft work\n\nThis is a safety and exact-snapshot batch, not manufacturer completion. The next pass must compare the unresolved years model by model, especially Dominator, Navigator, Trophy, and early Competitor production, then replace unresolved options only when factory catalogs establish a defensible generation boundary.\n`;
fs.mkdirSync('research/audits', { recursive: true });
fs.writeFileSync(AUDIT_PATH, audit);
console.log(`Updated ${alumacraft.length} Alumacraft records; ${configs.filter(c => c.unresolved).length} exact-plus-unresolved records; wrote ${AUDIT_PATH}`);
