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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'googleGeminiKey')
      .single();

    if (configError || !configData?.config_value) {
      throw new Error('Google API key não configurada');
    }

    const GOOGLE_AI_API_KEY = configData.config_value as string;

    console.log('📥 Download...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('study_pdfs')
      .download(fileUrl.split('/study_pdfs/')[1]);

    if (downloadError || !fileData) {
      throw new Error(`Download erro: ${downloadError?.message}`);
    }

    console.log('⬆️ Upload Gemini...');
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
      throw new Error('Upload Gemini falhou');
    }

    const uploadResult = await uploadResponse.json();
    const fileUri = uploadResult.file.uri;

    console.log('⏳ Aguardando...');
    await waitForFileProcessing(fileUri, GOOGLE_AI_API_KEY);

    console.log('🤖 Extraindo...');
    const extractedData = await extractStructuredData(fileUri, GOOGLE_AI_API_KEY);

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

    if (saveError) throw new Error('Erro salvar');

    console.log('✅ OK');

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
    console.error('❌', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }),
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

  if (!response.ok) throw new Error('Gemini API erro');

  const result = await response.json();
  return JSON.parse(result.candidates[0].content.parts[0].text);
}
