

# Integração SNOMED-CT VetSCT + UMLS — Com Auditoria de Origem e Deduplicação

## Princípios Adicionais (conforme sua solicitação)
- **Auditoria de origem**: Cada código SNOMED/UMLS gravado registra *quem* mapeou, *quando*, *de qual fonte*, e *com qual método* (automático vs manual). Rastreável.
- **Deduplicação**: Antes de gravar qualquer mapeamento, verificar se já existe entidade com mesmo `snomed_code` ou `umls_cui` — impedir duplicatas e alertar.

## Mudanças

### 1. Migration SQL (colunas nullable + auditoria)

```sql
-- health_conditions
ALTER TABLE public.health_conditions
  ADD COLUMN IF NOT EXISTS snomed_code TEXT,
  ADD COLUMN IF NOT EXISTS umls_cui TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ontology_mapped_by TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapping_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_snomed_unique 
  ON public.health_conditions(snomed_code) WHERE snomed_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_umls_unique 
  ON public.health_conditions(umls_cui) WHERE umls_cui IS NOT NULL;

-- nutraceuticals (mesma estrutura)
ALTER TABLE public.nutraceuticals
  ADD COLUMN IF NOT EXISTS snomed_code TEXT,
  ADD COLUMN IF NOT EXISTS umls_cui TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ontology_mapped_by TEXT,
  ADD COLUMN IF NOT EXISTS ontology_mapping_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nutra_snomed_unique 
  ON public.nutraceuticals(snomed_code) WHERE snomed_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutra_umls_unique 
  ON public.nutraceuticals(umls_cui) WHERE umls_cui IS NOT NULL;
```

Campos de auditoria:
- `ontology_mapped_at`: timestamp do mapeamento
- `ontology_mapped_by`: user_id ou "system/auto"
- `ontology_mapping_source`: ex. "UMLS API", "manual", "SNOMED browser"

Indexes UNIQUE parciais garantem **zero duplicatas** de código.

### 2. Edge Function: adicionar source `umls` ao `fetch-external-ontologies`

- Nova função `searchUMLS()` usando UMLS REST API (`https://uts-ws.nlm.nih.gov/rest/`)
- Retorna: CUI, nome canônico, SNOMED codes mapeados, semantic types
- Requer secret `NLM_UMLS_API_KEY` (gratuita) — solicitar via `add_secret`
- Adicionar case `'umls'` e `'snomed'` no switch existente
- Incluir no `source_metadata` o campo `mapping_method: 'api_lookup'` para rastreabilidade

### 3. Novo serviço: `src/services/ontology-mapping-service.ts`

- `mapEntityToStandards(name, entityType)`: chama edge function source='umls', retorna snomed + cui
- `checkDuplicateMapping(snomedCode?, umlsCui?, table)`: consulta DB antes de gravar, retorna entidade existente se já mapeada
- `saveMapping(entityId, table, snomedCode, umlsCui, source)`: grava com campos de auditoria (quem, quando, de onde)
- `batchMapUnmapped(table, batchSize)`: busca entidades sem códigos, tenta mapear, retorna preview com duplicatas detectadas

### 4. Novo componente: `src/components/administrador/OntologyMappingTab.tsx`

Painel admin com:
- Tabela: entidades com colunas Nome | SNOMED | UMLS CUI | Mapeado por | Data | Fonte
- Filtros: ✅ Mapeado, ⚠️ Sugestão pendente, ❌ Sem mapeamento
- Botão "Auto-map" com **preview obrigatório**: mostra sugestões + alertas de duplicata antes de confirmar
- Alertas visuais de deduplicação: "⚠️ CUI C0018799 já atribuído a 'Heart Failure' — não pode ser reatribuído a 'Cardiac Disease'"
- Log de auditoria inline: quem mapeou, quando, método usado
- Nenhuma gravação sem confirmação explícita do admin

### 5. Enriquecer curation pipeline

No `useBaseKnowledgeCandidates.ts` — quando candidato é aprovado:
- Se veio de busca UMLS, propagar `snomed_code` e `umls_cui` para tabela destino
- Verificar duplicata antes de inserir (rejeitar se código já existe)
- Registrar origem no campo `ontology_mapping_source`

### 6. Traduções i18n (PT/EN)

Chaves para: títulos de colunas, badges de status, alertas de duplicata, botões, tooltips de auditoria.

### Pré-requisito

Solicitar `NLM_UMLS_API_KEY` via `add_secret` antes de implementar chamada UMLS.

### Arquivos

| Ação | Arquivo | Risco |
|------|---------|-------|
| Migration | Nova SQL (ADD COLUMN nullable + UNIQUE indexes) | **Nenhum** |
| Editar | `supabase/functions/fetch-external-ontologies/index.ts` | **Baixo** — novo case |
| Criar | `src/services/ontology-mapping-service.ts` | **Nenhum** — código novo |
| Criar | `src/components/administrador/OntologyMappingTab.tsx` | **Nenhum** — componente novo |
| Editar | `src/hooks/useBaseKnowledgeCandidates.ts` | **Baixo** — propagar campos extras |
| Editar | Traduções PT/EN + `i18n.ts` | **Nenhum** |
| Editar | `CHANGELOG.md` | **Nenhum** |

### O que NÃO muda

- Nenhum componente/fluxo existente é alterado em sua lógica
- VetGraphRAG, recomendações, pipeline clínica — tudo intacto
- Colunas novas são nullable — queries existentes não quebram

