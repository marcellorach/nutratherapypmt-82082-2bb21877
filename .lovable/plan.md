# Permissões editáveis por papel e por pessoa

## Objetivo
Sair de permissões fixas no código e passar a ter uma tela onde o administrador define, item a item, o que cada papel enxerga e faz — podendo também ajustar exceções para uma pessoa específica, sem depender de nova publicação do sistema.

## Como vai funcionar

**1. Catálogo de permissões**
Cada área do painel (hoje são 45 itens, como Estudos Científicos, Triplets, Knowledge Graph, Análise de Pacientes, AI Scientist, Configurações) vira uma permissão nomeada, com dois níveis: ver e editar. Além das áreas, entram permissões de operação sensível: processar estudos, gerar triplets, reprocessar extração, aprovar curadoria, gerenciar usuários.

**2. Permissão por papel**
Uma tabela de papéis (administrador, cientista, coordenador veterinário, veterinário, tutor) com uma grade marcável: para cada permissão, nada / ver / ver e editar. O administrador altera e salva; vale para todos daquele papel.

**3. Exceção por pessoa**
Na ficha de cada usuário, além dos papéis, uma lista de exceções: conceder algo que o papel não dá, ou retirar algo que o papel dá. A regra de decisão é explícita e mostrada na tela: negação individual vence concessão individual, que vence o papel.

**4. Transparência e segurança**
- Toda alteração de papel, de grade e de exceção fica registrada com autor, data e valor anterior.
- Cada usuário pode ver uma tela "minhas permissões" explicando de onde vem cada acesso.
- O administrador não consegue remover o próprio último acesso de administração, nem deixar o sistema sem administrador.
- A verificação real acontece no servidor. A tela apenas reflete a decisão; esconder um botão nunca é a proteção.

**5. Onde passa a valer**
- Menu lateral e abas do painel só mostram o que a pessoa pode ver, e o acesso por link direto é bloqueado igual.
- As quatro rotinas que processam estudos e geram conhecimento passam a exigir identificação e permissão antes de rodar; hoje elas aceitam qualquer chamada.
- Tudo em português e inglês, como o resto do sistema.

## Detalhes técnicos
- Novas tabelas: `permissions` (catálogo), `role_permissions` (grade por papel), `user_permission_overrides` (exceção individual, com allow/deny), e reuso de `user_roles` já existente. Cada tabela com grants explícitos, RLS e escrita restrita a administrador.
- Função `SECURITY DEFINER` `has_permission(user_id, permission_key, level)` resolvendo na ordem deny individual → allow individual → união dos papéis; usada tanto nas políticas RLS quanto pelas rotinas de servidor.
- Migração de partida popula o catálogo a partir de `src/config/admin-tabs.ts` e concede tudo ao papel administrador, preservando o comportamento atual no momento da virada.
- Cliente: hook `usePermissions` com cache, substituindo os testes fixos de papel em `AuthContext`, `ProtectedRoute`, `AdministradorPage` e nos grupos da barra lateral. `RoleViewContext` continua apenas como filtro visual pessoal, sem valor de segurança.
- Rotinas `parse-study`, `gemini-file-search`, `extract-study-entities` e `generate-triplets`: helper compartilhado que valida o token do chamador e a permissão antes de qualquer escrita, com propagação da identidade nas chamadas encadeadas.
- Correção pendente do alerta de segurança das funções de autorização recém-criadas, com nova migração corretiva e verificação do relatório antes de seguir.
- Testes: resolução de permissão (papel, allow, deny, combinação), bloqueio de link direto, recusa das rotinas sem permissão, e trava do último administrador.

## Opinião e limites
- Concordo com o pedido: grade editável é o certo aqui, porque os cinco perfis do produto ainda vão mudar e travar isso em código gera fila de ajuste a cada mudança de time.
- **Argumento contra:** permissão editável adiciona um estado que pode ser mal configurado — alguém pode se trancar fora de uma área ou liberar demais sem perceber. Mitigo com valores iniciais iguais ao comportamento atual, trava do último administrador, histórico de alterações e a tela "minhas permissões".
- Mantenho o catálogo no nível de área e operação, não campo a campo. Granularidade por campo multiplicaria a grade sem ganho real agora.
- Fora deste incremento: dashboard de conformidade calculado do banco e registro de desfechos clínicos.
