

## Plano: Predisposições como Tags Integradas ao Sistema de Tags Existente

### Situação Atual

A boa notícia: a estrutura de dados **já está correta**. A tabela `breed_predispositions` usa `condition_id` como FK para `health_conditions` (Veterinary Targets). Ou seja, cada predisposição já aponta para uma condição curada da base.

O problema é apenas de **apresentação**: no `BreedPredispositionsPanel`, as predisposições aparecem como linhas de texto simples com badges genéricos, em vez de usar os componentes de tag já existentes no sistema (`ConditionTag`, `EvidenceTag`, `NutraceuticalTag`, etc.).

### O Que Mudar

#### 1. Refatorar `BreedPredispositionsPanel` para usar Tags

Substituir as linhas de texto por:
- **`ConditionTag`** para exibir o nome da condição (com score = risk_factor)
- **`EvidenceTag`** para exibir o grau de evidência (convertendo "high"→4.5, "moderate"→3.0, etc.)
- Badge de risco com cor por severidade (risk_factor >= 3 = vermelho, >= 2 = amarelo, < 2 = verde)

#### 2. Criar `PredispositionTag` reutilizável

Novo componente `src/components/administrador/tags/PredispositionTag.tsx`:
- Recebe: `conditionName`, `riskFactor`, `evidenceGrade`, `conditionId` (opcional, para navegação)
- Exibe: tag com ícone AlertTriangle, nome da condição, badge de risco colorido, indicador de evidência
- Tooltip: mostra detalhes (risco, evidência, link para a condição nos Veterinary Targets)
- Clicável: pode navegar para a condição no admin (ou abrir detalhes)

#### 3. Usar `PredispositionTag` em todos os contextos

| Local | Uso |
|-------|-----|
| `BreedPredispositionsPanel` (admin) | Lista de predisposições de uma raça |
| `ClinicalAlertsPanel` (pet profile) | Alertas de predisposição racial do cão |
| `ClinicalPipelineWorkflow` (step 2) | Resumo visual dos riscos identificados |

#### 4. Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/components/administrador/tags/PredispositionTag.tsx` (novo) | Tag reutilizável de predisposição |
| `src/components/administrador/breeds/BreedPredispositionsPanel.tsx` | Usar PredispositionTag em vez de linhas de texto |
| `src/components/pet/ClinicalAlertsPanel.tsx` | Usar PredispositionTag nos alertas raciais |

Resultado: predisposições são tags visuais consistentes com o resto do sistema, clicáveis, com tooltip, e que "conversam" com ConditionTag/EvidenceTag usando a mesma linguagem visual.

