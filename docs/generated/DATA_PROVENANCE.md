# DATA_PROVENANCE — proveniência dos números clínicos

> **Gerado automaticamente** em 2026-06-05 por `scripts/generate-data-provenance.mjs`. NÃO editar à mão.
> Origem: `count(*)` direto no Supabase + breakdown por `pet_profiles.is_demo` / `is_synthetic`.

## Knowledge Graph

| Tabela | Linhas | Status |
|---|---:|---|
| `hierarchical_edges` | 38643 | fonte real do grafo (Supabase) |
| `medical_knowledge_graph` | 0 | **legado vazio** — não usar como métrica |
| `studies` | 59 | PDFs ingeridos |
| `nutraceuticals` | 30 | catálogo base |

### Triplet bank (`triplet_extractions`)

| Curation status | Linhas |
|---|---:|
| approved | 3924 |
| pending | 851 |
| rejected | 10 |

## Dados clínicos — split por proveniência

> **Regra:** `synthetic_cohort` = gerado pelo prompt `generate_synthetic_cohort` (Gemini). **NÃO é Real-World Data**. Calibrado em medicina real, mas não observado em pacientes vivos.

| Tabela | Total | Real (vet inseriu) | Demo (seed `is_demo`) | Sintético (cohort) |
|---|---:|---:|---:|---:|
| pet_profiles | 728 | 3 | 5 | 720 |
| pet_exams | 1234 | 6 | 17 | 1211 |
| pet_consultations | 1150 | 0 | 15 | 1135 |
| pet_medications | 633 | 0 | 5 | 628 |
| pet_conditions | 1232 | 2 | 14 | 1216 |

## Como atualizar

```bash
npm run docs:provenance   # regenera este arquivo
npm run docs:all          # regenera arquitetura + prompts + proveniência
```

Qualquer narrativa que cite estes números (ex.: relatório `generate-audit`, página "Sobre", investor deck) DEVE separar real vs demo vs sintético. Ver `audit_base_system_{pt,en}` em `supabase/functions/_shared/system-prompts.ts` para a regra aplicada ao auditor.
