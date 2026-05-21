import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAITask } from '../_shared/ai-task-router.ts';

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

// Mapping for invalid predicates to valid ones
const PREDICATE_MAPPING: Record<string, string> = {
  'HAS_MECHANISM': 'MODULATES',
  'MECHANISM': 'MODULATES',
  'INTERACTS': 'MODULATES',
  'INTERACTS_WITH': 'MODULATES',
  'AFFECTS': 'MODULATES',
  'RELATED_TO': 'MODULATES',
  'ASSOCIATED_WITH': 'MODULATES',
  'INFLUENCES': 'MODULATES',
  'IMPACTS': 'MODULATES',
  'TARGETS': 'BINDS_TO',
  'ACTS_ON': 'MODULATES',
  'INVOLVED_IN': 'PARTICIPATES_IN',
  'CONTRIBUTES_TO': 'LEADS_TO',
  'RESULTS_IN': 'PRODUCES',
  'INDUCES': 'TRIGGERS',
  'STIMULATES': 'ACTIVATES',
  'SUPPRESSES': 'INHIBITS',
  'REDUCES': 'DOWNREGULATES',
  'INCREASES': 'UPREGULATES',
  'DECREASES': 'DOWNREGULATES',
  'ENHANCES': 'ACTIVATES',
  'ATTENUATES': 'INHIBITS',
  'MITIGATES': 'AMELIORATES',
  'ALLEVIATES': 'AMELIORATES',
  'EXACERBATES': 'AGGRAVATES',
};

// Valid entity types from database CHECK constraint (CASE SENSITIVE!)
// The constraint uses PascalCase values like 'Nutraceutical', 'Mechanism', etc.
const VALID_CONSTRAINT_TYPES = [
  'Nutraceutical', 'Condition', 'HealthCondition', 'Disease', 'Mechanism', 
  'MolecularMechanism', 'Pathway', 'BiologicalProcess', 'Target', 'Compound', 
  'Symptom', 'Treatment', 'Intervention'
];

// Map entity type to valid CHECK CONSTRAINT values (PascalCase)
// CRITICAL: This function must detect when LLM misclassifies proteins/enzymes/pathways as nutraceuticals
function mapEntityType(entityType: string | null | undefined, entityName?: string): string {
  if (!entityType) return 'Mechanism'; // Default fallback
  
  const normalized = entityType.toLowerCase().replace(/[\s\-_]+/g, '');
  const nameLower = (entityName || '').toLowerCase();
  
  // ==========================================================================
  // NAME-BASED OVERRIDE PATTERNS - These take PRIORITY over LLM classification
  // ==========================================================================
  // Use these to CORRECT misclassifications by the LLM
  
  // ENZYMES: Detect enzyme names (kinases, synthases, oxidases, etc.)
  const enzymePattern = /\b(caspase|kinase|synthase|oxidase|reductase|transferase|protease|hydrolase|isomerase|ligase|lyase|phosphatase|dehydrogenase|catalase|peroxidase|cyclooxygenase|lipoxygenase|cox-?\d*|lox|pla2|mmp|dnase|rnase|atpase|nadph|nadh)\b/i;
  if (enzymePattern.test(nameLower)) {
    console.log(`🔧 Type override: "${entityName}" → Target (enzyme pattern detected)`);
    return 'Target';
  }
  
  // PROTEINS & GROWTH FACTORS: Detect protein/factor names
  const proteinPattern = /\b(vegf|gfap|bdnf|ngf|gdnf|igf|egf|fgf|pdgf|tgf|tnf|tnf-?α?|ifn|interleukin|il-?\d+|tubulin|actin|myosin|collagen|elastin|fibronectin|laminin|albumin|globulin|hemoglobin|myoglobin|ferritin|transferrin|vascular endothelial|growth factor|endothelial factor|nerve factor|brain-derived|tumor necrosis)\b/i;
  if (proteinPattern.test(nameLower)) {
    console.log(`🔧 Type override: "${entityName}" → Target (protein/factor pattern detected)`);
    return 'Target';
  }
  
  // RECEPTORS: Detect receptor names
  const receptorPattern = /\b(ppar[γαβδ]?|ppar-?gamma|ppar-?alpha|tlr\d*|toll-like|cb[12]|cannabinoid|nmda|ampa|gaba|dopamine|serotonin|5-?ht|adrenergic|muscarinic|nicotinic|opioid|angiotensin|estrogen|androgen|thyroid|insulin|leptin|adiponectin)\s*(receptor)?s?\b/i;
  if (receptorPattern.test(nameLower)) {
    console.log(`🔧 Type override: "${entityName}" → Target (receptor pattern detected)`);
    return 'Target';
  }
  
  // PATHWAYS: Detect pathway/signaling cascade names
  const pathwayPattern = /\b(pathway|signaling\s*(pathway|cascade)?|cascade|signal\s*transduction|nf-?κ?b|nfkb|ampk|mtor|mapk|erk|jnk|p38|jak|stat|pi3k|akt|wnt|notch|hedgehog|tgf-?β|β-oxidation|beta-oxidation|krebs|citric acid|glycolysis|gluconeogenesis|pentose|autophagy\s*pathway)\b/i;
  if (pathwayPattern.test(nameLower)) {
    console.log(`🔧 Type override: "${entityName}" → Pathway (pathway pattern detected)`);
    return 'Pathway';
  }
  
  // BIOLOGICAL PROCESSES: Detect process names
  const processPattern = /\b(autophagy|apoptosis|necrosis|mitophagy|ferroptosis|pyroptosis|senescence|angiogenesis|neurogenesis|oxidative\s*stress|oxidation|reduction|phosphorylation|glycolysis|metabolism|catabolism|anabolism|biosynthesis|degradation|transcription|translation|replication|inflammation|immune\s*response)\b/i;
  if (processPattern.test(nameLower) && !pathwayPattern.test(nameLower)) {
    console.log(`🔧 Type override: "${entityName}" → BiologicalProcess (process pattern detected)`);
    return 'BiologicalProcess';
  }
  
  // NUTRACEUTICALS: Only if name matches known nutraceutical patterns AND not matched above
  const nutraceuticalPattern = /\b(curcumin|resveratrol|quercetin|omega-?[369]|dha|epa|vitamin\s*[a-ek]?\d*|coq10|coenzyme\s*q|carnitine|l-carnitine|taurine|glucosamine|chondroitin|msm|astaxanthin|lutein|lycopene|beta-?carotene|α-?tocopherol|tocopherol|probiotics?|prebiotics?|extract|berberine|silymarin|ginkgo|ashwagandha|rhodiola|ginseng|turmeric|fish\s*oil|krill\s*oil)\b/i;
  if (nutraceuticalPattern.test(nameLower)) {
    return 'Nutraceutical';
  }
  
  // DRUGS: Pharmaceutical compounds (non-natural)
  const drugPattern = /\b(statin|metformin|aspirin|ibuprofen|acetaminophen|atorvastatin|simvastatin|rosuvastatin|lisinopril|amlodipine|losartan|omeprazole|prednisone|prednisolone|dexamethasone|insulin\s*glargine|methotrexate|azathioprine|cyclosporine|tacrolimus|rapamycin|sirolimus|everolimus)\b/i;
  if (drugPattern.test(nameLower)) {
    return 'Compound';
  }
  
  // ==========================================================================
  // STANDARD TYPE MAPPING (if no name-based override matched)
  // ==========================================================================
  
  const typeMapping: Record<string, string> = {
    // Nutraceutical variants
    'nutraceutical': 'Nutraceutical',
    'supplement': 'Nutraceutical',
    'nutrient': 'Nutraceutical',
    'vitamin': 'Nutraceutical',
    'mineral': 'Nutraceutical',
    'antioxidant': 'Nutraceutical',
    'drug': 'Compound',
    'chemicalcompound': 'Compound',
    'compound': 'Compound',
    'chemical': 'Compound',
    
    // Condition/Disease variants
    'condition': 'Condition',
    'healthcondition': 'HealthCondition',
    'disease': 'Disease',
    'disorder': 'Condition',
    'syndrome': 'Condition',
    'clinicaloutcome': 'Condition',
    'outcome': 'Condition',
    
    // Mechanism variants  
    'mechanism': 'Mechanism',
    'molecularmechanism': 'MolecularMechanism',
    'signalingcascade': 'Mechanism',
    'signaling': 'Mechanism',
    'cascade': 'Mechanism',
    'action': 'Mechanism',
    'process': 'BiologicalProcess',
    'biologicalprocess': 'BiologicalProcess',
    'cellularprocess': 'BiologicalProcess',
    'metabolicprocess': 'BiologicalProcess',
    
    // Pathway variants
    'pathway': 'Pathway',
    'signalingpathway': 'Pathway',
    
    // Target variants (receptors, enzymes, genes)
    'target': 'Target',
    'receptor': 'Target',
    'enzyme': 'Target',
    'geneprotein': 'Target',
    'protein': 'Target',
    'gene': 'Target',
    
    // Biological effect variants
    'biologicaleffect': 'BiologicalProcess',
    'effect': 'BiologicalProcess',
    'sideeffect': 'Symptom',
    'adverseeffect': 'Symptom',
    
    // Treatment/Intervention variants
    'treatment': 'Treatment',
    'intervention': 'Intervention',
    'therapy': 'Treatment',
    
    // Symptom variants
    'symptom': 'Symptom',
    'toxicity': 'Symptom',
  };
  
  // Direct mapping from LLM-provided type
  if (typeMapping[normalized]) {
    return typeMapping[normalized];
  }
  
  // Legacy name-based hints (less specific, used as fallback)
  const nameBasedHints: Record<string, string> = {
    'Condition': 'obesity|diabetes|arthritis|cancer|disease|syndrome|disorder|hyperlipidemia|dysfunction|failure|deficiency',
    'Mechanism': 'phosphorylation|dephosphorylation|methylation|acetylation|ubiquitination',
  };
  
  for (const [hintType, pattern] of Object.entries(nameBasedHints)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(nameLower)) {
      console.log(`Type mapping: "${entityName}" (${entityType}) → ${hintType} (fallback name-based)`);
      return hintType;
    }
  }
  
  // Fallback based on partial match
  for (const [key, value] of Object.entries(typeMapping)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Ultimate fallback
  console.log(`Unknown entity type "${entityType}" for "${entityName}", defaulting to "Mechanism"`);
  return 'Mechanism';
}

// Valid evidence levels from database constraint
const VALID_EVIDENCE_LEVELS = ['meta_analysis', 'rct', 'cohort', 'case_control', 'case_report', 'in_vitro', 'expert_opinion'];

// Map evidence level to valid constraint values
function mapEvidenceLevel(evidenceLevel: string | null | undefined): string | null {
  if (!evidenceLevel) return null;
  
  const normalized = evidenceLevel.toLowerCase().replace(/[_\s-]+/g, '_');
  
  // Direct match
  if (VALID_EVIDENCE_LEVELS.includes(normalized)) {
    return normalized;
  }
  
  // Common mappings
  const mappings: Record<string, string> = {
    'meta-analysis': 'meta_analysis',
    'metaanalysis': 'meta_analysis',
    'systematic_review': 'meta_analysis',
    'systematic review': 'meta_analysis',
    'randomized_controlled_trial': 'rct',
    'randomized controlled trial': 'rct',
    'randomised_controlled_trial': 'rct',
    'clinical_trial': 'rct',
    'clinical trial': 'rct',
    'cohort_study': 'cohort',
    'cohort study': 'cohort',
    'observational': 'cohort',
    'case_control_study': 'case_control',
    'case-control': 'case_control',
    'case_series': 'case_report',
    'case series': 'case_report',
    'case_study': 'case_report',
    'case study': 'case_report',
    'in_vivo': 'in_vitro',
    'laboratory': 'in_vitro',
    'preclinical': 'in_vitro',
    'animal_study': 'in_vitro',
    'animal study': 'in_vitro',
    'expert': 'expert_opinion',
    'opinion': 'expert_opinion',
    'review': 'expert_opinion',
    'narrative_review': 'expert_opinion',
  };
  
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key.replace(/[_\s-]+/g, '_')) || evidenceLevel.toLowerCase().includes(key)) {
      return value;
    }
  }
  
  return null;
}

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

// Determine layer from validated PascalCase entity type
function determineLayerFromType(validatedType: string): string {
  const layerMapping: Record<string, string> = {
    // Layer 0 - Compounds
    'Nutraceutical': 'layer_0_compound',
    'Compound': 'layer_0_compound',
    
    // Layer 1 - Targets
    'Target': 'layer_1_target',
    'Pathway': 'layer_1_target',
    
    // Layer 2 - Mechanisms
    'Mechanism': 'layer_2_mechanism',
    'MolecularMechanism': 'layer_2_mechanism',
    'BiologicalProcess': 'layer_2_mechanism',
    
    // Layer 3 - Effects
    'Symptom': 'layer_3_effect',
    
    // Layer 4 - Outcomes
    'Condition': 'layer_4_outcome',
    'HealthCondition': 'layer_4_outcome',
    'Disease': 'layer_4_outcome',
    
    // Context
    'Treatment': 'context',
    'Intervention': 'context'
  };
  
  return layerMapping[validatedType] || 'layer_2_mechanism';
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
    const rawFullText = study.full_text_content || '';
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TEXT CHUNKING: Split long studies into ~10K char chunks with 500 char overlap
    // This prevents timeouts on long papers while preserving ALL content
    // ═══════════════════════════════════════════════════════════════════════════
    const CHUNK_SIZE = 10000;
    const CHUNK_OVERLAP = 500;
    
    function splitIntoChunks(text: string): string[] {
      if (text.length <= CHUNK_SIZE) return [text];
      const chunks: string[] = [];
      let start = 0;
      while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        chunks.push(text.substring(start, end));
        if (end >= text.length) break;
        start = end - CHUNK_OVERLAP;
      }
      return chunks;
    }
    
    const textChunks = splitIntoChunks(rawFullText);
    console.log(`🔬 PHASE 1: Free Discovery for study: ${studyId} (${textChunks.length} chunk(s), ${rawFullText.length} chars total)`);
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
- [Compound A] → inhibits [Pathway X] → reduces [Cytokine Y] → decreases inflammation → improves [Condition Z]
- [Metabolite] accumulation → activates [Receptor] → triggers [Signaling Cascade] → activates [Transcription Factor] → increases [Cytokine] → chronic inflammation
- [Compound B] → incorporates into cell membrane → displaces [Lipid] → reduces [Mediator] → anti-inflammatory effect

IMPORTANT: Replace the bracketed placeholders above with the ACTUAL compounds, pathways, and conditions found IN THE STUDY TEXT. Do NOT use these placeholder names in your output.

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

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: Process each chunk separately, then concatenate discoveries
    // ═══════════════════════════════════════════════════════════════════════════
    
    const chunkDiscoveries: string[] = [];
    
    for (let ci = 0; ci < textChunks.length; ci++) {
      const chunk = textChunks[ci];
      console.log(`📄 Phase 1 chunk ${ci + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      const phase1UserPrompt = `Analyze this veterinary nutraceutical study and extract ALL biological mechanisms and pathways:

**Title:** ${study.title || 'N/A'}
**Authors:** ${Array.isArray(study.authors) ? study.authors.join(', ') : 'N/A'}
**Year:** ${study.year || 'N/A'}
**Journal:** ${study.journal || 'N/A'}

${textChunks.length > 1 ? `**[SECTION ${ci + 1} of ${textChunks.length}]**` : ''}
**TEXT:**
${chunk}

---

Please provide a comprehensive analysis covering:
1. All signaling cascades (write them as: A → B → C → D format)
2. All molecular targets (receptors, enzymes, transcription factors)
3. Dose-response data
4. Species/breed findings
5. Clinical outcomes with efficacy data
6. Adverse effects
7. Compound interactions/synergies

Be thorough - capture EVERY biological relationship mentioned in this section.`;

      let chunkResult: string | undefined;
      try {
        const phase1 = await callAITask('triplet_extraction', {
          caller: 'generate-triplets',
          override_system_prompt: phase1SystemPrompt,
          messages: [{ role: 'user', content: phase1UserPrompt }],
          temperature: 0.1,
          fallback: { model_id: 'google/gemini-3-pro-preview', temperature: 0.1 },
        });
        chunkResult = phase1.output;
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.includes('429')) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (msg.includes('402')) {
          return new Response(
            JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.error(`Phase 1 chunk ${ci + 1} AI error:`, msg);
        continue;
      }
      if (chunkResult) {
        chunkDiscoveries.push(chunkResult);
        console.log(`✅ Phase 1 chunk ${ci + 1} complete (${chunkResult.length} chars)`);
      }
    }
    
    if (chunkDiscoveries.length === 0) {
      throw new Error('Phase 1 failed: no chunks produced discoveries');
    }
    
    const freeDiscoveryText = chunkDiscoveries.length === 1 
      ? chunkDiscoveries[0] 
      : chunkDiscoveries.map((d, i) => `=== SECTION ${i + 1} ===\n${d}`).join('\n\n');
    
    console.log(`✅ Phase 1 complete. ${chunkDiscoveries.length} chunk(s), total discovery: ${freeDiscoveryText.length} chars`);
    console.log(`📝 Discovery preview: ${freeDiscoveryText.substring(0, 500)}...`);

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: STRUCTURING - Convert free discovery into structured triplets
    // ═══════════════════════════════════════════════════════════════════════════
    
    console.log(`🔄 PHASE 2: Structuring discovered knowledge into triplets`);

const phase2SystemPrompt = `You are a knowledge graph expert for VetGraphRAG, a veterinary nutraceutical knowledge base. Convert the biological analysis into structured triplets.

## ⚠️ CRITICAL ENTITY CLASSIFICATION RULES - READ CAREFULLY ⚠️

### WHAT IS A NUTRACEUTICAL vs OTHER ENTITY TYPES

**NUTRACEUTICAL (subject_type: "nutraceutical")** - ONLY use for:
- Natural dietary supplements: Curcumin, Resveratrol, Quercetin, Omega-3, EPA, DHA
- Vitamins and minerals: Vitamin D, Vitamin E, Zinc, Selenium, CoQ10
- Herbal extracts: Turmeric extract, Green tea extract, Ginkgo biloba
- Amino acid supplements: L-Carnitine, Taurine, Glutamine
- Probiotics, Prebiotics, Fish oil, Krill oil, Astaxanthin, Lutein

**DRUG (subject_type: "drug")** - Use for pharmaceutical compounds:
- Prescription medications, synthetic drugs, pharmaceutical compounds
- Examples: Statins, Metformin, NSAIDs (Ibuprofen, Aspirin)

**⛔ NEVER CLASSIFY THE FOLLOWING AS "nutraceutical" OR "drug" - USE CORRECT TYPES:**

| Entity Name Pattern | Correct subject_type | Examples |
|---------------------|---------------------|----------|
| Enzymes (-ase suffix) | "enzyme" | Caspase-3, COX-2, LOX, PLA2, Kinases, Proteases, Lipase |
| Proteins/Factors | "gene_protein" | VEGF, GFAP, BDNF, TNF-α, IL-6, NF-κB, Tubulin, Collagen |
| Pathways/Signaling | "pathway" | Autophagy Pathway, NF-κB pathway, AMPK, mTOR, MAPK |
| Receptors | "receptor" | PPARγ, TLR4, CB2, NMDA receptor, Insulin receptor |
| Biological Processes | "biological_effect" | Oxidative stress, Inflammation, Apoptosis, Necrosis |
| Diseases/Conditions | "condition" or "disease" | Obesity, Diabetes, Cancer, Arthritis |

### EXAMPLES OF CORRECT vs WRONG CLASSIFICATION

❌ WRONG: { subject_type: "nutraceutical", subject_name: "Autophagy Pathway" }
✅ CORRECT: { subject_type: "pathway", subject_name: "Autophagy Pathway" }

❌ WRONG: { subject_type: "nutraceutical", subject_name: "Vascular Endothelial Growth Factor" }
✅ CORRECT: { subject_type: "gene_protein", subject_name: "VEGF" }

❌ WRONG: { subject_type: "nutraceutical", subject_name: "COX-2" }
✅ CORRECT: { subject_type: "enzyme", subject_name: "COX-2" }

❌ WRONG: { subject_type: "nutraceutical", subject_name: "NF-κB" }
✅ CORRECT: { subject_type: "pathway", subject_name: "NF-κB Pathway" }

## ENTITY TYPES (use EXACTLY these lowercase values)
- Layer 0 (Compounds): nutraceutical, drug, chemical_compound
- Layer 1 (Targets): pathway, receptor, enzyme, gene_protein
- Layer 2 (Mechanisms): mechanism, signaling_cascade
- Layer 3 (Effects): biological_effect, side_effect
- Layer 4 (Outcomes): condition, disease, clinical_outcome
- Context: breed, species, age_group, study

## RELATIONSHIP TYPES (use ONLY these predicates - NO OTHER PREDICATES ALLOWED)
Direct Actions: INHIBITS, ACTIVATES, MODULATES, BINDS_TO, BLOCKS, UPREGULATES, DOWNREGULATES
Cascade: TRIGGERS, PARTICIPATES_IN, REGULATES, PRODUCES, LEADS_TO, CAUSES
Therapeutic: TREATS, PREVENTS, SUPPORTS, AMELIORATES, MANAGES
Adverse: WORSENS, CONTRAINDICATED_FOR, CAUSES_SIDE_EFFECT, AGGRAVATES
Interactions: SYNERGIZES_WITH, ANTAGONIZES, ENHANCES_BIOAVAILABILITY, REDUCES_BIOAVAILABILITY, REQUIRES, POTENTIATES
Context: PREDISPOSED_IN, COMMON_IN, CITED_IN, STUDIED_IN

⚠️ FORBIDDEN PREDICATES - DO NOT USE:
- HAS_MECHANISM → use MODULATES or TRIGGERS instead
- INTERACTS → use MODULATES instead
- AFFECTS → use MODULATES instead
- RELATED_TO → use MODULATES instead
- INVOLVES → use PARTICIPATES_IN instead

## CRITICAL RULES - HIERARCHICAL CHAINS (L0→L1→L2→L3→L4)

### RULE 1: ALWAYS GENERATE COMPLETE HIERARCHICAL CHAINS
For EVERY therapeutic relationship (X TREATS condition), you MUST generate ALL intermediate steps:
- L0 (Compound) → L1 (Target): BINDS_TO, INHIBITS, ACTIVATES
- L1 (Target) → L2 (Mechanism): TRIGGERS, REGULATES, PARTICIPATES_IN
- L2 (Mechanism) → L3 (Effect): PRODUCES, LEADS_TO, CAUSES
- L3 (Effect) → L4 (Outcome): TREATS, PREVENTS, AMELIORATES

Example: If "[Compound] treats [Condition]", generate the FULL CHAIN:
1. {subject_type: "nutraceutical", subject_name: "[Compound]", predicate: "ACTIVATES", object_type: "receptor", object_name: "[Target Receptor]"}
2. {subject_type: "receptor", subject_name: "[Target Receptor]", predicate: "TRIGGERS", object_type: "mechanism", object_name: "[Metabolic Pathway]"}
3. {subject_type: "mechanism", subject_name: "[Metabolic Pathway]", predicate: "PRODUCES", object_type: "biological_effect", object_name: "[Measurable Effect]"}
4. {subject_type: "biological_effect", subject_name: "[Measurable Effect]", predicate: "TREATS", object_type: "condition", object_name: "[Condition]"}

IMPORTANT: Replace ALL bracketed placeholders with ACTUAL entities extracted from the study. Do NOT output "[Compound]" or any placeholder text.

### RULE 2: MANDATORY SCORING CRITERIA FOR CONFIDENCE (0.0-1.0)

Use this BASE SCORE by evidence type, then apply MODIFIERS:

| Evidence Type        | Base Score |
|----------------------|------------|
| meta_analysis        | 0.95       |
| systematic_review    | 0.90       |
| rct                  | 0.85       |
| cohort               | 0.70       |
| case_control         | 0.55       |
| case_report          | 0.40       |
| in_vivo              | 0.50       |
| in_vitro             | 0.35       |
| expert_opinion       | 0.25       |

MODIFIERS (apply to base score):
- p-value < 0.001: +0.10
- p-value < 0.01: +0.05
- p-value < 0.05: +0.02
- Replicated in 2+ studies: +0.10
- High risk of bias noted: -0.15
- Sample size < 10: -0.15
- Sample size 10-50: 0
- Sample size 50-100: +0.05
- Sample size ≥ 100: +0.10
- Species is canine: +0.05
- Species is feline/equine: +0.02
- Species is rodent only: -0.05
- Species is in vitro only: -0.20

Final confidence = base_score + sum(modifiers), capped at [0.1, 0.99]

### RULE 3: INTENSITY CALCULATION (0.0-1.0)

Based on effect magnitude:
- Complete resolution/cure: 0.9-1.0
- Major improvement (>70%): 0.7-0.9
- Moderate improvement (40-70%): 0.5-0.7
- Mild improvement (20-40%): 0.3-0.5
- Minimal effect (<20%): 0.1-0.3
- No effect or harmful: 0.0-0.1

If no effect size mentioned, default to 0.5.

### RULE 4: MANDATORY PROPERTIES FOR EACH TRIPLET
EVERY triplet MUST include these properties:
- species_context: REQUIRED - Array of species studied. Use ["canine"], ["feline"], ["equine"], or combinations. DEFAULT to ["canine"] if unclear.
- evidence_level: REQUIRED - One of: "meta_analysis", "rct", "cohort", "case_control", "case_report", "in_vitro", "in_vivo", "expert_opinion"
- confidence: REQUIRED - 0.0 to 1.0, calculated using the SCORING CRITERIA above
- intensity: REQUIRED - 0.0 to 1.0, strength of effect using INTENSITY CALCULATION above. DEFAULT to 0.5 if not determinable.
- dose_range: REQUIRED if doses mentioned - {"min": X, "max": Y, "unit": "mg/kg/day"}
- ic50: OPTIONAL - IC50 value if mentioned (e.g., "5 µM")
- ec50: OPTIONAL - EC50 value if mentioned
- ki: OPTIONAL - Ki value if mentioned

### RULE 3: DO NOT SKIP STEPS
NEVER create direct L0→L4 triplets without intermediate steps. Example of WRONG:
❌ {subject_type: "nutraceutical", subject_name: "X", predicate: "TREATS", object_type: "condition", object_name: "Y"}

CORRECT approach - generate the full chain:
✅ [Compound] → INHIBITS → [Enzyme] (enzyme)
✅ [Enzyme] → REGULATES → [Pathway] (mechanism)
✅ [Pathway] → PRODUCES → [Effect] (biological_effect)
✅ [Effect] → TREATS → [Condition] (condition)

## OUTPUT FORMAT
Return a JSON object with this structure (replace ALL values with actual data from the study):
{
  "triplets": [
    {
      "subject_type": "nutraceutical",
      "subject_name": "actual_compound_from_study",
      "predicate": "ACTIVATES",
      "object_type": "receptor",
      "object_name": "actual_receptor_from_study",
      "properties": {
        "intensity": 0.8,
        "confidence": 0.9,
        "evidence_level": "rct",
        "species_context": ["canine"],
        "dose_range": {"min": 10, "max": 20, "unit": "mg/kg/day"}
      }
    }
  ],
  "pathway_chains": [
    "compound → action → target → effect → outcome"
  ],
  "synergies": [],
  "contraindications": []
}`;

    const phase2UserPrompt = `Convert this biological analysis into structured triplets for VetGraphRAG:

## ORIGINAL STUDY
Title: ${study.title}
Year: ${study.year || 'N/A'}
Journal: ${study.journal || 'N/A'}

## DISCOVERED BIOLOGICAL KNOWLEDGE
${freeDiscoveryText}

---

## INSTRUCTIONS
1. Generate COMPLETE HIERARCHICAL CHAINS (L0→L1→L2→L3→L4) for each therapeutic relationship
2. NEVER skip intermediate steps - always show the full molecular pathway
3. EVERY triplet MUST have species_context (default to ["canine"] if unclear) and evidence_level
4. Include dose_range when dosing information is available
5. Include IC50/EC50/Ki values when mentioned
6. Break all pathway chains into individual triplets

Generate triplets covering:
- ALL molecular target interactions (compound → receptor/enzyme)
- ALL mechanism activations (target → mechanism)
- ALL biological effects (mechanism → effect)
- ALL therapeutic outcomes (effect → condition)
- ALL adverse effects and contraindications
- ALL compound synergies/interactions

IMPORTANT: The pathway_chains array should show the complete discovered chains in readable format.`;

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
                      intensity: { type: "number", description: "Strength of effect 0.0-1.0. REQUIRED. Default 0.5." },
                      confidence: { type: "number", description: "Confidence score 0.0-1.0. REQUIRED." },
                      evidence_level: { type: "string", description: "One of: meta_analysis, rct, cohort, case_control, case_report, in_vitro, in_vivo, expert_opinion. REQUIRED." },
                      species_context: { type: "array", items: { type: "string" }, description: "Array of species. REQUIRED. Default [\"canine\"]." },
                      dose_range: { type: "object" },
                      ic50: { type: "string" },
                      ec50: { type: "string" }
                    },
                    required: ["intensity", "confidence", "evidence_level", "species_context"]
                  },
                  mechanism_path: { type: "array", items: { type: "object" } }
                },
                required: ["subject_type", "subject_name", "predicate", "object_type", "object_name", "properties"]
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

    let phase2Data: any;
    try {
      const phase2 = await callAITask('triplet_extraction', {
        caller: 'generate-triplets',
        override_system_prompt: phase2SystemPrompt,
        messages: [{ role: 'user', content: phase2UserPrompt }],
        tools: [extractTripletsToolDef],
        tool_choice: { type: 'function', function: { name: 'extract_triplets' } },
        temperature: 0.1,
        fallback: { model_id: 'google/gemini-3-pro-preview', temperature: 0.1 },
      });
      // Reconstruct minimal phase2Data shape expected by downstream parser
      phase2Data = {
        choices: [{
          message: {
            content: phase2.output,
            tool_calls: phase2.tool_calls,
          },
        }],
      };
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('429')) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (msg.includes('402')) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Phase 2 AI error:', msg);
      throw new Error(`Phase 2 AI request failed: ${msg}`);
    }
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

      // Validate predicate - first try mapping invalid predicates, then validate
      const rawPredicate = (t.predicate || 'MODULATES').toUpperCase();
      const mappedPredicate = PREDICATE_MAPPING[rawPredicate] || rawPredicate;
      const predicate = VALID_RELATIONSHIPS.includes(mappedPredicate) ? mappedPredicate : 'MODULATES';
      
      if (rawPredicate !== predicate) {
        console.log(`🔧 Predicate mapped: "${t.predicate}" → "${predicate}"`);
      }

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
      
      // === POST-EXTRACTION VALIDATION & ADJUSTMENT ===
      let adjustedConfidence = llmConfidence;
      const validationWarnings: string[] = [];
      let hallucinationFlag = false;
      
      // Rule 1: No species context → reduce confidence
      const speciesCtx = props.species_context || [];
      if (!speciesCtx.length || speciesCtx.length === 0) {
        adjustedConfidence *= 0.8;
        validationWarnings.push('Missing species_context - confidence reduced by 20%');
      }
      
      // Rule 2: Not canine validated → reduce for canine context
      if (speciesCtx.length > 0 && !speciesCtx.includes('canine')) {
        adjustedConfidence *= 0.7;
        validationWarnings.push('Non-canine study - confidence reduced by 30% for canine context');
      }
      
      // Rule 3: In vitro only → cap confidence at 0.4
      const rawEvidenceLevel = props.evidence_level?.toLowerCase() || 'unknown';
      if (rawEvidenceLevel === 'in_vitro') {
        adjustedConfidence = Math.min(adjustedConfidence, 0.4);
        validationWarnings.push('In vitro evidence - confidence capped at 0.4');
      }
      
      // Rule 4: Missing evidence_level → reduce confidence
      if (!props.evidence_level) {
        adjustedConfidence *= 0.8;
        validationWarnings.push('Missing evidence_level - confidence reduced by 20%');
      }
      
      // Rule 5: TREATS predicate requires higher threshold - skip if too low
      // Use the already validated predicate from above
      const tripletPredicate = predicate; // Already validated with PREDICATE_MAPPING
      const isTreatsRelation = ['TREATS', 'PREVENTS', 'AMELIORATES'].includes(tripletPredicate);
      
      // Rule 6: ANTI-HALLUCINATION - Check if entity names appear in original text
      const searchableText = (rawFullText + ' ' + freeDiscoveryText).toLowerCase();
      const subjectNameLower = (t.subject_name || '').toLowerCase().trim();
      const objectNameLower = (t.object_name || '').toLowerCase().trim();
      
      // For subject: check if name appears in text (allow partial match for compound names)
      const subjectInText = subjectNameLower.length >= 3 && (
        searchableText.includes(subjectNameLower) ||
        subjectNameLower.split(/[\s\-_]+/).some((part: string) => part.length >= 4 && searchableText.includes(part))
      );
      
      // For object: check if name appears in text
      const objectInText = objectNameLower.length >= 3 && (
        searchableText.includes(objectNameLower) ||
        objectNameLower.split(/[\s\-_]+/).some((part: string) => part.length >= 4 && searchableText.includes(part))
      );
      
      if (!subjectInText || !objectInText) {
        hallucinationFlag = true;
        adjustedConfidence *= 0.5; // Reduce confidence by 50%
        if (!subjectInText) {
          validationWarnings.push(`HALLUCINATION: Subject "${t.subject_name}" not found in study text`);
        }
        if (!objectInText) {
          validationWarnings.push(`HALLUCINATION: Object "${t.object_name}" not found in study text`);
        }
      }
      
      const shouldSkip = isTreatsRelation && adjustedConfidence < 0.3;
      
      // Final confidence capped at [0.1, 0.99]
      adjustedConfidence = Math.max(0.1, Math.min(0.99, adjustedConfidence));
      
      // Log validation results
      if (validationWarnings.length > 0) {
        console.log(`   ⚠️ Validation: ${validationWarnings.join('; ')}`);
        console.log(`   └─ Confidence adjusted: ${llmConfidence.toFixed(2)} → ${adjustedConfidence.toFixed(2)}`);
        if (hallucinationFlag) {
          console.log(`   🚨 HALLUCINATION DETECTED - flagged for review`);
        }
      }
      
      if (shouldSkip) {
        console.log(`   ❌ SKIPPED: ${tripletPredicate} relationship requires confidence >= 0.3 (got ${adjustedConfidence.toFixed(2)})`);
        return null; // Will be filtered out
      }
      
      const extractionConfidence = (adjustedConfidence * 0.6) + (kgMatchScore * 0.4);

      // Determine auto-approval
      const autoApproved = extractionConfidence >= 0.85 && kgMatchScore >= 0.5;

      // Apply entity type mapping to ensure valid values - pass entity name for contextual validation
      const validatedSubjectType = mapEntityType(subjectType, t.subject_name);
      const validatedObjectType = mapEntityType(objectType, t.object_name);
      
      // CRITICAL: Use original lowercase type for layer mapping, then fall back to validated type
      const subjectLayerKey = subjectType.toLowerCase().replace(/[\s\-_]+/g, '');
      const objectLayerKey = objectType.toLowerCase().replace(/[\s\-_]+/g, '');
      const validatedSubjectLayer = ENTITY_LAYERS[subjectLayerKey] || ENTITY_LAYERS[subjectType] || determineLayerFromType(validatedSubjectType);
      const validatedObjectLayer = ENTITY_LAYERS[objectLayerKey] || ENTITY_LAYERS[objectType] || determineLayerFromType(validatedObjectType);
      
      // Validate mandatory fields for quality assurance
      const speciesContext = props.species_context || (props.species ? [props.species] : ['canine']); // Default to canine
      const validatedEvidenceLevel = mapEvidenceLevel(props.evidence_level) || 'in_vitro'; // Default evidence level
      
      console.log(`📊 Triplet: ${t.subject_name} [${validatedSubjectLayer}] -${tripletPredicate}-> ${t.object_name} [${validatedObjectLayer}]`);
      console.log(`   └─ Species: ${JSON.stringify(speciesContext)}, Evidence: ${validatedEvidenceLevel}, Confidence: ${props.confidence || 0.7}`);

      return {
        study_id: studyId,
        subject_type: validatedSubjectType,
        subject_name: t.subject_name,
        subject_id: subjectId,
        subject_layer: validatedSubjectLayer,
        predicate: tripletPredicate,
        object_type: validatedObjectType,
        object_name: t.object_name,
        object_id: objectId,
        object_layer: validatedObjectLayer,
        // Hierarchical fields - with validated mandatory fields
        intensity: props.intensity ?? null,
        direction: mapDirection(props.direction, tripletPredicate),
        evidence_level: validatedEvidenceLevel,
        dose_dependent: props.dose_dependent || false,
        dose_range: props.dose_range || null,
        species_context: speciesContext,
        mechanism_path: t.mechanism_path || null,
        relationship_category: getRelationshipCategory(tripletPredicate),
        // Synergy data if applicable
        synergy_data: tripletPredicate === 'SYNERGIZES_WITH' || tripletPredicate === 'ANTAGONIZES' ? {
          synergy_score: props.synergy_score,
          mechanism: props.mechanism,
          enhancement_factor: props.enhancement_factor,
          optimal_ratio: props.optimal_ratio
        } : null,
        // Confidence scores
        llm_confidence: adjustedConfidence,
        kg_match_score: kgMatchScore,
        extraction_confidence: extractionConfidence,
        // Hallucination flag
        hallucination_flag: hallucinationFlag,
        // Confidence rationale
        confidence_rationale: validationWarnings.length > 0
          ? `Base: ${validatedEvidenceLevel} (${llmConfidence.toFixed(2)}) → Adjusted: ${adjustedConfidence.toFixed(2)}. ${validationWarnings.join('; ')}`
          : `Base: ${validatedEvidenceLevel} (${llmConfidence.toFixed(2)}). No adjustments needed.`,
        // Curation status
        curation_status: autoApproved ? 'approved' : 'pending',
        auto_approved: autoApproved,
        synced_to_neo4j: false
      };
    }));

    // Filter out null triplets (skipped due to low confidence)
    const validTriplets = tripletsWithScores.filter((t: any) => t !== null && t !== undefined);
    
    if (validTriplets.length === 0) {
      console.log('⚠️ No valid triplets after filtering');
      return new Response(
        JSON.stringify({
          success: true,
          studyId,
          triplets: [],
          tripletsGenerated: 0,
          count: 0,
          autoApproved: 0,
          pathwayChainsDiscovered: pathwayChains,
          synergiesExtracted: synergies.length,
          hierarchicalEdgesCreated: 0,
          phase1DiscoveryLength: freeDiscoveryText.length,
          neo4jSync: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert triplets
    const { data: insertedTriplets, error: insertError } = await supabase
      .from('triplet_extractions')
      .insert(validTriplets)
      .select();

    if (insertError) {
      console.error('Error inserting triplets:', insertError);
      throw insertError;
    }

    // Create hierarchical_edges for high-confidence triplets
    const highConfidenceTriplets = validTriplets.filter((t: any) => t && t.extraction_confidence >= 0.7);
    if (highConfidenceTriplets.length > 0) {
      const hierarchicalEdges = highConfidenceTriplets
        .filter(t => t && t.subject_type && t.object_type && t.predicate) // Ensure required fields exist
        .map(t => ({
          source_id: t.subject_id || t.study_id || studyId,
          source_type: t.subject_type || 'Unknown',
          source_layer: t.subject_layer || 'layer_0_compound',
          target_id: t.object_id || t.study_id || studyId,
          target_type: t.object_type || 'Unknown',
          target_layer: t.object_layer || 'layer_4_outcome',
          relationship: t.predicate || 'RELATED_TO',
          intensity: t.intensity ?? null,
          confidence: t.extraction_confidence ?? 0.7,
          evidence_level: t.evidence_level || 'in_vitro',
          dose_range: t.dose_range ?? null,
          species_validated: t.species_context || [],
          study_ids: [studyId],
          triplet_id: null,
          curated: t.auto_approved ?? false
        }));

      // Only insert if we have valid edges
      if (hierarchicalEdges.length > 0) {
        const { error: edgeError } = await supabase
          .from('hierarchical_edges')
          .insert(hierarchicalEdges);

        if (edgeError) {
          console.warn('Warning: Could not create hierarchical edges:', edgeError);
        }
      }
    }

    // Store the free discovery text for reference
    const { error: updateError } = await supabase
      .from('processed_studies')
      .update({
        analysis_data: {
          ...(typeof study.analysis_data === 'object' && study.analysis_data !== null ? study.analysis_data : {}),
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

    const tripletsGenerated = insertedTriplets?.length || 0;
    const autoApprovedCount = insertedTriplets?.filter((t: any) => t.auto_approved).length || 0;

    console.log(`📤 RESPONSE: tripletsGenerated=${tripletsGenerated}, autoApproved=${autoApprovedCount}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO-SYNC TO NEO4J: Automatically sync triplets after successful generation
    // ═══════════════════════════════════════════════════════════════════════════
    let neo4jSyncResult = null;
    try {
      console.log(`🔄 AUTO-SYNC: Starting Neo4j sync for study ${studyId}...`);
      
      const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-study-to-neo4j`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studyId })
      });
      
      if (syncResponse.ok) {
        neo4jSyncResult = await syncResponse.json();
        console.log(`✅ AUTO-SYNC: Successfully synced ${neo4jSyncResult.synced || 0} triplets to Neo4j`);
      } else {
        const errorText = await syncResponse.text();
        console.warn(`⚠️ AUTO-SYNC: Neo4j sync failed: ${errorText}`);
      }
    } catch (syncError: any) {
      console.warn(`⚠️ AUTO-SYNC: Neo4j sync error (non-fatal): ${syncError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        studyId,
        triplets: insertedTriplets,
        // IMPORTANT: Frontend expects 'tripletsGenerated' - keep both for compatibility
        tripletsGenerated: tripletsGenerated,
        count: tripletsGenerated,
        autoApproved: autoApprovedCount,
        pathwayChainsDiscovered: pathwayChains,
        synergiesExtracted: synergies.length,
        hierarchicalEdgesCreated: highConfidenceTriplets.length,
        phase1DiscoveryLength: freeDiscoveryText.length,
        // Neo4j sync result
        neo4jSync: neo4jSyncResult ? {
          synced: neo4jSyncResult.synced || 0,
          failed: neo4jSyncResult.failed || 0
        } : null
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
