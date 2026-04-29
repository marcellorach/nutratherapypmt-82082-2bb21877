## Objetivo

Promover a **Biological Timeline** de um widget espremido na coluna direita para uma **aba dedicada e nobre** dentro do bloco de análise da VetGraphRAG, ocupando toda a largura útil da área central. Reorganizar a informação interna para tirar proveito do espaço extra (hoje tudo está empilhado verticalmente em ~420px de largura).

## Mudanças no layout do `PetProfilePage`

1. **Adicionar nova aba** ao `Tabs` de "Analysis Results" (linhas 700-753), ao lado de Recommendations / Biological Pathway / Projection:
   - `Trajectory` (PT: "Trajetória Biológica" / EN: "Biological Trajectory") com ícone `Hourglass` ou `Activity`.
   - Posicioná-la como **2ª aba** (logo após Recommendations) por ser o output clínico de maior impacto visual.
2. **Remover** a `BiologicalTimeline` da coluna direita (linhas 762-781).
3. A coluna direita passa a hospedar apenas o `PetClinicalChat`, agora podendo expandir verticalmente com `lg:sticky lg:top-4` e altura mínima maior (`min-h-[640px]`), ganhando protagonismo como assistente.
4. O `Tabs` de análise mantém `defaultValue="recommendations"`; quando uma análise nova termina, podemos opcionalmente trocar para `trajectory` via `value`/`onValueChange` controlado (decisão menor, mantenho `defaultValue` por enquanto).

## Redesenho interno da `BiologicalTimeline` para o novo espaço

Hoje o componente tem 6 blocos empilhados (header KPIs, banner sem-benefício, comparação 2 cães, legenda+cobertura, slider, caveats, citações). Em ~1100px de largura conseguimos uma grade clínica:

```text
+---------------------------------------------------------------+
| HEADER  (título · subtitle pet · badge "baseado em análise")   |
+---------------------------------------------------------------+
| KPIs em 4 colunas:                                             |
|  Idade biológica | Idade cronológica | Anos restantes | Ganho  |
+---------------------------------------------------------------+
| [ Banner "sem benefício KG"  -- só quando aplicável ]          |
+----------------------------+----------------------------------+
| COMPARAÇÃO LADO A LADO     |  PAINEL DE EVIDÊNCIA             |
|  (50%)                     |  (50%)                           |
|  Sem protocolo  | Com      |  - Cobertura KG (X/Y)            |
|  [Dog SVG]      | [Dog]    |  - Caveats clínicos              |
|  Conditions     | Conds    |  - Citações usadas (lista)       |
|  list ampliada  | list     |  - Legenda de glifos             |
+----------------------------+----------------------------------+
| SLIDER (full width)  hoje · +N anos ·  marcadores de idade     |
+---------------------------------------------------------------+
| Disclaimer + toggle Debug                                      |
+---------------------------------------------------------------+
```

Pontos de design:
- **KPIs em grid de 4** em vez dos 3 atuais empilhados — tipografia maior (text-2xl em vez de text-xl) e ícones com mais respiro.
- **Comparação dos dois cães** ganha o dobro de altura: cada dog SVG passa a usar `aspect-[4/3]` em vez de altura fixa pequena, com a `ConditionsMiniList` exibindo até **8 itens** (em vez de 5) sem truncar.
- **Painel de evidência à direita** consolida o que hoje está espalhado embaixo (cobertura KG, caveats, citações, legenda) em um card único com seções separadas por `Separator`. Isso responde diretamente à crítica do usuário: o conteúdo cresce com o espaço em vez de ficar mais comprido.
- **Slider** ocupa a largura total com marcadores de idade mais legíveis (3-5 marcadores em vez de só início/meio/fim).
- Em telas `< lg` (mobile/tablet), grade colapsa para uma coluna mantendo a ordem atual.

## Arquivos a editar

- `src/pages/veterinario/PetProfilePage.tsx` — adicionar `TabsTrigger` + `TabsContent` "trajectory", remover bloco da coluna direita, ajustar `min-h` do chat.
- `src/components/pet/BiologicalTimeline.tsx` — refatorar layout interno para grade 2 colunas no breakpoint `lg`, mover blocos para o painel de evidência, ampliar KPIs e área dos cães.
- `src/locales/pt/translation.json` e `src/locales/en/translation.json` — adicionar:
  - `petProfile.analysisTabs.trajectory` ("Trajetória Biológica" / "Biological Trajectory")
  - `petProfile.biologicalTimeline.evidencePanelTitle` ("Evidência clínica" / "Clinical evidence")
  - `petProfile.biologicalTimeline.scenarioWithout` / `scenarioWith` (rótulos maiores para os cards)
- `src/i18n.ts` — bump `I18N_VERSION` para `1.37.0` (nova feature de UI).

## Não faz parte deste plano

- Mudar a lógica do snapshot, do edge function `project-pet-trajectory` ou do gating "aguardando análise" — tudo isso já foi implementado e continua válido.
- Mexer nas outras abas (Recommendations / Pathway / Projection).
- Mexer no `PetClinicalChat` além de aumentar sua altura mínima.
