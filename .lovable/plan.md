

## Plano: Corrigir Scroll e Performance do Chat Inline

### Problemas Identificados

**1. Scroll não funciona** — `ScrollArea` do Radix não aceita `ref` para controlar scroll. O `ref={scrollRef}` está no componente root, não no viewport interno. O `scrollTop = scrollHeight` nunca funciona.

**2. Chat lento / erro no follow-up** — Os logs mostram que a segunda pergunta ("e em relacao a sirtuina 1?") causou shutdown da edge function. O `document-chat` faz **3 chamadas LLM sequenciais** (embedding → entity extraction → resposta final) + consulta Neo4j. Para um mini-chat inline em card de triplet, isso é excessivo e causa timeout.

### Correções

**A. Fix do Scroll — `TripletInlineChat.tsx`**

Substituir o `ref` no `ScrollArea` por uma div-âncora no final das mensagens e usar `scrollIntoView`:

```tsx
const bottomRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading]);

// No JSX:
<ScrollArea className="h-52">
  <div className="p-3 space-y-3">
    {messages.map(...)}
    {isLoading && ...}
    <div ref={bottomRef} />
  </div>
</ScrollArea>
```

- Trocar `max-h-48` por `h-52` (altura fixa para o scroll funcionar)
- Remover `ref={scrollRef}` do ScrollArea

**B. Usar `chat` edge function em vez de `document-chat`**

O `document-chat` é projetado para perguntas complexas com RAG + GraphRAG. Para o inline chat do triplet, onde o contexto já é conhecido (subject, predicate, object, study title), basta chamar a edge function `chat` diretamente passando o contexto como system message:

```tsx
const systemMessage = {
  role: 'system',
  content: `You are analyzing a scientific relationship extracted from the study "${studyTitle}".
Triplet: ${subject} → ${predicate} → ${object}.
Answer questions about this relationship concisely.`
};

const { data, error } = await supabase.functions.invoke('chat', {
  body: { messages: [systemMessage, ...conversationMessages] }
});
```

Isso elimina as 3 chamadas extras (embedding, entity extraction, Neo4j) e responde em ~2-3 segundos em vez de 30+.

Porém, a `chat` function usa streaming (retorna SSE). Para simplicidade, vou processar o stream no componente ou adicionar um modo não-streaming.

**Decisão**: Adicionar parâmetro `stream: false` na `chat` edge function para que retorne JSON direto quando não precisar de streaming.

### Mudanças nos Arquivos

| Arquivo | Mudança |
|---------|---------|
| `TripletInlineChat.tsx` | Fix scroll (bottomRef + scrollIntoView), trocar `document-chat` por `chat` com contexto do triplet, aceitar props `subject/predicate/object`, processar resposta SSE ou JSON |
| `supabase/functions/chat/index.ts` | Adicionar suporte a `stream: false` → retorna JSON `{ response: "..." }` em vez de SSE |
| `StudyTripletCuration.tsx` | Passar `subject`, `predicate`, `object` como props ao TripletInlineChat |

### Detalhes Técnicos

**chat/index.ts — modo não-streaming:**
```typescript
const shouldStream = body.stream !== false; // default true

if (shouldStream) {
  // ... streaming existente
} else {
  const aiResponse = await fetch(..., { body: JSON.stringify({ ...payload, stream: false }) });
  const data = await aiResponse.json();
  return new Response(JSON.stringify({ 
    response: data.choices[0]?.message?.content 
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

