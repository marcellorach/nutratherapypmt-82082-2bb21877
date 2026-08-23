# Governança de extração, RBAC e conformidade medida

Cinco entregas independentes. Recomendo executar na ordem abaixo (1 e 2 primeiro: são as que param perda de dado hoje). Se quiser, aprovo e faço uma por vez, com relatório ao fim de cada.

## Entrega 1 — Re-extração forçada por estudo (UI + auditoria)

Botão "Re-extrair (forçado)" no detalhe do estudo (aba Análise) e na fila de curadoria.

- Diálogo de confirmação nomeando o estudo e explicando o efeito: substitui mecanismos/desfechos já gravados pelo resultado da nova rodada, mesmo que venha com menos itens.
- Chama `extract-study-entities` com `force_reextract: true` (a flag já existe na função).
- Auditoria: cada disparo grava linha em `study_audit_logs` (tabela existente) com `user_id`, `study_id`, ação `force_reextract`, e contagens antes/depois de `molecular_mechanisms` e `clinical_outcomes`. Painel simples de histórico no mesmo detalhe.
- Ação em lote fica de fora desta entrega (risco alto sem histórico consolidado).

## Entrega 2 — Guarda de ownership nos outros três escritores

Hoje só `extract-study-entities` usa `_shared/analysisDataMerge.ts`. Os outros sobrescrevem.

- `gemini-file-search`: passa a ler `analysis_data`/`extracted_data` atuais e aplicar `mergeAnalysisData`/`mergeExtractedData`. Como ele é o dono dos campos ricos, os campos extract-owned ficam intactos.
- `parse-study` e `generate-triplets`: mesma leitura-antes-de-escrever; ambos só escrevem chaves próprias.
- O shim `clinical_outcomes` do gemini (`{condition, relationship, efficacy, treatability_score}`) passa a ser gravado sob outra chave (`condition_efficacy_shim`), eliminando a colisão semântica na origem em vez de contorná-la no leitor. O leitor shim-aware continua para dados legados.
- Testes de regressão por escritor (fixtures existentes em `src/__tests__/fixtures/axis1/`).

## Entrega 3 — `outcome_observations` e ciclo RWE no dashboard

Tabela nova ligando intervenção → desfecho observado no paciente real.

Colunas: `id`, `pet_id`, `condition_id`, `nutraceutical_id` (nullable), `observation_date`, `metric` (texto), `value` (numeric), `unit`, `baseline_value`, `source` (`exam` | `vet_report` | `owner_report`), `confidence`, `recorded_by`, `notes`, `is_synthetic` (bool, default true), timestamps. RLS + GRANTs conforme padrão; `is_synthetic` separa coorte sintética de dado real.

Pipelines de preenchimento:
1. Automático: ao salvar um exame (`pet_exams`), derivar observações dos marcadores que já mapeamos para condições.
2. Manual: formulário no prontuário para o vet registrar desfecho observado.

Dashboard: bloco "Ciclo RWE" com observações por mês, cobertura (% de pets com plano ativo que têm ≥1 observação), e pares intervenção×desfecho com N suficiente para virar evidência. Números medidos do banco, com rótulo explícito quando `is_synthetic = true`.

Não entra nesta entrega: retroalimentar automaticamente o KG a partir das observações. Isso precisa de curadoria e vira entrega própria.

## Entrega 4 — RBAC além de admin

- Novos valores no enum de papéis: `scientist` e `vet_coordinator`, além de `admin` e `user`.
- Permanece a tabela `user_roles` separada + `has_role()` security definer (já existe). Nenhum papel em `profiles`.
- Políticas RLS por domínio, não por tabela solta:
  - `scientist`: leitura ampla do acervo científico (estudos, triplets, KG), escrita em curadoria/propostas; sem acesso a dados clínicos identificáveis de pets reais.
  - `vet_coordinator`: leitura/escrita clínica (pets, exames, consultas, planos), leitura do acervo científico; sem configuração de IA, prompts, chaves ou papéis.
  - `admin`: tudo, incluindo aprovação de acesso e gestão de papéis.
- UI: em Usuários & Perfis, atribuição de papel real por usuário (hoje o painel só tem perfil de visualização). O `RoleViewSwitcher` continua existindo como filtro cognitivo, mas passa a ser limitado pelos papéis reais.
- Zero Trust mantido: toda decisão de permissão é validada no banco; a UI só esconde.

## Entrega 5 — Conformidade calculada do banco

`complianceData.ts` continua sendo a lista de requisitos (isso é curadoria humana, não deve virar query). O que muda:

- Cada item ganha um `evidenceQuery`: um indicador medido (ex.: "% de tabelas públicas com RLS", "nº de prompts versionados", "nº de estudos com extração completa", "nº de observações RWE").
- Novo hook `useComplianceMetrics` faz as contagens via RPC dedicada e o dashboard exibe o número medido ao lado do status curado, com data da medição.
- Onde o número medido contradiz o status declarado, o card mostra o conflito explicitamente em vez de escolher um lado.
- Contadores agregados no topo (10/4/3 hoje hardcoded) passam a ser derivados da lista + medições.

## Notas técnicas

- Migrations aditivas: enum de papéis estendido, tabela `outcome_observations`, RPC de métricas de conformidade, políticas RLS novas. Nenhuma migration existente é editada.
- i18n obrigatório em toda UI nova: incrementar `currentVersion` em `src/i18n.ts` antes, criar chaves PT e EN no mesmo passo.
- `CHANGELOG.md` + `npm run sync:changelog` ao fim de cada entrega; o changelog está defasado desde 2026-06-18 e será atualizado junto.

## Argumento contra este plano

A Entrega 3 cria estrutura para um dado que hoje quase não existe (3 pets reais). Há risco real de a tabela nascer e ficar vazia, virando dívida. A Entrega 4 adiciona papéis para usuários que ainda não existem (`access_requests` está vazio) — RLS mais estrita pode quebrar telas do admin sem ninguém para se beneficiar disso ainda. Se o objetivo for valor imediato, 1, 2 e 5 entregam; 3 e 4 são preparação para parceiro/coorte.
