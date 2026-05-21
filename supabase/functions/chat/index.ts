import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAITask } from "../_shared/ai-task-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, stream: shouldStream = true } = body;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI Gateway with', messages.length, 'messages, stream:', shouldStream);

    // Quando o caller pede streaming preservamos o caminho legado (router não streamea),
    // pois o front consome via EventSource. Para non-stream usamos o router → governança ativa.
    if (!shouldStream) {
      try {
        // Separa eventuais system messages para passar ao router.
        const systemMsgs = messages.filter((m: any) => m.role === 'system').map((m: any) => m.content).join('\n\n');
        const turnMsgs = messages.filter((m: any) => m.role !== 'system');
        const result = await callAITask('clinical_chat_factual', {
          caller: 'chat',
          messages: turnMsgs,
          override_system_prompt: systemMsgs || undefined,
          fallback: { model_id: 'google/gemini-2.5-flash' },
        });
        return new Response(JSON.stringify({ response: result.output }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (routerErr) {
        console.error('Router path failed, falling back to direct gateway:', routerErr);
        // cai no fluxo direto abaixo
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        stream: shouldStream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI gateway error: ' + errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (shouldStream) {
      console.log('Streaming response from AI gateway');
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    } else {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log('Non-streaming response, length:', content.length);
      return new Response(JSON.stringify({ response: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
