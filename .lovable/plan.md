## Objetivo

Aproveitar a nova infraestrutura de **consultas, nutrição, exames PDF e medicações canonicalizadas** para que (a) os 5 pets demo passem a ter um **histórico clínico realista**, (b) esse histórico seja **lido e ponderado** pelo VetGraphRAG/Hybrid Recommendation com **destaque para a última consulta**, e (c) a documentação do sistema reflita essa lógica.

---

## a) Pets de exemplo com histórico longitudinal

Atualizar `src/components/pet/GenerateSamplePetsButton.tsx` para que cada pet receba **N consultas** ao longo do tempo (de simples → complexo: 1, 2, 3, 4, 5 consultas), em vez de apenas snapshot.

Estrutura por pet:
- **`pet_consultations`** (1 a 5, datadas dos últimos 24 meses):
  - `consultation_date`, `chief_complaint`, `clinical_exam`, `weight_kg_at_visit`, `body_condition_score`, `assessment`, `plan`
  - O trigger `refresh_pet_consultation_latest` marca automaticamente a mais recente como `is_latest`
- **`pet_conditions`**, **`pet_medications`**, **`pet_exams`**, **`pet_clinical_notes`** ganham `consultation_id` apontando para a visita correta — refletindo aparecimento, agravamento, resolução e ajustes de dose ao longo do tempo
- **`pet_nutrition` + `pet_nutrition_items`**: pelo menos 1 dieta atual, com mudança de marca/ração em uma das consultas (Luna troca para fórmula renal; Rex entra em dieta de controle de peso)
- **`pet_exams.extraction_status = 'done'`** com `raw_extracted` JSON populado (simulando PDF já parseado), incluindo `flags_abnormal`

Trajetória clínica por pet (resumo):
- **Buddy (4a, Beagle)**: 1 consulta — check-up preventivo
- **Max (9a, Beagle)**: 2 consultas — primeira detecta CDS leve; segunda confirma sarcopenia
- **Rex (8a, Lab)**: 3 consultas — obesidade → osteoartrite → displasia em raio-X; introdução de Meloxicam na 2ª
- **Thor (7a, Pastor)**: 4 consultas — OA → senescência → mielopatia em monitoramento; Carprofen ajustado
- **Luna (9a, Cavalier)**: 5 consultas — MMVD B2 → C; introdução escalonada de Pimobendan, Furosemida, Benazepril; DRC e HP secundárias surgindo na timeline; troca de ração na 4ª

## b) Uso do histórico no MedGraphRAG (com destaque para a última)

Hoje o `hybrid-recommendation` e o `extract-pet-clinical-data` ignoram `pet_consultations`, `pet_nutrition`, `clinical_notes`. Mudanças:

1. **Builder de contexto clínico** (`supabase/functions/hybrid-recommendation/index.ts`):
   - Buscar todas as consultas ordenadas DESC; separar `latest` (a com `is_latest=true`) e `history` (anteriores)
   - Para cada entidade (conditions/meds/exams), agrupar por `consultation_id` e marcar timestamp relativo
   - Buscar dieta atual (`pet_nutrition`) e juntar perfil nutricional (kcal/dia, %P, %G, ω3/ω6, Ca:P) via `pet_food_nutrition`

2. **Prompt do MedGraphRAG** passa a receber 3 blocos explícitos:
   - `CURRENT_STATE` (consulta `is_latest`) — **peso 1.0**, fonte primária da inferência
   - `CLINICAL_TRAJECTORY` (consultas anteriores) — **peso 0.4**, usado para detectar:
     - condições **progredindo** vs **resolvidas** vs **estáveis**
     - resposta/falha a medicações já tentadas (não recomendar de novo se já houve falha)
     - tendências em exames (creatinina ↑, peso ↑)
   - `DIET_PROFILE` — usado para gap-analysis nutricional (déficit ω3, excesso de fósforo em DRC, etc.)

3. **Pesos no scoring** (`recommendation-confidence-service.ts` / `hybrid-recommendation-service.ts`):
   - Condição em consulta `is_latest` com `status='active'` → fator 1.0
   - Condição apenas em histórico antigo → fator 0.3 (background risk)
   - Condição `resolved` → ignorada para protocolo ativo, mantida para alertas de recidiva
   - Medicação ativa na última consulta entra na detecção de interações; medicação descontinuada não

4. **PatientKnowledgeSubgraph** (`src/components/pet/PatientKnowledgeSubgraph.tsx`): nó "Última Consulta" em destaque visual (borda mais forte) com edges para condições/meds/diet ativas; consultas anteriores como nós secundários menores numa timeline lateral.

5. **`extract-pet-clinical-data`**: quando o vet cola texto de evolução, criar uma **nova `pet_consultation`** automaticamente em vez de só anexar `clinical_notes` soltas.

## c) Documentação

Atualizar:
- **ARCHITECTURE.md** (MINOR): nova seção "Modelo Longitudinal de Histórico Clínico" descrevendo `pet_consultations` como tabela-âncora, `is_latest`, FK `consultation_id` em conditions/meds/exams/notes, e fluxo de leitura no hybrid-recommendation
- **docs/CURRENT_STATE.md** (MINOR): mover histórico clínico de "mockado" para "implementado"; descrever pesos `latest=1.0 / history=0.4`
- **docs/STANFORD_DEMO.md** (MINOR): destacar que os 5 demo pets agora exibem **trajetória clínica realista** (1→5 consultas) — diferencial de demonstração
- **CHANGELOG.md** [Unreleased] → Added: histórico longitudinal nos sample pets + integração no MedGraphRAG com peso na última consulta
- **mem://features/sample-pets-complexity-order**: adicionar regra "cada pet tem N consultas = sua posição no ranking de complexidade; última consulta sempre dirige a inferência"
- **mem://architecture/hybrid-recommendation-context-aware-logic**: adicionar bloco `CURRENT_STATE / CLINICAL_TRAJECTORY / DIET_PROFILE` e os pesos
- Incrementar `I18N_VERSION` ao adicionar novas chaves de UI ("Última consulta", "Trajetória clínica", "Dieta atual")

## Detalhes técnicos

- Sem migração nova: o schema de `pet_consultations` e FKs já foi criado nas fases 1-2.
- Trigger `refresh_pet_consultation_latest` já recalcula `is_latest` no insert — basta inserir as consultas em ordem cronológica.
- Edge functions afetadas: `hybrid-recommendation`, `extract-pet-clinical-data`. Sem novas secrets.
- Botão "Gerar pets de exemplo" passa a inserir ~15 consultas totais (1+2+3+4+5) e ~10 itens de nutrição, mantendo `is_demo=true` para deleção em massa segura.

## Fora de escopo

- Importar histórico real do PetLove (continua manual via formulário/PDF)
- Re-treinar embeddings sobre consultas históricas (só leitura estruturada por enquanto)
- Versionamento de `pet_nutrition` ao longo do tempo além do snapshot atual + 1 troca
