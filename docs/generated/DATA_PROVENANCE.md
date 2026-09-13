# DATA_PROVENANCE — proveniência dos números clínicos

> **Gerado automaticamente** em 2026-09-13 por `scripts/generate-data-provenance.mjs`. NÃO editar à mão.
> Origem: `count(*)` direto no Supabase + breakdown por `pet_profiles.is_demo` / `is_synthetic`.

## Knowledge Graph

| Tabela | Linhas | Status |
|---|---:|---|
| `hierarchical_edges` | 43755 | fonte real do grafo (Supabase) |
| `medical_knowledge_graph` | 0 | **legado vazio** — não usar como métrica |
| `studies` | 60 | PDFs ingeridos |
| `nutraceuticals` | 30 | catálogo base |

### Triplet bank (`triplet_extractions`)

| Curation status | Linhas |
|---|---:|
| approved | 4200 |
| pending | 1268 |
| rejected | 10 |

## Dados clínicos — split por proveniência

> **Regra:** `synthetic_cohort` = gerado pelo prompt `generate_synthetic_cohort` (Gemini). **NÃO é Real-World Data**. Calibrado em medicina real, mas não observado em pacientes vivos.

| Tabela | Total | Real (vet inseriu) | Demo (seed `is_demo`) | Sintético (cohort) |
|---|---:|---:|---:|---:|
| pet_profiles | 793 | 3 | 0 | 790 |
| pet_exams | 1318 | 6 | 0 | 1312 |
| pet_consultations | 1232 | 0 | 0 | 1232 |
| pet_medications | 718 | 0 | 0 | 718 |
| pet_conditions | 1315 | 2 | 0 | 1313 |

## Como atualizar

```bash
npm run docs:provenance   # regenera este arquivo
npm run docs:all          # regenera arquitetura + prompts + proveniência
```

Qualquer narrativa que cite estes números (ex.: relatório `generate-audit`, página "Sobre", investor deck) DEVE separar real vs demo vs sintético. Ver `audit_base_system_{pt,en}` em `supabase/functions/_shared/system-prompts.ts` para a regra aplicada ao auditor.
