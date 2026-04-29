## Diagnóstico

Você tem **dois componentes anatômicos** no perfil do pet, e eles fazem coisas muito diferentes:

| Componente | Onde aparece | O que mostra hoje |
|---|---|---|
| `BiologicalTimeline.tsx` (com `DogAnatomySVG`) | Coluna direita do perfil (o print que você enviou) | Comparação **sem vs. com protocolo**, com slider temporal "Projetar até", regiões coloridas por severidade, ★ protegido, KPI de anos ganhos. **Já tem comparação ano a ano.** |
| `DigitalTwinDog.tsx` | Aba nova "Digital Twin" (que acabamos de criar) | Apenas uma silhueta com **pontinhos pulsantes** das condições atuais. **Não tem eixo temporal, não tem cenário "com protocolo", não consome a projeção da IA.** É estático. |

Ou seja: a sua percepção está correta. O `DigitalTwinDog` hoje é só uma "vista decorativa" do estado atual — ele recebe `conditions`, `petName`, `petBreed`, `petAge` e nada mais. **Não está plugado** no `usePetTrajectoryProjection`, no snapshot da análise VetGraphRAG, nem no `recommendation_compounds`. Por isso não muda nada ao longo dos anos nem entre os cenários.

E sim, **temos os dados** para fazer essa inferência. O hook `usePetTrajectoryProjection` (edge function `project-pet-trajectory`, Gemini 2.5 Pro grounded no KG) já retorna, para cada ano de 0 até `max_years_ahead = 8`:
- `years_with_protocol[]` e `years_without_protocol[]` (cenários separados)
- por ano: `biological_age`, `expected_remaining_years`, `existing_conditions[]` com `projected_severity_score/label`, `new_conditions[]` com `probability`
- `coverage_by_condition` (quais condições estão "protegidas" pelo stack — vira o ★)
- `citations` (KG, raça, Gompertz)

O `BiologicalTimeline` já consome tudo isso. O `DigitalTwinDog` simplesmente ignora.

## O que vou fazer

Refatorar o `DigitalTwinDog` para virar um **gêmeo digital temporal e comparativo de verdade**, reutilizando exatamente a mesma fonte de dados do `BiologicalTimeline` (sem duplicar lógica de IA — chamamos o mesmo hook, que é cacheado).

### Novo layout do `DigitalTwinDog`

```text
┌──────────────────────────────────────────────────────────────┐
│ Gêmeo Digital — Pituca · Golden Retriever · 9a               │
│ [Aos 11 anos]                              Confiança: alta   │
├──────────────────────────────────────────────────────────────┤
│   SEM PROTOCOLO                  COM PROTOCOLO               │
│   restantes: 4.2a                restantes: 6.0a (+1.8)      │
│  ┌──────────────┐               ┌──────────────┐             │
│  │  🐕 silhueta │               │  🐕 silhueta │             │
│  │   amarelo    │               │   amarelo    │             │
│  │   laranja    │               │   verde★     │             │
│  │   vermelho   │               │   laranja    │             │
│  └──────────────┘               └──────────────┘             │
│   • Osteoartrite (severa)        • Osteoartrite (moderada)★  │
│   • Disp. Quadril (severa)       • Disp. Quadril (moderada)★ |
│   • +DCC (62% novo)              • +DCC (28% novo)           │
├──────────────────────────────────────────────────────────────┤
│ Idade biológica:  12.4a   →   10.1a   (–2.3a com protocolo)  │
│ Anos restantes:    4.2a   →    6.0a   (+1.8a com protocolo)  │
├──────────────────────────────────────────────────────────────┤
│ Projetar até: [Hoje ●─────────────────────● +8a]             │
│              9a    11a    13a    15a    17a                  │
└──────────────────────────────────────────────────────────────┘
```

Pontos visuais por região anatômica (mesma `bodyRegionMap` que já existe), com:
- **cor** = severidade projetada **naquele ano** (`mild` amarelo · `moderate` laranja · `severe` vermelho)
- **anel tracejado âmbar** = condição emergente (probabilidade ≥ 25%)
- **★ verde** = condição coberta pelo stack (do `coverage_by_condition`)
- **tooltip** mostra nome, severidade no ano, probabilidade (se nova), e compostos âncora que protegem

### Como cada parte é alimentada (sem mock)

| Elemento | Fonte real |
|---|---|
| Lista de condições por ano | `years_with_protocol[i].existing_conditions` + `new_conditions` |
| Severidade por região | `projected_severity_label` (ou derivada de `projected_severity_score`) |
| Marcação ★ protegido | `coverage_by_condition[].kg_covered` (lookup por nome) |
| Idade biológica / restantes | `biological_age`, `expected_remaining_years` por ano |
| Anos ganhos | `years_gained` (já vem da edge function) |
| Estado bloqueado | `usePetClinicalAnalysisSnapshot` — se `status !== 'complete'`, mostra o mesmo card "Aguardando análise VetGraphRAG" do `BiologicalTimeline` |

### Mudanças concretas

1. **`src/components/pet/DigitalTwinDog.tsx`** — reescrita:
   - Receber também `petId` (passar da `PetProfilePage`).
   - Chamar `usePetClinicalAnalysisSnapshot(petId)` e `usePetTrajectoryProjection(petId, recommendedCompounds, hasSnapshot)`.
   - Adicionar estado local `yearsAhead` (slider 0..8).
   - Para cada cenário (with/without): pegar `years[safeIndex]`, montar `mappedConditions` com posição (`bodyRegionMap`) + severidade do ano + flag `isNew` + flag `protected`.
   - Renderizar **duas silhuetas lado a lado** (grid `md:grid-cols-2`) usando o `<img dogSilhouette>` que já existe.
   - KPIs: idade biológica, anos restantes, delta com protocolo (mesmas regras numéricas do `BiologicalTimeline`).
   - Slider idêntico ao do `BiologicalTimeline` (`Slider` shadcn, marcas a cada 1/4 do `maxSlider`).
   - Estados: `locked` (sem snapshot), `loading` (snapshot ok mas projeção carregando), `ready`, `noKgBenefit` (banner âmbar).

2. **`src/pages/veterinario/PetProfilePage.tsx`**:
   - Passar `petId={id}` (e `onRequestAnalysis={handleAnalyzeWithKG}`, `isAnalyzing={analyzing}`) para o `DigitalTwinDog`, mesmo padrão que já se usa para o `BiologicalTimeline`.

3. **`src/i18n.ts`** — incrementar `I18N_VERSION` (1.41.0 → 1.41.1).

4. **`src/locales/pt/translation.json`** e **`en/translation.json`** — novas chaves em `petProfile.digitalTwin.*`:
   - `compareTitle`, `scenarioWithout`, `scenarioWith`, `withProtocolLabel`
   - `projectionLabel`, `today`, `yearsFromNow`
   - `biologicalAge`, `chronologicalAge`, `remainingYears`, `yearsGained`
   - `lockedTitle`, `lockedBody`, `aiLoading`, `noBenefitBanner`
   - `legend.future`, `legend.protected`, `legend.severe/moderate/mild`
   - Reaproveitar onde fizer sentido as chaves existentes em `petProfile.biologicalTimeline.*` (importando os mesmos textos).

5. **CHANGELOG.md** — entrada em `[Unreleased] / Changed`:
   - `<!-- area: clinical · status: feature · i18n: pt+en -->`
   - "Digital Twin do pet agora exibe comparação temporal sem vs. com protocolo, alimentado pelo `usePetTrajectoryProjection` (mesma fonte do BiologicalTimeline). Inclui slider de projeção 0–8 anos, KPIs de idade biológica/anos ganhos e marcação ★ de condições protegidas pelo stack. Antes mostrava só estado atual, sem variação temporal."
   - Rodar `npm run sync:changelog`.

6. **`mem://index.md`** — atualizar a linha do `Patient Knowledge Subgraph`/`Vet Recommendation` *(não obrigatório, só se fizer sentido)*; criar memória curta `mem://features/digital-twin-temporal-comparison` descrevendo a fonte de dados única (hook `usePetTrajectoryProjection`) para evitar futura duplicação de lógica.

### Decisões já tomadas (sem precisar perguntar)

- **Mesma fonte de dados** que o `BiologicalTimeline` — não criamos pipeline paralelo, não geramos números diferentes do que o painel ao lado mostra. Coerência total.
- **Não vamos animar a silhueta entre anos** (transições suaves dos pontos sim, animação de "envelhecimento" do desenho não — ficaria caro e fugaria do escopo do KG).
- **Mantemos a regra `is_demo`/snapshot**: se o pet ainda não tem snapshot VetGraphRAG, o Digital Twin mostra o mesmo card "Aguardando análise" — nada de inventar projeção.

### Resultado esperado

Quando você abrir a aba "Digital Twin" e arrastar o slider, vai ver as duas silhuetas evoluírem lado a lado: condições atuais ficando mais severas, novas condições aparecendo (com anel tracejado), e do lado direito as mesmas condições aparecendo menos severas/protegidas (★) onde o stack do KG tem cobertura — exatamente o que o `BiologicalTimeline` já demonstra, mas com a estética anatômica do Digital Twin.