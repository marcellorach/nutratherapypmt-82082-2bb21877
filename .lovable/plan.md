## Problema

O dialog de validação do vet-curador mostra resumo, confiança e sinais — mas **não mostra evidência**. Pior: o campo `evidence` do insight no banco está literalmente `{}` (o LLM não populou). A confiança 80% é auto-declarada pelo modelo, sem dados que a sustentem visíveis para o curador.

Sem evidência exposta, "Aprovar / Rejeitar" vira chute. Isso quebra a premissa da governança clínica.

## Solução: Painel "Evidência" no `VetCuratorReviewDialog`

Adicionar uma seção colapsável **"Evidência disponível"** entre o cabeçalho do insight e o campo de notas. Toda a evidência é computada *em tempo real* a partir da cohort — não depende do LLM ter populado nada.

### Conteúdo do painel (4 blocos)

**1. Suporte populacional**
- "N / total pets da cohort sustentam este insight" — query: pets do `cohort_id` que casam com ≥1 signal nas condições/flags.
- Barra visual mostrando proporção (ex.: 9/60 = 15%).
- Alerta âmbar automático se N < 10 ou proporção < 20%: *"amostra insuficiente para regra clínica"*.

**2. Estratificação dos pets que sustentam**
- Tabela compacta com top 5 raças (n + %), distribuição etária (média ± dp), split de severidade (mild/mod/sev).
- Reaproveita exatamente a lógica que `InsightDrillDownDialog` já roda.

**3. Top flags laboratoriais nos pets matched**
- Lista com `HCT`, `PLT`, etc. + frequência (n/total matched), normalizadas via `canonicalLabFlag` (já existe).
- Para cada flag, valor médio observado vs faixa de referência canina (quando numérico).

**4. Provenance & meta-evidência**
- Cohort de origem (nome + link "ver cohort").
- Modelo gerador + timestamp.
- Resultado da checagem de originalidade (`novel/partial/known`) + nº de citações da literatura, se já checada. Link "ver citações" abre `OriginalityDialog`.
- Bloco `evidence` JSON bruto do LLM em `<pre>`: se vazio (caso atual), mostra aviso âmbar *"O modelo não forneceu evidência quantitativa estruturada — apenas os dados derivados da cohort abaixo são auditáveis."*

### Botão secundário "Drill-down completo"
Botão pequeno no rodapé do painel que abre o `InsightDrillDownDialog` existente (gráficos por pet, lab values individuais) sem fechar o dialog de validação — útil se o curador quiser inspeção profunda antes de decidir.

### (Opcional, fora do escopo deste plano) Botão "Re-gerar com evidência obrigatória"
Apenas registrar como TODO no card de priorização: adicionar flag `require_quantitative_evidence: true` ao prompt do `analyze-cohort-patterns` e re-rodar para esse insight específico. Não implementar agora — deixa o ciclo focado em **expor o que já temos**.

## Implementação técnica

**Arquivo único: `src/components/administrador/priorizacoes/VetCuratorReviewDialog.tsx`**

Adicionar:
- `useEffect` que, quando `open && insight.cohort_id`, consulta:
  - `cohort_pets` filtrado por `cohort_id` (mesma query do drill-down — extrair para hook compartilhado `useInsightEvidence(insight)` para evitar duplicação).
- Componente interno `EvidencePanel` com os 4 blocos acima.
- Botão "Drill-down completo" que dispara um callback `onOpenDrillDown` (novo prop opcional) — o pai (`PopulationInsightsV0`) já tem `setDrillDownInsight`, basta encadear.

**Refatoração leve:**
Extrair de `InsightDrillDownDialog.tsx` a lógica `useMemo` de estratificação para um hook `src/hooks/useInsightEvidence.ts` reutilizado pelos dois dialogs. Isso garante que drill-down e painel de validação mostrem números **idênticos** — sem divergir.

**Sem mudança de DB.** Sem chamada de LLM. Só consulta + agregação no cliente.

**Tradução:** strings ficam em PT direto no componente (todo o resto do dialog já é PT) — sem mexer em i18n nesta entrega. Se quiser bilíngue, próxima iteração.

## Atualizações de governança

- `CHANGELOG.md` (`[Unreleased]` → `Changed`): painel de evidência no dialog de validação, hook compartilhado.
- `prioritizationBoard.ts`: atualizar descrição do card `vet-curator-insight-validation` mencionando o painel de evidência embutido.
- `npm run sync:changelog`.

## Fora do escopo (próximos cards, não agora)

- Re-gerar insights forçando `evidence` quantitativa no schema (precisaria mudar prompt + edge function + criar botão "re-analisar este insight").
- Backfill em massa dos insights existentes que vieram com `evidence={}`.
- Calcular p-valor / odds ratio para o sinal vs resto da cohort (estatística inferencial real — só faz sentido com cohort real, não sintético).
