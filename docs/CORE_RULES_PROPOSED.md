# Regras-Core Propostas (Deduzidas, ainda não promovidas)

> **O que é**: catálogo de **candidatas a Regras-Core** deduzidas pela IA durante a digestão de meta-estudos arquiteturais (tab "Fundamentos > Ingestão"). Cada candidata aguarda revisão humana para ser promovida, mesclada com RC existente, ou descartada.
>
> **Fonte de verdade**: coluna `proposed_rules` (jsonb) em `meta_studies`. Este arquivo é um espelho humano-legível e será sincronizado por extensão do `scripts/sync-core-rules.mjs` na Fase 2.
>
> **Workflow**:
> 1. Paper é ingerido em Fundamentos > Ingestão → IA emite seções tipadas + `proposed_rules[]`.
> 2. Curador revisa cada proposta na UI e marca **Promover** / **Descartar**.
> 3. Promover gera nova linha em `core_rules` com `origin='deductive'` e `proposed_from_meta_study=<id>`.
> 4. Descartar mantém a proposta no `meta_studies.proposed_rules` (auditoria), apenas não vira RC ativa.
>
> **Por que separar deste arquivo principal?** RCs ativas governam o pipeline em runtime; propostas são hipóteses ainda não validadas pelo time. Misturar os dois inflacionaria o catálogo de regras "vigentes" com material não revisto.

---

_(Vazio até a primeira ingestão de meta-estudo com schema v2.)_