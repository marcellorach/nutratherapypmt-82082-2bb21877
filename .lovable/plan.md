

## Plano: Separar Curation em Sub-abas "In Curation" e "Approved"

### Problema Atual
A tab "Curation" exibe um Kanban com 3 colunas (Novos, Em Revisão, Aprovados) lado a lado em `grid-cols-3`, resultando em colunas muito estreitas e conteúdo "apertado".

### Solução
Substituir o layout Kanban de 3 colunas por **duas sub-abas** dentro da tab "Curation":

```text
┌─────────────────────────────────────────────────┐
│  Library → Upload PDFs → AI Processing → Curation │  ← menu principal
├─────────────────────────────────────────────────┤
│  [ In Curation (5) ]  [ Approved (3) ]           │  ← sub-abas
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Study Card   │  │  Study Card   │              │  ← cards em grid
│  └──────────────┘  └──────────────┘               │  ← largura total
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Study Card   │  │  Study Card   │              │
│  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────┘
```

### Detalhes Técnicos

**Arquivo: `src/components/administrador/estudos/import/SciImportSection.tsx`**

1. Adicionar state `curationSubTab` com valores `"in-curation"` e `"approved"`
2. Dentro de `<TabsContent value="curation">`, substituir o `grid-cols-3` por:
   - Um menu de sub-abas horizontal (usando `Tabs`/`TabsList`/`TabsTrigger` do Radix)
   - Sub-aba **"In Curation"**: mostra `novoEstudos` + `emRevEstudos` juntos (estudos com status `new`, `parsed`, `review`, `processed`) em layout `grid-cols-1 md:grid-cols-2` — usando toda a largura
   - Sub-aba **"Approved"**: mostra `aprovadosEstudos` em layout `grid-cols-1 md:grid-cols-2`
3. Cada sub-aba terá um badge com a contagem de estudos
4. O header com search e refresh permanece acima das sub-abas
5. Os cards de estudo (`EstudoCard`) serão renderizados diretamente sem o wrapper `EstudosColumn`, já que não precisamos mais dos headers de coluna

**Arquivo: `src/locales/pt/translation.json` e `src/locales/en/translation.json`**

Adicionar chaves:
- `studies.curation.inCurationTab` → "Em Curadoria" / "In Curation"
- `studies.curation.approvedTab` → "Aprovados" / "Approved"
- `studies.curation.noStudiesInCuration` → "Nenhum estudo em curadoria" / "No studies in curation"
- `studies.curation.noStudiesApproved` → "Nenhum estudo aprovado" / "No approved studies"

**Arquivo: `src/i18n.ts`** — incrementar versão do cache

### Resultado
Cada sub-aba ocupa 100% da largura disponível, com cards em 2 colunas no desktop — muito mais espaço para cada card comparado às 3 colunas apertadas atuais.

