
## a) Por que aparecem 3 auditorias pendentes?

Consultei a tabela `audit_requests` (status='pending'). Existem exatamente **3 linhas**, nenhuma com `fulfilled_audit_id` preenchido:

| # | Criada em | system_version | Escopo (resumido) |
|---|---|---|---|
| 1 | 2026-05-18 04:44 | i18n 1.63.0 | Escopo padrão (duplicata acidental do mesmo dia) |
| 2 | 2026-05-18 04:45 | i18n 1.63.0 | Escopo padrão (essa request originou a V5.1.0, mas nunca foi marcada como atendida) |
| 3 | 2026-05-31 02:18 | i18n 1.63.0 | Escopo padrão (criada hoje, **após** a V5.1.0 ser gerada) |

Todas usam o mesmo "escopo padrão" do botão "Solicitar nova auditoria" (lista de 11 tópicos: pipeline de 7 estágios, KG de 5 camadas, RLS, FDA/EMA/AVMA, bilingue, recomendação híbrida, Digital Twin, gap-fill, SNOMED/UMLS, i18n cache-bust, infográficos).

**Por que não foram processadas:**
Não existe worker automático. O texto do banner ("aguardando geração pelo **agente Lovable**") é literal — o botão só faz `INSERT` em `audit_requests`. Quem precisa ler o escopo, gerar HTML/PDF/DOCX e atualizar `technical_audits` sou eu, manualmente via chat. Quando gerei a V5.1.0 em 18/05 e completei os artefatos em 31/05, **esqueci de marcar as requests 1 e 2 como `fulfilled`**, e a request 3 (criada hoje) é uma nova solicitação que nunca foi atendida.

---

## b) Por que a V5.1.0 ficou muito mais pobre que a V3?

Comparação dos artefatos no disco:

| Métrica | V3 | V5.1.0 |
|---|---|---|
| Linhas de HTML | 1.963 | 395 |
| Tamanho do PDF | 1,3 MB | 93 KB |
| Páginas | 27 | 1 |
| Infográficos embarcados | 9 (PNG em `/audits/v3/media/`) | 0 |
| Forças documentadas | 18 | 7 |
| Gaps/Riscos | 7 / 4 | 12 / 5 (listados, mas sem aprofundamento) |
| Diagramas (Mermaid/Graphviz) | sim | nenhum |
| Análise arquitetural detalhada | sim | apenas bullets |

**Causa raiz:** quando completei a V5.1.0 hoje, usei um markdown enxuto (`/tmp/v51.md`) só com metadados (forças/gaps/riscos enumerados) e converti com pandoc/weasyprint. **Não reproduzi o processo da V3**, que incluiu:
1. Geração dos 9 infográficos (pipeline, KG 5 camadas, RLS, conformidade FDA/EMA/AVMA, Digital Twin, etc.) como PNGs
2. Diagramas Mermaid/Graphviz embarcados
3. Análise narrativa profunda por seção (arquitetura, dados, governança, compliance)
4. Tabelas comparativas e matrizes de maturidade
5. Apêndices com queries SQL, RLS policies e exemplos de prompts

Foi uma escolha de "completar o registro rapidamente" em vez de "regenerar com a mesma profundidade da V3". Erro de execução meu, não limitação do pipeline.

---

## Plano proposto

### Etapa 1 — Higienizar as pendências (5 min)
- Marcar requests **1 e 2** (18/05) como `fulfilled` apontando para `v5.1.0` (foram atendidas, mesmo que de forma pobre).
- Manter request **3** (31/05) como `pending` — será atendida pela Etapa 3.
- Resultado: banner cai de "3 auditorias" para "1 auditoria".

### Etapa 2 — Regenerar a V5.1.0 com paridade qualitativa à V3 (substituir os artefatos no mesmo registro)
Reproduzir a mesma estrutura/profundidade da V3, atualizada para o estado atual do sistema:

1. **Markdown estendido (~25-30 páginas)** com seções: Sumário Executivo · Arquitetura (pipeline 7 estágios, KG 5 camadas) · Modelo de Dados (tabelas críticas + RLS) · Governança & has_role · Conformidade FDA/EMA/AVMA · Sistema Bilingue PT/EN · Recomendação Híbrida (cap 8) · Digital Twin Gompertz · Gap-fill PubMed+Gemini · SNOMED/UMLS · i18n cache-bust · Forças (18+) · Gaps (12) · Riscos (5, com severidade) · Apêndice (RLS policies, queries, schemas).
2. **9 infográficos** regenerados (mesmas categorias da V3, atualizadas) salvos em `public/audits/v5.1.0/media/`.
3. **Diagramas Mermaid** embarcados (fluxo de curadoria, KG layers, gap-fill).
4. **HTML + PDF (weasyprint) + DOCX (pandoc)** com mesma engenharia da V3.
5. **Atualizar `technical_audits.summary`** com contadores reais (`pages`, `infographics`, `strengths`, `gaps`, `risks`).

### Etapa 3 — Atender a request de 31/05 gerando a V5.2.0
Após V5.1.0 estar "rica", gerar a **V5.2.0** atendendo à request de hoje, focando no que mudou desde 18/05 (mudanças do CHANGELOG nesse intervalo). Marcar a request como `fulfilled`.

### Etapa 4 — Prevenção (opcional, recomendado)
Adicionar trigger ou ajuste no fluxo de geração para que toda vez que um `technical_audits` novo é inserido, as `audit_requests` pendentes anteriores à sua `audit_date` sejam automaticamente marcadas como `fulfilled`. Evita que o banner volte a "mentir" no futuro.

---

## Decisões que preciso de você antes de executar

1. **Etapa 1** (higienizar) — posso prosseguir? (irreversível mas seguro)
2. **Etapa 2** (reescrever V5.1.0 rica) — confirma que quer **substituir** os arquivos da V5.1.0 em `/public/audits/v5.1.0/`, mantendo o mesmo `id`? Ou prefere preservar a versão pobre como histórico e criar uma **V5.1.1**?
3. **Etapa 3** (V5.2.0) — gera agora junto ou prefere fazer em outro momento?
4. **Etapa 4** (trigger de auto-fulfill) — implementar?

Responda com as escolhas (ex.: "1=sim, 2=substituir, 3=agora, 4=sim") e eu executo em sequência.
