## Diagnóstico

Hoje os dois cães parecem idênticos porque:

1. **O PNG anatômico é raster** — não dá para mudar a cor dos órgãos pintados na imagem. Hoje só desenhamos **elipses/glifos flutuando por cima** (coração pulsando, faíscas no fígado, etc.). Quando a doença é leve, esses overlays são quase invisíveis sobre o desenho colorido do órgão.
2. **`yearWithout` cai em fallback para `yearWith`** quando o backend devolve poucos dados — então o cão "sem protocolo" mostra exatamente os mesmos marcadores do "com protocolo", só sem a estrela ★.
3. **Não há gradiente temporal** — severidade é categórica (mild/moderate/severe), não interpola conforme o slider de ano avança nem clareia conforme o protocolo "cura".

Resultado: o usuário vê dois Goldens iguais.

## Solução proposta

### 1. Pintar o órgão de verdade (não só uma elipse por cima)

Para cada órgão clinicamente relevante (cérebro, coração, pulmões, fígado, rins, intestinos, pâncreas, estômago, bexiga, articulações, coluna, pele) vou adicionar um **`<path>` SVG traçando o contorno real do órgão no PNG** (calibrado uma vez sobre o `dog-anatomy.png` em `viewBox 1000x1000`).

Esse path fica **invisível quando saudável** (fill transparente). Quando há doença, recebe:

```text
fill = cor da severidade (amarelo → laranja → vermelho)
mix-blend-mode: multiply        ← deixa o órgão original aparecer por baixo, mas tingido
opacity = f(severidade, tempo, protocolo)
```

`multiply` é a chave: o desenho original do órgão (rosa do coração, marrom do fígado) **mistura** com o overlay, então o coração doente fica realmente vermelho-escuro e o fígado doente fica marrom-amarelado, em vez de uma bolha colorida flutuando por cima.

### 2. Escalar com o tempo (slider de anos)

A severidade hoje é discreta. Vou adicionar um campo `intensity` (0-1) calculado por ano:

```text
intensityWithout(ano) = severidadeBase + (ano / 8) * progressãoEsperada     ← escurece
intensityWith(ano)    = severidadeBase * (1 - eficáciaProtocolo * cura(ano))  ← clareia
```

A `opacity` do overlay (e a saturação da cor via filtro `<feColorMatrix>`) responde a `intensity`. Quando o slider vai a `ano 0`, os dois cães ficam quase iguais. Quando vai a `ano 5`, o cão **sem protocolo** fica visivelmente mais escuro nos órgãos afetados, e o **com protocolo** mantém ou clareia.

Cores por intensidade:

```text
0.0  → transparente (saudável)
0.3  → amarelo translúcido (alerta)
0.55 → laranja médio
0.8  → vermelho saturado
1.0  → vermelho escuro + halo pulsante
```

### 3. Diferenciar cão "com" vs "sem" protocolo de verdade

- Remover o fallback que reusa `yearWith` para `yearWithout` (ou aplicar `intensity *= 1.4` no sem-protocolo como degradação esperada).
- No "com protocolo": órgãos protegidos recebem **filtro verde sutil** (`<feColorMatrix>` que injeta hue 160°) + estrela ★, e a `intensity` decai ano a ano em vez de subir.

### 4. Tooltip e legenda permanecem

O `<path>` invisível também serve de área interativa para o `Tooltip` (substitui as elipses transparentes atuais). Legenda nova: "🟡 alerta · 🟠 progressão · 🔴 crítico · ★ protegido pelo protocolo".

## Detalhes técnicos

- **Arquivo principal**: `src/components/pet/DogAnatomySVG.tsx` — adicionar `ORGAN_PATHS: Record<AnatomyRegionId, string>` com path data calibrado, novo prop `intensity` em `RegionState`.
- **Calibração dos paths**: faço uma única vez visualmente sobre `src/assets/dog-anatomy.png` (cérebro, coração, fígado, pulmões, rins, intestinos, pâncreas, estômago, bexiga, articulações — ~12 paths). Para juntas (ombro/cotovelo/joelho/quadril/jarrete), uso círculos pequenos no contorno real.
- **`DigitalTwinDog.tsx`**: 
  - `buildMarkers` passa a calcular `intensity` (0-1) por ano usando `projected_severity_score`.
  - Remover fallback `yearWithout → yearWith`; em vez disso, gerar `markersWithout` a partir de `yearWith` mas com `intensity *= 1.3` e sem `protectedHere`.
  - Passar `intensity` no `regionStates` para o SVG.
- **Blend modes**: `style={{ mixBlendMode: 'multiply' }}` no `<path>` colorido. Para o halo verde de proteção, `mixBlendMode: 'screen'` numa camada separada.
- **Sem mudança de schema**: puramente render.
- **i18n**: adiciono 2 chaves novas (`legend.alert`, `legend.progression`) em PT/EN, incremento `I18N_VERSION`.
- **Changelog**: 1 entrada `area: vet · status: improvement` + `npm run sync:changelog`.

## Resultado visual esperado

```text
Ano 0:                      Ano 4 (SEM):            Ano 4 (COM):
[cão idêntico nos dois]     fígado marrom-vermelho  fígado quase normal
                            coração vermelho        coração rosa pálido + ★
                            rins manchados          rins limpos + ★
                            intestino inflamado     intestino normal + ★
```

## Risco / fora de escopo

- Não mexo no pipeline, no chat, nem no `BiologicalTimeline` (que continua usando o mesmo `DogAnatomySVG` — `intensity` é opcional, default = derivado da severidade, retrocompatível).
- Se algum path ficar desalinhado, faço ajuste pontual de coordenadas — sem regerar o PNG.

Posso implementar assim?
