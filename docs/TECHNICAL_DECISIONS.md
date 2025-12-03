# 🎯 NutraTherapy - Decisões Técnicas Obrigatórias

---
**Versão:** 1.0.0  
**Última Atualização:** 2025-12-03  
**Responsável:** AI Assistant  
**Status:** 🟢 Ativo  
---

> ⚠️ **ESTE ARQUIVO DEVE SER CONSULTADO ANTES DE QUALQUER IMPLEMENTAÇÃO**
> 
> Contém decisões técnicas críticas que NUNCA devem ser alteradas sem 
> discussão explícita com o usuário. Estas decisões foram tomadas após
> análise cuidadosa e impactam toda a arquitetura do sistema.

---

## 📋 Índice

1. [LLM & AI](#-llm--ai)
2. [Database & Backend](#️-database--backend)
3. [Internacionalização](#-internacionalização)
4. [Design & UI](#-design--ui)
5. [Visualizações](#-visualizações)
6. [Segurança](#-segurança)
7. [O Que NUNCA Fazer](#-o-que-nunca-fazer)
8. [Histórico de Decisões](#-histórico-de-decisões)

---

## 🤖 LLM & AI

### Modelos Obrigatórios

| Decisão | Valor Obrigatório | Motivo |
|---------|-------------------|--------|
| **Modelo padrão para extração** | `google/gemini-3-pro-preview` | Multi-hop reasoning superior, extração hierárquica de alta qualidade |
| **Modelo padrão para síntese** | `google/gemini-3-pro-preview` | Citações precisas, reasoning complexo sobre grafos de conhecimento |
| **Modelo para chat de documentos** | `google/gemini-3-pro-preview` | Compreensão contextual profunda |
| **Modelo para tradução** | `google/gemini-3-pro-preview` | Precisão terminológica médica |
| **Gateway de AI** | Lovable AI Gateway | Sem necessidade de chave externa, integração nativa |
| **Embeddings** | `text-embedding-004` (768 dim) | Compatibilidade pgvector, qualidade semântica |

### Configuração do Lovable AI Gateway

```typescript
// ✅ CORRETO: Usar Lovable AI Gateway
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-3-pro-preview', // SEMPRE este modelo
    messages: [...]
  }),
});

// ❌ ERRADO: Usar modelos antigos
model: 'google/gemini-2.5-flash'  // NÃO USAR
model: 'google/gemini-2.5-pro'    // NÃO USAR
model: 'gemini-2.0-flash-exp'     // NÃO USAR
```

### Google AI Direct (quando necessário para File API)

```typescript
// Para funcionalidades que requerem Google AI Direct (File API, etc.)
const MODEL_NAME = 'gemini-3-pro-preview'; // NUNCA gemini-2.x
```

---

## 🗄️ Database & Backend

| Decisão | Valor Obrigatório | Motivo |
|---------|-------------------|--------|
| **Graph Database** | Neo4j AuraDB (Free Tier) | Multi-hop queries, reasoning sobre caminhos biológicos |
| **Vector Database** | Supabase pgvector (768 dim) | Busca semântica, chunks de texto, integração nativa |
| **Backend principal** | Lovable Cloud (Supabase) | Infraestrutura integrada, sem setup externo |
| **Edge Functions** | Deno runtime | Padrão Supabase |
| **Autenticação** | Supabase Auth (email/password) | Nunca signup anônimo |

### Tabelas Hierárquicas VetGraphRAG

| Tabela | Camada | Propósito |
|--------|--------|-----------|
| `nutraceuticals` | L0 (Compound) | Compostos e substâncias |
| `pathway_nodes` | L1 (Target) | Vias moleculares (KEGG, Reactome) |
| `mechanism_nodes` | L2 (Mechanism) | Mecanismos de ação |
| `biological_effect_nodes` | L3 (Effect) | Efeitos biológicos |
| `health_conditions` | L4 (Outcome) | Condições clínicas |
| `hierarchical_edges` | Relações | Todas as conexões entre camadas |
| `triplet_extractions` | Curadoria | Triplets extraídos de estudos |

---

## 🌍 Internacionalização

| Decisão | Valor Obrigatório | Motivo |
|---------|-------------------|--------|
| **Sistema i18n** | i18next + react-i18next | Já implementado, robusto |
| **Idiomas suportados** | PT-BR (padrão) + EN | Bilíngue obrigatório desde o início |
| **Arquivos de tradução** | `src/locales/pt/translation.json` + `src/locales/en/translation.json` | Estrutura padrão |
| **Cache invalidation** | Incrementar `currentVersion` em `src/i18n.ts` | Forçar recarga de traduções |

### Processo Obrigatório para Textos

```typescript
// 1. PRIMEIRO: Incrementar versão em src/i18n.ts
const currentVersion = '1.0.X'; // Incrementar ANTES de qualquer mudança

// 2. DEPOIS: Criar chaves em AMBOS os arquivos JSON
// src/locales/pt/translation.json
{
  "modulo.componente.texto": "Texto em português"
}
// src/locales/en/translation.json
{
  "modulo.componente.texto": "English text"
}

// 3. ENTÃO: Usar no componente
const { t } = useTranslation();
<span>{t('modulo.componente.texto')}</span>

// ❌ NUNCA fazer
<span>Texto hardcoded</span> // ERRADO
```

---

## 🎨 Design & UI

| Decisão | Valor Obrigatório | Motivo |
|---------|-------------------|--------|
| **Biblioteca UI** | shadcn-ui + Radix UI | Já implementado, acessível |
| **Estilização** | Tailwind CSS com tokens semânticos | Design system consistente |
| **Tema** | next-themes (light/dark) | Suporte nativo |
| **Estilo visual** | Clean, minimalista, elegante | Especificação do projeto |
| **Paleta de cores** | Pastéis diferenciadas (não apenas tons da mesma cor) | Design doc |
| **Tipografia** | Clara e legível | UX médico/científico |

### Regras de Estilização

```typescript
// ✅ CORRETO: Usar tokens semânticos
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">

// ❌ ERRADO: Usar cores diretas
<div className="bg-white text-black">
<Button className="bg-blue-500">
```

---

## 📊 Visualizações

| Decisão | Valor Obrigatório | Motivo |
|---------|-------------------|--------|
| **Grafos de conhecimento** | vis-network | Já implementado, interativo |
| **Charts estatísticos** | Recharts + Nivo | Já implementado, responsivo |
| **Sankey diagrams** | Custom implementation | Fluxos de dados específicos |
| **Matrizes de correlação** | Custom components | Visualizações científicas |

---

## 🔒 Segurança

| Decisão | Valor Obrigatório | Motivo |
|---------|-------------------|--------|
| **RLS (Row Level Security)** | Sempre ativado em tabelas com dados sensíveis | Proteção de dados |
| **Autenticação** | Supabase Auth com email/password | Rastreabilidade |
| **Signup anônimo** | **DESATIVADO** | Segurança obrigatória |
| **JWT em Edge Functions** | Configurar `verify_jwt` em `config.toml` | Controle de acesso |
| **Secrets** | Armazenados em Supabase Secrets | Nunca em código |

### Configuração de Edge Functions

```toml
# supabase/config.toml

[functions.minha-funcao]
verify_jwt = true  # Para funções autenticadas
# verify_jwt = false  # APENAS para webhooks públicos
```

---

## ⛔ O Que NUNCA Fazer

### 1. Modelos de IA
- ❌ **NUNCA** usar `google/gemini-2.5-flash` ou `google/gemini-2.5-pro`
- ❌ **NUNCA** usar `gemini-2.0-flash-exp` ou qualquer modelo 2.x
- ✅ **SEMPRE** usar `google/gemini-3-pro-preview`

### 2. Textos e Internacionalização
- ❌ **NUNCA** escrever textos hardcoded em português ou inglês
- ❌ **NUNCA** criar chaves de tradução em apenas um idioma
- ✅ **SEMPRE** usar `t()` para todos os textos visíveis
- ✅ **SEMPRE** criar chaves em PT e EN simultaneamente

### 3. Arquivos Protegidos
- ❌ **NUNCA** editar `src/integrations/supabase/client.ts`
- ❌ **NUNCA** editar `src/integrations/supabase/types.ts`
- ❌ **NUNCA** editar `.env` diretamente
- ❌ **NUNCA** editar `package.json` diretamente

### 4. Schemas Supabase
- ❌ **NUNCA** modificar schema `auth`
- ❌ **NUNCA** modificar schema `storage`
- ❌ **NUNCA** modificar schema `realtime`
- ❌ **NUNCA** modificar schema `supabase_functions`

### 5. Escopo de Mudanças
- ❌ **NUNCA** fazer mudanças visuais em páginas fora do escopo da tarefa
- ❌ **NUNCA** modificar lógica de negócio ao fazer mudanças de UI
- ✅ **SEMPRE** perguntar se há dúvida sobre o escopo

### 6. Autenticação
- ❌ **NUNCA** implementar signup anônimo
- ✅ **SEMPRE** usar autenticação completa com email/password

---

## 📜 Histórico de Decisões

### 2025-12-03 - Padronização Gemini 3 Pro Preview
- **Decisão**: Todas as edge functions devem usar `google/gemini-3-pro-preview`
- **Motivo**: Multi-hop reasoning superior para extração de cadeias biológicas complexas
- **Impacto**: 4 edge functions atualizadas (generate-triplets, gemini-file-search, document-chat, translate-and-categorize-conditions)

### 2025-11-xx - Arquitetura VetGraphRAG Hierárquica
- **Decisão**: Modelo de 5 camadas (L0→L4) para Knowledge Graph
- **Motivo**: Representação precisa de cadeias biológicas veterinárias
- **Impacto**: Novas tabelas (pathway_nodes, mechanism_nodes, biological_effect_nodes, hierarchical_edges)

### 2025-11-xx - Bilinguismo Obrigatório
- **Decisão**: PT-BR e EN desde o início em todas as interfaces
- **Motivo**: Público internacional, demo Stanford
- **Impacto**: Processo i18n rigoroso documentado

---

## 🔗 Documentos Relacionados

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitetura técnica completa
- [CURRENT_STATE.md](./CURRENT_STATE.md) - Estado atual do projeto
- [GRAPHRAG_ARCHITECTURE.md](./GRAPHRAG_ARCHITECTURE.md) - Arquitetura GraphRAG detalhada
- [STANFORD_DEMO.md](./STANFORD_DEMO.md) - Estratégia de demonstração
- [CHANGELOG.md](../CHANGELOG.md) - Histórico de mudanças

---

> 💡 **Dica**: Este documento deve ser a primeira referência ao iniciar qualquer tarefa de desenvolvimento.
