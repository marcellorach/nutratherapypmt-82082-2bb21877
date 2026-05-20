import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VectorizeRequest {
  studyId: string;
}

const TARGET_EMBEDDING_DIMENSION = 768;
const EMBEDDING_MODEL_NAME = 'gemini-embedding-001';
const EMBEDDING_MODEL_VERSION = `${EMBEDDING_MODEL_NAME}@${TARGET_EMBEDDING_DIMENSION}d`;

// Função para dividir texto em chunks com overlap
function chunkText(text: string, maxChunkSize = 500, overlap = 50): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Dividir por sentenças
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    // Se adicionar a sentença ultrapassar o limite e já temos conteúdo
    if ((currentChunk + ' ' + trimmedSentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      
      // Criar overlap pegando últimas N palavras
      const words = currentChunk.trim().split(/\s+/);
      const overlapWords = words.slice(-Math.min(overlap, words.length));
      currentChunk = overlapWords.join(' ') + ' ';
    }
    
    currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
  }
  
  // Adicionar último chunk se não estiver vazio
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId }: VectorizeRequest = await req.json();
    
    if (!studyId) {
      return new Response(
        JSON.stringify({ error: 'studyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔢 Iniciando vetorização do estudo:', studyId);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Google AI key for embeddings
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    // 1. Buscar texto completo do estudo — com polling para evitar race condition
    // com gemini-file-search (que popula full_text_content de forma assíncrona).
    console.log('📚 Buscando texto completo (com retry)...');
    let study: any = null;
    let studyError: any = null;
    const MAX_ATTEMPTS = 12; // 12 × 5s = 60s
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await supabase
        .from('processed_studies')
        .select('id, title, full_text_content, full_text_metadata')
        .eq('id', studyId)
        .single();
      study = res.data;
      studyError = res.error;

      if (studyError || !study) {
        throw new Error('Estudo não encontrado');
      }

      if (study.full_text_content && study.full_text_content.trim().length > 0) {
        if (attempt > 1) {
          console.log(`✅ full_text_content disponível na tentativa ${attempt}`);
        }
        break;
      }

      if (attempt === MAX_ATTEMPTS) {
        // Em vez de 500, retornar 202 sinalizando que vetorização deve ser re-tentada
        // depois que gemini-file-search popular full_text_content.
        console.warn(`⚠️ full_text_content ainda vazio após ${MAX_ATTEMPTS} tentativas — adiando vetorização`);
        return new Response(
          JSON.stringify({
            success: false,
            deferred: true,
            studyId,
            reason: 'full_text_content_not_ready',
            message: 'Texto completo ainda não disponível. Reagende a vetorização após a extração de texto concluir.',
          }),
          { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`⏳ Tentativa ${attempt}/${MAX_ATTEMPTS}: full_text_content vazio, aguardando 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
    }

    console.log(`📊 Estudo: ${study.title}`);
    console.log(`📊 Tamanho do texto: ${study.full_text_content.length} caracteres`);

    // 2. Dividir texto em chunks
    console.log('✂️ Dividindo texto em chunks...');
    const chunks = chunkText(study.full_text_content, 500, 50);
    console.log(`✅ Texto dividido em ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('Nenhum chunk gerado do texto');
    }

    // 3. Gerar embeddings para cada chunk usando Google Gemini API
    console.log('🔢 Gerando embeddings com Google Gemini API...');
    const embeddingsData = [];
    let successCount = 0;
    let errorCount = 0;

    // Try multiple model endpoints in order of preference
    // text-embedding-004 was deprecated on Jan 14, 2026. Use gemini-embedding-001
    const embeddingEndpoints = [
      { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent', model: 'gemini-embedding-001' },
    ];

    // Detect working endpoint with first chunk
    let workingEndpoint = embeddingEndpoints[0];
    for (const ep of embeddingEndpoints) {
      try {
        const testResp = await fetch(ep.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GOOGLE_AI_API_KEY },
          body: JSON.stringify({
            content: { parts: [{ text: 'test' }] },
            taskType: 'RETRIEVAL_DOCUMENT',
            outputDimensionality: TARGET_EMBEDDING_DIMENSION,
          }),
        });

        if (testResp.ok) {
          workingEndpoint = ep;
          console.log(`✅ Using embedding model: ${ep.model}`);
          await testResp.text(); // consume body
          break;
        }

        await testResp.text(); // consume body
        console.warn(`⚠️ Model ${ep.model} not available, trying next...`);
      } catch {
        console.warn(`⚠️ Endpoint ${ep.model} failed`);
      }
    }

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`   Processing chunk ${i + 1}/${chunks.length}...`);

        const response = await fetch(workingEndpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GOOGLE_AI_API_KEY,
          },
          body: JSON.stringify({
            content: {
              parts: [{ text: chunks[i] }]
            },
            taskType: 'RETRIEVAL_DOCUMENT',
            outputDimensionality: TARGET_EMBEDDING_DIMENSION,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro ao gerar embedding ${i + 1}:`, response.status, errorText);
          errorCount++;
          continue;
        }

        const embeddingResult = await response.json();
        const rawEmbedding = embeddingResult.embedding?.values;

        if (!rawEmbedding || !Array.isArray(rawEmbedding)) {
          console.error(`❌ Embedding inválido retornado para chunk ${i + 1}`);
          errorCount++;
          continue;
        }

        let embedding = rawEmbedding as number[];

        // Safety guard for model dimension drift
        if (embedding.length !== TARGET_EMBEDDING_DIMENSION) {
          console.warn(
            `⚠️ Chunk ${i + 1}: dimensão ${embedding.length} recebida, ajustando para ${TARGET_EMBEDDING_DIMENSION}`
          );

          if (embedding.length > TARGET_EMBEDDING_DIMENSION) {
            embedding = embedding.slice(0, TARGET_EMBEDDING_DIMENSION);
          } else {
            embedding = [...embedding, ...new Array(TARGET_EMBEDDING_DIMENSION - embedding.length).fill(0)];
          }
        }

        // Calcular posição do chunk no texto original
        const chunkPosition = study.full_text_content.indexOf(chunks[i]);

        embeddingsData.push({
          study_id: study.id,
          chunk_index: i,
          chunk_text: chunks[i],
          embedding: JSON.stringify(embedding), // pgvector aceita string ou array
          embedding_model_version: EMBEDDING_MODEL_VERSION,
          chunk_metadata: {
            char_start: chunkPosition >= 0 ? chunkPosition : null,
            char_count: chunks[i].length,
            word_count: chunks[i].split(/\s+/).length,
            embedding_dimension: embedding.length,
            embedding_model_version: EMBEDDING_MODEL_VERSION,
          }
        });

        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao processar chunk ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Embeddings gerados: ${successCount} sucesso, ${errorCount} erros`);

    if (embeddingsData.length === 0) {
      throw new Error('Nenhum embedding foi gerado com sucesso');
    }

    // 4. Salvar embeddings no banco (batch upsert)
    console.log('💾 Salvando embeddings no banco...');
    const { error: insertError } = await supabase
      .from('study_embeddings')
      .upsert(embeddingsData, { 
        onConflict: 'study_id,chunk_index',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('❌ Erro ao salvar embeddings:', insertError);
      throw insertError;
    }

    console.log(`✅ ${embeddingsData.length} embeddings salvos com sucesso`);

    // 5. Atualizar metadata do estudo
    const { error: metadataError } = await supabase
      .from('processed_studies')
      .update({
        full_text_metadata: {
          ...(study.full_text_metadata as any || {}),
          vectorized: true,
          vectorized_at: new Date().toISOString(),
          chunks_count: embeddingsData.length,
          embedding_model: workingEndpoint.model,
          embedding_model_version: EMBEDDING_MODEL_VERSION,
          embedding_provider: 'Google AI',
          embedding_dimension: TARGET_EMBEDDING_DIMENSION
        }
      })
      .eq('id', studyId);

    if (metadataError) {
      console.warn('⚠️ Erro ao atualizar metadata (não crítico):', metadataError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        studyId: study.id,
        studyTitle: study.title,
        chunksProcessed: embeddingsData.length,
        totalChunks: chunks.length,
        successRate: ((successCount / chunks.length) * 100).toFixed(1) + '%',
        metadata: {
          text_length: study.full_text_content.length,
          chunks_generated: chunks.length,
          embeddings_saved: embeddingsData.length,
          embedding_model: workingEndpoint.model,
          embedding_provider: 'Google AI',
          embedding_dimension: TARGET_EMBEDDING_DIMENSION
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : (error && typeof error === 'object' && 'message' in error)
          ? String((error as { message?: unknown }).message)
          : 'Vectorization failed';

    console.error('❌ Error in vectorize-study:', error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.stack : JSON.stringify(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
