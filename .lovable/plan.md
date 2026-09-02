# RBAC científico e clínico

## Objetivo
Implementar os papéis reais `scientist` e `vet_coordinator` sem confundir a camada de visualização com autorização, proteger os quatro escritores científicos no backend e permitir que administradores concedam/revoquem papéis com auditoria.

## Sequência
1. **Remediar a exposição das funções de autorização**
   - Revisar a migração RBAC aplicada e criar uma migração corretiva, sem alterar migrações históricas.
   - Remover execução pública das funções novas e manter somente os grants indispensáveis para políticas RLS e chamadas internas.
   - Rerodar o linter e separar claramente avisos preexistentes de avisos introduzidos pelo RBAC. Não esconder achados.

2. **Autorização server-side dos escritores**
   - Criar helper compartilhado para validar `Authorization` com um cliente de usuário e consultar papéis via funções seguras, antes de criar/usar o cliente service-role.
   - Aplicar gates a `parse-study`, `gemini-file-search`, `extract-study-entities` e `generate-triplets`.
   - Propagar a identidade do chamador em chamadas encadeadas; chamadas internas sem identidade não ganharão uma exceção insegura.
   - Manter `force_reextract` como operação de curadoria autorizada e preservar o ownership/deep-merge existente.

3. **RBAC no cliente**
   - Tipar os seis papéis suportados no `AuthContext` e expor verificações reutilizáveis.
   - Enforçar acesso à rota administrativa e ao deep-link de cada aba; `RoleViewContext` continuará apenas reduzindo ruído visual.
   - Preencher a matriz de permissões de `admin-tabs.ts` e filtrar grupos/itens da sidebar pela mesma fonte.
   - Permitir que `scientist` acesse pesquisa, estudos, processamento científico e curadoria; `vet_coordinator` acesse pacientes, monitoramento clínico e curadoria clínica. Configuração de segurança e gestão de papéis permanecem exclusivas de `admin`.

4. **Gestão de papéis e auditoria**
   - Adicionar no painel de usuários uma UI admin-only para listar perfis existentes, conceder/remover papéis válidos e mostrar o histórico de auditoria.
   - Impedir remoção do último administrador e tratar erros de concorrência/duplicidade com mensagens traduzidas.
   - Usar apenas `user_roles` + `profiles`; nenhum papel será armazenado em perfil ou armazenamento local.

5. **Qualidade e documentação**
   - Adicionar chaves PT/EN e incrementar `I18N_VERSION` antes das mudanças de interface.
   - Criar testes para matriz de permissões, rota/aba, helper de autorização e gestão de papéis; executar testes, typecheck, build, guards e linter.
   - Atualizar `CHANGELOG.md`, sincronizar changelog e registrar contagens/status reais no relatório final.

## Trade-offs e limites
- **Contra a proposta:** aplicar gates nos writers não torna pipelines iniciados pelo cliente seguros se a identidade não for propagada; por isso chamadas encadeadas serão corrigidas no mesmo passo, em vez de liberar uma chave interna ou confiar no service-role.
- A separação `scientist`/`vet_coordinator` será conservadora: o primeiro escreve ciência e o segundo escreve/edita dados de curadoria clínica. Caso uma operação exija ambos os domínios, o backend usará a permissão mais específica e não uma regra ampla baseada somente na UI.
- O linter pode continuar apontando funções `SECURITY DEFINER` legadas que precisam ser executáveis por `authenticated` para políticas RLS. Esses achados serão reportados com evidência; funções novas não ficarão publicamente executáveis e nenhuma permissão será removida se isso quebrar RLS.
- O dashboard de conformidade e `outcome_observations` ficam fora deste incremento.
