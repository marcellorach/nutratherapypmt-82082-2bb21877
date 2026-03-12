

# Plano de Implementação: Limpeza e Consolidação do Sistema (Fases 1–4)

## Fase 1: Eliminar Código Morto (baixo risco)

### 1.1 Remover serviços sem importação
| Arquivo a remover | Motivo |
|---|---|
| `src/services/active-ingredients-service.ts` | 0 imports no projeto |
| `src/services/nutraceutical-outcomes-service.ts` | 0 imports no projeto |
| `src/services/scientific-studies-service.ts` | 0 imports no projeto |

### 1.2 Remover hooks mortos
| Arquivo | Ação |
|---|---|
| `src/hooks/useVetGraphRAGProcessing.tsx` | Remover — 0 imports externos (apenas re-exportado pelo `useNtaiProcessing.tsx`) |
| `src/hooks/useNtaiProcessing.tsx` | Reescrever — apontar diretamente para os hooks que `NtaiProcessingSection` realmente usa, sem depender do hook morto |
| `src/hooks/ntai/useVetGraphRAGProcessingLegacy.ts` | Remover — 0 imports |

### 1.3 Remover aggregador modular não utilizado
O `NutraceuticalsService` (uppercase) em `src/services/nutraceuticals/index.ts` é exportado mas nunca importado. Os sub-módulos (`relations-service`, `relations`) são importados diretamente por 4 componentes. Manter os sub-módulos, remover apenas o `index.ts` que agrega sem ser usado, e atualizar a estrutura para que não confunda.

**Atenção**: Os imports `from '@/services/nutraceuticals'` resolvem para `nutraceuticals.ts` (a classe), NÃO para `nutraceuticals/index.ts`. O sistema funciona corretamente sem o `index.ts`.

---

## Fase 2: Eliminar Simulações Perigosas (alto impacto)

### 2.1 Reescrever `vetgraphrag-service.ts`
**Problema**: `analyzeStudy()` chama `simulateAnalysisResult()` que gera dados ALEATÓRIOS com `Math.random()` e os salva no banco como dados reais.

**Solução**: Substituir `simulateAnalysisResult()` pela chamada real à edge function `process-study` (que já existe e funciona). Manter `scoring.ts` (que é legítimo — calcula scores a partir de metadados reais do LLM).

**Ação**: Reescrever `analyzeStudy()` para usar `processStudyWithAI()` de `ntai/processing.ts` como fonte primária.

### 2.2 Remover `src/services/ntai/simulation.ts`
Todas as funções são baseadas em `Math.random()`. A única importação é `vetgraphrag-service.ts` que será reescrita na etapa anterior.

### 2.3 Reescrever `src/services/openai.ts` → usar edge function `chat`
**Problema**: `askVeterinaryAI()` retorna texto hardcoded por keyword matching. Usado apenas pelo `EnhancedExamViewer.tsx`.

**Solução**: Substituir pela chamada real via Lovable AI (edge function que invoca um modelo suportado como `google/gemini-2.5-flash`). Criar edge function `veterinary-chat` que recebe o contexto do pet + pergunta e retorna resposta real do LLM.

---

## Fase 3: Consolidar Duplicações

### 3.1 Unificar serviço de nutracêuticos
Situação: `src/services/nutraceuticals.ts` (classe, 326 linhas) é usada por 5 importadores. `src/services/nutraceuticals/index.ts` (aggregador modular) não é importado por ninguém.

**Ação**: Remover `src/services/nutraceuticals/index.ts`. Manter `nutraceuticals.ts` e os sub-módulos individuais (`relations-service.ts`, etc.) que são importados diretamente.

### 3.2 Consolidar `examEnhancer.ts` com pipeline clínico
**Problema**: `examEnhancer.ts` usa ranges de referência hardcoded localmente. O `clinical-analysis-pipeline.ts` já consulta `lab_reference_ranges` do banco.

**Ação**: Refatorar `examEnhancer.ts` para consultar a tabela `lab_reference_ranges` do banco em vez de usar valores locais hardcoded. Manter a interface `EnhancedExam` que o `EnhancedExamViewer` consome.

---

## Fase 4: Conectar Páginas a Dados Reais

### 4.1 `RecommendationsList.tsx` (veterinário)
**Problema**: Importa `treatmentPlans` e `nutraceuticals` de `@/data` (mock).

**Solução**: Substituir por queries ao banco de dados — buscar `recommendation_logs` e `pet_conditions` do pet selecionado. Se não houver recomendações reais ainda, mostrar call-to-action para executar análise VetGraphRAG.

### 4.2 `TutorPage.tsx` (tutor)
**Problema**: Importa `owners`, `pets`, `treatmentPlans`, `nutraceuticals` de `@/data`.

**Solução**: Substituir por queries reais a `pet_profiles`, `pet_conditions`, `recommendation_logs`. O tutor deve ver seus pets reais e recomendações geradas pelo sistema.

### 4.3 Outros usos de `@/data` mock
- `CardActions.tsx`: Importa `examResults`, `pets` de `@/data` — migrar para dados reais
- `AnalyticsTab.tsx`: Importa `nutraceuticals` de `@/data` — migrar para query ao banco
- `useNutraceuticalsData.ts`: Usa mock como fallback — remover fallback mock

**Nota**: `admin-tabs-info`, `biomedical-taxonomy`, `sampleGroups`, `types/tabInfoTypes` em `@/data` são dados estáticos de configuração/UI — estes são legítimos e permanecem.

---

## Ordem de Execução e Segurança

1. **Fase 1** primeiro — risco zero pois remove apenas código sem referências
2. **Fase 2** em seguida — corrige contaminação do banco com dados fictícios
3. **Fase 3** depois — consolida serviços duplicados
4. **Fase 4** por último — depende das fases anteriores estarem estáveis

Cada fase será testada via console logs e verificação de imports antes de prosseguir.

