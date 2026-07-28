import fs from 'node:fs';
import vm from 'node:vm';

const BOATS_PATH = 'data/boats.js';
const AUDIT_PATH = 'research/audits/lund-app-model-audit-2026-07-28.md';
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
const audit = [];

function get(id) {
  const r = boats.find(b => b.id === id);
  if (!r) throw new Error(`Missing Lund record: ${id}`);
  return r;
}
function detail(r, label) {
  return (r.details || []).find(d => d.label === label)?.value ?? null;
}
function setDetail(r, label, value) {
  r.details ||= [];
  const d = r.details.find(x => x.label === label);
  if (d) d.value = value;
  else r.details.push({ label, value });
}
function setDetails(r, values) {
  for (const [k,v] of Object.entries(values)) setDetail(r,k,v);
}
function spec(value, confidence='factory-exact', note) {
  const o = { value, confidence };
  if (note) o.note = note;
  return o;
}
function specsFromRecord(r, overrides={}) {
  const out = {};
  for (const label of SPEC_LABELS) {
    const v = Object.prototype.hasOwnProperty.call(overrides,label) ? overrides[label] : detail(r,label);
    if (v != null && v !== '') out[label] = spec(String(v), 'catalog-representative');
  }
  return out;
}
function exactSpecs(values, confidence='factory-exact') {
  return Object.fromEntries(Object.entries(values).map(([k,v]) => [k, spec(String(v), confidence)]));
}
function era(id,label,startYear,endYear,low,high,basis='Used complete-package screening estimate') {
  return { id, label, startYear, endYear, low, high, basis };
}
function existingEras(r, labels=null) {
  return (r.valueEras || [])
    .filter(e => !labels || labels.includes(e.label))
    .map(e => era(e.id,e.label,e.startYear,e.endYear,e.lowPrice,e.highPrice,e.basis));
}
function pendingEra(r,label,startYear,endYear,basis='Generation-specific used-package pricing pending') {
  return era(`${r.id}:value:${label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,label,startYear,endYear,null,null,basis);
}
function generation({id,label,startYear=null,endYear=null,status='factory-exact',basis,sourceUrl,specs,eras=[]}) {
  return { id,label,startYear,endYear,status,specificationBasis:basis,sourceUrl,specs,eras };
}
function markVariable(r) {
  for (const label of SPEC_LABELS) {
    if ((r.details || []).some(d => d.label === label)) setDetail(r,label,'Varies by selected hull generation');
  }
}
function finishSingle(r, g, {subtitle,modelYears,sourceUrl,details={},warning=null,lowPrice,highPrice,valueEras}={}) {
  r.designGenerations = [g];
  if (subtitle) r.subtitle = subtitle;
  if (modelYears) setDetail(r,'Model Years / Era',modelYears);
  if (sourceUrl) r.sourceUrl = sourceUrl;
  if (warning) r.generationWarning = warning; else delete r.generationWarning;
  if (lowPrice !== undefined) r.lowPrice = lowPrice;
  if (highPrice !== undefined) r.highPrice = highPrice;
  if (valueEras !== undefined) r.valueEras = valueEras;
  setDetails(r,details);
}
function finishMulti(r, generations, {subtitle,modelYears,sourceUrl,details={},warning}={}) {
  r.designGenerations = generations;
  r.valueEras = [];
  if (subtitle) r.subtitle = subtitle;
  if (modelYears) setDetail(r,'Model Years / Era',modelYears);
  if (sourceUrl) r.sourceUrl = sourceUrl;
  r.generationWarning = warning || 'Select the documented hull generation. Do not transfer dimensions, capacities, horsepower ratings, construction, or prices between generations.';
  setDetails(r,details);
  markVariable(r);
}
function log(r, disposition, status, basis, note) {
  audit.push({ model:r.model, disposition, status, basis, note });
}

// 1997 exact factory-catalog records.
for (const [id,label] of [
  ['boat:Lund | 1600 Angler','1997 factory specification'],
  ['boat:Lund | 1600 Explorer','1997 factory specification']
]) {
  const r=get(id);
  const g=generation({id:`${id}:gen:1997`,label,startYear:1997,endYear:1997,basis:'1997 Lund factory catalog; exact model and model year',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'1997 factory model and specification basis',modelYears:'1997 factory model and exact specification basis'});
  log(r,'Retained and generation-coded','Factory exact','1997 Lund factory catalog','No broader production span is implied by the displayed specifications.');
}
{
  const r=get('boat:Lund | 1600 Pro Sport');
  const g=generation({id:`${r.id}:gen:1997`,label:'1997 factory specification',startYear:1997,endYear:1997,basis:'1997 Lund factory catalog; exact model and model year',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r,['1990s'])});
  finishSingle(r,g,{subtitle:'1997 exact factory specification basis',modelYears:'1997 exact factory specification basis; later advertised years are not assumed to share every specification',valueEras:(r.valueEras||[]).filter(e=>e.label==='1990s')});
  log(r,'Narrowed','Factory exact','1997 Lund factory catalog','Removed the unsupported implication that one 1997 specification set covers every later model year.');
}

// Adventure 1675: documented 2024 redesign.
{
  const r=get('boat:Lund | Adventure Sport 1675');
  const oldSpecs=specsFromRecord(r,{'Fuel Capacity':'21 gal'});
  for (const v of Object.values(oldSpecs)) v.confidence='factory-exact';
  const generations=[
    generation({id:`${r.id}:gen:2021`,label:'2021 pre-redesign plywood generation',startYear:2021,endYear:2023,status:'factory-exact',basis:'2021 Lund Red Book; 2024 catalog explicitly identifies a redesign for 2024',sourceUrl:'https://www.lundboats.com/content/dam/lund/general/2021-Lund-Redbook.pdf',specs:oldSpecs,eras:existingEras(r)}),
    generation({id:`${r.id}:gen:2024`,label:'2024-present wood-free redesign',startYear:2024,endYear:null,status:'factory-generation',basis:'2024 Lund factory catalog establishes redesign year; current Lund Sport configurator supplies configuration-specific weight and dimensions',sourceUrl:'https://www.lundboats.com/families/adventure/1675-adventure.html',specs:exactSpecs({'Length':'16\'10"','Beam':'87"','Chine / Bottom Width':'70"','Dry Hull Weight':'1,215 lb Sport','Cockpit / Interior Depth':'23"','Transom Height':'20"','Max HP':'90','Persons':'6','Capacity Weight':'1,350 lb','Fuel Capacity':'20 gal','Bottom Thickness':'0.080"','Construction':'Riveted IPS aluminum; wood-free construction'},'factory-generation'),eras:[pendingEra(r,'2020s',2024,2029)]})
  ];
  finishMulti(r,generations,{subtitle:'2021 pre-redesign and 2024-present wood-free generations',modelYears:'2021 documented pre-redesign; redesigned for 2024 and current',sourceUrl:'https://www.lundboats.com/families/adventure/1675-adventure.html',details:{'Research Status':'2024 redesign boundary factory-confirmed; both documented generations separated.'}});
  log(r,'Split','Factory generation','2021 Red Book; 2024 catalog; current Lund configurator','The 2024 wood-free redesign no longer inherits the lighter plywood-generation specifications or value.');
}

// Alaskan generations.
{
  const r=get('boat:Lund | Alaskan 1800 Sport');
  const old=specsFromRecord(r);
  for(const v of Object.values(old)) v.confidence='factory-exact';
  const modern=exactSpecs({'Length':'18\'9"','Beam':'83"','Chine / Bottom Width':'69.5"','Dry Hull Weight':'1,105 lb DC','Cockpit / Interior Depth':'21"','Transom Height':'20"','Max HP':'90','Persons':'7','Fuel Capacity':'20 gal','Bottom Thickness':'0.100"','Side / Freeboard Thickness':'0.080"','Construction':'Riveted IPS aluminum; composite transom; treated marine plywood'},'factory-exact');
  finishMulti(r,[
    generation({id:`${r.id}:gen:2003`,label:'2003 documented Sport hull',startYear:2003,endYear:2003,basis:'2003 Lund factory catalog; exact Sport configuration',sourceUrl:'https://www.lundboats.com/content/dam/lund/technical/documents/2003-Lund-Catalog.pdf',specs:old,eras:existingEras(r,['2000s'])}),
    generation({id:`${r.id}:gen:2021`,label:'2021 documented DC hull',startYear:2021,endYear:2021,basis:'2021 Lund Red Book; exact dual-console configuration',sourceUrl:'https://www.lundboats.com/content/dam/lund/general/2021-Lund-Redbook.pdf',specs:modern,eras:[pendingEra(r,'2020s',2020,2023)]})
  ],{subtitle:'2003 and 2021 documented 1800 dual-console specification sets',modelYears:'2003 and 2021 exact factory specification sets; transition boundaries between them are not assumed',details:{'Research Status':'Two exact factory snapshots separated; undocumented intervening transition years remain unassigned.'}});
  log(r,'Split into documented snapshots','Factory exact','2003 catalog and 2021 Red Book','Prevents the 2003 1,030-lb specification from being applied automatically to later 1,105-lb DC boats.');
}
{
  const r=get('boat:Lund | Alaskan 2000 Sport');
  const old=specsFromRecord(r);
  for(const v of Object.values(old)) v.confidence='factory-exact';
  const modern=exactSpecs({'Length':'20\'6"','Beam':'90.5"','Chine / Bottom Width':'76"','Dry Hull Weight':'1,301 lb DC','Cockpit / Interior Depth':'21"','Transom Height':'25"','Max HP':'150','Persons':'7','Fuel Capacity':'29 gal','Bottom Thickness':'0.125"','Side / Freeboard Thickness':'0.080"','Construction':'Riveted IPS aluminum; composite transom; treated marine plywood'},'factory-exact');
  finishMulti(r,[
    generation({id:`${r.id}:gen:2003`,label:'2003 documented Sport hull',startYear:2003,endYear:2003,basis:'2003 Lund factory catalog; exact Sport configuration',sourceUrl:'https://www.lundboats.com/content/dam/lund/technical/documents/2003-Lund-Catalog.pdf',specs:old,eras:existingEras(r,['2000s'])}),
    generation({id:`${r.id}:gen:2021`,label:'2021 documented DC hull',startYear:2021,endYear:2021,basis:'2021 Lund Red Book; exact dual-console configuration',sourceUrl:'https://www.lundboats.com/content/dam/lund/general/2021-Lund-Redbook.pdf',specs:modern,eras:[pendingEra(r,'2020s',2020,2023)]})
  ],{subtitle:'2003 and 2021 documented 2000 dual-console specification sets',modelYears:'2003 and 2021 exact factory specification sets; transition boundaries between them are not assumed',details:{'Research Status':'Two exact factory snapshots separated; unsupported 1990s and 2010s specification inheritance removed.'}});
  log(r,'Split and narrowed','Factory exact','2003 catalog and 2021 Red Book','The 2003 125-hp/1,275-lb basis is separated from the 2021 150-hp/1,301-lb DC specification.');
}
{
  const r=get('boat:Lund | Alaskan 1875 Sport (2024 redesign)');
  setDetails(r,{'Chine / Bottom Width':'78.5"','Dry Hull Weight':'1,225 lb Sport','Cockpit / Interior Depth':'21"','Transom Height':'20"','Max HP':'115','Persons':'7','Capacity Weight':'1,700 lb','Fuel Capacity':'20 gal','Bottom Thickness':'0.100"','Side / Freeboard Thickness':'0.080"','Construction':'Riveted IPS aluminum; wood-free construction'});
  const g=generation({id:`${r.id}:gen:2024`,label:'2024-present wood-free redesign',startYear:2024,endYear:null,status:'factory-generation',basis:'2024 Lund factory catalog establishes the redesign; current Lund Sport configurator supplies Sport-specific weight',sourceUrl:'https://www.lundboats.com/families/alaskan/1875-alaskan.html',specs:specsFromRecord(r),eras:[pendingEra(r,'2020s',2024,2029)]});
  for(const v of Object.values(g.specs)) v.confidence='factory-generation';
  finishSingle(r,g,{subtitle:'2024-present redesigned wood-free factory hull',modelYears:'2024-present redesigned factory hull',sourceUrl:g.sourceUrl,lowPrice:null,highPrice:null,valueEras:[],details:{'Research Status':'2024 redesign and Sport-specific current specifications factory-confirmed.'}});
  log(r,'Corrected and generation-coded','Factory generation','2024 catalog and current Lund Sport configurator','Replaced tiller-derived weight wording with the 1,225-lb Sport specification.');
}

// Current Angler Sport.
{
  const r=get('boat:Lund | Angler Sport 1650');
  setDetails(r,{'Model Years / Era':'2026 current factory specification','Length':'16\'5"','Beam':'80.5"','Chine / Bottom Width':'66.25"','Dry Hull Weight':'905 lb Sport','Cockpit / Interior Depth':'20.75"','Transom Height':'20"','Max HP':'60','Persons':'5','Capacity Weight':'1,422 lb','Fuel Capacity':'6.5 gal','Bottom Thickness':'0.080"','Side / Freeboard Thickness':'0.063"','Construction':'Riveted IPS aluminum; double-plated bow 0.143"'});
  const g=generation({id:`${r.id}:gen:2026`,label:'2026 current Sport configuration',startYear:2026,endYear:null,status:'factory-exact',basis:'Current Lund 1650 Angler Sport configurator',sourceUrl:'https://www.lundboats.com/families/angler/1650-angler.html',specs:specsFromRecord(r),eras:existingEras(r)});
  for(const v of Object.values(g.specs)) v.confidence='factory-exact';
  finishSingle(r,g,{subtitle:'2026 current factory Sport specification',sourceUrl:g.sourceUrl});
  log(r,'Corrected','Factory exact','Current Lund Sport configurator','Added Sport-specific 905-lb weight, chine, capacity and current horsepower details.');
}

// Crossover family.
{
  const r=get('boat:Lund | Crossover XS 1675');
  const g=generation({id:`${r.id}:gen:2014`,label:'2014 factory specification',startYear:2014,endYear:2014,basis:'2014 Lund factory catalog; exact model year',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2014 exact factory specification basis',modelYears:'2014 exact factory specification basis'});
  log(r,'Retained and narrowed','Factory exact','2014 Lund factory catalog','No later Crossover 1675 specification is inferred.');
}
for (const cfg of [
  {id:'boat:Lund | Crossover XS 1775',oldLabel:'2014 documented hull',newLabel:'2026 current hull',newValues:{'Length':'17\'9"','Beam':'95"','Chine / Bottom Width':'82"','Dry Hull Weight':'1,625 lb','Cockpit / Interior Depth':'25"','Transom Height':'25"','Max HP':'150','Persons':'7','Capacity Weight':'1,750 lb','Fuel Capacity':'28 gal','Bottom Thickness':'0.100"','Side / Freeboard Thickness':'0.080"','Construction':'Riveted IPS aluminum'},oldEra:'2010s'},
  {id:'boat:Lund | Crossover XS 1875',oldLabel:'2014 documented hull',newLabel:'2026 current hull',newValues:{'Length':'18\'9"','Beam':'95"','Chine / Bottom Width':'82"','Dry Hull Weight':'1,700 lb','Cockpit / Interior Depth':'25"','Transom Height':'25"','Max HP':'175','Persons':'8','Capacity Weight':'1,800 lb','Fuel Capacity':'35 gal','Bottom Thickness':'0.100"','Side / Freeboard Thickness':'0.080"','Construction':'Riveted IPS aluminum'},oldEra:'2010s'}
]) {
  const r=get(cfg.id); const old=specsFromRecord(r); for(const v of Object.values(old))v.confidence='factory-exact';
  finishMulti(r,[
    generation({id:`${r.id}:gen:2014`,label:cfg.oldLabel,startYear:2014,endYear:2014,basis:'2014 Lund factory catalog; exact model year',sourceUrl:'https://library.rvusa.com/brochure/2014-Lund.pdf',specs:old,eras:existingEras(r,[cfg.oldEra])}),
    generation({id:`${r.id}:gen:2026`,label:cfg.newLabel,startYear:2026,endYear:null,basis:'Current Lund model page/configurator; 2025 catalog retains the earlier nominal length, so the current specification is not backfilled into older boats',sourceUrl:cfg.id.includes('1775')?'https://www.lundboats.com/families/crossover-xs/1775-crossover-xs.html':'https://www.lundboats.com/families/crossover-xs/1875-crossover-xs.html',specs:exactSpecs(cfg.newValues,'factory-exact'),eras:[pendingEra(r,'2020s',2026,2029)]})
  ],{subtitle:'2014 documented and 2026 current specification sets',modelYears:'2014 exact factory basis and 2026 current factory basis; intervening transition is not assumed',sourceUrl:cfg.id.includes('1775')?'https://www.lundboats.com/families/crossover-xs/1775-crossover-xs.html':'https://www.lundboats.com/families/crossover-xs/1875-crossover-xs.html',details:{'Research Status':'2014 and 2026 exact specification sets separated; no unsupported transition year assigned.'}});
  log(r,'Split into documented snapshots','Factory exact','2014 catalog, 2025 catalog and current Lund configurator','Current heavier/nominally shorter specification is not applied to the 2014 hull.');
}

// Explorer and Fisherman exact historical bases.
{
  const r=get('boat:Lund | Explorer Sport 1725 (Primary; not Starcraft Explorer 160 or Fish-Rite Explorer)');
  setDetails(r,{'Model Years / Era':'2008 exact specification basis; advertised 2008–2012 family span','Length':'17\'4"','Beam':'92"','Dry Hull Weight':'1,230 lb','Transom Height':'20"','Max HP':'125','Fuel Capacity':'27 gal'});
  const g=generation({id:`${r.id}:gen:2008`,label:'2008 factory-model specification',startYear:2008,endYear:2008,status:'secondary-verified',basis:'2008 Lund brochure/specification listings corroborated by model-specific reference data',sourceUrl:'https://library.rvusa.com/brochure/2008.pdf',specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2008 exact specification basis; 2008–2012 advertised family span',sourceUrl:'https://library.rvusa.com/brochure/2008.pdf',warning:'The displayed specifications are for model year 2008. Do not assume every 2009–2012 listing is identical without its capacity plate.'});
  log(r,'Corrected and narrowed','Secondary verified','2008 Lund brochure and exact-model specification references','Corrected 17\'10"/87"/1,135 lb to the documented 17\'4"/92"/1,230 lb 2008 boat.');
}
{
  const r=get('boat:Lund | Explorer Sport 1825');
  setDetails(r,{'Model Years / Era':'2008 exact specification basis; advertised 2008–2012 family span','Length':'18\'4"','Beam':'96"','Dry Hull Weight':'1,450 lb','Transom Height':'25"','Max HP':'150','Fuel Capacity':'32 gal'});
  const g=generation({id:`${r.id}:gen:2008`,label:'2008 factory-model specification',startYear:2008,endYear:2008,status:'secondary-verified',basis:'2008 Lund brochure/specification listings corroborated by model-specific reference data',sourceUrl:'https://library.rvusa.com/brochure/2008.pdf',specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2008 exact specification basis; 2008–2012 advertised family span',sourceUrl:'https://library.rvusa.com/brochure/2008.pdf',warning:'The displayed specifications are for model year 2008. Later model years require capacity-plate verification.'});
  log(r,'Corrected and narrowed','Secondary verified','2008 Lund brochure and exact-model specification references','Removed the unsupported 175-hp upper rating from the 2008 basis.');
}
{
  const r=get('boat:Lund | Fisherman 1750 (Pro Fisherman-era name)');
  setDetails(r,{'Model Years / Era':'2008 exact specification basis; 2007–2012 family span','Length':'17\'6"','Beam':'93"','Dry Hull Weight':'1,345 lb','Transom Height':'25"','Max HP':'135','Fuel Capacity':'27 gal'});
  const g=generation({id:`${r.id}:gen:2008`,label:'2008 factory-model specification',startYear:2008,endYear:2008,status:'secondary-verified',basis:'2008 Lund brochure and exact-model specification references',sourceUrl:'https://library.rvusa.com/brochure/2008.pdf',specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2008 exact specification basis; 2007–2012 family span',sourceUrl:'https://library.rvusa.com/brochure/2008.pdf',warning:'The 2008 135-hp specification is shown. Some later Fisherman 1750 model years may differ; verify the listing year and capacity plate.'});
  log(r,'Corrected and narrowed','Secondary verified','2008 Lund brochure and model-specific references','Corrected length from 17\'10" to 17\'6" and stopped treating the full family span as one exact specification.');
}
{
  const r=get('boat:Lund | Fisherman 1800 OB / full-windshield');
  const g=generation({id:`${r.id}:gen:2004`,label:'2004 outboard full-windshield specification',startYear:2004,endYear:2004,status:'factory-exact',basis:'2004 Lund factory catalog; exact outboard/full-windshield basis',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2004 exact outboard/full-windshield specification basis',modelYears:'2004 exact factory specification basis; later advertised years require verification'});
  log(r,'Narrowed','Factory exact','2004 Lund factory catalog','The 2004 specification is retained without claiming every 2004–2009 boat is unchanged.');
}

// Impact non-XS and Rebel XL.
{
  const r=get('boat:Lund | Impact Sport 1775');
  const old=specsFromRecord(r); for(const v of Object.values(old))v.confidence='factory-exact';
  const newer=exactSpecs({'Length':'17\'11"','Beam':'96"','Chine / Bottom Width':'81.5"','Dry Hull Weight':'1,360 lb','Cockpit / Interior Depth':'22.75"','Transom Height':'25"','Max HP':'125','Persons':'6','Fuel Capacity':'30 gal','Bottom Thickness':'0.080"','Side / Freeboard Thickness':'0.063"','Construction':'Riveted IPS aluminum; twin-plated bow; composite transom'},'factory-exact');
  finishMulti(r,[
    generation({id:`${r.id}:gen:2014`,label:'2014 documented non-XS hull',startYear:2014,endYear:2014,basis:'2014 Lund factory catalog; exact non-XS Impact Sport',sourceUrl:'https://library.rvusa.com/brochure/2014-Lund.pdf',specs:old,eras:existingEras(r,['2010s'])}),
    generation({id:`${r.id}:gen:2021`,label:'2021 documented non-XS hull',startYear:2021,endYear:2021,basis:'2021 Lund Red Book; exact non-XS Impact Sport',sourceUrl:'https://www.lundboats.com/content/dam/lund/general/2021-Lund-Redbook.pdf',specs:newer,eras:[pendingEra(r,'2020s',2020,2023)]})
  ],{subtitle:'2014 and 2021 documented non-XS Impact Sport hulls',modelYears:'2014 and 2021 exact non-XS factory specification sets; transition boundary not assumed',details:{'Notes':'This record is for the non-XS Impact Sport. Do not apply current Impact XS specifications, jump-seat structure or prices to it.','Research Status':'Material 2014-to-2021 dimensional and weight change documented; exact transition year remains unassigned.'}});
  log(r,'Split','Factory exact','2014 catalog and 2021 Red Book','Separates 17\'9" × 94" × 1,220 lb from 17\'11" × 96" × 1,360 lb and blocks Impact XS substitution.');
}
{
  const r=get('boat:Lund | Rebel XL Sport 1650');
  const old=specsFromRecord(r); for(const v of Object.values(old))v.confidence='factory-exact';
  const modern=exactSpecs({'Length':'16\'7"','Beam':'85"','Chine / Bottom Width':'70.5"','Dry Hull Weight':'965 lb Sport','Cockpit / Interior Depth':'22.5"','Transom Height':'20"','Max HP':'90','Persons':'6','Capacity Weight':'1,350 lb','Fuel Capacity':'19 gal','Bottom Thickness':'0.080"','Side / Freeboard Thickness':'0.063"','Construction':'Riveted IPS aluminum; twin-plated bow; treated marine plywood'},'factory-generation');
  finishMulti(r,[
    generation({id:`${r.id}:gen:2014`,label:'2014 documented Sport hull',startYear:2014,endYear:2014,basis:'2014 Lund factory catalog; exact model year',sourceUrl:'https://library.rvusa.com/brochure/2014-Lund.pdf',specs:old,eras:existingEras(r,['2010s'])}),
    generation({id:`${r.id}:gen:2021`,label:'2021-present documented Sport hull',startYear:2021,endYear:null,status:'factory-generation',basis:'2021 Red Book and current Lund Sport configurator agree on principal Sport dimensions and weight',sourceUrl:'https://www.lundboats.com/families/rebel-xl/1650-rebel-xl.html',specs:modern,eras:[pendingEra(r,'2020s',2020,2029)]})
  ],{subtitle:'2014 and 2021-present documented Sport specification sets',modelYears:'2014 exact basis and 2021-present documented basis; transition year before 2021 is not assumed',sourceUrl:'https://www.lundboats.com/families/rebel-xl/1650-rebel-xl.html'});
  log(r,'Split','Factory generation','2014 catalog, 2021 Red Book and current Lund configurator','Separates the earlier 16\'6" × 84" × 890-lb basis from the 16\'7" × 85" × 965-lb Sport.');
}

// Mr Pike and Pro-V historical exact-year cleanup.
{
  const r=get('boat:Lund | Mr Pike 17');
  setDetails(r,{'Model Years / Era':'2002 exact specification basis; 2001 and earlier are materially different','Length':'17\'0"','Beam':'92"','Dry Hull Weight':'1,183 lb','Max HP':'Verify capacity plate; 2002 packages commonly 125–135 hp','Notes':'The 2002 Mr Pike 17 is a materially different boat from 2001 and earlier examples. This record now represents 2002 only.'});
  const g=generation({id:`${r.id}:gen:2002`,label:'2002 redesigned Mr Pike 17',startYear:2002,endYear:2002,status:'secondary-verified',basis:'2002 factory-catalog/model specification references and period owner corroboration',sourceUrl:'https://www.lundboats.com/content/dam/lund/technical/documents/2002-Lund-Catalog.pdf',specs:specsFromRecord(r),eras:existingEras(r,['2000s'])});
  finishSingle(r,g,{subtitle:'2002 redesigned model-year basis',valueEras:(r.valueEras||[]).filter(e=>e.label==='2000s'),warning:'Do not use this 2002 specification for a 1999–2001 Mr Pike. Those earlier boats require a separate exact-year match.'});
  log(r,'Narrowed to redesign year','Secondary verified','2002 catalog/spec references','Eliminated the false 1999–2002 blended beam, weight and horsepower range.');
}
{
  const r=get('boat:Lund | Pro-V 1775 (non-walk-through configurations)');
  const common={'Length':'17\'0"','Layout':'SE/console configurations; exact windshield arrangement must be verified from the listing'};
  const g2000=exactSpecs({'Length':'17\'0"','Beam':'90"','Dry Hull Weight':'1,270 lb','Max HP':'Verify 2000 capacity plate','Construction':'Riveted aluminum Pro-V hull'},'secondary-verified');
  const g2002=exactSpecs({'Length':'17\'0"','Beam':'92"','Dry Hull Weight':'1,355 lb','Max HP':'150','Persons':'6','Fuel Capacity':'32 gal','Construction':'Riveted deep-V aluminum Pro-V hull'},'secondary-verified');
  finishMulti(r,[
    generation({id:`${r.id}:gen:2000`,label:'2000 Pro-V 1775 SE specification',startYear:2000,endYear:2000,status:'secondary-verified',basis:'2000 exact-model specification reference',sourceUrl:'https://www.lundboats.com/content/dam/lund/technical/documents/2000-Lund-Catalog.pdf',specs:g2000,eras:existingEras(r,['2000s'])}),
    generation({id:`${r.id}:gen:2002`,label:'2002 Pro-V 1775 SE specification',startYear:2002,endYear:2002,status:'secondary-verified',basis:'2002 exact-model factory/specification references',sourceUrl:'https://www.lundboats.com/content/dam/lund/technical/documents/2002-Lund-Catalog.pdf',specs:g2002,eras:existingEras(r,['2000s'])})
  ],{subtitle:'2000 and 2002 materially different Pro-V 1775 SE specification sets',modelYears:'2000 and 2002 exact specification sets; other years require exact-year verification',details:{'Layout':common.Layout,'Notes':'Model name alone does not prove a full walk-through windshield. The app keeps this as a non-walk-through/verify-layout record.','Research Status':'2000 and 2002 dimensional and weight differences separated.'}});
  log(r,'Split','Secondary verified','2000 and 2002 exact-model references','Separates the 90-inch/1,270-lb boat from the 92-inch/1,355-lb boat.');
}
{
  const r=get('boat:Lund | Pro-V 1800 SE (Primary; exact SE full-windshield version)');
  const g=generation({id:`${r.id}:gen:2004`,label:'2004 Pro-V 1800 SE full-windshield specification',startYear:2004,endYear:2004,status:'factory-exact',basis:'2004 Lund factory catalog; exact SE full-windshield model',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2004 exact SE full-windshield specification basis',modelYears:'2004 exact factory specification basis; the broader 2000s name span is not treated as one unchanged hull'});
  log(r,'Narrowed','Factory exact','2004 Lund factory catalog','Retains the exact desirable full-windshield version without spreading its specifications across all 2000s Pro-V 1800 boats.');
}

// Tyee family.
{
  const r=get('boat:Lund | Tyee 1700 (Primary; not the much heavier 1850 ITS/I-O)');
  setDetails(r,{'Model Years / Era':'1997 and 2012 evidence supports the same principal 17\' × 88" outboard specification; exact uninterrupted production boundaries not claimed','Length':'17\'0"','Beam':'88"','Dry Hull Weight':'1,200 lb','Max HP':'125','Fuel Capacity':'24 gal'});
  const eras=[...existingEras(r),pendingEra(r,'2010s',2010,2019)];
  const g=generation({id:`${r.id}:gen:17x88`,label:'Documented 17-foot × 88-inch outboard hull',startYear:1997,endYear:2012,status:'secondary-verified',basis:'1997 factory-family evidence and 2012 exact-model specification agree on principal dimensions, weight and horsepower; continuity between every year is not asserted',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras});
  finishSingle(r,g,{subtitle:'Documented 17-foot × 88-inch outboard hull; 1997 and 2012 evidence',lowPrice:3500,highPrice:7500,valueEras:r.valueEras,warning:'The 1997 and 2012 evidence agrees on principal specifications, but an exact uninterrupted production-year boundary has not been proven. Verify the listing year and capacity plate.'});
  log(r,'Corrected span and generation-coded','Secondary verified','1997 family evidence and 2012 exact-model specifications','The former late-1990s–2006 cutoff was too narrow; 2012 evidence matches the principal hull specification.');
}
{
  const r=get('boat:Lund | Tyee 1750');
  setDetails(r,{'Model Years / Era':'2007–2013 family span; 2011–2013 exact specification basis','Length':'17\'6"','Beam':'93"','Dry Hull Weight':'1,345 lb','Max HP':'150','Fuel Capacity':'27 gal'});
  const g=generation({id:`${r.id}:gen:2011`,label:'2011–2013 documented Tyee 1750 hull',startYear:2011,endYear:2013,status:'secondary-verified',basis:'2011–2013 exact-model specification references agree on principal dimensions, weight and horsepower',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g,{subtitle:'2011–2013 exact specification basis within the 2007–2013 family span',warning:'Specifications displayed are verified for 2011–2013. A 2007–2010 listing still requires exact-year confirmation.'});
  log(r,'Corrected and narrowed','Secondary verified','2011–2013 exact-model references','Corrected the approximate 17\'10"/94" record to the documented 17\'6"/93"/1,345-lb boat.');
}
for (const [id,label,start,end,basis] of [
  ['boat:Lund | Tyee 1750 Outboard (1994 generation)','1994 documented outboard generation',1991,1996,'1994 Lund factory catalog; exact outboard specification basis'],
  ['boat:Lund | Tyee 5.3 (Lund American-era 17\'4")','1981 Tyee 5.3 factory specification',1981,1981,'1981 Lund factory catalog; exact model-year basis'],
  ['boat:Lund | Tyee II 1650','1994 documented Tyee II 1650 generation',1991,1996,'1994 Lund factory catalog; exact model specification basis']
]) {
  const r=get(id); const g=generation({id:`${r.id}:gen:${start}`,label,startYear:start,endYear:end,status:'factory-generation',basis,sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
  finishSingle(r,g);
  log(r,'Retained and generation-coded','Factory generation',basis,'Existing factory-backed split retained; no incompatible Tyee propulsion or length data inherited.');
}
{
  const r=get('boat:Lund | Tyee 1850 I/O / ITS (older generation)');
  setDetails(r,{'Model Years / Era':'1990 exact I/O specification basis; other I/O/ITS years require separate drivetrain verification','Length':'18\'0"','Beam':'89" (7.42 ft published)','Dry Hull Weight':'1,575 lb published 1990 I/O basis','Max HP':'MerCruiser 4.3 / 190-hp package basis; not comparable to outboard rating','Notes':'This record is narrowed to a documented 1990 I/O package. Do not use it for later ITS or materially heavier sterndrive generations.'});
  const g=generation({id:`${r.id}:gen:1990`,label:'1990 Tyee 1850 I/O package',startYear:1990,endYear:1990,status:'secondary-verified',basis:'1990 factory catalog identity with exact-package specification reference',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:[]});
  finishSingle(r,g,{subtitle:'1990 exact I/O package basis',lowPrice:null,highPrice:null,valueEras:[],warning:'Sterndrive package, engine and trailer weight must be verified from the actual listing. This record no longer represents every older I/O or ITS Tyee.'});
  log(r,'Narrowed','Secondary verified','1990 catalog and exact-package reference','Removed the unsupported broad claim that the represented hull itself exceeds 2,300 lb.');
}
{
  const r=get('boat:Lund | Tyee 1850 outboard / older 18\' Tyee outboard');
  setDetails(r,{'Model Years / Era':'1990 exact outboard specification basis; later 1850 outboard generations require separate exact-year matching','Length':'18\'0"','Beam':'89"','Dry Hull Weight':'1,525 lb','Max HP':'Verify 1990 capacity plate','Notes':'This record now represents the documented 1990 outboard boat only. It does not stand in for every late-1980s through 2000s 18-foot Tyee.'});
  const g=generation({id:`${r.id}:gen:1990`,label:'1990 Tyee 1850 outboard hull',startYear:1990,endYear:1990,status:'secondary-verified',basis:'1990 factory catalog identity and exact-model specification reference',sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r,['1990s'])});
  finishSingle(r,g,{subtitle:'1990 exact outboard specification basis',lowPrice:3500,highPrice:6500,valueEras:(r.valueEras||[]).filter(e=>e.label==='1990s'),warning:'A later 1850 outboard may be wider, longer or heavier. Match the exact model year rather than selecting this 1990 basis by name alone.'});
  log(r,'Narrowed','Secondary verified','1990 catalog and exact-model reference','Removed the false late-1980s–2000s blended hull range.');
}
{
  const r=get('boat:Lund | Tyee 1875 Sport (current generation)');
  setDetails(r,{'Model Years / Era':'2021–present documented current generation','Length':'18\'10"','Beam':'98"','Chine / Bottom Width':'86.25"','Dry Hull Weight':'1,760 lb','Cockpit / Interior Depth':'27"','Transom Height':'25"','Max HP':'200','Persons':'8','Capacity Weight':'1,950 lb','Fuel Capacity':'40 gal','Bottom Thickness':'0.100"','Side / Freeboard Thickness':'0.080"','Construction':'Riveted IPS aluminum; double-plated bow 0.180"'});
  const g=generation({id:`${r.id}:gen:2021`,label:'2021-present 1875 Tyee hull',startYear:2021,endYear:null,status:'factory-generation',basis:'2021 Lund Red Book and current Lund factory model/configurator agree on principal specifications',sourceUrl:'https://www.lundboats.com/families/tyee/1875-tyee.html',specs:specsFromRecord(r),eras:[pendingEra(r,'2020s',2020,2029)]});
  for(const v of Object.values(g.specs))v.confidence='factory-generation';
  finishSingle(r,g,{subtitle:'2021–present documented current factory generation',sourceUrl:g.sourceUrl,lowPrice:null,highPrice:null,valueEras:[]});
  log(r,'Completed current generation','Factory generation','2021 Red Book and current Lund factory page','Filled the missing 1,760-lb hull weight and verified the current generation remained dimensionally consistent.');
}

// Ensure every Lund app record received an explicit disposition and a generation.
const lund=boats.filter(b=>b.manufacturer==='Lund');
for (const r of lund) {
  if (!Array.isArray(r.designGenerations) || !r.designGenerations.length) {
    const g=generation({id:`${r.id}:gen:catalog`,label:`${detail(r,'Model Years / Era') || r.subtitle} specification basis`,status:'catalog-representative',basis:`Existing cited catalog basis: ${r.sourceUrl || 'source retained in record'}`,sourceUrl:r.sourceUrl,specs:specsFromRecord(r),eras:existingEras(r)});
    r.designGenerations=[g];
    r.generationWarning='This app model has one documented specification basis. The record does not claim that every advertised production year was physically unchanged.';
    log(r,'Generation-coded without speculative expansion','Catalog representative',r.sourceUrl || 'Existing cited source','No contradictory exact-generation evidence found in the focused app-model pass; displayed basis remains explicitly limited.');
  }
}

if (audit.length !== lund.length) throw new Error(`Audit disposition count ${audit.length} does not match Lund count ${lund.length}`);
const duplicateAudit = audit.map(x=>x.model).filter((x,i,a)=>a.indexOf(x)!==i);
if (duplicateAudit.length) throw new Error(`Duplicate audit dispositions: ${duplicateAudit.join(', ')}`);

fs.writeFileSync(BOATS_PATH, `window.BOATBUILDER_BOATS = ${JSON.stringify(boats,null,2)};\n`);

const rows=audit.sort((a,b)=>a.model.localeCompare(b.model)).map(x=>`| ${x.model.replaceAll('|','\\|')} | ${x.disposition} | ${x.status} | ${x.basis.replaceAll('|','\\|')} | ${x.note.replaceAll('|','\\|')} |`).join('\n');
const splitCount=lund.filter(r=>r.designGenerations.length>1).length;
const exactCount=lund.filter(r=>r.designGenerations.every(g=>['factory-exact','factory-generation','secondary-verified'].includes(g.status))).length;
const md=`# Lund app-model audit — 2026-07-28\n\n## Scope\n\nThis is a focused audit of the **${lund.length} Lund records already present in BoatBuilder**. It is not a claim that every Lund model ever built has been cataloged. No new off-scope Lund families were added.\n\n## Result\n\n- ${lund.length} of ${lund.length} app records have an explicit audit disposition.\n- ${splitCount} records now expose more than one documented physical specification set.\n- ${exactCount} records use only factory-exact, factory-generation, or corroborated secondary-verification statuses.\n- Broad records were narrowed when the evidence did not support one specification across the advertised span.\n- Current Impact XS, Fisherman 1875, Explorer 1700 and other similarly named but off-record boats were not merged into historical app records.\n- Unknown transition years remain visibly unassigned rather than being invented.\n\n## Dispositions\n\n| App model | Disposition | Status | Evidence basis | Result |\n|---|---|---|---|---|\n${rows}\n\n## Completion rule\n\nThe Lund **app-model scope** is complete because every Lund record currently in BoatBuilder has a documented disposition and canonical generation metadata. This does not constitute a full all-model Lund manufacturer audit.\n`;
fs.mkdirSync('research/audits',{recursive:true});
fs.writeFileSync(AUDIT_PATH,md);
console.log(`Updated ${lund.length} Lund records; ${splitCount} multi-generation records; wrote ${AUDIT_PATH}`);
