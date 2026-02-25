

## Plano: Descrição Impressionante do Pipeline de Digestão

Sim, sei o que "pavonear" significa — exibir-se como um pavão! Vamos transformar aquela caixa azul simples numa apresentação digna de Stanford.

### O que mudar

A caixa azul "Processing Information" atualmente mostra apenas modelo, status e uma frase genérica. Vamos substituir por uma descrição detalhada das 4 etapas do pipeline, mostrando a sofisticação tecnológica:

**Estrutura proposta:**

```text
┌─────────────────────────────────────────────────────────┐
│ 🧬 VetGraphRAG Digestion Pipeline                      │
│                                                         │
│ Model: Gemini 3 Pro Preview    Status: Idle             │
│                                                         │
│ ① PDF Parsing & OCR                                     │
│    Full-text extraction with layout-aware parsing,      │
│    table recognition and metadata harvesting            │
│                                                         │
│ ② Entity Extraction (NER)                               │
│    AI-powered Named Entity Recognition identifying      │
│    nutraceuticals, conditions, mechanisms, dosages      │
│    and species across the 5-layer VetGraphRAG ontology  │
│                                                         │
│ ③ Knowledge Triplet Generation                          │
│    Causal relationship mapping: Compound → Mechanism    │
│    → Effect → Clinical Outcome, with confidence scores  │
│    and evidence level classification                    │
│                                                         │
│ ④ Vectorization & Semantic Indexing                     │
│    768-dim embeddings (text-embedding-004) for          │
│    semantic search and similarity-based retrieval       │
└─────────────────────────────────────────────────────────┘
```

### Arquivos afetados

1. **`src/locales/pt/translation.json`** — Substituir `processing.description` por 4 chaves de etapas com títulos e descrições detalhadas
2. **`src/locales/en/translation.json`** — Mesmo em inglês
3. **`NtaiProcessingSection.tsx`** (linhas 256-269) — Redesenhar o bloco azul para mostrar as 4 etapas com ícones e descrições expandidas
4. **`src/i18n.ts`** — Incrementar versão

### Chaves i18n novas

```
studies.vetgraphrag.processing.step1Title: "PDF Parsing & OCR"
studies.vetgraphrag.processing.step1Desc: (descrição técnica)
studies.vetgraphrag.processing.step2Title: "Entity Extraction (NER)"
studies.vetgraphrag.processing.step2Desc: (descrição técnica)
studies.vetgraphrag.processing.step3Title: "Knowledge Triplet Generation"
studies.vetgraphrag.processing.step3Desc: (descrição técnica)
studies.vetgraphrag.processing.step4Title: "Vectorization & Semantic Indexing"
studies.vetgraphrag.processing.step4Desc: (descrição técnica)
```

### Design

- Manter o fundo azul claro (`bg-blue-50`)
- Cada etapa com número circundado + título em bold + descrição em texto menor
- Layout vertical com separadores sutis entre etapas
- Manter modelo e status no topo

