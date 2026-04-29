## Contexto dos 3 problemas

**(a) "Buscar evidências" não retornou nada**
A função `kg-evidence-gap-fill` não tem **nenhum log** no servidor — o clique nunca chegou a executar do lado backend (ou falhou antes do primeiro `console.log`). Hipóteses prováveis:
1. A função foi criada mas o deploy automático ainda não a registrou.
2. Erro de auth/CORS silencioso no `supabase.functions.invoke` (o toast de erro pode ter ficado fora do viewport).
3. Falha ao discoverar pares (sem `name_en` em condições/nutracêuticos do pet) → retorna 200 com `pairs_searched: 0` e o toast aparece como "sucesso com 0".

**(b) Gêmeos não mudam mesmo após gap-fill**
Por design: triplets do gap-fill entram com `curation_status = 'pending'` e **só impactam o Digital Twin após aprovação manual**. Isso é correto (governança), mas hoje o admin não consegue ver o efeito potencial sem aprovar. Falta um modo **preview** ("E se eu aprovasse esses pendentes?").

**(c) Sumiu a listinha de condições sob as silhuetas**
O `BiologicalTimeline` tem `<ConditionsMiniList>` debaixo de cada silhueta — listando condições projetadas com severidade, "novo X%", "★ protegido". O novo `DigitalTwinDog` (que substituiu visualmente esse bloco no perfil) só mostra "4 marcadores". Precisa portar a mini-lista.

---

## Plano

### 1. Diagnóstico + robustez do gap-fill (problema a)

**`src/components/pet/EvidenceGapCard.tsx`**
- Mostrar mensagem específica quando `pairs_searched === 0` ("Não encontrei pares (compound × condition) sem cobertura — pode ser que faltem `name_en` no perfil ou todos já tenham evidência ≥0.6").
- Mostrar contagem detalhada no toast: `X pares pesquisados · Y estudos novos · Z triplets pendentes`.
- Capturar e exibir mensagens de erro do Supabase com mais detalhe (status HTTP, mensagem da função).
- Após executar, mostrar inline um pequeno **resumo dos `details`** (até 5 pares, com status: `ok | no_pubmed_results | assessment_failed | error`) para o admin entender o que aconteceu.

**`supabase/functions/kg-evidence-gap-fill/index.ts`**
- Adicionar `console.log` no início (`req.method`, body resumido, userId), no fim, e em cada falha — para que sempre exista log.
- Tornar o `pubmedSearch` mais tolerante: se a query restritiva (`canine[Title/Abstract] OR dog…`) retorna 0, fazer fallback sem o filtro de espécie e marcar `species_context: ['unspecified']` no triplet resultante.
- Aumentar `max_pairs` default para 8 mas filtrar a shortlist de compounds para os que estão no **stack recomendado do pet** (snapshot), não os 40 primeiros aleatórios. Isso aumenta drasticamente a chance de hit.
- Garantir resposta com `Cache-Control: no-store` e CORS sempre incluído nos `catch`.

### 2. Preview "what-if" de pendentes no Digital Twin (problema b)

**`supabase/functions/project-pet-trajectory/index.ts`** (leitura primeiro para confirmar shape)
- Aceitar novo flag opcional `include_pending_gap_fill: boolean` (default `false`).
- Quando `true`, considerar também triplets com `curation_status = 'pending' AND approval_chain.source = 'pubmed_gap_fill'` no cálculo de `coverage_by_condition` e `years_gained`. Marcar essas contribuições com `provisional: true` em `years_gained_breakdown`.

**`src/hooks/usePetTrajectoryProjection.ts`**
- Adicionar parâmetro opcional `includePending?: boolean` que entra na query key e no body.

**`src/components/pet/DigitalTwinDog.tsx`**
- Para admin: novo toggle pequeno "👁 Pré-visualizar com pendentes (admin)" acima da grid de KPIs. Quando ligado, refaz a query com `includePending: true` e adiciona um banner sutil "Visualização provisória — inclui N triplets ainda pendentes de aprovação".
- A barra "+ X anos" do KPI mostra um sub-rótulo `(provisório)` quando o toggle está ligado.

### 3. Restaurar mini-lista de condições sob cada silhueta (problema c)

**`src/components/pet/DigitalTwinDog.tsx`**
- Adicionar componente local `ConditionsMiniList` (≈40 LOC) replicando o do `BiologicalTimeline`:
  - Itera `markersWith` / `markersWithout`.
  - Cada item: dot de severidade + nome + badge "Novo X%" se `isNew` + "★ protegido" se `protectedHere`.
  - Lista com `max-h-[180px] overflow-y-auto`, vazia mostra `t('petProfile.biologicalTimeline.noProjectedRisks')`.
- Renderizar uma instância sob cada silhueta (substituindo a linha "4 marcadores").

### 4. i18n

Bumpar `src/i18n.ts` versão `1.41.2` → `1.41.3` e adicionar chaves em PT/EN:
- `evidenceGap.noPairsFound`, `evidenceGap.detailsTitle`, `evidenceGap.detailStatus.{ok|no_pubmed_results|assessment_failed|error|dry_run}`
- `petProfile.digitalTwin.previewPendingToggle`, `petProfile.digitalTwin.previewPendingBanner` (com `{{count}}`)
- `petProfile.digitalTwin.provisional`

### 5. Documentação
- Entrada em `CHANGELOG.md` `[Unreleased]` (Fixed + Added) com `<!-- area: digital-twin · status: improvement · i18n: 1.41.3 -->`.
- Rodar `npm run sync:changelog`.
- Atualizar memória `mem://architecture/kg-evidence-gap-fill-pipeline` com o modo preview e o fallback de espécie.

### 6. Como testar
1. Recarregar a página do pet (Ctrl+Shift+R).
2. Clicar em "Buscar evidências no PubMed" e observar o toast detalhado + lista de pares processados que aparecerá no card.
3. Conferir os logs de edge (agora vão existir) — caso ainda dê erro, vou ver a causa exata.
4. Ligar o toggle "Pré-visualizar com pendentes" — KPI deve mostrar `+X.Y a (provisório)` se o gap-fill encontrou algo aprovável.
5. Verificar que sob cada silhueta voltou a lista de condições.

---

## Arquivos afetados

```text
edit  src/components/pet/EvidenceGapCard.tsx          (toast detalhado + resumo inline)
edit  src/components/pet/DigitalTwinDog.tsx           (mini-lista + toggle preview)
edit  src/hooks/usePetTrajectoryProjection.ts         (param includePending)
edit  supabase/functions/kg-evidence-gap-fill/index.ts (logs, fallback espécie, stack do pet)
edit  supabase/functions/project-pet-trajectory/index.ts (suporte a pending preview)
edit  src/i18n.ts                                     (1.41.3)
edit  src/locales/pt/translation.json + en/translation.json
edit  CHANGELOG.md                                    (entrada Unreleased)
edit  mem://architecture/kg-evidence-gap-fill-pipeline
regen .lovable/CONTEXT.md, src/data/projectChangelog.generated.ts (npm run sync:changelog)
```

Aprovando, eu implemento tudo de uma vez.