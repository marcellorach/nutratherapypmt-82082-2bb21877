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
    
    console.log('🚀 Iniciando processamento completo do PDF');
    console.log('📄 File URL:', fileUrl);
    console.log('🆔 Study ID:', studyId);
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar chave do Google Gemini
    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'googleGeminiKey')
      .single();

    if (configError || !configData?.config_value) {
      throw new Error('GOOGLE_AI_API_KEY não configurada');
    }

    const GOOGLE_AI_API_KEY = configData.config_value as string;

    // 1. Download do arquivo do Supabase Storage
    console.log('📥 Baixando arquivo do storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('study_pdfs')
      .download(fileUrl.split('/study_pdfs/')[1]);

    if (downloadError || !fileData) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError?.message}`);
    }

    // 2. Upload para Gemini File API
    console.log('⬆️ Fazendo upload para Gemini File API...');
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'multipart',
        },
        body: createMultipartBody(uint8Array, fileName || 'study.pdf', 'application/pdf'),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Erro no upload Gemini: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const fileUri = uploadResult.file.uri;
    console.log('✅ Upload concluído:', fileUri);

    // 3. Aguardar processamento do arquivo
    console.log('⏳ Aguardando processamento...');
    await waitForFileProcessing(fileUri, GOOGLE_AI_API_KEY);

    // 4. Extrair dados estruturados com Gemini
    console.log('🤖 Extraindo dados com IA...');
    const extractedData = await extractStructuredData(fileUri, GOOGLE_AI_API_KEY);

    // 5. Salvar na tabela processed_studies
    console.log('💾 Salvando dados no banco...');
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
        },
        kanban_status: 'extracted',
      })
      .eq('study_id', studyId)
      .select()
      .single();

    if (saveError) {
      throw new Error(`Erro ao salvar estudo: ${saveError.message}`);
    }

    console.log('✅ Processamento completo!');

    return new Response(
      JSON.stringify({ 
        success: true,
        studyId,
        extractedData,
        message: 'Estudo processado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function createMultipartBody(fileData: Uint8Array, fileName: string, mimeType: string): Blob {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const chunks: Uint8Array[] = [];
  
  const textEncoder = new TextEncoder();
  chunks.push(textEncoder.encode(`--${boundary}\r\n`));
  chunks.push(textEncoder.encode(`Content-Disposition: form-data; name="metadata"\r\n`));
  chunks.push(textEncoder.encode(`Content-Type: application/json\r\n\r\n`));
  chunks.push(textEncoder.encode(JSON.stringify({ file: { displayName: fileName } })));
  chunks.push(textEncoder.encode(`\r\n--${boundary}\r\n`));
  chunks.push(textEncoder.encode(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`));
  chunks.push(textEncoder.encode(`Content-Type: ${mimeType}\r\n\r\n`));
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
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const fileName = fileUri.split('/').pop();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Erro ao verificar status do arquivo');
    }
    
    const fileStatus = await response.json();
    
    if (fileStatus.state === 'ACTIVE') {
      console.log('✅ Arquivo processado e ativo');
      return;
    }
    
    if (fileStatus.state === 'FAILED') {
      throw new Error('Processamento do arquivo falhou no Gemini');
    }
    
    console.log(`⏳ Status: ${fileStatus.state}, aguardando...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Timeout: arquivo não ficou ativo');
}

async function extractStructuredData(fileUri: string, apiKey: string): Promise<ExtractedStudyData> {
  const prompt = `Analise este estudo científico em PDF e extraia as seguintes informações de forma estruturada:

1. Título do estudo
2. Lista de autores
3. Ano de publicação
4. Nome do journal/revista
5. Abstract/resumo
6. DOI (se disponível)
7. Lista de nutraceuticals/suplementos mencionados com seus efeitos e dosagens
8. Lista de condições de saúde estudadas e o tipo de relação (treatment, prevention, support)

Seja preciso e extraia apenas informações explicitamente mencionadas no documento.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
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
              year: { type: 'integer', nullable: true },
              journal: { type: 'string', nullable: true },
              abstract: { type: 'string', nullable: true },
              doi: { type: 'string', nullable: true },
              nutraceuticals: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    dosage: { type: 'string', nullable: true },
                    effects: { type: 'string' }
                  },
                  required: ['name', 'effects']
                }
              },
              conditions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    relationship_type: { 
                      type: 'string',
                      enum: ['treatment', 'prevention', 'support']
                    },
                    efficacy_description: { type: 'string' }
                  },
                  required: ['name', 'relationship_type', 'efficacy_description']
                }
              }
            },
            required: ['title', 'authors']
          }
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na extração: ${errorText}`);
  }

  const result = await response.json();
  const extractedText = result.candidates[0].content.parts[0].text;
  const extractedData = JSON.parse(extractedText);

  console.log('📊 Dados extraídos:', JSON.stringify(extractedData, null, 2));
  
  return extractedData;
}
