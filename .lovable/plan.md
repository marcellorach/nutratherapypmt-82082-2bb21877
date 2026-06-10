## Passo 1 — Validação ponta-a-ponta (4 estudos)

Plano já aprovado em iterações anteriores. Resumo executável para acionar build mode.

### Ordem de execução

1. **Congelar baselines** (antes de qualquer reprocessamento):
   - Spermine → `/mnt/documents/yield_test_baseline_spermine.json`
   - CoQ10 → `/mnt/documents/yield_test_baseline_coq10.json`
   - Conteúdo: `study_extractions.extracted_data` + `processed_studies.analysis_data` + `processed_studies.ingestion_stages` + `kanban_status` no estado atual.
   - Polyphenols já tem baseline em `/mnt/documents/yield_test_baseline.json` (não reescrever).
   - Position-paper curto: snapshot leve do estado atual (referência de "não deve degradar").

2. **Reprocessar 4 estudos sequencial, 1 por vez**:
   - Spermine → CoQ10 → Polyphenols → position-paper curto.
   - Pipeline por estudo: `gemini-file-search` → aguardar `kanban_status` estabilizar → `extract-study-entities` → aguardar estabilizar.
   - **Pular `vectorize-study`** nos 4 (não afeta yield; evita orphan chunks).
   - **NÃO rodar `generate-triplets`**.

3. **Coletar telemetria por estudo**:
   - `file_search`: `status`, `reason`, `chars_call1`, `truncation_suspected`, `model_call1`, `model_call2`, `entities_counts` (Call 2, informativo).
   - `extract_entities`: `status`, `confidence`, `counts` (nutracêuticos, mechanisms, biological_effects, conditions, interactions, side_effects).
   - `study_extractions.extracted_data`: contagens finais (**fonte oficial do yield**).
   - `kanban_status` final.

### Relatório final

**Tabela 4×telemetria** (1 linha por estudo, colunas = campos acima).

**Comparativo antes/depois** (apenas Polyphenols e CoQ10, fonte = `study_extractions.extracted_data`):

| Estudo | Métrica | Antes | Depois | Δ |
|---|---|---|---|---|
| Polyphenols | yield (entidades/char) | 0.184 | ? | ? |
| Polyphenols | mechanisms | 0 | ? | ? |
| Polyphenols | biological_effects | 0 | ? | ? |
| CoQ10 | nutracêuticos | (baseline) | ? | ? |
| CoQ10 | método extração | structured_data_enhanced | ? | ? |

**Veredito por critério de aceite**:
- [ ] Zero `processed` silencioso (todos com `analysis_data` ou `failed` justificado)
- [ ] Spermine: `file_search.status` = `ok` ou `failed` (não limbo)
- [ ] CoQ10: `ok` com nutracêuticos > 0 (sai do fallback)
- [ ] Position-paper curto: não `degraded` por `truncation_suspected`
- [ ] Polyphenols: yield sobe E mechanisms/biological_effects > 0

### Fora de escopo (registrar, não fazer)
- `markStageFailed` dentro de `gemini-file-search` (Fase 3)
- Isolamento de projeto GCP entre chave Debates e ingestão (pré-produção)
- Botão "Reprocessar pipeline", baseline pré-backfill, `ingestion_health` no audit (Fases 3-4)
- Patch em `generate-triplets`

Pronto para build mode.