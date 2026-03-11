

## Plano: Auditor Conversacional sobre Relações e Conexões

### Conceito

Um chat integrado na tab Relações que permite interrogar o banco de dados em linguagem natural. O diferencial: o LLM gera **diagramas Mermaid inline** nas respostas, mostrando visualmente as conexões que está discutindo. Ex: "por que a quercetina tem pouco efeito em inflamação?" gera tanto a explicação textual quanto um grafo `graph LR` mostrando Quercetina -->|efficacy: 2| Inflamação com os caminhos comparativos.

### Viabilidade dos diagramas

Sim, é viável. A abordagem:
1. O LLM (usaremos `google/gemini-2.5-pro` para máxima qualidade de raciocínio + diagramas) recebe instrução no system prompt para incluir blocos ` ```mermaid ` quando visualizar conexões ajudar
2. O frontend detecta blocos mermaid no markdown e renderiza com a lib `mermaid` (npm) como SVG inline
3. O componente `MermaidBlock` é reutilizável — serve para qualquer chat futuro (KG chat, compound chat, triplet chat)

### Arquitetura

```text
RelationsTab.tsx
  └─ Nova aba "🔍 Auditor" no TabsList (ao lado de Sankey, Rede, Matriz)
      └─ RelationsAuditorChat.tsx (novo)
            ├─ Na montagem: query profunda ao banco
            │   ├─ nutraceutical_conditions + joins (nutraceuticals, health_conditions)
            │   ├─ breed_predispositions + joins (breeds, health_conditions)  
            │   ├─ nutraceutical_studies (counts por nutracêutico)
            │   └─ triplet_extractions (resumo de relações extraídas)
            ├─ Monta system prompt com dados reais + instrução para gerar Mermaid
            ├─ Chama edge function "relations-auditor" (stream: false, model: gemini-2.5-pro)
            └─ Renderiza com ReactMarkdown + MermaidBlock custom

MermaidBlock.tsx (novo, reutilizável)
  └─ Recebe código mermaid string
  └─ Usa mermaid.render() para gerar SVG
  └─ Renderiza inline no chat
```

### Mudanças

| Arquivo | Ação |
|---------|------|
| `src/components/shared/MermaidBlock.tsx` | **Novo** — componente reutilizável que renderiza Mermaid como SVG inline |
| `src/components/administrador/relations/RelationsAuditorChat.tsx` | **Novo** — chat completo com carregamento de contexto profundo, histórico multi-turn, rendering de markdown + mermaid |
| `src/components/administrador/RelationsTab.tsx` | Adicionar aba "Auditor" no TabsList interno do card "Mapa de Relações" |
| `supabase/functions/relations-auditor/index.ts` | **Novo** — edge function dedicada com system prompt especializado e model `gemini-2.5-pro` |
| `supabase/config.toml` | Registrar nova function |
| Pacote `mermaid` | **Instalar** — renderização de diagramas |
| Traduções pt/en | Chaves para o auditor |

### Detalhes do System Prompt

O prompt instrui o LLM a:
- Atuar como auditor científico veterinário
- Analisar os dados reais fornecidos no contexto (scores de eficácia, tipos de relação, contagens de estudos, predisposições de raças, triplets extraídos)
- Questionar premissas fracas (ex: score alto sem estudos suficientes)
- **Sempre incluir um diagrama Mermaid** quando a resposta envolver conexões entre entidades
- Usar `graph LR` para cadeias causais, `graph TD` para hierarquias, `pie` para distribuições

### Detalhes do MermaidBlock

```text
MermaidBlock
  ├─ Props: { code: string }
  ├─ useLayoutEffect → mermaid.render(uniqueId, code)
  ├─ Fallback: mostra código raw se parsing falhar
  └─ Tema: adapta a light/dark mode
```

Integrado ao ReactMarkdown via `components` override que detecta blocos de código com linguagem "mermaid".

### Edge Function dedicada

Separar do `chat` genérico porque:
- Usa `gemini-2.5-pro` (mais caro, mais capaz) em vez do `gemini-2.5-flash`
- Tem system prompt longo e especializado
- Recebe o contexto dos dados do banco como parte do body (não apenas mensagens)

### Profundidade do contexto

O chat carrega na montagem:
1. **nutraceutical_conditions** com joins → lista completa: "Glucosamina → Artrite: efficacy 4.2, treatment, 12 studies"
2. **breed_predispositions** com joins → "Golden Retriever: predisposed to Artrite (risk high), Displasia (risk medium)"
3. **Resumo de triplets** → counts por tipo de relação (activates, inhibits, modulates)
4. **Resumo de estudos** → total processados, com/sem triplets extraídos

Tudo formatado como texto estruturado no system prompt (~2-4K tokens de contexto).

