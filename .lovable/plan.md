

# Implementação Completa: SNOMED-CT/UMLS — Edge Function + Mapping Service + Admin UI + Pipeline

## O que já foi feito
- Migration SQL executada (colunas `snomed_code`, `umls_cui`, `ontology_mapped_at`, `ontology_mapped_by`, `ontology_mapping_source` em `health_conditions` e `nutraceuticals` com partial unique indexes)

## O que será implementado agora

### 1. Edge Function: adicionar `searchUMLS()` e `searchSNOMED()` ao `fetch-external-ontologies`
- Nova função `searchUMLS()` que usa UMLS REST API (`https://uts-ws.nlm.nih.gov/rest/search/current`)
- Verifica se `NLM_UMLS_API_KEY` existe via `Deno.env.get()` — se ausente, retorna array vazio + log "UMLS API key not configured"
- Retorna: CUI, nome canônico, semantic types, SNOMED codes no `source_metadata`
- Nova função `searchSNOMED()` que busca via UMLS filtrando por `rootSource=SNOMEDCT_VET`
- Novos cases `'umls'` e `'snomed'` no switch existente
- Campo `mapping_method: 'api_lookup'` no `source_metadata` para auditoria

### 2. Novo serviço: `src/services/ontology-mapping-service.ts`
- `mapEntityToStandards(name, entityType)`: invoca edge function source='umls', retorna snomed + cui
- `checkDuplicateMapping(snomedCode?, umlsCui?, table)`: consulta DB, retorna entidade existente se já mapeada (usa os unique indexes)
- `saveMapping(entityId, table, snomedCode, umlsCui, source, userId)`: grava com campos de auditoria
- `batchMapUnmapped(table, batchSize)`: busca entidades sem códigos, tenta mapear, retorna preview antes de confirmar
- `getMappingStats(table)`: retorna contagem de mapeados vs não mapeados

### 3. Novo componente: `src/components/administrador/OntologyMappingTab.tsx`
- Tabela com colunas: Nome | Tipo | SNOMED | UMLS CUI | Mapeado por | Data | Fonte
- Filtros: Todos | Mapeado | Pendente | Sem mapeamento
- Toggle para alternar entre `health_conditions` e `nutraceuticals`
- Botão "Auto-map" com **preview obrigatório** antes de confirmar
- Alertas de deduplicação: "CUI X já atribuído a Y"
- Badge de status UMLS API (configurada/não configurada)
- Mapeamento manual: campo de busca UMLS inline por entidade
- Registrado como nova tab no `admin-tabs.ts` no grupo `knowledge-base`

### 4. Enriquecer pipeline de curadoria
- Em `useBaseKnowledgeCandidates.ts` no `useApproveCandidate`:
  - Se candidato tem `source_metadata.cui` ou `source_metadata.snomed_code`, propagar para tabela destino
  - Verificar duplicata antes de inserir (se código já existe, rejeitar com mensagem)
  - Gravar `ontology_mapping_source`, `ontology_mapped_at`, `ontology_mapped_by`

### 5. Traduções i18n (PT/EN)
- Incrementar versão para `1.20.0`
- Chaves para: `ontologyMapping.title`, `ontologyMapping.filters.*`, `ontologyMapping.columns.*`, `ontologyMapping.autoMap.*`, `ontologyMapping.duplicateAlert`, `ontologyMapping.umls.*`, etc.

### 6. Documentação
- CHANGELOG.md: registrar todas as mudanças em [Unreleased]

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/fetch-external-ontologies/index.ts` |
| Criar | `src/services/ontology-mapping-service.ts` |
| Criar | `src/components/administrador/OntologyMappingTab.tsx` |
| Editar | `src/config/admin-tabs.ts` |
| Editar | `src/hooks/useBaseKnowledgeCandidates.ts` |
| Editar | `src/locales/pt/translation.json` |
| Editar | `src/locales/en/translation.json` |
| Editar | `src/i18n.ts` |
| Editar | `CHANGELOG.md` |

### Segurança
- Nenhuma coluna existente é alterada
- Fallback graceful se UMLS API key ausente
- Deduplicação validada tanto no client (preview) quanto no DB (unique indexes)

