## Plano de Correções: Pipeline, Digital Twin e Evidence Gap

### a) Pipeline Workflow Card - Barra de rolagem horizontal

O card com os 7 estágios do pipeline transborda em telas menores. Vou envolver o conteúdo em um container com `overflow-x-auto` e scrollbar estilizada, garantindo que os cards fiquem visíveis via scroll horizontal suave.

**Arquivo:** `src/components/pet/ClinicalPipelineWorkflow.tsx`

---

### b) Digital Twin Tab - Workflow + Log no lugar certo

Atualmente a tab "Digital Twin" mostra apenas o `DigitalTwinDog`. O `DigitalTwinLogPanel` existe dentro do componente mas precisa de um **workflow visual com timing** idêntico ao da Clinical Analysis (mostrando etapas como "Trajectory API", "Parse", "Render" com tempos). 

Vou:
1. Criar um mini-workflow dentro da tab Digital Twin (reutilizando o padrão visual do `ClinicalPipelineWorkflow`) com as etapas do Digital Twin: Snapshot Load → Trajectory API Call → Parse Response → Render
2. Adicionar timing a cada etapa do DT, coletando timestamps no `useEffect` que monitora `aiQuery.status`
3. Garantir que o `DigitalTwinLogPanel` apareça logo abaixo do workflow, antes da visualização principal

**Arquivos:**
- `src/components/pet/DigitalTwinDog.tsx` - adicionar mini-workflow com timing
- `src/components/pet/DigitalTwinLogPanel.tsx` - ajustar se necessário

---

### c) Evidence Gap Search - Bug identificado e correção

**Causa raiz encontrada:** Os logs do edge function mostram `pet conditions found 0`. Investigando o banco, as condições do pet existem na tabela `pet_conditions` mas com `condition_id = NULL` — são armazenadas apenas como texto livre em `condition_name`. O edge function faz `JOIN` via `condition_id → health_conditions.id`, que retorna vazio.

**Correção em duas frentes:**

1. **Edge function `kg-evidence-gap-fill`**: Quando `condition_id` for NULL, usar `condition_name` diretamente como texto para busca no PubMed/Perplexity. Isso permite que condições sem link formal ao catálogo `health_conditions` ainda sejam pesquisadas.

2. **Escopo da busca** (respondendo sua pergunta): Sim, o sistema já usa Perplexity (`sonar-reasoning-pro`) como fonte primária + PubMed E-utilities como fallback. A busca é especificamente por evidências de compostos geroprotetores contra condições caninas. O prompt do Perplexity pede "evidence that the COMPOUND meaningfully treats, attenuates, or modifies the CONDITION in dogs".

**Sugestão adicional**: Ampliar o prompt do Perplexity para também buscar:
- Terapias medicamentosas baseadas em gerociência (não só os compostos já recomendados)
- Novos compostos que a literatura sugira para a condição, mesmo que não estejam no catálogo atual
- Isso transformaria o gap-fill de "validação dos compostos recomendados" para "descoberta de novas opções terapêuticas"

**Arquivos:**
- `supabase/functions/kg-evidence-gap-fill/index.ts` - fix condition_id NULL + expandir prompt
- `src/components/pet/EvidenceGapCard.tsx` - melhorar feedback visual do resultado

---

### Resumo técnico de arquivos

| Arquivo | Mudança |
|---------|---------|
| `ClinicalPipelineWorkflow.tsx` | Scroll horizontal estilizado |
| `DigitalTwinDog.tsx` | Mini-workflow com timing + reorganizar layout |
| `kg-evidence-gap-fill/index.ts` | Fix condition_id NULL, ampliar prompt Perplexity |
| `EvidenceGapCard.tsx` | Melhor feedback |
| `CHANGELOG.md` | Registrar mudanças |
| Locales PT/EN | Novas chaves para DT workflow |
| `src/i18n.ts` | Incrementar I18N_VERSION |
