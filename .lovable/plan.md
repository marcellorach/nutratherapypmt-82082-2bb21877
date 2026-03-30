

# Reorganização da Página de Perfil do Pet: Separação Clara entre Dados do Paciente e Análise VetGraphRAG

## Problema Atual
A página mistura dados que vêm do prontuário veterinário (condições, exames, medicações) com resultados da análise VetGraphRAG (comorbidades, predisposições, mecanismos biológicos). Para o veterinário, fica confuso distinguir o que é **dado clínico registrado** do que é **inteligência gerada pelo sistema**.

## Nova Estrutura Proposta

A página passaria a ter **3 blocos visuais claramente separados**:

```text
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Rex · Labrador · 8 anos · [Analyze with VetGraphRAG]  │
│  Summary Cards (Conditions, Meds, Exams, Notes, Alerts)        │
├───────────────────────────────────────────┬─────────────────────┤
│                                           │                     │
│  ▌BLOCO 1: DADOS DO PACIENTE             │  Chat Clínico       │
│  (Tabs: Conditions, Meds, Exams, Notes)   │  + Digital Twin     │
│  Comorbidity Map (conexões já conhecidas) │  (sticky)           │
│                                           │                     │
│  ▌Pipeline Stepper (6 etapas)            │                     │
│                                           │                     │
│  ▌BLOCO 2: ANÁLISE VETGRAPHRAG           │                     │
│  ┌──────────────────────────────────┐     │                     │
│  │ 3 sub-seções visuais:           │     │                     │
│  │                                  │     │                     │
│  │ 🔴 Condições Atuais             │     │                     │
│  │    (confirmadas pelo vet)        │     │                     │
│  │                                  │     │                     │
│  │ 🟡 Comorbidades Ocultas         │     │                     │
│  │    (inferidas: senescência,     │     │                     │
│  │     inflamação crônica, etc.)    │     │                     │
│  │                                  │     │                     │
│  │ 🔵 Prevenção Futura             │     │                     │
│  │    (predisposições de raça +    │     │                     │
│  │     padrões de exames)           │     │                     │
│  └──────────────────────────────────┘     │                     │
│                                           │                     │
│  ▌NOVO: Grafo Relacional do Paciente     │                     │
│  (subgrafo KG usado nas recomendações:    │                     │
│   nós = compostos + condições + mecani-   │                     │
│   smos; edges = triplets do paciente)     │                     │
│                                           │                     │
│  ▌Tabs de Análise (existentes)           │                     │
│  (Recomendações, Pathway, Evidência,      │                     │
│   Projeção, Chat por Composto)            │                     │
│                                           │                     │
│  ▌Treatability Chart                     │                     │
└───────────────────────────────────────────┴─────────────────────┘
```

## Mudanças Detalhadas

### 1. Novo componente: `VetGraphRAGInsightsPanel`
Painel que organiza os resultados da análise em 3 seções visuais com cores distintas e ícones:

- **Condições Atuais Confirmadas** (borda vermelha/laranja): lista as condições já diagnosticadas pelo vet, agora enriquecidas com dados do KG (quantos triplets suportam, quais mecanismos)
- **Comorbidades Inferidas** (borda amarela/âmbar, ícone Dna): condições não diagnosticadas mas inferidas pelo KG a partir de conexões biológicas (ex: Osteoartrite → Inflamação Crônica → Senescência Celular). Cada uma com "por que inferimos isso" e confidence score
- **Prevenção Futura** (borda azul, ícone Shield): predisposições de raça ainda não manifestadas + padrões de exames que indicam risco. Cada uma com "o que monitorar" e "quando intervir"

Fonte de dados: combinar `predispositions`, `clinicalDiscoveries`, `kgTriplets` e `conditions` já existentes — apenas reorganizar a apresentação.

### 2. Novo componente: `PatientKnowledgeSubgraph`
Visualização de grafo interativo (reutilizando `NetworkGraph` ou `BiologicalNetworkGraph` existente) que mostra APENAS os nós e edges relevantes para este paciente:

- Nós: compostos recomendados (verde), condições do paciente (laranja), mecanismos envolvidos (azul), efeitos colaterais (vermelho)
- Edges: triplets reais do KG que foram usados para fundamentar as recomendações
- Dados: construídos a partir de `kgTriplets` + `kgPathways` + `recommendationCompounds`

Isso dá ao vet uma visão "de helicóptero" de como tudo se conecta para este paciente específico.

### 3. Editar `PetProfilePage.tsx`
- Mover `ClinicalAlertsPanel` e `ComorbidityMap` para dentro do **Bloco 1** (dados do paciente) — ficam visíveis mesmo antes da análise VetGraphRAG
- Após o pipeline stepper, inserir o novo `VetGraphRAGInsightsPanel` (3 seções: atuais, ocultas, futuras)
- Inserir `PatientKnowledgeSubgraph` como nova tab ou seção dedicada nos resultados da análise
- Manter as tabs existentes (Recomendações, Pathway, Evidência, etc.)

### 4. Enriquecer dados na `clinical-analysis-pipeline.ts`
- Classificar triplets/discoveries em 3 categorias: `current`, `hidden_comorbidity`, `future_prevention`
- Gerar "razões de inferência" para comorbidades ocultas (ex: "A Osteoartrite do paciente está conectada via NF-κB → Inflamação Crônica → Senescência Celular no Knowledge Graph")

### 5. i18n
Adicionar chaves PT/EN para os novos títulos de seção, descrições e labels.

### Arquivos
- **Criar**: `src/components/pet/VetGraphRAGInsightsPanel.tsx`
- **Criar**: `src/components/pet/PatientKnowledgeSubgraph.tsx`
- **Editar**: `src/pages/veterinario/PetProfilePage.tsx` (reorganizar layout)
- **Editar**: `src/services/clinical-analysis-pipeline.ts` (classificar insights)
- **Editar**: traduções PT/EN + `i18n.ts`
- **Editar**: `CHANGELOG.md`

