import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { fetchSystemPrompt } from '../_shared/system-prompts.ts';
import { logPromptUsage } from '../_shared/prompt-usage.ts';

interface Body {
  question: string;
  context?: string;
}

const SYSTEM_FALLBACK =
  'You are a veterinary scientific research assistant. Scope strictly to canine (dog) clinical evidence: ' +
  'metabolic, degenerative, geriatric and nutraceutical topics. Be concise (<= 4 sentences), cite sources via [n], ' +
  'and explicitly state confidence level (high/medium/low) at the end as "confidence: <level>". ' +
  'If outside canine scope, reply exactly: OUT_OF_SCOPE.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: 'PERPLEXITY_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.question || typeof body.question !== 'string' || body.question.length < 5) {
      return new Response(JSON.stringify({ error: 'question is required (min 5 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = await fetchSystemPrompt('query_perplexity_chat', SYSTEM_FALLBACK);

    const userPrompt = body.context
      ? `Context: ${body.context}\n\nQuestion: ${body.question}`
      : body.question;

    const t0 = Date.now();
    const resp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error('Perplexity error', resp.status, t);
      await logPromptUsage({
        prompt_key: 'query_perplexity_chat',
        function_name: 'query-perplexity',
        model: 'sonar',
        latency_ms: Date.now() - t0,
        success: false,
        error: `HTTP ${resp.status}`,
      });
      return new Response(JSON.stringify({ error: `Perplexity ${resp.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    const citations: string[] = data?.citations ?? [];

    // parse confidence from tail
    const confMatch = content.toLowerCase().match(/confidence:\s*(high|medium|low)/);
    const conf = confMatch?.[1];
    const confidence = conf === 'high' ? 0.85 : conf === 'medium' ? 0.6 : conf === 'low' ? 0.35 : 0.5;
    const outOfScope = content.trim().toUpperCase().startsWith('OUT_OF_SCOPE');

    await logPromptUsage({
      prompt_key: 'query_perplexity_chat',
      function_name: 'query-perplexity',
      model: 'sonar',
      latency_ms: Date.now() - t0,
      tokens_in: data?.usage?.prompt_tokens,
      tokens_out: data?.usage?.completion_tokens,
      success: true,
    });

    return new Response(
      JSON.stringify({
        answer: outOfScope ? null : content,
        citations,
        confidence,
        outOfScope,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('query-perplexity error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});