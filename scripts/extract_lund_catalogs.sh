#!/usr/bin/env bash
set -euo pipefail

mkdir -p research/sources/lund-pdf-text /tmp/lund-pdfs

cat > /tmp/lund-sources.tsv <<'EOF'
1994	https://media.rvusa.com/library/1994.pdf
1997	https://www.lundboats.com/content/dam/lund/technical/documents/newLN-1997LundCatalog.pdf
1998	https://www.lundboats.com/content/dam/lund/technical/documents/1998-Lund-Catalog.pdf
2002	https://www.lundboats.com/content/dam/lund/technical/documents/2002-Lund-Catalog.pdf
2003	https://www.lundboats.com/content/dam/lund/technical/documents/2003-Lund-Catalog.pdf
2005	https://www.lundboats.com/content/dam/lund/technical/documents/2005-Lund-Catalog.pdf
2008	https://library.rvusa.com/brochure/2008.pdf
2014	https://library.rvusa.com/brochure/2014-Lund.pdf
2021	https://www.lundboats.com/content/dam/lund/general/2021-Lund-Redbook.pdf
2024	https://www.lundboats.com/content/dam/lund/technical/documents/23_ABG_LN_MY2024Catalog_v8b_digital3.pdf
EOF

manifest="research/sources/lund-pdf-text/manifest.tsv"
printf 'year\turl\tstatus\tbytes\tpages\n' > "$manifest"

while IFS=$'\t' read -r year url; do
  pdf="/tmp/lund-pdfs/${year}.pdf"
  txt="research/sources/lund-pdf-text/${year}.txt"
  status="failed"
  bytes=0
  pages=0
  if curl -fL --retry 3 --connect-timeout 20 --max-time 240 -A 'Mozilla/5.0' "$url" -o "$pdf"; then
    bytes=$(stat -c%s "$pdf")
    if file "$pdf" | grep -qi pdf; then
      pdftotext -layout "$pdf" "$txt"
      pages=$(pdfinfo "$pdf" 2>/dev/null | awk '/^Pages:/ {print $2}')
      status="ok"
    else
      status="not-pdf"
      rm -f "$pdf"
    fi
  fi
  printf '%s\t%s\t%s\t%s\t%s\n' "$year" "$url" "$status" "$bytes" "$pages" >> "$manifest"
done < /tmp/lund-sources.tsv

python3 - <<'PY'
from pathlib import Path
import re

root = Path('research/sources/lund-pdf-text')
targets = [
    '1600 Angler','1600 Explorer','1600 Pro Sport','Adventure','Alaskan',
    'Angler Sport','Crossover','Explorer Sport','Fisherman','Impact',
    'Mr Pike','Pro-V 1775','1775 Pro-V','Pro-V 1800','1800 Pro-V',
    'Rebel XL','Tyee 1700','1700 Tyee','Tyee 1750','1750 Tyee',
    'Tyee 1850','1850 Tyee','Tyee II','Tyee 5.3'
]
lines_out = ['# Lund factory-catalog text extracts', '',
             'Generated from the PDF sources listed in `manifest.tsv`. Context is mechanically extracted for audit evidence; the canonical boat records remain the production source of truth.', '']
for path in sorted(root.glob('*.txt')):
    year = path.stem
    text = path.read_text(errors='replace')
    lines = text.splitlines()
    hits=[]
    for i,line in enumerate(lines):
        if any(re.search(re.escape(t), line, re.I) for t in targets):
            hits.append(i)
    merged=[]
    for i in hits:
        a=max(0,i-5); b=min(len(lines),i+12)
        if merged and a <= merged[-1][1] + 3:
            merged[-1]=(merged[-1][0],max(merged[-1][1],b))
        else:
            merged.append((a,b))
    lines_out += [f'## {year}', '']
    if not merged:
        lines_out += ['No target-family text match found.', '']
        continue
    for n,(a,b) in enumerate(merged,1):
        lines_out += [f'### Extract {n} (text lines {a+1}-{b})', '', '```text']
        lines_out += lines[a:b]
        lines_out += ['```','']
Path('research/sources/lund-catalog-target-extracts-2026-07-28.md').write_text('\n'.join(lines_out)+'\n')
PY
