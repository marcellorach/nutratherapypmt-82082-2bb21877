

## Plano: Badges de Status + Botoes "About" por Grupo

### Resumo

Duas funcionalidades distintas:

**1. Badges de status (CircleCheck + tooltip)** em itens do sidebar com percentuais de completude:
- **Knowledge Base**: Nutraceuticals (100%), Veterinary Targets (100%), Ontology Audit (100%), Knowledge Graph (100%), Relations (100%)
- **Data Processing**: Patient Analysis (60%), Visualization (60%)  
- **Actions**: Analytics (40%)

**2. Botoes amarelos "About" estilo "About VetGraphRAG"** na primeira pagina de cada grupo:
- **Data Processing** (primeira pagina: Import) 
- **Actions** (primeira pagina: Analytics/SmartCampaignSystem)
- **R&D / Research** (primeira pagina: Proposed Studies)

Cada botao abre um dialog explicativo com overview, metodologia e fundamentos, igual ao existente em "Digestao Cientifica".

---

### Detalhes Tecnicos

#### Parte 1: Badges de Status no Sidebar

**Arquivos modificados:**

1. **`KnowledgeBaseGroup.tsx`** -- Adicionar CircleCheck + Tooltip nos itens: nutraceuticals-unified, veterinary-targets, ontology-audit, knowledge-graph, relacoes (todos 100%)

2. **`DataProcessingGroup.tsx`** -- Adicionar CircleCheck + Tooltip nos itens: analysis/patient-analysis (60%, amarelo), visualization (60%, amarelo)

3. **`ActionsGroup.tsx`** -- Adicionar CircleCheck + Tooltip no item: analytics (40%, laranja/vermelho)

**Logica de cores por percentual:**
- 100% = verde (emerald-500) com CircleCheck
- 60% = amarelo (yellow-500) com CircleCheck  
- 40% = laranja (orange-500) com CircleCheck

**Cada tooltip mostrara:**
- Nome do status (ex: "100% Functional" / "60% Implemented")
- Descricao breve do que funciona e o que falta

#### Parte 2: Botoes "About" nos Grupos

**Arquivos modificados:**

4. **`ImportStep.tsx`** (primeira pagina de Data Processing) -- Adicionar TabInfoButton com conteudo explicativo do grupo

5. **`ActionsStep.tsx` ou `SmartCampaignSystem.tsx`** (primeira pagina de Actions) -- Adicionar TabInfoButton  

6. **Componente da primeira pagina de Research** (sugestoes-ai) -- Adicionar TabInfoButton

7. **`admin-tabs-info.ts`** -- Adicionar entries de conteudo para: `import` (Data Processing), `analytics` (Actions), `sugestoes-ai` (Research)

#### Parte 3: i18n

8. **`src/locales/pt/translation.json`** -- Chaves para tooltips de status de cada item + conteudo dos About
9. **`src/locales/en/translation.json`** -- Mesmas chaves em ingles
10. **`src/i18n.ts`** -- Incrementar versao

---

### Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `KnowledgeBaseGroup.tsx` | Adicionar badges 100% em 5 itens |
| `DataProcessingGroup.tsx` | Adicionar badges 60% em 2 itens + importar Tooltip |
| `ActionsGroup.tsx` | Adicionar badge 40% em 1 item + importar Tooltip |
| `ImportStep.tsx` | Adicionar TabInfoButton amarelo |
| `ActionsStep.tsx` | Adicionar TabInfoButton amarelo |
| Componente sugestoes-ai | Adicionar TabInfoButton amarelo |
| `admin-tabs-info.ts` | 3 novos blocos de conteudo |
| `translation.json` (PT) | ~30 novas chaves |
| `translation.json` (EN) | ~30 novas chaves |
| `i18n.ts` | Incrementar versao |

