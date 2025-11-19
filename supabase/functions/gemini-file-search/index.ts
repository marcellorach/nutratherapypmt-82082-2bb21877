import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedStudyData {
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  doi: string | null;
  nutraceuticals: Array<{
    name: string;
    dosage: string | null;
    effects: string;
  }>;
  conditions: Array<{
    name: string;
    relationship_type: string;
    efficacy_description: string;
  }>;
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, studyId, fileName } = await req.json();
    
    console.log('🚀 Gemini File API - Study:', studyId);
    console.log('📦 Request payload:', { fileUrl, studyId, fileName });
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'fileUrl não foi fornecido',
          errorCode: 'MISSING_FILE_URL'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!studyId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'studyId não foi fornecido',
          errorCode: 'MISSING_STUDY_ID'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    console.log('🔑 Lovable AI API Key disponível?', !!LOVABLE_API_KEY);

    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY não encontrada');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Lovable AI não está configurado',
          errorCode: 'LOVABLE_API_KEY_MISSING'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📥 Download do PDF do storage...');
    console.log('📍 Storage path:', fileUrl);
    
    // Extract the correct path from the fileUrl
    // fileUrl can be either a full URL or just the storage path
    let storagePath = fileUrl;
    if (fileUrl.includes('/study_pdfs/')) {
      storagePath = fileUrl.split('/study_pdfs/')[1];
    }
    
    console.log('📂 Extracted storage path:', storagePath);
    
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('study_pdfs')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('❌ Erro no download:', downloadError?.message);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao baixar PDF: ${downloadError?.message}`,
          errorCode: 'STORAGE_DOWNLOAD_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ PDF baixado com sucesso');

    console.log('🤖 Convertendo PDF para base64...');
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Converter para base64 em chunks para evitar stack overflow
    let base64Pdf = '';
    const chunkSize = 32768; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64Pdf += String.fromCharCode.apply(null, Array.from(chunk));
    }
    base64Pdf = btoa(base64Pdf);
    
    console.log('📊 Tamanho do PDF:', uint8Array.length, 'bytes', `(~${(uint8Array.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log('📊 Tamanho base64:', base64Pdf.length, 'caracteres');

    console.log('🤖 Chamando Lovable AI para extrair dados estruturados...');
    const extractedData = await extractWithLovableAI(base64Pdf, fileName || 'study.pdf', LOVABLE_API_KEY);
    console.log('✅ Extração concluída:', {
      nutraceuticals: extractedData.nutraceuticals?.length || 0,
      conditions: extractedData.conditions?.length || 0
    });

    console.log('💾 Salvando...');
    const { data: savedStudy, error: saveError } = await supabase
      .from('processed_studies')
      .update({
        title: extractedData.title,
        authors: extractedData.authors,
        year: extractedData.year,
        journal: extractedData.journal,
        description: extractedData.abstract,
        analysis_data: {
          nutraceuticals: extractedData.nutraceuticals,
          conditions: extractedData.conditions,
          doi: extractedData.doi,
          extracted_at: new Date().toISOString(),
          method: 'gemini'
        },
        kanban_status: 'parsed'
      })
      .eq('study_id', studyId)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Erro ao salvar no banco:', saveError.message);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao salvar dados extraídos: ${saveError.message}`,
          errorCode: 'DATABASE_SAVE_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Processamento completo - Estudo salvo com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        studyId,
        parsedData: savedStudy.analysis_data,
        nutraceuticalsCount: extractedData.nutraceuticals?.length || 0,
        conditionsCount: extractedData.conditions?.length || 0,
        method: 'gemini'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
        errorCode: 'PROCESSING_ERROR',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractWithLovableAI(base64Pdf: string, fileName: string, apiKey: string): Promise<ExtractedStudyData> {
  console.log('🔧 Montando payload para Lovable AI...');
  
  const systemPrompt = `Você é um especialista em análise de estudos científicos sobre nutracêuticos e saúde animal.
Extraia as seguintes informações do PDF fornecido:

1. Título do estudo
2. Lista de autores
3. Ano de publicação
4. Nome do journal/revista
5. Abstract/resumo
6. DOI (se disponível)
7. Lista de nutracêuticos mencionados (nome, dosagem recomendada, efeitos observados)
8. Lista de condições de saúde estudadas (nome da condição, tipo de relação com nutracêutico, descrição de eficácia)

Retorne APENAS dados estruturados, sem texto adicional.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analise este estudo científico e extraia as informações estruturadas conforme solicitado.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'extract_study_data',
          description: 'Extrai dados estruturados de um estudo científico',
          parameters: {
            type: 'object',
            required: ['title', 'authors', 'nutraceuticals', 'conditions'],
            properties: {
              title: { 
                type: 'string',
                description: 'Título completo do estudo'
              },
              authors: { 
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de autores do estudo'
              },
              year: { 
                type: 'integer',
                description: 'Ano de publicação'
              },
              journal: { 
                type: 'string',
                description: 'Nome da revista/journal'
              },
              abstract: { 
                type: 'string',
                description: 'Resumo ou abstract do estudo'
              },
              doi: { 
                type: 'string',
                description: 'DOI do estudo (se disponível)'
              },
              nutraceuticals: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'effects'],
                  properties: {
                    name: { type: 'string', description: 'Nome do nutracêutico' },
                    dosage: { type: 'string', description: 'Dosagem recomendada' },
                    effects: { type: 'string', description: 'Efeitos observados' }
                  }
                },
                description: 'Lista de nutracêuticos mencionados no estudo'
              },
              conditions: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'relationship_type', 'efficacy_description'],
                  properties: {
                    name: { type: 'string', description: 'Nome da condição de saúde' },
                    relationship_type: { type: 'string', description: 'Tipo de relação (tratamento, prevenção, suporte)' },
                    efficacy_description: { type: 'string', description: 'Descrição da eficácia observada' }
                  }
                },
                description: 'Lista de condições de saúde estudadas'
              }
            }
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'extract_study_data' } }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro no Lovable AI:', response.status, errorText);
    throw new Error(`Lovable AI erro: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('📦 Resposta do Lovable AI:', JSON.stringify(result, null, 2));

  if (!result.choices?.[0]?.message?.tool_calls?.[0]) {
    console.error('❌ Resposta inválida do Lovable AI:', result);
    throw new Error('Lovable AI não retornou tool calls esperados');
  }

  const toolCall = result.choices[0].message.tool_calls[0] as ToolCall;
  const extractedData = JSON.parse(toolCall.function.arguments) as ExtractedStudyData;
  
  console.log('✅ Dados extraídos com sucesso:', {
    title: extractedData.title,
    nutraceuticals: extractedData.nutraceuticals?.length || 0,
    conditions: extractedData.conditions?.length || 0
  });

  return extractedData;
}
