#!/usr/bin/env bash
set -euo pipefail
mkdir -p research/sources
out=research/sources/lund-catalog-url-discovery-2026-07-28.tsv
printf 'year\turl\thttp\tcontent_type\tcontent_length\n' > "$out"
check_url() {
  local year="$1" url="$2" hdr code ctype clen
  hdr=$(mktemp)
  code=$(curl -sSIL --retry 2 --connect-timeout 12 --max-time 45 -A 'Mozilla/5.0' -D "$hdr" -o /dev/null -w '%{http_code}' "$url" || true)
  ctype=$(awk 'BEGIN{IGNORECASE=1}/^content-type:/{v=$0}END{sub(/^[^:]*:[[:space:]]*/,"",v);gsub(/\r/,"",v);print v}' "$hdr")
  clen=$(awk 'BEGIN{IGNORECASE=1}/^content-length:/{v=$0}END{sub(/^[^:]*:[[:space:]]*/,"",v);gsub(/\r/,"",v);print v}' "$hdr")
  rm -f "$hdr"
  if [[ "$code" == "200" && ( "$ctype" == *pdf* || "$url" == *.pdf ) ]]; then
    printf '%s\t%s\t%s\t%s\t%s\n' "$year" "$url" "$code" "$ctype" "$clen" >> "$out"
  fi
}
export -f check_url
for year in $(seq 1980 2026); do
  urls=(
    "https://www.lundboats.com/content/dam/lund/technical/documents/${year}-Lund-Catalog.pdf"
    "https://www.lundboats.com/content/dam/lund/technical/documents/${year}-lund-catalog.pdf"
    "https://www.lundboats.com/content/dam/lund/technical/documents/${year}_Lund_Catalog.pdf"
    "https://www.lundboats.com/content/dam/lund/technical/documents/newLN-${year}LundCatalog.pdf"
    "https://library.rvusa.com/brochure/${year}.pdf"
    "https://library.rvusa.com/brochure/${year}-Lund.pdf"
    "https://media.rvusa.com/library/${year}.pdf"
  )
  for url in "${urls[@]}"; do check_url "$year" "$url"; done
done
sort -u -o "$out" "$out"
