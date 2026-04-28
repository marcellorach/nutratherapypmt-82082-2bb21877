
# Gêmeo Digital → Linha do Tempo Biológica do Pet

## Parte 1 — Mudança rápida (já aprovada implicitamente)

Inverter a ordem na coluna direita de `PetProfilePage.tsx`:
- **Topo:** Gêmeo Digital (sticky, protagonista visual)
- **Abaixo:** Chat Clínico Inteligente

---

## Parte 2 — Análise: por que o Gêmeo Digital atual é fraco

Hoje é apenas uma silhueta PNG com bolinhas coloridas marcando órgãos das condições já diagnosticadas. Não responde à pergunta que o veterinário realmente faz: **"o que vai acontecer com este cão se eu não intervir? E se eu intervir?"**

## Parte 3 — Benchmarks (humanos → tradução para cães)

| Inspiração humana | Aplicação canina realista |
|---|---|
| **Levine PhenoAge / GrimAge** (idade biológica por biomarcadores) | Idade biológica canina via peso, escore corporal, hemograma, ALT, creatinina, glicemia — temos esses exames |
| **Framingham/QRISK** (risco cardiovascular a 10 anos) | Risco a N anos para cada condição, ponderado por raça (`risk_factor` 1–10 já existe) |
| **Dog Aging Project** (Universidade de Washington) | Curvas de incidência por raça/porte; cães grandes envelhecem ~2x mais rápido que pequenos |
| **Siemens Healthineers Digital Twin** (gêmeo de paciente cardíaco) | Simulação de trajetória sob diferentes intervenções terapêuticas |
| **Modelo de Mortalidade de Gompertz** | Curva matemática validada de aceleração de risco com a idade — base do slider |

## Parte 4 — A funcionalidade matadora: Linha do Tempo Biológica Interativa

### Componentes da UI

```text
┌─ Gêmeo Digital — Thor (German Shepherd, 7a) ────────────┐
│  Idade biológica: 8.2 anos  (cronológica: 7.0)  ⚠ +1.2  │
│  Expectativa raça: 10–12a   |   Estágio: Sênior inicial │
│                                                          │
│  [silhueta com pontos ativos das condições atuais]       │
│                                                          │
│  ── SLIDER DE PROJEÇÃO ──────────────────────────────    │
│  Hoje  •━━━━━━●━━━━━━━━━━━━━━━━━  +8 anos                │
│         7a    10a    12a    15a                          │
│                                                          │
│  Cenário: ⦿ Sem intervenção  ◯ Com protocolo atual       │
│                                                          │
│  Aos 10 anos, Thor provavelmente terá:                   │
│  • Osteoartrite — moderada → severa  (já tem, +47%)      │
│  • Displasia coxofemoral — risco 73% (raça)  ⚡ NOVO     │
│  • Disfunção cognitiva — risco 31%           ⚡ NOVO     │
│  • Cardiomiopatia dilatada — risco 22%       ⚡ NOVO     │
│  Expectativa de vida residual: 2.8 anos                  │
└──────────────────────────────────────────────────────────┘
```

### Como funciona (motor de cálculo)

Para cada ano `t` à frente da idade atual:

1. **Progressão das condições atuais** — usa o `ImprovementProjectionChart` invertido: severidade aumenta segundo curva sigmoide se não tratada, atenuada se "Com protocolo atual" estiver ativo (reaproveita pesos KG TREATS/AMELIORATES já implementados).

2. **Emergência de novas condições** — para cada predisposição da raça em `breed_predispositions`, calcula probabilidade cumulativa:
   ```
   P(condição em idade t) = 1 − exp(−risk_factor × hazard_base(t) × age_accel)
   ```
   onde `age_accel` reflete que cães grandes envelhecem mais rápido (derivado de `size_category` e `average_weight_kg`).

3. **Idade biológica** — fórmula tipo PhenoAge adaptada: peso vs ideal da raça, n.º de condições ativas ponderado por severidade, escore lab (se existir). Já temos todos esses campos.

4. **Expectativa de vida residual** — Gompertz calibrado por `average_lifespan_years` da raça, ajustado por desvio idade biológica − cronológica e por condições graves ativas.

5. **Cenário "Com protocolo"** — aplica a redução de risco dos compostos do `recommendationCompounds` atual (que já vem do KG), mostrando o ganho concreto: *"protocolo recomendado adia osteoartrite severa de 9.2a para 11.5a"*.

### Conexão com o propósito da plataforma

Isto é **a materialização visual da tese**: nutracêuticos como geroprotetores. O slider transforma uma recomendação abstrata ("dê resveratrol") em um benefício mensurável e visceral ("seu cão viverá 1.4 anos a mais com qualidade"). É exatamente o gancho emocional que converte tutor + dá ao veterinário ferramenta de comunicação.

## Parte 5 — Arquitetura técnica

### Edge function nova: `project-pet-trajectory`
- **Input:** `petId`, `targetYears` (slider), `withIntervention: boolean`
- **Pipeline:**
  1. Busca pet (idade, peso, raça, condições, exames)
  2. Busca `breed_predispositions` da raça
  3. Busca triplets KG das condições (severity progression + treatment effects)
  4. Para condições com <3 triplets, usa Lovable AI (`google/gemini-2.5-pro`) com prompt estruturado (tool calling) pedindo curvas de progressão fundamentadas em literatura veterinária — **com citações obrigatórias**
  5. Calcula trajetória ano a ano e retorna JSON estruturado
- **Cache:** salva em nova tabela `pet_trajectory_projections` (invalidada quando condições mudam)

### Tabelas novas (migration)
- `pet_trajectory_projections` — cache de projeções por pet/cenário
- `breed_aging_curves` — curvas de hazard por porte/raça (seeded com dados do Dog Aging Project como base)

### Componente refatorado: `DigitalTwinDog.tsx` → `BiologicalTimeline.tsx`
- Mantém silhueta atual como camada visual
- Adiciona slider (shadcn `Slider`)
- Painel lateral com lista de condições projetadas (atuais piorando + novas emergentes)
- Toggle "Sem intervenção / Com protocolo"
- Cards numéricos: idade biológica, expectativa residual, anos ganhos com protocolo
- Cada condição projetada é **clicável** → abre detalhes com fonte (KG triplet ou IA com citação)

### Princípios de honestidade clínica (regras do projeto)
- **Sempre** mostrar badge de fonte: "Evidência KG" / "KG + IA" / "IA com citação"
- **Nunca** mostrar números sem intervalo de confiança quando derivados de IA
- Disclaimer permanente: *"Projeção estatística baseada em literatura. Não substitui avaliação clínica individual."*
- Bilíngue PT/EN completo (incrementar `I18N_VERSION`)

## Parte 6 — Entregáveis em fases

**Fase 1 (esta task):**
- Inverter ordem Chat ↔ Gêmeo Digital
- Criar slider funcional com **dados ainda heurísticos** (sem edge function), usando apenas `breed_predispositions` + curva Gompertz simples
- Remover badge "Em construção" e substituir por "Beta — Projeção Heurística"
- Mostrar visualmente o conceito completo para validar UX

**Fase 2 (próxima task, mediante aprovação):**
- Edge function `project-pet-trajectory` com Lovable AI
- Tabelas de cache + curvas de raça
- Modo "Com protocolo" conectado às recomendações reais do KG

**Fase 3:**
- Calibração com dados reais do Dog Aging Project (download público)
- Validação retrospectiva contra cohort interno

---

## Pergunta para você antes de implementar

Quer que eu execute a **Fase 1 completa agora** (inversão + slider conceitual funcional com dados heurísticos honestos) e deixe a Fase 2 (edge function com IA real) para a próxima rodada? Isso dá pra você ver e validar a UX antes de investir em backend pesado.
