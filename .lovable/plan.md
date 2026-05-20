## Objetivo

Tornar a ingestão de meta-estudos em **Fundamentos > Ingestão** robusta e transparente: PDF é obrigatório, extração de texto realmente acontece, curador pode anexar notas que guiam a IA, e cada etapa mostra status como no pipeline de estudos clínicos.

---

## Mudanças

### 1. UI — `IngestaoMetaEstudo.tsx`

**Reorganização do formulário:**
- **Documento fonte (obrigatório)** — dropzone drag & drop aceitando `.pdf`, `.docx`, `.txt`, `.md` (até 20MB). Mostra preview do nome + tamanho + botão remover.
- **Notas do curador (opcional)** — textarea menor, label clara: *"Diretrizes para a IA: como ponderar este estudo, claims a ignorar, RCs já cobertas, etc."* Aceita markdown.
- **DOI / URL (opcional, recolhido)** — campo pequeno dentro de um `<details>` "Metadados adicionais", grava em `meta_studies.doi`.
- Remover o campo grande "Texto / .md / abstract" da forma atual (passa a ser fallback automático se a extração falhar).
- Botão "Analisar com IA" desabilitado até ter documento anexado.

**Painel de log de digestão (novo):**
Lista vertical estilo timeline com 5 estágios, cada um com ícone de status (pending/running/success/error) + mensagem + tempo:
1. `Upload do documento` (cliente → storage `meta_studies_pdfs`)
2. `Extração de texto` (edge → tamanho extraído em chars)
3. `Catálogo de Regras-Core carregado` (N regras disponíveis para vínculo)
4. `Análise pelo Gemini 3 Pro` (modelo, latência, tokens)
5. `Rascunho estruturado` (N claims, N vínculos sugeridos)

Em caso de erro, o estágio fica vermelho com a mensagem técnica + dica acionável (ex: *"PDF protegido por senha — exporte uma cópia sem proteção"*).

### 2. Edge function — `extract-meta-study`

**Trocar modelo:** `google/gemini-3-pro-preview` (substitui `gemini-2.5-pro`).

**Extração real de PDF/docx:**
- Para PDF: enviar ao Gemini como **multimodal inline** (`type: "image_url"` com `data:application/pdf;base64,...` no payload do gateway — Gemini 3 Pro aceita PDF nativamente até 20MB).
- Para `.docx`: extrair texto via biblioteca Deno (`docx` parser) ou rejeitar com mensagem clara se não suportado nesta fase.
- Para `.txt` / `.md`: ler direto.
- Fallback: se a extração devolver <200 chars úteis, retornar erro 422 com `stage: "extraction"` para a UI marcar vermelho.

**Aceitar `curator_notes`** no payload e injetar como bloco separado no system prompt:
> *"O curador anexou as seguintes diretrizes — respeite-as: {curator_notes}"*

**Retornar telemetria por estágio** no JSON de resposta, para o painel de log popular cada linha:
```ts
{
  draft: {...},
  trace: [
    { stage: "extraction", status: "success", duration_ms: 420, detail: "12450 chars extracted" },
    { stage: "rules_catalog", status: "success", detail: "18 rules loaded" },
    { stage: "llm_analysis", status: "success", duration_ms: 8200, detail: "gemini-3-pro-preview · 4231 tokens" },
    { stage: "structuring", status: "success", detail: "3 claims · 2 suggested links" }
  ]
}
```

### 3. Migration — `meta_studies.curator_notes`

Adicionar coluna `curator_notes TEXT NULL` em `meta_studies` para persistir as diretrizes do curador junto com o estudo aprovado.

### 4. i18n

Bump `I18N_VERSION` (1.91.0 → 1.92.0) e adicionar chaves novas: `fundamentos.ingestao.dropzone.*`, `fundamentos.ingestao.curatorNotes.*`, `fundamentos.ingestao.log.stages.*`.

### 5. CHANGELOG + organograma sync

Entrada em `[Unreleased]` (`area: admin · status: improved · i18n: bump`) e `npm run sync:changelog`.

---

## O que **não** muda
- Schema de `core_rules`, `core_rule_evidence`, `core_rule_modulators` permanece igual.
- Fluxo de aprovação manual (`approve_meta_study` no front) permanece igual.
- Tabs vizinhas (Justificativas, Estudos, Score Popovers) não são tocadas.

---

## Riscos e mitigações
- **Gemini 3 Pro Preview pode ter rate limits diferentes** → tratar 429/402 já está coberto pelo handler existente.
- **PDFs digitalizados (scan puro)** podem não ter texto extraível → o estágio "Extração" mostra `0 chars` e sugere OCR manual antes de tentar de novo.
- **Curator notes muito longas** podem inflar o prompt → cap em 4000 chars com aviso na UI.

---

## Pergunta antes de implementar
Confirma que quer **manter o DOI/URL escondido em `<details>`** (não eliminar de vez), ou prefere remover totalmente da UI e deixar só editável depois, no rascunho? Eu recomendo manter recolhido — custa zero ruído visual e ajuda auditoria.
