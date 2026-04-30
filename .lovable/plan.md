## Objetivo
Restaurar a busca real de evidências (Perplexity e PubMed), garantir que elas sejam persistidas como estudos/triplets pendentes e fazer com que o gêmeo digital e a projeção comparativa passem a refletir essas evidências provisórias de forma confiável.

## Diagnóstico encontrado
1. O problema principal hoje não é apenas “qualidade de busca”: as funções de backend envolvidas no gap-fill não estão acessíveis no ambiente atual.
   - `kg-evidence-gap-fill`, `perplexity-health` e `provider-health` retornam `404 NOT_FOUND` quando chamadas diretamente.
   - Não há logs recentes dessas funções, o que confirma que elas não estão publicadas/ativas neste backend.
   - Isso explica o erro visto na tela: `Failed to send a request to the Edge Function`.
2. Mesmo depois de restaurar as funções, há um segundo gargalo estrutural:
   - o pet em questão tem `pet_conditions.condition_id = null` para Osteoarthritis / Hip Dysplasia / Overweight;
   - embora existam correspondências canônicas em `health_conditions`.
   - Isso enfraquece o encadeamento entre condição clínica, coverage do KG e projeção.
3. Há ainda um terceiro gargalo de descoberta:
   - só 8 de 30 nutracêuticos possuem `name_en` preenchido;
   - o gap-fill depende de nomes canônicos em inglês para montar pares de busca no PubMed/Perplexity.
4. O preview da projeção hoje considera apenas pendentes com `approval_chain.source = 'pubmed_gap_fill'`; os pendentes vindos de `perplexity_gap_fill` ainda não entram na projeção do gêmeo digital.
5. A configuração de Perplexity no banco não está persistida no ambiente atual (`perplexity_gap_fill_model` ausente) e não há registro de chave Perplexity armazenada na tabela de configurações; portanto a interface administrativa hoje pode dar uma falsa sensação de prontidão.

## O que vou implementar
### 1) Restaurar o backend real do gap-fill
- Garantir que as funções `kg-evidence-gap-fill`, `kg-missing-triplets`, `perplexity-health`, `provider-health` e `project-pet-trajectory` estejam corretamente publicadas no backend ativo.
- Validar CORS, autenticação e disponibilidade real após publicação.
- Confirmar via logs e chamadas diretas que o botão da UI volta a acionar o backend de fato.

### 2) Corrigir a base clínica e canônica usada na busca
- Criar uma migração para preencher `pet_conditions.condition_id` quando houver match inequívoco por `name`/`name_en` em `health_conditions`.
- Criar uma migração para completar `nutraceuticals.name_en` faltantes a partir dos nomes PT existentes, começando pelos compostos que entram nas recomendações clínicas.
- Opcionalmente reforçar o fluxo futuro para que novos registros de condição e nutracêutico já nasçam canonicalizados.

### 3) Tornar o gap-fill mais resiliente e auditável
- Melhorar `kg-evidence-gap-fill` para registrar explicitamente por par:
  - qual provider foi tentado;
  - se falhou por 401/403/429/5xx;
  - se o par não pôde ser pesquisado por falta de `name_en`/`condition_id`;
  - se não houve PMID válido;
  - se houve evidência encontrada, mas não persistida.
- Devolver mensagens de erro mais acionáveis para a UI, separando:
  - função indisponível,
  - chave ausente,
  - modelo sem acesso,
  - sem resultados científicos,
  - falha de persistência.

### 4) Integrar Perplexity e PubMed até a projeção temporal
- Atualizar `project-pet-trajectory` para incluir no modo preview tanto:
  - `pubmed_gap_fill`
  - quanto `perplexity_gap_fill`
- Garantir que os triplets provisórios relevantes para o pet realmente alterem `coverage_by_condition`, `years_gained` e o contraste entre controle vs. tratado.
- Ajustar o subgrafo do paciente e o Digital Twin para mostrar claramente quando a melhora vem de evidência provisória ainda não curada.

### 5) Melhorar a UX de diagnóstico na tela do pet
- Evoluir `EvidenceGapCard` para exibir estados distintos:
  - backend indisponível;
  - gap-fill sem pares pesquisáveis;
  - Perplexity indisponível, mas fallback PubMed ativo;
  - evidência encontrada e pendente de curadoria;
  - preview aplicado ao gêmeo digital.
- Adicionar um resumo mais útil de “por que não encontramos evidência” por condição/composto.
- Manter tudo bilíngue e com bump de `I18N_VERSION`.

### 6) Validar ponta a ponta com o pet atual
Vou validar com o pet `eb31244d-563c-4ddd-845d-09b900f38083` este fluxo:
```text
Pet conditions canonizadas
→ pares composto × condição gerados
→ Perplexity tenta primeiro
→ PubMed fallback entra se necessário
→ estudos e triplets pending persistidos
→ preview pendente entra na projeção
→ Digital Twin mostra contraste tratado vs. controle com base nessas novas evidências
```

## Arquivos e áreas que devem ser alterados
### Backend / funções
- `supabase/functions/kg-evidence-gap-fill/index.ts`
- `supabase/functions/project-pet-trajectory/index.ts`
- `supabase/functions/perplexity-health/index.ts`
- `supabase/functions/provider-health/index.ts`
- `supabase/functions/kg-missing-triplets/index.ts`
- `supabase/config.toml`

### Frontend
- `src/components/pet/EvidenceGapCard.tsx`
- `src/components/pet/DigitalTwinDog.tsx`
- `src/components/pet/PatientKnowledgeSubgraph.tsx`
- `src/hooks/useKgEvidenceGapFill.ts`
- `src/hooks/usePetTrajectoryProjection.ts`
- possivelmente `src/components/administrador/configuracoes/PerplexityStatusCard.tsx`
- possivelmente `src/components/administrador/configuracoes/ProviderHealthButton.tsx`

### Banco / migrações
- migração para backfill de `pet_conditions.condition_id`
- migração para backfill/correção de `nutraceuticals.name_en`

### i18n e documentação
- `src/i18n.ts`
- `src/locales/pt/translation.json`
- `src/locales/en/translation.json`
- `ARCHITECTURE.md`
- `docs/CURRENT_STATE.md`
- `CHANGELOG.md`

## Detalhes técnicos
- A primeira correção crítica é operacional: publicar/reativar as funções ausentes no backend atual.
- O código do frontend já tenta chamar `kg-evidence-gap-fill`, mas hoje a função não existe no ambiente, então a chamada morre antes de qualquer lógica de busca.
- O gêmeo digital usa `project-pet-trajectory`; no preview ele só considera pendentes de `pubmed_gap_fill`. Isso será ampliado para também consumir `perplexity_gap_fill`.
- A canonicalização do inglês é obrigatória porque o pipeline depende de `name_en` para construir consultas consistentes e para casar condições/compostos com o KG.
- Vou evitar qualquer alteração visual fora das telas já envolvidas neste fluxo.

## Resultado esperado
Ao final, o botão de busca de evidências volta a funcionar de verdade, os estudos/triplets passam a ser inseridos, a pré-visualização provisória afeta a projeção temporal e o gêmeo digital finalmente mostra um contraste tratado vs. controle sustentado por evidências recém-descobertas — sem esconder se elas ainda estão pendentes de curadoria.