
## Diagnóstico: por que o geroprotetor parece sempre melhor

Auditei `biological-timeline-engine.ts` e a edge function `project-pet-trajectory`. O viés é estrutural — não é coincidência:

**Heurística (Phase 1):**
- `progressSeverity` aplica **−35%** em **qualquer** condição quando o toggle está ligado, sem checar se existe composto com evidência para aquela condição.
- `cumulativeIncidence` multiplica probabilidade por **0.7** para **toda** predisposição, sempre.
- Resultado: toggle ON = melhora garantida, independentemente do pet.

**Edge function (Phase 2 / Gemini 3.1 Pro):**
- O prompt pede "use só evidência do KG", mas `activeCompounds` lê só de `pet_medications`. Pets sem medicação ativa = sem âncora → o flag `simulate_with_geroprotective_protocol=true` empurra o modelo a assumir um stack genérico.
- `years_gained` é um número único global, sem custo (efeitos adversos, polifarmácia, adesão, contraindicações).
- Sem teto de plausibilidade — o LLM pode reportar +2 anos sem que nada valide.

**Ou seja: a comparação "com vs sem" não é uma comparação real.** É um número otimista vs um baseline pessimista, sem simetria.

---

## Parte 1 — Reescrever a lógica para ser honesta

### 1.1 Heurística per-condition + per-compound (engine)

Remover os multiplicadores globais. Em vez disso:

```
para cada condição C do pet:
  candidatos = compostos com evidência KG para C (efficacy_score >= 3)
  se candidatos vazio:
    redução = 0  (geroprotetor não atua nesta condição)
  senão:
    melhor = top 1-2 compostos por efficacy_score
    redução_severidade = clamp(0, 0.40, soma(efficacy_score)/10 × evidence_grade_factor)
    redução_incidência = redução_severidade × 0.6
```

`evidence_grade_factor`: high=1.0, moderate=0.7, low=0.4, very_low=0.2.

### 1.2 Penalidades realistas de protocolo

Adicionar custo ao toggle ON:
- **Polifarmácia**: a partir de 5 compostos, +5% de chance de evento adverso por composto adicional → reduz o ganho líquido.
- **Adesão**: aplicar fator de adesão estimado (0.75 default) sobre a redução.
- **Contraindicações**: se o pet tem condição que contraindica um composto candidato (ex.: doença renal + altas doses de certas substâncias), excluir o composto e logar.

### 1.3 `years_gained` per-condition no edge function

Mudar o schema do tool call:
- `years_gained_total` (global, com cap de +1.5 ano, raramente >2)
- `years_gained_breakdown[]`: por condição, com composto âncora e citação
- `protocol_caveats[]`: lista textual de riscos/limitações ("Polifarmácia: 6 compostos", "Adesão estimada: 75%", "Sem evidência para Hip Dysplasia neste KG")

Se o LLM não conseguir justificar com evidência, deve reportar `years_gained_total` próximo de zero e `confidence: "low"`. Adicionar no prompt: **"It is normal and expected to report years_gained close to 0 when KG evidence is sparse. Do not inflate."**

### 1.4 Validação cruzada cliente

No `BiologicalTimeline.tsx`, sempre rodar **as duas projeções** (com e sem) e mostrar o delta real, não confiar só no `years_gained` do LLM. Se delta calculado ≠ `years_gained` reportado em mais de 0.3 ano, exibir badge "Divergência metodológica" (transparência).

### 1.5 UI da comparação honesta

Substituir o "+X anos com protocolo" simples por um painel:
- Ganho líquido estimado: **±X.X anos** (mostrar negativo quando aplicável)
- Condições efetivamente cobertas pelo KG: lista
- Condições **não** cobertas: lista (com badge "Sem evidência no KG")
- Custos do protocolo: caveats listados

Quando não houver evidência suficiente, mostrar mensagem: **"Não há evidência KG suficiente para projetar benefício significativo deste protocolo neste pet."**

---

## Parte 2 — Visualização anatômica precisa no desenho

A silhueta atual (`dog-silhouette.png`) é uma imagem rasterizada com pontos genéricos sobrepostos. Para representar precisamente patas, articulações, órgãos com cor de gravidade, precisamos de um **SVG anatômico vetorial** com regiões nomeadas.

### 2.1 Substituir PNG por `DogAnatomySVG.tsx`

Criar um componente SVG inline (~600x400 viewBox) com um cão vetorial simplificado lateral, contendo `<g>` nomeados para cada região:

```text
Regiões nomeadas (path id):
  brain, eyes, ears, mouth, throat, neck-spine
  shoulder, chest, heart, lungs
  liver, stomach, pancreas, kidneys, intestines, bladder
  spine-thoracic, spine-lumbar, hips, tail
  front-leg-L, front-leg-R, elbow-L, elbow-R, paw-front-L, paw-front-R
  hind-leg-L, hind-leg-R, knee-L, knee-R, hock-L, hock-R, paw-hind-L, paw-hind-R
  skin, coat
```

### 2.2 Mapeamento condição → região(ões) anatômica(s)

Tabela canônica em `src/services/anatomy-region-map.ts`:

```text
osteoarthritis → [knee-L, knee-R, elbow-L, elbow-R, hips]
hip dysplasia → [hips]
elbow dysplasia → [elbow-L, elbow-R]
spondylosis → [spine-lumbar]
IVDD → [spine-thoracic, spine-lumbar]
cardiomyopathy → [heart]
mitral valve disease → [heart]
CKD → [kidneys]
liver disease → [liver]
hepatic lipidosis → [liver]
diabetes → [pancreas]
pancreatitis → [pancreas]
hypothyroidism → [throat]
cushing's → [adrenal] (área renal-superior)
atopic dermatitis → [skin, paw-front-L, paw-front-R, paw-hind-L, paw-hind-R]
cataracts / PRA → [eyes]
cognitive dysfunction → [brain]
brachycephalic syndrome → [mouth, throat]
cancer → [systemic - efeito de cor global suave]
```

### 2.3 Renderização gráfica por gravidade

Cada região afetada recebe **fill dinâmico**, não um ponto sobreposto:

- **mild**: fill `hsl(48 95% 60% / 0.35)` (amarelo translúcido) + leve glow
- **moderate**: fill `hsl(25 95% 55% / 0.55)` (laranja) + glow médio
- **severe**: fill `hsl(0 85% 55% / 0.75)` (vermelho) + animação de pulso suave
- **new risk** (predisposição emergente): contorno tracejado animado na cor da gravidade projetada, sem fill cheio

Para condições articulares (osteoartrite, displasia), além da cor adicionar **ícone de inflamação** (radial concentric rings) animado sobre a articulação.

Para condições sistêmicas, sobrepor um **filtro SVG** com gradient tênue cobrindo o corpo todo.

### 2.4 Animação na transição do slider

Quando o slider muda:
- `<animate>` SMIL ou framer-motion no `fill-opacity` e `fill` de cada região (transição 400ms ease-out)
- Pulso de "evolução": breve flash quando uma severidade aumenta
- Sparkle (★) que aparece e some quando uma região é "protegida" pelo protocolo (reduzindo a cor)

### 2.5 Comparação visual lado-a-lado (opcional, desktop)

Em viewport ≥ md: mostrar **dois cães** lado a lado quando o slider > 0:
- Esquerda: trajetória SEM protocolo
- Direita: trajetória COM protocolo
- Diferenças destacadas com halo verde (regiões poupadas) ou vermelho (regiões que pioraram igual)

Em mobile: manter um cão só, com toggle de comparação.

### 2.6 Tooltip rico por região

Hover/tap em qualquer região:
- Nome anatômico
- Condições afetando essa região (atual + projetada)
- Severidade atual e projetada
- Compostos do KG que protegem aquela região (se houver)
- Botão "Ver no Knowledge Graph" (link para a página do KG já existente)

### 2.7 Legenda visual

Pequena legenda abaixo do desenho:
- Quadrados de cor: leve / moderado / grave / novo risco / protegido
- Toggle "Mostrar órgãos internos" (on/off) para reduzir poluição visual

---

## Parte 3 — Telemetria e auditoria

Para você confirmar que a lógica está honesta:

- Painel debug colapsado no fim do componente (só visível para vet, não para tutor) com:
  - Compostos âncora encontrados no KG por condição
  - Reduções aplicadas por condição (números crus)
  - Caveats do protocolo
  - Hash do contexto e fonte (cache vs fresh AI)

- Edge function passa a logar no Supabase logs: `pet_id`, `years_gained_total`, `evidence_count`, `compound_count` — para análise agregada.

---

## Arquivos afetados

**Lógica (Parte 1):**
- `src/services/biological-timeline-engine.ts` — reescrever `progressSeverity` e `cumulativeIncidence` per-condition; adicionar penalidades.
- `src/services/protocol-coverage.ts` (novo) — função pura que cruza condições × KG evidence × compostos ativos.
- `src/hooks/usePetTrajectoryProjection.ts` — passar evidência KG já carregada como input opcional para o engine.
- `src/hooks/usePetCompoundCoverage.ts` (novo) — busca KG evidence por condição.
- `supabase/functions/project-pet-trajectory/index.ts` — schema do tool call expandido (`years_gained_breakdown`, `protocol_caveats`); prompt revisado; cap de plausibilidade.
- `src/components/pet/BiologicalTimeline.tsx` — exibir caveats, breakdown, divergência metodológica, painel debug.

**Visualização (Parte 2):**
- `src/components/pet/DogAnatomySVG.tsx` (novo) — SVG vetorial com regiões nomeadas + props `severityByRegion`, `newRisksByRegion`, `protectedRegions`.
- `src/services/anatomy-region-map.ts` (novo) — mapeamento canônico condição → região(ões).
- `src/components/pet/AnatomyLegend.tsx` (novo) — legenda + toggle de órgãos internos.
- `src/components/pet/BiologicalTimeline.tsx` — substituir o `<img>` + markers atuais pelo novo SVG; adicionar comparação lado-a-lado em desktop.

**i18n:**
- `src/i18n.ts` — bump para `1.34.0`.
- `src/locales/pt/translation.json` + `en/translation.json` — adicionar chaves para regiões anatômicas, caveats, breakdown, legenda.

**Documentação:**
- `CHANGELOG.md` — entrada em `[Unreleased]`.
- `ARCHITECTURE.md` v? — nova seção sobre anatomia vetorial e lógica honesta de projeção.
- `docs/CURRENT_STATE.md` — atualizar maturidade da feature Biological Timeline.

---

## Critérios de aceitação

1. Existe pelo menos um pet de demo onde toggle ON resulta em **0 ou ganho < 0.2 ano** (porque o KG não cobre as condições dele) — comprovando que a lógica não é viesada.
2. Existe pelo menos um pet onde o ganho é claro e cada ano ganho é citado a um composto×condição específico do KG.
3. Cada região do desenho destacada corresponde anatomicamente à condição (ex.: osteoartrite acende joelhos e quadris, não o tórax).
4. Cores das regiões refletem gravidade projetada com transição suave ao mover o slider.
5. Painel debug expõe os números crus para auditoria veterinária.
