

## Plano: Reorganização do Fluxo de Estudos Científicos

### Contexto atual

O fluxo de estudos tem duas camadas de navegação:
1. **Nível superior** (EstudosTab): "Import & Process" | "Manage Studies" (kanban)  
2. **Nível inferior** (SciImportSection): Library → Upload PDFs → Imports → AI Processing

Há problemas de redundância, chaves i18n quebradas e informações repetitivas.

### Mudanças propostas

#### (a) Remover "Imports" do fluxo principal

A aba "Imports" (HistoryTab) é um gerenciador de arquivos SciSpace — não faz parte do fluxo de digestão. Será movida para dentro do TabHeader como um botão/link discreto (ícone de histórico), acessível mas fora do fluxo sequencial.

**Fluxo resultante**: Library → Upload PDFs → AI Processing

**Arquivos afetados:**
- `TabNavigation.tsx` — remover entry "import-history" do array de tabs
- `SciImportSection.tsx` — mover o acesso ao HistoryTab para um botão no header ou collapsible section no final
- `TabHeader.tsx` — adicionar botão de acesso ao histórico de imports

#### (b) "Manage Studies" (kanban) depois do AI Processing + rename

O kanban é a etapa final do fluxo de digestão. A estrutura de duas abas superiores ("Import & Process" | "Manage Studies") será eliminada — tudo ficará numa única seção linear:

```text
Scientific Studies Digestion Pipeline
Library → Upload PDFs → AI Processing → Curation (kanban)
```

O kanban será incorporado como 4ª aba no fluxo sequencial dentro do SciImportSection, em vez de ficar separado no nível superior.

**Arquivos afetados:**
- `EstudosTab.tsx` — remover sistema de duas abas superiores, renderizar tudo linearmente
- `TabNavigation.tsx` — adicionar "Curation" como 4ª aba após AI Processing
- `SciImportSection.tsx` — adicionar TabsContent para kanban, importar componentes de kanban
- `TabHeader.tsx` — alterar título para "Scientific Studies Digestion" / "Digestão de Estudos Científicos"
- Traduções PT/EN — novas chaves para título, descrição e nomes de abas

#### (c) Corrigir chaves i18n quebradas

`NtaiProcessCard.tsx` tem ~15 textos hardcoded em português:
- Linha 68: `'Processado'` → `t('studies.processing.status.complete')`
- Linha 70: `'Erro'` → `t('studies.processing.status.error')`
- Linha 72-78: todos os status → chaves i18n
- Linha 194: `"Remover da fila"` → `t()`
- Linha 213: `"Fonte:"` → `t()`
- Linha 219: `"Importado: há menos de um dia"` → `t()`
- Linha 247: `"Estudo processado com sucesso..."` → `t()`
- Linhas 256-269: textos do AlertDialog → `t()`

**Arquivos afetados:**
- `NtaiProcessCard.tsx` — substituir todos os hardcoded por `t()`
- `translation.json` (PT e EN) — adicionar chaves correspondentes

#### (d) Resumo compacto em vez de card redundante com kanban

Após processamento completo, em vez de mostrar o card verde verboso "Card added to kanban" + toda a análise detalhada (que já estará disponível no kanban), mostrar um **resumo compacto inline**:

```text
✅ d2a1a584 | Quality: Média | Relevance: Média | 3 nutraceuticals, 5 conditions, 12 triplets
```

Uma linha com badges, sem duplicar informações do kanban.

**Arquivos afetados:**
- `NtaiProcessingSection.tsx` — simplificar bloco de `analysisResult` (linhas 336-354) para resumo compacto
- `NtaiAnalysisResults.tsx` — pode ser mantido, mas só aparece no kanban (EstudoDetailDialog), não mais aqui

#### (e) Warning em vez de card verde de sucesso

Substituir o bloco verde "Card added to kanban" (linhas 347-353 do NtaiProcessingSection) por um **alerta amarelo/laranja** avisando:

> ⚠️ Este estudo foi processado mas **não será incorporado ao VetGraphRAG** até ser curado e aprovado no painel de Curadoria.

**Arquivos afetados:**
- `NtaiProcessingSection.tsx` — trocar `bg-green-50` por `bg-amber-50` com texto de warning
- `NtaiProcessCard.tsx` — trocar o card verde (linha 246-249) pela mesma mensagem de warning
- Traduções PT/EN — chaves para a mensagem de warning

### Ordem de implementação

1. Traduções i18n (base para tudo)
2. Corrigir hardcoded em NtaiProcessCard (c)
3. Reorganizar TabNavigation + SciImportSection (a + b)
4. Simplificar resultado pós-processamento (d + e)
5. Incrementar versão i18n
6. Atualizar documentação

### Detalhes técnicos

- O componente de kanban (`EstudosColumn`) + seus hooks/state serão movidos para dentro do `SciImportSection`
- O `EstudosTab` ficará muito mais simples — basicamente renderiza `EstudosHeader` + `SciImportSection` (que agora contém tudo)
- O `HistoryTab` será acessível via um botão `📁 Import History` no header do card, abrindo um collapsible ou dialog

