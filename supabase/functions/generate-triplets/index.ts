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

// Map direction values to allowed constraint values: NULL, 'improves', 'worsens', 'neutral', 'bidirectional'
function mapDirection(direction: string | null | undefined, predicate: string): string | null {
  const validDirections = ['improves', 'worsens', 'neutral', 'bidirectional'];
  if (direction && validDirections.includes(direction.toLowerCase())) {
    return direction.toLowerCase();
  }
  
  const worseningPredicates = ['INHIBITS', 'BLOCKS', 'DOWNREGULATES', 'WORSENS', 'AGGRAVATES', 'CONTRAINDICATED_FOR', 'CAUSES_SIDE_EFFECT', 'ANTAGONIZES', 'REDUCES_BIOAVAILABILITY'];
  const improvingPredicates = ['ACTIVATES', 'UPREGULATES', 'TREATS', 'PREVENTS', 'SUPPORTS', 'AMELIORATES', 'MANAGES', 'SYNERGIZES_WITH', 'ENHANCES_BIOAVAILABILITY', 'POTENTIATES'];
  const neutralPredicates = ['MODULATES', 'BINDS_TO', 'PARTICIPATES_IN', 'REGULATES', 'TRIGGERS', 'PRODUCES', 'LEADS_TO', 'CAUSES', 'REQUIRES', 'PREDISPOSED_IN', 'COMMON_IN', 'CITED_IN', 'STUDIED_IN'];
  
  if (worseningPredicates.some(p => predicate.includes(p))) {
    return 'worsens';
  }
  if (improvingPredicates.some(p => predicate.includes(p))) {
    return 'improves';
  }
  if (neutralPredicates.some(p => predicate.includes(p))) {
    return 'neutral';
  }
  
  return null;
}

/**
 * VetGraphRAG Edge Function - TWO-PHASE Hierarchical Triplet Extraction
 * Phase 1: Free discovery without constraints to capture ALL biological pathways
 * Phase 2: Structure discovered knowledge into triplets
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const fullTextContent = (study.full_text_content || '').substring(0, 12000);
    
    console.log(`🔬 PHASE 1: Free Discovery for study: ${studyId}`);
    console.log(`📄 Title: ${study.title}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: FREE DISCOVERY - No structured output, capture ALL biological knowledge
    // ═══════════════════════════════════════════════════════════════════════════
    
    const phase1SystemPrompt = `You are a veterinary biochemistry expert specializing in nutraceutical mechanisms. Your task is to perform DEEP ANALYSIS of scientific studies to extract ALL biological pathways and mechanisms.

## YOUR MISSION
Read the study carefully and identify EVERY biological pathway, molecular mechanism, and cause-effect chain mentioned. Be extremely thorough - we want to capture the complete biological picture.

## WHAT TO EXTRACT

### 1. COMPLETE SIGNALING CASCADES
Write out full pathway chains using arrow notation, like:
- Astaxanthin → inhibits NF-κB → reduces TNF-α → decreases inflammation → improves joint health
- NEFA accumulation → activates TLR4 → triggers MyD88 → activates NF-κB → increases IL-6 → chronic inflammation
- Omega-3 → incorporates into cell membrane → displaces arachidonic acid → reduces PGE2 → anti-inflammatory effect

### 2. MOLECULAR TARGETS
For each compound, list:
- Receptors it binds (PPARγ, TLR4, CB2, etc.)
- Enzymes it affects (COX-2, LOX, PLA2, etc.)
- Transcription factors it modulates (NF-κB, Nrf2, AP-1, etc.)
- Gene expression changes

### 3. DOSE-RESPONSE RELATIONSHIPS
- What doses were tested?
- What effects at what concentrations?
- Any IC50, EC50, or Ki values mentioned?

### 4. SPECIES-SPECIFIC FINDINGS
- Which species were studied? (canine, feline, equine, etc.)
- Any breed-specific effects?
- Age-related considerations?

### 5. CLINICAL OUTCOMES
- What health conditions were addressed?
- What measurable outcomes improved?
- What was the efficacy (percentage improvement, response rate)?

### 6. ADVERSE EFFECTS & CONTRAINDICATIONS
- Any side effects mentioned?
- Drug interactions?
- Contraindicated conditions?

### 7. SYNERGIES & INTERACTIONS
- Compounds that work better together
- Compounds that interfere with each other
- Bioavailability enhancers

## OUTPUT FORMAT
Write in natural language, organized by sections. Be EXHAUSTIVE. Don't skip any mechanism or pathway mentioned in the study.`;

    const phase1UserPrompt = `Analyze this veterinary nutraceutical study and extract ALL biological mechanisms and pathways:

**Title:** ${study.title || 'N/A'}
**Authors:** ${Array.isArray(study.authors) ? study.authors.join(', ') : 'N/A'}
**Year:** ${study.year || 'N/A'}
**Journal:** ${study.journal || 'N/A'}

**FULL TEXT:**
${fullTextContent}

---

Please provide a comprehensive analysis covering:
1. All signaling cascades (write them as: A → B → C → D format)
2. All molecular targets (receptors, enzymes, transcription factors)
3. Dose-response data
4. Species/breed findings
5. Clinical outcomes with efficacy data
6. Adverse effects
7. Compound interactions/synergies

Be thorough - capture EVERY biological relationship mentioned in this study.`;

    const phase1Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: phase1SystemPrompt },
          { role: 'user', content: phase1UserPrompt }
        ]
        // NO response_format - we want free text
      }),
    });

    if (!phase1Response.ok) {
      if (phase1Response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (phase1Response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await phase1Response.text();
      console.error('Phase 1 AI error:', phase1Response.status, errorText);
      throw new Error(`Phase 1 AI request failed: ${phase1Response.status}`);
    }

    const phase1Data = await phase1Response.json();
    const freeDiscoveryText = phase1Data.choices[0].message.content;
    
    console.log(`✅ Phase 1 complete. Discovery length: ${freeDiscoveryText.length} chars`);
    console.log(`📝 Discovery preview: ${freeDiscoveryText.substring(0, 500)}...`);

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: STRUCTURING - Convert free discovery into structured triplets
    // ═══════════════════════════════════════════════════════════════════════════
    
    console.log(`🔄 PHASE 2: Structuring discovered knowledge into triplets`);

    const phase2SystemPrompt = `You are a knowledge graph expert. Convert the biological analysis into structured triplets for a VetGraphRAG database.

## ENTITY TYPES (use exactly these)
- Layer 0 (Compounds): nutraceutical, drug, chemical_compound
- Layer 1 (Targets): pathway, receptor, enzyme, gene_protein
- Layer 2 (Mechanisms): mechanism, signaling_cascade
- Layer 3 (Effects): biological_effect, side_effect
- Layer 4 (Outcomes): condition, disease, clinical_outcome

## RELATIONSHIP TYPES (use exactly these predicates)
Direct Actions: INHIBITS, ACTIVATES, MODULATES, BINDS_TO, BLOCKS, UPREGULATES, DOWNREGULATES
Cascade: TRIGGERS, PARTICIPATES_IN, REGULATES, PRODUCES, LEADS_TO, CAUSES
Therapeutic: TREATS, PREVENTS, SUPPORTS, AMELIORATES, MANAGES
Adverse: WORSENS, CONTRAINDICATED_FOR, CAUSES_SIDE_EFFECT, AGGRAVATES
Interactions: SYNERGIZES_WITH, ANTAGONIZES, ENHANCES_BIOAVAILABILITY, REDUCES_BIOAVAILABILITY, REQUIRES, POTENTIATES
Context: PREDISPOSED_IN, COMMON_IN, CITED_IN, STUDIED_IN

## CRITICAL RULES
1. For each pathway chain (A → B → C → D), create INDIVIDUAL triplets for each step:
   - A → B (one triplet)
   - B → C (one triplet)
   - C → D (one triplet)
2. Include quantitative properties when available (efficacy_score 0-1, intensity 0-1, confidence 0-1)
3. Include species_context array (e.g., ["canine"])
4. Include dose_range if mentioned: {"min": X, "max": Y, "unit": "mg/kg"}
5. Include evidence_level: "high", "moderate", "low", or "very_low"
6. Include IC50, EC50, Ki values in properties if mentioned

## OUTPUT FORMAT (JSON)
{
  "triplets": [
    {
      "subject_type": "nutraceutical",
      "subject_name": "Astaxanthin",
      "predicate": "INHIBITS",
      "object_type": "pathway",
      "object_name": "NF-κB signaling",
      "properties": {
        "intensity": 0.8,
        "confidence": 0.9,
        "evidence_level": "high",
        "species_context": ["canine"],
        "dose_range": {"min": 10, "max": 20, "unit": "mg/kg/day"},
        "ic50": "5 µM"
      },
      "mechanism_path": [
        {"from": "Astaxanthin", "relation": "INHIBITS", "to": "NF-κB signaling"},
        {"from": "NF-κB signaling", "relation": "REDUCES", "to": "TNF-α production"}
      ]
    }
  ],
  "pathway_chains": [
    "Astaxanthin → inhibits IKK-β → prevents IκB phosphorylation → blocks NF-κB nuclear translocation → reduces TNF-α → decreases inflammation"
  ],
  "synergies": [],
  "contraindications": []
}`;

    const phase2UserPrompt = `Convert this biological analysis into structured triplets:

## ORIGINAL STUDY
Title: ${study.title}

## DISCOVERED BIOLOGICAL KNOWLEDGE
${freeDiscoveryText}

---

Generate comprehensive triplets covering:
1. ALL signaling pathway steps (break chains into individual triplets)
2. ALL molecular target interactions
3. ALL therapeutic relationships with efficacy scores
4. ALL adverse effects and contraindications
5. ALL compound synergies/interactions

IMPORTANT: Include the full pathway_chains array showing the complete chains discovered.`;

    // Define tool for structured triplet extraction (recommended approach for Gemini 3)
    const extractTripletsToolDef = {
      type: "function",
      function: {
        name: "extract_triplets",
        description: "Extract structured biological triplets from the analysis",
        parameters: {
          type: "object",
          properties: {
            triplets: {
              type: "array",
              description: "Array of biological relationship triplets",
              items: {
                type: "object",
                properties: {
                  subject_type: { type: "string", description: "Entity type of subject" },
                  subject_name: { type: "string", description: "Name of subject entity" },
                  predicate: { type: "string", description: "Relationship type" },
                  object_type: { type: "string", description: "Entity type of object" },
                  object_name: { type: "string", description: "Name of object entity" },
                  properties: {
                    type: "object",
                    properties: {
                      intensity: { type: "number" },
                      confidence: { type: "number" },
                      evidence_level: { type: "string" },
                      species_context: { type: "array", items: { type: "string" } },
                      dose_range: { type: "object" },
                      ic50: { type: "string" },
                      ec50: { type: "string" }
                    }
                  },
                  mechanism_path: { type: "array", items: { type: "object" } }
                },
                required: ["subject_type", "subject_name", "predicate", "object_type", "object_name"]
              }
            },
            pathway_chains: {
              type: "array",
              description: "Complete pathway chains in A → B → C format",
              items: { type: "string" }
            },
            synergies: {
              type: "array",
              description: "Compound synergies discovered",
              items: { type: "object" }
            },
            contraindications: {
              type: "array",
              description: "Contraindications discovered",
              items: { type: "object" }
            }
          },
          required: ["triplets", "pathway_chains"]
        }
      }
    };

    const phase2Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: phase2SystemPrompt },
          { role: 'user', content: phase2UserPrompt }
        ],
        tools: [extractTripletsToolDef],
        tool_choice: { type: "function", function: { name: "extract_triplets" } }
      }),
    });

    if (!phase2Response.ok) {
      if (phase2Response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (phase2Response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await phase2Response.text();
      console.error('Phase 2 AI error:', phase2Response.status, errorText);
      throw new Error(`Phase 2 AI request failed: ${phase2Response.status}`);
    }

    const phase2Data = await phase2Response.json();
    console.log('Phase 2 raw response:', JSON.stringify(phase2Data, null, 2).substring(0, 1000));
    
    // Parse AI response from tool call
    let parsedResponse: any = { triplets: [], pathway_chains: [], synergies: [], contraindications: [] };
    try {
      const toolCalls = phase2Data.choices?.[0]?.message?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        // Tool calling response
        const toolCall = toolCalls[0];
        parsedResponse = JSON.parse(toolCall.function.arguments);
        console.log('✅ Parsed from tool call');
      } else if (phase2Data.choices?.[0]?.message?.content) {
        // Fallback: try to parse from content (might be JSON or markdown-wrapped JSON)
        let content = phase2Data.choices[0].message.content;
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedResponse = JSON.parse(content);
        console.log('✅ Parsed from content');
      } else {
        console.error('Unexpected Phase 2 response structure:', JSON.stringify(phase2Data, null, 2));
        throw new Error('No valid response from AI');
      }
    } catch (e) {
      console.error('Failed to parse Phase 2 response:', e);
      console.error('Raw phase2Data:', JSON.stringify(phase2Data, null, 2));
      throw new Error('Invalid AI response format in Phase 2');
    }

    const triplets = Array.isArray(parsedResponse.triplets) ? parsedResponse.triplets : [];
    const pathwayChains = Array.isArray(parsedResponse.pathway_chains) ? parsedResponse.pathway_chains : [];
    const synergies = Array.isArray(parsedResponse.synergies) ? parsedResponse.synergies : [];

    console.log(`✅ Phase 2 complete. Generated ${triplets.length} triplets`);
    console.log(`🔗 Pathway chains discovered: ${pathwayChains.length}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // ENRICHMENT: Match entities to knowledge graph and calculate confidence
    // ═══════════════════════════════════════════════════════════════════════════

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
        // Hierarchical fields
        intensity: props.intensity || null,
        direction: mapDirection(props.direction, predicate),
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

    // Create hierarchical_edges for high-confidence triplets
    const highConfidenceTriplets = tripletsWithScores.filter(t => t.extraction_confidence >= 0.7);
    if (highConfidenceTriplets.length > 0) {
      const hierarchicalEdges = highConfidenceTriplets.map(t => ({
        source_id: t.subject_id || t.study_id,
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
        triplet_id: null,
        curated: t.auto_approved
      }));

      const { error: edgeError } = await supabase
        .from('hierarchical_edges')
        .insert(hierarchicalEdges);

      if (edgeError) {
        console.warn('Warning: Could not create hierarchical edges:', edgeError);
      }
    }

    // Store the free discovery text for reference
    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({
        analysis_data: {
          ...(study.analysis_data || {}),
          phase1_discovery: freeDiscoveryText,
          pathway_chains: pathwayChains,
          extraction_timestamp: new Date().toISOString()
        }
      })
      .eq('id', studyId);

    if (updateError) {
      console.warn('Warning: Could not store discovery text:', updateError);
    }

    console.log(`🎉 TWO-PHASE EXTRACTION COMPLETE for study ${studyId}`);
    console.log(`📊 Generated ${insertedTriplets?.length || 0} triplets`);
    console.log(`✅ Auto-approved: ${insertedTriplets?.filter((t: any) => t.auto_approved).length || 0}`);
    console.log(`🔗 Pathway chains: ${pathwayChains.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        studyId,
        triplets: insertedTriplets,
        count: insertedTriplets?.length || 0,
        autoApproved: insertedTriplets?.filter((t: any) => t.auto_approved).length || 0,
        pathwayChainsDiscovered: pathwayChains,
        synergiesExtracted: synergies.length,
        hierarchicalEdgesCreated: highConfidenceTriplets.length,
        phase1DiscoveryLength: freeDiscoveryText.length
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
