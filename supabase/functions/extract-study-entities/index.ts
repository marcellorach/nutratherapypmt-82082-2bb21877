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
    
    // Get parsed study content using PRIMARY KEY (id)
    console.log(`🔍 Buscando estudo com ID: ${studyId}`);
    const { data: studyData, error: studyError } = await supabase
      .from('processed_studies')
      .select('analysis_data, title, study_id')
      .eq('id', studyId)
      .maybeSingle();
    
    if (studyError || !studyData) {
      console.error(`❌ Estudo não encontrado. ID buscado: ${studyId}`);
      console.error('Erro Supabase:', JSON.stringify(studyError, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Study not found or not parsed yet',
          studyId,
          searchedColumn: 'id (PRIMARY KEY)',
          details: studyError 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // VALIDAÇÃO CRÍTICA: Verificar se analysis_data existe
    if (!studyData.analysis_data || typeof studyData.analysis_data !== 'object') {
      console.error(`❌ CRITICAL: Study ${studyId} has no analysis_data`);
      console.error(`Study title: ${studyData.title}`);
      console.error(`analysis_data value:`, studyData.analysis_data);
      
      return new Response(
        JSON.stringify({ 
          error: 'Study not ready for extraction',
          details: 'The study must be processed by gemini-file-search first. The analysis_data field is missing or invalid. Please ensure the PDF was successfully uploaded and processed.',
          studyId,
          title: studyData.title,
          hasAnalysisData: false,
          recommendation: 'Process this study with gemini-file-search before extraction'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`✅ Estudo encontrado: ${studyData.title || 'sem título'} (study_id: ${studyData.study_id})`);

    const parsedContent = studyData.analysis_data;
    
    console.log('📊 Estrutura do analysis_data:', JSON.stringify(parsedContent).slice(0, 500) + '...');
    console.log('📊 Campos presentes:', Object.keys(parsedContent || {}).join(', '));
    
    // Validar estrutura do analysis_data
    const analysisDataKeys = Object.keys(parsedContent);
    const hasParseStudyStructure = analysisDataKeys.includes('elements') || analysisDataKeys.includes('sections');
    const hasGeminiStructure = analysisDataKeys.includes('abstract') || analysisDataKeys.includes('nutraceuticals') || analysisDataKeys.includes('full_text');
    
    if (!hasParseStudyStructure && !hasGeminiStructure) {
      console.error(`❌ Invalid analysis_data structure`);
      console.error(`Available keys: ${analysisDataKeys.join(', ')}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid analysis_data structure',
          details: 'The analysis_data field does not contain expected keys (elements, sections, abstract, nutraceuticals, or full_text). The study may not have been processed correctly.',
          studyId,
          availableKeys: analysisDataKeys,
          recommendation: 'Re-process this study with gemini-file-search or parse-study'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Prepare text content for LLM
    const textContent = extractTextContent(parsedContent);
    
    // VALIDAÇÃO CRÍTICA: Verificar se temos texto para processar
    if (!textContent || textContent.trim().length < 100) {
      console.error('❌ VALIDATION FAILED: Insufficient text extracted');
      console.error(`Text length: ${textContent?.length || 0} chars`);
      console.error(`analysis_data keys: ${analysisDataKeys.join(', ')}`);
      console.error(`Text preview:`, textContent?.substring(0, 200));
      
      return new Response(
        JSON.stringify({ 
          error: 'Extraction failed',
          details: `Insufficient text extracted from study (${textContent?.length || 0} chars). The document may not have been parsed correctly. Please check the analysis_data field in processed_studies.`,
          studyId,
          textLength: textContent?.length || 0,
          analysisDataKeys,
          textPreview: textContent?.substring(0, 200) || '',
          recommendation: 'Check if the PDF was properly parsed. You may need to re-upload the PDF and process again.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`✅ VALIDATION PASSED: ${textContent.length} chars of text ready for AI`);
    console.log('📊 Primeiros 500 chars do texto:', textContent.slice(0, 500));
    console.log(`📤 Calling Lovable AI for entity extraction...`);

    // Call Lovable AI with tool calling for structured extraction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a scientific data extraction specialist for veterinary nutraceutical research. 

CONTEXT: You will receive text content that may include:
- Abstract and full text from a scientific study
- Previously identified nutraceuticals and health conditions (if any)

YOUR TASK:
1. Extract ALL nutraceuticals mentioned (compounds, herbs, supplements, vitamins, minerals)
2. Extract ALL health conditions/diseases addressed in the study
3. Extract mechanisms of action explaining how treatments work
4. Extract key clinical findings and results

Be COMPREHENSIVE - include all relevant entities, not just the main ones.
Focus on: nutraceuticals, health conditions, mechanisms of action, dosages, efficacy, and clinical findings.
Include both primary and secondary nutraceuticals mentioned.`
          },
          {
            role: 'user',
            content: `Extract all relevant scientific entities from this veterinary study:\n\n${textContent}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_study_entities',
            description: 'Extract structured scientific entities from a veterinary nutraceutical study',
            parameters: {
              type: 'object',
              properties: {
                nutraceuticals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Name of the nutraceutical compound' },
                      dosage: { type: 'string', description: 'Recommended dosage' },
                      efficacy_score: { type: 'number', description: 'Efficacy score 1-5' },
                    },
                    required: ['name']
                  }
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Health condition name' },
                      severity: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
                      treatability_score: { type: 'number', description: 'Treatability score 1-5' },
                    },
                    required: ['name']
                  }
                },
                mechanisms: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      mechanism: { type: 'string', description: 'Biological mechanism of action' },
                      nutraceutical: { type: 'string', description: 'Related nutraceutical' },
                    },
                    required: ['mechanism']
                  }
                },
                findings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      finding: { type: 'string', description: 'Key clinical finding' },
                      significance: { type: 'string', enum: ['low', 'moderate', 'high'] },
                      evidence_level: { type: 'string', enum: ['weak', 'moderate', 'strong'] },
                    },
                    required: ['finding']
                  }
                },
                study_quality: {
                  type: 'object',
                  properties: {
                    sample_size: { type: 'number' },
                    study_type: { type: 'string' },
                    quality_score: { type: 'number', description: 'Quality score 1-5' },
                  }
                }
              },
              required: ['nutraceuticals', 'conditions', 'mechanisms', 'findings']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_study_entities' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI extraction failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    
    // Parse tool call result
    const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: 'AI did not return structured extraction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    console.log('📊 Extração retornada pela AI:', JSON.stringify(extractedData, null, 2));
    console.log(`📊 Nutracêuticos extraídos: ${extractedData.nutraceuticals?.length || 0}`);
    console.log(`📊 Condições extraídas: ${extractedData.conditions?.length || 0}`);
    
    // FALLBACK: If AI returned empty but gemini already had data, use gemini's extraction
    if (extractedData.nutraceuticals.length === 0 && parsedContent.nutraceuticals?.length > 0) {
      console.log('⚠️ AI retornou nutracêuticos vazios, usando dados do Gemini File Search');
      extractedData.nutraceuticals = parsedContent.nutraceuticals.map((n: any) => ({
        name: n.name,
        dosage: n.dosage || '',
        efficacy_score: 3
      }));
    }

    if (extractedData.conditions.length === 0 && parsedContent.conditions?.length > 0) {
      console.log('⚠️ AI retornou condições vazias, usando dados do Gemini File Search');
      extractedData.conditions = parsedContent.conditions.map((c: any) => ({
        name: c.name,
        severity: 'moderate',
        treatability_score: 3
      }));
    }
    
    console.log(`✅ Dados finais: ${extractedData.nutraceuticals?.length || 0} nutracêuticos, ${extractedData.conditions?.length || 0} condições`);
    
    // Calculate extraction quality score
    const qualityScore = calculateQualityScore(extractedData);

    // Save to study_extractions table (study_id now expects UUID = processed_studies.id)
    console.log(`💾 Salvando extração com study_id (UUID): ${studyId}`);
    const { data: extraction, error: insertError } = await supabase
      .from('study_extractions')
      .upsert({
        study_id: studyId, // Now correctly using UUID (processed_studies.id)
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

    // Update processed_studies status using PRIMARY KEY (id)
    console.log(`🔄 Atualizando status do estudo para 'processed'...`);
    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({ kanban_status: 'processed' })
      .eq('id', studyId);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar status kanban:', updateError);
    } else {
      console.log('✅ Status kanban atualizado com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        studyId,
        extractionId: extraction?.id,
        qualityScore,
        counts: {
          nutraceuticals: extractedData.nutraceuticals?.length || 0,
          conditions: extractedData.conditions?.length || 0,
          mechanisms: extractedData.mechanisms?.length || 0,
          findings: extractedData.findings?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in extract-study-entities function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Extraction failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to extract text from parsed content
function extractTextContent(parsedContent: any): string {
  if (!parsedContent) {
    console.log('⚠️ No parsedContent provided');
    return '';
  }
  
  console.log('📊 Detecting parsedContent structure:', Object.keys(parsedContent));
  
  // PRIORIDADE 1: Estrutura do parse-study (Unstructured API)
  if (parsedContent.elements || parsedContent.sections || parsedContent.tables) {
    let text = '';
    
    // Extrair de "elements" (formato raw do Unstructured API)
    if (Array.isArray(parsedContent.elements)) {
      console.log(`📄 Extracting from ${parsedContent.elements.length} elements`);
      text = parsedContent.elements
        .map((el: any) => el.text || '')
        .filter((t: string) => t.trim())
        .join('\n\n');
    }
    
    // Ou extrair de "sections" (formato estruturado do parse-study)
    else if (Array.isArray(parsedContent.sections)) {
      console.log(`📚 Extracting from ${parsedContent.sections.length} sections`);
      text = parsedContent.sections
        .map((section: any) => {
          const title = section.title || '';
          const content = Array.isArray(section.content)
            ? section.content.map((c: any) => c.text || '').join('\n')
            : (section.text || '');
          return `### ${title}\n${content}`;
        })
        .join('\n\n');
    }
    
    // Incluir tabelas se existirem
    if (Array.isArray(parsedContent.tables) && parsedContent.tables.length > 0) {
      console.log(`📊 Including ${parsedContent.tables.length} tables`);
      text += '\n\n### TABLES\n' + parsedContent.tables
        .map((t: any) => t.text || '')
        .join('\n\n');
    }
    
    console.log(`✅ Extracted ${text.length} chars from parse-study structure`);
    console.log(`📝 Preview: ${text.substring(0, 200)}...`);
    return text.slice(0, 50000);
  }
  
  // PRIORIDADE 2: Estrutura do gemini-file-search (ExtractedStudyData)
  if (parsedContent.abstract || parsedContent.nutraceuticals || parsedContent.conditions) {
    console.log('🤖 Using gemini-file-search structure');
    let text = '';
    if (parsedContent.title) text += `Title: ${parsedContent.title}\n\n`;
    if (parsedContent.abstract) text += `Abstract: ${parsedContent.abstract}\n\n`;
    if (parsedContent.authors?.length) text += `Authors: ${parsedContent.authors.join(', ')}\n\n`;
    if (parsedContent.year) text += `Year: ${parsedContent.year}\n\n`;
    if (parsedContent.journal) text += `Journal: ${parsedContent.journal}\n\n`;
    
    // Include nutraceuticals already extracted by gemini
    if (parsedContent.nutraceuticals?.length) {
      text += '\n\nNutraceuticals found in study:\n';
      parsedContent.nutraceuticals.forEach((n: any) => {
        text += `- ${n.name}`;
        if (n.dosage) text += ` (Dosage: ${n.dosage})`;
        if (n.effects) text += `: ${n.effects}`;
        text += '\n';
      });
    }
    
    // Include conditions already extracted
    if (parsedContent.conditions?.length) {
      text += '\n\nHealth conditions addressed:\n';
      parsedContent.conditions.forEach((c: any) => {
        text += `- ${c.name} (${c.relationship_type})`;
        if (c.efficacy_description) text += `: ${c.efficacy_description}`;
        text += '\n';
      });
    }
    
    console.log(`✅ Extracted ${text.length} chars from gemini structure`);
    return text.slice(0, 50000);
  }
  
  console.error('❌ Unknown parsedContent structure - cannot extract text');
  console.error('Available keys:', Object.keys(parsedContent));
  return '';
}

// Calculate extraction quality score
function calculateQualityScore(extracted: any): number {
  let score = 0;
  
  // Check completeness
  if (extracted.nutraceuticals?.length > 0) score += 25;
  if (extracted.conditions?.length > 0) score += 25;
  if (extracted.mechanisms?.length > 0) score += 20;
  if (extracted.findings?.length > 0) score += 20;
  
  // Check detail level
  const hasDetailedNutraceuticals = extracted.nutraceuticals?.some((n: any) => n.dosage || n.efficacy_score);
  if (hasDetailedNutraceuticals) score += 5;
  
  const hasDetailedConditions = extracted.conditions?.some((c: any) => c.severity || c.treatability_score);
  if (hasDetailedConditions) score += 5;

  return Math.min(score, 100);
}
