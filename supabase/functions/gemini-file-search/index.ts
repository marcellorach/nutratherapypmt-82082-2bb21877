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
    
    // 📊 Log 1: Informações do arquivo baixado
    console.log('📊 Tamanho do arquivo:', uint8Array.length, 'bytes', `(~${(uint8Array.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log('🔢 Primeiros 20 bytes do PDF:', Array.from(uint8Array.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    // Gemini Files API requires multipart/related format (not multipart/form-data)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15);
    const textEncoder = new TextEncoder();
    
    // 🔖 Log 2: Boundary gerado
    console.log('🔖 Boundary gerado:', boundary);
    
    // Build multipart/related body manually
    const parts: Uint8Array[] = [];
    
    // Part 1: JSON metadata
    const metadata = JSON.stringify({
      file: {
        display_name: fileName || 'study.pdf'
      }
    });
    
    // 📝 Log 3: Metadata
    console.log('📝 Metadata JSON:', metadata);
    console.log('📏 Tamanho da metadata:', metadata.length, 'bytes');
    
    parts.push(textEncoder.encode(`--${boundary}\r\n`));
    parts.push(textEncoder.encode('Content-Disposition: form-data; name="metadata"\r\n'));
    parts.push(textEncoder.encode('Content-Type: application/json; charset=utf-8\r\n\r\n'));
    parts.push(textEncoder.encode(metadata));
    parts.push(textEncoder.encode('\r\n'));
    
    // Part 2: PDF file
    parts.push(textEncoder.encode(`--${boundary}\r\n`));
    parts.push(textEncoder.encode(`Content-Disposition: form-data; name="file"; filename="${fileName || 'study.pdf'}"\r\n`));
    parts.push(textEncoder.encode('Content-Type: application/pdf\r\n\r\n'));
    parts.push(uint8Array);
    parts.push(textEncoder.encode('\r\n'));
    
    // Final boundary
    parts.push(textEncoder.encode(`--${boundary}--\r\n`));
    
    // Combine all parts
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      body.set(part, offset);
      offset += part.length;
    }
    
    // 📦 Log 4: Body multipart montado
    console.log('📦 Body multipart montado:');
    console.log('  - Tamanho total:', totalLength, 'bytes');
    console.log('  - Número de partes:', parts.length);
    console.log('  - Tamanhos das partes:', parts.map(p => p.length).join(', '));
    
    // Preview do body (primeiros 500 caracteres)
    const bodyPreview = new TextDecoder('utf-8', { fatal: false }).decode(body.slice(0, 500));
    console.log('👀 Preview do body (primeiros 500 chars):');
    console.log(bodyPreview);
    
    // Final do body (últimos 100 bytes)
    const bodyEnd = new TextDecoder('utf-8', { fatal: false }).decode(body.slice(-100));
    console.log('🔚 Final do body (últimos 100 chars):');
    console.log(bodyEnd);
    
    // 🚀 Log 5: Informações da requisição
    console.log('🚀 Fazendo upload para Gemini Files API...');
    console.log('🌐 URL:', 'https://generativelanguage.googleapis.com/upload/v1beta/files');
    console.log('📤 Headers:', {
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': body.length
    });
    
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      }
    );

    // 📥 Log 6: Resposta do Gemini
    console.log('📥 Resposta do Gemini:');
    console.log('  - Status:', uploadResponse.status, uploadResponse.statusText);
    console.log('  - Headers:', Object.fromEntries(uploadResponse.headers.entries()));

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Erro detalhado do Gemini:', errorText);
      console.error('🔍 Detalhes da requisição que falhou:');
      console.error('  - Boundary usado:', boundary);
      console.error('  - Tamanho do body:', body.length);
      console.error('  - Content-Type enviado:', `multipart/related; boundary=${boundary}`);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao fazer upload para Gemini: ${uploadResponse.statusText}`,
          errorCode: 'GEMINI_UPLOAD_ERROR',
          details: errorText,
          debugInfo: {
            boundary,
            bodySize: body.length,
            partsCount: parts.length,
            contentType: `multipart/related; boundary=${boundary}`
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ Upload para Gemini concluído');

    const uploadResult = await uploadResponse.json();
    console.log('📦 Resposta completa do upload:', JSON.stringify(uploadResult, null, 2));
    
    // CRÍTICO: Gemini retorna file.name (ex: "files/abc123"), não file.uri
    if (!uploadResult.file || !uploadResult.file.name) {
      console.error('❌ Resposta inválida do Gemini - estrutura inesperada:', uploadResult);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Resposta inválida do Gemini: campo file.name não encontrado',
          errorCode: 'GEMINI_INVALID_RESPONSE',
          debugInfo: uploadResult
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const geminiFileName = uploadResult.file.name; // Ex: "files/abc123"
    console.log(`✅ Arquivo carregado no Gemini: ${geminiFileName}`);

    console.log('⏳ Aguardando processamento do Gemini...');
    await waitForFileProcessing(geminiFileName, GOOGLE_AI_API_KEY);
    console.log('✅ Arquivo processado pelo Gemini');

    console.log('🤖 Extraindo dados estruturados...');
    const extractedData = await extractStructuredData(geminiFileName, GOOGLE_AI_API_KEY);
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

async function waitForFileProcessing(fileUri: string, apiKey: string): Promise<void> {
  const maxAttempts = 30;
  const delayMs = 2000;
  
  console.log(`⏳ Verificando status do arquivo Gemini: ${fileUri}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileUri}?key=${apiKey}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro no status check (tentativa ${attempt}/${maxAttempts}):`, errorText);
      throw new Error(`Status check falhou: ${response.statusText}`);
    }
    
    const fileStatus = await response.json();
    console.log(`📊 Status do arquivo (tentativa ${attempt}/${maxAttempts}):`, fileStatus.state);
    
    if (fileStatus.state === 'ACTIVE') {
      console.log('✅ Arquivo ATIVO e pronto para processamento');
      return;
    }
    
    if (fileStatus.state === 'FAILED') {
      console.error('❌ Processamento do arquivo falhou no Gemini');
      throw new Error('Gemini file processing failed');
    }
    
    // Aguardar antes da próxima tentativa
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  console.error('❌ Timeout aguardando processamento do arquivo');
  throw new Error('Timeout waiting for Gemini file processing');
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
