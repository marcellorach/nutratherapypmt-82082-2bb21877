# Um só lugar para escolher os modelos de IA

## Objetivo
A tela "Modelos de IA por tarefa" passa a controlar de verdade o modelo que cada parte do sistema usa. Nenhum nome de modelo fica escondido no código, e os registros mostram sempre o modelo realmente usado.

## O que já existe (verificado)
- Um roteador central já lê a escolha da tela para cerca de 10 rotinas: extração, relações, chat, tradução, verificação, enriquecimento, gap-fill, meta-estudos e tags.
- **A leitura de PDFs é a exceção.** Ela fala direto com a conta Google e não passa por esse roteador, por isso ignora a tela. O modelo está fixo no código, e foi esse nome que estava errado hoje.
- Valores gravados hoje: extração, relações, chat e tradução usam Gemini 3.5 Flash; o auditor usa Gemini 3.1 Pro; os embeddings usam gemini-embedding-001.
- Existem telas antigas com listas de modelos desatualizadas que não gravam nada: um painel de motores com GPT-4o e uma configuração que ainda cita Gemini 2.5 Flash.

## O que muda
1. **Nova tarefa "Leitura de PDF" na tela**, com uma lista própria contendo só os modelos que a conta Google aceita para ler PDF. A primeira opção é `gemini-3.1-pro-preview`, o modelo atual.
2. **A leitura de PDFs passa a consultar essa escolha.** Se não houver escolha gravada, usa o modelo atual como padrão.
3. **Trava de segurança:**
   - A tela só oferece modelos compatíveis.
   - Ao salvar, o sistema testa o modelo escolhido direto no Google e recusa, com uma mensagem clara, os modelos que não existem. Isso teria evitado o erro de hoje.
   - Se um modelo gravado falhar com "modelo não encontrado", a leitura volta ao padrão e registra o aviso.
4. **Registros honestos:** o histórico de cada estudo passa a mostrar o modelo realmente usado e a origem da escolha: tela ou padrão.
5. **Limpeza das telas antigas:** remover ou marcar como "sem efeito" as listas de modelos que não controlam nada, para que só exista um lugar de escolha.
6. **Textos em PT e EN**, com incremento da versão de traduções.

## Fora do escopo
- Trocar a leitura de PDFs para a IA do Lovable, que corresponde ao teste comparativo ainda em aberto.
- Mudar os modelos atualmente escolhidos, os textos das instruções dadas à IA (os prompts) ou as permissões.
- Publicar.

## Argumento contra a proposta
A leitura de PDF é a primeira etapa de todo estudo. Um modelo mal escolhido por um administrador trava toda a entrada de estudos. A trava do item 3 reduz esse risco, mas não o elimina: um modelo pode existir e mesmo assim ler pior. Uma alternativa mais conservadora seria só mostrar o modelo na tela, sem permitir a troca. Recomendo a versão editável com trava, porque só ela resolve o que você pediu.

## Detalhes técnicos
- Chave nova `ai_model_pdf_reading` em `ai_configurations`, sem alteração de schema.
- `gemini-file-search`: resolver o modelo via `ai_configurations`, com fallback `gemini-3.1-pro-preview` e cache de 30 s. Em caso de 404, usar o fallback e registrar em `ingestion_stages.file_search.model` / `model_source`.
- Nova ação de validação: um endpoint leve na própria função que chama `models/{id}` na API do Google e é executado antes de salvar na tela. O acesso exige a permissão administrativa já existente.
- `AIModelSelector.tsx`: nova linha com uma lista separada, porque esses modelos usam IDs sem o prefixo `google/`. Também chama a validação antes do upsert.
- Limpar `EnginesPromptsPanel.tsx` (lista GPT-4o sem efeito) e o default `gemini-2.5-flash` de `useVetGraphRAGConfig.ts`.
- Changelog, `sync:changelog`, i18n PT/EN e `I18N_VERSION`. Validação com typecheck, vitest e um reprocessamento real de um estudo.
