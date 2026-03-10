

## Plano: Motor de Decisão Clínica Completo — Pipeline de Análise Individualizada

### Objetivo
Transformar a análise do cão de uma consulta parcial ao KG + LLM fallback em um pipeline de decisão clínica completo que consulta múltiplas fontes de dados, cruza informações e gera recomendações verdadeiramente individualizadas.

### Arquitetura Proposta: 6 Etapas de Análise

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE ANÁLISE CLÍNICA                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PERFIL DO PACIENTE                                         │
│     ├── Dados biométricos (raça, idade, peso, sexo)            │
│     ├── Condições clínicas ativas                              │
│     ├── Medicações em uso                                      │
│     └── Exames laboratoriais recentes                          │
│                                                                 │
│  2. PREDISPOSIÇÕES RACIAIS (NOVO - tabela breed_predispositions)│
│     └── "Labrador, 8 anos → alto risco: obesidade,            │
│          displasia coxofemoral, atrofia retiniana"             │
│                                                                 │
│  3. INTERPRETAÇÃO DE EXAMES (NOVO - tabela lab_reference_ranges)│
│     └── "ALT = 180 U/L → elevada (ref: 10-125) →             │
│          sugestão: hepatoproteção"                              │
│                                                                 │
│  4. CONSULTA AO KNOWLEDGE GRAPH (já existe)                    │
│     └── Para cada condição → Neo4j → triplets TREATS/PREVENTS  │
│                                                                 │
│  5. VERIFICAÇÃO DE INTERAÇÕES (NOVO)                           │
│     └── Cruza compostos recomendados vs medicações atuais      │
│          via triplets CONTRAINDICATES/INTERACTS no KG           │
│                                                                 │
│  6. RECOMENDAÇÃO HÍBRIDA (já existe, enriquecer)               │
│     └── KG data + contexto completo → LLM enrich/fallback     │
│         com disclaimer por nível de confiança                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mudanças Necessárias

#### 1. Nova tabela: `breed_predispositions`
Armazena predisposições genéticas por raça com prevalência e idade típica de manifestação.

```sql
CREATE TABLE breed_predispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breed TEXT NOT NULL,
  species TEXT DEFAULT 'canine',
  condition_name TEXT NOT NULL,
  prevalence TEXT, -- 'high', 'moderate', 'low'
  typical_onset_years NUMERIC,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Populada com dados de referência veterinária (ex: OMIA, OFA databases).

#### 2. Nova tabela: `lab_reference_ranges`
Intervalos de referência para exames laboratoriais por espécie/fase.

```sql
CREATE TABLE lab_reference_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  species TEXT DEFAULT 'canine',
  unit TEXT,
  min_normal NUMERIC,
  max_normal NUMERIC,
  age_group TEXT, -- 'puppy', 'adult', 'senior'
  clinical_significance TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. Refatorar `handleAnalyzeWithKG` em pipeline de 6 etapas
Criar um serviço `src/services/clinical-analysis-pipeline.ts` que orquestra:

- **Etapa 1**: Coletar perfil completo (já existe)
- **Etapa 2**: Consultar `breed_predispositions` → identificar riscos não diagnosticados
- **Etapa 3**: Comparar exames vs `lab_reference_ranges` → flags de alerta
- **Etapa 4**: Consultar KG (já existe) para condições ativas + predisposições
- **Etapa 5**: Verificar interações no KG (compostos recomendados vs medicações)
- **Etapa 6**: Gerar recomendação híbrida com contexto enriquecido

#### 4. Substituir `Math.random()` na treatability
Usar dados reais de `get_conditions_with_treatability` (RPC que já existe) em vez de valores aleatórios.

#### 5. Nova aba: "Alertas Clínicos"
Na interface de abas do perfil do pet, adicionar aba que mostra:
- Predisposições raciais identificadas (com flag se já diagnosticada ou não)
- Exames fora de faixa (com significância clínica)
- Interações medicamentosas detectadas

#### 6. Enriquecer o prompt do `hybrid-recommendation`
Passar ao LLM o contexto completo (predisposições, exames, interações) para que a recomendação seja verdadeiramente individualizada.

### Sobre a aba "Relações e Conexões"
Proposta: **Fundir** a funcionalidade útil das Relações (visualização administrativa de links) dentro do Knowledge Graph como uma "view simplificada". Manter a aba de Relações apenas para curadoria manual (adicionar/remover links), e renomear para "Curadoria de Relações" para clarificar seu papel editorial vs. o KG que é a engine científica.

### Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Criar `breed_predispositions` e `lab_reference_ranges` |
| **Seed data** | Popular com ~50 predisposições de raças comuns e ~30 referências de exames |
| `src/services/clinical-analysis-pipeline.ts` (novo) | Orquestrador das 6 etapas |
| `PetProfilePage.tsx` | Usar pipeline em vez de `handleAnalyzeWithKG` inline |
| `src/components/pet/ClinicalAlertsPanel.tsx` (novo) | Nova aba de alertas |
| `treatabilityData` no PetProfilePage | Substituir random por dados reais |
| Traduções PT/EN | ~20 novas chaves |

### Resultado esperado
O veterinário clica "Analisar" e recebe:
1. **Alertas**: "Labrador de 8 anos: risco de displasia (não diagnosticada), ALT elevada (180 > 125)"
2. **Recomendações**: Stack personalizado considerando raça, idade, exames, condições E medicações atuais
3. **Evidência**: Triplets do KG com proveniência
4. **Pathways**: Caminhos biológicos dos compostos recomendados
5. **Projeção**: Curva de melhora baseada em evidência (não random)
6. **Chat**: Conversa focada por composto ou geral

