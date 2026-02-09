
# Plano: Sistema de Registro de Pacientes Caninos (Fase 2 do VetGraphRAG)

## Resumo

Criar o sistema de registro de pacientes caninos com uma abordagem híbrida: formulário estruturado para dados essenciais + chat inteligente para dados clínicos desestruturados + gerador de dados de exemplo para testes. Isso conecta o Knowledge Graph curado (Fase 1) aos dados individuais dos pacientes, habilitando recomendações personalizadas.

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     REGISTRO DE PACIENTE CANINO                        │
├───────────────────────┬─────────────────────────────────────────────────┤
│                       │                                                 │
│  FORMULÁRIO MÍNIMO    │          CHAT CLÍNICO INTELIGENTE              │
│  (Dados Obrigatórios) │          (Dados Complementares)                │
│                       │                                                 │
│  ┌─────────────────┐  │  ┌──────────────────────────────────────────┐  │
│  │ Nome: Rex       │  │  │ Vet: "Rex é um Labrador de 8 anos,      │  │
│  │ Raça: Labrador  │  │  │ castrado, com displasia coxofemoral     │  │
│  │ Idade: 8 anos   │  │  │ bilateral. Claudicando há 3 meses.      │  │
│  │ Peso: 30kg      │  │  │ Radiografia grau 3. Tomando meloxicam." │  │
│  │ Sexo: Macho     │  │  │                                          │  │
│  │ Castrado: Sim   │  │  │         IA EXTRAI AUTOMATICAMENTE:       │  │
│  └─────────────────┘  │  │  ┌──────────────────────────────────┐    │  │
│                       │  │  │ Condições: Displasia coxofemoral │    │  │
│  ┌─────────────────┐  │  │  │ Medicações: Meloxicam 0.1mg/kg   │    │  │
│  │ Condições       │  │  │  │ Exames: Radiografia grau 3       │    │  │
│  │ [x] Displasia   │  │  │  │ Sintomas: Claudicação 3 meses    │    │  │
│  │ [ ] Artrite     │  │  │  │ Biomarcadores: (extraídos)       │    │  │
│  │ [ ] Cardíaco    │  │  │  └──────────────────────────────────┘    │  │
│  └─────────────────┘  │  └──────────────────────────────────────────┘  │
│                       │                                                 │
├───────────────────────┴─────────────────────────────────────────────────┤
│                                                                         │
│            PERFIL DO PACIENTE CONSOLIDADO                               │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Rex | Labrador | 8a | 30kg | Macho | Castrado                    │  │
│  │ Condições: Displasia coxofemoral bilateral (grau 3)              │  │
│  │ Medicações: Meloxicam 0.1mg/kg                                    │  │
│  │ Sintomas: Claudicação (3 meses)                                   │  │
│  │ Exames: Radiografia articular, Hemograma (leucócitos 12.500)      │  │
│  │                                                                    │  │
│  │  [Buscar Recomendações no Knowledge Graph]                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Modelo de Dados (Tabelas no Banco)

### Tabela: `pet_profiles`
Dados estruturados do paciente canino.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| name | text | Nome do pet |
| species | text | Especie (default: 'canine') |
| breed | text | Raca |
| age_years | numeric | Idade em anos |
| weight_kg | numeric | Peso em kg |
| sex | text | 'male' / 'female' |
| neutered | boolean | Castrado |
| chip_number | text | Numero do chip (opcional) |
| photo_url | text | URL da foto (opcional) |
| owner_name | text | Nome do tutor |
| owner_email | text | Email do tutor |
| veterinarian_id | uuid | Referencia ao veterinario responsavel |
| created_by | uuid | Quem cadastrou |
| notes | text | Observacoes gerais |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Ultima atualizacao |

### Tabela: `pet_conditions`
Condicoes diagnosticadas do paciente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| pet_id | uuid | FK para pet_profiles |
| condition_name | text | Nome da condicao |
| condition_id | uuid | FK para health_conditions (se existir no KG) |
| diagnosis_date | date | Data do diagnostico |
| severity | text | 'mild', 'moderate', 'severe' |
| status | text | 'active', 'resolved', 'monitoring' |
| notes | text | Observacoes |

### Tabela: `pet_medications`
Medicamentos em uso pelo paciente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| pet_id | uuid | FK para pet_profiles |
| medication_name | text | Nome do medicamento |
| dosage | text | Dosagem |
| frequency | text | Frequencia |
| start_date | date | Inicio |
| end_date | date | Termino (nulo se em uso) |
| prescribing_vet | text | Veterinario que prescreveu |

### Tabela: `pet_exams`
Resultados de exames clinicos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| pet_id | uuid | FK para pet_profiles |
| exam_type | text | Tipo do exame |
| exam_date | date | Data do exame |
| results | jsonb | Resultados em JSON |
| notes | text | Observacoes |
| file_url | text | URL do arquivo do exame (se upload) |

### Tabela: `pet_clinical_notes`
Anotacoes clinicas extraidas via chat ou inseridas manualmente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| pet_id | uuid | FK para pet_profiles |
| note_type | text | 'chat_extracted', 'manual', 'symptom', 'observation' |
| content | text | Conteudo da nota |
| extracted_entities | jsonb | Entidades extraidas pela IA |
| source_message | text | Mensagem original do chat (se via chat) |
| created_by | uuid | Quem inseriu |
| created_at | timestamptz | Data |

## Fluxo de Dados: Do Chat ao Knowledge Graph

```text
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Veterinario  │     │  Edge Function   │     │    Banco de Dados   │
│ digita no    │────▶│  extract-pet-    │────▶│                     │
│ chat clinico │     │  clinical-data   │     │  pet_conditions     │
│              │     │                  │     │  pet_medications    │
│ "Rex tem     │     │  Usa Gemini para │     │  pet_exams          │
│  displasia   │     │  extrair:        │     │  pet_clinical_notes │
│  bilateral,  │     │  - Condicoes     │     │                     │
│  tomando     │     │  - Medicacoes    │     └────────┬────────────┘
│  meloxicam"  │     │  - Exames        │              │
│              │     │  - Sintomas      │              ▼
└──────────────┘     │  - Biomarcadores │     ┌─────────────────────┐
                     └──────────────────┘     │ Recommendation      │
                                              │ Engine consulta o   │
                                              │ Knowledge Graph     │
                                              │ com o perfil        │
                                              │ consolidado do pet  │
                                              │                     │
                                              │ petProfile:         │
                                              │  species: canine    │
                                              │  breed: Labrador    │
                                              │  age: 8             │
                                              │  conditions: [...]  │
                                              │  medications: [...] │
                                              └─────────────────────┘
```

## Componentes da Interface

### 1. Pagina de Registro de Paciente (`/veterinario/pet/new`)

Layout em duas colunas:
- **Esquerda**: Formulario estruturado com campos obrigatorios (nome, raca, idade, peso, sexo, castrado) + secao de condicoes com autocomplete do Knowledge Graph
- **Direita**: Chat clinico inteligente onde o vet pode descrever o paciente em texto livre

### 2. Pagina de Perfil do Paciente (`/veterinario/pet/:id`)

Dashboard do paciente com:
- Dados basicos em card superior
- Tabs: Condicoes | Exames | Medicacoes | Historico Clinico | Recomendacoes
- Botao "Analisar com VetGraphRAG" que envia o perfil consolidado ao recommendation engine

### 3. Chat Clinico Inteligente (`PetClinicalChat`)

Interface de chat contextualizada ao paciente:
- O vet digita informacoes clinicas em linguagem natural
- A IA extrai entidades e mostra preview do que foi extraido
- O vet confirma ou corrige as extracoes
- Dados confirmados sao salvos nas tabelas correspondentes

### 4. Gerador de Pacientes de Exemplo

Botao que cria 5-10 pacientes realistas com:
- Racas comuns com predisposicoes conhecidas (Golden: displasia, Cavalier: cardiaco, Beagle: epilepsia)
- Exames com series temporais
- Condicoes que mapeiam para entidades do Knowledge Graph
- Variacoes de idade (filhotes, adultos, geriatricos)

## Edge Function: `extract-pet-clinical-data`

Nova edge function que recebe texto clinico em linguagem natural e retorna entidades estruturadas usando Lovable AI (Gemini 3 Flash Preview).

Entrada:
```json
{
  "petId": "uuid",
  "clinicalText": "Rex tem displasia coxofemoral bilateral...",
  "existingProfile": { "breed": "Labrador", "age": 8 }
}
```

Saida:
```json
{
  "conditions": [
    { "name": "Displasia coxofemoral", "severity": "moderate", "side": "bilateral" }
  ],
  "medications": [
    { "name": "Meloxicam", "dosage": "0.1mg/kg", "type": "NSAID" }
  ],
  "symptoms": [
    { "name": "Claudicacao", "duration": "3 meses" }
  ],
  "examResults": [
    { "type": "Radiografia", "finding": "Desgaste articular grau 3" }
  ],
  "biomarkers": [
    { "name": "Leucocitos", "value": 12500, "unit": "/uL" }
  ]
}
```

## Seguranca (RLS)

- Veterinarios so veem pacientes atribuidos a eles (`veterinarian_id = auth.uid()`)
- Admins veem todos os pacientes
- Dados clinicos protegidos por RLS em todas as tabelas
- Chat clinico logado para auditoria

## Traducoes (PT/EN)

Chaves a adicionar em ambos os idiomas:
- `petRegistration.form.*` - campos do formulario
- `petRegistration.chat.*` - interface do chat clinico
- `petRegistration.profile.*` - pagina de perfil
- `petRegistration.generator.*` - gerador de dados de exemplo
- `petRegistration.conditions.*` - condicoes
- `petRegistration.exams.*` - exames
- `petRegistration.medications.*` - medicacoes

## Integracao com o Recommendation Engine Existente

O `ConfidenceCalculationParams` atual ja aceita `petProfile` com `{species, breed, age, weight}`. A implementacao expandira isso para incluir `conditions`, `medications` e `biomarkers`, permitindo recomendacoes mais precisas:

```typescript
// Antes (atual)
petProfile: { species: 'canine', breed: 'Labrador', age: 8, weight: 30 }

// Depois (expandido)
petProfile: {
  species: 'canine',
  breed: 'Labrador',
  age: 8,
  weight: 30,
  conditions: ['hip_dysplasia'],
  medications: ['meloxicam'],
  biomarkers: { leucocytes: 12500 }
}
```

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/veterinario/PetRegistrationPage.tsx` | Pagina de registro com formulario + chat |
| `src/pages/veterinario/PetProfilePage.tsx` | Dashboard do paciente |
| `src/components/pet/PetRegistrationForm.tsx` | Formulario estruturado |
| `src/components/pet/PetClinicalChat.tsx` | Chat clinico inteligente |
| `src/components/pet/PetConditionsList.tsx` | Lista de condicoes com autocomplete |
| `src/components/pet/PetExamsList.tsx` | Lista de exames |
| `src/components/pet/PetMedicationsList.tsx` | Lista de medicacoes |
| `src/components/pet/GenerateSamplePetsButton.tsx` | Gerador de dados de exemplo |
| `src/hooks/usePetProfile.ts` | Hook para CRUD de perfis |
| `src/hooks/usePetClinicalChat.ts` | Hook para chat clinico |
| `supabase/functions/extract-pet-clinical-data/index.ts` | Edge function de extracao |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/App.tsx` | Adicionar rotas `/veterinario/pet/new` e `/veterinario/pet/:id` |
| `src/pages/veterinario/VeterinarioPage.tsx` | Usar dados do banco em vez de mock, botao "Novo Paciente" funcional |
| `src/types/index.ts` | Expandir interface Pet com campos clinicos |
| `src/types/recommendation-confidence.ts` | Expandir `petProfile` com conditions/medications |
| `src/services/hybrid-recommendation-service.ts` | Usar perfil expandido na busca |
| `src/locales/pt/translation.json` | Adicionar traducoes PT |
| `src/locales/en/translation.json` | Adicionar traducoes EN |
| `src/i18n.ts` | Incrementar versao do cache |

## Prioridade de Implementacao

1. Criar tabelas no banco (`pet_profiles`, `pet_conditions`, `pet_medications`, `pet_exams`, `pet_clinical_notes`) com RLS
2. Criar formulario de registro de paciente (dados estruturados)
3. Criar edge function `extract-pet-clinical-data`
4. Implementar chat clinico inteligente com extracao
5. Criar pagina de perfil do paciente
6. Implementar gerador de pacientes de exemplo
7. Integrar com recommendation engine existente
8. Adicionar traducoes PT/EN
9. Atualizar documentacao (ARCHITECTURE.md, CURRENT_STATE.md, CHANGELOG.md)

## Secao Tecnica: Por que Chat + Formulario?

A abordagem hibrida resolve 3 problemas criticos:

1. **Barreira de entrada**: Veterinarios no consultorio nao tem tempo para preencher formularios extensos. O chat permite inserir dados clinicos no ritmo natural de uma consulta.

2. **Dados nao-estruturados ricos**: Informacoes como "claudicou nas ultimas semanas" ou "come menos desde quinta" contem sinais clinicos que formularios nao capturam. A IA pode mapear esses sinais para entidades do Knowledge Graph.

3. **Demonstrabilidade (Stanford)**: O "efeito WOW" de digitar uma descricao clinica e ver o sistema extrair entidades, cruzar com o Knowledge Graph, e gerar recomendacoes fundamentadas em evidencias e impressionante para uma demonstracao academica.
