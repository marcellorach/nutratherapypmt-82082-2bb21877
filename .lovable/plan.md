## Decisão
Unificar tudo num único hub **"Fontes Externas de Conhecimento"** dentro de Knowledge Base, com sub-abas. As telas espalhadas hoje viram seções dentro do hub.

---

## Diagnóstico (6 fontes externas, hoje espalhadas)

| Fonte | API key | Onde está hoje |
|---|---|---|
| UMLS / SNOMED-CT | `NLM_UMLS_API_KEY` (faltando) | `OntologyMappingTab` |
| MeSH | — (dump XML) | `OntologyBulkImportTab` |
| OMIA | — (dump txt) | `OntologyBulkImportTab` |
| ChEBI / PubChem / KEGG | — (live REST) | `ExternalSearchPanel` (base-knowledge) + `OntologyMappingTab` |
| PubMed / NCBI E-utilities | `NCBI_API_KEY` (opcional) | `kg-evidence-gap-fill`, `search-scientific-studies` |
| Perplexity | `PERPLEXITY_API_KEY` | `kg-evidence-gap-fill`, `query-perplexity` |

Problemas: status fragmentado, instruções espalhadas em 3 docs, duplicação de UI entre `ExternalSearchPanel` e `OntologyMappingTab`.

---

## Arquitetura proposta

**Uma rota nova** `/administrador?tab=external-sources` substitui o `OntologyHub` atual. Estrutura:

```text
Knowledge Base → 🌐 Fontes Externas
├─ 📊 Visão Geral        ← overview cards + secrets + mapa de uso (NOVO)
├─ 🔗 Mapeamento         ← ex-OntologyMappingTab (UMLS/SNOMED por entidade)
├─ 📥 Importar IDs       ← ex-OntologyBulkImportTab (dumps OMIA/MeSH/ChEBI)
├─ 🔍 Busca Externa      ← ex-ExternalSearchPanel (live ChEBI/PubChem/KEGG)
└─ 🧪 Auditoria Ontologia ← ex-OntologyAuditTab (classificação de entidades)
```

A aba "Ontology Audit" que existe hoje vira sub-aba também — todo o `OntologyHub.tsx` é substituído pelo novo hub. `ExternalSearchPanel` deixa de viver dentro de Base Knowledge e migra para cá (Base Knowledge mantém apenas o link "Buscar em fontes externas → Fontes Externas").

### Sub-aba "Visão Geral" (a parte nova)

```text
┌─ Status das 6 fontes (cards clicáveis → vão p/ sub-aba relevante)
│  UMLS · SNOMED · MeSH · OMIA · ChEBI · PubMed · Perplexity
│  Cada card: configured? · last_sync · entries · last_error · [Test]
│
├─ Chaves & Configuração
│  - NLM_UMLS_API_KEY    [status]  [docs ↗]  [add via Lovable Cloud]
│  - NCBI_API_KEY        [status]  [docs ↗]
│  - PERPLEXITY_API_KEY  [status]  [docs ↗]
│
└─ Mapa de Impacto (tabela)
   Fonte → Pipelines que consomem → Tabelas afetadas → Link p/ sub-aba
```

### Edge function nova: `external-sources-status`
Uma chamada retorna `{ source, configured, last_sync, entries, last_error, latency_ms }[]` para todas as 6 fontes. Reaproveita lógica de `fetch-external-ontologies` (action `check_status`) e adiciona ping NCBI + Perplexity.

### Doc consolidado: `docs/EXTERNAL_SOURCES.md`
Consolida `docs/ONTOLOGY_SOURCES.md` + instruções de UMLS/NCBI/Perplexity (URLs de cadastro, licenças, refresh, citação). Links clicáveis da UI.

---

## O que muda no código

**Criados:**
- `src/components/administrador/external-sources/ExternalSourcesHub.tsx` (shell com 5 sub-abas)
- `src/components/administrador/external-sources/OverviewTab.tsx`
- `src/components/administrador/external-sources/SourceStatusCard.tsx`
- `src/components/administrador/external-sources/SecretsPanel.tsx`
- `src/components/administrador/external-sources/UsageMap.tsx`
- `supabase/functions/external-sources-status/index.ts`
- `docs/EXTERNAL_SOURCES.md`

**Movidos / renomeados (mesmo conteúdo, novo lar):**
- `OntologyAuditTab` → `external-sources/AuditSubTab.tsx` (re-export do existente)
- `OntologyMappingTab` → `external-sources/MappingSubTab.tsx` (re-export)
- `OntologyBulkImportTab` → `external-sources/BulkImportSubTab.tsx` (re-export)
- `ExternalSearchPanel` → `external-sources/SearchSubTab.tsx` (wrapper que mantém o componente em base-knowledge funcional pelos imports legados)

**Editados:**
- `src/config/admin-tabs.ts` — substituir `ontology-audit` por `external-sources` (rota e ícone `Globe`)
- `src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx` — renomear item
- `src/components/administrador/AdministradorContent.tsx` — trocar `OntologyHub` por `ExternalSourcesHub`
- `src/components/administrador/base-knowledge/*` — onde usar `ExternalSearchPanel`, manter o componente; remover a sub-aba duplicada e adicionar link "Abrir Fontes Externas"
- `src/locales/{pt,en}/translation.json` — strings da nova UI
- `src/i18n.ts` — bump `I18N_VERSION`
- `supabase/config.toml` — `[functions.external-sources-status] verify_jwt = true`
- `CHANGELOG.md` + `src/data/projectOrganograma.ts` + `npm run sync:changelog`

**Deletado:**
- `src/components/administrador/OntologyHub.tsx` (substituído)

**Sem alterações:** schema do banco, RLS, edge functions existentes (UMLS/MeSH/ChEBI/OMIA/PubMed continuam consumidas pelas mesmas funções).

---

## Compatibilidade
- URL antiga `?tab=ontology-audit` redireciona para `?tab=external-sources&sub=audit` (preserva deep-links).
- Nenhuma mudança em pipelines (gap-fill, classificação, mapeamento) — só reorganização visual + status unificado.

## Riscos
- Sub-abas dentro de tab podem ficar densas em telas menores → garantir overflow horizontal nas tabs.
- Refatoração toca 5 componentes existentes — risco de regressão visual mitigado pelo padrão "wrapper que re-exporta o componente original sem mudar lógica".

Pronto para implementar?