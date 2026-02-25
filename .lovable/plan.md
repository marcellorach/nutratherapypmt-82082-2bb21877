

## Plano: Corrigir Toast Duplicado + Corrigir Geração de Triplets + Chat Inline

---

### Diagnóstico Atualizado

Você tem razão — os triplets mais recentes (criados em 2026-02-25 04:28) realmente **já têm evidence_level** (in_vitro, rct), mas **intensity e confidence_rationale continuam NULL**. Isso confirma que o prompt está parcialmente funcionando, mas há bugs no código de inserção.

**Bugs encontrados no `generate-triplets/index.ts`:**

| Bug | Linha | Problema |
|-----|-------|----------|
| `confidence_rationale` nunca é gerado | 1090-1127 | O campo simplesmente **não existe** no objeto de insert. As `validationWarnings` são calculadas mas nunca salvas |
| `intensity` falha com valor 0 | 1102 | `props.intensity \|\| null` → se LLM retorna `0`, converte para `null` |
| `properties` não é required no schema | 756 | LLM pode omitir `properties` inteiro no tool call, gerando triplets sem nenhum metadado |
| Tool schema não força `intensity` | 745 | `intensity` é optional no schema, então LLM frequentemente omite |

---

### Correção A: Toast Duplicado

**Problema**: `useStudyApprovalWorkflow.ts` (linhas 112-117) E `EstudoDetailDialog.tsx` (linhas 106-111) ambos disparam toast no mesmo fluxo.

**Solução**: Remover os toasts do hook (linhas 112-117 e 122-126) e manter apenas o toast do dialog (sonner), que já tem i18n com interpolação correta.

**Arquivo**: `src/hooks/useStudyApprovalWorkflow.ts`

---

### Correção B: Geração de Triplets — Fix no Prompt e Insert

**4 correções no `generate-triplets/index.ts`:**

1. **Adicionar `confidence_rationale` ao insert** (após linha 1122): Construir string a partir de `validationWarnings` + base score info:
```typescript
confidence_rationale: validationWarnings.length > 0 
  ? `Base: ${validatedEvidenceLevel} (${llmConfidence.toFixed(2)}) → Adjusted: ${adjustedConfidence.toFixed(2)}. ${validationWarnings.join('; ')}`
  : `Base: ${validatedEvidenceLevel} (${llmConfidence.toFixed(2)}). No adjustments.`,
```

2. **Corrigir `intensity` null** (linha 1102): Mudar de `||` para `??`:
```typescript
intensity: props.intensity ?? null,
```

3. **Tornar `properties` e campos-chave required no tool schema** (linha 756): Adicionar `"properties"` ao array `required`, e dentro de `properties`, marcar `evidence_level`, `confidence`, `intensity` e `species_context` como required.

4. **Reforçar no prompt que intensity é OBRIGATÓRIO** (linha 650): Mudar de "OPTIONAL" para "REQUIRED":
```
- intensity: REQUIRED - 0.0 to 1.0, strength of effect. DEFAULT to 0.5 if not determinable.
```

**Arquivo**: `supabase/functions/generate-triplets/index.ts`

---

### Correção C: Enrich-Triplet — Edge Function para Triplets Antigos com N/A

Nova edge function `enrich-triplet` que:
1. Recebe `tripletId`
2. Busca o triplet + chunks relevantes de `study_embeddings`
3. Chama LLM (Gemini Flash) pedindo apenas: `evidence_level`, `intensity`, `confidence_rationale`
4. Faz UPDATE no triplet com os valores extraídos

Botão "Enriquecer com IA" aparece no card expandido quando `evidence_level IS NULL` ou `intensity IS NULL`.

**Arquivos**: 
- Novo: `supabase/functions/enrich-triplet/index.ts`
- Modificar: `StudyTripletCuration.tsx` (adicionar botão no expanded details)

---

### Correção D: Chat Inline no Card do Triplet

Substituir o `onNavigateToChat` (que muda de aba) por um mini-chat que se expande **diretamente dentro do card expandido**.

Novo componente `TripletInlineChat`:
- Collapsible com input + scroll area (max-h-48)
- Chama `document-chat` edge function
- Pergunta pré-populada: "Explain the relationship between [subject] and [object] ([predicate]) based on this study."
- Renderiza respostas com markdown (reutiliza `MarkdownMessage`)
- Sem persistência de histórico (sessional only)

**Arquivos**:
- Novo: `src/components/administrador/estudos/curation/TripletInlineChat.tsx`
- Modificar: `StudyTripletCuration.tsx` (substituir botão "Perguntar à IA")

---

### Resumo de Mudanças

| Arquivo | Mudança |
|---------|---------|
| `useStudyApprovalWorkflow.ts` | Remover toasts duplicados (linhas 112-117, 122-126) |
| `generate-triplets/index.ts` | Adicionar `confidence_rationale` ao insert, fix `intensity ?? null`, tornar `properties` required no tool schema, marcar `intensity` como REQUIRED no prompt |
| `enrich-triplet/index.ts` | **Nova** edge function para enriquecer triplets antigos com N/A |
| `StudyTripletCuration.tsx` | Adicionar botão "Enriquecer com IA" para triplets com N/A, substituir navegação de chat por inline chat |
| `TripletInlineChat.tsx` | **Novo** componente de mini-chat inline dentro do card |
| `src/locales/pt/translation.json` | Chaves para enriquecimento e chat inline |
| `src/locales/en/translation.json` | Idem |
| `src/i18n.ts` | Incrementar versão |
| `CHANGELOG.md` | Registrar mudanças |

