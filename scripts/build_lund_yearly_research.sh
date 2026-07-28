#!/usr/bin/env bash
set -euo pipefail

root="research/sources/lund-yearly-text"
work="/tmp/lund-yearly"
mkdir -p "$root" "$work"
printf 'year\turl\tmethod\tstatus\tpages\ttext_bytes\n' > "$root/manifest.tsv"

url_for_year() {
  local year="$1"
  if (( year <= 2010 )); then
    printf 'https://library.rvusa.com/brochure/%s.pdf' "$year"
  elif (( year == 2011 )); then
    printf ''
  else
    printf 'https://library.rvusa.com/brochure/%s-Lund.pdf' "$year"
  fi
}

extract_one() {
  local year="$1" url method pdf out dir pages status bytes
  url=$(url_for_year "$year")
  [[ -n "$url" ]] || return 0
  dir="$work/$year"
  mkdir -p "$dir"
  pdf="$dir/catalog.pdf"
  out="$root/$year.txt"
  status=failed
  pages=0
  method=pdftotext
  if curl -fL --retry 3 --connect-timeout 20 --max-time 300 -A 'Mozilla/5.0' "$url" -o "$pdf"; then
    pages=$(pdfinfo "$pdf" 2>/dev/null | awk '/^Pages:/ {print $2}')
    pdftotext -layout "$pdf" "$out" || true
    bytes=$(stat -c%s "$out" 2>/dev/null || echo 0)
    # Older catalogs are scans. OCR when embedded text is absent or tiny.
    if (( bytes < 5000 )); then
      method=ocr
      mkdir -p "$dir/pages" "$dir/text"
      pdftoppm -jpeg -r 120 -jpegopt quality=68 "$pdf" "$dir/pages/page" >/dev/null 2>&1
      find "$dir/pages" -name '*.jpg' -print0 | xargs -0 -n1 -P4 bash -c '
        img="$1"; base=$(basename "$img" .jpg); parent=$(dirname "$(dirname "$img")")
        tesseract "$img" "$parent/text/$base" -l eng --psm 6 >/dev/null 2>&1 || true
      ' _
      cat "$dir"/text/*.txt > "$out"
      bytes=$(stat -c%s "$out" 2>/dev/null || echo 0)
    fi
    if (( bytes > 500 )); then status=ok; else status=empty; fi
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$year" "$url" "$method" "$status" "$pages" "${bytes:-0}" >> "$root/manifest.tsv"
  rm -rf "$dir"
}
export -f url_for_year extract_one
export root work

# Sequential downloads avoid hammering the archives; OCR itself is parallelized per catalog.
for year in $(seq 1980 2010) $(seq 2012 2026); do
  extract_one "$year"
done

python3 - <<'PY'
from pathlib import Path
import re, csv, json
root=Path('research/sources/lund-yearly-text')
families={
 'Angler': r'\b(?:1600|1650)?\s*Angler(?:\s+Sport)?\b|\bAngler\s+(?:1600|1650|Sport)\b',
 'Adventure': r'\b(?:1600|1650|1675|1775)?\s*Adventure(?:\s+Sport)?\b|\bAdventure\s+(?:1600|1650|1675|1775|Sport)\b',
 'Alaskan': r'\b(?:1600|1650|1675|1800|1875|2000)?\s*Alaskan(?:\s+Sport)?\b|\bAlaskan\s+(?:1600|1650|1675|1800|1875|2000|Sport)\b',
 'Crossover': r'\b(?:1650|1675|1750|1775|1850|1875)?\s*Crossover(?:\s+XS)?\b|\bCrossover\s+(?:XS|1650|1675|1750|1775|1850|1875)\b',
 'Explorer': r'\b(?:1600|1650|1700|1725|1800|1825)?\s*Explorer(?:\s+Sport)?\b|\bExplorer\s+(?:1600|1650|1700|1725|1800|1825|Sport)\b',
 'Fisherman': r'\b(?:1650|1700|1750|1800|1850|1875)?\s*(?:Pro\s+)?Fisherman\b|\bFisherman\s+(?:1650|1700|1750|1800|1850|1875)\b',
 'Impact': r'\b(?:1675|1775|1875|2025)?\s*Impact(?:\s+XS)?(?:\s+Sport)?\b|\bImpact\s+(?:XS|1675|1775|1875|2025|Sport)\b',
 'Mr Pike': r'\bMr\.?\s*Pike(?:\s+17)?\b',
 'Pro-V': r'\b(?:1775|1800|1875)?\s*Pro\s*[- ]?\s*V(?:\s+(?:SE|IFS|Sport|DLX))?\b|\bPro\s*[- ]?\s*V\s+(?:1775|1800|1875|SE|IFS|Sport|DLX)\b',
 'Pro Sport': r'\b(?:1600|1700|1800)?\s*Pro\s+Sport\b',
 'Rebel XL': r'\b(?:1650|1750|1800)?\s*Rebel\s+XL(?:\s+Sport)?\b|\bRebel\s+XL\s+(?:1650|1750|1800|Sport)\b',
 'Tyee': r'\b(?:1650|1700|1750|1800|1850|1875|1950|5\.3)?\s*Tyee(?:\s+(?:II|Gran\s+Sport|GS|Magnum|IFS|ITS|Sport))?\b|\bTyee\s+(?:1650|1700|1750|1800|1850|1875|1950|5\.3|II|Gran\s+Sport|GS|Magnum|IFS|ITS|Sport)\b',
}
compiled={k:re.compile(v,re.I) for k,v in families.items()}
index=[]
extract=[]
for p in sorted(root.glob('[0-9][0-9][0-9][0-9].txt')):
    year=int(p.stem)
    lines=p.read_text(errors='replace').splitlines()
    for family,rx in compiled.items():
        hits=[]
        labels=[]
        for i,line in enumerate(lines):
            if rx.search(line):
                hits.append(i)
                clean=' '.join(line.split())
                if clean and clean not in labels: labels.append(clean[:240])
        if hits:
            index.append({'year':year,'family':family,'hit_count':len(hits),'sample_labels':' | '.join(labels[:8])})
            spans=[]
            for i in hits:
                a=max(0,i-7); b=min(len(lines),i+18)
                if spans and a<=spans[-1][1]+4: spans[-1]=(spans[-1][0],max(spans[-1][1],b))
                else: spans.append((a,b))
            for n,(a,b) in enumerate(spans[:12],1):
                extract += [f'## {year} · {family} · extract {n}', '', f'Source text lines {a+1}-{b}.', '', '```text', *lines[a:b], '```', '']
with open('research/sources/lund-target-family-index-1980-2026.tsv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['year','family','hit_count','sample_labels'],delimiter='\t')
    w.writeheader(); w.writerows(index)
Path('research/sources/lund-target-family-extracts-1980-2026.md').write_text(
    '# Lund target-family extracts, 1980-2026\n\n'+
    'Factory-catalog text/OCR context for the aluminum fishing-boat families relevant to the BoatBuilder scope. OCR errors are evidence-search aids, not silently corrected factory specifications.\n\n'+
    '\n'.join(extract)+'\n')
# Compact presence matrix.
years=sorted({r['year'] for r in index})
rows=[]
for family in families:
    present=[r['year'] for r in index if r['family']==family]
    rows.append({'family':family,'years_detected':present,'first':min(present) if present else None,'last':max(present) if present else None})
Path('research/sources/lund-target-family-presence-1980-2026.json').write_text(json.dumps(rows,indent=2)+'\n')
PY
