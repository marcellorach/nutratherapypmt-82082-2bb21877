import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `Você é o **Auditor Conversacional sobre Relações e Conexões** de um sistema de nutracêuticos veterinários. Seu papel é analisar criticamente as relações entre nutracêuticos, condições de saúde, predisposições de raças e evidências científicas armazenadas no banco de dados.

## Seu papel:
- Questionar premissas fracas (ex: scores altos sem estudos suficientes)
- Identificar inconsistências nos dados (relações sem evidência, scores contraditórios)
- Explicar por que certas relações têm determinados scores
- Sugerir onde faltam dados ou estudos
- Comparar relações entre diferentes nutracêuticos para a mesma condição

## Regras de resposta:
1. **SEMPRE** inclua pelo menos um diagrama Mermaid quando a resposta envolver conexões entre entidades
2. Use \`\`\`mermaid para blocos de diagrama
3. Use \`graph LR\` para cadeias causais e relações
4. Use \`graph TD\` para hierarquias
5. Nos diagramas, use IDs simples sem caracteres especiais (ex: A[Nome do Nó])
6. Responda em português
7. Seja crítico e analítico — este é um auditor, não um assistente passivo
8. Cite dados específicos do contexto fornecido (scores, contagens, tipos)
9. Quando não houver dados suficientes para responder, diga explicitamente

## Formato dos diagramas:
- Nós de nutracêuticos: retângulos arredondados com (Nome)
- Nós de condições: hexágonos com {{Nome}}
- Nós de estudos: cilindros com [(Nome)]
- Arestas com labels de eficácia: -->|efficacy: X|
- Use cores via classDef quando relevante`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-enriched system prompt
    let fullSystemPrompt = SYSTEM_PROMPT;
    
    if (context) {
      fullSystemPrompt += `\n\n## DADOS REAIS DO BANCO DE DADOS (use como base para suas análises):\n\n`;
      
      if (context.relations) {
        fullSystemPrompt += `### Relações Nutracêutico-Condição:\n${context.relations}\n\n`;
      }
      if (context.predispositions) {
        fullSystemPrompt += `### Predisposições de Raças:\n${context.predispositions}\n\n`;
      }
      if (context.tripletsSummary) {
        fullSystemPrompt += `### Resumo de Triplets Extraídos:\n${context.tripletsSummary}\n\n`;
      }
      if (context.studiesSummary) {
        fullSystemPrompt += `### Resumo de Estudos:\n${context.studiesSummary}\n\n`;
      }
    }

    console.log('Relations Auditor: calling with', messages.length, 'messages, context keys:', context ? Object.keys(context) : 'none');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Erro no gateway de IA: ' + errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('Relations Auditor response length:', content.length);

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Relations Auditor error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
