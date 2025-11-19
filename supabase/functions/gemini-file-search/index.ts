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

    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'google_gemini_api_key')
      .single();

    console.log('🔑 Google Gemini API Key encontrada?', !!configData?.config_value);

    if (configError || !configData?.config_value) {
      console.error('❌ Erro ao buscar chave:', configError?.message);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Google Gemini API key não encontrada na configuração',
          errorCode: 'GEMINI_API_KEY_MISSING',
          hint: 'Configure a chave em Configurações de IA'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const GOOGLE_AI_API_KEY = configData.config_value as string;

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

    console.log('⬆️ Upload para Gemini File API...');
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'X-Goog-Upload-Protocol': 'multipart' },
        body: createMultipartBody(uint8Array, fileName || 'study.pdf', 'application/pdf'),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Erro no upload para Gemini:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao fazer upload para Gemini: ${uploadResponse.statusText}`,
          errorCode: 'GEMINI_UPLOAD_ERROR',
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ Upload para Gemini concluído');

    const uploadResult = await uploadResponse.json();
    const fileUri = uploadResult.file.uri;

    console.log('⏳ Aguardando processamento do Gemini...');
    await waitForFileProcessing(fileUri, GOOGLE_AI_API_KEY);
    console.log('✅ Arquivo processado pelo Gemini');

    console.log('🤖 Extraindo dados estruturados...');
    const extractedData = await extractStructuredData(fileUri, GOOGLE_AI_API_KEY);
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

function createMultipartBody(fileData: Uint8Array, fileName: string, mimeType: string): Blob {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const chunks: Uint8Array[] = [];
  const textEncoder = new TextEncoder();
  
  chunks.push(textEncoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n`));
  chunks.push(textEncoder.encode(JSON.stringify({ file: { displayName: fileName } })));
  chunks.push(textEncoder.encode(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
  chunks.push(fileData);
  chunks.push(textEncoder.encode(`\r\n--${boundary}--\r\n`));

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return new Blob([combined], { type: `multipart/related; boundary=${boundary}` });
}

async function waitForFileProcessing(fileUri: string, apiKey: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const fileName = fileUri.split('/').pop();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
    
    if (!response.ok) throw new Error('Status check falhou');
    
    const fileStatus = await response.json();
    
    if (fileStatus.state === 'ACTIVE') return;
    if (fileStatus.state === 'FAILED') throw new Error('Processamento falhou');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Timeout');
}

async function extractStructuredData(fileUri: string, apiKey: string): Promise<ExtractedStudyData> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Extraia: título, autores, ano, journal, abstract, DOI, nutracêuticos (nome, dosagem, efeitos), condições de saúde (nome, tipo de relação, eficácia).' },
            { fileData: { mimeType: 'application/pdf', fileUri } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              authors: { type: 'array', items: { type: 'string' } },
              year: { type: 'integer' },
              journal: { type: 'string' },
              abstract: { type: 'string' },
              doi: { type: 'string' },
              nutraceuticals: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dosage: { type: 'string' }, effects: { type: 'string' } } } },
              conditions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, relationship_type: { type: 'string' }, efficacy_description: { type: 'string' } } } }
            }
          }
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro na API Gemini:', errorText);
    throw new Error(`Gemini API erro: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.candidates || !result.candidates[0]?.content?.parts?.[0]?.text) {
    console.error('❌ Resposta inválida do Gemini:', result);
    throw new Error('Resposta inválida do Gemini - estrutura não reconhecida');
  }
  
  return JSON.parse(result.candidates[0].content.parts[0].text);
}
