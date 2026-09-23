# Estudo "Ursolic Acid" — descobrir por que o texto não é lido e corrigir

## O que foi verificado agora
- No banco, o estudo tem PDF salvo, **texto completo vazio** (`full_text_content` nulo) e status `new`.
- `ingestion_stages` só tem `extract_entities: failed (empty_payload)`. **Não há nenhum registro da etapa `file_search`**, ou seja, a leitura do PDF (`gemini-file-search`) não deixou rastro de sucesso nem de falha.
- Os registros da função `gemini-file-search` estão **vazios** para o período, então ainda não sabemos se ela rodou, caiu antes de gravar ou nem foi chamada.
- `extract-study-entities/index.ts:157` ainda grava `processing_error`, coluna que **não existe**. Por isso a marcação de erro dessa função falha e o estudo fica como `new` em vez de `error`.
- A hipótese de "créditos esgotados" não está confirmada (o saldo da plataforma está normal; a cota da chave Google não foi verificada).

## O que será feito
1. **Diagnóstico com evidência**: chamar `gemini-file-search` diretamente para este estudo (com sessão de administrador) e registrar o status HTTP e o corpo reais; em seguida ler os registros da função. Classificar a causa entre: (a) PDF sem camada de texto (digitalizado), (b) erro/cota da chave Google, (c) falha de download do arquivo no storage, (d) função não gravando o estado antes de falhar.
2. **Corrigir a marcação de erro**: remover `processing_error` de `extract-study-entities` (mesma correção já feita em `gemini-file-search`), gravando em `error_message` + `ingestion_stages`, para que o estudo passe a aparecer como erro com o motivo.
3. **Garantir rastro da etapa de leitura**: se o diagnóstico mostrar que `gemini-file-search` falha sem gravar `ingestion_stages.file_search`, fazer toda saída de erro gravar `failed` com o motivo literal.
4. **Correção da causa**, conforme o diagnóstico:
   - (a) PDF digitalizado: mostrar erro claro "PDF sem texto legível — envie uma versão com texto" (PT/EN). OCR fica como proposta separada, com custo, se o senhor quiser.
   - (b) chave/cota Google: informar qual chave está em uso e o erro literal; o senhor decide repor cota ou trocar a chave.
   - (c)/(d): corrigir o código e reprocessar.
5. Reprocessar o estudo e reportar o resultado real (chegou ou não à curadoria).

## Detalhes técnicos
- Arquivos: `supabase/functions/extract-study-entities/index.ts` (~135-165), `supabase/functions/gemini-file-search/index.ts` (~1774-1840, ~1992-2000).
- Novas chaves i18n (se o caso for a): `studies.vetgraphrag.errorNoExtractableText` em PT/EN, incrementando `I18N_VERSION`.
- Redeploy das duas funções; CHANGELOG + `sync:changelog`; vitest. Nada publicado.
