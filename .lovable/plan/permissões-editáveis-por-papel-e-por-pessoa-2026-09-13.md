# Permissões editáveis por papel e por pessoa

## Objetivo
Substituir permissões fixas no código por uma grade editável: o administrador define, item a item, o que cada papel vê e edita, e pode abrir exceções para uma pessoa específica — sem nova publicação. A verificação real passa a acontecer no servidor.

## Crítica honesta da aprovação (antes de executar)
1. Entrega única e grande: são banco, servidor e telas ao mesmo tempo. Aceito, mas o risco de erro cresce; mitigo com ordem fixa e verificação a cada bloco.
2. Exigir `has_permission` como fonte única é a decisão certa — regra paralela é como se perde controle de acesso.
3. Verifiquei: só existe uma tarefa agendada no banco, e ela chama a rotina de vigilância de auditoria, não as quatro rotinas de estudos. O risco de parada silenciosa por agendamento é menor do que o texto sugere.
4. Verifiquei um problema real e maior: três das quatro rotinas hoje aceitam chamada sem exigir login (`supabase/config.toml` linhas 30–37 e 33–34). Exigir identidade vai quebrar chamadas encadeadas internas se eu não propagar o token — está previsto.
5. Discordo de um ponto: há duas cadeias internas hoje (`gemini-file-search:2317` e `enrich-knowledge-graph:156,180`, além de `batch-reprocess-triplets:95`) que passam credencial de serviço. Vou propagar a identidade de quem iniciou; onde não houver pessoa, a chamada terá origem declarada e registrada, não exceção livre.
6. Alerta de segurança: parte dos avisos é anterior a 02/09 e vem de funções antigas. Vou separar no relatório e não vou remover permissão que quebre regra de acesso existente.
7. Cache no navegador nunca é garantia; o servidor decide. Vou usar invalidação na mudança e informar o tempo de vida real.
8. Trava do último administrador precisa existir no banco, não só na tela — senão dá para se trancar fora por chamada direta.
9. Não publicarei nada; deploy segue sendo seu.
10. Cada afirmação do relatório virá com arquivo e linha, ou virá marcada como suposição.

## Sequência de execução
1. Backup completo de `user_roles` e das políticas de 02/09 antes de qualquer escrita, com contagem verificada.
2. Migração corretiva do alerta das funções de autorização criadas em 02/09.
3. Catálogo de permissões (`permissions`), grade por papel (`role_permissions`), exceções por pessoa (`user_permission_overrides`), histórico de alterações com autor, data e valor anterior.
4. Função `has_permission` com ordem: negação individual → concessão individual → união dos papéis. Reescrever as 15 políticas de 02/09 sobre ela; nenhuma regra paralela sobrevive.
5. Migração de partida: catálogo populado a partir das 45 áreas do painel, tudo concedido a administrador — acesso idêntico ao de hoje, comprovado por consulta aos 6 usuários atuais.
6. Exigência de identidade e permissão nas quatro rotinas, com propagação do token nas cadeias internas e teste da sequência completa de processamento de um estudo.
7. Telas: grade por papel, exceções por pessoa, "minhas permissões", menu e abas filtrados, bloqueio de link direto, tudo em português e inglês.
8. Testes, guardas, changelog sincronizado e nova checagem de segurança.

## Regras que valem sempre
- Fail-closed: área sem permissão cadastrada fica invisível para todos, e um teste falha se o catálogo divergir da lista de áreas.
- Seis papéis: administrador, cientista, coordenador veterinário, veterinário, tutor e usuário.
- Reprocessamento forçado ganha permissão no catálogo, mas continua com o comportamento atual.
- Não mexo em: união de dados do pipeline de extração, textos de instrução da IA, sincronização com o grafo externo. Painel de conformidade e registro de desfechos ficam fora.

## Relatório final
Separação entre o que foi verificado no código (com arquivo e linha) e o que é suposição; onde a mudança vive; alertas de segurança antes e depois, separando preexistentes dos novos; número real de testes executados; lista de arquivos alterados; e sugestões de próximos passos.
