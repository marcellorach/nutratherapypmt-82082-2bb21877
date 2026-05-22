#!/usr/bin/env bash
# Baixa os 9 papers arquiteturais que fundamentam o KG.
# Uso (na raiz do projeto): bash scripts/download-architecture-papers.sh
# Requer: curl. Roda em macOS e Linux.

set -u
DEST="docs/papers/architecture"
mkdir -p "$DEST"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) senex-ai-research/1.0"

download() {
  local name="$1" url="$2" out="$DEST/$1.pdf"
  if [ -f "$out" ] && [ -s "$out" ]; then
    echo "  ✓ já existe: $name.pdf"
    return
  fi
  echo "  ↓ $name"
  if curl -sL -A "$UA" --max-time 90 -o "$out" "$url"; then
    if head -c 4 "$out" 2>/dev/null | grep -q '%PDF'; then
      echo "    ok ($(du -h "$out" | cut -f1))"
    else
      mv "$out" "$DEST/$name.html" 2>/dev/null
      echo "    ⚠ não é PDF (paywall/redirect). Salvo como $name.html — baixe manualmente via DOI."
    fi
  else
    echo "    ✗ falha de rede"
    rm -f "$out"
  fi
}

echo "Baixando 9 papers arquiteturais → $DEST/"
echo

download "01-himmelstein-2017-hetionet"   "https://elifesciences.org/articles/26726.pdf"
download "02-huang-2024-txgnn"            "https://www.nature.com/articles/s41591-024-03233-x.pdf"
download "03-optimuskg"                   "https://arxiv.org/pdf/2410.13456.pdf"
download "04-medea-agentic-kg"            "https://arxiv.org/pdf/2502.13110.pdf"
download "05-nicholas-2025-omia"          "https://academic.oup.com/nar/article-pdf/doi/10.1093/nar/gkae987/60154869/gkae987.pdf"

cat > "$DEST/06-mesh-overview.txt" <<TXT
MeSH não tem PDF único — é um vocabulário mantido pela NLM.
Home:     https://www.nlm.nih.gov/mesh/meshhome.html
Tutorial: https://www.nlm.nih.gov/bsd/disted/meshtutorial/index.html
Download dos dumps anuais: https://www.nlm.nih.gov/databases/download/mesh.html
TXT
echo "  ✓ MeSH: referência salva em 06-mesh-overview.txt"

download "07-hastings-2016-chebi"         "https://academic.oup.com/nar/article-pdf/44/D1/D1214/9482052/gkv1031.pdf"
download "08-vasilevsky-2022-mondo"       "https://www.medrxiv.org/content/10.1101/2022.04.13.22273750v3.full.pdf"
download "09-chandak-2023-primekg"        "https://www.nature.com/articles/s41597-023-01960-3.pdf"

echo
echo "✅ Concluído. Verifique $DEST/"
echo "   Arquivos .html = paywall — baixe via institucional usando o DOI no README."
