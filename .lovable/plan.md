# Painel de desempenho: condições, doses e triplas por modelo, marcadas pelo curador

Escolhas de Marcello: usar só dados já existentes (sem IA e sem custo) e deixar o curador marcar o acerto em condições e doses.

## Fato que limita o resultado (conferido no banco)
- São 61 estudos e 61 extrações, e todas têm doses.
- Só **1 dos 61** estudos registra qual modelo fez a extração de condições e doses (Stage 1). Nos outros 60 o modelo não foi guardado, então esses estudos vão aparecer como "modelo não registrado". Não dá para descobrir esse modelo depois.
- As triplas continuam atribuídas pelo horário da chamada, como já acontece hoje.

## O que será construído
1. **Marcação pelo curador.** Na tela do estudo, cada condição e cada dose extraída ganha dois botões, "Correta" e "Incorreta". A marcação é pendente até alguém decidir. Ela grava quem marcou e quando, e pode ser desfeita.
2. **Registro do modelo daqui em diante.** A extração passa a guardar o modelo do Stage 1 no registro do estudo. É uma linha, sem chamar IA e sem reprocessar nada. Estudos antigos seguem "não registrado".
3. **Painel.** Para cada modelo, o painel mostra três blocos: condições, doses e triplas. Em cada um: quantos itens foram extraídos, quantos o curador marcou como corretos e incorretos, quantos estão pendentes e a taxa de acerto. As falhas de execução continuam aparecendo na tabela que já existe.
4. Todo o texto em PT e EN, com a versão das traduções atualizada. Changelog e organograma também serão atualizados.

## Argumento contra
- O painel vai nascer quase vazio. São 60 estudos sem modelo e nenhuma marcação feita. Ele só passa a ajudar a escolher um modelo depois de várias curadorias e de estudos novos. Se o objetivo é decidir já, só o teste comparativo, que tem custo, responde.
- Isso cria mais trabalho manual de curadoria, somado ao das triplas.

## Detalhes técnicos
- Nova tabela `extraction_item_reviews` com estes campos: `study_id`, `item_type` (condition|dose), `item_key` (nome normalizado + índice), `verdict` (correct|incorrect), `reviewed_by`, `reviewed_at`, `deleted_at` (soft delete). Uma única revisão ativa por item. A tabela terá GRANT e RLS com leitura por `is_platform_member()` e escrita por `has_permission(auth.uid(),'tab.curation','edit')`. A migração é aditiva.
- `extract-study-entities`: gravar `ingestion_stages.stage1.model`. O deploy da função só acontece com sua aprovação.
- `useModelPerformance.pure.ts`: novas contagens por `item_type`, com testes unitários.
- Proibido: nenhuma chamada de IA, nenhum reprocessamento, nada publicado.
