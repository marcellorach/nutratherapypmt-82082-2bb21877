

## Plano: Reestruturação do Perfil do Pet com Abas de Análise e Chat por Recomendação

### 1. Remover botão "Gerar Dados de Exemplo"

Remover o botão `Shuffle` (linha 325-328 do `PetProfilePage.tsx`) que chama `handleGenerateMockData`. Os dados clínicos já são gerados junto com os cães de exemplo no `GenerateSamplePetsButton`. Remover também a função `handleGenerateMockData` (linhas 223-254).

### 2. Reorganizar resultados da análise VetGraphRAG em abas

Atualmente, após clicar "Analisar com VetGraphRAG", os painéis aparecem empilhados verticalmente (Recommendations → Scientific Evidence → Biological Pathway → Improvement Projection). A proposta é agrupar tudo dentro de um componente com **Tabs**:

| Aba | Componente | Ícone |
|-----|-----------|-------|
| **Recomendações** | `VetRecommendationPanel` (stack geroprotetor) | Sparkles |
| **Caminho Biológico** | `BiologicalPathway` | GitBranch |
| **Evidência Científica** | `ScientificEvidencePanel` (triplets KG) | BookOpen |
| **Projeção de Melhora** | `ImprovementProjectionChart` | TrendingUp |
| **Chat por Composto** | Novo componente com chat especializado | MessageSquare |

As abas só aparecem após a análise ser concluída (quando há dados).

### 3. Novo componente: Chat Especializado por Composto

Criar `src/components/pet/CompoundSpecificChat.tsx`:
- Lista os compostos recomendados (ex: Curcumina → Artrite, NMN → Envelhecimento)
- Usuário seleciona um composto para abrir chat focado
- O chat usa a edge function `chat` (modo não-streaming) com system prompt contextualizado: *"Você é um especialista em {composto} para tratamento de {condição} em cães. Responda com base em evidências científicas."*
- Interface similar ao `PetClinicalChat` mas com contexto restrito ao composto selecionado

### 4. Chat Clínico Geral (sidebar)

Permanece como está na coluna 1/3 à direita, para perguntas gerais sobre o cão.

### 5. Arquivos a modificar/criar

| Arquivo | Ação |
|---------|------|
| `PetProfilePage.tsx` | Remover botão mock, reorganizar em abas de análise |
| `CompoundSpecificChat.tsx` (novo) | Chat especializado por composto |
| `translation.json` (PT/EN) | ~15 novas chaves para abas e chat por composto |
| `i18n.ts` | Incrementar versão |

### 6. Estrutura visual resultante

```text
┌──────────────────────────────────────────────────────────────────┐
│  ← [Pet Name] · Breed · Age · Weight    [Analisar com VetGraph] │
├──────────────────────────────────────────────────────────────────┤
│  Summary Cards (Condições | Medicações | Exames | Notas)        │
├──────────────────────────────────┬───────────────────────────────┤
│  Treatability Chart              │  Intelligent Clinical Chat    │
│                                  │  (geral sobre o cão)          │
│  ┌─────────────────────────────┐ │                               │
│  │ Tabs: Recomendações |       │ │                               │
│  │  Caminho Bio | Evidência |  │ │                               │
│  │  Projeção | Chat Composto   │ │                               │
│  │                             │ │                               │
│  │  [conteúdo da aba ativa]    │ │                               │
│  └─────────────────────────────┘ │                               │
│                                  │                               │
│  Clinical Data Tabs              │                               │
│  (Condições | Medicações | ...)  │                               │
└──────────────────────────────────┴───────────────────────────────┘
```

### Detalhes técnicos

- O `CompoundSpecificChat` recebe a lista de `CompoundDosage[]` e permite selecionar qual composto conversar
- Usa `supabase.functions.invoke('chat', { body: { messages, stream: false } })` com system prompt contextualizado
- Renderiza respostas com `react-markdown` para formatação científica
- i18n: chaves sob `petProfile.analysis.*` e `petProfile.compoundChat.*`

