import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getConfigValue } from './utils.ts';

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
  full_text?: string; // ✅ NOVO: Texto completo do PDF para RAG
  nutraceuticals: Array<{
    name: string;
    dosage?: string;
    effects: string;
    efficacy_score?: number;
  }>;
  mechanisms: Array<{
    name: string;
    type: 'pathway' | 'mediator' | 'enzyme' | 'receptor' | 'gene' | 'protein';
    description: string;
    confidence?: number;
  }>;
  biological_effects: Array<{
    name: string;
    type: 'intermediate' | 'biomarker' | 'physiological';
    description: string;
    confidence?: number;
  }>;
  conditions: Array<{
    name: string;
    relationship_type: string;
    efficacy_description?: string;
    treatability_score?: number;
    severity?: string;
  }>;
  interactions: Array<{
    from: string;
    to: string;
    type: 'inhibition' | 'stimulation' | 'modulation';
    description: string;
    confidence?: number;
  }>;
  side_effects: Array<{
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    confidence?: number;
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
      displayName: 'petnutra_studies'
    })
  });
  
  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('❌ Status:', createResponse.status);
    console.error('❌ Resposta completa:', errorText);
    throw new Error(`Erro ao criar store (${createResponse.status}): ${errorText}`);
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
  console.log('📋 Corpus:', corpusName);
  console.log('📋 Arquivo:', uploadedFile.name);
  console.log('📋 Display Name:', uploadedFile.displayName);
  
  // Usar a nova API de File Search: importFile
  console.log('📚 Importando arquivo para o File Search Store usando a nova API...');
  
  // Converter formato "corpora/xxx" para "fileSearchStores/xxx" se necessário
  const fileSearchStoreName = corpusName.replace(/^corpora\//, 'fileSearchStores/');
  console.log('📋 File Search Store:', fileSearchStoreName);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/${fileSearchStoreName}:importFile?key=${apiKey}`;
  
  const payload = {
    fileName: uploadedFile.name,
    customMetadata: [{
      key: 'source',
      stringValue: 'petnutra'
    }]
  };
  
  console.log('📤 URL completa:', url);
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  console.log('📊 Status da resposta:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Status HTTP:', response.status);
    console.error('❌ Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.error('❌ Corpo da resposta:', errorText);
    throw new Error(`Erro ao importar arquivo (${response.status}): ${errorText || 'Sem mensagem de erro'}`);
  }
  
  // A resposta é uma Operation que precisa ser monitorada
  const operation = await response.json();
  console.log('✅ Operação de importação iniciada:', operation.name);
  
  // Aguardar a operação completar (simplificado - polling a cada 2 segundos)
  console.log('⏳ Aguardando conclusão da importação...');
  let finalOperation = operation;
  let attempts = 0;
  const maxAttempts = 60; // 2 minutos máximo
  
  while (!finalOperation.done && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
    
    const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${operation.name}?key=${apiKey}`;
    const checkResponse = await fetch(checkUrl);
    
    if (checkResponse.ok) {
      finalOperation = await checkResponse.json();
      console.log(`📊 Tentativa ${attempts}/${maxAttempts} - Status: ${finalOperation.done ? 'Concluído' : 'Em andamento'}`);
    }
  }
  
  if (!finalOperation.done) {
    throw new Error('Timeout aguardando conclusão da importação');
  }
  
  if (finalOperation.error) {
    console.error('❌ Erro na importação:', finalOperation.error);
    throw new Error(`Erro na importação: ${JSON.stringify(finalOperation.error)}`);
  }
  
  console.log('✅ Arquivo importado com sucesso ao File Search Store');
}

// Extração com File Search usando Structured Output (Function Calling)
async function extractWithFileSearch(
  fileSearchStoreName: string,
  fileUri: string,  // ✅ ADICIONADO: URI do arquivo para passar ao modelo
  apiKey: string,
  supabaseClient: any
): Promise<ExtractedStudyData> {
  // ✅ USING GOOGLE AI DIRECTLY with gemini-2.5-flash (mais rápido e eficiente)
  const MODEL_NAME = 'gemini-2.5-flash';
  console.log('🔍 Extracting data with Google AI Direct + Structured Output...');
  console.log(`📋 File Search Store: ${fileSearchStoreName}`);
  console.log(`📄 File URI: ${fileUri}`);  // ✅ LOG do URI
  console.log(`🤖 AI Model: ${MODEL_NAME} (Google AI Direct)`);
  console.log(`🛠️ Technology: Tool Calling for guaranteed structured JSON`);
  
  // Load configurable prompts from ai_configurations
  console.log('📝 Loading custom prompts...');
  const systemPrompt = await getConfigValue(supabaseClient, 'prompt_extraction_stage1_system') || 
    'You are a scientific extraction AI specialized in veterinary nutraceuticals. Extract ALL entities comprehensively.';
  const userPrompt = await getConfigValue(supabaseClient, 'prompt_extraction_stage1_user') || 
    'Analyze this scientific study and extract ALL nutraceuticals, conditions, mechanisms, and relationships.';
  
  // Definir schema expandido para structured output
  const extractionFunction = {
    name: 'extract_study_data',
    description: systemPrompt,
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Complete title of the scientific study'
        },
        authors: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of study authors'
        },
        year: {
          type: 'integer',
          description: 'Year of publication'
        },
        journal: {
          type: 'string',
          description: 'Name of the journal/periodical where it was published'
        },
        abstract: {
          type: 'string',
          description: 'Abstract/summary of the study'
        },
        doi: {
          type: 'string',
          description: 'DOI of the study, if available'
        },
        full_text: {
          type: 'string',
          description: 'COMPLETE full text content of the entire PDF document. Extract ALL text from all sections: Introduction, Methods, Results, Discussion, Conclusion, References, Tables, Figures captions. This is CRITICAL for RAG (Retrieval Augmented Generation) and must contain the complete document text, not just abstract or summary.'
        },
        nutraceuticals: {
          type: 'array',
          description: 'List of ALL nutraceuticals, supplements or active compounds mentioned in the study (MUST be in English)',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Scientific or common name of the nutraceutical IN ENGLISH (e.g., Curcumin, not Curcumina; Turmeric, not Cúrcuma)'
              },
              dosage: {
                type: 'string',
                description: 'Dosage used with units (e.g., 500mg/day, 2g daily)'
              },
              effects: {
                type: 'string',
                description: 'Effects or results observed in the study IN ENGLISH'
              },
              efficacy_score: {
                type: 'integer',
                description: 'Efficacy score 1-5 based on results and statistical significance'
              }
            },
            required: ['name', 'effects']
          }
        },
        mechanisms: {
          type: 'array',
          description: 'List of ALL molecular mechanisms, pathways, enzymes, receptors involved (MUST be in English). Examples: COX-2 pathway, NF-κB activation, PPAR-γ, TNF-α signaling, mTOR pathway',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the molecular mechanism IN ENGLISH. Use standard nomenclature with direction indicators (e.g., "↓ COX-2 pathway" for inhibition, "↑ Proteoglycans" for stimulation)'
              },
              type: {
                type: 'string',
                enum: ['pathway', 'mediator', 'enzyme', 'receptor', 'gene', 'protein'],
                description: 'Type of molecular mechanism'
              },
              description: {
                type: 'string',
                description: 'How this mechanism works in the context of the study IN ENGLISH'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0-5 based on evidence strength in the study'
              }
            },
            required: ['name', 'type', 'description']
          }
        },
        biological_effects: {
          type: 'array',
          description: 'List of ALL intermediate biological effects, biomarkers, physiological changes (MUST be in English). Examples: cytokine levels (IL-6, TNF-α), oxidative stress markers, tissue changes, cellular responses',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the biological effect IN ENGLISH. Use direction indicators (e.g., "↓ IL-6 & TNF-α" for reduction, "↑ Joint lubrication" for increase)'
              },
              type: {
                type: 'string',
                enum: ['intermediate', 'biomarker', 'physiological'],
                description: 'Type of biological effect'
              },
              description: {
                type: 'string',
                description: 'Description of the effect and its significance IN ENGLISH'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0-5 based on evidence strength'
              }
            },
            required: ['name', 'type', 'description']
          }
        },
        conditions: {
          type: 'array',
          description: 'List of ALL health conditions, diseases or clinical outcomes addressed (MUST be in English)',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the condition or disease IN ENGLISH (e.g., Canine Arthritis, Osteoarthritis, Joint Inflammation)'
              },
              relationship_type: {
                type: 'string',
                enum: ['treatment', 'prevention', 'support'],
                description: 'Type of relationship: treatment, prevention or support'
              },
              efficacy_description: {
                type: 'string',
                description: 'Description of the observed efficacy IN ENGLISH'
              },
              treatability_score: {
                type: 'integer',
                description: 'Treatability score 1-5 based on study results'
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Severity level of the condition'
              }
            },
            required: ['name', 'relationship_type']
          }
        },
        interactions: {
          type: 'array',
          description: 'List of ALL hierarchical interactions forming the biological chain. Map the COMPLETE flow: Nutraceutical → Mechanism → Effect → Outcome. Each step must be explicit.',
          items: {
            type: 'object',
            properties: {
              from: {
                type: 'string',
                description: 'Name of the source entity (nutraceutical, mechanism, or effect) - MUST match exactly the name used in the corresponding array'
              },
              to: {
                type: 'string',
                description: 'Name of the target entity (mechanism, effect, or condition) - MUST match exactly the name used in the corresponding array'
              },
              type: {
                type: 'string',
                enum: ['inhibition', 'stimulation', 'modulation'],
                description: 'Type of interaction: inhibition (blocks/reduces), stimulation (activates/increases), modulation (regulates/modifies)'
              },
              description: {
                type: 'string',
                description: 'Description of how the interaction works IN ENGLISH'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0-5 based on evidence in the study'
              }
            },
            required: ['from', 'to', 'type', 'description']
          }
        },
        side_effects: {
          type: 'array',
          description: 'List of ALL adverse effects, side effects or safety concerns mentioned (MUST be in English)',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the side effect IN ENGLISH (e.g., Mild Drowsiness, Appetite Changes)'
              },
              description: {
                type: 'string',
                description: 'Description of the side effect IN ENGLISH'
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Severity level'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0-5 based on evidence'
              }
            },
            required: ['name', 'description', 'severity']
          }
        }
      },
      required: ['title', 'authors', 'nutraceuticals', 'mechanisms', 'biological_effects', 'conditions', 'interactions']
    }
  };

  const prompt = `You are an expert scientific data extraction AI specialized in veterinary nutraceutical research. Your task is to perform a COMPREHENSIVE extraction of biological mechanisms and clinical outcomes.

🔴 CRITICAL INSTRUCTIONS:
- Extract ALL data from the ATTACHED PDF document ONLY
- ALL outputs MUST be in ENGLISH (translate if needed)
- DO NOT invent data - extract ONLY what exists in the document
- Be EXHAUSTIVE - extract EVERY mechanism, pathway, biomarker mentioned

🎯 YOUR MISSION: Map the COMPLETE BIOLOGICAL CHAIN for each nutraceutical:

┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 0         →  LAYER 1           →  LAYER 2          →  LAYER 3       │
│  Nutraceutical   →  Molecular Target  →  Biological Effect→  Clinical      │
│  (Compound)         (Mechanism)          (Biomarker)         Outcome       │
└─────────────────────────────────────────────────────────────────────────────┘

📋 DETAILED EXTRACTION REQUIREMENTS:

1️⃣ NUTRACEUTICALS (Layer 0 - Starting Point):
   - Extract ALL active compounds, supplements, natural products
   - Include dosages with units (e.g., "0.3 mg/kg/day", "500mg daily")
   - Include efficacy_score (1-5) based on statistical significance:
     * 5 = p<0.01, clear effect demonstrated
     * 4 = p<0.05, significant effect
     * 3 = trend towards significance
     * 2 = weak evidence
     * 1 = no effect or adverse

2️⃣ MOLECULAR MECHANISMS (Layer 1 - Targets & Pathways):
   CRITICAL: Extract ALL of these if mentioned:
   - Signaling pathways: NF-κB, MAPK, PI3K/Akt, JAK/STAT, mTOR, Wnt, Notch
   - Inflammatory mediators: COX-2, LOX, iNOS, TNF-α pathway
   - Receptors: PPAR-γ, TLR4, Cannabinoid receptors, Nuclear receptors
   - Enzymes: Kinases, Phosphatases, Dehydrogenases, Oxidases
   - Metabolic pathways: β-oxidation, Glycolysis, Lipogenesis, Gluconeogenesis
   - Use direction indicators: "↓ NF-κB activation" or "↑ PPAR-γ activity"
   - Include confidence score (0-5) based on mechanistic evidence

3️⃣ BIOLOGICAL EFFECTS (Layer 2 - Biomarkers & Physiological Changes):
   Extract ALL measurable changes:
   - Cytokines: IL-1β, IL-6, IL-10, TNF-α, IFN-γ
   - Oxidative stress: MDA, ROS, SOD, Catalase, Glutathione
   - Metabolic markers: TG, Cholesterol, NEFA, Glucose, Insulin
   - Liver enzymes: ALT, AST, ALP, LDH
   - Hormones: Adiponectin, Leptin, Cortisol
   - Use direction: "↓ MDA (oxidative stress marker)" or "↑ Adiponectin"

4️⃣ CLINICAL OUTCOMES (Layer 3 - Final Results):
   For each condition, provide:
   - Treatability score (1-5) based on study results
   - Relationship type: treatment, prevention, or support
   - Specific efficacy description with numbers if available

5️⃣ INTERACTIONS (Biological Chain Mapping - MOST CRITICAL):
   Create EXPLICIT step-by-step chains, for example:
   
   Chain 1: Astaxanthin → [inhibits] → β-oxidation ROS
   Chain 2: ↓ β-oxidation ROS → [leads_to] → ↓ MDA (peroxidation)
   Chain 3: ↓ MDA → [leads_to] → ↓ LDH (cell damage marker)
   Chain 4: ↓ LDH → [leads_to] → Improved hepatic function
   
   Types: inhibition, stimulation, modulation
   Include confidence (0-5) for each interaction

6️⃣ SIDE EFFECTS:
   - Extract ALL adverse effects mentioned
   - Include frequency/incidence if reported
   - Severity: low (transient), medium (requires monitoring), high (dose-limiting)

🔍 EXTRACTION STRATEGY:
1. Read ENTIRE PDF: Introduction, Methods, Results, Discussion, Conclusions
2. Focus on "Results" section for biomarker data with p-values
3. Check "Discussion" for mechanistic explanations and pathway descriptions
4. Extract from Tables and Figures
5. Note statistical significance for confidence scoring

⚠️ QUALITY RULES:
1. Names in interactions MUST match exactly the names in their arrays
2. Every nutraceutical should connect to at least one mechanism
3. Every mechanism should connect to at least one biological effect
4. Use standardized nomenclature (COX-2 not cyclooxygenase-2)
5. Include units and concentrations when available

Return using extract_study_data function with ALL arrays fully populated.`;

  try {
    console.log('📤 Sending query with Tool Calling via Google AI Direct...');
    console.log(`📄 Including PDF file in request: ${fileUri}`);
    
    // ✅ Use GOOGLE_AI_API_KEY instead of LOVABLE_API_KEY
    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    
    // ✅ Google AI Native format with function declarations AND PDF FILE
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            { 
              role: 'user', 
              parts: [
                // ✅ CRÍTICO: Incluir o PDF no request
                {
                  fileData: {
                    mimeType: 'application/pdf',
                    fileUri: fileUri
                  }
                },
                // Depois o texto do prompt
                { text: `${systemPrompt}\n\n${prompt}` }
              ]
            }
          ],
          tools: [{
            function_declarations: [extractionFunction]
          }],
          tool_config: {
            function_calling_config: {
              mode: 'ANY',
              allowed_function_names: ['extract_study_data']
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google AI API Error:', response.status, errorText);
      
      // Specific error handling for Google AI
      if (response.status === 429) {
        throw new Error('Rate limit exceeded on Google AI. Wait a few minutes.');
      }
      if (response.status === 400) {
        throw new Error('Invalid request to Google AI. Check parameters.');
      }
      
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📊 Response received from Google AI Direct');
    
    // ✅ Google AI native format for function call extraction
    const functionCall = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (!functionCall || functionCall.name !== 'extract_study_data') {
      console.error('❌ AI did not return expected function call');
      console.log('📊 Full response:', JSON.stringify(result, null, 2));
      throw new Error('AI did not use extract_study_data function. Unexpected response.');
    }

    const extractedArgs = functionCall.args;
    console.log('✅ Structured data extracted via Tool Calling');
    console.log(`📊 Nutraceuticals: ${extractedArgs.nutraceuticals?.length || 0}`);
    console.log(`📊 Mechanisms: ${extractedArgs.mechanisms?.length || 0}`);
    console.log(`📊 Biological Effects: ${extractedArgs.biological_effects?.length || 0}`);
    console.log(`📊 Conditions: ${extractedArgs.conditions?.length || 0}`);
    console.log(`📊 Interactions: ${extractedArgs.interactions?.length || 0}`);
    console.log(`📊 Side Effects: ${extractedArgs.side_effects?.length || 0}`);
    console.log(`📊 Title: ${extractedArgs.title?.substring(0, 50) || 'N/A'}...`);

    // Mapear dados estruturados para o formato esperado
    const extractedData: ExtractedStudyData = {
      title: extractedArgs.title || '',
      authors: extractedArgs.authors || [],
      year: extractedArgs.year || undefined,
      journal: extractedArgs.journal || '',
      abstract: extractedArgs.abstract || '',
      doi: extractedArgs.doi || '',
      nutraceuticals: (extractedArgs.nutraceuticals || []).map((n: any) => ({
        name: n.name,
        dosage: n.dosage || '',
        effects: n.effects,
        efficacy_score: n.efficacy_score
      })),
      mechanisms: (extractedArgs.mechanisms || []).map((m: any) => ({
        name: m.name,
        type: m.type,
        description: m.description,
        confidence: m.confidence || 0.8
      })),
      biological_effects: (extractedArgs.biological_effects || []).map((e: any) => ({
        name: e.name,
        type: e.type,
        description: e.description,
        confidence: e.confidence || 0.8
      })),
      conditions: (extractedArgs.conditions || []).map((c: any) => ({
        name: c.name,
        relationship_type: c.relationship_type,
        efficacy_description: c.efficacy_description || '',
        treatability_score: c.treatability_score,
        severity: c.severity
      })),
      interactions: (extractedArgs.interactions || []).map((i: any) => ({
        from: i.from,
        to: i.to,
        type: i.type,
        description: i.description,
        confidence: i.confidence || 0.8
      })),
      side_effects: (extractedArgs.side_effects || []).map((s: any) => ({
        name: s.name,
        description: s.description,
        severity: s.severity,
        confidence: s.confidence || 0.8
      }))
    };

    // Validação crítica - agora mais flexível
    const totalExtracted = extractedData.nutraceuticals.length + 
                          extractedData.mechanisms.length + 
                          extractedData.biological_effects.length + 
                          extractedData.conditions.length;
    
    if (totalExtracted === 0) {
      console.warn('⚠️ WARNING: Nenhum dado foi extraído do documento!');
      console.log('📊 Dados extraídos completos:', JSON.stringify(extractedData, null, 2));
      throw new Error('Extração vazia: 0 nutracêuticos, 0 mecanismos, 0 efeitos e 0 condições. Documento pode estar vazio ou ilegível.');
    }
    
    // Warning se faltar dados intermediários mas houver nutraceuticals e conditions
    if (extractedData.nutraceuticals.length > 0 && extractedData.conditions.length > 0) {
      if (extractedData.mechanisms.length === 0 || extractedData.biological_effects.length === 0) {
        console.warn('⚠️ WARNING: Extração incompleta - faltam mecanismos ou efeitos biológicos intermediários');
      }
      if (extractedData.interactions.length === 0) {
        console.warn('⚠️ WARNING: Nenhuma interação hierárquica foi extraída - visualização não terá conexões');
      }
    }

    console.log('✅ Extração File Search completa com structured output garantido');
    return extractedData;
  } catch (error) {
    console.error('❌ Erro ao extrair dados com Gemini File Search:', error);
    throw new Error(`Falha na extração estruturada: ${error instanceof Error ? error.message : String(error)}`);
  }
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

// RETRY CONFIGURATION WITH EXPONENTIAL BACKOFF
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 2000;

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  attempt: number = 1
): Promise<T> {
  try {
    console.log(`🔄 [${operationName}] Tentativa ${attempt}/${MAX_RETRIES + 1}`);
    return await operation();
  } catch (error) {
    if (attempt > MAX_RETRIES) {
      console.error(`❌ [${operationName}] Todas as ${MAX_RETRIES + 1} tentativas falharam`);
      throw error;
    }
    
    const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
    console.log(`⏳ [${operationName}] Aguardando ${backoffTime}ms antes de retry ${attempt + 1}...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    return retryWithExponentialBackoff(operation, operationName, attempt + 1);
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

    // ========== FLUXO PRINCIPAL COM FILE SEARCH E RETRY AUTOMÁTICO ==========
    console.log('📋 ============================================');
    console.log('📋 INICIANDO PIPELINE COM 6 ETAPAS + RETRY');
    console.log('📋 ============================================');
    
    // 1. Upload para Gemini File API com retry
    console.log('📤 ETAPA 1/6: Upload para Gemini File API...');
    const uploadedFile = await retryWithExponentialBackoff(
      () => uploadToGeminiFileAPI(fileData, fileName, GOOGLE_GEMINI_KEY),
      'Upload to Gemini File API'
    );
    console.log('✅ ETAPA 1/6 CONCLUÍDA');

    // 2. Aguardar processamento com retry
    console.log('⏳ ETAPA 2/6: Aguardando processamento do arquivo...');
    await retryWithExponentialBackoff(
      () => waitForFileActive(uploadedFile.name, GOOGLE_GEMINI_KEY),
      'Wait for File Active'
    );
    console.log('✅ ETAPA 2/6 CONCLUÍDA');

    // 3. Obter ou criar File Search Store com retry
    console.log('🗄️ ETAPA 3/6: Configurando File Search Store...');
    const corpusName = await retryWithExponentialBackoff(
      () => getOrCreateFileSearchStore(GOOGLE_GEMINI_KEY),
      'Get or Create File Search Store'
    );
    console.log('✅ ETAPA 3/6 CONCLUÍDA');
    
    // 4. Adicionar arquivo ao corpus com retry
    console.log('📚 ETAPA 4/6: Adicionando ao corpus vetorizado...');
    await retryWithExponentialBackoff(
      () => addFileToCorpus(corpusName, uploadedFile, GOOGLE_GEMINI_KEY),
      'Add File to Corpus'
    );
    console.log('✅ ETAPA 4/6 CONCLUÍDA');
    
    // ⏳ Aguardar indexação completa do documento
    console.log('⏳ Aguardando 10s para indexação completa do documento...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 5. Extração com File Search com retry
    console.log('🔍 ETAPA 5/6: Extraindo dados com AI File Search...');
    const fileSearchStoreName = corpusName.replace(/^corpora\//, 'fileSearchStores/');
    
    const startTime = Date.now();
    // ✅ CRÍTICO: Passar o uploadedFile.uri para a função de extração
    const extractedData = await retryWithExponentialBackoff(
      () => extractWithFileSearch(fileSearchStoreName, uploadedFile.uri, GOOGLE_GEMINI_KEY, supabase),
      'Extract Data with File Search'
    );
    const duration = Date.now() - startTime;
    console.log('✅ ETAPA 5/6 CONCLUÍDA');
    console.log(`⏱️ Tempo de extração: ${(duration / 1000).toFixed(1)}s`);
    
    // 6. Salvar no banco com validação e retry
    console.log('💾 ETAPA 6/6: Salvando no banco de dados...');
    console.log('📊 Dados a serem salvos:');
    console.log('  - Título:', extractedData.title || '(vazio)');
    console.log('  - Autores:', extractedData.authors.length);
    console.log('  - Nutracêuticos:', extractedData.nutraceuticals.length);
    console.log('  - Condições:', extractedData.conditions.length);
    
    // VALIDAÇÃO: Verificar se temos dados mínimos
    if (!extractedData.title && extractedData.nutraceuticals.length === 0 && extractedData.conditions.length === 0) {
      console.error('❌ VALIDAÇÃO FALHOU: Nenhum dado relevante foi extraído');
      throw new Error('Extração falhou: nenhum dado relevante encontrado no PDF');
    }
    
    await retryWithExponentialBackoff(
      async () => {
        // Preparar full_text_content para RAG
        let fullTextContent = '';
        let extractionMethod = 'none';
        
        // Prioridade 1: Full text completo do Gemini (NOVO - direto do schema)
        if (extractedData.full_text && extractedData.full_text.length > 500) {
          fullTextContent = extractedData.full_text;
          extractionMethod = 'gemini_full_text_extraction';
          console.log('✅ Usando full_text direto do Gemini (melhor qualidade para RAG)');
        }
        // Prioridade 2: Construir texto completo a partir dos dados estruturados
        else {
          console.warn('⚠️ full_text não extraído pelo Gemini, construindo a partir de dados estruturados');
          const parts = [];
          
          // Metadados básicos
          if (extractedData.title) parts.push(`# ${extractedData.title}\n`);
          if (extractedData.authors.length > 0) parts.push(`**Authors:** ${extractedData.authors.join(', ')}\n`);
          if (extractedData.year) parts.push(`**Year:** ${extractedData.year}\n`);
          if (extractedData.journal) parts.push(`**Journal:** ${extractedData.journal}\n`);
          if (extractedData.doi) parts.push(`**DOI:** ${extractedData.doi}\n`);
          
          // Abstract
          if (extractedData.abstract) {
            parts.push(`\n## Abstract\n${extractedData.abstract}\n`);
          }
          
          // Nutracêuticos com detalhes
          if (extractedData.nutraceuticals.length > 0) {
            parts.push('\n## Nutraceuticals Studied\n');
            extractedData.nutraceuticals.forEach(n => {
              parts.push(`\n### ${n.name}`);
              if (n.dosage) parts.push(`- Dosage: ${n.dosage}`);
              parts.push(`- Effects: ${n.effects}`);
              if (n.efficacy_score) parts.push(`- Efficacy Score: ${n.efficacy_score}/5`);
            });
          }
          
          // Mecanismos moleculares
          if (extractedData.mechanisms.length > 0) {
            parts.push('\n## Molecular Mechanisms\n');
            extractedData.mechanisms.forEach(m => {
              parts.push(`\n### ${m.name} (${m.type})`);
              parts.push(`${m.description}`);
            });
          }
          
          // Efeitos biológicos
          if (extractedData.biological_effects.length > 0) {
            parts.push('\n## Biological Effects\n');
            extractedData.biological_effects.forEach(e => {
              parts.push(`\n### ${e.name} (${e.type})`);
              parts.push(`${e.description}`);
            });
          }
          
          // Condições de saúde
          if (extractedData.conditions.length > 0) {
            parts.push('\n## Health Conditions Addressed\n');
            extractedData.conditions.forEach(c => {
              parts.push(`\n### ${c.name}`);
              parts.push(`- Relationship: ${c.relationship_type}`);
              if (c.efficacy_description) parts.push(`- Efficacy: ${c.efficacy_description}`);
              if (c.treatability_score) parts.push(`- Treatability Score: ${c.treatability_score}/5`);
            });
          }
          
          // Interações (cadeia biológica)
          if (extractedData.interactions.length > 0) {
            parts.push('\n## Biological Pathway Interactions\n');
            extractedData.interactions.forEach(i => {
              parts.push(`\n**${i.from}** → [${i.type}] → **${i.to}**`);
              parts.push(`${i.description}`);
            });
          }
          
          // Efeitos colaterais
          if (extractedData.side_effects.length > 0) {
            parts.push('\n## Side Effects\n');
            extractedData.side_effects.forEach(s => {
              parts.push(`\n### ${s.name} (${s.severity} severity)`);
              parts.push(`${s.description}`);
            });
          }
          
          fullTextContent = parts.join('\n');
          extractionMethod = 'structured_data_enhanced';
        }
        
        console.log(`📄 Full text extraction method: ${extractionMethod}, length: ${fullTextContent.length} chars`);
        
        const fullTextMetadata = {
          extraction_method: extractionMethod,
          sections: [], // Removido extractedDataAny
          word_count: fullTextContent ? fullTextContent.split(/\s+/).length : 0,
          char_count: fullTextContent.length,
          has_abstract: !!extractedData.abstract,
          has_full_text: !!extractedData.full_text,
          has_sections: false, // Removido extractedDataAny
          extracted_at: new Date().toISOString()
        };
        
        // Preparar analysis_data com formato compatível com visualização
        const analysisData = {
          ...extractedData,
          // Adicionar aliases para compatibilidade com componentes existentes
          extractedNutraceuticals: extractedData.nutraceuticals.map(n => ({
            name: n.name,
            confidence: n.efficacy_score || 4.0
          })),
          extractedMechanisms: extractedData.mechanisms.map(m => ({
            name: m.name,
            type: m.type,
            confidence: m.confidence || 0.8
          })),
          extractedEffects: extractedData.biological_effects.map(e => ({
            name: e.name,
            type: e.type,
            confidence: e.confidence || 0.8
          })),
          extractedConditions: extractedData.conditions.map(c => ({
            name: c.name,
            confidence: c.treatability_score || 4.0
          })),
          extractedInteractions: extractedData.interactions,
          extractedSideEffects: extractedData.side_effects
        };
        
        console.log('💾 Salvando com RAG support...');
        console.log(`   - full_text_content: ${fullTextContent.length} chars`);
        console.log(`   - word_count: ${fullTextMetadata.word_count}`);
        
        const result = await supabase
          .from('processed_studies')
          .update({
            title: extractedData.title || null,
            authors: extractedData.authors.length > 0 ? extractedData.authors : null,
            year: extractedData.year || null,
            journal: extractedData.journal || null,
            analysis_data: analysisData as any,
            full_text_content: fullTextContent || null,
            full_text_metadata: fullTextMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', studyId);
        
        if (result.error) throw result.error;
        return result;
      },
      'Save to Database'
    );
    
    // VALIDAÇÃO PÓS-SAVE: Verificar se realmente salvou
    console.log('🔍 Validando dados salvos...');
    const { data: savedData, error: verifyError } = await supabase
      .from('processed_studies')
      .select('analysis_data')
      .eq('id', studyId)
      .single();
    
    if (verifyError || !savedData?.analysis_data) {
      console.error('❌ VALIDAÇÃO PÓS-SAVE FALHOU: analysis_data não foi salvo');
      throw new Error('Falha na validação: dados não foram persistidos no banco');
    }
    
    console.log('✅ ETAPA 6/6 CONCLUÍDA: Dados confirmados no banco');
    console.log('🎉 ============================================');
    console.log('🎉 PIPELINE COMPLETO COM SUCESSO');
    console.log('🎉 ============================================');
    
    // 📊 Registrar uso da API
    try {
      await supabase.from('api_usage_logs').insert({
        api_provider: 'google_gemini',
        model: 'gemini-2.5-flash',
        operation: 'file_search_extraction',
        tokens_input: 0,
        tokens_output: 0,
        cost_usd: 0,
        metadata: {
          studyId,
          duration_seconds: duration / 1000,
          nutraceuticals_count: extractedData.nutraceuticals.length,
          conditions_count: extractedData.conditions.length,
        }
      });
    } catch (logError) {
      console.warn('⚠️ Falha ao registrar uso (não crítico):', logError);
    }

    // Deletar arquivo após processamento (opcional)
    try {
      await deleteGeminiFile(uploadedFile.name, GOOGLE_GEMINI_KEY);
    } catch (delError) {
      console.warn('⚠️ Falha ao deletar arquivo (não crítico):', delError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        studyId,
        nutraceuticalsCount: extractedData.nutraceuticals.length,
        conditionsCount: extractedData.conditions.length,
        message: 'Pipeline completo com retry automático em todas as etapas',
        metadata: {
          duration_seconds: duration / 1000,
          retries_used: 'automatic retry enabled for all steps'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 ============================================');
    console.error('💥 ERRO FATAL NO PROCESSAMENTO');
    console.error('💥 ============================================');
    console.error('❌ Tipo:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('💥 ============================================');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        recommendation: 'Verifique os logs detalhados. Se o erro persistir após 3 retries automáticos, verifique: 1) Tamanho do PDF (<20MB), 2) Formato válido, 3) Quota da API Gemini'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
