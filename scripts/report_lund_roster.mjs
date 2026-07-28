import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('data/boats.js','utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'data/boats.js' });
const boats = sandbox.window.BOATBUILDER_BOATS;
const lund = boats.filter(b => b.manufacturer === 'Lund').map(b => ({
  id: b.id,
  model: b.model,
  subtitle: b.subtitle,
  badge: b.badge,
  lowPrice: b.lowPrice,
  highPrice: b.highPrice,
  sourceUrl: b.sourceUrl,
  modelYears: (b.details || []).find(d => d.label === 'Model Years / Era')?.value || null,
  layout: (b.details || []).find(d => d.label === 'Layout')?.value || null,
  length: (b.details || []).find(d => d.label === 'Length')?.value || null,
  beam: (b.details || []).find(d => d.label === 'Beam')?.value || null,
  weight: (b.details || []).find(d => d.label === 'Dry Hull Weight')?.value || null,
  maxHp: (b.details || []).find(d => d.label === 'Max HP')?.value || null,
  generations: b.designGenerations || [],
  valueEras: b.valueEras || []
}));
fs.mkdirSync('research/audits', { recursive: true });
fs.writeFileSync('research/audits/lund-current-canonical-roster-2026-07-28.json', JSON.stringify({
  generated: '2026-07-28',
  count: lund.length,
  records: lund
}, null, 2) + '\n');
console.log(`Wrote ${lund.length} Lund records`);
