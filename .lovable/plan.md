## a) Diagrama do organograma continua vazio/minúsculo (fotos 1 e 2)

**Diagnóstico:** o fix anterior (reduzir `fitMin` e remover o strip de `width/height`) não bastou. O `useScrollPanZoom.measureNatural()` usa `getBBox()` no `<svg>`, mas o wrapper interno tem `width: max-content; height: max-content` — quando o Mermaid emite o SVG com `style="max-width: 100%"`, o SVG colapsa horizontalmente dentro de um container 0px, `getBBox` retorna área quase nula, e o `fit()` calcula uma escala minúscula (foto 2) ou nula (foto 1, vertical em que o layout é muito alto).

**Correção:**
1. Em `OrganogramaDiagram.tsx`: após injetar o SVG, **forçar via JS** atributos `width`/`height` reais lidos do `viewBox` (`svg.setAttribute('width', vb.width)`, idem height) e remover qualquer `style="max-width:..."` que o Mermaid coloca. Sem alterar viewBox.
2. Adicionar um `ResizeObserver` também no `innerRef` em `useScrollPanZoom`, para que o `fit()` rode quando o SVG aparecer/redimensionar (não só o container).
3. Garantir que `measureNatural()` priorize `viewBox.baseVal` antes de `getBBox()` (mais estável quando o SVG ainda não fez layout) — já existe, só inverter ordem.
4. Aumentar `fitMin` para `0.2` (com dimensões corretas a escala natural já fica acima disso; isso evita o "ponto" minúsculo).

## b) Catálogo de rações (foto 3) — carga nutricional completa

Hoje `pet_food_products` só guarda Proteína %, Gordura %, kcal/kg e Ca:P. Para fechar gaps reais (objetivo da plataforma) precisamos da composição **AAFCO completa**.

**Proposta:** criar tabela `pet_food_nutrients` (1:1 com produto) com:
- Macros: protein, fat, fiber, ash, moisture, carbs, kcal_per_kg
- Minerais: Ca, P, K, Na, Mg, Cl, Fe, Cu, Zn, Mn, Se, I (mg/kg)
- Vitaminas: A, D3, E, K, B1, B2, B3, B5, B6, B9, B12, biotina, colina (UI/kg)
- Ácidos graxos: omega-3 total, EPA, DHA, omega-6, ARA
- Aminoácidos: lisina, metionina, taurina, triptofano, treonina, arginina
- Razões: Ca:P, n6:n3
- `source` (rótulo / fabricante / AAFCO calculado), `confidence` (0–1), `data_filled_at`

A UI da foto 3 ganha um drawer "Ver composição completa" + barra de completude (%) por produto. Edge function `enrich-pet-food-product` é estendida para popular esses campos via Perplexity + página do fabricante.

## c) Traduções incompletas (foto 4)

Auditar `mem://index.md`/i18n: chaves "Organograma", "Conformidade FDA/EMA/AVMA", "Auditorias Técnicas" estão hardcoded nos componentes de sidebar. Vou rodar `npm run audit:translations`, anotar todos os faltantes, mover para `admin.sidebar.*`, espelhar PT/EN e bumpar `I18N_VERSION` para `1.79.0`.

## d) Chave Perplexity

Já está configurada como secret (`PERPLEXITY_API_KEY` presente). O cartão "Not configured" da foto 5 lê do `ai_configurations`, não do secret. Fix: o card de Perplexity deve verificar via `provider-health` (`supabase/functions/perplexity-health`) e marcar como "Configured" quando o ping retornar 200. Sem nova API key necessária.

## e) Catálogo de prompts incompleto (foto 6)

Hoje só prompts criados na UI são salvos em `ai_configurations` (`prompt_*`). Todos os **prompts do sistema estão hardcoded** dentro dos edge functions. Mapeei:

| Edge function | Família proposta |
|---|---|
| `extract-pet-clinical-data` | **Clinical Extraction** |
| `parse-pet-exam-pdf` | **Clinical Extraction** |
| `parse-study` / `extract-study-entities` | **Study Ingestion** |
| `vectorize-study` / `gemini-file-search` | **RAG / Embeddings** |
| `hybrid-recommendation` | **Recommendation Orchestration** |
| `enrich-triplet` / `enrich-knowledge-graph` / `backfill-triplet-enrichment` | **KG Enrichment** |
| `consolidate-knowledge-graph` / `relations-auditor` | **KG Governance** |
| `kg-evidence-gap-fill` / `kg-missing-triplets` | **KG Gap-Fill (Perplexity)** |
| `condition-insights` / `project-pet-trajectory` | **Clinical Reasoning** |
| `translate-text` / `translate-conditions` / `translate-and-categorize-conditions` / `run-translation-audit` | **Translation** |
| `web-dosage-lookup` / `enrich-pet-food-product` | **External Lookup** |
| `suggest-taxonomy-terms` / `auto-tag-studies` | **Taxonomy** |
| `chat` / `ProposalAIChat` | **Conversational** |

**Proposta:**
1. Migração: tabela `ai_system_prompts` (id, family, function_name, version, content, variables jsonb, is_override boolean, updated_at, updated_by). RLS: admin-only.
2. Seed inicial: extrair cada prompt hardcoded → INSERT com `is_override=false` (origem código).
3. Edge functions passam a chamar helper `getSystemPrompt(functionName)` que lê override ativo se existir, senão usa o hardcoded como fallback (zero downtime).
4. UI: na aba **Prompts** adicionar uma 3ª aba "System Prompts" agrupada por família, com edição inline, botão "Restaurar default" e badge "Override ativo".
5. Documentar no organograma (`projectOrganograma.ts` → Configurações) e CHANGELOG.

## Ordem de execução sugerida

1. **Quick fix diagrama (a)** — sem migração, ~10min.
2. **Traduções (c)** + perplexity status (d) — bumpa `I18N_VERSION`.
3. **Catálogo de system prompts (e)** — migração + seed + UI (entrega maior).
4. **Composição nutricional completa (b)** — migração + extensão do enriquecimento.

Posso seguir tudo de uma vez ou faseado. Confirma a ordem (ou diga quais itens cortar) e eu inicio.