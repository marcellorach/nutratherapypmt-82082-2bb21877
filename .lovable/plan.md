## Objetivo

Hoje, no Digital Twin (`/veterinario/pet/...`), as doenças aparecem como **bolinhas amarelas flutuando fora do corpo** do Golden. Você quer que elas atinjam os **órgãos internos** dentro do contorno transparente do cão. Isso é totalmente possível — e parte do trabalho já existe no projeto.

## O que já temos

- `DogAnatomySVG.tsx` já mapeia **28 regiões anatômicas** (cérebro, olhos, coração, pulmões, fígado, rins, pâncreas, intestinos, bexiga, coluna cervical/torácica/lombar, ombro/cotovelo/joelho/quadril, pele, etc.) em coordenadas precisas sobre o silhueta lateral, com glifos animados por severidade (pulsação, faíscas, halo de "novo risco", estrela de proteção). Usado hoje em `BiologicalTimeline`.
- `DigitalTwinDog.tsx` usa uma versão **muito mais simples**: PNG da silhueta com 40% de opacidade + bolinhas posicionadas por `%` x/y (`bodyRegionMap`). É essa a tela do seu screenshot.

A solução é **unificar** os dois e elevar o nível visual com uma ilustração anatômica nova.

## O que mudar

### 1. Nova ilustração anatômica (asset)
Gerar um SVG/PNG do mesmo Golden lateral, **transparente**, com órgãos internos desenhados **em linhas finas e cinza muito claro** (não coloridos) — como um diagrama veterinário sutil:

```text
contorno do corpo (cinza claro)
 ├─ crânio + cérebro (silhueta interna)
 ├─ olho, orelha
 ├─ coluna cervical / torácica / lombar (vértebras)
 ├─ coração + pulmões (caixa torácica)
 ├─ fígado, estômago, pâncreas, baço
 ├─ rins (par), adrenais, bexiga
 ├─ intestino delgado/grosso (serpentina)
 ├─ articulações: ombro, cotovelo, carpo, quadril, joelho, jarrete
 └─ tireoide (pescoço)
```

Estilo: traço fino #cbd5e1 / preenchimento branco-creme translúcido. Os órgãos ficam **visíveis mas discretos** quando saudáveis; só "acendem" com cor quando há doença mapeada.

### 2. Reutilizar / estender `DogAnatomySVG`
O componente já sabe pintar cada órgão pela severidade. Vou:
- Trocar o `<image href={dogSilhouette}>` pelo novo asset anatômico transparente (mesmo `viewBox 1000x1000`, então as coordenadas já calibradas continuam válidas).
- Confirmar/ajustar 2-3 coordenadas se a nova ilustração deslocar algum órgão (rápido).
- Manter os glifos atuais: pulsação no coração, ondas no cérebro, manchas no fígado/rins, serpentina no intestino, marcas no espinho, etc.

### 3. Substituir o renderer no Digital Twin
Em `DigitalTwinDog.tsx`:
- Remover `renderSilhouette` (imagem + bolinhas absolutas).
- Converter os `ScenarioMarker[]` em `regionStates: Partial<Record<AnatomyRegionId, RegionState>>` (já é o formato de `DogAnatomySVG`). Reusar a lógica existente em `BiologicalTimeline` (`regionsWithout` / `regionsWith`).
- Renderizar `<DogAnatomySVG regionStates={...} showProtectionAura={protegido} />` nos dois cards "sem protocolo" / "com protocolo".
- Manter o tooltip por órgão (já implementado em `DogAnatomySVG`) e os textos "X markers / Y protected" embaixo.

### 4. Mapeamento doença → órgão
A tabela `bodyRegionMap` (cerca de 30 termos PT/EN) será trocada por um mapeamento **doença → AnatomyRegionId** consistente com o que já existe em `services/anatomy-region-map.ts`. Cobertura: cardiopatias→heart, hepáticas→liver, renais→kidneys, disfunção cognitiva/epilepsia→brain, displasias→hips/elbow, IBD/pancreatite→intestines/pancreas, hipotireoidismo→thyroid, dermatites→skin, sistêmicas (câncer, senescência, inflamação crônica)→systemic, etc. (PT + EN).

### 5. Bilíngue + design tokens
- Sem strings novas hardcoded; chaves `t()` para "órgão afetado", "protegido", "novo risco" — algumas já existem em `petProfile.digitalTwin.*` e `petProfile.severity.*`.
- Incrementar `I18N_VERSION` se eu adicionar chaves.
- Cores via tokens HSL semânticos (mild = amber, moderate = orange, severe = red, protected = emerald) — já é o padrão de `SEVERITY_FILL`.

## Resultado visual esperado

```text
ANTES:                              DEPOIS:
  ●  ●                              ┌─────────────────────┐
   \  \    ┌─Golden──┐              │   ⌒ cérebro (●)     │
    `──→  body silhouette (40%)     │  ┌─────coluna───┐   │
        2 markers                   │  │ ♥ coração ●  │   │
                                    │  │ ▓ fígado ●   │   │
                                    │  │ ◯◯ rins      │   │
                                    │  └──────────────┘   │
                                    │   articulações ●    │
                                    └─────────────────────┘
                                    Doença ilumina o órgão dentro
```

Cão saudável → traços cinza discretos. Cão com cardiomiopatia → coração pulsa em vermelho dentro do tórax. Com protocolo → mesmo coração ganha halo verde "★ protegido".

## Detalhes técnicos

- **Asset**: gerar `src/assets/dog-anatomy.png` (1000x1000, fundo transparente) via `imagegen` com prompt "lateral Golden Retriever line drawing, body outline in thin pencil grey, internal organs (brain, heart, lungs, liver, kidneys, intestines, bladder) faintly visible inside the body as anatomical diagram, joints marked, white background transparent, museum quality medical illustration". QA visual no `/mnt/documents/` antes de mover para `src/assets`.
- **Compatibilidade**: `BiologicalTimeline` continua funcionando porque `DogAnatomySVG` mantém a mesma API.
- **Sem mudança de schema/DB**: puramente UI.
- **Changelog**: 1 entrada em `[Unreleased]` (`area: vet · status: improvement`) + `npm run sync:changelog`.

## Risco / fora de escopo

- Não vou mexer no chat, no pipeline clínico, nem em `bodyRegionMap` em outros lugares fora do Twin/Timeline.
- Se a ilustração gerada não ficar boa após 2 tentativas, faço fallback usando a `dog-silhouette.png` atual + camada de órgãos desenhados em SVG (paths simples) — mesmo resultado final, sem depender de geração de imagem.

Topa que eu implemente assim?