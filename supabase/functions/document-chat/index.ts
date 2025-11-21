import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  studyId: string;
  question: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId, question, conversationHistory = [] }: ChatRequest = await req.json();
    
    if (!studyId || !question) {
      return new Response(
        JSON.stringify({ error: 'studyId and question are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💬 Chat request for study: ${studyId}`);
    console.log(`❓ Question: ${question}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch study data
    console.log('📚 Buscando dados do estudo...');
    const { data: study, error: studyError } = await supabase
      .from('processed_studies')
      .select(`
        id,
        title,
        description,
        journal,
        year,
        authors,
        analysis_data,
        storage_path
      `)
      .eq('id', studyId)
      .maybeSingle();

    if (studyError || !study) {
      console.error('❌ Erro ao buscar estudo:', studyError);
      return new Response(
        JSON.stringify({ error: 'Study not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch extraction data
    const { data: extraction } = await supabase
      .from('study_extractions')
      .select('extracted_data, extraction_quality_score')
      .eq('study_id', studyId)
      .maybeSingle();

    console.log('✅ Dados do estudo carregados');

    // Build context for AI
    const analysisData = study.analysis_data as any;
    const extractionData = extraction?.extracted_data as any;

    let contextParts: string[] = [
      `**Título**: ${study.title}`,
      study.journal ? `**Journal**: ${study.journal}` : '',
      study.year ? `**Ano**: ${study.year}` : '',
      study.authors?.length ? `**Autores**: ${study.authors.join(', ')}` : '',
    ].filter(Boolean);

    // Add nutraceuticals
    const nutraceuticals = extractionData?.nutraceuticals || analysisData?.nutraceuticals || [];
    if (nutraceuticals.length > 0) {
      contextParts.push(`\n**Nutracêuticos Identificados** (${nutraceuticals.length}):`);
      nutraceuticals.slice(0, 10).forEach((n: any, i: number) => {
        contextParts.push(`${i + 1}. ${n.name || n}${n.dosage ? ` (${n.dosage})` : ''}${n.efficacy_score ? ` [Eficácia: ${n.efficacy_score}/5]` : ''}`);
      });
    }

    // Add conditions
    const conditions = extractionData?.conditions || analysisData?.conditions || [];
    if (conditions.length > 0) {
      contextParts.push(`\n**Condições de Saúde** (${conditions.length}):`);
      conditions.slice(0, 10).forEach((c: any, i: number) => {
        contextParts.push(`${i + 1}. ${c.name || c}${c.treatability_score ? ` [Tratabilidade: ${c.treatability_score}/5]` : ''}`);
      });
    }

    // Add findings
    const findings = extractionData?.findings || analysisData?.findings || [];
    if (findings.length > 0) {
      contextParts.push(`\n**Principais Achados** (${findings.length}):`);
      findings.slice(0, 5).forEach((f: any, i: number) => {
        contextParts.push(`${i + 1}. ${f.finding || f}${f.significance ? ` [${f.significance}]` : ''}`);
      });
    }

    // Add mechanisms
    const mechanisms = extractionData?.mechanisms || analysisData?.mechanisms || [];
    if (mechanisms.length > 0) {
      contextParts.push(`\n**Mecanismos de Ação**:`);
      mechanisms.slice(0, 5).forEach((m: any) => {
        contextParts.push(`- ${m.nutraceutical || m}: ${m.mechanism || 'Não especificado'}`);
      });
    }

    // Add full text if available
    if (analysisData?.parsedContent) {
      const textContent = typeof analysisData.parsedContent === 'string' 
        ? analysisData.parsedContent 
        : JSON.stringify(analysisData.parsedContent);
      
      if (textContent.length > 500) {
        contextParts.push(`\n**Contexto Adicional**:\n${textContent.slice(0, 3000)}...`);
      }
    }

    const fullContext = contextParts.join('\n');
    
    console.log(`📊 Contexto construído: ${fullContext.length} caracteres`);

    // Build messages for AI
    const messages = [
      {
        role: 'system',
        content: `Você é um assistente especializado em estudos científicos veterinários sobre nutracêuticos.

**Suas responsabilidades:**
1. Responder perguntas baseadas EXCLUSIVAMENTE no estudo fornecido
2. Citar partes específicas do estudo quando relevante
3. Ser preciso e técnico, mas acessível
4. Indicar claramente quando algo NÃO está presente no estudo
5. Sugerir perguntas relacionadas que possam ser úteis

**Formato das respostas:**
- Use markdown para formatação
- Cite evidências específicas com \`[Citação: ...]
- Inclua scores/valores numéricos quando disponíveis
- Termine com 1-2 perguntas sugeridas relacionadas

**Limites:**
- NÃO invente informações que não estão no estudo
- NÃO especule além do que está documentado
- Se não souber, diga "Essa informação não está presente neste estudo"`
      },
      {
        role: 'user',
        content: `**Estudo:**\n${fullContext}\n\n**Pergunta do usuário:**\n${question}`
      }
    ];

    // Add conversation history if exists
    if (conversationHistory.length > 0) {
      // Insert history before the current question
      messages.splice(2, 0, ...conversationHistory.slice(-6)); // Last 3 exchanges
    }

    console.log('🤖 Chamando Lovable AI...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    console.log('✅ Resposta gerada com sucesso');

    // Save to chat history
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const { error: saveError } = await supabase
      .from('study_chat_history')
      .insert({
        study_id: studyId,
        user_id: userId,
        question,
        answer,
        context_used: {
          nutraceuticals_count: nutraceuticals.length,
          conditions_count: conditions.length,
          findings_count: findings.length,
          context_length: fullContext.length,
        },
      });

    if (saveError) {
      console.error('⚠️ Erro ao salvar histórico:', saveError);
      // Don't fail the request if history save fails
    }

    // Generate suggested questions based on context
    const suggestedQuestions = [];
    if (nutraceuticals.length > 0) {
      suggestedQuestions.push(`Quais as dosagens recomendadas de ${nutraceuticals[0].name || nutraceuticals[0]}?`);
    }
    if (conditions.length > 0) {
      suggestedQuestions.push(`Como ${conditions[0].name || conditions[0]} é tratada segundo o estudo?`);
    }
    if (mechanisms.length > 0) {
      suggestedQuestions.push('Quais são os mecanismos de ação identificados?');
    }
    suggestedQuestions.push('Há contraindicações ou efeitos colaterais mencionados?');

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        suggestedQuestions: suggestedQuestions.slice(0, 3),
        metadata: {
          studyTitle: study.title,
          nutraceuticalsCount: nutraceuticals.length,
          conditionsCount: conditions.length,
          extractionQuality: extraction?.extraction_quality_score,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error in document-chat:', error);
    
    return new Response(
      JSON.stringify({ error: 'Chat failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
