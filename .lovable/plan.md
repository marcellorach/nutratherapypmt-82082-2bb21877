

## Plano: Governança de Entidades Base + Pipeline de Análise Clínica Visual

### Diagnóstico Atual

O sistema já possui:
- **Breeds** (tabela `breeds` com FK para `breed_groups`) — sem UI de gerenciamento
- **Health Conditions / Veterinary Targets** (tabela `health_conditions` com UI CRUD completa)
- **Breed Predispositions** (tabela `breed_predispositions` com FK para `breeds` e `health_conditions`) — sem UI de gerenciamento
- **Lab Reference Ranges** (tabela `lab_reference_ranges`) — sem UI de gerenciamento
- **Base Knowledge Candidates** (tabela + UI CandidatesQueue) — sandbox para entidades vindas de fontes externas (ChEBI, PubChem, etc.)
- **Pipeline clínico** (`clinical-analysis-pipeline.ts`) — já funcional mas sem visualização do workflow

**O que falta:**
1. UI para gerenciar **Breeds** e suas **Predispositions** (link breed ↔ condition)
2. UI para gerenciar **Lab Reference Ranges**
3. Extensão do sandbox (CandidatesQueue) para receber predisposições de fontes públicas
4. Visualização clara do workflow do pipeline clínico

---

### 1. Nova aba: "Raças & Predisposições" no Admin

Criar `src/components/administrador/breeds/BreedsManagementTab.tsx`:

- **Lista de raças** com search, filtro por grupo/porte, contagem de predisposições
- **Expandir raça** → mostra predisposições vinculadas (condition_name, risk_factor, evidence_grade)
- **CRUD**: Adicionar/editar raça, adicionar/remover predisposição (selecionando de `health_conditions`)
- **Importar de fonte pública**: botão que busca predisposições de APIs externas → cai no sandbox (`base_knowledge_candidates` com `entity_type = 'breed_predisposition'`) aguardando aprovação humana

Registrar no sidebar do admin no grupo "Base de Conhecimento".

### 2. Nova aba: "Referências Laboratoriais" no Admin

Criar `src/components/administrador/lab-references/LabReferencesTab.tsx`:

- Tabela editável com test_name, species, unit, min/max, age_group, clinical_significance
- CRUD inline
- Importação futura de fontes públicas → sandbox

Registrar no sidebar do admin.

### 3. Extensão do Sandbox para Predisposições

O `base_knowledge_candidates` já suporta `entity_type` genérico. Adicionar suporte para:
- `entity_type = 'breed_predisposition'` — ao aprovar, insere em `breed_predispositions`
- `entity_type = 'lab_reference'` — ao aprovar, insere em `lab_reference_ranges`

Modificar `CandidatesQueue.tsx` para tratar esses tipos na aprovação.

### 4. Workflow Visual do Pipeline Clínico

Criar `src/components/pet/ClinicalPipelineWorkflow.tsx`:

- Diagrama visual de 6 etapas (Steps/Stepper) mostrando o estado de cada fase durante a análise
- Cada etapa mostra: ícone, nome, status (pendente/processando/concluído/erro), contagem de resultados
- Integrar no `PetProfilePage` — aparece durante e após a análise

```text
[1. Perfil] → [2. Predisposições] → [3. Exames] → [4. KG] → [5. Interações] → [6. Recomendação]
   ✓ 8 dados     ✓ 3 riscos        ✓ 2 alertas    ✓ 12 triplets  ✓ 0 conflitos   ✓ 5 compostos
```

### 5. Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/components/administrador/breeds/BreedsManagementTab.tsx` (novo) | CRUD de raças + predisposições |
| `src/components/administrador/breeds/BreedPredispositionsPanel.tsx` (novo) | Painel expandível de predisposições por raça |
| `src/components/administrador/lab-references/LabReferencesTab.tsx` (novo) | CRUD de referências laboratoriais |
| `src/components/pet/ClinicalPipelineWorkflow.tsx` (novo) | Visualização do workflow de análise |
| `src/components/administrador/base-knowledge/CandidatesQueue.tsx` | Suporte a novos entity_types na aprovação |
| `src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx` | Adicionar links para novas abas |
| `src/components/administrador/AdminPainel.tsx` | Registrar novas abas |
| `PetProfilePage.tsx` | Integrar workflow visual |
| Traduções PT/EN | ~30 novas chaves |

### 6. Fluxo de dados públicos (sandbox)

```text
Fonte Pública (API/CSV) → base_knowledge_candidates (status: pending)
                                    ↓
                          Curadoria Humana (CandidatesQueue)
                                    ↓
                    Aprovado → breed_predispositions / lab_reference_ranges
                    Rejeitado → marcado como rejected
```

### Resultado

- Todas as entidades base (raças, condições, predisposições, referências lab) têm CRUD no admin
- Dados de fontes públicas passam obrigatoriamente por sandbox antes de entrar no sistema
- O pipeline clínico é visualmente rastreável com um stepper de 6 etapas
- Tudo "conversa com tudo": breed → predisposition → health_condition → KG → recommendation

