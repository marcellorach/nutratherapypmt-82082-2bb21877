import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VectorizeRequest {
  studyId: string;
}

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
    
    // Get Lovable AI key for embeddings
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 1. Buscar texto completo do estudo
    console.log('📚 Buscando texto completo...');
    const { data: study, error: studyError } = await supabase
      .from('processed_studies')
      .select('id, title, full_text_content, full_text_metadata')
      .eq('id', studyId)
      .single();

    if (studyError || !study) {
      throw new Error('Estudo não encontrado');
    }

    if (!study.full_text_content || study.full_text_content.trim().length === 0) {
      throw new Error('Estudo não possui texto completo para vetorização');
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

    // 3. Gerar embeddings para cada chunk usando Gemini
    console.log('🔢 Gerando embeddings com Gemini...');
    const embeddingsData = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`   Processing chunk ${i + 1}/${chunks.length}...`);
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/text-embedding-004',
            input: chunks[i]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro ao gerar embedding ${i + 1}:`, response.status, errorText);
          errorCount++;
          continue;
        }

        const embeddingResult = await response.json();
        const embedding = embeddingResult.data[0].embedding;

        if (!embedding || !Array.isArray(embedding)) {
          console.error(`❌ Embedding inválido retornado para chunk ${i + 1}`);
          errorCount++;
          continue;
        }

        // Calcular posição do chunk no texto original
        const chunkPosition = study.full_text_content.indexOf(chunks[i]);

        embeddingsData.push({
          study_id: study.id,
          chunk_index: i,
          chunk_text: chunks[i],
          embedding: JSON.stringify(embedding), // pgvector aceita string ou array
          chunk_metadata: {
            char_start: chunkPosition >= 0 ? chunkPosition : null,
            char_count: chunks[i].length,
            word_count: chunks[i].split(/\s+/).length
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
          embedding_model: 'google/text-embedding-004'
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
          embedding_model: 'google/text-embedding-004',
          embedding_dimension: 768
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in vectorize-study:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Vectorization failed',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
