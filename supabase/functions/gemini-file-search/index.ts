import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getConfigValue } from './utils.ts';
import { decideFileSearchGate } from './gate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ EXPANDED: Study population metadata for species/breed tracking
interface StudyPopulation {
  species: string; // canine, feline, equine, human, murine, etc.
  breed?: string;
  age_group?: string; // puppy, adult, senior
  sample_size?: number;
  weight_range?: { min: number; max: number; unit: string };
  health_status?: string; // healthy, diseased, mixed
}

// ✅ EXPANDED: Structured dosage for precise tracking
interface StructuredDosage {
  compound: string;
  amount: number;
  unit: string; // mg, g, ml, mcg
  frequency: string; // daily, twice daily, weekly
  per_body_weight?: boolean; // true if dose is per kg
  duration_days?: number;
  route?: string; // oral, topical, injection
}

// ✅ EXPANDED: Biomarker measurements with statistical data
interface BiomarkerMeasurement {
  name: string;
  baseline_value?: number;
  final_value?: number;
  change_percent?: number;
  unit?: string;
  p_value?: number;
  significance: 'significant' | 'trending' | 'not_significant';
}

// ✅ EXPANDED: Contraindication structure
interface Contraindication {
  condition: string;
  reason: string;
  severity: 'absolute' | 'relative' | 'caution';
  evidence_level?: string;
}

// ✅ EXPANDED: Drug interaction structure
interface DrugInteraction {
  compound: string;
  interaction_type: 'synergy' | 'antagonism' | 'potentiation' | 'inhibition' | 'enhancement' | 'reduction';
  effect: string;
  severity: 'beneficial' | 'neutral' | 'caution' | 'avoid' | 'dangerous';
  mechanism?: string;
}

// ✅ EXPANDED: Synergy structure
interface Synergy {
  compounds: string[];
  enhanced_effect: string;
  mechanism?: string;
  optimal_ratio?: string;
}

interface ExtractedStudyData {
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  abstract?: string;
  doi?: string;
  full_text?: string;
  
  // ✅ Study population metadata
  study_population?: StudyPopulation;
  
  // ✅ Structured dosages array
  structured_dosages?: StructuredDosage[];
  
  // ✅ Biomarker measurements
  biomarkers?: BiomarkerMeasurement[];
  
  nutraceuticals: Array<{
    name: string;
    description?: string;
    canonical_id?: string;
    category?: string;
    dosage?: string;
    effects: string;
    efficacy_score?: number;
    species_tested?: string[];
    synonyms?: string[];
  }>;
  mechanisms: Array<{
    name: string;
    description: string;
    canonical_id?: string;
    type: 'pathway' | 'mediator' | 'enzyme' | 'receptor' | 'gene' | 'protein';
    action_type?: string;
    molecular_target?: string;
    confidence?: number;
  }>;
  biological_effects: Array<{
    name: string;
    description: string;
    canonical_id?: string;
    type: 'intermediate' | 'biomarker' | 'physiological';
    effect_category?: string;
    duration?: string;
    confidence?: number;
  }>;
  conditions: Array<{
    name: string;
    description?: string;
    canonical_id?: string;
    category?: string;
    relationship_type: string;
    efficacy_description?: string;
    treatability_score?: number;
    severity?: string;
    species_specific?: string;
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
    frequency?: string;
    dose_related?: boolean;
    confidence?: number;
  }>;
  // ✅ NEW: Contraindications
  contraindications?: Contraindication[];
  // ✅ NEW: Drug interactions
  drug_interactions?: DrugInteraction[];
  // ✅ NEW: Synergies
  synergies?: Synergy[];
  // ✅ NEW: Study assessment scores
  study_assessment?: {
    methodology_type?: string;
    sample_size?: number;
    randomization?: boolean;
    blinding?: string;
    placebo_controlled?: boolean;
    statistical_significance?: boolean;
    follow_up_duration?: string;
    species_tested?: string[];
    quality_score?: number;
    relevance_score?: number;
    novelty_score?: number;
  };
  // ✅ NEW: Study summary
  study_summary?: {
    objective?: string;
    key_findings?: string[];
    clinical_implications?: string;
    limitations?: string[];
  };
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
  
  // ✅ VALIDAÇÃO: Verificar se é um PDF válido antes de fazer upload
  const pdfSignature = String.fromCharCode(...pdfBytes.slice(0, 4));
  const isValidPdf = pdfSignature === '%PDF';
  
  if (!isValidPdf) {
    // Tentar detectar se é HTML
    const firstChars = String.fromCharCode(...pdfBytes.slice(0, 100));
    const isHtml = firstChars.toLowerCase().includes('<!doctype') || 
                   firstChars.toLowerCase().includes('<html') ||
                   firstChars.toLowerCase().includes('<?xml');
    
    console.error('❌ Arquivo inválido detectado!');
    console.error('📊 Primeiros bytes:', firstChars.substring(0, 50));
    console.error('📊 É HTML:', isHtml);
    
    if (isHtml) {
      throw new Error('ARQUIVO_INVALIDO: O arquivo baixado é uma página HTML, não um PDF. Isso geralmente acontece quando o PDF requer autenticação institucional ou foi removido.');
    }
    
    throw new Error(`ARQUIVO_INVALIDO: O arquivo não é um PDF válido. Assinatura encontrada: "${pdfSignature}". Esperado: "%PDF"`);
  }
  
  // ✅ VALIDAÇÃO: Verificar tamanho mínimo (PDFs válidos geralmente têm > 10KB)
  const MIN_PDF_SIZE = 10 * 1024; // 10KB
  if (pdfBlob.size < MIN_PDF_SIZE) {
    console.error('❌ PDF muito pequeno:', pdfBlob.size, 'bytes');
    throw new Error(`ARQUIVO_INVALIDO: O PDF é muito pequeno (${pdfBlob.size} bytes). PDFs científicos válidos geralmente têm pelo menos ${MIN_PDF_SIZE} bytes. O arquivo pode estar corrompido ou incompleto.`);
  }
  
  console.log('✅ PDF validado - assinatura correta e tamanho adequado');
  
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

// ============================================================
// CALL 1 — acquireFullText
// ------------------------------------------------------------
// Dedicated call to extract ONLY the full plain text of the PDF.
// Uses gemini-2.5-flash with a minimal schema { full_text: string }
// so the model's output token budget is not shared with 22 other
// clinical properties (the root cause of progressive truncation in
// the legacy monolithic call).
// ============================================================
async function acquireFullText(
  fileUri: string,
  apiKey: string,
): Promise<{ text: string; model: string; error?: string }> {
  const MODEL = 'gemini-2.5-flash';
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { fileData: { mimeType: 'application/pdf', fileUri } },
                {
                  text:
                    'Extract the COMPLETE plain text of this scientific PDF. Include every section ' +
                    '(abstract, introduction, methods, results, discussion, references). Preserve ' +
                    'section order and meaningful paragraph breaks. Do not summarize. Do not omit ' +
                    'content. Return ONLY the raw text as a single string in the function argument.',
                },
              ],
            },
          ],
          tools: [{
            function_declarations: [{
              name: 'return_full_text',
              description: 'Return the verbatim full text of the PDF as one string.',
              parameters: {
                type: 'object',
                properties: {
                  full_text: {
                    type: 'string',
                    description: 'Complete plain text of the PDF, all sections, no truncation.',
                  },
                },
                required: ['full_text'],
              },
            }],
          }],
          tool_config: {
            function_calling_config: { mode: 'ANY', allowed_function_names: ['return_full_text'] },
          },
        }),
      },
    );
    if (!response.ok) {
      const errText = await response.text();
      return { text: '', model: MODEL, error: `HTTP ${response.status}: ${errText.slice(0, 300)}` };
    }
    const result = await response.json();
    const fc = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    const txt = (fc?.args?.full_text as string | undefined) || '';
    return { text: typeof txt === 'string' ? txt : '', model: MODEL };
  } catch (err) {
    return { text: '', model: MODEL, error: err instanceof Error ? err.message : String(err) };
  }
}

// Extração com File Search usando Structured Output (Function Calling)
async function extractWithFileSearch(
  fileSearchStoreName: string,
  fileUri: string,  // ✅ ADICIONADO: URI do arquivo para passar ao modelo
  apiKey: string,
  supabaseClient: any
): Promise<ExtractedStudyData> {
  // ✅ USING GOOGLE AI DIRECTLY with gemini-3-pro-preview (melhor reasoning multi-hop)
  const MODEL_NAME = 'gemini-3-pro-preview';
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
  
  // Definir schema expandido para structured output - INCLUDES SPECIES, BREED, DOSAGES
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
          description: 'COMPLETE full text content of the entire PDF document. Extract ALL text from all sections.'
        },
        // ✅ NEW: Study population metadata
        study_population: {
          type: 'object',
          description: 'CRITICAL: Extract the study population characteristics - species, breed, age, sample size',
          properties: {
            species: {
              type: 'string',
              description: 'Species studied: canine, feline, equine, human, murine, bovine, etc.'
            },
            breed: {
              type: 'string',
              description: 'Specific breed if mentioned (e.g., Labrador Retriever, Persian, Thoroughbred)'
            },
            age_group: {
              type: 'string',
              description: 'Age group: puppy, kitten, adult, senior, geriatric'
            },
            sample_size: {
              type: 'integer',
              description: 'Number of subjects in the study (n=X)'
            },
            weight_range_min: {
              type: 'number',
              description: 'Minimum weight in kg'
            },
            weight_range_max: {
              type: 'number',
              description: 'Maximum weight in kg'
            },
            health_status: {
              type: 'string',
              description: 'Health status: healthy, diseased, obese, diabetic, arthritic, etc.'
            }
          },
          required: ['species']
        },
        // ✅ NEW: Structured dosages array
        structured_dosages: {
          type: 'array',
          description: 'CRITICAL: Extract ALL dosages with structured data - amount, unit, frequency, per kg, duration',
          items: {
            type: 'object',
            properties: {
              compound: {
                type: 'string',
                description: 'Name of the compound being dosed'
              },
              amount: {
                type: 'number',
                description: 'Numeric dose amount (e.g., 0.3, 500, 2.5)'
              },
              unit: {
                type: 'string',
                description: 'Dose unit: mg, g, ml, mcg, IU'
              },
              frequency: {
                type: 'string',
                description: 'How often: daily, twice daily, weekly, once'
              },
              per_body_weight: {
                type: 'boolean',
                description: 'True if dose is per kg body weight (e.g., 0.3 mg/kg/day)'
              },
              duration_days: {
                type: 'integer',
                description: 'Duration of treatment in days (e.g., 56 days = 8 weeks)'
              },
              route: {
                type: 'string',
                description: 'Administration route: oral, topical, injection, intravenous'
              }
            },
            required: ['compound', 'amount', 'unit']
          }
        },
        // ✅ NEW: Biomarker measurements with statistical data
        biomarkers: {
          type: 'array',
          description: 'Extract ALL biomarker/outcome measurements with baseline, final values, and p-values',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Biomarker name: MDA, LDH, ALT, AST, TG, NEFA, IL-6, TNF-α, adiponectin'
              },
              baseline_value: {
                type: 'number',
                description: 'Baseline/control value before treatment'
              },
              final_value: {
                type: 'number',
                description: 'Final value after treatment'
              },
              change_percent: {
                type: 'number',
                description: 'Percent change from baseline (negative = decrease)'
              },
              unit: {
                type: 'string',
                description: 'Measurement unit (ng/ml, mmol/L, U/L, etc.)'
              },
              p_value: {
                type: 'number',
                description: 'Statistical p-value (e.g., 0.05, 0.01, 0.001)'
              },
              significance: {
                type: 'string',
                enum: ['significant', 'trending', 'not_significant'],
                description: 'Statistical significance: significant (p<0.05), trending (0.05-0.1), not_significant'
              }
            },
            required: ['name', 'significance']
          }
        },
        nutraceuticals: {
          type: 'array',
          description: 'List of ALL nutraceuticals, supplements or active compounds mentioned (MUST be in English). Extract DETAILED descriptions for each.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Scientific or common name IN ENGLISH. ⚠️ ONLY extract from PDF'
              },
              description: {
                type: 'string',
                description: 'DETAILED scientific description of the compound: what it is, its chemical class, natural sources, and primary biological functions. 2-4 sentences.'
              },
              canonical_id: {
                type: 'string',
                description: 'Canonical identifier for ontology linking. Format: NUT_[UPPERCASE_NAME] (e.g., NUT_GLUCOSAMINE, NUT_OMEGA3, NUT_CURCUMIN). Use standardized names.'
              },
              category: {
                type: 'string',
                enum: ['amino_acid', 'fatty_acid', 'vitamin', 'mineral', 'polyphenol', 'enzyme', 'probiotic', 'prebiotic', 'herb_extract', 'other'],
                description: 'Category of the nutraceutical compound'
              },
              dosage: {
                type: 'string',
                description: 'Dosage used with units (e.g., 0.3 mg/kg/day, 500mg daily)'
              },
              effects: {
                type: 'string',
                description: 'Effects or results observed in the study IN ENGLISH'
              },
              efficacy_score: {
                type: 'number',
                description: 'Efficacy score 0.0-1.0 based on statistical significance. Calculate as: 1.0 if p<0.001, 0.8 if p<0.01, 0.6 if p<0.05, 0.4 if weak/not significant, 0.2 if no data'
              },
              species_tested: {
                type: 'array',
                items: { type: 'string' },
                description: 'Species this compound was tested on (canine, feline, etc.)'
              },
              synonyms: {
                type: 'array',
                items: { type: 'string' },
                description: 'Alternative names for this compound (e.g., ["GlcN", "2-Amino-2-deoxy-D-glucose"])'
              }
            },
            required: ['name', 'effects', 'description', 'canonical_id']
          }
        },
        mechanisms: {
          type: 'array',
          description: 'List of ALL molecular mechanisms, pathways, enzymes, receptors involved (MUST be in English). Extract DETAILED descriptions for ontology.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the molecular mechanism IN ENGLISH. Use standard nomenclature with direction indicators (e.g., "↓ COX-2 pathway" for inhibition, "↑ Proteoglycans" for stimulation)'
              },
              description: {
                type: 'string',
                description: 'DETAILED scientific description of how this mechanism works, its role in the biological cascade, and its clinical significance. 2-4 sentences.'
              },
              canonical_id: {
                type: 'string',
                description: 'Canonical identifier for ontology linking. Format: MECH_[UPPERCASE_NAME] (e.g., MECH_COX2_INHIBITION, MECH_NFKB_PATHWAY). Use standardized names.'
              },
              type: {
                type: 'string',
                enum: ['pathway', 'mediator', 'enzyme', 'receptor', 'gene', 'protein'],
                description: 'Type of molecular mechanism'
              },
              action_type: {
                type: 'string',
                enum: ['activation', 'inhibition', 'modulation', 'binding', 'catalysis', 'signaling'],
                description: 'Primary action type of this mechanism'
              },
              molecular_target: {
                type: 'string',
                description: 'Specific molecular target (e.g., "Cyclooxygenase-2", "NF-κB p65 subunit")'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0.0-1.0 based on evidence strength: 0.9+ for RCT/meta-analysis, 0.7-0.9 for cohort, 0.5-0.7 for case-control, 0.3-0.5 for case report, 0.1-0.3 for in vitro'
              }
            },
            required: ['name', 'type', 'description', 'canonical_id']
          }
        },
        biological_effects: {
          type: 'array',
          description: 'List of ALL intermediate biological effects, biomarkers, physiological changes (MUST be in English). Extract DETAILED descriptions for ontology.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the biological effect IN ENGLISH. Use direction indicators (e.g., "↓ IL-6 & TNF-α" for reduction, "↑ Joint lubrication" for increase)'
              },
              description: {
                type: 'string',
                description: 'DETAILED scientific description of the biological effect, its measurement methods, clinical relevance, and expected magnitude of change. 2-4 sentences.'
              },
              canonical_id: {
                type: 'string',
                description: 'Canonical identifier for ontology linking. Format: EFF_[UPPERCASE_NAME] (e.g., EFF_INFLAMMATION_REDUCTION, EFF_JOINT_LUBRICATION). Use standardized names.'
              },
              type: {
                type: 'string',
                enum: ['intermediate', 'biomarker', 'physiological'],
                description: 'Type of biological effect'
              },
              effect_category: {
                type: 'string',
                enum: ['anti_inflammatory', 'antioxidant', 'metabolic', 'cardiovascular', 'neurological', 'musculoskeletal', 'immune', 'digestive', 'other'],
                description: 'Category of the biological effect'
              },
              duration: {
                type: 'string',
                description: 'Duration or onset of the effect (e.g., "within 2 weeks", "chronic", "immediate")'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0.0-1.0 based on evidence strength: 0.9+ for RCT/meta-analysis, 0.7-0.9 for cohort, 0.5-0.7 for case-control, 0.3-0.5 for case report, 0.1-0.3 for in vitro'
              }
            },
            required: ['name', 'type', 'description', 'canonical_id']
          }
        },
        conditions: {
          type: 'array',
          description: 'List of ALL health conditions, diseases or clinical outcomes addressed (MUST be in English). Extract DETAILED descriptions for ontology.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the condition or disease IN ENGLISH (e.g., Canine Arthritis, Osteoarthritis, Joint Inflammation)'
              },
              description: {
                type: 'string',
                description: 'DETAILED clinical description of the condition: pathophysiology, symptoms, affected systems, and typical progression. 2-4 sentences.'
              },
              canonical_id: {
                type: 'string',
                description: 'Canonical identifier for ontology linking. Format: COND_[UPPERCASE_NAME] (e.g., COND_OSTEOARTHRITIS, COND_HIP_DYSPLASIA). Use standardized medical terminology.'
              },
              category: {
                type: 'string',
                enum: ['musculoskeletal', 'cardiovascular', 'neurological', 'metabolic', 'dermatological', 'gastrointestinal', 'respiratory', 'oncological', 'immunological', 'other'],
                description: 'Medical category of the condition'
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
                type: 'number',
                description: 'Treatability score 0.0-1.0 based on study results: 0.9+ for cure/complete resolution, 0.7-0.9 for major improvement, 0.5-0.7 for moderate, 0.3-0.5 for mild, 0.1-0.3 for minimal'
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Severity level of the condition'
              },
              species_specific: {
                type: 'string',
                description: 'Species for which this condition is being studied (if specific to certain species)'
              }
            },
            required: ['name', 'relationship_type', 'description', 'canonical_id']
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
                description: 'Confidence score 0.0-1.0 based on evidence strength: 0.9+ for RCT/meta-analysis with p<0.001, 0.7-0.9 for strong evidence, 0.5-0.7 for moderate, 0.3-0.5 for weak, 0.1-0.3 for speculation'
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
              frequency: {
                type: 'string',
                description: 'Frequency of occurrence (e.g., "5%", "rare", "common")'
              },
              dose_related: {
                type: 'boolean',
                description: 'Whether the side effect is dose-dependent'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score 0-5 based on evidence'
              }
            },
            required: ['name', 'description', 'severity']
          }
        },
        // ✅ NEW: Contraindications - conditions where compound should NOT be used
        contraindications: {
          type: 'array',
          description: 'CRITICAL: Extract ALL contraindications - conditions/situations where the compound should NOT be used',
          items: {
            type: 'object',
            properties: {
              condition: {
                type: 'string',
                description: 'The condition or situation where use is contraindicated (e.g., "Pregnancy", "Liver disease", "Concurrent NSAID use")'
              },
              reason: {
                type: 'string',
                description: 'Why this is contraindicated'
              },
              severity: {
                type: 'string',
                enum: ['absolute', 'relative', 'caution'],
                description: 'absolute=never use, relative=avoid if possible, caution=use with monitoring'
              },
              evidence_level: {
                type: 'string',
                enum: ['high', 'moderate', 'low'],
                description: 'Strength of evidence for this contraindication'
              }
            },
            required: ['condition', 'reason', 'severity']
          }
        },
        // ✅ NEW: Drug interactions - interactions with other compounds/medications
        drug_interactions: {
          type: 'array',
          description: 'CRITICAL: Extract ALL drug/compound interactions mentioned',
          items: {
            type: 'object',
            properties: {
              compound: {
                type: 'string',
                description: 'The other compound/drug that interacts'
              },
              interaction_type: {
                type: 'string',
                enum: ['synergy', 'antagonism', 'potentiation', 'inhibition', 'enhancement', 'reduction'],
                description: 'Type of interaction'
              },
              effect: {
                type: 'string',
                description: 'What happens when combined'
              },
              severity: {
                type: 'string',
                enum: ['beneficial', 'neutral', 'caution', 'avoid', 'dangerous'],
                description: 'Clinical significance of the interaction'
              },
              mechanism: {
                type: 'string',
                description: 'How the interaction occurs (e.g., "CYP450 inhibition", "competitive binding")'
              }
            },
            required: ['compound', 'interaction_type', 'effect', 'severity']
          }
        },
        // ✅ NEW: Synergies - beneficial compound combinations
        synergies: {
          type: 'array',
          description: 'Extract beneficial compound combinations/synergies',
          items: {
            type: 'object',
            properties: {
              compounds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Compounds that work synergistically together'
              },
              enhanced_effect: {
                type: 'string',
                description: 'What effect is enhanced by the combination'
              },
              mechanism: {
                type: 'string',
                description: 'How the synergy works'
              },
              optimal_ratio: {
                type: 'string',
                description: 'Optimal ratio if mentioned (e.g., "2:1 Omega-3:Omega-6")'
              }
            },
            required: ['compounds', 'enhanced_effect']
          }
        },
        // ✅ NEW: Study Assessment - Quality, Relevance, Novelty scores
        study_assessment: {
          type: 'object',
          description: 'CRITICAL: Evaluate study methodology and generate quality scores (1.0-5.0)',
          properties: {
            methodology_type: {
              type: 'string',
              enum: ['RCT', 'cohort', 'case_control', 'case_study', 'meta_analysis', 'systematic_review', 'in_vitro', 'observational'],
              description: 'Study design type'
            },
            sample_size: {
              type: 'integer',
              description: 'Number of subjects (n=X)'
            },
            randomization: {
              type: 'boolean',
              description: 'Was the study randomized?'
            },
            blinding: {
              type: 'string',
              enum: ['double_blind', 'single_blind', 'open_label', 'none'],
              description: 'Blinding method used'
            },
            placebo_controlled: {
              type: 'boolean',
              description: 'Did the study have a placebo control group?'
            },
            statistical_significance: {
              type: 'boolean',
              description: 'Were results statistically significant (p<0.05)?'
            },
            p_values: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of p-values reported (e.g., ["<0.001", "0.03", "0.045"])'
            },
            follow_up_duration: {
              type: 'string',
              description: 'Duration of the study/follow-up (e.g., "12 weeks", "6 months")'
            },
            species_tested: {
              type: 'array',
              items: { type: 'string' },
              description: 'Species studied (canine, feline, human, murine, etc.)'
            },
            quality_score: {
              type: 'number',
              description: 'Methodological quality score (1.0-5.0). 5.0=RCT double-blind n>100, 4.0=RCT n>50, 3.0=Cohort n>30, 2.0=Case-control n<30, 1.0=Case report'
            },
            relevance_score: {
              type: 'number',
              description: 'Clinical relevance score (1.0-5.0). 5.0=Direct veterinary application, 4.0=Translatable, 3.0=Human study, 2.0=In vitro/rodent, 1.0=Pure mechanistic'
            },
            novelty_score: {
              type: 'number',
              description: 'Scientific novelty score (1.0-5.0). 5.0=First of its kind, 4.0=Novel combination, 3.0=Confirms with new data, 2.0=Replication, 1.0=Well-established'
            }
          },
          required: ['methodology_type', 'quality_score', 'relevance_score', 'novelty_score']
        },
        // ✅ NEW: Study Summary - Structured description
        study_summary: {
          type: 'object',
          description: 'Structured summary of the study findings',
          properties: {
            objective: {
              type: 'string',
              description: 'Main research objective in one sentence'
            },
            key_findings: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of 3-5 main findings from the study'
            },
            clinical_implications: {
              type: 'string',
              description: 'Practical implications for veterinary practice'
            },
            limitations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Study limitations mentioned by authors'
            }
          },
          required: ['objective', 'key_findings']
        }
      },
      required: ['title', 'authors', 'nutraceuticals', 'mechanisms', 'biological_effects', 'conditions', 'interactions', 'side_effects', 'contraindications', 'study_assessment', 'study_summary']
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
   Create EXPLICIT step-by-step chains based on ACTUAL data from the study.
   Types: inhibition, stimulation, modulation
   Include confidence (0-5) for each interaction

6️⃣ SIDE EFFECTS:
   - Extract ALL adverse effects mentioned
   - Include frequency/incidence if reported
   - Severity: low (transient), medium (requires monitoring), high (dose-limiting)

7️⃣ STUDY ASSESSMENT (CRITICAL - Scores 1.0-5.0):
   Evaluate the study methodology and generate THREE scores:
   
   📊 QUALITY_SCORE (Methodological Rigor):
   - 5.0: RCT double-blind, placebo-controlled, n>100, clear statistics
   - 4.0: RCT single-blind, n>50, adequate methodology
   - 3.0: Cohort/observational study, n>30, reasonable controls
   - 2.0: Case-control, small sample (n<30), limited controls
   - 1.0: Case report, anecdotal, no controls
   
   📊 RELEVANCE_SCORE (Clinical Applicability):
   - 5.0: Direct veterinary application, species-specific, actionable dosages
   - 4.0: Translatable to veterinary practice, relevant species model
   - 3.0: Human study with potential veterinary translation
   - 2.0: In vitro or rodent model, limited clinical translation
   - 1.0: Pure mechanistic study, no clinical application
   
   📊 NOVELTY_SCORE (Scientific Contribution):
   - 5.0: First study of its kind, paradigm-shifting findings
   - 4.0: Novel combination, new mechanism discovered
   - 3.0: Confirms previous findings with new data
   - 2.0: Replication study, incremental knowledge
   - 1.0: Well-established findings, no new information
   
   Also extract: methodology_type, sample_size, randomization, blinding, placebo_controlled, statistical_significance, p_values, follow_up_duration, species_tested

8️⃣ STUDY SUMMARY:
   - objective: Main research objective in one sentence
   - key_findings: Array of 3-5 main findings from the study
   - clinical_implications: Practical implications for veterinary practice
   - limitations: Study limitations mentioned by authors

🔍 EXTRACTION STRATEGY:
1. Read ENTIRE PDF: Introduction, Methods, Results, Discussion, Conclusions
2. Focus on "Methods" section for study_assessment data
3. Focus on "Results" section for biomarker data with p-values
4. Check "Discussion" for mechanistic explanations and pathway descriptions
5. Extract from Tables and Figures
6. Note statistical significance for confidence scoring

⚠️ QUALITY RULES:
1. Names in interactions MUST match exactly the names in their arrays
2. Every nutraceutical should connect to at least one mechanism
3. Every mechanism should connect to at least one biological effect
4. Use standardized nomenclature (COX-2 not cyclooxygenase-2)
5. Include units and concentrations when available
6. BE CRITICAL and OBJECTIVE with scores - base on actual evidence

Return using extract_study_data function with ALL arrays fully populated, INCLUDING study_assessment and study_summary.`;

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
    console.log(`📊 Contraindications: ${extractedArgs.contraindications?.length || 0}`);
    console.log(`📊 Drug Interactions: ${extractedArgs.drug_interactions?.length || 0}`);
    console.log(`📊 Synergies: ${extractedArgs.synergies?.length || 0}`);
    console.log(`📊 Study Population: ${extractedArgs.study_population ? 'YES' : 'NO'}`);
    console.log(`📊 Structured Dosages: ${extractedArgs.structured_dosages?.length || 0}`);
    console.log(`📊 Biomarkers: ${extractedArgs.biomarkers?.length || 0}`);
    console.log(`📊 Title: ${extractedArgs.title?.substring(0, 50) || 'N/A'}...`);

    // Mapear dados estruturados para o formato esperado - EXPANDED with new fields
    const extractedData: ExtractedStudyData = {
      title: extractedArgs.title || '',
      authors: extractedArgs.authors || [],
      year: extractedArgs.year || undefined,
      journal: extractedArgs.journal || '',
      abstract: extractedArgs.abstract || '',
      doi: extractedArgs.doi || '',
      full_text: extractedArgs.full_text || '',
      // ✅ NEW: Study population
      study_population: extractedArgs.study_population ? {
        species: extractedArgs.study_population.species || 'unknown',
        breed: extractedArgs.study_population.breed,
        age_group: extractedArgs.study_population.age_group,
        sample_size: extractedArgs.study_population.sample_size,
        weight_range: (extractedArgs.study_population.weight_range_min || extractedArgs.study_population.weight_range_max) ? {
          min: extractedArgs.study_population.weight_range_min,
          max: extractedArgs.study_population.weight_range_max,
          unit: 'kg'
        } : undefined,
        health_status: extractedArgs.study_population.health_status
      } : undefined,
      // ✅ NEW: Structured dosages
      structured_dosages: (extractedArgs.structured_dosages || []).map((d: any) => ({
        compound: d.compound,
        amount: d.amount,
        unit: d.unit,
        frequency: d.frequency || 'daily',
        per_body_weight: d.per_body_weight || false,
        duration_days: d.duration_days,
        route: d.route || 'oral'
      })),
      // ✅ NEW: Biomarkers
      biomarkers: (extractedArgs.biomarkers || []).map((b: any) => ({
        name: b.name,
        baseline_value: b.baseline_value,
        final_value: b.final_value,
        change_percent: b.change_percent,
        unit: b.unit,
        p_value: b.p_value,
        significance: b.significance || 'not_significant'
      })),
      nutraceuticals: (extractedArgs.nutraceuticals || []).map((n: any) => ({
        name: n.name,
        dosage: n.dosage || '',
        effects: n.effects,
        efficacy_score: n.efficacy_score,
        species_tested: n.species_tested || []
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
        severity: c.severity,
        species_specific: c.species_specific
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
        frequency: s.frequency,
        dose_related: s.dose_related,
        confidence: s.confidence || 0.8
      })),
      // ✅ NEW: Contraindications
      contraindications: (extractedArgs.contraindications || []).map((c: any) => ({
        condition: c.condition,
        reason: c.reason,
        severity: c.severity || 'caution',
        evidence_level: c.evidence_level
      })),
      // ✅ NEW: Drug interactions
      drug_interactions: (extractedArgs.drug_interactions || []).map((d: any) => ({
        compound: d.compound,
        interaction_type: d.interaction_type,
        effect: d.effect,
        severity: d.severity,
        mechanism: d.mechanism
      })),
      // ✅ NEW: Synergies
      synergies: (extractedArgs.synergies || []).map((s: any) => ({
        compounds: s.compounds || [],
        enhanced_effect: s.enhanced_effect,
        mechanism: s.mechanism,
        optimal_ratio: s.optimal_ratio
      })),
      // ✅ NEW: Study assessment scores from LLM
      study_assessment: extractedArgs.study_assessment ? {
        methodology_type: extractedArgs.study_assessment.methodology_type,
        sample_size: extractedArgs.study_assessment.sample_size,
        randomization: extractedArgs.study_assessment.randomization,
        blinding: extractedArgs.study_assessment.blinding,
        placebo_controlled: extractedArgs.study_assessment.placebo_controlled,
        statistical_significance: extractedArgs.study_assessment.statistical_significance,
        follow_up_duration: extractedArgs.study_assessment.follow_up_duration,
        species_tested: extractedArgs.study_assessment.species_tested,
        quality_score: extractedArgs.study_assessment.quality_score,
        relevance_score: extractedArgs.study_assessment.relevance_score,
        novelty_score: extractedArgs.study_assessment.novelty_score,
      } : undefined,
      // ✅ NEW: Study summary from LLM
      study_summary: extractedArgs.study_summary ? {
        objective: extractedArgs.study_summary.objective,
        key_findings: extractedArgs.study_summary.key_findings,
        clinical_implications: extractedArgs.study_summary.clinical_implications,
        limitations: extractedArgs.study_summary.limitations,
      } : undefined,
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
  
  const systemPrompt = `You are an expert in extracting data from scientific studies about nutraceuticals and health.

⚠️ CRITICAL ANTI-CONTAMINATION RULES:
1. ONLY extract compounds and conditions that are EXPLICITLY MENTIONED in THIS specific PDF document
2. NEVER use format examples as actual data to extract
3. If a compound is not mentioned in the document, DO NOT include it
4. The examples shown below are FORMAT templates only - they are NOT data to be extracted

TASK:
1. **Basic Metadata**: Extract complete title, all listed authors, publication year, journal name, abstract, DOI (if available)

2. **Nutraceuticals/Compounds**: List ONLY substances, compounds, supplements or active ingredients EXPLICITLY MENTIONED in this study. For each one, extract:
   - Scientific or common name (in English)
   - Dosage/amount used (with units)
   - Effects/results observed in the study

3. **Health Conditions**: List ONLY diseases, medical conditions or health problems EXPLICITLY MENTIONED. For each condition:
   - Condition name (in English)
   - Relationship type: "treatment", "prevention", or "support"
   - Observed efficacy description

CRITICAL INSTRUCTIONS:
- Read the COMPLETE PDF, not just the abstract
- ONLY include compounds and conditions that appear in the document text
- DO NOT invent or assume data that is not explicitly written
- If a field is not found, use empty string ("") or null
- NEVER include example compounds (from these instructions) in your response`;


  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
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

  // Parse & validate request synchronously, then offload the long pipeline
  // to a background task to avoid the 150s edge IDLE_TIMEOUT.
  let fileUrl: string, studyId: string, fileName: string;
  try {
    const body = await req.json();
    fileUrl = body.fileUrl;
    studyId = body.studyId;
    fileName = body.fileName;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!fileUrl || !studyId || !fileName) {
    return new Response(
      JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: fileUrl, studyId, fileName' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Heavy pipeline runs in background; client polls processed_studies via realtime.
  const pipeline = (async () => {
    try {
      console.log('🚀 Iniciando processamento com Google Gemini File API (background)');
      console.log('📋 Parâmetros:', { studyId, fileName, fileUrl });

      await runGeminiPipeline({ fileUrl, studyId, fileName });
    } catch (error) {
      console.error('💥 ERRO FATAL NO PROCESSAMENTO (background):', error);
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        // Read existing stages to merge file_search:failed without losing parse_study.
        const { data: row } = await supabase
          .from('processed_studies')
          .select('ingestion_stages')
          .eq('id', studyId)
          .maybeSingle();
        const merged = {
          ...((row?.ingestion_stages as Record<string, unknown>) || {}),
          file_search: {
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
            stage: 'pipeline',
            finished_at: new Date().toISOString(),
          },
        };
        await supabase
          .from('processed_studies')
          .update({
            kanban_status: 'error',
            processing_error: error instanceof Error ? error.message : String(error),
            ingestion_stages: merged,
          })
          .eq('id', studyId);
      } catch (e) {
        console.error('Failed to record error on processed_studies:', e);
      }
    }
  })();

  // @ts-ignore — EdgeRuntime is provided by Supabase Edge runtime
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(pipeline);
  }

  return new Response(
    JSON.stringify({
      success: true,
      status: 'processing',
      message: 'Pipeline iniciado em background. Acompanhe via realtime em processed_studies.',
      studyId,
    }),
    { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

// ============================================================
// Pipeline original (extraído do handler para rodar em background)
// ============================================================
async function runGeminiPipeline({ fileUrl, studyId, fileName }: { fileUrl: string; studyId: string; fileName: string }) {
  try {
    
    console.log('📋 Parâmetros recebidos:');
    console.log('  - studyId:', studyId);
    console.log('  - fileName:', fileName);
    console.log('  - fileUrl:', fileUrl);

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
      throw new Error('Google Gemini API Key não configurada (ai_configurations.google_gemini_api_key)');
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

    // ============================================================
    // CALL 1 (post-Call-2): dedicated full_text acquisition
    // ------------------------------------------------------------
    // Runs AFTER the legacy extractWithFileSearch (Call 2). Uses a
    // separate model + minimal schema so full_text is not starved by
    // the 22 clinical properties. If Call 1 returns a longer/richer
    // text than Call 2, we override extractedData.full_text — this is
    // the surgical fix for the monolithic-call truncation root cause.
    // ============================================================
    console.log('🧾 CALL 1: acquireFullText (gemini-2.5-flash, minimal schema)...');
    const call1 = await acquireFullText(uploadedFile.uri, GOOGLE_GEMINI_KEY);
    const call2Text = (extractedData.full_text || '').trim();
    const call1Text = (call1.text || '').trim();
    if (call1Text.length > call2Text.length) {
      console.log(`✅ Override full_text from Call 1 (${call1Text.length} chars vs Call 2 ${call2Text.length})`);
      extractedData.full_text = call1Text;
    } else if (call1.error) {
      console.warn(`⚠️ Call 1 failed (${call1.error}); keeping Call 2 full_text (${call2Text.length} chars)`);
    } else {
      console.log(`ℹ️ Call 2 full_text (${call2Text.length}) >= Call 1 (${call1Text.length}); keeping Call 2`);
    }
    
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
          // ✅ EXPLICIT: Add study_population and structured_dosages with clear keys
          study_population: extractedData.study_population || null,
          structured_dosages: extractedData.structured_dosages || [],
          biomarkers: extractedData.biomarkers || [],
          // ✅ EXPLICIT: Also add dosages array for backward compatibility
          dosages: (extractedData.structured_dosages || []).map(d => ({
            compound: d.compound,
            dose: `${d.amount} ${d.unit}${d.per_body_weight ? '/kg' : ''}`,
            frequency: d.frequency || 'daily',
            duration: d.duration_days ? `${d.duration_days} days` : undefined,
            route: d.route || 'oral'
          })),
          // Adicionar aliases para compatibilidade com componentes existentes
          // ✅ PHASE 2: Enhanced with descriptions and ontology links
          extractedNutraceuticals: extractedData.nutraceuticals.map(n => ({
            name: n.name,
            description: n.description || null,
            canonical_id: n.canonical_id || `NUT_${n.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            category: n.category || 'other',
            synonyms: n.synonyms || [],
            confidence: n.efficacy_score || 0.5
          })),
          extractedMechanisms: extractedData.mechanisms.map(m => ({
            name: m.name,
            description: m.description || null,
            canonical_id: m.canonical_id || `MECH_${m.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            type: m.type,
            action_type: m.action_type || 'modulation',
            molecular_target: m.molecular_target || null,
            confidence: m.confidence || 0.5
          })),
          extractedEffects: extractedData.biological_effects.map(e => ({
            name: e.name,
            description: e.description || null,
            canonical_id: e.canonical_id || `EFF_${e.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            type: e.type,
            effect_category: e.effect_category || 'other',
            duration: e.duration || null,
            confidence: e.confidence || 0.5
          })),
          extractedConditions: extractedData.conditions.map(c => ({
            name: c.name,
            description: c.description || null,
            canonical_id: c.canonical_id || `COND_${c.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            category: c.category || 'other',
            relationship_type: c.relationship_type,
            confidence: c.treatability_score || 0.5
          })),
          extractedInteractions: extractedData.interactions,
          extractedSideEffects: extractedData.side_effects,
          // ✅ NEW: Add expanded data with clear keys
          extractedContraindications: extractedData.contraindications || [],
          extractedDrugInteractions: extractedData.drug_interactions || [],
          extractedSynergies: extractedData.synergies || [],
          // ✅ NEW: Study assessment scores - explicit keys for frontend
          studyAssessment: extractedData.study_assessment || {},
          study_assessment: extractedData.study_assessment || {},
          studySummary: extractedData.study_summary || {},
          study_summary: extractedData.study_summary || {},
          qualityScore: extractedData.study_assessment?.quality_score || 0,
          relevanceScore: extractedData.study_assessment?.relevance_score || 0,
          noveltyScore: extractedData.study_assessment?.novelty_score || 0,
          // ✅ Metadata summary for quick reference
          extraction_summary: {
            total_nutraceuticals: extractedData.nutraceuticals.length,
            total_mechanisms: extractedData.mechanisms.length,
            total_effects: extractedData.biological_effects.length,
            total_conditions: extractedData.conditions.length,
            total_interactions: extractedData.interactions.length,
            total_side_effects: extractedData.side_effects.length,
            total_contraindications: extractedData.contraindications?.length || 0,
            total_drug_interactions: extractedData.drug_interactions?.length || 0,
            total_synergies: extractedData.synergies?.length || 0,
            total_dosages: extractedData.structured_dosages?.length || 0,
            total_biomarkers: extractedData.biomarkers?.length || 0,
            has_population_data: !!extractedData.study_population,
            species: extractedData.study_population?.species || 'unknown',
            extracted_at: new Date().toISOString()
          }
        };
        
        console.log('💾 Salvando com RAG support...');
        console.log(`   - full_text_content: ${fullTextContent.length} chars`);
        console.log(`   - word_count: ${fullTextMetadata.word_count}`);
        console.log(`   - structured_dosages: ${extractedData.structured_dosages?.length || 0}`);
        console.log(`   - study_population: ${extractedData.study_population?.species || 'N/A'}`);
        
        // ============================================================
        // GATE QUALITATIVO — file_search stage telemetry
        // ------------------------------------------------------------
        // - failed: handled in outer catch / Call 1 only-empty path below
        // - degraded:
        //     (a) entities_empty — all key categories empty
        //     (b) truncation_suspected — chars_full_text / parse_total < 0.30
        //         AND parse_study.sections_count >= 3 (RELATIVE, never absolute floor)
        // - ok: full_text present AND at least one key entity category populated
        // chars + truncation_ratio are INFORMATIVE only, never triggers.
        // ============================================================
        // Read parse_study stage to compute relative truncation ratio.
        let parseSectionsCount: number | null = null;
        let parseTotalChars: number | null = null;
        try {
          const { data: stageRow } = await supabase
            .from('processed_studies')
            .select('ingestion_stages')
            .eq('id', studyId)
            .maybeSingle();
          const parseStage = (stageRow?.ingestion_stages as any)?.parse_study;
          if (parseStage) {
            parseSectionsCount = typeof parseStage.sections_count === 'number' ? parseStage.sections_count : null;
            parseTotalChars = typeof parseStage.total_chars === 'number' ? parseStage.total_chars : null;
          }
        } catch (e) {
          console.warn('⚠️ Could not read parse_study stage for truncation_ratio:', e);
        }

        const gateDecision = decideFileSearchGate({
          fullTextLength: fullTextContent?.length || 0,
          entities: {
            nutraceuticals: extractedData.nutraceuticals,
            conditions: extractedData.conditions,
            mechanisms: extractedData.mechanisms,
            biological_effects: extractedData.biological_effects,
          },
          parseTotalChars,
          parseSectionsCount,
        });
        const fileSearchStatus = gateDecision.status;
        const fileSearchReason = gateDecision.reason;
        const truncationRatio = gateDecision.truncationRatio;

        const fileSearchStageEntry = {
          status: fileSearchStatus,
          ...(fileSearchReason ? { reason: fileSearchReason } : {}),
          chars: fullTextContent.length,
          truncation_ratio: truncationRatio,
          sections_count_ref: parseSectionsCount,
          extraction_method: extractionMethod,
          model_call1: 'gemini-2.5-flash',
          model_call2: 'gemini-3-pro-preview',
          entities_counts: {
            nutraceuticals: extractedData.nutraceuticals?.length || 0,
            conditions: extractedData.conditions?.length || 0,
            mechanisms: extractedData.mechanisms?.length || 0,
            biological_effects: extractedData.biological_effects?.length || 0,
          },
          finished_at: new Date().toISOString(),
        };

        // Read existing ingestion_stages and merge file_search key.
        const { data: existingStagesRow } = await supabase
          .from('processed_studies')
          .select('ingestion_stages')
          .eq('id', studyId)
          .maybeSingle();
        const mergedStages = {
          ...((existingStagesRow?.ingestion_stages as Record<string, unknown>) || {}),
          file_search: fileSearchStageEntry,
        };
        console.log(`🚦 file_search gate: ${fileSearchStatus}${fileSearchReason ? ` (${fileSearchReason})` : ''}, ratio=${truncationRatio}`);

        // ✅ STEP 1: Save to processed_studies
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
            ingestion_stages: mergedStages,
            updated_at: new Date().toISOString()
          })
          .eq('id', studyId);
        
        if (result.error) throw result.error;
        
        // ✅ STEP 2: Upsert to study_extractions for Stage 3 data
        console.log('💾 Salvando em study_extractions para Stage 3...');
        const extractionData = {
          // Core nutraceutical data with dosages
          nutraceuticals: extractedData.nutraceuticals.map(n => ({
            ...n,
            dosage: n.dosage,
            species_tested: n.species_tested || [extractedData.study_population?.species || 'unknown']
          })),
          // ✅ CRITICAL: Structured dosages for precise tracking
          structured_dosages: extractedData.structured_dosages || [],
          dosages: (extractedData.structured_dosages || []).map(d => ({
            compound: d.compound,
            amount: d.amount,
            unit: d.unit,
            dose_string: `${d.amount} ${d.unit}${d.per_body_weight ? '/kg' : ''}/${d.frequency || 'day'}`,
            frequency: d.frequency,
            per_body_weight: d.per_body_weight,
            duration_days: d.duration_days,
            route: d.route
          })),
          // ✅ CRITICAL: Study population metadata
          study_population: extractedData.study_population || null,
          // Biomarkers with statistical data
          biomarkers: extractedData.biomarkers || [],
          // Health conditions
          conditions: extractedData.conditions,
          // Mechanisms and effects
          mechanisms: extractedData.mechanisms,
          biological_effects: extractedData.biological_effects,
          // Interactions chain
          interactions: extractedData.interactions,
          // Safety data
          side_effects: extractedData.side_effects,
          contraindications: extractedData.contraindications || [],
          drug_interactions: extractedData.drug_interactions || [],
          synergies: extractedData.synergies || [],
          // ✅ NEW: Study assessment and summary for study_extractions
          study_assessment: extractedData.study_assessment || {},
          study_summary: extractedData.study_summary || {},
          // Clinical outcomes for chat context
          clinical_outcomes: extractedData.conditions.map(c => ({
            condition: c.name,
            relationship: c.relationship_type,
            efficacy: c.efficacy_description,
            treatability_score: c.treatability_score
          })),
          // Metadata
          extraction_version: '3.0',
          extracted_at: new Date().toISOString()
        };
        
        const { error: extractionError } = await supabase
          .from('study_extractions')
          .upsert({
            study_id: studyId,
            extracted_data: extractionData as any,
            extraction_status: 'completed',
            extraction_quality_score: Math.round(
              (extractedData.nutraceuticals.length > 0 ? 25 : 0) +
              ((extractedData.structured_dosages?.length ?? 0) > 0 ? 25 : 0) +
              (extractedData.study_population ? 25 : 0) +
              (extractedData.conditions.length > 0 ? 25 : 0)
            ),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'study_id'
          });
        
        if (extractionError) {
          console.warn('⚠️ Falha ao salvar em study_extractions (não crítico):', extractionError);
        } else {
          console.log('✅ Dados salvos em study_extractions com sucesso');
          console.log(`   - dosages: ${extractionData.dosages.length}`);
          console.log(`   - species: ${extractionData.study_population?.species || 'N/A'}`);
        }
        
        // ✅ STEP 3: PHASE 2 - Link to veterinary_ontology and auto-create new entities
        console.log('🧬 PHASE 2: Linking entities to veterinary_ontology...');
        
        // Collect all extracted entities with their canonical IDs
        const entitiesToLink = [
          ...extractedData.nutraceuticals.map(n => ({
            entity_id: n.canonical_id || `NUT_${n.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            entity_name: n.name,
            entity_type: 'compound',
            canonical_name: n.name,
            description: n.description || `Nutraceutical compound: ${n.name}`,
            layer: 'layer_0_compound',
            synonyms: n.synonyms || [],
            properties: { category: n.category, efficacy_score: n.efficacy_score }
          })),
          ...extractedData.mechanisms.map(m => ({
            entity_id: m.canonical_id || `MECH_${m.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            entity_name: m.name,
            entity_type: 'mechanism',
            canonical_name: m.name,
            description: m.description || `Molecular mechanism: ${m.name}`,
            layer: 'layer_2_mechanism',
            synonyms: [],
            properties: { type: m.type, action_type: m.action_type, molecular_target: m.molecular_target }
          })),
          ...extractedData.biological_effects.map(e => ({
            entity_id: e.canonical_id || `EFF_${e.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            entity_name: e.name,
            entity_type: 'effect',
            canonical_name: e.name,
            description: e.description || `Biological effect: ${e.name}`,
            layer: 'layer_3_effect',
            synonyms: [],
            properties: { type: e.type, effect_category: e.effect_category, duration: e.duration }
          })),
          ...extractedData.conditions.map(c => ({
            entity_id: c.canonical_id || `COND_${c.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}`,
            entity_name: c.name,
            entity_type: 'condition',
            canonical_name: c.name,
            description: c.description || `Health condition: ${c.name}`,
            layer: 'layer_4_outcome',
            synonyms: [],
            properties: { category: c.category, severity: c.severity, relationship_type: c.relationship_type }
          }))
        ];
        
        // Upsert entities to veterinary_ontology (auto-expand the ontology)
        let linkedCount = 0;
        console.log(`📊 Attempting to link ${entitiesToLink.length} entities to ontology...`);
        
        for (const entity of entitiesToLink) {
          console.log(`  → Upserting: ${entity.entity_id} (${entity.entity_type})`);
          
          const { data: upsertData, error: ontologyError } = await supabase
            .from('veterinary_ontology')
            .upsert({
              entity_id: entity.entity_id,
              entity_name: entity.entity_name,
              entity_name_en: entity.entity_name,
              entity_type: entity.entity_type,
              canonical_name: entity.canonical_name,
              description: entity.description,
              description_en: entity.description,
              layer: entity.layer,
              synonyms: entity.synonyms,
              properties: entity.properties,
              source: 'gemini_extraction'
            }, {
              onConflict: 'entity_id',
              ignoreDuplicates: false // Update if exists
            })
            .select();
          
          if (ontologyError) {
            console.error(`  ❌ Error upserting ${entity.entity_id}:`, ontologyError.message);
          } else {
            linkedCount++;
            console.log(`  ✅ Upserted: ${entity.entity_id}`);
          }
        }
        
        console.log(`✅ PHASE 2 Complete: ${linkedCount}/${entitiesToLink.length} entities linked to ontology`);
        
        // ✅ STEP 4: PHASE 3 - Generate triplet_extractions from interactions
        console.log('🔗 PHASE 3: Generating triplet_extractions from interactions...');
        
        // Map interaction types to predicate format
        const interactionToPredicateMap: Record<string, string> = {
          'inhibition': 'INHIBITS',
          'stimulation': 'ACTIVATES',
          'modulation': 'MODULATES',
          'activation': 'ACTIVATES',
          'suppression': 'INHIBITS',
          'enhancement': 'ENHANCES',
          'reduction': 'REDUCES',
          'binding': 'BINDS_TO',
          'regulation': 'REGULATES'
        };
        
        // =========================================================================
        // ROBUST ENTITY CLASSIFICATION - Based on UMLS/GO biomedical taxonomy
        // =========================================================================
        
        // Dictionaries for accurate classification
        const KNOWN_ENZYMES = new Set([
          'catalase', 'superoxide dismutase', 'sod', 'sod1', 'sod2', 'glutathione peroxidase', 'gpx',
          'cytochrome p450', 'cyp450', 'nadph oxidase', 'nox', 'xanthine oxidase', 'lipoxygenase', 'lox',
          '5-lox', '12-lox', 'cyclooxygenase', 'cox', 'cox-1', 'cox-2', 'glutathione s-transferase', 'gst',
          'kinase', 'phosphatase', 'transaminase', 'alt', 'ast', 'lipase', 'protease', 'amylase',
          'mmp', 'matrix metalloproteinase', 'mmp-2', 'mmp-9', 'mmp-13', 'caspase', 'caspase-1', 'caspase-3',
          'sirtuin', 'sirt1', 'sirt2', 'sirt3', 'parp', 'telomerase', 'acetylcholinesterase', 'ache',
          'hmg-coa reductase', 'aromatase', 'phosphodiesterase', 'pde', 'monoamine oxidase', 'mao',
        ]);
        
        const KNOWN_RECEPTORS = new Set([
          'ppar', 'ppar-α', 'ppar-γ', 'peroxisome proliferator-activated receptor', 'lxr', 'fxr', 'rxr',
          'vdr', 'vitamin d receptor', 'estrogen receptor', 'androgen receptor', 'glucocorticoid receptor',
          'gpcr', 'adrenergic receptor', 'dopamine receptor', 'serotonin receptor', '5-ht', 'histamine receptor',
          'muscarinic receptor', 'nicotinic receptor', 'opioid receptor', 'cannabinoid receptor', 'cb1', 'cb2',
          'trp channel', 'trpv1', 'calcium channel', 'gabaa receptor', 'nmda receptor', 'ampa receptor',
          'egfr', 'vegfr', 'igfr', 'insulin receptor', 'toll-like receptor', 'tlr', 'tlr4', 'nlrp3',
        ]);
        
        const KNOWN_PROTEINS = new Set([
          'nf-κb', 'nf-kappa-b', 'nfkb', 'ap-1', 'nrf2', 'hif-1α', 'stat', 'stat3', 'creb', 'foxo',
          'p53', 'p21', 'myc', 'ampk', 'mtor', 'akt', 'tnf-α', 'tnf-alpha', 'tumor necrosis factor',
          'il-1', 'il-1β', 'interleukin-1', 'il-6', 'interleukin-6', 'il-10', 'ifn-γ', 'interferon-gamma',
          'tgf-β', 'transforming growth factor', 'egf', 'vegf', 'ngf', 'bdnf', 'brain-derived neurotrophic factor',
          'bcl-2', 'bax', 'bak', 'cytochrome c', 'ras', 'raf', 'mek', 'erk', 'mapk', 'jnk', 'p38', 'pi3k',
          'pgc-1α', 'complement', 'c3', 'crp', 'c-reactive protein', 'fibrinogen',
        ]);
        
        const KNOWN_PATHWAYS = new Set([
          'nf-κb pathway', 'nf-kb pathway', 'inflammasome', 'nlrp3 inflammasome', 'mapk pathway',
          'jak-stat pathway', 'arachidonic acid pathway', 'pi3k/akt pathway', 'mtor pathway', 'ampk pathway',
          'wnt pathway', 'notch pathway', 'tgf-β pathway', 'nrf2 pathway', 'autophagy pathway',
          'apoptosis pathway', 'glycolysis', 'oxidative phosphorylation', 'electron transport chain',
          'fatty acid oxidation', 'β-oxidation', 'mevalonate pathway',
        ]);
        
        const KNOWN_PROCESSES = new Set([
          'autophagy', 'mitophagy', 'apoptosis', 'necrosis', 'necroptosis', 'pyroptosis', 'ferroptosis',
          'cell proliferation', 'cell differentiation', 'phagocytosis', 'endocytosis', 'exocytosis',
          'protein synthesis', 'protein folding', 'protein degradation', 'phosphorylation', 'acetylation',
          'cellular senescence', 'senescence', 'replicative senescence', 'telomere shortening', 'dna repair',
          'oxidative stress', 'lipid peroxidation', 'inflammation', 'neuroinflammation', 'cytokine release',
          'glucose metabolism', 'insulin signaling', 'lipid metabolism', 'cholesterol metabolism',
          'ros production', 'antioxidant defense', 'glutathione metabolism', 'neurotransmission',
          'synaptic plasticity', 'neurogenesis', 'angiogenesis', 'vasodilation', 'gene expression',
        ]);
        
        const KNOWN_CONDITIONS = new Set([
          'hypertension', 'heart failure', 'atherosclerosis', 'arrhythmia', 'cardiomyopathy', 'stroke',
          'diabetes', 'insulin resistance', 'obesity', 'metabolic syndrome', 'dyslipidemia', 'nafld',
          'alzheimer', 'dementia', 'parkinson', 'cognitive decline', 'neurodegeneration', 'neuropathy',
          'osteoarthritis', 'arthritis', 'osteoporosis', 'sarcopenia', 'fibromyalgia', 'hip dysplasia',
          'cancer', 'tumor', 'carcinoma', 'lymphoma', 'leukemia', 'inflammatory bowel disease', 'ibd',
          'gastritis', 'hepatitis', 'cirrhosis', 'autoimmune disease', 'lupus', 'psoriasis', 'asthma',
          'chronic kidney disease', 'nephropathy', 'depression', 'anxiety', 'aging', 'frailty',
        ]);
        
        const KNOWN_CELLS = new Set([
          'macrophage', 'monocyte', 'neutrophil', 'lymphocyte', 't cell', 'cd4+ t cell', 'cd8+ t cell',
          'b cell', 'natural killer cell', 'nk cell', 'dendritic cell', 'mast cell', 'eosinophil',
          'neuron', 'astrocyte', 'oligodendrocyte', 'microglia', 'catecholaminergic neurons',
          'dopaminergic neurons', 'epithelial cell', 'endothelial cell', 'fibroblast', 'adipocyte',
          'hepatocyte', 'cardiomyocyte', 'osteoblast', 'osteoclast', 'chondrocyte', 'stem cell',
        ]);
        
        const KNOWN_NUTRACEUTICALS = new Set([
          'curcumin', 'curcumina', 'quercetin', 'resveratrol', 'egcg', 'omega-3', 'dha', 'epa',
          'glucosamine', 'chondroitin', 'msm', 'l-carnitine', 'taurine', 'coenzyme q10', 'coq10',
          'vitamin d', 'vitamin e', 'vitamin c', 'zinc', 'selenium', 'magnesium', 'probiotics',
          'silymarin', 'ginkgo biloba', 'ashwagandha', 'boswellia', 'nmn', 'nad+', 'nr', 'pterostilbene',
          'spermidine', 'fisetin', 'alpha lipoic acid', 'melatonin', 'collagen', 'berberine',
          'spirulina', 'chlorella', 'astaxanthin', 'lutein', 'lycopene', 'pqq',
        ]);
        
        // Helper function to determine entity type and layer with ROBUST classification
        const getEntityTypeAndLayer = (entityName: string): { type: string; layer: string } => {
          const normalized = entityName.toLowerCase().trim();
          
          // 1. Check explicit nutraceuticals from extraction
          const matchedNut = extractedData.nutraceuticals.find(n => 
            n.name.toLowerCase() === normalized
          );
          if (matchedNut) return { type: 'Nutraceutical', layer: 'layer_0_compound' };
          
          // 2. Dictionary-based classification (HIGH CONFIDENCE)
          if (KNOWN_NUTRACEUTICALS.has(normalized)) return { type: 'Nutraceutical', layer: 'layer_0_compound' };
          if (KNOWN_ENZYMES.has(normalized)) return { type: 'Enzyme', layer: 'layer_1_target' };
          if (KNOWN_RECEPTORS.has(normalized)) return { type: 'Receptor', layer: 'layer_1_target' };
          if (KNOWN_PROTEINS.has(normalized)) return { type: 'GeneProtein', layer: 'layer_1_target' };
          if (KNOWN_PATHWAYS.has(normalized)) return { type: 'Pathway', layer: 'layer_1_target' };
          if (KNOWN_PROCESSES.has(normalized)) return { type: 'BiologicalProcess', layer: 'layer_3_effect' };
          if (KNOWN_CONDITIONS.has(normalized)) return { type: 'Condition', layer: 'layer_4_outcome' };
          if (KNOWN_CELLS.has(normalized)) return { type: 'Cell', layer: 'context' };
          
          // 3. Pattern-based classification
          // Enzyme patterns
          if (/-ase$/.test(normalized) || /kinase|phosphatase|synthase|oxidase|reductase/i.test(normalized)) {
            return { type: 'Enzyme', layer: 'layer_1_target' };
          }
          // Receptor patterns
          if (/receptor|channel|\-r$/i.test(normalized)) {
            return { type: 'Receptor', layer: 'layer_1_target' };
          }
          // Interleukin/Cytokine patterns
          if (/^il-?\d+|interleukin|cytokine|interferon|tnf/i.test(normalized)) {
            return { type: 'Cytokine', layer: 'layer_1_target' };
          }
          // Pathway patterns
          if (/pathway|signaling|cascade/i.test(normalized)) {
            return { type: 'Pathway', layer: 'layer_1_target' };
          }
          // Biological process patterns
          if (/ation$|osis$|genesis$|lysis$|metabolism|response|regulation|activation|inhibition/i.test(normalized)) {
            return { type: 'BiologicalProcess', layer: 'layer_3_effect' };
          }
          // Disease/Condition patterns
          if (/disease|disorder|syndrome|deficiency|dysfunction|failure|itis$|emia$|pathy$/i.test(normalized)) {
            return { type: 'Condition', layer: 'layer_4_outcome' };
          }
          // Cell patterns
          if (/cell|cyte$|blast$|clast$/i.test(normalized)) {
            return { type: 'Cell', layer: 'context' };
          }
          // Protein/Gene patterns
          if (/^[A-Z]{2,5}\d?$/i.test(entityName) || /protein|factor/i.test(normalized)) {
            return { type: 'GeneProtein', layer: 'layer_1_target' };
          }
          
          // 4. Check extraction context (from other arrays)
          const matchedMech = extractedData.mechanisms.find(m => 
            m.name.toLowerCase() === normalized
          );
          if (matchedMech) return { type: 'Mechanism', layer: 'layer_2_mechanism' };
          
          const matchedEff = extractedData.biological_effects.find(e => 
            e.name.toLowerCase() === normalized
          );
          if (matchedEff) return { type: 'BiologicalProcess', layer: 'layer_3_effect' };
          
          const matchedCond = extractedData.conditions.find(c => 
            c.name.toLowerCase() === normalized
          );
          if (matchedCond) return { type: 'Condition', layer: 'layer_4_outcome' };
          
          // 5. Default to Entity (NOT Nutraceutical!) - requires manual curation
          console.warn(`⚠️ Unknown entity type for: "${entityName}" - defaulting to Entity`);
          return { type: 'Entity', layer: 'unknown' };
        };
        
        // Helper to clamp confidence between 0 and 1
        const clampConfidence = (val: number | undefined | null): number => {
          if (val === undefined || val === null) return 0.5;
          return Math.max(0, Math.min(1, val));
        };
        
        // Generate triplets from interactions
        const tripletsToInsert = [];
        const speciesContext = extractedData.study_population?.species 
          ? [extractedData.study_population.species] 
          : [];
        
        // 1. From interactions array
        for (const interaction of extractedData.interactions) {
          const subjectInfo = getEntityTypeAndLayer(interaction.from);
          const objectInfo = getEntityTypeAndLayer(interaction.to);
          const predicate = interactionToPredicateMap[interaction.type.toLowerCase()] || interaction.type.toUpperCase();
          
          tripletsToInsert.push({
            study_id: studyId,
            subject_name: interaction.from,
            subject_type: subjectInfo.type,
            subject_layer: subjectInfo.layer,
            predicate: predicate,
            object_name: interaction.to,
            object_type: objectInfo.type,
            object_layer: objectInfo.layer,
            extraction_confidence: clampConfidence(interaction.confidence),
            llm_confidence: clampConfidence(interaction.confidence),
            species_context: speciesContext,
            curation_status: 'pending',
            hallucination_flag: false
          });
        }
        
        // 2. From nutraceutical-condition relationships
        for (const nutraceutical of extractedData.nutraceuticals) {
          for (const condition of extractedData.conditions) {
            // Map relationship types to predicates
            const relationshipMap: Record<string, string> = {
              'treatment': 'TREATS',
              'prevention': 'PREVENTS',
              'support': 'SUPPORTS',
              'management': 'MANAGES',
              'amelioration': 'AMELIORATES'
            };
            
            const predicate = relationshipMap[condition.relationship_type?.toLowerCase()] || 'TREATS';
            
            tripletsToInsert.push({
              study_id: studyId,
              subject_name: nutraceutical.name,
              subject_type: 'Nutraceutical',
              subject_layer: 'layer_0_compound',
              predicate: predicate,
              object_name: condition.name,
              object_type: 'Condition',
              object_layer: 'layer_4_outcome',
              extraction_confidence: clampConfidence(condition.treatability_score),
              llm_confidence: clampConfidence(nutraceutical.efficacy_score),
              species_context: speciesContext,
              curation_status: 'pending',
              hallucination_flag: false,
              relationship_category: condition.relationship_type || 'treatment'
            });
          }
        }
        
        // 3. From drug interactions (for contraindications)
        for (const drugInt of (extractedData.drug_interactions || [])) {
          const severityToConfidence: Record<string, number> = {
            'dangerous': 0.95,
            'avoid': 0.85,
            'caution': 0.7,
            'neutral': 0.5,
            'beneficial': 0.8
          };
          
          const interactionTypeMap: Record<string, string> = {
            'synergy': 'SYNERGIZES_WITH',
            'antagonism': 'ANTAGONIZES',
            'potentiation': 'POTENTIATES',
            'inhibition': 'INHIBITS',
            'enhancement': 'ENHANCES_BIOAVAILABILITY',
            'reduction': 'REDUCES_BIOAVAILABILITY'
          };
          
          // Find the nutraceutical this interaction is related to
          const relatedNut = extractedData.nutraceuticals[0]?.name || 'Unknown compound';
          
          tripletsToInsert.push({
            study_id: studyId,
            subject_name: relatedNut,
            subject_type: 'Nutraceutical',
            subject_layer: 'layer_0_compound',
            predicate: interactionTypeMap[drugInt.interaction_type] || 'INTERACTS_WITH',
            object_name: drugInt.compound,
            object_type: 'Compound',
            object_layer: 'layer_0_compound',
            extraction_confidence: clampConfidence(severityToConfidence[drugInt.severity]),
            llm_confidence: clampConfidence(0.8),
            species_context: speciesContext,
            curation_status: 'pending',
            hallucination_flag: false,
            relationship_category: 'drug_interaction'
          });
        }
        
        // 4. From synergies
        for (const synergy of (extractedData.synergies || [])) {
          if (synergy.compounds.length >= 2) {
            tripletsToInsert.push({
              study_id: studyId,
              subject_name: synergy.compounds[0],
              subject_type: 'Nutraceutical',
              subject_layer: 'layer_0_compound',
              predicate: 'SYNERGIZES_WITH',
              object_name: synergy.compounds[1],
              object_type: 'Nutraceutical',
              object_layer: 'layer_0_compound',
              extraction_confidence: clampConfidence(0.75),
              llm_confidence: clampConfidence(0.75),
              species_context: speciesContext,
              curation_status: 'pending',
              hallucination_flag: false,
              synergy_data: {
                enhanced_effect: synergy.enhanced_effect,
                mechanism: synergy.mechanism,
                optimal_ratio: synergy.optimal_ratio
              }
            });
          }
        }
        
        // 5. From contraindications
        for (const contraind of (extractedData.contraindications || [])) {
          const relatedNut = extractedData.nutraceuticals[0]?.name || 'Unknown compound';
          const severityConfidence: Record<string, number> = {
            'absolute': 0.95,
            'relative': 0.75,
            'caution': 0.6
          };
          
          tripletsToInsert.push({
            study_id: studyId,
            subject_name: relatedNut,
            subject_type: 'Nutraceutical',
            subject_layer: 'layer_0_compound',
            predicate: 'CONTRAINDICATED_FOR',
            object_name: contraind.condition,
            object_type: 'Condition',
            object_layer: 'layer_4_outcome',
            extraction_confidence: clampConfidence(severityConfidence[contraind.severity]),
            llm_confidence: clampConfidence(0.8),
            species_context: speciesContext,
            curation_status: 'pending',
            hallucination_flag: false,
            relationship_category: 'contraindication'
          });
        }
        
        // Insert all triplets
        console.log(`📊 Inserting ${tripletsToInsert.length} triplets into triplet_extractions...`);
        let insertedTriplets = 0;
        
        for (const triplet of tripletsToInsert) {
          const { error: tripletError } = await supabase
            .from('triplet_extractions')
            .insert(triplet);
          
          if (tripletError) {
            console.warn(`  ⚠️ Error inserting triplet ${triplet.subject_name}->${triplet.object_name}:`, tripletError.message);
          } else {
            insertedTriplets++;
          }
        }
        
        console.log(`✅ PHASE 3 Complete: ${insertedTriplets}/${tripletsToInsert.length} triplets created`);
        
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
        model: 'gemini-3-pro-preview',
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

    console.log('🏁 Pipeline finalizado com sucesso para studyId:', studyId, 'em', (duration / 1000).toFixed(1), 's');
    return;

  } catch (error) {
    console.error('💥 ============================================');
    console.error('💥 ERRO FATAL NO PROCESSAMENTO');
    console.error('💥 ============================================');
    console.error('❌ Tipo:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('💥 ============================================');
    // Re-throw so the outer background wrapper records error on processed_studies
    throw error;
  }
}
