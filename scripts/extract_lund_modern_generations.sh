#!/usr/bin/env bash
set -euo pipefail
root="research/sources/lund-modern-generations"
work="/tmp/lund-modern-generations"
mkdir -p "$root" "$work"
printf 'year\turl\tstatus\ttext_bytes\n' > "$root/manifest.tsv"
for year in $(seq 2012 2026); do
  url="https://library.rvusa.com/brochure/${year}-Lund.pdf"
  pdf="$work/$year.pdf"
  txt="$root/$year.txt"
  status=failed
  bytes=0
  if curl -fL --retry 3 --connect-timeout 20 --max-time 300 -A 'Mozilla/5.0' "$url" -o "$pdf"; then
    pdftotext -layout "$pdf" "$txt" || true
    bytes=$(stat -c%s "$txt" 2>/dev/null || echo 0)
    [[ "$bytes" -gt 500 ]] && status=ok || status=empty
  fi
  printf '%s\t%s\t%s\t%s\n' "$year" "$url" "$status" "$bytes" >> "$root/manifest.tsv"
done
python3 - <<'PY'
from pathlib import Path
import re,csv,json
root=Path('research/sources/lund-modern-generations')
patterns={
 'Adventure 1675':r'\b1675\s+ADVENTURE\b',
 'Adventure 1775':r'\b1775\s+ADVENTURE\b',
 'Alaskan 1800':r'\b1800\s+ALASKAN\b',
 'Alaskan 1875':r'\b1875\s+ALASKAN\b',
 'Crossover 1675':r'\b1675\s+CROSSOVER\b',
 'Crossover 1775':r'\b1775\s+CROSSOVER\b',
 'Crossover 1875':r'\b1875\s+CROSSOVER\b',
 'Impact 1675':r'\b1675\s+IMPACT\b',
 'Impact 1775':r'\b1775\s+IMPACT\b',
 'Impact 1875':r'\b1875\s+IMPACT\b',
 'Pro-V 1775':r'\b1775\s+PRO[- ]?V\b|\bPRO[- ]?V\s+1775\b',
 'Pro-V 1800':r'\b1800\s+PRO[- ]?V\b|\bPRO[- ]?V\s+1800\b',
 'Pro-V 1875':r'\b1875\s+PRO[- ]?V\b|\bPRO[- ]?V\s+1875\b',
 'Sport Angler 1800':r'\b1800\s+SPORT\s+ANGLER\b',
 'Tyee 1700':r'\b1700\s+TYEE\b',
 'Tyee 1750':r'\b1750\s+TYEE\b',
 'Tyee 1850':r'\b1850\s+TYEE\b',
 'Tyee 1875':r'\b1875\s+TYEE\b',
}
compiled={k:re.compile(v,re.I) for k,v in patterns.items()}
fields={
 'length':re.compile(r'Boat\s+Length\s+([^\n]{1,20})',re.I),
 'beam_chine':re.compile(r'Beam(?:/Chine)?\s+([^\n]{1,30})',re.I),
 'weight':re.compile(r'Boat\s+Weight\s+([^\n]{1,25})',re.I),
 'hp':re.compile(r'(?:Min/Max\s+HP|Max\s+HP)\s+([^\n]{1,25})',re.I),
 'fuel':re.compile(r'(\d+(?:\.\d+)?)\s+Gallon\s+Fuel\s+Tank',re.I),
 'cockpit':re.compile(r'Cockpit\s+Depth\s+([^\n]{1,20})',re.I),
 'transom':re.compile(r'Transom\s+Height\s+([^\n]{1,20})',re.I),
}
rows=[]; extracts=[]
for p in sorted(root.glob('20[12][0-9].txt'))+sorted(root.glob('202[0-6].txt')):
    year=int(p.stem); lines=p.read_text(errors='replace').splitlines()
    for model,rx in compiled.items():
        hits=[i for i,l in enumerate(lines) if rx.search(l)]
        if not hits: continue
        # Prefer occurrence followed by a specification table in the next 180 lines.
        best=None
        for i in hits:
            a=max(0,i-5); b=min(len(lines),i+190); block='\n'.join(lines[a:b])
            score=sum(bool(r.search(block)) for r in fields.values())
            cand=(score,i,a,b,block)
            if best is None or cand[0]>best[0]: best=cand
        score,i,a,b,block=best
        row={'year':year,'model':model,'hit_count':len(hits),'spec_score':score}
        for name,frx in fields.items():
            m=frx.search(block); row[name]=(' '.join(m.group(1).split()) if m else '')
        rows.append(row)
        extracts += [f'## {year} · {model}', '', f'Selected source lines {a+1}-{b}; specification score {score}.', '', '```text', *lines[a:b], '```', '']
with open('research/sources/lund-modern-generation-index-2012-2026.tsv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['year','model','hit_count','spec_score',*fields],delimiter='\t')
    w.writeheader();w.writerows(rows)
Path('research/sources/lund-modern-generation-extracts-2012-2026.md').write_text('# Lund modern generation extracts, 2012-2026\n\n'+ '\n'.join(extracts)+'\n')
PY
