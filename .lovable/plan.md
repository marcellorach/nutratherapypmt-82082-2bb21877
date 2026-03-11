

## Plano: Registrar Prompt do Auditor + Corrigir Diagramas Mermaid

### Problemas

**a) Prompt no AI Prompts**: O prompt do auditor está hardcoded na edge function mas não aparece no painel "AI Prompts" para gestão. Precisa ser registrado lá com nome, categoria e modelo usado (gemini-3.1-pro-preview).

**b) Erros nos diagramas Mermaid**: O LLM gera sintaxe Mermaid incompatível com mermaid.js v11.13:
- Usa `:::class` inline (ex: `A(Astaxantina):::nutra`) que falha com `classDef` customizado
- Labels com caracteres especiais (`{{Saúde Ocular}}`, `-.->|FALTA CONEXÃO|`)
- Acentos e espaços em edge labels causam parse errors

Duas correções necessárias:
1. **System prompt**: Simplificar as instruções de Mermaid para gerar sintaxe mais compatível — sem `classDef`, sem `:::`, IDs alfanuméricos simples, labels entre aspas
2. **MermaidBlock**: Adicionar sanitização do código antes de renderizar (remover `:::class`, limpar caracteres problemáticos) como fallback

### Mudanças

| Arquivo | Ação |
|---------|------|
| `supabase/functions/relations-auditor/index.ts` | Reescrever seção "Formato dos diagramas" do system prompt para gerar Mermaid simples e compatível — sem classDef, sem :::, labels entre aspas, IDs alfanuméricos |
| `src/components/shared/MermaidBlock.tsx` | Adicionar função `sanitizeMermaidCode()` que limpa sintaxe problemática antes do render (remove `:::className`, substitui chars especiais em labels) |
| `src/components/administrador/PromptConfigurationTab.tsx` | Registrar automaticamente o prompt do auditor (nome: "Auditor de Relações e Conexões", modelo: gemini-3.1-pro-preview, categoria: "auditor") no carregamento se não existir |

### Detalhes da sanitização Mermaid

```text
sanitizeMermaidCode(code):
  1. Remove ":::className" patterns
  2. Replace problematic chars in node labels (ã→a, ç→c etc for IDs only)  
  3. Ensure edge labels don't contain special chars that break parser
  4. Strip empty lines between classDef and nodes
```

### Detalhes do prompt simplificado

Em vez de instruir classDef com cores, o prompt dirá:
- Use apenas `graph LR` ou `graph TD`
- Nós: `A["Nome do Nó"]` com aspas duplas
- Sem classDef, sem :::
- Labels de arestas: `-->|"texto simples"|`
- IDs: apenas letras e números (A, B, C1, etc)

