## Objetivo

Reorganizar abas da página do paciente, eliminar duplicação entre "Alertas Clínicos" e "Análise VetGraphRAG → Alvos para Prevenção", e enriquecer cada card do stack geroprotetor com evidências científicas (estudos + trechos destacados) e mini-grafo do composto/condição.

---

## a) Eliminar "Alertas Clínicos" duplicado

A aba "Alertas Clínicos" (foto 1) hoje mostra predisposições não diagnosticadas — exatamente o que o `VetGraphRAGInsightsPanel` já apresenta como "Alvos para Prevenção" (foto 3). 

**Mudanças em `src/pages/veterinario/PetProfilePage.tsx`:**
- Remover a `<TabsTrigger value="clinical-alerts">` e o respectivo `<TabsContent>`.
- Remover o import de `ClinicalAlertsPanel`.
- Mover `labAlerts` e `interactionAlerts` (que ainda são úteis e não estão no VetGraphRAG) para dentro do `VetGraphRAGInsightsPanel` como subseções adicionais ("Alterações laboratoriais" e "Interações medicamentosas"), ou mantê-los como banner compacto acima do painel — preferência: integrar ao painel VetGraphRAG para consolidar tudo num só lugar.
- Ajustar `defaultValue` das tabs para sempre `'recommendations'`.

## b) Reordenar tabs

Nova ordem da `TabsList`:
1. **Recomendações** (default)
2. **Caminho Biológico**
3. **Evidência Científica**
4. **Projeção de Melhora**
5. **Chat por Composto**

(Alertas Clínicos removido conforme item a.)

## c) Enriquecer cards do stack geroprotetor

Cada card de composto em `CompoundDosageSlider.tsx` ganha um bloco colapsável **"Ver evidências e contexto"** com 3 sub-seções:

### c.1) Estudos científicos com trechos destacados
- Já temos `studies[]` anexado pelo `attachStudiesToCompounds` em `clinical-analysis-pipeline.ts`.
- **Ampliar o backend** (`attachStudiesToCompounds`) para também retornar, por estudo:
  - `excerpt`: trecho relevante puxado de `study_embeddings.chunk_text` filtrando o chunk que contenha tanto o nome do composto quanto o nome da condição (ILIKE simples). Limitar a ~280 caracteres, com `...` antes/depois do match.
  - Já temos `doi`/`pmid`/`link` para o link externo.
- **Frontend**: cada estudo vira um item expansível mostrando título + ano + link + trecho destacado (com o termo do composto em `<mark>`).

### c.2) Mini-grafo do composto e condições
- Reutilizar `PatientKnowledgeSubgraph` (já existe) em modo compacto, filtrado para o composto atual + a condição alvo do card.
- Renderizar em um `<Collapsible>` separado ("Ver grafo de conexões"), altura fixa ~280px.

### c.3) Mecanismo molecular resumido
- Aproveitar campos `mechanism_path` das triplets já buscadas em `attachStudiesToCompounds` para mostrar a via biológica (ex.: "Curcumin → inibe NF-κB → reduz IL-6"). Texto curto, sem componente novo.

### Layout do card resultante:

```text
[ícone] Composto → Condição           [KG-backed] [X]
        Via knowledge graph
        ━━━━━●━━━━━━━━━ slider
        5 mg/kg     Recomendado: 27.5     50 mg/kg
                    27.5 mg/kg

        💬 Discutir esta recomendação           ▾
        📚 Ver evidências e contexto            ▾
            ├─ Mecanismo: Composto → via X → efeito Y
            ├─ Estudos (3):
            │   • Título (2024) [link]
            │       "...trecho destacado com <mark>composto</mark>..."
            │   • ...
            └─ 🕸 Ver grafo de conexões         ▾
                  [mini PatientKnowledgeSubgraph]
```

---

## Detalhes técnicos

**Arquivos modificados:**
- `src/pages/veterinario/PetProfilePage.tsx` — remover aba Alertas Clínicos, reordenar tabs, ajustar `defaultValue`.
- `src/components/pet/VetGraphRAGInsightsPanel.tsx` — receber `labAlerts` e `interactionAlerts` e exibir como subseções extras.
- `src/services/clinical-analysis-pipeline.ts` — em `attachStudiesToCompounds`, também buscar `mechanism_path` da triplet de maior confiança e, para cada estudo, buscar 1 chunk relevante de `study_embeddings` (ILIKE composto + condição) → campo `excerpt`.
- `src/components/pet/CompoundDosageSlider.tsx` — extender interface `CompoundDosage` com `excerpt`, `mechanism`; novo bloco `Collapsible` "Evidências e contexto" com estudos expandíveis, mecanismo e mini-grafo.
- `src/components/pet/PatientKnowledgeSubgraph.tsx` — aceitar prop opcional `compactMode` + filtro `focusCompound` / `focusConditions` para renderizar subgrafo enxuto dentro do card.
- `src/i18n.ts` — incrementar `I18N_VERSION` (ex.: `1.24.0` → `1.25.0`).
- `src/locales/pt/translation.json` + `src/locales/en/translation.json` — novas chaves: `petProfile.recommendation.evidenceAndContext`, `mechanism`, `viewGraph`, `excerpt`.

**Sem migrações de banco.** As colunas e dados (`study_embeddings.chunk_text`, `triplet_extractions.mechanism_path`) já existem.

**Documentação:**
- `CHANGELOG.md` — entrada em `[Unreleased] → Changed` (consolidação de alertas) e `Added` (evidências expandidas no card).
- Bumpar versão de `ARCHITECTURE.md` se aplicável (mudança estrutural de navegação).

## Resposta às perguntas

> Possível? Razoável?

Sim, totalmente possível e razoável — todos os dados já estão no banco (chunks vetorizados em `study_embeddings`, mechanism_path em `triplet_extractions`, grafo do paciente já renderizado em outra aba). É só reaproveitar e consolidar dentro do card. O ganho de UX é alto: o veterinário vê dose + porquê + evidência + grafo sem sair do card.