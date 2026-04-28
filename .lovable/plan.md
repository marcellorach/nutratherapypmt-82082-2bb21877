## Diagnóstico (por que ficou "infantil")

Olhando a captura de tela, identifiquei 3 problemas estruturais que se combinam:

### 1. As proporções do SVG estão erradas — parece um "porquinho de banho"
O `path` da silhueta atual em `DogAnatomySVG.tsx` (linhas 188-212) desenha um **retângulo arredondado** muito alto e curto, sem pescoço definido, sem peitoral, sem garupa, sem cauda articulada. As pernas são **trapézios paralelos** todas iguais (linhas 263-302), o que faz o cão parecer uma mesa. Não há estrutura de cabeça (focinho colado no crânio), nem orelha real, nem articulação visível.

### 2. O "fundo rosa" é o `systemicTint` — não são as condições aparecendo
O bloco em `DogAnatomySVG.tsx` linhas 304-307 pinta um `<rect>` enorme de 560×280 cobrindo a viewBox inteira sempre que houver qualquer condição mapeada como `systemic` no `anatomy-region-map.ts`. Como `Inflammaging`, `oxidative stress`, `cellular senescence`, `cancer`, etc. são TODOS marcados como `systemic`, qualquer pet acaba com um retângulo rosa cobrindo tudo — e isso esconde os órgãos por baixo. Foi isso que você viu: o "fundo" mudando, e os órgãos mal aparecendo.

### 3. Os órgãos só aparecem se a condição mapear para a região exata
O `anatomy-region-map.ts` cobre cerca de 40 condições, mas cobertura KG = 0/8 significa que `withProtection` não muda nada, e `regionStates` provavelmente está quase vazio porque a maioria das condições do pet caiu no balde `systemic` (ver lista grande no fim do mapa). Resultado: a única coisa "visual" que sobra é a mancha vermelha no canto (provavelmente um hotspot solitário da orelha/cabeça mal posicionado).

### 4. Falta espaço, sim — mas o problema maior é a viewBox
A viewBox é `600×400` mas o card renderiza em ~290px de largura no grid de 2 colunas. Os hotspots têm raio fixo de 14px no espaço SVG, o que significa que ficam minúsculos quando reduzidos. Os labels e badges não têm onde respirar.

---

## Plano de correção

### Fase A — Redesenhar a silhueta com anatomia real de cão

Substituir o path da silhueta por uma **lateral de cão de pé com proporções caninas reais**, baseada em referências veterinárias:

```
- Crânio arredondado com stop frontal
- Focinho separado com nariz
- Orelha pendente OU em pé (parametrizável por raça depois)
- Pescoço inclinado com cernelha (withers) marcada
- Linha dorsal levemente côncava
- Peito profundo (cavidade torácica), abdômen retraído
- Garupa arredondada ligando à cauda
- Cauda em curva natural
- 4 patas com articulações visíveis: ombro, cotovelo, carpo (anterior); 
  quadril, joelho, jarrete, metatarso (posterior)
- Pata dianteira reta, pata traseira angulada para trás (postura natural)
```

Vou aumentar a viewBox para `800×500` para dar mais espaço, e usar paths com curvas Bézier suaves. A silhueta inteira terá `fill="hsl(var(--muted))"` neutro com `stroke` mais fino e elegante, no estilo "ilustração científica clean" que combina com o resto do app.

### Fase B — Eliminar o "fundo rosa" e tornar systemic visível DENTRO do corpo

Remover o `<rect>` de fundo (linhas 304-307). No lugar:

1. **Recolorir a própria silhueta** quando há carga sistêmica — mudando o `fill` do path do tronco para um `hsl()` mais quente (amarelo→laranja→vermelho conforme severidade), com `opacity` baixo (~0.35). Isso mostra a inflamação/senescência **no corpo**, não atrás dele.
2. **Adicionar partículas/pontos sutis** distribuídos pelo tronco para systemic severo (pequenos círculos pulsantes representando inflamação difusa).
3. **Halo externo verde-esmeralda** quando `showProtectionAura` está ativo (drop-shadow com `feGaussianBlur` na silhueta inteira).

### Fase C — Tornar cada disfunção visualmente distinta e localizada

Para cada condição não-sistêmica, em vez de só uma "bola vermelha" genérica, usar **glifos específicos** desenhados sobre a região:

| Condição | Glifo visual |
|---|---|
| Artrite/displasia | Anel pulsante laranja na articulação + faíscas curtas (representando dor/inflamação) |
| Cardíaca | Coração estilizado pulsando no ritmo `animate` (já existe, melhorar) |
| Hepática | Mancha amarela-âmbar contornada no fígado + textura de "pontilhado" |
| Renal | Dois feijões nos rins com gradiente da severidade |
| Cognitiva/cerebral | Onda cerebral pequena (linha sinusoidal) sobre o crânio |
| Ocular | Círculo claro no olho com retícula |
| Dermatite | Pequenos `x` distribuídos sobre a pele/orelha/patas |
| Dental | Pontinhos brancos/amarelos na boca |
| GI/intestinal | Linha serpenteada animada no abdômen |
| Endócrino | Gota colorida sobre a glândula (tireoide, adrenal, pâncreas) |

Cada glifo tem 3 níveis de severidade (cor + intensidade da animação). Glifos de **risco emergente** (`isNew`) são desenhados em **traço tracejado** com `opacity` 0.5 (você "vê o futuro chegando").

### Fase D — Layout responsivo + contraste com o card

1. Em telas <768px (você está em 1212px, mas o card divide em 2 colunas → ~290px efetivo), empilhar os dois cães verticalmente em vez de lado-a-lado para que cada um tenha a largura cheia do card.
2. Aumentar o `aspect-ratio` para ~16:10 e usar `preserveAspectRatio="xMidYMid meet"` para nunca distorcer.
3. Cor de fundo do card SVG = `bg-background` neutro (não muted/30) para que os glifos saltem.
4. Legenda compacta abaixo de cada cão mostrando as 2-3 condições mais relevantes com ícone-chip da região.

### Fase E — Garantir que `systemic` aparece e é diferenciada de "órgão específico"

Criar **dois canais visuais separados** e legendados:
- **Carga sistêmica** = recoloração da silhueta + halo + partículas no tronco
- **Disfunção localizada** = glifo no órgão/articulação correto

Adicionar uma mini-legenda abaixo:
```
○ órgão afetado    ◌ risco futuro    ✦ protegido pelo protocolo    ░ carga sistêmica
```

---

## Arquivos a modificar

- `src/components/pet/DogAnatomySVG.tsx` — reescrever a silhueta + glifos por condição + remover `<rect>` sistêmico + adicionar recoloração interna
- `src/components/pet/BiologicalTimeline.tsx` — ajustar layout do compare (responsividade + altura do SVG + mini-legenda)
- `src/services/anatomy-region-map.ts` — adicionar campo `glyph` em cada mapping para escolher o glifo certo (`joint-inflammation` | `cardiac-pulse` | `hepatic-stain` | `renal-gradient` | `brain-wave` | `eye-ring` | `skin-x` | `gi-serpentine` | `endocrine-drop`)
- `src/locales/pt/translation.json` + `en/translation.json` — adicionar chaves da mini-legenda
- `src/i18n.ts` — incrementar `I18N_VERSION`

---

## O que NÃO vou mudar (fora de escopo)

- A lógica honesta do `biological-timeline-engine.ts` (já está correta)
- A edge function `project-pet-trajectory` (já está correta)
- A barra deslizante de anos, switches de protocolo, painel de auditoria

Pode aprovar?
