## Diagnóstico

**a) Por que “ainda não estamos gerando os relatórios”**
- A v7.0.0 está no DB com `status: "failed"`, `html_path` apontando para `v7.0.0/pending.html` e `error: "Auditoria recusada por regressão de formato: faltam seções-chave: banco relacional e rls, uso de llm por edge function, análise do paciente, conformidade fda, conformidade ema, conformidade avma, gaps e riscos, apêndice c"`.
- O job de background termina, mas:
  1. A UI mostra o card “em geração” do `pending.html` porque o usuário abre a auditoria antes do polling concluir, e quando o backend marca `failed` o `html_path` continua sendo o placeholder (não há fallback no viewer).
  2. O critério de validação atual (`assessAuditHtml`) é too strict + binário: rejeita o relatório inteiro quando 3+ seções faltam e só dá 1 retry. Se o segundo retry também falhar, a auditoria fica sem HTML útil — sem nem expor parcial.
  3. O Gemini 3.1 às vezes responde com HTML curto/sem tabelas suficientes; sem ferramenta de “costurar seções” passo a passo, ele não bate o baseline.

**b) Cobertura incompleta (AI Scientist, Fundamentos Arquiteturais, etc.)**
- O escopo default em `TechnicalAuditsTab` (`DEFAULT_NEW_SCOPE`) e o prompt em `generate-audit` listam manualmente uma porção pequena de tópicos. Não enxergam:
  - AI Scientist (Roadmap kanban + Cohorts sintéticos + Population Insights + suggest-cohort-ideas + analyze-cohort-patterns + originalidade)
  - Fundamentos Arquiteturais / Meta-KG (core_rules, meta_studies, evidence, modulators)
  - 67 edge functions reais (o prompt cita só algumas)
  - As 30+ tabs admin já organizadas em `adminTabsConfig`
  - Histórico recente do `CHANGELOG.md` (só 3 auditorias anteriores são enviadas como contexto)
- Resultado: o LLM “esquece” áreas inteiras → o relatório nasce com lacuna estrutural, não só de redação.

**Suas respostas confirmadas**
- Baseline = profundidade do V3 (não a forma exata).
- Cobertura = tudo que existe, classificando cada área (ativo / parcial / doc-only / sandbox / planejado).
- Fonte = híbrido (checklist curado validando descoberta automática).
- Lacunas = marcar explicitamente como gap.

## O que vai ser construído

### 1. Checklist canônico de cobertura (`audit-coverage.ts`)
Arquivo único versionado com a lista de áreas obrigatórias do sistema, agrupadas por pilar:
- Plataforma & Infra (auth/RLS, edge functions, storage, i18n, cloud, deploy)
- Pipeline de Curadoria (7 estágios)
- Knowledge Graph (5 camadas, triplets, taxonomia)
- AI Scientist (roadmap, cohorts sintéticos, population insights, originalidade)
- Fundamentos Arquiteturais / Meta-KG (core_rules, meta_studies, modulators)
- Análise do Paciente & Recomendação Híbrida
- Digital Twin & Projeções
- Conformidade (FDA, EMA, AVMA, GMLP)
- Bilingue PT/EN
- Operações (analytics, prompts, ROI, demo pets)
- Sandbox / Planejado

Cada item tem `id`, `pillar`, `título PT/EN`, `como verificar` (tabs, edge functions, tabelas) e `expected_status_hint`. Esse arquivo passa a ser fonte única tanto para a UI (default scope) quanto para o backend (validação).

### 2. Auto-descoberta do estado real
Antes de chamar o LLM, a edge function monta um “system snapshot” objetivo (sem inferência):
- Contagens de cada tabela crítica
- Lista de edge functions deployadas
- Lista de tabs admin (de `adminTabsConfig`)
- Últimas 30 entradas do `CHANGELOG.md` (não só 3)
- Status de cada item do checklist por heurística simples (tabela existe? função existe? tab existe? changelog cita?) → vira `coverage_map`

Isso vai junto com o prompt. O LLM passa a ter base factual para classificar cada área em ativo/parcial/doc-only/sandbox/planejado, e não pode “esquecer” porque o checklist é input.

### 3. Geração em duas fases (estilo V3)
Em vez de uma única chamada que precisa cuspir 3.000+ palavras + JSON, a edge function passa a fazer:
1. **Outline** — modelo recebe checklist + snapshot e devolve um índice ordenado com 25+ seções e bullets-chave por seção.
2. **Renderização por blocos** — para cada grupo de seções, faz uma chamada focada que entrega HTML denso (texto + tabelas). As partes são concatenadas no servidor.
3. **Cierre** — sumário executivo + glossário + apêndices + bibliografia em uma chamada final.

Vantagens: cada chamada é curta o bastante para não regredir; uma falha em 1 bloco não derruba o relatório (é só reentregar aquele bloco); cobertura fica garantida porque o outline é a verificação.

### 4. Validação multi-nível e fallback útil
- Validação agora é por seção (não global): cada bloco do checklist precisa aparecer ou ser explicitamente marcado como “gap reconhecido”.
- Se um bloco falhar 2x, o relatório ainda é salvo como `ready_with_warnings` com uma seção “Lacunas de geração” listando o que faltou. Nunca mais ficamos sem nada.
- O `pending.html` deixa de virar `html_path` final: enquanto `status === "processing"`, a UI usa o estado `progress` e esconde o iframe; em `failed`, mostra o erro real e o botão de re-tentar; em `ready` o iframe carrega o HTML novo.

### 5. UI da aba de Auditorias
- Card de progresso: passa a mostrar cada bloco do outline conforme é finalizado (`6/24 seções prontas`), não só percentual abstrato.
- Após `failed`/`ready_with_warnings`: botão “Retomar do último bloco” que reusa o outline já salvo.
- Default scope = render do checklist canônico (já agrupado por pilar, com explicação curta) — não mais texto livre fixo, mas o checklist editável. Adicionar/remover áreas continua possível.

### 6. Limpeza imediata
- Remover a v7.0.0 atual (com placeholder) do DB para o próximo Gerar começar limpo.
- Após o novo pipeline rodar, gerar v7.0.0 já no padrão V3 com cobertura completa.

## Detalhes técnicos

**Arquivos a criar/alterar**

```text
src/data/audit-coverage.ts                 (novo · checklist canônico tipado)
src/components/administrador/audits/
  TechnicalAuditsTab.tsx                   (default scope vindo do checklist, viewer condicional, progresso por bloco, retomar)
  CoverageChecklistEditor.tsx              (novo · UI do escopo)
supabase/functions/generate-audit/index.ts (refactor: snapshot ampliado, outline → blocos → cierre, validação por seção, `ready_with_warnings`, progresso granular)
supabase/migrations/<nova>.sql             (apenas remoção da v7.0.0 falha + add coluna `outline jsonb` em technical_audits para permitir retomada)
```

**Modelo**
- Outline e cierre: `google/gemini-3.1-pro-preview` (já em uso).
- Blocos longos com tabelas: mesmo modelo; fallback `openai/gpt-5-mini` por bloco isolado quando o principal devolver < N palavras.

**Compatibilidade**
- Auditorias antigas (v3 / v5.x) continuam sendo lidas exatamente como hoje (mesmo `html_path`, mesmo viewer).
- O endpoint `progress` ganha campos novos (`blocks_done`, `blocks_total`) mas mantém os existentes.

## Fora do escopo desta entrega
- Geração nativa de PDF (continua via “imprimir como PDF” do browser, que já funciona).
- Mudança visual da aba para além do card de progresso e do editor de checklist.

Posso seguir construindo nesta direção?
