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

    // Google AI key for embeddings (alinhado ao vectorize-study).
    // Modelo canônico = gemini-embedding-001 @ 768d, taskType RETRIEVAL_QUERY.
    // Lovable AI Gateway não expõe taskType, então usamos Google direto.
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    const QUERY_EMBEDDING_DIMENSION = 768;
    const QUERY_EMBEDDING_MODEL = 'gemini-embedding-001';

    // Modelo do chat configurável via tabela ai_configurations (ai_model_chat).
    // Default: google/gemini-3-flash-preview.
    let chatModel = 'google/gemini-3-flash-preview';
    try {
      const { data: cfgRow } = await supabase
        .from('ai_configurations')
        .select('config_value')
        .eq('config_key', 'ai_model_chat')
        .maybeSingle();
      if (cfgRow?.config_value) {
        const raw = typeof cfgRow.config_value === 'string'
          ? cfgRow.config_value.replace(/"/g, '')
          : String(cfgRow.config_value);
        // Garante prefixo de provider (Lovable AI Gateway aceita ids como `google/...`).
        chatModel = raw.includes('/') ? raw : `google/${raw}`;
      }
    } catch (cfgErr) {
      console.warn('⚠️ Não foi possível ler ai_model_chat, usando default:', cfgErr);
    }
    console.log(`🤖 Modelo do chat: ${chatModel}`);

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

      if (!GOOGLE_AI_API_KEY) {
        console.warn('⚠️ GOOGLE_AI_API_KEY ausente — busca vetorial desativada para esta requisição.');
      } else {
        // 1. Gerar embedding da pergunta com Google AI direto (taskType=RETRIEVAL_QUERY, 768d).
        // ALINHADO ao vectorize-study (gemini-embedding-001 / RETRIEVAL_DOCUMENT / 768d).
        console.log('🔢 Gerando embedding da pergunta (Google AI, RETRIEVAL_QUERY)...');
        const questionEmbeddingResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${QUERY_EMBEDDING_MODEL}:embedContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': GOOGLE_AI_API_KEY,
            },
            body: JSON.stringify({
              content: { parts: [{ text: question }] },
              taskType: 'RETRIEVAL_QUERY',
              outputDimensionality: QUERY_EMBEDDING_DIMENSION,
            }),
          }
        );

        if (questionEmbeddingResponse.ok) {
          const questionEmbeddingData = await questionEmbeddingResponse.json();
          let questionEmbedding: number[] = questionEmbeddingData.embedding?.values ?? [];

          // Safety guard de dimensão (mesma lógica do vectorize-study).
          if (questionEmbedding.length !== QUERY_EMBEDDING_DIMENSION) {
            if (questionEmbedding.length > QUERY_EMBEDDING_DIMENSION) {
              questionEmbedding = questionEmbedding.slice(0, QUERY_EMBEDDING_DIMENSION);
            } else {
              questionEmbedding = [
                ...questionEmbedding,
                ...new Array(QUERY_EMBEDDING_DIMENSION - questionEmbedding.length).fill(0),
              ];
            }
          }
        
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

          // Governança (Etapa 2): detectar mismatch de modelo de embedding entre o
          // encoder atual e o encoder usado para gerar os chunks. Se um chunk foi
          // vetorizado por outro modelo, a comparação cosseno fica degradada.
          const EXPECTED_VERSION = 'gemini-embedding-001@768d';
          const mismatched = chunks.filter(
            (c: any) => c.embedding_model_version && c.embedding_model_version !== EXPECTED_VERSION,
          );
          if (mismatched.length > 0) {
            const versions = Array.from(
              new Set(mismatched.map((c: any) => c.embedding_model_version)),
            );
            console.warn(
              `⚠️ EMBEDDING_MODEL_MISMATCH: ${mismatched.length}/${chunks.length} chunks usam modelo diferente do encoder atual (${EXPECTED_VERSION}). Versões encontradas: ${versions.join(', ')}. Re-vetorização recomendada.`,
            );
          }
          
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
          const errBody = await questionEmbeddingResponse.text();
          console.warn('⚠️ Erro ao gerar embedding da pergunta:', questionEmbeddingResponse.status, errBody);
        }
      }
    } catch (ragError) {
      console.warn('⚠️ Erro no processo RAG (continuando com fallback):', ragError);
    }

    // ============================================
    // NOVO: GraphRAG com Neo4j
    // ============================================
    let graphContext = '';
    
    try {
      console.log('🔍 Iniciando GraphRAG com Neo4j...');
      
      // 1. Extrair entidades da pergunta usando Gemini
      console.log('🔢 Extraindo entidades da pergunta...');
      const entityExtractionPrompt = `Extract medical entities from this question. Return ONLY a valid JSON object, no markdown, no code blocks.

Question: "${question}"

Return format:
{
  "nutraceuticals": ["entity1", "entity2"],
  "conditions": ["entity1", "entity2"]
}`;

      const entityResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-preview',
          messages: [{ role: 'user', content: entityExtractionPrompt }],
          temperature: 0.1,
        }),
      });

      if (entityResponse.ok) {
        const entityData = await entityResponse.json();
        let entityText = entityData.choices[0]?.message?.content || '{}';
        
        // Remove markdown code blocks se presentes
        entityText = entityText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        console.log('📊 Entidades extraídas (raw):', entityText);
        
        try {
          const entities = JSON.parse(entityText);
          console.log('✅ Entidades parseadas:', entities);
          
          // 2. Buscar contexto do grafo no Neo4j
          if (entities.nutraceuticals?.length > 0 || entities.conditions?.length > 0) {
            const searchEntity = entities.nutraceuticals?.[0] || entities.conditions?.[0];
            
            console.log('🔍 Consultando Neo4j para:', searchEntity);
            const { data: graphData, error: graphError } = await supabase.functions.invoke('graph-rag-search', {
              body: {
                queryType: 'context',
                sourceEntity: searchEntity,
                maxDepth: 2
              }
            });

            if (!graphError && graphData?.success && graphData?.data) {
              const graphResult = graphData.data;
              console.log(`✅ Neo4j retornou ${graphResult.nodes?.length || 0} nós e ${graphResult.relationships?.length || 0} relações`);
              
              if (graphResult.context) {
                graphContext = `\n\n**CONTEXTO DO KNOWLEDGE GRAPH (Neo4j)**:\n\n${graphResult.context}`;
                console.log(`📊 GraphRAG context: ${graphContext.length} caracteres`);
              }
            } else {
              console.warn('⚠️ Erro ao buscar contexto do Neo4j:', graphError);
            }
          }
        } catch (parseError) {
          console.warn('⚠️ Erro ao parsear entidades JSON:', parseError);
        }
      }
    } catch (graphRagError) {
      console.warn('⚠️ Erro no processo GraphRAG (continuando com fallback):', graphRagError);
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

    // Add nutraceuticals (priorizar extractionData sobre analysisData)
    const nutraceuticals = extractionData?.nutraceuticals || analysisData?.extractedNutraceuticals || analysisData?.nutraceuticals || [];
    if (nutraceuticals.length > 0) {
      contextParts.push(`\n**Nutracêuticos Identificados** (${nutraceuticals.length}):`);
      nutraceuticals.slice(0, 10).forEach((n: any, i: number) => {
        const name = n.name || n.compound_name || n;
        const dosage = n.dosage || n.dose || n.dosage_info || '';
        const duration = n.duration || n.study_duration || '';
        const efficacy = n.efficacy_score || n.score || '';
        
        let entry = `${i + 1}. **${name}**`;
        if (dosage) entry += ` - Dosagem: ${dosage}`;
        if (duration) entry += ` (${duration})`;
        if (efficacy) entry += ` [Eficácia: ${efficacy}/5]`;
        
        contextParts.push(entry);
      });
    }

    // ============================================
    // NOVO: Extrair DOSAGENS ESTRUTURADAS
    // Prioridade: study_extractions > analysisData
    // ============================================
    const dosages = extractionData?.dosages || 
                    extractionData?.structured_dosages ||
                    analysisData?.dosages || 
                    analysisData?.structured_dosages || 
                    [];
    
    // Também extrair dosagens de clinical_outcomes se existir
    const clinicalOutcomes = extractionData?.clinical_outcomes || analysisData?.clinicalOutcomes || [];
    
    // Coletar todas as dosagens encontradas
    const allDosages: Array<{compound: string, dose: string, duration?: string, notes?: string}> = [];
    
    // Dosagens estruturadas diretas
    if (Array.isArray(dosages) && dosages.length > 0) {
      dosages.forEach((d: any) => {
        if (d.compound || d.nutraceutical || d.name) {
          allDosages.push({
            compound: d.compound || d.nutraceutical || d.name,
            dose: d.dose || d.dosage || d.amount || '',
            duration: d.duration || d.period || '',
            notes: d.notes || d.species || ''
          });
        }
      });
    }
    
    // Dosagens dos nutracêuticos
    nutraceuticals.forEach((n: any) => {
      if (n.dosage || n.dose || n.dosage_info) {
        const name = n.name || n.compound_name || 'Unknown';
        const existingDosage = allDosages.find(d => 
          d.compound.toLowerCase() === name.toLowerCase()
        );
        
        if (!existingDosage) {
          allDosages.push({
            compound: name,
            dose: n.dosage || n.dose || n.dosage_info,
            duration: n.duration || n.study_duration || '',
            notes: n.species || ''
          });
        }
      }
    });
    
    // Dosagens dos outcomes clínicos
    if (Array.isArray(clinicalOutcomes)) {
      clinicalOutcomes.forEach((outcome: any) => {
        if (outcome.intervention_dose || outcome.dosage) {
          allDosages.push({
            compound: outcome.intervention || outcome.nutraceutical || 'Intervenção',
            dose: outcome.intervention_dose || outcome.dosage,
            duration: outcome.study_duration || '',
            notes: outcome.outcome || ''
          });
        }
      });
    }
    
    // Adicionar seção de dosagens ao contexto SE houver dosagens
    if (allDosages.length > 0) {
      contextParts.push(`\n**📋 DOSAGENS ESTUDADAS** (${allDosages.length}):`);
      allDosages.forEach((d, i) => {
        let entry = `${i + 1}. **${d.compound}**: ${d.dose}`;
        if (d.duration) entry += ` por ${d.duration}`;
        if (d.notes) entry += ` - ${d.notes}`;
        contextParts.push(entry);
      });
      console.log(`📊 Dosagens encontradas: ${allDosages.length}`);
    } else {
      console.log('⚠️ Nenhuma dosagem estruturada encontrada');
    }

    // Add conditions
    const conditions = extractionData?.conditions || extractionData?.extractedConditions || analysisData?.extractedConditions || analysisData?.conditions || [];
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

    // Add mechanisms (priorizar extractionData)
    const mechanisms = extractionData?.mechanisms || extractionData?.molecularMechanisms || analysisData?.molecularMechanisms || analysisData?.mechanisms || [];
    if (mechanisms.length > 0) {
      contextParts.push(`\n**Mecanismos de Ação**:`);
      mechanisms.slice(0, 5).forEach((m: any) => {
        const name = m.nutraceutical || m.compound || m.name || m;
        const mechanism = m.mechanism || m.action || m.description || 'Não especificado';
        contextParts.push(`- **${name}**: ${mechanism}`);
      });
    }

    // Priorizar contexto vetorial RAG, depois GraphRAG, depois fallback para texto estruturado
    if (vectorContext) {
      contextParts.push(vectorContext);
    }
    
    if (graphContext) {
      contextParts.push(graphContext);
    }
    
    if (!vectorContext && !graphContext && documentContext && documentContext !== 'No document text available') {
      contextParts.push(`\n**TEXTO ORIGINAL DO DOCUMENTO (para citações literais)**:\n---\n${documentContext}\n---`);
    }

    const fullContext = contextParts.join('\n');
    
    console.log(`📊 Contexto construído: ${fullContext.length} caracteres`);
    console.log(`📊 RAG chunks: ${relevantChunks.length}`);
    console.log(`📊 GraphRAG ativo: ${graphContext ? 'Sim' : 'Não'}`);
    console.log(`📊 Nutracêuticos no contexto: ${nutraceuticals.length}`);
    console.log(`📊 Dosagens estruturadas: ${allDosages.length}`);
    console.log(`📊 Condições no contexto: ${conditions.length}`);
    console.log(`📊 Achados no contexto: ${findings.length}`);
    console.log(`📊 Mecanismos no contexto: ${mechanisms.length}`);

    // Build messages for AI
    const messages = [
      {
        role: 'system',
        content: `Você é um assistente especializado em estudos científicos veterinários sobre nutracêuticos.

**Suas responsabilidades:**
1. Responder perguntas baseadas EXCLUSIVAMENTE no estudo fornecido e no conhecimento científico do Knowledge Graph
2. Citar partes específicas do estudo quando relevante usando o formato [Citação: texto - Seção X]
3. Se houver informações do Knowledge Graph (Neo4j), integre-as naturalmente, mencionando que vem de "dados conectados de outros estudos"
4. Ser preciso e técnico, mas acessível
5. Indicar claramente quando algo NÃO está presente no estudo nem no Knowledge Graph

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
    console.log(`📊 Messages count: ${messages.length}`);
    console.log(`📊 System prompt length: ${messages[0]?.content?.length || 0}`);
    console.log(`📊 User prompt length: ${messages[1]?.content?.length || 0}`);

    // Call Lovable AI - usar modelo estável
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chatModel,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log(`📊 AI Response status: ${aiResponse.status}`);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log(`📊 AI Data structure: ${JSON.stringify(Object.keys(aiData))}`);
    console.log(`📊 Choices count: ${aiData.choices?.length || 0}`);
    
    let answer = aiData.choices?.[0]?.message?.content || '';
    
    // Verificar se resposta está vazia e gerar fallback
    if (!answer || answer.trim().length < 10) {
      console.warn('⚠️ Resposta vazia ou muito curta, gerando fallback...');
      console.log(`📊 Raw answer: "${answer}"`);
      
      // Gerar resposta de fallback baseada no contexto
      answer = `### 🔬 Análise do Estudo

**${study.title}**

Baseado nos dados extraídos deste estudo:

#### 📊 Informações Disponíveis
${nutraceuticals.length > 0 ? `- **Nutracêuticos identificados**: ${nutraceuticals.slice(0, 5).map((n: any) => n.name || n).join(', ')}` : '- Nutracêuticos: dados não extraídos'}
${conditions.length > 0 ? `- **Condições de saúde**: ${conditions.slice(0, 5).map((c: any) => c.name || c).join(', ')}` : '- Condições: dados não extraídos'}
${findings.length > 0 ? `- **Principais achados**: ${findings.slice(0, 3).map((f: any) => f.finding || f).join('; ')}` : '- Achados: dados não extraídos'}

#### ⚠️ Nota
A análise completa do documento ainda está sendo processada. Por favor, tente novamente em alguns instantes ou reformule sua pergunta.

---

**💡 Perguntas sugeridas:**
- Quais nutracêuticos são mencionados neste estudo?
- Quais condições de saúde são abordadas?
- Há informações sobre dosagens?`;
    }

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
          dosages_count: allDosages.length,
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
          dosagesCount: allDosages.length,
          conditionsCount: conditions.length,
          extractionQuality: study.study_extractions?.[0]?.extraction_quality_score,
        }
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        } 
      }
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
