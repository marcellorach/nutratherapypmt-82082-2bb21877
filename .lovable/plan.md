

# Plano: Enriquecimento Automatizado do Knowledge Graph com Estudos Reais

## Objetivo
Criar uma edge function que busca estudos cientificos reais sobre longevidade canina/geroprotetores no PubMed/OpenAlex, baixa os PDFs, processa com Gemini, gera triplets e aprova tudo automaticamente -- enriquecendo o Knowledge Graph de ponta a ponta.

## Abordagem

Criar uma nova edge function `enrich-knowledge-graph` que orquestra todo o pipeline existente em sequencia para cada estudo encontrado.

### Pipeline por estudo:
1. **Buscar estudos** via `search-scientific-studies` (PubMed/OpenAlex) com queries sobre geroprotetores caninos
2. **Baixar PDF** via `download-study-pdf` 
3. **Extrair dados** via `gemini-file-search` (extrai entidades, dosagens, etc.)
4. **Gerar triplets** via `generate-triplets`
5. **Auto-aprovar** triplets com confianca >= 70% e marcar estudo como "approved"
6. **Consolidar** via `consolidate-knowledge-graph`
7. **Sincronizar Neo4j** via `sync-study-to-neo4j`

### Queries de busca propostas (5 estudos):
- "curcumin canine aging neuroprotection"
- "omega-3 fatty acids dog osteoarthritis longevity"
- "resveratrol canine cardiac aging"
- "NAD+ NMN canine geriatric supplementation"
- "probiotics gut microbiome elderly dogs"

### Interface no Admin
Adicionar um botao "Enriquecer Knowledge Graph" na tab Knowledge Graph que:
- Mostra progresso em tempo real (estudo 1/5, etapa atual)
- Lista estudos encontrados e status de cada um
- Ao final, exibe resumo (X estudos, Y triplets, Z novas conexoes)

## Detalhes Tecnicos

### Nova Edge Function: `enrich-knowledge-graph`
- Recebe: lista de queries ou usa queries padrao
- Chama as edge functions existentes sequencialmente via fetch interno (Supabase service URL)
- Retorna progresso via streaming SSE para feedback em tempo real
- Timeout de 300s (estudos levam tempo para processar)

### Modificacoes no Frontend
- **KnowledgeGraphTab.tsx**: Adicionar botao "Enriquecer com Estudos Reais" com dialog de progresso
- Novo componente `EnrichKnowledgeGraphDialog.tsx` com:
  - Lista de queries editaveis
  - Progresso por estudo (barra + log)
  - Resumo final

### Arquivos a criar/modificar:
1. `supabase/functions/enrich-knowledge-graph/index.ts` (nova edge function)
2. `src/components/administrador/knowledge-graph/EnrichKnowledgeGraphDialog.tsx` (novo componente)
3. `src/components/administrador/knowledge-graph/KnowledgeGraphTab.tsx` (adicionar botao)
4. Arquivos de traducao PT/EN
5. `src/i18n.ts` (incrementar versao)

### Riscos e Mitigacoes
- **PDFs inacessiveis**: O download-study-pdf ja lida com isso, estudos sem PDF serao pulados
- **Timeout**: Se 5 estudos excederem o timeout, processar em lotes menores
- **Qualidade dos triplets**: Usar threshold de 70% para auto-aprovacao (mais permissivo para enriquecimento rapido)

