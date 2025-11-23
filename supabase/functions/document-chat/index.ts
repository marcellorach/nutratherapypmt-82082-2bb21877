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
    console.log(`📚 Conversation history length: ${conversationHistory.length}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Lovable AI key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch study data and extraction
    console.log('📚 Buscando dados do estudo...');
    const { data: study, error: studyError } = await supabase
      .from('processed_studies')
      .select('*, study_extractions(*)')
      .eq('id', studyId)
      .single();

    if (studyError || !study) {
      console.error('❌ Erro ao buscar estudo:', studyError);
      return new Response(
        JSON.stringify({ error: 'Study not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // NOVO: RAG com Busca Vetorial Semântica
    // ============================================
    let vectorContext = '';
    let relevantChunks: any[] = [];
    
    try {
      console.log('🔍 Iniciando busca vetorial semântica...');
      
      // 1. Gerar embedding da pergunta do usuário
      console.log('🔢 Gerando embedding da pergunta...');
      const questionEmbeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/text-embedding-004',
          input: question
        }),
      });

      if (questionEmbeddingResponse.ok) {
        const questionEmbeddingData = await questionEmbeddingResponse.json();
        const questionEmbedding = questionEmbeddingData.data[0].embedding;
        
        // 2. Buscar chunks mais relevantes usando similaridade cosseno
        console.log('🔍 Buscando chunks relevantes via pgvector...');
        const { data: chunks, error: searchError } = await supabase.rpc(
          'search_study_chunks',
          {
            query_embedding: JSON.stringify(questionEmbedding),
            match_study_id: studyId,
            match_threshold: 0.65, // Threshold mais baixo para capturar mais contexto
            match_count: 5
          }
        );

        if (!searchError && chunks && chunks.length > 0) {
          relevantChunks = chunks;
          console.log(`✅ Encontrados ${chunks.length} chunks relevantes via RAG`);
          
          // Construir contexto com chunks relevantes
          vectorContext = '\n\n**CONTEXTO VETORIAL (RAG) - Trechos Mais Relevantes do Estudo Completo**:\n\n';
          vectorContext += chunks
            .map((chunk: any, i: number) => {
              const similarity = (chunk.similarity * 100).toFixed(1);
              return `[Chunk ${i + 1} | Similaridade: ${similarity}% | Índice: ${chunk.chunk_index}]\n${chunk.chunk_text}`;
            })
            .join('\n\n---\n\n');
          
          console.log(`📊 Contexto vetorial: ${vectorContext.length} caracteres`);
        } else {
          console.warn('⚠️ Nenhum chunk relevante encontrado ou erro na busca:', searchError);
        }
      } else {
        console.warn('⚠️ Erro ao gerar embedding da pergunta:', questionEmbeddingResponse.status);
      }
    } catch (ragError) {
      console.warn('⚠️ Erro no processo RAG (continuando com fallback):', ragError);
    }

    // ============================================
    // Fallback: Contexto Estruturado (Tags)
    // ============================================

    if (studyError || !study) {
      console.error('❌ Erro ao buscar estudo:', studyError);
      return new Response(
        JSON.stringify({ error: 'Study not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract document text for literal citations
    let documentText = '';
    const extractionData = study.study_extractions?.[0]?.extracted_data;
    
    if (extractionData) {
      // Try to get full text from various fields
      if (extractionData.full_text) {
        documentText = extractionData.full_text;
      } else if (extractionData.abstract) {
        documentText = extractionData.abstract;
      } else if (extractionData.sections) {
        // Concatenate all sections
        documentText = Object.entries(extractionData.sections)
          .map(([section, content]) => `### ${section}\n${content}`)
          .join('\n\n');
      } else if (extractionData.findings) {
        documentText = Array.isArray(extractionData.findings) 
          ? extractionData.findings.join('\n\n')
          : JSON.stringify(extractionData.findings);
      }
    }
    
    // If no text from extraction, use analysis_data with improved structure support
    if (!documentText && study.analysis_data) {
      const analysisData = study.analysis_data as any;
      
      console.log('📊 analysis_data structure:', Object.keys(analysisData));
      
      // PRIORIDADE 1: Estrutura do parse-study (Unstructured API)
      if (analysisData.elements || analysisData.sections || analysisData.tables) {
        if (Array.isArray(analysisData.elements)) {
          console.log(`📄 Extracting from ${analysisData.elements.length} elements`);
          documentText = analysisData.elements
            .map((el: any) => el.text || '')
            .filter((t: string) => t.trim())
            .join('\n\n')
            .substring(0, 4000);
        }
        else if (Array.isArray(analysisData.sections)) {
          console.log(`📚 Extracting from ${analysisData.sections.length} sections`);
          documentText = analysisData.sections
            .map((section: any) => {
              const title = section.title || '';
              const content = Array.isArray(section.content)
                ? section.content.map((c: any) => c.text || '').join('\n')
                : (section.text || '');
              return `### ${title}\n${content}`;
            })
            .join('\n\n')
            .substring(0, 4000);
        }
      }
      // PRIORIDADE 2: Estrutura do gemini-file-search
      else if (analysisData.full_text) {
        console.log('📄 Extracting from full_text');
        documentText = analysisData.full_text.substring(0, 4000);
      }
      else if (analysisData.abstract) {
        console.log('📄 Extracting from abstract');
        documentText = analysisData.abstract;
      }
      else if (analysisData.findings) {
        console.log('📄 Extracting from findings');
        documentText = analysisData.findings.substring(0, 4000);
      }
      // Fallback: stringify JSON
      else {
        console.log('📄 Fallback: stringifying analysis_data');
        documentText = JSON.stringify(analysisData, null, 2);
      }
      
      console.log(`✅ Extracted ${documentText.length} chars for chat context`);
    }
    
    // Limit document text to prevent token overflow (keep first 4000 chars for context)
    const documentContext = documentText.substring(0, 4000) || 'No document text available';

    console.log('✅ Dados do estudo carregados');
    console.log(`📊 Title: ${study.title}`);
    console.log(`📊 Document text length: ${documentText.length}`);
    console.log(`📊 Context length: ${documentContext.length}`);

    // Build context for AI
    const analysisData = study.analysis_data as any;

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

    // Priorizar contexto vetorial RAG, depois fallback para texto estruturado
    if (vectorContext) {
      contextParts.push(vectorContext);
    } else if (documentContext && documentContext !== 'No document text available') {
      contextParts.push(`\n**TEXTO ORIGINAL DO DOCUMENTO (para citações literais)**:\n---\n${documentContext}\n---`);
    }

    const fullContext = contextParts.join('\n');
    
    console.log(`📊 Contexto construído: ${fullContext.length} caracteres`);
    console.log(`📊 RAG chunks: ${relevantChunks.length}`);
    console.log(`📊 Nutracêuticos no contexto: ${nutraceuticals.length}`);
    console.log(`📊 Condições no contexto: ${conditions.length}`);
    console.log(`📊 Achados no contexto: ${findings.length}`);
    console.log(`📊 Mecanismos no contexto: ${mechanisms.length}`);

    // Build messages for AI
    const messages = [
      {
        role: 'system',
        content: `Você é um assistente especializado em estudos científicos veterinários sobre nutracêuticos.

**Suas responsabilidades:**
1. Responder perguntas baseadas EXCLUSIVAMENTE no estudo fornecido
2. Citar partes específicas do estudo quando relevante usando o formato [Citação: texto - Seção X]
3. Ser preciso e técnico, mas acessível
4. Indicar claramente quando algo NÃO está presente no estudo

**Formato OBRIGATÓRIO das respostas em Markdown:**

### 🔬 [Título da Resposta]

[Parágrafo introdutório breve e claro]

#### 📊 Principais Achados
1. **[Nome do achado]**: [Descrição detalhada] [Citação: texto relevante - Seção X]
2. **[Outro achado]**: [Descrição] [Citação: texto - Seção Y]

#### ⚙️ Mecanismos de Ação
- **[Nutracêutico]**: [Mecanismo explicado] [Citação: detalhes - Seção Z]
- **[Outro]**: [Mecanismo]

#### ⚠️ Considerações Importantes
[Se houver contraindicações, efeitos colaterais, limitações do estudo, etc]

---

**💡 Perguntas sugeridas relacionadas:**
- [Pergunta específica 1]
- [Pergunta específica 2]
- [Pergunta específica 3]

**REGRA CRÍTICA PARA CITAÇÕES:**
- SEMPRE use trechos LITERAIS do "TEXTO ORIGINAL DO DOCUMENTO" fornecido acima
- Formato obrigatório: [Citação: "texto exato copiado do documento" - Seção/Contexto]
- NUNCA invente ou parafrase citações - copie palavra por palavra do texto original
- Se não houver trecho relevante no texto fornecido, NÃO inclua citação
- Cada citação DEVE ser uma frase ou parágrafo que apareça no texto original acima

**Diretrizes de formatação obrigatórias:**
- Use emojis para destacar seções principais (🔬 📊 ⚙️ ⚠️ 💡 📈)
- Use **negrito** para termos-chave e nomes de nutracêuticos
- Use listas numeradas (1. 2. 3.) para achados sequenciais ou hierárquicos
- Use listas com bullet (- ) para mecanismos, características e perguntas
- Separe seções principais com --- (linha horizontal)
- Para scores de eficácia, use formato: **Eficácia**: 4/5 (será renderizado como barra de progresso)
- Destaque nutracêuticos específicos em \`backticks\` para badges visuais

**Limites estritos:**
- NÃO invente informações que não estão no estudo
- Se não souber, diga claramente: "⚠️ Esta informação não está presente neste estudo"
- Todas as citações devem ser texto real extraído do documento original fornecido`
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
    console.log(`📝 Tamanho da resposta: ${answer.length} caracteres`);
    console.log(`📝 Primeiros 200 chars: ${answer.slice(0, 200)}...`);

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
          extractionQuality: study.study_extractions?.[0]?.extraction_quality_score,
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
