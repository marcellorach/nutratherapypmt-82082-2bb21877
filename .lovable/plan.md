
## Resposta curta

Sim — e a boa prática emergente em **Clinical Knowledge Graphs** (Stanford BIOS, Mayo Clinic Platform, OHDSI/OMOP-on-graph, PrimeKG) é exatamente o que você está intuindo: o grafo do paciente não deve ser **só evidência científica** nem **só prontuário**, mas um **Digital Twin Clínico Longitudinal** que une três camadas em um único subgrafo navegável:

1. **Quem é o paciente** (identidade + traços imutáveis)
2. **O que está acontecendo agora** (estado clínico atual: dx, meds, labs, sintomas)
3. **Por que recomendamos X** (proveniência: triplets do KG científico que justificam cada composto)
4. **Para onde isso vai** (projeção temporal: exames futuros, melhoras esperadas, marcos de reavaliação)

Hoje o `PatientKnowledgeSubgraph.tsx` só faz a camada 3. Falta 1, 2 e 4.

---

## Modelo proposto: 4 camadas temporais em um grafo só

```text
                    ┌─────────────────────────┐
                    │   PET (núcleo azul)     │
                    │  Rex · 11a · Labrador   │
                    │  32kg · M castrado      │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
   [PASSADO]               [PRESENTE]               [FUTURO]
   HISTORY                 HAS_*                    PROJECTED_*
        │                       │                        │
   ┌────▼─────┐         ┌───────▼────────┐      ┌────────▼─────────┐
   │ Dx 2023  │         │ Condição ativa │      │ Reexame 90d      │
   │ Cirurgia │         │ Med atual      │      │ Δ severidade     │
   │ Lab old  │         │ Lab anormal    │      │ Marco clínico    │
   └──────────┘         │ Sintoma        │      │ Janela crítica   │
                        │ Detrator oculto│      └──────────────────┘
                        └────────┬───────┘
                                 │ JUSTIFIED_BY
                                 ▼
                        ┌────────────────┐
                        │ Composto reco  │ ← TREATS/PREVENTS ← Triplets KG
                        │ (verde)        │ ← INTERACTS_WITH → Med atual
                        └────────────────┘   (aresta vermelha = conflito)
```

### Tipos de nó (8 grupos, todos no mesmo grafo)

| Grupo | Cor | Forma | Origem dos dados |
|---|---|---|---|
| **Pet** (1 nó central) | azul-escuro | star | `pets` table |
| **Trait** (raça, idade-classe, sexo) | azul-claro | hexagon | `pets` + breed predispositions |
| **Past Diagnosis** | cinza | circle | `pet_consultations` histórico |
| **Active Condition** | laranja | diamond | snapshot atual (já existe) |
| **Hidden Geriatric Detractor** | âmbar escuro | diamond outline | derivado (já existe) |
| **Active Medication** | roxo | pill | `pet_consultations.medications` |
| **Abnormal Lab** | amarelo | triangle invertido | `pet_exam_results` |
| **Recommended Compound** | verde | dot | snapshot (já existe) |
| **Mechanism / Pathway** | azul | triangle | KG (já existe) |
| **Projected Milestone** | verde-água tracejado | diamond outline | `pet_clinical_analysis_snapshots.kg_projections` |

### Tipos de aresta (semântica clínica explícita)

| Predicate | Cor | Estilo | Significado |
|---|---|---|---|
| `HAS_TRAIT` | azul claro | sólida fina | Pet → idade/raça/sexo |
| `HAS_HISTORY` | cinza | tracejada | Pet → dx/cirurgia passada |
| `HAS_CONDITION` | laranja | sólida grossa | Pet → condição ativa |
| `EXHIBITS_DETRACTOR` | âmbar | sólida | Pet → senescência/inflammaging |
| `TAKES` | roxo | sólida | Pet → medicação atual |
| `PRESENTS_LAB` | amarelo | sólida | Pet → resultado anormal |
| `INDICATES` | amarelo | tracejada | Lab → condição inferida |
| `BREED_RISK_FOR` | azul-escuro | tracejada | Trait raça → condição predisposta |
| `JUSTIFIED_BY` | verde | sólida grossa | Composto reco → triplet KG |
| `TREATS / PREVENTS / AGGRAVATES` | verde / vermelho | (já existe) | Triplets do KG |
| `INTERACTS_WITH` | **vermelho pulsante** | sólida grossa | Composto reco ↔ Med atual (alerta!) |
| `PROJECTED_AT` | verde-água | tracejada | Composto → marco futuro (90d, 180d) |
| `EXPECTED_IMPROVEMENT` | verde-água | tracejada com seta | Condição → Δ severidade projetada |
| `SCHEDULED_EXAM` | cinza-claro | tracejada pontilhada | Pet → reexame futuro |

---

## Boas práticas que estamos adotando (referências)

1. **Temporal layering** (PrimeKG, Stanford SHEPHERD): separar passado / presente / futuro por **estilo de aresta**, não por subgrafos diferentes. Mantém uma única tela navegável.
2. **Provenance edges** (W3C PROV-O adaptado): toda recomendação carrega `JUSTIFIED_BY` explícito apontando para o triplet do KG científico. Sem isso, a reco é "caixa-preta".
3. **Patient as central hub** (OMOP-on-graph): um único nó Pet no centro, todos os outros pendurados. Evita o erro atual de mostrar conditions e compounds soltos sem dono.
4. **Counterfactual / projection nodes** (Mayo Digital Twin): marcos futuros são nós de primeira classe (não tooltip), porque o veterinário precisa **clicar e ver a evidência da projeção**.
5. **Interaction edges as red alerts**: conflitos farmacológicos viram arestas vermelhas pulsantes — o vet vê o risco antes de aprovar.
6. **Traits ≠ conditions**: raça/idade são nós separados (`Trait`) que conectam a condições via `BREED_RISK_FOR`. Permite explicar "por que estamos vigiando displasia mesmo sem dx".

---

## Plano de implementação (4 fases incrementais)

### **Fase 1 — Núcleo Pet + Estado Atual** (alta prioridade)
- Adicionar nó `Pet` central (azul, star) com tooltip mostrando idade/raça/peso/sexo
- Conectar Pet → todas condições atuais via `HAS_CONDITION`
- Conectar Pet → detratores ocultos via `EXHIBITS_DETRACTOR`
- Adicionar nós `Active Medication` (roxo) lidos de `pet_consultations`
- Adicionar arestas `INTERACTS_WITH` (vermelho) entre med atual e composto reco quando houver conflito detectado
- Atualizar legenda + i18n (PT/EN), bump `I18N_VERSION`

### **Fase 2 — Histórico clínico**
- Adicionar nós `Past Diagnosis` (cinza, tracejado) das consultas anteriores
- Adicionar nós `Trait` (raça, idade-classe) com `BREED_RISK_FOR` para predisposições
- Conectar labs anormais como `Abnormal Lab` → `INDICATES` → condição inferida

### **Fase 3 — Proveniência reforçada**
- Para cada composto recomendado, adicionar arestas `JUSTIFIED_BY` apontando para o(s) triplet(s) específico(s) do KG que o sustentam (já temos a info em `kg_triplets`, falta só desenhar a aresta dedicada com cor distinta)

### **Fase 4 — Projeção temporal (Digital Twin)**
- Adicionar nós `Projected Milestone` (90d, 180d, 365d) lidos de `kg_projections`
- Arestas `EXPECTED_IMPROVEMENT` ligando condição atual → projeção futura
- Nós `Scheduled Exam` para reexames recomendados pelo plano de tratamento
- Toggle "Modo evidência científica pura" (volta ao subgrafo atual) vs "Modo Digital Twin" (default novo)

### **Cross-cutting**
- Toggle de visibilidade por camada (checkboxes: Histórico / Atual / Projeção / Evidência)
- Atualizar memória `mem://features/patient-knowledge-subgraph-provenance` para refletir o modelo expandido
- Atualizar `CHANGELOG.md` + `mem://principles/clinical-recommendation-transparency`
- Conformidade com No-Mock Policy: tudo lido de `pets`, `pet_consultations`, `pet_exam_results`, `pet_clinical_analysis_snapshots` — zero dado inventado; nó/aresta só aparece se houver registro real

---

## Arquivos que serão tocados (Fase 1, escopo mínimo viável)

- `src/components/pet/PatientKnowledgeSubgraph.tsx` — nova lógica de montagem com camadas
- `src/hooks/usePetClinicalAnalysisSnapshot.ts` — já tem snapshot, ok
- novo hook: `src/hooks/usePetActiveMedications.ts` (lê `pet_consultations` mais recente)
- `src/locales/{pt,en}/translation.json` — chaves para 8 grupos + 13 predicates
- `src/i18n.ts` — bump `I18N_VERSION` → 1.74.4
- `CHANGELOG.md` + sync

---

## Decisão que preciso de você

Confirma a abordagem **Digital Twin com 4 camadas temporais em um único grafo** (com toggle para voltar ao modo "evidência científica pura")? Posso começar pela **Fase 1** (Pet central + medicações ativas + alertas de interação) que já entrega o salto de valor mais visível, e depois evoluir para histórico e projeção?
