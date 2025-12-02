import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripletRequest {
  studyId: string;
}

// Entity layer mapping
const ENTITY_LAYERS: Record<string, string> = {
  'nutraceutical': 'layer_0_compound',
  'drug': 'layer_0_compound',
  'chemical_compound': 'layer_0_compound',
  'pathway': 'layer_1_target',
  'receptor': 'layer_1_target',
  'enzyme': 'layer_1_target',
  'gene_protein': 'layer_1_target',
  'mechanism': 'layer_2_mechanism',
  'signaling_cascade': 'layer_2_mechanism',
  'biological_effect': 'layer_3_effect',
  'side_effect': 'layer_3_effect',
  'clinical_outcome': 'layer_4_outcome',
  'condition': 'layer_4_outcome',
  'disease': 'layer_4_outcome',
  'breed': 'context',
  'species': 'context',
  'age_group': 'context',
  'study': 'context'
};

// Valid relationship types from expanded schema
const VALID_RELATIONSHIPS = [
  'INHIBITS', 'ACTIVATES', 'MODULATES', 'BINDS_TO', 'BLOCKS',
  'UPREGULATES', 'DOWNREGULATES', 'TRIGGERS', 'PARTICIPATES_IN', 'REGULATES',
  'PRODUCES', 'LEADS_TO', 'CAUSES', 'TREATS', 'PREVENTS', 'SUPPORTS',
  'AMELIORATES', 'MANAGES', 'WORSENS', 'CONTRAINDICATED_FOR',
  'CAUSES_SIDE_EFFECT', 'AGGRAVATES', 'SYNERGIZES_WITH', 'ANTAGONIZES',
  'ENHANCES_BIOAVAILABILITY', 'REDUCES_BIOAVAILABILITY', 'REQUIRES', 'POTENTIATES',
  'PREDISPOSED_IN', 'COMMON_IN', 'CITED_IN', 'STUDIED_IN'
];

/**
 * VetGraphRAG Edge Function - Hierarchical Triplet Extraction
 * Extracts complete Layer 0→4 hierarchy with enriched relationship properties
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId }: TripletRequest = await req.json();

    if (!studyId) {
      return new Response(
        JSON.stringify({ error: 'studyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch processed study data
    const { data: study, error: studyError } = await supabase
      .from('processed_studies')
      .select('id, title, analysis_data, full_text_content, authors, year, journal')
      .eq('id', studyId)
      .single();

    if (studyError || !study) {
      return new Response(
        JSON.stringify({ error: 'Study not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = study.analysis_data || {};
    const extractedNutraceuticals = analysisData.extractedNutraceuticals || [];
    const extractedConditions = analysisData.extractedConditions || [];
    const extractedMechanisms = analysisData.extractedMechanisms || [];
    const extractedEffects = analysisData.extractedEffects || [];
    const extractedTargets = analysisData.extractedTargets || [];
    const extractedPathways = analysisData.extractedPathways || [];

    // Fetch configurable prompts
    const { data: systemPromptConfig } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'prompt_triplet_extraction_system_v2')
      .eq('is_active', true)
      .single();

    const { data: userPromptConfig } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'prompt_triplet_extraction_user_v2')
      .eq('is_active', true)
      .single();

    // VetGraphRAG Hierarchical System Prompt - Generic (no hardcoded examples)
    const DEFAULT_SYSTEM_PROMPT = `You are a VetGraphRAG knowledge extraction expert for veterinary nutraceutical science. Extract COMPLETE HIERARCHICAL MECHANISM CHAINS from scientific studies.

## HIERARCHICAL MODEL (5 Layers)

**Layer 0 - Compounds (Input):**
- Types: nutraceutical, drug, chemical_compound
- Extract compounds ONLY from the study being analyzed

**Layer 1 - Molecular Targets:**
- Types: pathway, receptor, enzyme, gene_protein
- Extract targets ONLY from the study being analyzed

**Layer 2 - Mechanisms:**
- Types: mechanism, signaling_cascade
- Extract mechanisms ONLY from the study being analyzed

**Layer 3 - Biological Effects:**
- Types: biological_effect, side_effect
- Extract effects ONLY from the study being analyzed

**Layer 4 - Clinical Outcomes:**
- Types: condition, disease, clinical_outcome
- Extract outcomes ONLY from the study being analyzed

## RELATIONSHIP TYPES (Use EXACTLY these predicates)

**Direct Actions (L0→L1):**
- INHIBITS (with IC50, Ki if available)
- ACTIVATES (with EC50 if available)
- MODULATES, BINDS_TO, BLOCKS, UPREGULATES, DOWNREGULATES

**Cascade Flow (L1→L2→L3):**
- TRIGGERS, PARTICIPATES_IN, REGULATES, PRODUCES, LEADS_TO, CAUSES

**Therapeutic (L3→L4 or L0→L4):**
- TREATS (with efficacy_score 0-1, evidence_level: high/moderate/low/very_low)
- PREVENTS, SUPPORTS, AMELIORATES, MANAGES

**Adverse (Any→L4):**
- WORSENS, CONTRAINDICATED_FOR, CAUSES_SIDE_EFFECT, AGGRAVATES

**Compound Interactions (L0↔L0):**
- SYNERGIZES_WITH (with synergy_score, mechanism description)
- ANTAGONIZES
- ENHANCES_BIOAVAILABILITY
- REDUCES_BIOAVAILABILITY
- REQUIRES, POTENTIATES

**Context:**
- PREDISPOSED_IN (breed/species), COMMON_IN, CITED_IN, STUDIED_IN

## CRITICAL EXTRACTION RULES

1. **Extract ONLY from the provided study** - DO NOT use examples from other studies
2. **Extract COMPLETE mechanism chains**: Nutraceutical → Target → Mechanism → Effect → Condition
3. **Include ALL intermediate steps** - don't skip layers
4. **Quantify when possible**: efficacy_score (0-1), intensity (0-1), confidence (0-1)
5. **Species context**: Include species_context array (e.g., ["canine", "feline"])
6. **Dose information**: Include dose_range if mentioned {min, max, unit}
7. **Evidence level**: high (RCT), moderate (cohort), low (case series), very_low (case report)
8. **DO NOT invent synergies** - only include if explicitly mentioned in the study
9. **DO NOT hallucinate compounds** - only extract what is actually in the document

## OUTPUT FORMAT

Return JSON with this structure:
{
  "triplets": [
    {
      "subject_type": "nutraceutical",
      "subject_name": "[COMPOUND FROM THIS STUDY]",
      "predicate": "[VALID_PREDICATE]",
      "object_type": "[ENTITY_TYPE]",
      "object_name": "[ENTITY FROM THIS STUDY]",
      "properties": {
        "intensity": 0.75,
        "confidence": 0.92,
        "evidence_level": "high",
        "species_context": ["canine"],
        "dose_range": {"min": 15, "max": 30, "unit": "mg/kg/day"}
      },
      "mechanism_path": [
        {"from": "[COMPOUND]", "relation": "[PREDICATE]", "to": "[TARGET]"}
      ]
    }
  ],
  "synergies": [],
  "contraindications": []
}`;

    const DEFAULT_USER_PROMPT = `Extract COMPLETE HIERARCHICAL KNOWLEDGE from this veterinary nutraceutical study:

## STUDY INFORMATION
**Title:** {{TITLE}}
**Authors:** {{AUTHORS}}
**Year:** {{YEAR}}
**Journal:** {{JOURNAL}}

## EXTRACTED ENTITIES (Pre-identified)
- **Nutraceuticals (L0):** {{NUTRACEUTICALS}}
- **Targets (L1):** {{TARGETS}}
- **Pathways (L1):** {{PATHWAYS}}
- **Mechanisms (L2):** {{MECHANISMS}}
- **Effects (L3):** {{EFFECTS}}
- **Conditions (L4):** {{CONDITIONS}}

## FULL TEXT EXCERPT
{{FULL_TEXT}}

## EXTRACTION TASKS

1. **Extract COMPLETE mechanism chains (L0→L1→L2→L3→L4)**
   - Don't skip intermediate layers
   - Include mechanism_path array showing full chain

2. **Direct therapeutic relationships (L0→L4)**
   - Include efficacy_score, evidence_level, species_context

3. **Compound interactions (L0↔L0)**
   - Synergies with synergy_score and mechanism
   - Antagonisms and bioavailability effects

4. **Adverse effects and contraindications**
   - WORSENS, CONTRAINDICATED_FOR, CAUSES_SIDE_EFFECT

5. **Quantitative data**
   - IC50, EC50, Ki values if mentioned
   - Dose ranges with units
   - Response rates, NNT if available

Generate comprehensive triplets covering ALL relationships found in the study.`;

    const systemPrompt = typeof systemPromptConfig?.config_value === 'string' 
      ? systemPromptConfig.config_value 
      : DEFAULT_SYSTEM_PROMPT;
    
    let userPrompt = typeof userPromptConfig?.config_value === 'string'
      ? userPromptConfig.config_value
      : DEFAULT_USER_PROMPT;

    // Replace template variables
    userPrompt = userPrompt
      .replace('{{TITLE}}', study.title || 'N/A')
      .replace('{{AUTHORS}}', Array.isArray(study.authors) ? study.authors.join(', ') : 'N/A')
      .replace('{{YEAR}}', study.year?.toString() || 'N/A')
      .replace('{{JOURNAL}}', study.journal || 'N/A')
      .replace('{{NUTRACEUTICALS}}', extractedNutraceuticals.map((n: any) => n.name).join(', ') || 'None identified')
      .replace('{{TARGETS}}', extractedTargets.map((t: any) => t.name).join(', ') || 'None identified')
      .replace('{{PATHWAYS}}', extractedPathways.map((p: any) => p.name).join(', ') || 'None identified')
      .replace('{{MECHANISMS}}', extractedMechanisms.map((m: any) => m.name).join(', ') || 'None identified')
      .replace('{{EFFECTS}}', extractedEffects.map((e: any) => e.name).join(', ') || 'None identified')
      .replace('{{CONDITIONS}}', extractedConditions.map((c: any) => c.name).join(', ') || 'None identified')
      .replace('{{FULL_TEXT}}', (study.full_text_content || '').substring(0, 8000) || 'Not available');

    // Call Lovable AI with Gemini 3 Pro Preview
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    
    console.log(`Generating hierarchical triplets for study: ${studyId}`);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Lovable AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const tripletContent = aiData.choices[0].message.content;
    
    // Parse AI response
    let parsedResponse: any = { triplets: [], synergies: [], contraindications: [] };
    try {
      parsedResponse = JSON.parse(tripletContent);
    } catch (e) {
      console.error('Failed to parse AI response:', tripletContent);
      throw new Error('Invalid AI response format');
    }

    const triplets = Array.isArray(parsedResponse.triplets) ? parsedResponse.triplets : [];
    const synergies = Array.isArray(parsedResponse.synergies) ? parsedResponse.synergies : [];

    // Process and enrich triplets with KG matching
    const tripletsWithScores = await Promise.all(triplets.map(async (t: any) => {
      let subjectMatchScore = 0;
      let objectMatchScore = 0;
      let subjectId = null;
      let objectId = null;

      const subjectType = (t.subject_type || 'unknown').toLowerCase();
      const objectType = (t.object_type || 'unknown').toLowerCase();
      const subjectLayer = ENTITY_LAYERS[subjectType] || 'unknown';
      const objectLayer = ENTITY_LAYERS[objectType] || 'unknown';

      // Validate predicate
      const predicate = VALID_RELATIONSHIPS.includes(t.predicate) ? t.predicate : 'MODULATES';

      // KG Matching - Subject
      if (subjectType === 'nutraceutical' && t.subject_name) {
        const { data: match } = await supabase
          .from('nutraceuticals')
          .select('id')
          .or(`name.ilike.%${t.subject_name}%,name_en.ilike.%${t.subject_name}%`)
          .limit(1)
          .single();
        if (match) {
          subjectMatchScore = 1.0;
          subjectId = match.id;
        }
      } else if (subjectType === 'pathway' && t.subject_name) {
        const { data: match } = await supabase
          .from('pathway_nodes')
          .select('id')
          .or(`name.ilike.%${t.subject_name}%,name_en.ilike.%${t.subject_name}%`)
          .limit(1)
          .single();
        if (match) {
          subjectMatchScore = 1.0;
          subjectId = match.id;
        }
      } else if (subjectType === 'mechanism' && t.subject_name) {
        const { data: match } = await supabase
          .from('mechanism_nodes')
          .select('id')
          .or(`name.ilike.%${t.subject_name}%,name_en.ilike.%${t.subject_name}%`)
          .limit(1)
          .single();
        if (match) {
          subjectMatchScore = 1.0;
          subjectId = match.id;
        }
      } else if (subjectType === 'biological_effect' && t.subject_name) {
        const { data: match } = await supabase
          .from('biological_effect_nodes')
          .select('id')
          .or(`name.ilike.%${t.subject_name}%,name_en.ilike.%${t.subject_name}%`)
          .limit(1)
          .single();
        if (match) {
          subjectMatchScore = 1.0;
          subjectId = match.id;
        }
      }

      // KG Matching - Object
      if ((objectType === 'condition' || objectType === 'disease') && t.object_name) {
        const { data: match } = await supabase
          .from('health_conditions')
          .select('id')
          .or(`name.ilike.%${t.object_name}%,name_en.ilike.%${t.object_name}%`)
          .limit(1)
          .single();
        if (match) {
          objectMatchScore = 1.0;
          objectId = match.id;
        }
      } else if (objectType === 'nutraceutical' && t.object_name) {
        const { data: match } = await supabase
          .from('nutraceuticals')
          .select('id')
          .or(`name.ilike.%${t.object_name}%,name_en.ilike.%${t.object_name}%`)
          .limit(1)
          .single();
        if (match) {
          objectMatchScore = 1.0;
          objectId = match.id;
        }
      } else if (objectType === 'pathway' && t.object_name) {
        const { data: match } = await supabase
          .from('pathway_nodes')
          .select('id')
          .or(`name.ilike.%${t.object_name}%,name_en.ilike.%${t.object_name}%`)
          .limit(1)
          .single();
        if (match) {
          objectMatchScore = 1.0;
          objectId = match.id;
        }
      } else if (objectType === 'mechanism' && t.object_name) {
        const { data: match } = await supabase
          .from('mechanism_nodes')
          .select('id')
          .or(`name.ilike.%${t.object_name}%,name_en.ilike.%${t.object_name}%`)
          .limit(1)
          .single();
        if (match) {
          objectMatchScore = 1.0;
          objectId = match.id;
        }
      } else if (objectType === 'biological_effect' && t.object_name) {
        const { data: match } = await supabase
          .from('biological_effect_nodes')
          .select('id')
          .or(`name.ilike.%${t.object_name}%,name_en.ilike.%${t.object_name}%`)
          .limit(1)
          .single();
        if (match) {
          objectMatchScore = 1.0;
          objectId = match.id;
        }
      }

      // Extract properties
      const props = t.properties || {};
      const kgMatchScore = (subjectMatchScore + objectMatchScore) / 2;
      const llmConfidence = props.confidence || t.llm_confidence || 0.7;
      const extractionConfidence = (llmConfidence * 0.6) + (kgMatchScore * 0.4);

      // Determine auto-approval
      const autoApproved = extractionConfidence >= 0.85 && kgMatchScore >= 0.5;

      return {
        study_id: studyId,
        subject_type: subjectType,
        subject_name: t.subject_name,
        subject_id: subjectId,
        subject_layer: subjectLayer,
        predicate: predicate,
        object_type: objectType,
        object_name: t.object_name,
        object_id: objectId,
        object_layer: objectLayer,
        // New hierarchical fields
        intensity: props.intensity || null,
        direction: props.direction || (predicate.includes('INHIBITS') || predicate.includes('DECREASES') ? 'negative' : 'positive'),
        evidence_level: props.evidence_level || null,
        dose_dependent: props.dose_dependent || false,
        dose_range: props.dose_range || null,
        species_context: props.species_context || null,
        mechanism_path: t.mechanism_path || null,
        relationship_category: getRelationshipCategory(predicate),
        // Synergy data if applicable
        synergy_data: predicate === 'SYNERGIZES_WITH' || predicate === 'ANTAGONIZES' ? {
          synergy_score: props.synergy_score,
          mechanism: props.mechanism,
          enhancement_factor: props.enhancement_factor,
          optimal_ratio: props.optimal_ratio
        } : null,
        // Confidence scores
        llm_confidence: llmConfidence,
        kg_match_score: kgMatchScore,
        extraction_confidence: extractionConfidence,
        // Curation status
        curation_status: autoApproved ? 'approved' : 'pending',
        auto_approved: autoApproved,
        synced_to_neo4j: false
      };
    }));

    // Insert triplets
    const { data: insertedTriplets, error: insertError } = await supabase
      .from('triplet_extractions')
      .insert(tripletsWithScores)
      .select();

    if (insertError) {
      console.error('Error inserting triplets:', insertError);
      throw insertError;
    }

    // Also create hierarchical_edges for high-confidence triplets
    const highConfidenceTriplets = tripletsWithScores.filter(t => t.extraction_confidence >= 0.7);
    if (highConfidenceTriplets.length > 0) {
      const hierarchicalEdges = highConfidenceTriplets.map(t => ({
        source_id: t.subject_id || t.study_id, // Use study_id as fallback
        source_type: t.subject_type,
        source_layer: t.subject_layer,
        target_id: t.object_id || t.study_id,
        target_type: t.object_type,
        target_layer: t.object_layer,
        relationship: t.predicate,
        intensity: t.intensity,
        confidence: t.extraction_confidence,
        evidence_level: t.evidence_level,
        dose_range: t.dose_range,
        species_validated: t.species_context,
        study_ids: [studyId],
        triplet_id: null, // Will be updated after insert
        curated: t.auto_approved
      }));

      const { error: edgeError } = await supabase
        .from('hierarchical_edges')
        .insert(hierarchicalEdges);

      if (edgeError) {
        console.warn('Warning: Could not create hierarchical edges:', edgeError);
      }
    }

    console.log(`Generated ${insertedTriplets?.length || 0} hierarchical triplets from study ${studyId}`);
    console.log(`Auto-approved: ${insertedTriplets?.filter((t: any) => t.auto_approved).length || 0}`);
    console.log(`Synergies found: ${synergies.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        studyId,
        triplets: insertedTriplets,
        count: insertedTriplets?.length || 0,
        autoApproved: insertedTriplets?.filter((t: any) => t.auto_approved).length || 0,
        synergiesExtracted: synergies.length,
        hierarchicalEdgesCreated: highConfidenceTriplets.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-triplets:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Categorize relationship type for filtering
 */
function getRelationshipCategory(predicate: string): string {
  const categories: Record<string, string[]> = {
    'direct_action': ['INHIBITS', 'ACTIVATES', 'MODULATES', 'BINDS_TO', 'BLOCKS', 'UPREGULATES', 'DOWNREGULATES'],
    'cascade': ['TRIGGERS', 'PARTICIPATES_IN', 'REGULATES', 'PRODUCES', 'LEADS_TO', 'CAUSES'],
    'therapeutic': ['TREATS', 'PREVENTS', 'SUPPORTS', 'AMELIORATES', 'MANAGES'],
    'adverse': ['WORSENS', 'CONTRAINDICATED_FOR', 'CAUSES_SIDE_EFFECT', 'AGGRAVATES'],
    'interaction': ['SYNERGIZES_WITH', 'ANTAGONIZES', 'ENHANCES_BIOAVAILABILITY', 'REDUCES_BIOAVAILABILITY', 'REQUIRES', 'POTENTIATES'],
    'context': ['PREDISPOSED_IN', 'COMMON_IN', 'CITED_IN', 'STUDIED_IN']
  };

  for (const [category, predicates] of Object.entries(categories)) {
    if (predicates.includes(predicate)) {
      return category;
    }
  }
  return 'other';
}
