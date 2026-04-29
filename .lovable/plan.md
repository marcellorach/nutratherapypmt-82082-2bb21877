## Diagnóstico confirmado

A revisão profunda mostrou 4 problemas reais:

1. **A timeline não depende da análise VetGraphRAG**
   - Em `PetProfilePage.tsx`, o componente `BiologicalTimeline` é renderizado sempre.
   - Ele recebe apenas `conditions`, `petName`, `petBreed`, `petAge` e `petId`.
   - Portanto, o usuário consegue avançar no tempo antes de rodar a análise clínica, o que passa a impressão correta de que a timeline está desacoplada do VetGraphRAG.

2. **O cenário “com protocolo” não usa de fato o stack recomendado pelo VetGraphRAG**
   - A análise clínica gera `recommendationCompounds`, `kgTriplets`, `kgPathways` e `kgProjections`, mas isso fica só em estado local da página.
   - A edge function `project-pet-trajectory` não consome esses resultados; ela lê só dados brutos do pet, predisposições de raça, medicações atuais e evidências genéricas.
   - Ou seja: o “com protocolo” hoje não está ancorado no stack realmente proposto pelo VetGraphRAG.

3. **O comparativo lateral usa outra fonte de dados e por isso pode ficar igual**
   - Em `BiologicalTimeline.tsx`, os dois cães lado a lado usam `projectionsWith` e `projectionsWithout` da heurística local (`buildBiologicalTimeline`).
   - Já a projeção textual principal usa `aiYears` apenas para o cenário ativo.
   - Resultado: a tela mistura duas lógicas diferentes e o comparativo visual pode não refletir a análise mais rica.

4. **Para este pet específico, hoje não há cobertura KG suficiente para diferenciar o protocolo**
   - No banco, o pet `Thor` tem `Osteoarthritis`, `Hip Dysplasia` e `Degenerative Myelopathy`.
   - Não há links em `nutraceutical_conditions` para essas condições nem para as predisposições correlatas verificadas.
   - As projeções cacheadas registram `years_gained = 0.00` tanto com quanto sem intervenção.
   - Pior: a resposta AI atual não traz caveats adequados de “sem cobertura KG”, então o sistema fica silenciosamente “igual”.

## Plano de correção

### 1) Tornar a projeção dependente de uma análise VetGraphRAG concluída
- Criar persistência para o último snapshot de análise clínica do pet, com:
  - status
  - data de conclusão
  - predisposições
  - alertas laboratoriais
  - triplets/pathways relevantes
  - compostos recomendados
  - projeções derivadas
- Salvar esse snapshot quando `handleAnalyzeWithKG` terminar com sucesso.
- Fazer a timeline ler esse snapshot persistido.
- Antes disso, mostrar estado bloqueado:
  - mensagem clara de que a projeção só fica disponível após análise VetGraphRAG
  - botão/CTA para executar análise
  - slider desabilitado

### 2) Unificar a fonte de verdade do comparativo “sem vs. com protocolo”
- Remover a mistura atual entre heurística local e AI parcial.
- Fazer ambos os lados do comparativo nascerem da mesma pipeline:
  - ou ambos vindos da edge function
  - ou ambos da heurística local enriquecida pelo snapshot
- Preferência: a edge function retornar **os dois cenários juntos** no mesmo payload, para evitar divergência visual/semântica.

### 3) Fazer o “com protocolo” usar o stack recomendado pelo VetGraphRAG
- Passar para a projeção os compostos realmente recomendados no snapshot da análise.
- Calcular cobertura por condição com base nesse stack recomendado, e não apenas em medicações atuais do pet.
- Na edge function, buscar evidência para a **união** de:
  - condições ativas do pet
  - predisposições ainda não diagnosticadas
- Se `pet_conditions.condition_id` estiver ausente, resolver por nome canônico PT/EN antes de consultar evidência.

### 4) Expor explicitamente quando o protocolo não muda nada
- Se não houver cobertura KG suficiente:
  - manter os dois cenários iguais, mas agora de forma explícita e honesta
  - mostrar banner clínico do tipo: “Neste caso, o protocolo geroprotetor ainda não altera a trajetória porque não há evidência específica suficiente para as condições deste pet.”
  - listar quais condições estão sem cobertura
  - destacar caveats no cabeçalho do comparativo e embaixo de cada cão
- Se houver cobertura parcial, mostrar exatamente **quais condições mudam** e **quais não mudam**.

### 5) Corrigir a UX do painel para reforçar causalidade e confiança
- Adicionar badge do tipo:
  - “Baseado na análise VetGraphRAG de DD/MM às HH:MM”
  - ou “Aguardando análise VetGraphRAG”
- Embaixo de cada cão, trocar a lista atual por 3 blocos curtos:
  - condições atuais
  - riscos emergentes
  - impacto do protocolo
- Quando não houver diferença, mostrar “sem benefício projetável no estado atual da evidência”.
- Quando houver diferença, mostrar delta explícito por condição.

### 6) Corrigir incoerências adjacentes que hoje reduzem confiança
- Remover fallback aleatório em `treatabilityData` (`Math.random`) no `PetProfilePage.tsx`.
- Garantir que gráficos e comparativos não mostrem números “decorativos” quando faltarem dados.
- Padronizar caveats, cobertura e fonte dos dados entre timeline, projeção e treatability.

## Arquivos que pretendo alterar

- `src/pages/veterinario/PetProfilePage.tsx`
- `src/components/pet/BiologicalTimeline.tsx`
- `src/hooks/usePetTrajectoryProjection.ts`
- `src/hooks/usePetCompoundCoverage.ts`
- `src/services/clinical-analysis-pipeline.ts`
- `supabase/functions/project-pet-trajectory/index.ts`
- nova migração para snapshot/status da análise clínica
- `src/i18n.ts`
- `src/locales/pt/translation.json`
- `src/locales/en/translation.json`
- documentação obrigatória: `ARCHITECTURE.md`, `docs/CURRENT_STATE.md`, `CHANGELOG.md`

## Detalhes técnicos

```text
Novo fluxo proposto

PetProfilePage
  -> Executar análise VetGraphRAG
  -> Salvar snapshot estruturado do resultado
  -> Timeline consulta snapshot salvo
  -> project-pet-trajectory recebe snapshot_id ou contexto derivado
  -> retorna:
       - without_protocol
       - with_protocol
       - coverage_by_condition
       - caveats
       - citations
  -> BiologicalTimeline renderiza os dois cenários da mesma fonte
```

### Estrutura sugerida do snapshot
- `pet_id`
- `status` (`pending | complete | failed`)
- `completed_at`
- `analysis_version`
- `recommendation_compounds jsonb`
- `predispositions jsonb`
- `lab_alerts jsonb`
- `kg_triplets jsonb`
- `kg_pathways jsonb`
- `kg_projections jsonb`
- `confidence_level`

### Regras de comportamento
- Sem snapshot concluído: timeline bloqueada.
- Snapshot concluído, sem cobertura KG: comparação liberada, mas com aviso de “efeito nulo por ausência de evidência específica”.
- Snapshot concluído, com cobertura parcial: diferenças apenas nas condições cobertas.
- Snapshot concluído, com cobertura robusta: renderizar deltas clínicos e anatômicos completos.

Se você aprovar, eu implemento isso de ponta a ponta e deixo a timeline realmente dependente do VetGraphRAG, sem ambiguidade.