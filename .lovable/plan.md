## Diagnóstico honesto

Li o V3 agora (não tinha lido antes — só comparei métricas):
- **V3 real**: ~7.000 palavras, 29 seções, ~40 páginas planejadas (27 renderizadas), glossário de 13 termos, metodologia em 4 frentes, **5 jornadas** (revisor real/previsto, estudo real/previsto, paciente 6 estágios), **matriz ponto-a-ponto** FDA Jan/2025 + EMA Set/2024 + EU AI Act + AVMA Nov/2025 + GMLP (17 entradas regulatórias), 4 apêndices (SQL schema, inventário de Edge Functions, prompts/modelos LLM, métricas operacionais), 14 referências bibliográficas verificáveis, contagens reais do banco (~180 L0, ~140 L1…), comparação MedGraphRAG × VetGraphRAG.
- **V5.1.0 atual (após meu retrabalho)**: 12 seções, 18 páginas, ~2.000 palavras, bullets sem narrativa, **sem** jornadas, **sem** matriz regulatória ponto-a-ponto, **sem** apêndices SQL/Edge Functions/prompts, **sem** bibliografia, **sem** contagens reais do banco.

**A proposta de `summary` que fiz era insuficiente** — só telemetria (`{strengths, gaps, risks, pages, infographics}`). Não captura profundidade narrativa nem conteúdo. Precisa virar um **índice estruturado** que liste seções, apêndices, referências, contagens reais e flags de cobertura regulatória — para que o card no admin exiba a real riqueza do relatório e seja auditável.

---

## Plano (4 etapas, executar em sequência)

### Etapa 1 — Higienizar pendências (DB only)
Marcar `audit_requests` #1 e #2 (18/05) como `fulfilled` apontando para `v5.1.0`. Banner cai de 3 → 1.

### Etapa 2 — Regenerar V5.1.0 com paridade total ao V3 (substituir arquivos)

**2a. Coleta de dados reais** (antes de escrever):
- `read_query` no banco para contagens vivas: nós L0–L4 do KG, total de `triplet_extractions` aprovados, `study_embeddings` chunks, `user_roles`, `audit_requests`, RLS policies por tabela, Edge Functions deployadas (via listagem do filesystem `supabase/functions/`), tasks no `ai_prompt_versions`.
- Extrair lista real de Edge Functions e prompts ativos.

**2b. Markdown novo (~40 páginas)** seguindo a estrutura exata do V3, adaptada ao estado de **31/05/2026**:

1. Sumário executivo (com forças/gaps/riscos quantificados)
2. Glossário (13+ termos, notação biológica)
3. Metodologia (4 frentes: código, dados, benchmark documental 2025–2026, limitações)
4. Visão arquitetural — 5 camadas (com contagens reais do banco)
5. Pipeline de digestão (7 estágios, dedup SHA-256, chunking, embeddings text-embedding-004, Stage 1/2/3)
6. Vetorização e embeddings
7. Banco relacional e RLS (lista de tabelas críticas + policies)
8. Uso de LLM por edge function (modelo + tarefa + custo estimado)
9. Knowledge Graph (Neo4j + espelho Supabase)
10. Análise do paciente — 6 estágios
11. Recomendação híbrida (cap 8, contexto clínico)
12. Digital Twin sigmoidal (Gompertz, years_gained, limitações)
13. Jornada real do revisor veterinário (swimlane)
14. Jornada prevista do revisor (roadmap)
15. Jornada real do estudo científico
16. Jornada prevista do estudo (roadmap)
17. Comparação MedGraphRAG × VetGraphRAG × Senex AI
18. Conformidade FDA (Draft Jan/2025) — matriz ponto-a-ponto
19. Conformidade EMA (Set/2024) + EU AI Act
20. Conformidade AVMA (Nov/2025) / AAVSB
21. GMLP — 10 princípios
22. Pontos fortes (18+, com evidência de código/arquivo)
23. Gaps e riscos (12 gaps + 5 riscos, com severidade e mitigação)
24. Roadmap P0–P3 detalhado
25. Apêndice A — Schema SQL principal (DDL real das tabelas críticas)
26. Apêndice B — Inventário de Edge Functions (gerado do `supabase/functions/`)
27. Apêndice C — Prompts e modelos LLM (do `ai_prompt_versions`)
28. Apêndice D — Métricas operacionais (contagens vivas)
29. Bibliografia (14+ referências verificáveis: MedGraphRAG, GraphRAG, FDA, EMA, AVMA, GMLP, Gompertz, SNOMED-CT, UMLS…)

**2c. Infográficos**: manter os 9 PNGs gerados, **mais** 1 novo (Comparação MedGraphRAG × Senex) → 10 infográficos.

**2d. Renderização**: HTML + PDF (Chromium headless) + DOCX (pandoc). Meta: **≥30 páginas**, ≥6.500 palavras, ≥10 infográficos, 14 referências.

### Etapa 3 — `technical_audits.summary` rico (não só telemetria)

JSON estendido (versionado em `summary.schema = 'v2'`):

```text
{
  schema: 'v2',
  pages: 32,
  words: 6800,
  infographics: 10,
  references: 14,
  sections: [{nr:1, title:'Sumário Executivo', words:420}, …29 entradas],
  appendices: ['SQL Schema','Edge Functions','LLM Prompts','Métricas'],
  strengths: {count:18, top5:['no-mock','bilingue','RLS','HITL','SNOMED/UMLS']},
  gaps: {count:12, P0:[…], P1:[…]},
  risks: {count:5, high:[…], medium:[…]},
  compliance: {
    fda: {points:7, covered:5, partial:2},
    ema: {points:4, covered:3, partial:1},
    avma: {points:4, covered:3, partial:1},
    gmlp: {principles:10, covered:8, partial:2}
  },
  kg_snapshot: {L0:180, L1:140, L2:?, L3:?, L4:?, triplets_approved:?, studies:?},
  edge_functions_count: <real>,
  generated_at: '2026-05-31T…',
  generator: 'lovable-agent · paridade V3'
}
```

Update via `supabase--insert` (UPDATE).

### Etapa 4 — V5.2.0 (atender request #3 de 31/05) + trigger anti-mentira

**4a.** Após V5.1.0 estar rica, gerar V5.2.0 focando no **delta CHANGELOG 18/05 → 31/05** (Senex AI rebrand, ai-task-router governance, infraestrutura nova). Reaproveita a estrutura V5.1.0, substitui Executivo + Roadmap + adiciona seção "Mudanças desde V5.1.0".

**4b.** Trigger SQL em `technical_audits` (AFTER INSERT) que marca como `fulfilled` toda `audit_requests` com `requested_at < NEW.audit_date AND fulfilled_audit_id IS NULL`. Evita o banner voltar a "mentir".

---

## O que muda no app vs só nos arquivos
- **Frontend**: nenhuma mudança de UI/componente é necessária. Card de auditorias já lê `summary` como JSON; só passa a exibir mais campos (posso adicionar 1–2 linhas no `TechnicalAuditsTab.tsx` para mostrar "Conformidade FDA 5/7 · EMA 3/4 · AVMA 3/4 · GMLP 8/10" se você quiser — opcional).
- **DB**: 1 UPDATE em `audit_requests`, 1 UPDATE em `technical_audits.summary`, 1 INSERT V5.2.0, 1 migration para o trigger.
- **Arquivos**: substitui `public/audits/v5.1.0/{index.html,auditoria.pdf,auditoria.docx}` + adiciona ~1 PNG novo; cria `public/audits/v5.2.0/*`.

## Estimativa de execução
- Etapa 1: 1 min
- Etapa 2: ~6–8 min (coleta DB + escrever 6.500 palavras + render PDF/DOCX + 1 infográfico novo)
- Etapa 3: 1 min
- Etapa 4a: ~3 min, 4b: 1 min (migration)

Total: ~12–14 min de execução autônoma.

---

## Confirme antes de eu executar
1. **Etapa 2** — pode **substituir** os arquivos atuais da V5.1.0 (sem manter histórico da versão pobre)?
2. **Etapa 3** — quer o card no admin mostrando 1 linha extra com conformidade (FDA/EMA/AVMA/GMLP)? (sim/não)
3. **Etapa 4a** — gera V5.2.0 logo em seguida?
4. **Etapa 4b** — implementa trigger anti-mentira?

Se só responder "tudo sim", executo as 4 etapas em sequência com 1 linha extra no card.