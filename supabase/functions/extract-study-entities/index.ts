import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId } = await req.json();
    
    if (!studyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: studyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'Lovable API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get parsed study content
    console.log(`🔍 Buscando estudo com ID: ${studyId}`);
    const { data: studyData, error: studyError } = await supabase
      .from('processed_studies')
      .select('analysis_data, title, study_id')
      .eq('id', studyId)
      .maybeSingle();
    
    if (studyError || !studyData || !studyData.analysis_data) {
      console.error(`❌ Estudo não encontrado ou sem dados`);
      return new Response(
        JSON.stringify({ error: 'Study not found or not parsed yet', studyId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Estudo encontrado: ${studyData.title || 'sem título'}`);

    const parsedContent = studyData.analysis_data;
    const textContent = extractTextContent(parsedContent);
    
    if (!textContent || textContent.trim().length < 100) {
      console.error('❌ Texto insuficiente extraído');
      return new Response(
        JSON.stringify({ error: 'Insufficient text extracted', studyId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ ${textContent.length} chars de texto pronto para extração em 3 stages`);
    
    // Buscar prompts configuráveis do banco
    console.log('🔍 Buscando prompts de extração configuráveis...');
    const { data: promptConfigs } = await supabase
      .from('ai_configurations')
      .select('config_key, config_value')
      .like('config_key', 'prompt_extraction%');
    
    const prompts = {
      stage1System: promptConfigs?.find(p => p.config_key === 'prompt_extraction_stage1_system')?.config_value as string || getDefaultStage1SystemPrompt(),
      stage1User: promptConfigs?.find(p => p.config_key === 'prompt_extraction_stage1_user')?.config_value as string || getDefaultStage1UserPrompt(),
      stage2System: promptConfigs?.find(p => p.config_key === 'prompt_extraction_stage2_system')?.config_value as string || getDefaultStage2SystemPrompt(),
      stage2User: promptConfigs?.find(p => p.config_key === 'prompt_extraction_stage2_user')?.config_value as string || getDefaultStage2UserPrompt(),
      stage3System: promptConfigs?.find(p => p.config_key === 'prompt_extraction_stage3_system')?.config_value as string || getDefaultStage3SystemPrompt(),
      stage3User: promptConfigs?.find(p => p.config_key === 'prompt_extraction_stage3_user')?.config_value as string || getDefaultStage3UserPrompt(),
    };
    
    console.log('✅ Prompts carregados (configuráveis ou defaults)');

    // ==================== STAGE 1: Basic Entities ====================
    console.log('🔵 [STAGE 1/3] Extraindo entidades básicas (nutracêuticos, condições)...');
    const stage1Result = await callLovableAI(
      prompts.stage1System,
      prompts.stage1User.replace('{{TEXT_CONTENT}}', textContent),
      getStage1Tools()
    );
    
    const stage1Data = stage1Result ? JSON.parse(stage1Result.function.arguments) : { nutraceuticals: [], conditions: [], mechanisms: [], findings: [] };
    console.log(`✅ Stage 1: ${stage1Data.nutraceuticals?.length || 0} nutracêuticos, ${stage1Data.conditions?.length || 0} condições`);

    // ==================== STAGE 2: Molecular Mechanisms ====================
    console.log('🟢 [STAGE 2/3] Extraindo mecanismos moleculares, sinergias e relações...');
    const stage2Result = await callLovableAI(
      prompts.stage2System,
      prompts.stage2User.replace('{{TEXT_CONTENT}}', textContent).replace('{{STAGE1_NUTRACEUTICALS}}', JSON.stringify(stage1Data.nutraceuticals || [])),
      getStage2Tools()
    );
    
    const stage2Data = stage2Result ? JSON.parse(stage2Result.function.arguments) : { molecular_mechanisms: [], synergies: [], hierarchical_relations: [] };
    console.log(`✅ Stage 2: ${stage2Data.molecular_mechanisms?.length || 0} mecanismos, ${stage2Data.synergies?.length || 0} sinergias`);

    // ==================== STAGE 3: Clinical Context ====================
    console.log('🟡 [STAGE 3/3] Extraindo contexto clínico (dosagens, efeitos colaterais)...');
    const stage3Result = await callLovableAI(
      prompts.stage3System,
      prompts.stage3User.replace('{{TEXT_CONTENT}}', textContent).replace('{{STAGE1_NUTRACEUTICALS}}', JSON.stringify(stage1Data.nutraceuticals || [])),
      getStage3Tools()
    );
    
    const stage3Data = stage3Result ? JSON.parse(stage3Result.function.arguments) : { dosages: [], side_effects: [], contraindications: [], clinical_outcomes: [] };
    console.log(`✅ Stage 3: ${stage3Data.dosages?.length || 0} dosagens, ${stage3Data.side_effects?.length || 0} efeitos colaterais`);

    // Combinar dados de todos os stages
    const extractedData = {
      // Stage 1
      nutraceuticals: stage1Data.nutraceuticals || [],
      conditions: stage1Data.conditions || [],
      mechanisms: stage1Data.mechanisms || [],
      findings: stage1Data.findings || [],
      study_quality: stage1Data.study_quality || {},
      
      // Stage 2
      molecular_mechanisms: stage2Data.molecular_mechanisms || [],
      synergies: stage2Data.synergies || [],
      hierarchical_relations: stage2Data.hierarchical_relations || [],
      
      // Stage 3
      dosages: stage3Data.dosages || [],
      side_effects: stage3Data.side_effects || [],
      contraindications: stage3Data.contraindications || [],
      clinical_outcomes: stage3Data.clinical_outcomes || [],
      study_assessment: stage3Data.study_assessment || {},
    };

    // Fallback: usar dados do Gemini se AI retornou vazio
    if (extractedData.nutraceuticals.length === 0 && parsedContent.nutraceuticals?.length > 0) {
      console.log('⚠️ Usando fallback: dados do Gemini File Search');
      extractedData.nutraceuticals = parsedContent.nutraceuticals.map((n: any) => ({
        name: n.name,
        dosage: n.dosage || '',
        efficacy_score: 3
      }));
    }

    if (extractedData.conditions.length === 0 && parsedContent.conditions?.length > 0) {
      extractedData.conditions = parsedContent.conditions.map((c: any) => ({
        name: c.name,
        severity: 'moderate',
        treatability_score: 3
      }));
    }
    
    console.log(`✅ EXTRAÇÃO COMPLETA: 3 stages executados`);
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(extractedData);

    // Save to study_extractions
    console.log(`💾 Salvando extração completa (3 stages)...`);
    const { data: extraction, error: insertError } = await supabase
      .from('study_extractions')
      .upsert({
        study_id: studyId,
        extracted_data: extractedData,
        extraction_status: 'pending_review',
        extraction_quality_score: qualityScore,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Failed to save extraction:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save extraction results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update processed_studies status
    await supabase
      .from('processed_studies')
      .update({ kanban_status: 'processed' })
      .eq('id', studyId);

    // ==================== CRIAR TRIPLETS AUTOMATICAMENTE ====================
    console.log('🔗 Criando triplets para curadoria no Knowledge Graph...');
    const triplets = [];

    // Triplets de nutracêuticos → condições
    for (const nutra of extractedData.nutraceuticals || []) {
      for (const condition of extractedData.conditions || []) {
        triplets.push({
          study_id: studyId,
          subject_name: nutra.name,
          subject_type: 'Nutraceutical',
          predicate: 'TREATS',
          object_name: condition.name,
          object_type: 'Condition',
          extraction_confidence: (nutra.efficacy_score || 3) / 5,
          llm_confidence: (nutra.efficacy_score || 3) / 5,
          kg_match_score: 0.75,
          curation_status: 'pending',
          auto_approved: false,
        });
      }
    }

    // Triplets de nutracêuticos → mecanismos moleculares
    for (const mech of extractedData.molecular_mechanisms || []) {
      if (mech.target) {
        triplets.push({
          study_id: studyId,
          subject_name: mech.target,
          subject_type: 'Nutraceutical',
          predicate: 'HAS_MECHANISM',
          object_name: mech.name,
          object_type: 'Mechanism',
          extraction_confidence: 0.8,
          llm_confidence: 0.8,
          kg_match_score: 0.7,
          curation_status: 'pending',
          auto_approved: false,
        });
      }
    }

    // Triplets de sinergias (nutracêutico ↔ nutracêutico)
    for (const syn of extractedData.synergies || []) {
      triplets.push({
        study_id: studyId,
        subject_name: syn.compound1,
        subject_type: 'Nutraceutical',
        predicate: syn.synergy_type?.toUpperCase().replace('_', ' ') || 'SYNERGIZES_WITH',
        object_name: syn.compound2,
        object_type: 'Nutraceutical',
        extraction_confidence: 0.75,
        llm_confidence: 0.75,
        kg_match_score: 0.65,
        curation_status: 'pending',
        auto_approved: false,
      });
    }

    // Inserir triplets no banco
    if (triplets.length > 0) {
      const { error: tripletError } = await supabase
        .from('triplet_extractions')
        .insert(triplets);
      
      if (tripletError) {
        console.error('⚠️ Erro ao criar triplets:', tripletError);
      } else {
        console.log(`✅ ${triplets.length} triplets criados com sucesso para curadoria`);
      }
    } else {
      console.log('ℹ️ Nenhum triplet para criar (dados insuficientes)');
    }

    // Preparar frontendData com TODOS os stages
    const frontendData = {
      studyId: studyId,
      qualityScore: qualityScore,
      relevanceScore: qualityScore,
      
      // Stage 1
      extractedNutraceuticals: (extractedData.nutraceuticals || []).map((n: any) => ({
        name: n.name || 'Unknown',
        confidence: n.efficacy_score ?? 3
      })),
      extractedConditions: (extractedData.conditions || []).map((c: any) => ({
        name: c.name || 'Unknown',
        confidence: c.treatability_score ?? 3
      })),
      extractedInteractions: (extractedData.mechanisms || []).map((m: any) => ({
        nutraceutical: m.nutraceutical || 'Unknown',
        interaction: m.mechanism || 'Unknown mechanism',
        confidence: 3
      })),
      extractedSideEffects: [],
      nutraceuticals: (extractedData.nutraceuticals || []).map((n: any) => ({
        name: n.name,
        dosage: n.dosage || '',
        relevance: n.efficacy_score ?? 3
      })),
      
      // Stage 2
      molecularMechanisms: extractedData.molecular_mechanisms || [],
      synergies: extractedData.synergies || [],
      hierarchicalRelations: extractedData.hierarchical_relations || [],
      
      // Stage 3
      dosages: extractedData.dosages || [],
      detailedSideEffects: extractedData.side_effects || [],
      contraindications: extractedData.contraindications || [],
      clinicalOutcomes: extractedData.clinical_outcomes || [],
      studyAssessment: extractedData.study_assessment || {},
      
      // Metadata
      extractionStages: ['stage1_entities', 'stage2_mechanisms', 'stage3_clinical']
    };
    
    console.log('💾 Atualizando analysis_data com dados dos 3 stages...');
    await supabase
      .from('processed_studies')
      .update({ analysis_data: frontendData })
      .eq('id', studyId);
    
    console.log('✅ analysis_data atualizado com SUCESSO (3 stages)');

    return new Response(
      JSON.stringify({ 
        success: true, 
        studyId,
        extractionId: extraction?.id,
        qualityScore,
        relevanceScore: frontendData.relevanceScore,
        extractedNutraceuticals: frontendData.extractedNutraceuticals,
        extractedConditions: frontendData.extractedConditions,
        extractedInteractions: frontendData.extractedInteractions,
        extractedSideEffects: frontendData.extractedSideEffects,
        // Stage 2
        molecularMechanisms: frontendData.molecularMechanisms,
        synergies: frontendData.synergies,
        // Stage 3
        dosages: frontendData.dosages,
        detailedSideEffects: frontendData.detailedSideEffects,
        clinicalOutcomes: frontendData.clinicalOutcomes,
        extractionStages: frontendData.extractionStages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in extract-study-entities:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Call Lovable AI Gateway
async function callLovableAI(systemPrompt: string, userPrompt: string, tools: any[]) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-pro-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools,
      tool_choice: { type: 'function', function: { name: tools[0].function.name } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    throw new Error(`AI extraction failed: ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.tool_calls?.[0] || null;
}

// Helper: Extract text from parsed content
function extractTextContent(parsedContent: any): string {
  if (parsedContent.full_text && typeof parsedContent.full_text === 'string') {
    return parsedContent.full_text;
  }
  
  if (parsedContent.abstract && typeof parsedContent.abstract === 'string') {
    return parsedContent.abstract;
  }
  
  if (Array.isArray(parsedContent.elements)) {
    return parsedContent.elements
      .filter((el: any) => el.type === 'text' || el.type === 'paragraph')
      .map((el: any) => el.content)
      .join('\n\n');
  }
  
  if (Array.isArray(parsedContent.sections)) {
    return parsedContent.sections
      .map((section: any) => {
        let text = section.title ? `# ${section.title}\n\n` : '';
        if (section.content) text += section.content;
        return text;
      })
      .join('\n\n');
  }
  
  return JSON.stringify(parsedContent);
}

// Helper: Calculate quality score
function calculateQualityScore(extracted: any): number {
  let score = 0;
  const weights = {
    nutraceuticals: 20,
    conditions: 20,
    mechanisms: 15,
    findings: 10,
    molecular_mechanisms: 10,
    synergies: 10,
    dosages: 10,
    side_effects: 5
  };
  
  if (extracted.nutraceuticals?.length > 0) score += weights.nutraceuticals;
  if (extracted.conditions?.length > 0) score += weights.conditions;
  if (extracted.mechanisms?.length > 0) score += weights.mechanisms;
  if (extracted.findings?.length > 0) score += weights.findings;
  if (extracted.molecular_mechanisms?.length > 0) score += weights.molecular_mechanisms;
  if (extracted.synergies?.length > 0) score += weights.synergies;
  if (extracted.dosages?.length > 0) score += weights.dosages;
  if (extracted.side_effects?.length > 0) score += weights.side_effects;
  
  return Math.min(5, Math.round((score / 100) * 5));
}

// ==================== STAGE 1 TOOLS ====================
function getStage1Tools() {
  return [{
    type: 'function',
    function: {
      name: 'extract_study_entities',
      description: 'Extract basic scientific entities from veterinary study',
      parameters: {
        type: 'object',
        properties: {
          nutraceuticals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dosage: { type: 'string' },
                efficacy_score: { type: 'number' },
              },
              required: ['name']
            }
          },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                severity: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
                treatability_score: { type: 'number' },
              },
              required: ['name']
            }
          },
          mechanisms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                mechanism: { type: 'string' },
                nutraceutical: { type: 'string' },
              },
              required: ['mechanism']
            }
          },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                finding: { type: 'string' },
                significance: { type: 'string', enum: ['low', 'moderate', 'high'] },
              },
              required: ['finding']
            }
          },
          study_quality: {
            type: 'object',
            properties: {
              sample_size: { type: 'number' },
              study_type: { type: 'string' },
              quality_score: { type: 'number' },
            }
          }
        },
        required: ['nutraceuticals', 'conditions']
      }
    }
  }];
}

// ==================== STAGE 2 TOOLS ====================
function getStage2Tools() {
  return [{
    type: 'function',
    function: {
      name: 'extract_mechanisms',
      description: 'Extract molecular mechanisms, pathways, synergies, and interactions',
      parameters: {
        type: 'object',
        properties: {
          molecular_mechanisms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['pathway', 'enzyme', 'receptor', 'gene', 'protein', 'mediator'] },
                action: { type: 'string', enum: ['inhibition', 'activation', 'modulation'] },
                target: { type: 'string' },
                downstream_effects: { type: 'array', items: { type: 'string' } },
                category: { type: 'string', enum: ['inflammatory', 'oxidative_stress', 'metabolic', 'immunomodulatory', 'neuroprotective', 'other'] }
              },
              required: ['name', 'action']
            }
          },
          synergies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                compound1: { type: 'string' },
                compound2: { type: 'string' },
                synergy_type: { type: 'string', enum: ['bioavailability_enhancement', 'efficacy_enhancement', 'antagonism', 'potentiation', 'additive'] },
                effect: { type: 'string' },
                magnitude: { type: 'number' }
              },
              required: ['compound1', 'compound2', 'effect']
            }
          },
          hierarchical_relations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                from_type: { type: 'string', enum: ['nutraceutical', 'mechanism', 'effect', 'condition'] },
                to: { type: 'string' },
                to_type: { type: 'string', enum: ['nutraceutical', 'mechanism', 'effect', 'condition'] },
                relation_type: { type: 'string' }
              },
              required: ['from', 'from_type', 'to', 'to_type', 'relation_type']
            }
          }
        },
        required: ['molecular_mechanisms']
      }
    }
  }];
}

// ==================== STAGE 3 TOOLS ====================
function getStage3Tools() {
  return [{
    type: 'function',
    function: {
      name: 'extract_clinical_context',
      description: 'Extract dosages, side effects, contraindications, and clinical outcomes',
      parameters: {
        type: 'object',
        properties: {
          dosages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                compound: { type: 'string' },
                amount: { type: 'number' },
                unit: { type: 'string' },
                frequency: { type: 'string' },
                duration: { type: 'string' },
                species: { type: 'string', enum: ['human', 'canine', 'feline', 'equine', 'other'] },
                condition: { type: 'string' },
                route: { type: 'string', enum: ['oral', 'topical', 'intravenous', 'subcutaneous', 'other'] }
              },
              required: ['compound', 'amount', 'unit']
            }
          },
          side_effects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string', enum: ['mild', 'moderate', 'severe', 'life_threatening'] },
                frequency: { type: 'string', enum: ['very_common', 'common', 'uncommon', 'rare', 'very_rare', 'unknown'] },
                dose_dependent: { type: 'boolean' },
                reversibility: { type: 'string', enum: ['reversible', 'irreversible', 'unknown'] }
              },
              required: ['name', 'severity']
            }
          },
          contraindications: {
            type: 'array',
            items: { type: 'string' }
          },
          clinical_outcomes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                outcome: { type: 'string' },
                outcome_type: { type: 'string', enum: ['primary', 'secondary'] },
                p_value: { type: 'string' },
                effect_size: { type: 'string' },
                significance: { type: 'string', enum: ['significant', 'not_significant', 'not_reported'] }
              },
              required: ['outcome']
            }
          },
          study_assessment: {
            type: 'object',
            properties: {
              sample_size: { type: 'number' },
              study_duration: { type: 'string' },
              randomization: { type: 'boolean' },
              blinding: { type: 'string', enum: ['single', 'double', 'triple', 'none'] },
              placebo_controlled: { type: 'boolean' },
              quality_score: { type: 'number' },
              limitations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        required: ['dosages', 'side_effects']
      }
    }
  }];
}

// ==================== DEFAULT PROMPTS ====================
function getDefaultStage1SystemPrompt(): string {
  return `You are a veterinary nutraceutical research expert. Extract basic entities: nutraceuticals, health conditions, mechanisms, and findings. Be comprehensive.`;
}

function getDefaultStage1UserPrompt(): string {
  return `Extract all nutraceuticals, conditions, mechanisms, and key findings from this study:\n\n{{TEXT_CONTENT}}`;
}

function getDefaultStage2SystemPrompt(): string {
  return `You are a molecular biology expert. Extract detailed molecular mechanisms, synergies between compounds, and hierarchical relationships. Focus on pathways, enzymes, receptors, and interaction types.`;
}

function getDefaultStage2UserPrompt(): string {
  return `Based on these nutraceuticals: {{STAGE1_NUTRACEUTICALS}}\n\nExtract molecular mechanisms, synergies, and hierarchical relations from:\n\n{{TEXT_CONTENT}}`;
}

function getDefaultStage3SystemPrompt(): string {
  return `You are a clinical veterinary expert. Extract precise dosages, side effects, contraindications, and clinical outcomes. Include species-specific information.`;
}

function getDefaultStage3UserPrompt(): string {
  return `Based on these nutraceuticals: {{STAGE1_NUTRACEUTICALS}}\n\nExtract dosages, side effects, contraindications, and clinical outcomes from:\n\n{{TEXT_CONTENT}}`;
}
