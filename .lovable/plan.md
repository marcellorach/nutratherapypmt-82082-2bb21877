

## Plano: Reconstruir a Página do Perfil do Pet para o Veterinário

### Contexto
A página atual (`PetProfilePage.tsx`) mostra apenas dados clínicos básicos (condições, medicações, exames, notas) e um chat clínico. Falta o componente mais importante: a **seção de recomendações do VetGraphRAG** com sliders individuais para cada nutracêutico/droga, gráficos de tratabilidade e o fluxo de aprovação veterinária.

O sistema de sliders já existe em `ActiveIngredientTag.tsx` (com dose mín/máx e posição recomendada), mas está confinado ao módulo de `recommendations/` e não integrado na página do veterinário.

### O que será construído

A página será reestruturada em **3 seções verticais** no conteúdo principal (2/3 da tela), mantendo o Chat Clínico no sidebar (1/3):

---

### Etapa 1: Criar componente `VetRecommendationPanel`
Novo componente em `src/components/pet/VetRecommendationPanel.tsx` que renderiza o stack de recomendações do VetGraphRAG para o pet. Conterá:

- **Header**: "Stack Geroprotetor Recomendado" com badge de confiança geral
- **Lista de compostos** (nutracêuticos/drogas), cada um como um card individual com:
  - Nome do composto + condição alvo
  - **Slider de dosagem** com dose mínima, dose máxima, e a bolinha posicionada na dose recomendada pelo sistema
  - Labels: dose mín (esquerda), dose recomendada (centro/bolinha), dose máx (direita)
  - Botão X para remover composto do stack
  - Badge de nível de evidência
  - Mini rationale (1 linha)
- **Botões de ação**: "Aprovar Stack", "Aprovar com Modificações", "Rejeitar"

### Etapa 2: Criar componente `TreatabilityChart`
Novo componente `src/components/pet/TreatabilityChart.tsx`:
- Gráfico de barras horizontais mostrando o potencial de tratabilidade de cada condição do pet
- Duas barras por condição: "Evidência Científica" (dados do KG) e "Experiência do Plano" (dados de outros cães similares tratados)
- Usa Recharts (já instalado)

### Etapa 3: Reestruturar `PetProfilePage.tsx`
Reorganizar o layout da página:

```text
┌─────────────────────────────────────────────────────────────┐
│  ← Mel   Golden Retriever · 10 anos · 28kg     [Analisar]  │
├─────────────────────────────────────────────────────────────┤
│  [3 Condições] [2 Medicações] [2 Exames] [0 Notas]         │
├───────────────────────────────────┬──────────────────────── ─┤
│                                   │                          │
│  ┌─ Tratabilidade por Condição ─┐ │  ┌─ Chat Clínico ─────┐ │
│  │  [Gráfico barras horiz.]     │ │  │                     │ │
│  └──────────────────────────────┘ │  │                     │ │
│                                   │  │                     │ │
│  ┌─ Stack Geroprotetor ─────────┐ │  │                     │ │
│  │  Curcumin ──[====●=====]──   │ │  │                     │ │
│  │  10mg        25mg      50mg  │ │  │                     │ │
│  │                              │ │  │                     │ │
│  │  NMN ───[=======●===]────   │ │  │                     │ │
│  │  50mg        150mg   250mg  │ │  │                     │ │
│  │                              │ │  │                     │ │
│  │  [Aprovar] [Modificar]       │ │  │                     │ │
│  └──────────────────────────────┘ │  └─────────────────────┘ │
│                                   │                          │
│  ┌─ Tabs: Condições | Meds... ──┐ │                          │
│  │  (conteúdo existente)        │ │                          │
│  └──────────────────────────────┘ │                          │
└───────────────────────────────────┴──────────────────────────┘
```

**Ordenação vertical no painel principal:**
1. Gráfico de Tratabilidade (novo)
2. Stack Geroprotetor com Sliders (novo)
3. Tabs existentes (Condições, Medicações, Exams, Notas) — mantidas intactas

### Etapa 4: Dados e Integração
- Os dados do stack virão da chamada existente `hybrid-recommendation` (já implementada no `handleAnalyzeWithKG`)
- O resultado da análise será armazenado no state e passado ao `VetRecommendationPanel`
- **Botão "Gerar Dados de Exemplo"**: Para demo/prototipação, gera um stack mockado com 4-5 compostos com doses min/max/recomendadas
- Os dados de tratabilidade para o gráfico serão consultados via `get_conditions_with_treatability` (RPC existente) filtrados pelas condições do pet

### Etapa 5: Traduções i18n
- Incrementar versão no `i18n.ts`
- Adicionar chaves em PT e EN para todos os novos textos:
  - `petProfile.recommendation.*` (stack, approve, reject, dosage labels, etc.)
  - `petProfile.treatability.*` (chart labels)

### Detalhes Técnicos do Slider de Dosagem

Cada composto terá:
```typescript
interface CompoundDosage {
  name: string;
  condition: string;
  dosageMin: number;    // mg/kg
  dosageMax: number;    // mg/kg
  dosageRecommended: number;  // posição inicial do slider
  dosageCurrent: number;      // posição atual (editável)
  unit: string;               // "mg/kg" ou "mg"
  evidenceLevel: string;      // "KG-backed" | "AI-suggested"
  rationale: string;
  removed: boolean;
}
```

O slider usará o componente `@radix-ui/react-slider` já existente, com `min={dosageMin}`, `max={dosageMax}`, `defaultValue={[dosageRecommended]}`.

### Arquivos que serão criados/modificados
- **Criar**: `src/components/pet/VetRecommendationPanel.tsx`
- **Criar**: `src/components/pet/CompoundDosageSlider.tsx`
- **Criar**: `src/components/pet/TreatabilityChart.tsx`
- **Modificar**: `src/pages/veterinario/PetProfilePage.tsx` (reestruturar layout)
- **Modificar**: `src/locales/pt/translation.json` + `en/translation.json`
- **Modificar**: `src/i18n.ts` (incrementar versão)
- **Atualizar**: `CHANGELOG.md`, `docs/CURRENT_STATE.md`

