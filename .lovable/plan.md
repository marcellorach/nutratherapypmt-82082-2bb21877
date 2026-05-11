
# Cadastro veterinário "na mão" — análise e plano (v2, com banco de rações)

## 1. Diagnóstico do que está faltando hoje

O `PetRegistrationForm` cadastra apenas dados demográficos. Tudo o que importa clinicamente — **diagnósticos, medicações, exames, alimentação, observações** — ou não existe ou vive em tabelas soltas (`pet_conditions`, `pet_medications`, `pet_exams`, `pet_clinical_notes`), sem agrupamento e sem o vet conseguir registrar pela UI.

Lacunas concretas:
- Não existe **agrupador "Consulta"** (data + vet + motivo) ligando os itens daquele dia.
- Sem **histórico de visitas**: a "última consulta" não é destacada como estado clínico atual.
- `pet_medications` tem `substance_id`/`brand_id` mas a UI não usa — vet digita texto livre, então marca comercial nunca vira substância canônica.
- Exames são `jsonb` + `file_url`, sem upload de PDF nem extração estruturada.
- **Alimentação não existe no modelo**, e **não existe um catálogo de rações** com perfil nutricional para o motor de recomendação considerar deficiências/excessos.
- Notas livres não disparam extração de entidades.

## 2. Conceito proposto — "Consulta" como unidade central

```text
Pet
 └─ Consulta (data, vet, motivo, peso, BCS, queixa, plano)
     ├─ Diagnósticos       (condições, severidade, status)
     ├─ Medicações         (marca → substância canônica)
     ├─ Exames             (PDF + resultados parseados)
     ├─ Alimentação        (produtos do catálogo + porção/freq + extras)
     └─ Notas livres       (com extração de entidades)
```

Última consulta = estado clínico atual; anteriores = histórico que alimenta tendências e cronicidade.

## 3. Banco de dados de RAÇÕES (novo módulo central)

### 3.1 Tabelas
**`pet_food_brands`** — fabricantes (Royal Canin, Hill's, Premier, Pro Plan, Golden, Origens, Farmina, Acana, Orijen, Guabi, Quatree, GranPlus, Biofresh, etc.):
- `id`, `name`, `manufacturer`, `country`, `website`, `notes`.

**`pet_food_products`** — SKUs/linhas específicas (ex.: "Royal Canin Maxi Adult", "Hill's Science Diet Sensitive Stomach"):
- `id`, `brand_id`, `name`, `line` (Veterinary, Premium, Super Premium, Standard), `species` (`dog`/`cat`/`both`), `life_stage` (`puppy`/`adult`/`senior`/`all`), `size_target` (`small`/`medium`/`large`/`giant`/`all`), `food_form` (`dry_kibble`/`wet`/`semi_moist`/`raw`/`freeze_dried`), `is_prescription` bool, `prescription_indication` text[] (ex.: renal, hepatic, gastrointestinal, urinary, obesity, dermatosis, diabetic), `barcode`, `image_url`, `manufacturer_url`, `discontinued` bool.

**`pet_food_nutrition`** — perfil nutricional (1:1 com produto, versionado por `revision`):
- `product_id`, `revision`, `source` (`manufacturer_label`/`manufacturer_site`/`independent_lab`/`llm_estimated`/`user_submitted`), `verified_by`, `verified_at`.
- Macros (% matéria seca e tal-qual): `protein_pct`, `fat_pct`, `fiber_pct`, `moisture_pct`, `ash_pct`, `nfe_pct` (carb por diferença), `kcal_per_100g`, `kcal_per_kg`.
- Proteína: `primary_protein_source` (frango/peixe/cordeiro/salmão/vegetal/insetos…), `protein_sources` text[], `is_grain_free` bool, `is_hypoallergenic` bool.
- Minerais (% MS): `calcium_pct`, `phosphorus_pct`, `ca_p_ratio`, `sodium_pct`, `potassium_pct`, `magnesium_pct`.
- Lipídios: `omega3_pct`, `omega6_pct`, `omega6_omega3_ratio`, `epa_dha_pct` (quando rotulado).
- Funcionais já presentes: `glucosamine_mg_per_kg`, `chondroitin_mg_per_kg`, `taurine_mg_per_kg`, `l_carnitine_mg_per_kg`, `antioxidants_added` bool, `prebiotics` text[], `probiotics` text[].
- Adequação: `aafco_statement` text, `meets_aafco_complete` bool, `fediaf_compliant` bool.
- `raw_label_text` (OCR do rótulo, opcional), `raw_data jsonb` (campos não normalizados).

**`pet_food_ingredients`** — lista ordenada de ingredientes (N:1 com produto):
- `product_id`, `position`, `ingredient_name`, `ingredient_canonical_id` (FK opcional), `is_named_meat` bool, `is_byproduct` bool, `is_preservative` bool.

**`pet_food_recalls`** (opcional fase 2): histórico de recalls do FDA/MAPA por produto.

### 3.2 Como popular
1. **Seed inicial** (~200-400 produtos das marcas mais vendidas no Brasil + linhas terapêuticas globais), via script `scripts/seed-pet-foods.ts` — fontes públicas (sites dos fabricantes, FEDIAF, AAFCO, planilhas abertas como Tufts Petfoodology, Open Pet Food Facts).
2. **Edge `enrich-pet-food-product`** (Lovable AI Gateway, Gemini 2.5 Pro com web): dado nome/marca, busca composição garantida + ingredientes, retorna JSON normalizado com `source` marcado, e flag `requires_curation = true` se confiança < 0.8.
3. **CRUD admin** numa nova tab "Catálogo de Rações" (`src/components/administrador/...`) — listar, filtrar por espécie/marca/indicação, editar perfil, marcar como `verified`, importar CSV em lote, ver histórico de revisões.
4. **Submissões do vet**: se vet cadastra produto inexistente, vai pra fila `pending` (mesmo padrão do Curation Gatekeeper) até admin aprovar e promover.

### 3.3 RLS
- `SELECT` público autenticado (todos vets leem catálogo).
- `INSERT/UPDATE/DELETE` só admin (`is_admin()`); vet só insere via fluxo `pending` numa coluna `submission_status`.

## 4. Demais mudanças de schema

**Nova `pet_consultations`**: `pet_id`, `consultation_date`, `veterinarian_id`, `chief_complaint`, `clinical_exam`, `weight_kg_at_visit`, `body_condition_score` (1-9), `assessment`, `plan`. RLS espelhada de `pet_profiles`.
Adicionar `consultation_id uuid NULL` em `pet_conditions`, `pet_medications`, `pet_exams`, `pet_clinical_notes`.

**Nova `pet_nutrition`** (snapshot da dieta por consulta, com `is_current` para pet):
- `pet_id`, `consultation_id` (opc.), `diet_type` enum: `commercial_dry` | `commercial_wet` | `mixed_commercial` | `home_cooked` | `raw_barf` | `prescription` | `mixed_natural_commercial`.
- `daily_amount_g`, `meals_per_day`, `treats_frequency` (`none`/`occasional`/`daily`), `treats_description`, `water_intake` (`low`/`normal`/`high`), `restrictions` text[] (alergias declaradas), `notes`.
- `started_at`, `is_current`.

**Nova `pet_nutrition_items`** (N produtos por entrada de nutrição):
- `nutrition_id`, `product_id` (FK `pet_food_products`, NULL se texto livre pendente), `raw_brand_text`, `raw_product_text`, `share_percent` (em mistas), `daily_amount_g_per_item`.

## 5. Medicamentos canônicos
Autocomplete em `drug_brands` → auto-preenche `substance_id`. Edge `resolve-drug-brand` (LLM + tabela) sugere substância para marcas novas. Toda lógica clínica usa `substance_id`.

## 6. Exames PDF
Bucket `pet_exams_pdfs`, upload drag-drop, edge `parse-pet-exam-pdf` (Gemini) → JSON: `exam_type`, `exam_date`, `lab_name`, `results[]`, `clinical_comments`, `flags_abnormal[]`. Timeline com badges ↑↓ e comparação seriada.

## 7. UI

Substituir `PetRegistrationForm` por **2 modos**:
1. **Cadastro rápido**: demografia + dieta atual (autocomplete do catálogo).
2. **Consulta**: 5 seções colapsáveis (Diagnósticos · Medicações · Exames · Alimentação · Notas), salva pai+filhos transacional.

Timeline do pet: consultas mais recentes primeiro; última destacada como "Estado atual".

Nova tab admin "Catálogo de Rações" para CRUD e curadoria do banco.

## 8. Como o sistema usa esses dados de forma inteligente

| Sinal | Uso |
|---|---|
| Última consulta | Define condições ativas, meds em uso, peso e dieta atual → entrada do `hybrid-recommendation` e Digital Twin |
| Histórico de consultas | Cronicidade, recidivas, trajetória |
| Exames seriados | Tendências por analito → alertas (`examEnhancer`) |
| Marca → substância | Interações (`drug_interactions`), contraindicações com nutracêuticos |
| **Perfil da ração** | Calcula gap nutricional vs. NRC/AAFCO/FEDIAF: se ração já entrega EPA+DHA suficiente, reduz dose de ômega-3 sugerida; se Ca:P fora da faixa, alerta; se sódio alto e pet cardiopata, contraindica; se proteína baixa em sênior sarcopênico, sugere ajuste; se ração renal e vet quer suplementar fósforo, bloqueia |
| Mudança de dieta no tempo | Correlaciona com curva de peso e exames (troca de ração ↔ ALT subindo) |
| Ingredientes | Cruza com alergias declaradas; flag se ingrediente alergênico aparece no top-5 |
| Notas com entidades | Sintomas viram nós "Symptom" no subgrafo |

## 9. Enriquecimento do grafo do paciente

`PatientKnowledgeSubgraph` ganha 4 camadas:

```text
Pet
 ├── Symptoms          (de notas)
 ├── Conditions        (diagnósticos)
 ├── LabAbnormalities  (de exames)
 ├── DietProfile       ← agregado de pet_nutrition + pet_food_nutrition
 │     ├── kcal/dia, %P, %G, ω3/ω6, Ca:P, Na, fonte proteica
 │     └── ingredientes potencialmente alergênicos
 └── Medications (substância) ── interações ── Compounds candidatos
```

Arestas geradas: "ração já contém ω-3 → reduzir dose"; "alergia a frango + ração com frango → trocar produto"; "ração renal + condição renal → manter, evitar suplemento com fósforo". Triplets em namespace `patient_only` (Curation Gatekeeper).

## 10. Fases

1. **Schema + Consulta básica** + tabela `pet_nutrition` (sem catálogo): vet escolhe produto por texto livre.
2. **Catálogo de rações** (`pet_food_brands/products/nutrition/ingredients`) + seed inicial + CRUD admin + autocomplete na consulta.
3. **Edge `enrich-pet-food-product`** + fluxo de submissão pendente.
4. **Medicações canônicas** (`resolve-drug-brand`).
5. **Exames PDF** (`parse-pet-exam-pdf`).
6. **Enriquecimento do grafo** com DietProfile e gap-analysis no `hybrid-recommendation`.

## 11. Decisões para você confirmar

1. **Escopo inicial do catálogo**: começo com **top 30 marcas no Brasil** (~200 SKUs) mais as linhas terapêuticas globais (Royal Canin Veterinary, Hill's Prescription Diet, Pro Plan Veterinary), ou já amplio para gatos também?
2. **Seed**: posso seedar com dados estimados pelo LLM marcando `source = 'llm_estimated'` + `verified = false` (mais rápido), ou só populo com marcas onde encontro a composição garantida pública (mais lento, mais confiável)?
3. **"Consulta" obrigatória ou opcional** para adicionar item solto?
4. **Submissão pelo vet**: vet pode criar produto novo com flag `pending`, ou só admin cadastra?
5. **Extração de entidades** das notas: automática ao salvar consulta, ou clique explícito do vet?

Confirme/ajuste e implemento a Fase 1+2 (consulta + catálogo) primeiro.
