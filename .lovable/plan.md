

## Plano: Infográfico Visual do Pipeline de Digestão

### Problema atual
Os 4 cards estão funcionais mas visualmente "planos" — texto puro em cards brancos dentro de um fundo azul. Falta impacto visual para uma apresentação Stanford.

### Proposta: Mini-infográficos SVG inline por etapa

Cada um dos 4 cards receberá:
1. **Ícone SVG customizado** em vez do número circular simples — representando visualmente a etapa
2. **Fluxo visual conectado** — uma linha/seta SVG horizontal entre os cards (no layout desktop), criando a sensação de pipeline
3. **Métricas visuais** — pequenos badges com números (ex: "5 layers", "768-dim", "L0→L4")
4. **Gradiente sutil** em cada card em vez de `bg-white/60`

### Design por card

```text
┌──────────────────────────────────────────────────────────────┐
│ 🧬 VetGraphRAG Digestion Pipeline                           │
│ Model: Gemini 3 Pro Preview          Status: Idle            │
│                                                              │
│  ┌─────────┐  ───→  ┌─────────┐  ───→  ┌─────────┐  ───→  ┌─────────┐
│  │ [PDF📄] │        │ [🔬NER] │        │ [🔗Trip] │        │ [📊Vec] │
│  │ Parse & │        │ Entity  │        │ Triplet  │        │ Vector  │
│  │ OCR     │        │ Extract │        │ Generate │        │ Index   │
│  │         │        │         │        │          │        │         │
│  │ Tables  │        │ 5-layer │        │ L0→L4    │        │ 768-dim │
│  │ Figures │        │ ontology│        │ causal   │        │ embed   │
│  │ Meta    │        │ mapping │        │ chains   │        │ cosine  │
│  └─────────┘        └─────────┘        └─────────┘        └─────────┘
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Implementação técnica

**Layout**: Mudar de `grid-cols-2` para `grid-cols-4` no desktop, com setas SVG entre cards. No mobile mantém `grid-cols-1`.

Cada card terá:
- **Ícone SVG inline** (FileText, Microscope, GitBranch, Database do Lucide) com tamanho maior (h-8 w-8) e cor de acento
- **Título bold** com tamanho `text-sm`
- **Descrição** com `text-xs`
- **Badge de destaque** (ex: pill com "5 layers", "768-dim", "L0→L4 chain")
- **Gradiente de fundo** sutil (from-white to-blue-50)
- **Borda esquerda colorida** (cada etapa com uma cor ligeiramente diferente dentro do espectro azul→indigo→violet→purple) para criar progressão visual

**Setas entre cards**: Componente `ChevronRight` do Lucide entre cada card, visível apenas no `md:flex`.

### Arquivos afetados

1. **`NtaiProcessingSection.tsx`** (linhas 265-281) — redesenhar o grid dos 4 steps com ícones SVG, badges, gradientes e setas
2. **`src/locales/pt/translation.json`** — adicionar chaves para os badges (ex: `studies.vetgraphrag.processing.step1Badge`)
3. **`src/locales/en/translation.json`** — idem
4. **`src/i18n.ts`** — incrementar versão

### Chaves i18n novas

```
studies.vetgraphrag.processing.step1Badge: "Tables + Figures + Meta"
studies.vetgraphrag.processing.step2Badge: "5-layer ontology (L0–L4)"
studies.vetgraphrag.processing.step3Badge: "Causal chains + confidence"
studies.vetgraphrag.processing.step4Badge: "768-dim embeddings"
```

### Resultado esperado

Um infográfico de pipeline horizontal (desktop) / vertical (mobile) com ícones grandes, setas de fluxo, badges técnicos e gradientes de cor progressivos — visualmente impressionante para a apresentação Stanford.

