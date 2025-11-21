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
    
    console.log(`✅ Estudo encontrado: ${studyData.title || 'sem título'} (study_id: ${studyData.study_id})`);

    const parsedContent = studyData.analysis_data;
    
    // Prepare text content for LLM
    const textContent = extractTextContent(parsedContent);
    
    console.log(`Extracting entities from study ${studyId} using Lovable AI`);

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
Extract structured information from scientific studies with high precision.
Focus on: nutraceuticals, health conditions, mechanisms of action, dosages, and clinical findings.`
          },
          {
            role: 'user',
            content: `Extract all relevant scientific entities from this veterinary study:\n\nTitle: ${studyData.title}\n\nContent:\n${textContent}`
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
    console.log(`🔄 Atualizando status do estudo para 'extracted'...`);
    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({ kanban_status: 'extracted' })
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
  if (!parsedContent || !parsedContent.sections) {
    return '';
  }

  return parsedContent.sections
    .map((section: any) => {
      const title = section.title || '';
      const content = section.content
        ?.map((c: any) => c.text || '')
        .join('\n') || '';
      return `${title}\n${content}`;
    })
    .join('\n\n')
    .slice(0, 50000); // Limit to ~50k chars for context window
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
