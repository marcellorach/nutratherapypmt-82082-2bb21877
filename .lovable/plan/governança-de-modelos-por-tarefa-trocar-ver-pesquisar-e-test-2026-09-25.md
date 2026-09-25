# Governança de modelos por tarefa: trocar, ver, pesquisar e testar

## Situação atual (verificada)
- **Existem duas telas de modelos.** A mais simples tem só 5 escolhas genéricas (extração, relações, chat, tradução e embeddings). A mais completa, "Governança por tarefa", lista 23 tarefas. Elas não conversam entre si.
- **Estado das 23 tarefas:** 13 já obedecem à escolha feita na tela, 7 ainda usam um modelo fixo no código ("legado") e 3 estão só planejadas. Além disso, a leitura de PDF foi ligada hoje de forma separada.
- **Cerca de 33 rotinas chamam IA, mas só 11 passam pelo roteador central.** Parte das outras 22 nem aparece na lista de tarefas.
- **Os registros de uso existem**, com 412 chamadas gravadas. Eles mostram modelos diferentes do recomendado: o enriquecimento de relações usou Gemini 2.5 Flash em 283 chamadas, até junho.
- **Os modelos recomendados na lista estão desatualizados:** Gemini 2.5 e GPT-5.4.
- **Já existe um lugar para acompanhar modelos novos, mas ele está vazio.** Não há pesquisa automática funcionando.

## O que vamos construir (4 fases, entregues uma por vez)

### Fase 1: Uma só tela e um inventário completo
- A tela "Governança por tarefa" vira a única. A tela simples é aposentada, e a leitura de PDF entra como mais uma tarefa.
- **Inventário honesto:** cada rotina que usa IA aparece ligada a uma tarefa, com uma de três marcações: "obedece à tela", "modelo fixo no código" ou "sem registro". Nada fica escondido.
- Para cada tarefa, a tela mostra:
  - o modelo escolhido;
  - o modelo **realmente usado** nas últimas execuções, a partir dos registros;
  - onde a tarefa é usada: quais rotinas e quais telas;
  - o volume de chamadas, o tempo, o custo e a taxa de erro dos últimos 30 dias.
- Quando o modelo usado for diferente do escolhido, a tela mostra um alerta.

### Fase 2: Ligar as tarefas que ainda estão presas no código
- Migrar as 7 tarefas legadas para o roteador central, uma de cada vez: trajetória, dados clínicos, PDF de exames, taxonomia, dose na web, rações e planilhas.
- Registrar como tarefa as rotinas de IA que hoje não aparecem na lista.
- Cada migração mantém o modelo atual. O comportamento só muda se você trocar o modelo na tela.

### Fase 3: Teste antes de trocar
- Cada tarefa ganha um **conjunto de casos de teste**: exemplos reais já aprovados, como estudos curados, relações aprovadas e traduções revisadas. Nada é inventado.
- Ao escolher um modelo novo na tela, o sistema roda **o modelo atual e o novo lado a lado** nesses casos e mostra:
  - a concordância com o resultado aprovado;
  - as diferenças encontradas;
  - o tempo e o custo estimado.
- O modelo só é salvo depois que você vê esse resultado e confirma.
- **Tarefas sem casos aprovados suficientes** ficam marcadas como "sem teste possível, observação atenta". Por 7 dias depois da troca, o sistema compara taxa de erro, tempo e o volume do que é produzido (por exemplo, quantas relações por estudo) com o período anterior e avisa se algo desviar.
- Qualquer troca pode ser desfeita com um clique, e fica registrado quem trocou, quando e por quê.

### Fase 4: Pesquisa atualizada de modelos
- Toda semana, o sistema atualiza a lista de modelos disponíveis na IA do Lovable e na conta Google, e registra os modelos novos e os que foram aposentados.
- **Desempenho medido por nós, não copiado da internet:** os modelos candidatos passam pelos mesmos casos de teste de cada família de tarefas (extração, curadoria, chat clínico, tradução, auditoria...). O resultado vira um ranking por família, com qualidade, custo e tempo.
- Rankings públicos da internet aparecem só como referência, com a fonte indicada. Eles não medem tarefas veterinárias.
- A tela passa a sugerir trocas ("modelo X foi 12% melhor e 40% mais barato em tradução"), mas **nunca troca sozinha**.

## Argumentos contra (e como lidar)
- **Custo:** testar modelos consome créditos. Vou propor um teto mensal configurável e testes com amostras pequenas, de 10 a 20 casos por tarefa.
- **Um teste pequeno não prova qualidade.** Ele pega regressões óbvias, não diferenças sutis. Por isso a observação de 7 dias continua obrigatória mesmo depois de um teste aprovado.
- **Tamanho:** são 4 fases grandes. A Fase 1 sozinha já resolve "ver o modelo usado em cada lugar". Recomendo aprovar e conferir uma fase por vez.
- **Conta Google × IA do Lovable:** algumas tarefas só funcionam na conta Google, como a leitura de PDF. A tela deixa claro qual conta paga cada tarefa.

## Fora do escopo
- Trocar qualquer modelo em uso. Nenhuma fase altera o comportamento atual sem uma escolha sua.
- Mudar os textos das instruções dadas à IA (os prompts) ou as permissões.
- Publicar.

## Detalhes técnicos
- Fonte única: `src/config/ai-tasks.ts` (registro) + `ai_configurations.ai_model_<task_id>` (escolha) + `ai_task_invocations` (uso real). A chave `ai_model_pdf_reading` é mapeada para uma tarefa `pdf_reading` com `provider: google_direct`.
- Fase 1: script de inventário (`rg` de chamadas ao gateway e a `generativelanguage`) gera `ai-task-consumers.generated.ts` e um teste que falha se aparecer uma rotina de IA não mapeada. `TaskModelGovernancePanel` passa a ler `ai_task_invocations` agregadas; o `AIModelSelector` é removido.
- Fase 2: cada função legada passa a usar `callAITask`, com `fallback.model_id` igual ao modelo de hoje.
- Fase 3: tabela `ai_task_eval_cases` (task_id, input, expected, source_ref) semeada a partir de dados aprovados; edge function `ai-task-shadow-eval` com fila de jobs e teto de custo; tabela `ai_model_change_log` com rollback; job diário de observação com comparação de métricas de 7 dias.
- Fase 4: job semanal agendado que lê `/v1/models` do gateway e `models.list` do Google para `ai_model_radar`, e depois roda o eval dos candidatos por família. Resultados em `ai_model_eval_results`. Migrações aditivas, com GRANT e RLS de admin.
- Changelog, organograma, i18n PT/EN e `I18N_VERSION` a cada fase.
