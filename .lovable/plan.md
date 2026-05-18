## Investigação arquitetural: quando vetorizar?

### Onde os embeddings são CONSUMIDOS hoje

Encontrei 3 lugares que leem `study_embeddings.chunk_text` — **todos durante curadoria, antes da aprovação**:

1. `StudyTripletCuration.tsx:727` — busca chunks que contêm os nomes do subject/object do triplet e exibe como **"Trecho de Origem"** (caixa amarela na sua foto 6).
2. `TripletReviewDialog.tsx:94` — mesmo padrão, em outro modal de revisão.
3. `enrich-triplet/index.ts:41` — edge function de enriquecimento de triplets usa os chunks como contexto para a LLM.

### Onde os embeddings são GERADOS hoje

Apenas 2 callers de `vectorize-study`:

1. `useProcessingLogic.ts:188` — fluxo da aba **"Processamento IA"**, dispara automaticamente após extração Gemini (comentário literal: `// AUTO-VECTORIZATION: Generate embeddings for RAG`).
2. `EstudoCard.tsx:92` — botão manual ("Sem RAG" clicável).

### Conclusão arquitetural (alinhada aos princípios do projeto)

A vetorização **é, por design, um passo pré-curadoria** — sem ela o curador humano não consegue ver o trecho do PDF que justifica cada triplet, o que viola dois princípios core do projeto:

- **No-Mock Policy** — sem chunk real, exibimos "Texto original não disponível" e a decisão de aprovar/rejeitar fica cega.
- **Curation Gatekeeper** — a curadoria humana é a porta de entrada do KG; tirar a evidência textual dela degrada a qualidade do gatekeeper.

**Então a resposta à sua pergunta é: SIM, deve acontecer antes da curadoria.** O alerta "Sem RAG" é legítimo e deve permanecer.

### Por que 10 estudos chegaram sem embeddings (a falha real)

Vetorização hoje só roda em **um** dos caminhos de ingestão (aba "Processamento IA"). Os outros caminhos pulam o passo:

- Import SciSpace 2-step (`SciSpace2StepImport`)
- File upload que chama `process-study` direto sem passar pelo queue
- `batch-reprocess-triplets`
- Chamadas diretas de `gemini-file-search`

Resultado: 10 estudos com triplets e zero embeddings, alguns inclusive já `approved`.

Há ainda um problema **separado** de qualidade: 4 desses 10 estudos têm `full_text_content` curtíssimo (562–916 chars) — só o abstract foi parseado do PDF. Mesmo vetorizando, o chunk único seria pobre. Esse é um problema do parser de PDF, não da vetorização — fora do escopo desta tarefa, mas vou listar os IDs para você decidir depois.

---

## Plano de implementação revisto

### 1. Garantir vetorização em TODOS os caminhos de ingestão (correção arquitetural)

Em vez de espalhar `invoke('vectorize-study')` por cada caller, **centralizar no orchestrator** `process-study` (edge function): após salvar o estudo com sucesso e antes de retornar, disparar `vectorize-study` de forma assíncrona não-bloqueante (`EdgeRuntime.waitUntil`).

- Arquivo: `supabase/functions/process-study/index.ts`
- Mudança: após o `upsert` bem-sucedido, agendar `fetch` para `vectorize-study` em background (não bloqueia a resposta, não falha o processamento se a vetorização falhar — só loga).
- Remover a chamada duplicada de `useProcessingLogic.ts:188` (passa a ser redundante).

Para os caminhos que **não** chamam `process-study` (SciSpace direct path, se aplicável), adicionar trigger equivalente — vou verificar caller-by-caller na implementação.

### 2. Backfill dos 10 estudos órfãos

Adicionar um botão admin único **"Vetorizar estudos pendentes (N)"** no header da seção curadoria, que:

- consulta estudos com triplets e sem embeddings,
- enfileira `vectorize-study` para cada um sequencialmente,
- mostra progresso.

Local: `SciImportSection.tsx`, ao lado do botão Refresh existente, só aparece quando `N > 0`.

### 3. Manter o aviso "Sem RAG" — mas melhorar UX

O badge amber atual ("Sem RAG") é correto e fica. Adicionar:

- **tooltip explicativo**: "Este estudo não tem texto vetorizado, então a curadoria não consegue mostrar o trecho original que justifica cada triplet. Clique para vetorizar agora."
- no `EstudoDetailDialog`, quando o usuário abre um estudo sem embeddings, exibir um banner discreto no topo com o mesmo aviso + botão "Vetorizar agora".

### 4. Itens (a), (b), (c) do pedido original — sem mudança

- **(a) Curadoria badge**: contar só estudos com triplets onde `nenhum` foi aprovado/rejeitado (atualmente 14 no banco).
- **(b) Biblioteca badge**: contar estudos com pelo menos 1 triplet `approved`/`rejected` (atualmente 43).
- **(c) Link "Ver estudo original"** no card fechado, canto inferior direito: como o banco não tem DOI/URL armazenado, fallback para Google Scholar `?q={title}`. Se no futuro DOI for armazenado em `full_text_metadata.doi`, o link automaticamente usa `https://doi.org/{doi}`.

### Memória a atualizar

Criar `mem://architecture/vectorization-is-pre-curation` — registra que vetorização é passo obrigatório pré-curadoria, deve rodar em todos os caminhos de ingestão (centralizado em `process-study`), e o curador depende dos chunks para ver o "Trecho de Origem".

### Arquivos afetados

- `supabase/functions/process-study/index.ts` — disparar `vectorize-study` em background
- `src/hooks/ntai/useProcessingLogic.ts` — remover chamada redundante
- `src/components/administrador/estudos/import/SciImportSection.tsx` — badges (a)(b), botão backfill
- `src/components/administrador/estudos/import/TabNavigation.tsx` — prop `libraryCount`
- `src/components/administrador/estudos/cards/EstudoCard.tsx` — link "Ver original", tooltip melhorado
- `src/dialogs/EstudoDetailDialog.tsx` (ou caminho equivalente) — banner pré-curadoria sem RAG
- `src/locales/{pt,en}/translation.json` + `src/i18n.ts` — novas chaves + bump `I18N_VERSION`
- `CHANGELOG.md` + `npm run sync:changelog`
- `mem://architecture/vectorization-is-pre-curation`

Sem migrations. Sem mudança de schema.
