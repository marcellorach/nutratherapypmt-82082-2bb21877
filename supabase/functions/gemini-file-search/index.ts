import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedStudyData {
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  abstract?: string;
  doi?: string;
  nutraceuticals: Array<{
    name: string;
    dosage?: string;
    effects: string;
  }>;
  conditions: Array<{
    name: string;
    relationship_type: string;
    efficacy_description?: string;
  }>;
}

interface GeminiFile {
  name: string;
  displayName?: string;
  uri: string;
  mimeType: string;
  state: string;
}

async function uploadToGeminiFileAPI(
  pdfBlob: Blob, 
  fileName: string, 
  apiKey: string
): Promise<GeminiFile> {
  console.log('📤 Iniciando upload para Gemini File API...');
  console.log('📊 Tamanho do arquivo:', pdfBlob.size, 'bytes');
  
  // Converter blob para bytes
  const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
  
  // Método 1: Tentar com resumable upload (método oficial)
  console.log('📤 Iniciando resumable upload...');
  
  // Passo 1: Iniciar o upload e obter upload URL
  const startUploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const metadata = {
    file: {
      display_name: fileName
    }
  };
  
  const initResponse = await fetch(startUploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(pdfBytes.length),
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  
  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error('❌ Falha ao iniciar upload:', initResponse.status, errorText);
    throw new Error(`Falha ao iniciar upload: ${initResponse.status} - ${errorText}`);
  }
  
  // Obter o upload URL do header
  const uploadUrl = initResponse.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) {
    throw new Error('Upload URL não retornada pelo servidor');
  }
  
  console.log('✅ Upload URL obtida, enviando arquivo...');
  
  // Passo 2: Fazer upload do arquivo
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(pdfBytes.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: pdfBytes,
  });
  
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('❌ Upload falhou:', uploadResponse.status, errorText);
    throw new Error(`Upload falhou: ${uploadResponse.status} - ${errorText}`);
  }
  
  const result = await uploadResponse.json();
  console.log('✅ Upload completo:', result.file.name);
  console.log('📊 URI:', result.file.uri);
  console.log('📊 Estado inicial:', result.file.state);
  
  return result.file;
}

async function waitForFileActive(
  fileName: string, 
  apiKey: string, 
  maxAttempts = 30
): Promise<void> {
  console.log('⏳ Aguardando processamento do arquivo...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check falhou: ${response.status} - ${errorText}`);
    }
    
    const fileInfo = await response.json();
    console.log(`📊 Tentativa ${attempt}/${maxAttempts} - Estado: ${fileInfo.state}`);
    
    if (fileInfo.state === 'ACTIVE') {
      console.log('✅ Arquivo pronto para análise');
      return;
    }
    
    if (fileInfo.state === 'FAILED') {
      console.error('❌ Processamento falhou:', fileInfo);
      throw new Error('Processamento do arquivo falhou no Gemini');
    }
    
    // Aguardar 2 segundos antes da próxima tentativa
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`Timeout: arquivo não ficou ACTIVE após ${maxAttempts * 2} segundos`);
}

// Obter ou criar File Search Store (corpus vetorizado)
async function getOrCreateFileSearchStore(apiKey: string): Promise<string> {
  console.log('🗄️ Verificando File Search Store...');
  
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/corpora?key=${apiKey}`;
  const listResponse = await fetch(listUrl);
  
  if (!listResponse.ok) {
    console.log('⚠️ Erro ao listar stores, criando novo...');
  } else {
    const stores = await listResponse.json();
    const existingStore = stores.corpora?.find(
      (s: any) => s.displayName === 'petnutra_studies'
    );
    
    if (existingStore) {
      console.log('✅ Store encontrado:', existingStore.name);
      return existingStore.name;
    }
  }
  
  console.log('📦 Criando novo File Search Store...');
  const createUrl = `https://generativelanguage.googleapis.com/v1beta/corpora?key=${apiKey}`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'petnutra_studies',
      description: 'Corpus vetorizado de estudos científicos sobre nutracêuticos'
    })
  });
  
  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Erro ao criar store: ${errorText}`);
  }
  
  const newStore = await createResponse.json();
  console.log('✅ Store criado:', newStore.name);
  return newStore.name;
}

// Adicionar arquivo ao corpus vetorizado
async function addFileToCorpus(
  corpusName: string,
  uploadedFile: GeminiFile,
  apiKey: string
): Promise<void> {
  console.log('📚 Adicionando arquivo ao corpus vetorizado...');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/${corpusName}/documents?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: uploadedFile.displayName || 'Study Document',
      file: uploadedFile.name
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao adicionar ao corpus: ${errorText}`);
  }
  
  const document = await response.json();
  console.log('✅ Arquivo adicionado ao corpus:', document.name);
  
  // Aguardar indexação/vetorização
  console.log('⏳ Aguardando vetorização (5s)...');
  await new Promise(resolve => setTimeout(resolve, 5000));
}

// Extração com File Search (queries semânticas focadas)
async function extractWithFileSearch(
  corpusName: string,
  apiKey: string
): Promise<ExtractedStudyData> {
  console.log('🔍 Extraindo dados com File Search...');
  
  const extractedData: ExtractedStudyData = {
    title: '',
    authors: [],
    year: undefined,
    journal: '',
    abstract: '',
    doi: '',
    nutraceuticals: [],
    conditions: []
  };

  // Query 1: Metadados básicos
  console.log('🔍 Query 1/3: Metadados básicos...');
  const metadataPrompt = `Analise este estudo científico e extraia os metadados:
- Título completo do estudo
- Lista de autores (separados por vírgula)
- Ano de publicação
- Nome do journal/periódico
- Abstract/resumo
- DOI (se disponível)

Retorne no formato JSON estruturado.`;

  try {
    const metadataResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: metadataPrompt }] 
          }],
          tools: [{
            retrieval: {
              vertexAiSearch: {
                datastore: corpusName
              }
            }
          }],
          generationConfig: {
            temperature: 0.1
          }
        })
      }
    );

    if (metadataResponse.ok) {
      const metadataResult = await metadataResponse.json();
      const metadataText = metadataResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('📄 Metadata extraída:', metadataText.substring(0, 200));
      
      // Parse do texto retornado
      const lines = metadataText.split('\n');
      for (const line of lines) {
        const lower = line.toLowerCase();
        if ((lower.includes('título') || lower.includes('title')) && line.includes(':')) {
          extractedData.title = line.split(':').slice(1).join(':').trim();
        } else if ((lower.includes('autor') || lower.includes('author')) && line.includes(':')) {
          const authorsText = line.split(':').slice(1).join(':').trim();
          extractedData.authors = authorsText.split(',').map((a: string) => a.trim()).filter((a: string) => a);
        } else if ((lower.includes('ano') || lower.includes('year')) && line.includes(':')) {
          const yearMatch = line.match(/\d{4}/);
          if (yearMatch) extractedData.year = parseInt(yearMatch[0]);
        } else if ((lower.includes('journal') || lower.includes('periódico')) && line.includes(':')) {
          extractedData.journal = line.split(':').slice(1).join(':').trim();
        } else if (lower.includes('doi') && line.includes(':')) {
          extractedData.doi = line.split(':').slice(1).join(':').trim();
        }
      }
    }
  } catch (e) {
    console.error('❌ Erro em Query 1:', e);
  }

  // Query 2: Nutracêuticos (busca semântica focada)
  console.log('🔍 Query 2/3: Nutracêuticos...');
  const nutraceuticalsPrompt = `Liste TODOS os nutracêuticos, suplementos, compostos ativos ou ingredientes mencionados neste estudo científico.

Para cada um, extraia:
- Nome científico ou comum do composto
- Dosagem/quantidade utilizada (com unidades, ex: "500mg/dia", "2g diários")
- Efeitos/resultados observados no estudo

Busque em TODO o documento: introdução, materiais e métodos, resultados, discussão, tabelas e figuras.

Retorne uma lista DETALHADA em formato de bullet points. Se não encontrar nutracêuticos, indique claramente.`;

  try {
    const nutraceuticalsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: nutraceuticalsPrompt }] 
          }],
          tools: [{
            retrieval: {
              vertexAiSearch: {
                datastore: corpusName
              }
            }
          }],
          generationConfig: {
            temperature: 0.1
          }
        })
      }
    );

    if (nutraceuticalsResponse.ok) {
      const nutraceuticalsResult = await nutraceuticalsResponse.json();
      const nutraceuticalsText = nutraceuticalsResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('💊 Nutracêuticos extraídos:', nutraceuticalsText.substring(0, 300));
      
      // Parse de bullet points
      const bulletPoints = nutraceuticalsText.split('\n').filter((l: string) => 
        l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim())
      );
      
      if (bulletPoints.length > 0) {
        extractedData.nutraceuticals = bulletPoints.map((bp: string) => {
          const cleaned = bp.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
          const parts = cleaned.split(/[:\-]/);
          return {
            name: parts[0]?.trim() || cleaned,
            dosage: parts[1]?.includes('mg') || parts[1]?.includes('g') || parts[1]?.includes('ml') 
              ? parts[1].trim() 
              : '',
            effects: parts.length > 2 ? parts.slice(2).join(':').trim() : parts[1]?.trim() || ''
          };
        });
      }
    }
  } catch (e) {
    console.error('❌ Erro em Query 2:', e);
  }

  // Query 3: Condições de saúde
  console.log('🔍 Query 3/3: Condições de saúde...');
  const conditionsPrompt = `Liste TODAS as condições de saúde, doenças ou problemas médicos abordados neste estudo científico.

Para cada condição:
- Nome da condição ou doença
- Tipo de relação com os compostos estudados: "treatment" (tratamento), "prevention" (prevenção) ou "support" (suporte)
- Descrição breve da eficácia observada

Busque em TODO o documento.

Retorne uma lista DETALHADA em formato de bullet points. Se não encontrar condições, indique claramente.`;

  try {
    const conditionsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: conditionsPrompt }] 
          }],
          tools: [{
            retrieval: {
              vertexAiSearch: {
                datastore: corpusName
              }
            }
          }],
          generationConfig: {
            temperature: 0.1
          }
        })
      }
    );

    if (conditionsResponse.ok) {
      const conditionsResult = await conditionsResponse.json();
      const conditionsText = conditionsResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('🏥 Condições extraídas:', conditionsText.substring(0, 300));
      
      // Parse de bullet points
      const bulletPoints = conditionsText.split('\n').filter((l: string) => 
        l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim())
      );
      
      if (bulletPoints.length > 0) {
        extractedData.conditions = bulletPoints.map((bp: string) => {
          const cleaned = bp.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
          const lower = cleaned.toLowerCase();
          
          let relationshipType = 'treatment';
          if (lower.includes('prevention') || lower.includes('prevenção') || lower.includes('preventivo')) {
            relationshipType = 'prevention';
          } else if (lower.includes('support') || lower.includes('suporte') || lower.includes('manutenção')) {
            relationshipType = 'support';
          }
          
          const parts = cleaned.split(/[:\-]/);
          return {
            name: parts[0]?.trim() || cleaned,
            relationship_type: relationshipType,
            efficacy_description: parts.slice(1).join(':').trim() || ''
          };
        });
      }
    }
  } catch (e) {
    console.error('❌ Erro em Query 3:', e);
  }

  console.log(`✅ Extração File Search completa: ${extractedData.nutraceuticals.length} nutracêuticos, ${extractedData.conditions.length} condições`);
  return extractedData;
}

async function analyzeWithGemini(
  fileUri: string, 
  fileName: string, 
  apiKey: string
): Promise<ExtractedStudyData> {
  console.log('🧠 Analisando documento com Gemini...');
  console.log('📄 Arquivo:', fileName);
  console.log('🔗 URI:', fileUri);
  
  const systemPrompt = `Você é um especialista em extração de dados de estudos científicos sobre nutracêuticos e saúde.

IMPORTANTE: Analise TODO o conteúdo do PDF e extraia TODOS os dados encontrados.

TAREFA:
1. **Metadados básicos**: Extraia título completo, todos os autores listados, ano de publicação, nome do periódico/journal, abstract/resumo, DOI (se disponível)

2. **Nutracêuticos/Compostos**: Liste TODAS as substâncias, compostos, suplementos ou ingredientes ativos mencionados no estudo (ex: resveratrol, curcumina, ômega-3, vitamina D, etc.). Para cada um, extraia:
   - Nome científico ou comum
   - Dosagem/quantidade utilizada (com unidades)
   - Efeitos/resultados observados no estudo

3. **Condições de Saúde**: Liste TODAS as doenças, condições médicas ou problemas de saúde mencionados (ex: diabetes, obesidade, inflamação, doenças cardiovasculares, etc.). Para cada condição:
   - Nome da condição
   - Tipo de relação: "treatment" (tratamento ativo), "prevention" (prevenção), ou "support" (suporte/manutenção)
   - Descrição da eficácia observada

INSTRUÇÕES CRÍTICAS:
- Leia o PDF COMPLETO, não apenas o abstract
- Se o estudo menciona múltiplos compostos, liste TODOS
- Se o estudo aborda várias condições de saúde, liste TODAS
- Seja DETALHADO nos arrays de nutracêuticos e condições
- NÃO retorne arrays vazios se houver dados no PDF
- Se não encontrar um campo específico, use string vazia ("") ou null

EXEMPLO DE RESPOSTA ESPERADA:
- Se o PDF fala sobre "resveratrol para longevidade", retorne pelo menos 1 nutracêutico e 1 condição
- Se menciona "vitamina D, magnésio e zinco", retorne 3 nutracêuticos`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'application/pdf',
                fileUri: fileUri
              }
            },
            { text: systemPrompt }
          ]
        }],
        tools: [{
          functionDeclarations: [{
            name: 'extract_study_data',
            description: 'Extrai dados estruturados de um estudo científico veterinário sobre nutracêuticos',
            parameters: {
              type: 'object',
              required: ['title', 'authors', 'nutraceuticals', 'conditions'],
              properties: {
                title: { 
                  type: 'string', 
                  description: 'Título completo do estudo científico' 
                },
                authors: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Lista completa de autores do estudo'
                },
                year: { 
                  type: 'integer',
                  description: 'Ano de publicação do estudo'
                },
                journal: { 
                  type: 'string',
                  description: 'Nome do periódico científico onde foi publicado'
                },
                abstract: { 
                  type: 'string',
                  description: 'Resumo/abstract do estudo'
                },
                doi: { 
                  type: 'string',
                  description: 'DOI (Digital Object Identifier) do artigo'
                },
                nutraceuticals: {
                  type: 'array',
                  description: 'Lista de todos os nutracêuticos/compostos mencionados no estudo',
                  items: {
                    type: 'object',
                    required: ['name', 'effects'],
                    properties: {
                      name: { 
                        type: 'string',
                        description: 'Nome do nutracêutico/composto (científico ou comum)'
                      },
                      dosage: { 
                        type: 'string',
                        description: 'Dosagem utilizada no estudo (com unidades)'
                      },
                      effects: { 
                        type: 'string',
                        description: 'Efeitos observados/reportados no estudo'
                      }
                    }
                  }
                },
                conditions: {
                  type: 'array',
                  description: 'Lista de condições de saúde abordadas no estudo',
                  items: {
                    type: 'object',
                    required: ['name', 'relationship_type'],
                    properties: {
                      name: { 
                        type: 'string',
                        description: 'Nome da condição de saúde/doença'
                      },
                      relationship_type: { 
                        type: 'string',
                        enum: ['treatment', 'prevention', 'support'],
                        description: 'Tipo de relação: tratamento, prevenção ou suporte'
                      },
                      efficacy_description: { 
                        type: 'string',
                        description: 'Descrição da eficácia observada no estudo'
                      }
                    }
                  }
                }
              }
            }
          }]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: 'ANY',
            allowedFunctionNames: ['extract_study_data']
          }
        }
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API erro:', response.status, errorText);
    throw new Error(`Gemini API erro: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('📊 Resposta recebida da IA');
  
  // Extrair dados do function call
  const candidate = result.candidates?.[0];
  if (!candidate) {
    console.error('❌ Nenhum candidato na resposta:', JSON.stringify(result, null, 2));
    throw new Error('Resposta da IA não contém candidatos');
  }
  
  const functionCall = candidate?.content?.parts?.[0]?.functionCall;
  
  if (!functionCall || functionCall.name !== 'extract_study_data') {
    console.error('❌ Function call inválido:', JSON.stringify(candidate, null, 2));
    throw new Error('Resposta da IA não contém function call esperado');
  }
  
  console.log('✅ Dados extraídos com sucesso');
  console.log('📊 Nutracêuticos encontrados:', functionCall.args.nutraceuticals?.length || 0);
  console.log('📊 Condições encontradas:', functionCall.args.conditions?.length || 0);
  
  return functionCall.args as ExtractedStudyData;
}

async function deleteGeminiFile(fileName: string, apiKey: string): Promise<void> {
  try {
    console.log('🗑️ Deletando arquivo do Gemini...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`,
      { method: 'DELETE' }
    );
    
    if (response.ok) {
      console.log('✅ Arquivo deletado com sucesso');
    } else {
      console.warn('⚠️ Falha ao deletar arquivo (não crítico):', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao deletar arquivo (não crítico):', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando processamento com Google Gemini File API');
    console.log('📥 Recebendo requisição...');
    
    const { fileUrl, studyId, fileName } = await req.json();
    
    console.log('📋 Parâmetros recebidos:');
    console.log('  - studyId:', studyId);
    console.log('  - fileName:', fileName);
    console.log('  - fileUrl:', fileUrl);

    if (!fileUrl || !studyId || !fileName) {
      console.error('❌ Parâmetros obrigatórios ausentes');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parâmetros obrigatórios ausentes: fileUrl, studyId, fileName' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar Google Gemini API Key da tabela ai_configurations
    console.log('🔑 Buscando Google Gemini API Key da configuração...');
    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'google_gemini_api_key')
      .single();

    if (configError || !configData?.config_value) {
      console.error('❌ Chave não encontrada na tabela ai_configurations:', configError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Google Gemini API Key não configurada. Configure em Admin > Configurações IA > Google Gemini',
          errorCode: 'GEMINI_API_KEY_MISSING'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_GEMINI_KEY = String(configData.config_value);
    console.log('✅ Chave encontrada (primeiros 10 caracteres):', GOOGLE_GEMINI_KEY.substring(0, 10) + '...');

    // Download do PDF do Supabase Storage
    console.log('📥 Baixando PDF do Supabase Storage...');
    const storagePath = fileUrl.replace(/^.*\/object\/public\/study_pdfs\//, '');
    console.log('📂 Storage path extraído:', storagePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('study_pdfs')
      .download(storagePath);

    if (downloadError) {
      console.error('❌ Erro no download:', downloadError);
      throw new Error(`Erro no download: ${downloadError.message}`);
    }
    
    console.log('✅ PDF baixado com sucesso');
    console.log('📊 Tamanho do arquivo:', fileData.size, 'bytes', `(~${(fileData.size / 1024 / 1024).toFixed(2)} MB)`);

    // ========== FLUXO PRINCIPAL COM FILE SEARCH ==========
    
    // 1. Upload para Gemini File API
    const uploadedFile = await uploadToGeminiFileAPI(fileData, fileName, GOOGLE_GEMINI_KEY);

    // 2. Aguardar processamento
    await waitForFileActive(uploadedFile.name, GOOGLE_GEMINI_KEY);

    // 3. ✨ NOVO: Obter ou criar File Search Store (corpus vetorizado)
    const corpusName = await getOrCreateFileSearchStore(GOOGLE_GEMINI_KEY);
    
    // 4. ✨ NOVO: Adicionar arquivo ao corpus (vetorização automática)
    await addFileToCorpus(corpusName, uploadedFile, GOOGLE_GEMINI_KEY);
    
    // 5. ✨ NOVO: Extração com File Search (queries semânticas focadas)
    const extractedData = await extractWithFileSearch(corpusName, GOOGLE_GEMINI_KEY);

    // 4. Salvar no banco Supabase
    console.log('💾 Salvando dados extraídos no banco...');
    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({
        title: extractedData.title || null,
        authors: extractedData.authors || [],
        year: extractedData.year || null,
        journal: extractedData.journal || null,
        description: extractedData.abstract || null,
        analysis_data: {
          ...extractedData,
          processed_at: new Date().toISOString(),
          gemini_file_uri: uploadedFile.uri
        },
        kanban_status: 'parsed'
      })
      .eq('study_id', studyId);

    if (updateError) {
      console.error('❌ Erro ao salvar no banco:', updateError);
      throw updateError;
    }
    
    console.log('✅ Dados salvos com sucesso no banco');

    // 6. Cleanup: NÃO deletar arquivo para manter corpus vetorizado
    // Comentado para reutilização do corpus vetorizado em futuras consultas
    // console.log('🗑️ Deletando arquivo do Gemini File API...');
    // await deleteGeminiFile(uploadedFile.name, GOOGLE_GEMINI_KEY);
    console.log('✅ Arquivo mantido no corpus vetorizado para reutilização');

    // ========== SUCESSO ==========
    console.log('🎉 Processamento completo!');
    
    return new Response(
      JSON.stringify({
        success: true,
        studyId: studyId,
        nutraceuticalsCount: extractedData.nutraceuticals?.length || 0,
        conditionsCount: extractedData.conditions?.length || 0,
        data: {
          title: extractedData.title,
          authors: extractedData.authors,
          year: extractedData.year,
          journal: extractedData.journal,
          nutraceuticals: extractedData.nutraceuticals,
          conditions: extractedData.conditions
        },
        message: 'Estudo processado com sucesso usando Google Gemini File API',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Erro fatal:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
