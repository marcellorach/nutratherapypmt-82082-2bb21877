# Papers — Organização

Três pastas, três propósitos distintos. **Não misturar.**

| Pasta | Conteúdo | Entra no pipeline? |
|---|---|---|
| `architecture/` | Papers fundacionais do KG (Hetionet, TxGNN, OptimusKG, MEDEA, OMIA, MeSH, ChEBI, MONDO, PrimeKG) | ❌ Leitura humana — fundamenta decisões arquiteturais |
| `clinical-evidence/` | Papers de evidência nutracêutico × doença | ✅ Upload pela tab **Documentos Científicos** do admin |
| `negative-controls/` | Papers que comprovam ausência/falha de efeito | ✅ Upload + marcar `evidence_polarity='negative'` |

## Como baixar os 9 arquiteturais

```bash
bash scripts/download-architecture-papers.sh
```

PDFs grandes — não comitar no git.
