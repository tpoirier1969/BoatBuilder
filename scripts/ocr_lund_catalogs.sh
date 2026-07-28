#!/usr/bin/env bash
set -euo pipefail
mkdir -p research/sources/lund-ocr /tmp/lund-ocr
cat > /tmp/lund-ocr-sources.tsv <<'EOF'
1994	https://media.rvusa.com/library/1994.pdf
1997	https://www.lundboats.com/content/dam/lund/technical/documents/newLN-1997LundCatalog.pdf
1998	https://www.lundboats.com/content/dam/lund/technical/documents/1998-Lund-Catalog.pdf
2002	https://www.lundboats.com/content/dam/lund/technical/documents/2002-Lund-Catalog.pdf
2003	https://www.lundboats.com/content/dam/lund/technical/documents/2003-Lund-Catalog.pdf
2005	https://www.lundboats.com/content/dam/lund/technical/documents/2005-Lund-Catalog.pdf
2008	https://library.rvusa.com/brochure/2008.pdf
EOF
printf 'year\turl\tstatus\tpages\n' > research/sources/lund-ocr/manifest.tsv
while IFS=$'\t' read -r year url; do
  work="/tmp/lund-ocr/$year"
  mkdir -p "$work/pages" "$work/text"
  pdf="$work/catalog.pdf"
  status=failed
  pages=0
  if curl -fL --retry 3 --connect-timeout 20 --max-time 300 -A 'Mozilla/5.0' "$url" -o "$pdf"; then
    pages=$(pdfinfo "$pdf" 2>/dev/null | awk '/^Pages:/ {print $2}')
    pdftoppm -jpeg -r 135 -jpegopt quality=72 "$pdf" "$work/pages/page" >/dev/null 2>&1
    find "$work/pages" -name '*.jpg' -print0 | xargs -0 -n1 -P4 bash -c '
      img="$1"; base=$(basename "$img" .jpg); dir=$(dirname "$(dirname "$img")")
      tesseract "$img" "$dir/text/$base" -l eng --psm 6 >/dev/null 2>&1 || true
    ' _
    cat "$work"/text/*.txt > "research/sources/lund-ocr/$year.txt"
    status=ok
  fi
  printf '%s\t%s\t%s\t%s\n' "$year" "$url" "$status" "$pages" >> research/sources/lund-ocr/manifest.tsv
done < /tmp/lund-ocr-sources.tsv
python3 - <<'PY'
from pathlib import Path
import re
root=Path('research/sources/lund-ocr')
pat=re.compile(r'(mr\.?\s*pike|pro\s*[- ]?\s*v|tyee|alaskan|explorer|fisherman|impact|crossover|angler|rebel)',re.I)
out=['# OCR extracts from scanned Lund factory catalogs','',
     'OCR was used only because the archived PDFs did not contain usable embedded text. Each extract retains surrounding lines for roster and specification reconciliation.','']
for p in sorted(root.glob('[0-9][0-9][0-9][0-9].txt')):
    lines=p.read_text(errors='replace').splitlines()
    hits=[i for i,l in enumerate(lines) if pat.search(l)]
    spans=[]
    for i in hits:
        a=max(0,i-8); b=min(len(lines),i+18)
        if spans and a<=spans[-1][1]+3: spans[-1]=(spans[-1][0],max(spans[-1][1],b))
        else: spans.append((a,b))
    out += [f'## {p.stem}','']
    for n,(a,b) in enumerate(spans,1):
        out += [f'### Extract {n} (OCR lines {a+1}-{b})','','```text',*lines[a:b],'```','']
Path('research/sources/lund-ocr-target-extracts-2026-07-28.md').write_text('\n'.join(out)+'\n')
PY
