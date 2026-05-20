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
  // ==================== LOGGING INICIAL DETALHADO ====================
  console.log('🚀 [extract-study-entities] Function started');
  console.log('📋 Request received at:', new Date().toISOString());
  console.log('📋 Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar variáveis de ambiente ANTES de qualquer lógica
  console.log('🔐 Checking environment variables...');
  console.log('  - SUPABASE_URL:', supabaseUrl ? `✅ (${supabaseUrl.length} chars)` : '❌ NOT SET');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `✅ (${supabaseServiceKey.length} chars)` : '❌ NOT SET');
  console.log('  - LOVABLE_API_KEY:', lovableApiKey ? `✅ (${lovableApiKey.length} chars)` : '❌ NOT SET');

  if (!lovableApiKey) {
    console.error('❌ CRITICAL: LOVABLE_API_KEY not configured!');
    return new Response(
      JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('📥 Parsing request body...');
    const { studyId } = await req.json();
    console.log('📥 studyId received:', studyId);
    
    if (!studyId) {
      console.error('❌ Missing studyId');
      return new Response(
        JSON.stringify({ error: 'Missing required field: studyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get parsed study content - INCLUI full_text_content da coluna separada
    console.log(`🔍 Buscando estudo com ID: ${studyId}`);
    const { data: studyData, error: studyError } = await supabase
      .from('processed_studies')
      .select('analysis_data, title, study_id, full_text_content')
      .eq('id', studyId)
      .maybeSingle();
    
    if (studyError || !studyData) {
      console.error(`❌ Estudo não encontrado`);
      return new Response(
        JSON.stringify({ error: 'Study not found', studyId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Estudo encontrado: ${studyData.title || 'sem título'}`);

    const parsedContent = studyData.analysis_data || {};
    // CRÍTICO: Usar full_text_content da coluna separada como prioridade
    const fullTextFromColumn = studyData.full_text_content;
    const textContent = extractTextContent(parsedContent, fullTextFromColumn);
    
    if (!textContent || textContent.trim().length < 100) {
      console.error('❌ Texto insuficiente extraído');
      console.error('📊 full_text_content length:', fullTextFromColumn?.length || 0);
      console.error('📊 analysis_data keys:', Object.keys(parsedContent));
      return new Response(
        JSON.stringify({ error: 'Insufficient text extracted', studyId, details: {
          fullTextLength: fullTextFromColumn?.length || 0,
          analysisDataKeys: Object.keys(parsedContent)
        }}),
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
    console.log('📝 Stage 1 System Prompt (first 200 chars):', prompts.stage1System?.substring(0, 200));
    
    let stage1Data: any = { nutraceuticals: [], conditions: [], mechanisms: [], findings: [], study_quality: {} };
    try {
      const stage1Result = await callLovableAI(
        prompts.stage1System,
        prompts.stage1User.replace('{{TEXT_CONTENT}}', textContent),
        getStage1Tools()
      );
      
      if (stage1Result) {
        console.log('📊 Stage 1 raw result:', JSON.stringify(stage1Result).substring(0, 500));
        stage1Data = JSON.parse(stage1Result.function.arguments);
      } else {
        console.warn('⚠️ Stage 1 returned null result');
      }
    } catch (stage1Error) {
      console.error('❌ Stage 1 error:', stage1Error);
    }
    console.log(`✅ Stage 1: ${stage1Data.nutraceuticals?.length || 0} nutracêuticos, ${stage1Data.conditions?.length || 0} condições`);

    // ==================== STAGE 2: Molecular Mechanisms ====================
    console.log('🟢 [STAGE 2/3] Extraindo mecanismos moleculares, sinergias e relações...');
    console.log('📝 Stage 2 System Prompt (first 300 chars):', prompts.stage2System?.substring(0, 300));
    console.log('📝 Stage 2 User Prompt template has TEXT_CONTENT:', prompts.stage2User?.includes('{{TEXT_CONTENT}}'));
    console.log('📝 Text content length for Stage 2:', textContent?.length || 0);
    
    let stage2Data: any = { molecular_mechanisms: [], synergies: [], hierarchical_relations: [] };
    try {
      const stage2UserPrompt = prompts.stage2User
        .replace('{{TEXT_CONTENT}}', textContent)
        .replace('{{STAGE1_NUTRACEUTICALS}}', JSON.stringify(stage1Data.nutraceuticals || []));
      
      console.log('📤 Calling Lovable AI for Stage 2...');
      console.log('📝 Stage 2 User Prompt (first 500 chars):', stage2UserPrompt.substring(0, 500));
      
      const stage2Result = await callLovableAI(
        prompts.stage2System,
        stage2UserPrompt,
        getStage2Tools()
      );
      
      if (stage2Result) {
        console.log('📊 Stage 2 raw function name:', stage2Result.function?.name);
        console.log('📊 Stage 2 raw arguments (first 1000 chars):', stage2Result.function?.arguments?.substring(0, 1000));
        stage2Data = JSON.parse(stage2Result.function.arguments);
        console.log('📊 Stage 2 parsed mechanisms count:', stage2Data.molecular_mechanisms?.length || 0);
        console.log('📊 Stage 2 parsed mechanisms:', JSON.stringify(stage2Data.molecular_mechanisms || []).substring(0, 500));
      } else {
        console.warn('⚠️ Stage 2 returned null result - AI may have failed to call the tool');
      }
    } catch (stage2Error: any) {
      console.error('❌ Stage 2 error:', stage2Error);
      console.error('❌ Stage 2 error stack:', stage2Error?.stack || 'no stack');
    }
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

    // RC-001 / Adverse-events normalization: drop pseudo-entries that mean "no AEs reported"
    const NEGATIVE_AE_REGEX = /\b(no|none|not|sem|nenhum|nenhuma|n[ãa]o)\b.*\b(adverse|side[- ]?effect|event|reported|observed|evento|efeito|adverso|reportado|observad)/i;
    const originalAEs = Array.isArray(stage3Data.side_effects) ? stage3Data.side_effects : [];
    const filteredAEs = originalAEs.filter((e: any) => !NEGATIVE_AE_REGEX.test(`${e?.name || ''} ${e?.description || ''}`));
    if (originalAEs.length > 0 && filteredAEs.length !== originalAEs.length) {
      console.log(`🧹 Adverse-events normalization: removed ${originalAEs.length - filteredAEs.length} negation-only entries (kept ${filteredAEs.length})`);
    }
    stage3Data.side_effects = filteredAEs;
    stage3Data.explicitly_no_adverse_events =
      originalAEs.length > 0 && filteredAEs.length === 0;

    // ==================== POST-EXTRACTION VALIDATION ====================
    // Filter dosages to only include compounds that were found in Stage 1 (with flexible matching)
    const stage1Nutraceuticals = stage1Data.nutraceuticals || [];
    const stage1CompoundNames: string[] = stage1Nutraceuticals
      .map((n: any) => (n.name || '').toLowerCase().trim())
      .filter((name: string) => name.length > 0);
    
    // Also collect alternative names (synonyms) - e.g., "L-deprenyl" and "Selegiline"
    const compoundSynonyms: { [key: string]: string[] } = {
      'l-deprenyl': ['selegiline', 'deprenyl', 'eldepryl', 'zelapar'],
      'selegiline': ['l-deprenyl', 'deprenyl', 'eldepryl', 'zelapar'],
      'curcumin': ['curcuminoid', 'turmeric extract'],
      'omega-3': ['omega 3', 'fish oil', 'epa', 'dha'],
      'coq10': ['coenzyme q10', 'ubiquinone', 'ubiquinol'],
    };
    
    const normalizeCompoundName = (name: string): string => {
      return name.toLowerCase().trim()
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ');
    };
    
    const compoundsMatch = (name1: string, name2: string): boolean => {
      const n1 = normalizeCompoundName(name1);
      const n2 = normalizeCompoundName(name2);
      
      // Direct match or partial containment
      if (n1.includes(n2) || n2.includes(n1)) return true;
      
      // Check synonyms
      for (const [key, synonyms] of Object.entries(compoundSynonyms)) {
        const allNames = [key, ...synonyms];
        const n1Match = allNames.some(s => n1.includes(s) || s.includes(n1));
        const n2Match = allNames.some(s => n2.includes(s) || s.includes(n2));
        if (n1Match && n2Match) return true;
      }
      
      return false;
    };
    
    let validatedDosages = (stage3Data.dosages || []).filter((d: any) => {
      const compoundName = (d.compound || '').toLowerCase().trim();
      if (!compoundName) return false;
      
      // Check if compound matches any Stage 1 nutraceutical (flexible match)
      const isValid = stage1CompoundNames.some((s1name: string) => compoundsMatch(compoundName, s1name));
      
      if (!isValid) {
        console.warn(`⚠️ [VALIDATION] Filtering out dosage for "${d.compound}" - not found in Stage 1 nutraceuticals`);
      }
      return isValid;
    });
    
    console.log(`✅ [VALIDATION] Dosages after validation: ${validatedDosages.length}/${stage3Data.dosages?.length || 0}`);
    
    // ==================== FALLBACK: Parse dosages from Stage 1 if Stage 3 returned none ====================
    if (validatedDosages.length === 0 && stage1Nutraceuticals.length > 0) {
      console.log('⚠️ [FALLBACK] Stage 3 returned no dosages - parsing from Stage 1 nutraceuticals');
      
      for (const nutra of stage1Nutraceuticals) {
        if (nutra.dosage && typeof nutra.dosage === 'string' && nutra.dosage.length > 0) {
          const dosageText = nutra.dosage;
          console.log(`📊 Parsing dosage from Stage 1: "${nutra.name}" -> "${dosageText}"`);
          
          // Parse dosage ranges like "0.5-1.0 mg/kg (dogs)"
          const rangeMatch = dosageText.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*(mg\/kg|mg|g|ml)/i);
          const singleMatch = dosageText.match(/(\d+\.?\d*)\s*(mg\/kg|mg|g|ml)/i);
          
          // Parse species from parentheses
          const speciesMatch = dosageText.match(/\((dog|canine|cat|feline|rodent|human|horse|equine)s?\)/i);
          let species = 'other';
          if (speciesMatch) {
            const sp = speciesMatch[1].toLowerCase();
            if (sp === 'dog' || sp === 'canine') species = 'canine';
            else if (sp === 'cat' || sp === 'feline') species = 'feline';
            else if (sp === 'horse' || sp === 'equine') species = 'equine';
            else if (sp === 'rodent') species = 'rodent';
            else if (sp === 'human') species = 'human';
          }
          
          if (rangeMatch) {
            validatedDosages.push({
              compound: nutra.name,
              amount_min: parseFloat(rangeMatch[1]),
              amount_max: parseFloat(rangeMatch[2]),
              unit: rangeMatch[3],
              amount_text: dosageText,
              per_body_weight: rangeMatch[3].toLowerCase().includes('/kg'),
              species: species,
              source: 'stage1_fallback'
            });
          } else if (singleMatch) {
            validatedDosages.push({
              compound: nutra.name,
              amount: parseFloat(singleMatch[1]),
              unit: singleMatch[2],
              amount_text: dosageText,
              per_body_weight: singleMatch[2].toLowerCase().includes('/kg'),
              species: species,
              source: 'stage1_fallback'
            });
          } else {
            // Just store the text
            validatedDosages.push({
              compound: nutra.name,
              amount_text: dosageText,
              unit: 'unknown',
              species: species,
              source: 'stage1_fallback'
            });
          }
        }
      }
      
      console.log(`✅ [FALLBACK] Created ${validatedDosages.length} dosages from Stage 1`);
    }

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
      
      // Stage 3 (with validated dosages + fallback)
      dosages: validatedDosages,
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
    
    // ==================== EXTRAIR TÍTULO REAL DO PDF ====================
    console.log('📝 Extraindo título real do documento...');
    let extractedTitle = studyData.title;
    
    // Tentar extrair título do conteúdo parseado
    if (parsedContent) {
      // Prioridade 1: Título explícito do parsing
      if (parsedContent.title && typeof parsedContent.title === 'string' && parsedContent.title.length > 10) {
        extractedTitle = parsedContent.title;
        console.log(`✅ Título encontrado no parsing: ${extractedTitle}`);
      }
      // Prioridade 2: Primeira linha/heading do documento
      else if (parsedContent.sections && Array.isArray(parsedContent.sections) && parsedContent.sections.length > 0) {
        const firstSection = parsedContent.sections[0];
        if (firstSection.title && firstSection.title.length > 10 && firstSection.title.length < 300) {
          extractedTitle = firstSection.title;
          console.log(`✅ Título extraído da primeira seção: ${extractedTitle}`);
        }
      }
      // Prioridade 3: Usar IA para extrair título se ainda não temos um bom
      else if (!extractedTitle || extractedTitle.includes('Simulated') || extractedTitle.includes('Unknown')) {
        try {
          const titlePrompt = `Extract ONLY the title of this scientific study. Return just the title text, nothing else. First 2000 characters of document:\n\n${textContent.substring(0, 2000)}`;
          const titleResult = await callLovableAI(
            'You are a title extractor. Return ONLY the exact title of the scientific paper, nothing else.',
            titlePrompt,
            [{
              type: 'function',
              function: {
                name: 'extract_title',
                description: 'Extract the title',
                parameters: {
                  type: 'object',
                  properties: { title: { type: 'string' } },
                  required: ['title']
                }
              }
            }]
          );
          if (titleResult) {
            const titleData = JSON.parse(titleResult.function.arguments);
            if (titleData.title && titleData.title.length > 10 && titleData.title.length < 300) {
              extractedTitle = titleData.title;
              console.log(`✅ Título extraído via IA: ${extractedTitle}`);
            }
          }
        } catch (titleError) {
          console.warn('⚠️ Não foi possível extrair título via IA:', titleError);
        }
      }
    }
    
    // Fallback final: limpar o nome do arquivo
    if (!extractedTitle || extractedTitle.includes('Simulated') || extractedTitle === 'Unknown Study') {
      const { data: fileData } = await supabase
        .from('processed_studies')
        .select('original_filename')
        .eq('id', studyId)
        .single();
      
      if (fileData?.original_filename) {
        // Remover extensão e formatar
        extractedTitle = fileData.original_filename
          .replace(/\.(pdf|PDF)$/, '')
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .trim();
        console.log(`📄 Usando nome do arquivo como título: ${extractedTitle}`);
      }
    }
    
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
        updated_at: new Date().toISOString(),
      }, { onConflict: 'study_id' })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Failed to save extraction:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save extraction results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update processed_studies status AND title
    console.log(`📝 Atualizando título para: ${extractedTitle}`);
    await supabase
      .from('processed_studies')
      .update({ 
        kanban_status: 'processed',
        title: extractedTitle 
      })
      .eq('id', studyId);

    // ==================== AUTO-VECTORIZATION (pré-curadoria) ====================
    // A curadoria humana depende dos chunks vetorizados para exibir o "Trecho de Origem"
    // que justifica cada triplet. Disparamos em background para não bloquear a resposta.
    try {
      const vectorizePromise = fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/vectorize-study`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ studyId }),
        }
      ).then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          console.warn(`⚠️ vectorize-study falhou (${r.status}): ${text.slice(0, 200)}`);
        } else {
          console.log(`✅ vectorize-study disparado em background para ${studyId}`);
        }
      }).catch((e) => {
        console.warn(`⚠️ vectorize-study fetch error: ${e.message}`);
      });
      // @ts-ignore - EdgeRuntime existe em Supabase Edge mas não está tipado
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(vectorizePromise);
      }
    } catch (vecErr: any) {
      console.warn(`⚠️ Falha ao agendar vectorize-study: ${vecErr.message}`);
    }

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

    // 🛟 FALLBACK: se Stage 1 não detectou nutracêuticos/condições mas Stage 2
    // gerou triplets válidos, derivar as listas a partir dos triplets para que
    // o card de curadoria e o modal de detalhes não fiquem "nus".
    const NUTRA_TYPES = new Set(['Nutraceutical', 'Compound', 'Drug']);
    const COND_TYPES = new Set(['Condition', 'Disease', 'Phenotype', 'Outcome']);
    if (frontendData.extractedNutraceuticals.length === 0 && triplets.length > 0) {
      const derived = new Map<string, { name: string; confidence: number }>();
      for (const t of triplets) {
        if (NUTRA_TYPES.has(t.subject_type) && t.subject_name) {
          const key = String(t.subject_name).trim().toLowerCase();
          if (key && !derived.has(key)) derived.set(key, { name: t.subject_name, confidence: 3 });
        }
      }
      if (derived.size > 0) {
        frontendData.extractedNutraceuticals = Array.from(derived.values());
        console.log(`🛟 Fallback: derivados ${derived.size} nutracêuticos a partir de triplets`);
      }
    }
    if (frontendData.extractedConditions.length === 0 && triplets.length > 0) {
      const derived = new Map<string, { name: string; confidence: number }>();
      for (const t of triplets) {
        if (COND_TYPES.has(t.object_type) && t.object_name) {
          const key = String(t.object_name).trim().toLowerCase();
          if (key && !derived.has(key)) derived.set(key, { name: t.object_name, confidence: 3 });
        }
      }
      if (derived.size > 0) {
        frontendData.extractedConditions = Array.from(derived.values());
        console.log(`🛟 Fallback: derivadas ${derived.size} condições a partir de triplets`);
      }
    }

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

// Helper: Extract text from parsed content - PRIORIZA full_text_content da coluna separada
function extractTextContent(parsedContent: any, fullTextFromColumn?: string | null): string {
  // PRIORIDADE 1: full_text_content da coluna separada (fonte mais confiável)
  if (fullTextFromColumn && typeof fullTextFromColumn === 'string' && fullTextFromColumn.length > 200) {
    console.log(`📄 Usando full_text_content da coluna (${fullTextFromColumn.length} chars)`);
    return fullTextFromColumn;
  }
  
  // PRIORIDADE 2: full_text dentro de analysis_data (se não for placeholder)
  if (parsedContent.full_text && 
      typeof parsedContent.full_text === 'string' && 
      parsedContent.full_text.length > 200 &&
      !parsedContent.full_text.includes('See PDF content') &&
      !parsedContent.full_text.includes('See attached')) {
    console.log(`📄 Usando full_text de analysis_data (${parsedContent.full_text.length} chars)`);
    return parsedContent.full_text;
  }
  
  // PRIORIDADE 3: Construir texto a partir de TODOS os dados estruturados disponíveis
  console.log('📄 Construindo texto a partir de dados estruturados...');
  const textParts: string[] = [];
  
  // Metadados básicos
  if (parsedContent.title) textParts.push(`# ${parsedContent.title}`);
  if (parsedContent.abstract) textParts.push(`\n## Abstract\n${parsedContent.abstract}`);
  
  // Nutracêuticos com detalhes completos
  const nutraceuticals = parsedContent.nutraceuticals || parsedContent.extractedNutraceuticals || [];
  if (nutraceuticals.length > 0) {
    textParts.push('\n## Nutraceuticals');
    nutraceuticals.forEach((n: any) => {
      textParts.push(`\n### ${n.name}`);
      if (n.dosage) textParts.push(`- Dosage: ${n.dosage}`);
      if (n.effects) textParts.push(`- Effects: ${n.effects}`);
      if (n.efficacy_score) textParts.push(`- Efficacy: ${n.efficacy_score}/5`);
    });
  }
  
  // Condições de saúde
  const conditions = parsedContent.conditions || parsedContent.extractedConditions || [];
  if (conditions.length > 0) {
    textParts.push('\n## Health Conditions');
    conditions.forEach((c: any) => {
      textParts.push(`\n### ${c.name}`);
      if (c.relationship_type) textParts.push(`- Relationship: ${c.relationship_type}`);
      if (c.efficacy_description) textParts.push(`- Efficacy: ${c.efficacy_description}`);
    });
  }
  
  // Mecanismos moleculares
  const mechanisms = parsedContent.mechanisms || parsedContent.extractedMechanisms || [];
  if (mechanisms.length > 0) {
    textParts.push('\n## Molecular Mechanisms');
    mechanisms.forEach((m: any) => {
      textParts.push(`- ${m.name || m.mechanism}: ${m.description || m.type || ''}`);
    });
  }
  
  // Efeitos biológicos
  const effects = parsedContent.biological_effects || parsedContent.extractedEffects || [];
  if (effects.length > 0) {
    textParts.push('\n## Biological Effects');
    effects.forEach((e: any) => {
      textParts.push(`- ${e.name}: ${e.description || e.type || ''}`);
    });
  }
  
  // Interações
  const interactions = parsedContent.interactions || parsedContent.extractedInteractions || [];
  if (interactions.length > 0) {
    textParts.push('\n## Interactions');
    interactions.forEach((i: any) => {
      textParts.push(`- ${i.from || i.nutraceutical} → ${i.type} → ${i.to || i.condition}`);
      if (i.description) textParts.push(`  ${i.description}`);
    });
  }
  
  // Side effects
  const sideEffects = parsedContent.side_effects || parsedContent.extractedSideEffects || [];
  if (sideEffects.length > 0) {
    textParts.push('\n## Side Effects');
    sideEffects.forEach((s: any) => {
      textParts.push(`- ${s.name}: ${s.description || ''} (${s.severity || 'unknown'} severity)`);
    });
  }
  
  // Study population (espécie, raça, etc)
  if (parsedContent.study_population) {
    const pop = parsedContent.study_population;
    textParts.push('\n## Study Population');
    if (pop.species) textParts.push(`- Species: ${pop.species}`);
    if (pop.breed) textParts.push(`- Breed: ${pop.breed}`);
    if (pop.sample_size) textParts.push(`- Sample size: ${pop.sample_size}`);
    if (pop.age_group) textParts.push(`- Age group: ${pop.age_group}`);
  }
  
  // Dosagens estruturadas
  const dosages = parsedContent.structured_dosages || [];
  if (dosages.length > 0) {
    textParts.push('\n## Dosages');
    dosages.forEach((d: any) => {
      const perKg = d.per_body_weight ? '/kg' : '';
      textParts.push(`- ${d.compound}: ${d.amount} ${d.unit}${perKg} ${d.frequency || ''}`);
    });
  }
  
  // Biomarkers
  const biomarkers = parsedContent.biomarkers || [];
  if (biomarkers.length > 0) {
    textParts.push('\n## Biomarkers Measured');
    biomarkers.forEach((b: any) => {
      textParts.push(`- ${b.name}: ${b.change_percent ? b.change_percent + '% change' : ''} (${b.significance})`);
    });
  }
  
  const constructedText = textParts.join('\n');
  
  if (constructedText.length > 200) {
    console.log(`📄 Texto construído com sucesso (${constructedText.length} chars)`);
    return constructedText;
  }
  
  // FALLBACK: Serializar o JSON como último recurso
  console.log('⚠️ Usando JSON serializado como fallback');
  return JSON.stringify(parsedContent, null, 2);
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
      description: 'Extract dosages (including ranges like 0.5-1.0 mg/kg), side effects, contraindications, and clinical outcomes',
      parameters: {
        type: 'object',
        properties: {
          dosages: {
            type: 'array',
            description: 'Extract ALL dosages mentioned, including ranges (e.g., 0.5-1.0 mg/kg). Use amount_min/amount_max for ranges, or amount_text for complex dosages.',
            items: {
              type: 'object',
              properties: {
                compound: { type: 'string', description: 'Name of the compound. Use EXACT name from Stage 1 nutraceuticals if possible.' },
                amount: { type: 'number', description: 'Single dosage amount (if not a range)' },
                amount_min: { type: 'number', description: 'Minimum of dosage range (e.g., 0.5 for "0.5-1.0 mg/kg")' },
                amount_max: { type: 'number', description: 'Maximum of dosage range (e.g., 1.0 for "0.5-1.0 mg/kg")' },
                amount_text: { type: 'string', description: 'Original dosage text for complex cases (e.g., "0.25-0.5 mg/kg (rodents); 0.5-1.0 mg/kg (dogs)")' },
                unit: { type: 'string', description: 'Unit of measurement (mg, mg/kg, g, ml, etc.)' },
                per_body_weight: { type: 'boolean', description: 'True if dosage is per body weight (e.g., mg/kg)' },
                frequency: { type: 'string' },
                duration: { type: 'string' },
                species: { type: 'string', enum: ['human', 'canine', 'feline', 'equine', 'rodent', 'other'] },
                condition: { type: 'string' },
                route: { type: 'string', enum: ['oral', 'topical', 'intravenous', 'subcutaneous', 'other'] }
              },
              required: ['compound', 'unit']
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
            description: 'PROVEN risks — only conditions where the text explicitly states harm, risk or recommends against use. RC-001.',
            items: {
              type: 'object',
              properties: {
                condition: { type: 'string' },
                severity: { type: 'string', enum: ['absolute', 'relative', 'caution', 'unknown'] },
                reason: { type: 'string' },
                evidence_level: { type: 'string' }
              },
              required: ['condition']
            }
          },
          exclusion_criteria: {
            type: 'array',
            description: 'Populations EXCLUDED from the trial (evidence gaps, NOT contraindications). RC-001.',
            items: {
              type: 'object',
              properties: {
                population: { type: 'string' },
                quote: { type: 'string' }
              },
              required: ['population']
            }
          },
          evidence_gaps: {
            type: 'array',
            description: 'Areas the study explicitly identifies as needing more research.',
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
  return `You are a veterinary nutraceutical research expert extracting information from scientific studies.

CRITICAL RULES - YOU MUST FOLLOW:
1. Extract ONLY information that is EXPLICITLY stated in the provided document
2. DO NOT invent, assume, or hallucinate any data
3. DO NOT use knowledge from other studies or general knowledge
4. If something is not mentioned in the text, DO NOT include it
5. Return empty arrays [] for categories with no explicit data in the document

Your job is to identify: nutraceuticals, health conditions, mechanisms, and key findings - but ONLY those actually mentioned in this specific document.`;
}

function getDefaultStage1UserPrompt(): string {
  return `Extract all nutraceuticals, conditions, mechanisms, and key findings from ONLY this study document.

IMPORTANT: Only include information explicitly stated in this text. If a compound, condition, or mechanism is not mentioned, do not include it.

Document to analyze:
{{TEXT_CONTENT}}`;
}

function getDefaultStage2SystemPrompt(): string {
  return `You are a molecular biology expert analyzing a specific veterinary study.

CRITICAL RULES - YOU MUST FOLLOW:
1. Extract ONLY molecular mechanisms and synergies EXPLICITLY described in this document
2. If synergies between compounds are NOT explicitly mentioned, return an EMPTY array []
3. DO NOT invent or assume synergies based on general knowledge
4. DO NOT reference data from other studies like Curcumin, Piperine, etc. unless they are EXPLICITLY in this document
5. Focus on pathways, enzymes, receptors ONLY if mentioned in the text
6. If unsure whether something is in the document, leave it out`;
}

function getDefaultStage2UserPrompt(): string {
  return `Based on these nutraceuticals found in Stage 1: {{STAGE1_NUTRACEUTICALS}}

Extract molecular mechanisms, synergies, and hierarchical relations ONLY from the following document.

CRITICAL: 
- If no synergies are explicitly described, return synergies as []
- Do NOT add compounds like Piperine, Curcumin, etc. unless they appear in this specific text
- Only include mechanisms that are directly stated in the document

Document to analyze:
{{TEXT_CONTENT}}`;
}

function getDefaultStage3SystemPrompt(): string {
  return `You are a clinical veterinary expert extracting dosage and safety information from scientific studies.

CRITICAL RULES - YOU MUST FOLLOW:
1. Extract ONLY dosages, side effects, and outcomes EXPLICITLY stated in this document
2. DO NOT invent dosages from general knowledge or other studies
3. IMPORTANT: Extract dosages even if they are RANGES (e.g., "0.5-1.0 mg/kg")
   - Use amount_min and amount_max for ranges
   - Use amount_text to preserve the original complex dosage text
   - Set per_body_weight=true if dosage is per kg body weight
4. For compound names, use the EXACT name from Stage 1 nutraceuticals when possible
5. If a study mentions dosages for multiple species, create SEPARATE entries for each species
6. Only include side effects and contraindications explicitly stated in this study
7. Never assume or hallucinate data - if it's not in the document, don't include it
8. CORE RULE RC-001 — EXCLUSION CRITERIA ARE NOT CONTRAINDICATIONS:
   - If a population was EXCLUDED from the trial (e.g., "pregnant women were excluded", "patients with diabetes were not enrolled"),
     this is an EVIDENCE GAP, not a contraindication.
   - Only classify as a contraindication if the text EXPLICITLY states harm, risk, or recommends against use
     (e.g., "contraindicated in...", "should not be used in...", "caused adverse events in patients with...").
   - When in doubt, prefer to omit the contraindication rather than infer one from exclusion criteria.
9. ADVERSE EVENTS — explicit negation:
   - If the study explicitly reports that NO adverse events were observed, return side_effects as an EMPTY array [].
   - Do NOT create a side_effect entry whose name/description is "No adverse events reported" — that distorts downstream counts.`;
}

function getDefaultStage3UserPrompt(): string {
  return `Based on these nutraceuticals found in Stage 1: {{STAGE1_NUTRACEUTICALS}}

Extract dosages, side effects, contraindications, and clinical outcomes ONLY from the following document.

CRITICAL DOSAGE EXTRACTION RULES:
1. Look for ANY dosage information in the text (mg, mg/kg, g, ml, etc.)
2. For RANGES like "0.5-1.0 mg/kg":
   - Set amount_min: 0.5
   - Set amount_max: 1.0
   - Set unit: "mg/kg"
   - Set per_body_weight: true
   - Set amount_text: "0.5-1.0 mg/kg"
3. For MULTI-SPECIES dosages like "0.25-0.5 mg/kg (rodents); 0.5-1.0 mg/kg (dogs)":
   - Create SEPARATE entries for each species
   - Entry 1: species: "rodent", amount_min: 0.25, amount_max: 0.5
   - Entry 2: species: "canine", amount_min: 0.5, amount_max: 1.0
4. COMPOUND NAME: Use the EXACT name from Stage 1 nutraceuticals (e.g., if Stage 1 has "L-deprenyl", use "L-deprenyl", not "Selegiline")
5. Only include dosages explicitly stated in this document

Document to analyze:
{{TEXT_CONTENT}}`;
}
