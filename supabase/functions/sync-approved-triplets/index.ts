import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extended triplet interface with hierarchical fields
interface TripletExtraction {
  id: string;
  study_id: string | null;
  subject_type: string;
  subject_name: string;
  subject_id: string | null;
  subject_layer: string | null;
  predicate: string;
  object_type: string;
  object_name: string;
  object_id: string | null;
  object_layer: string | null;
  // Enriched properties
  intensity: number | null;
  direction: string | null;
  evidence_level: string | null;
  dose_dependent: boolean | null;
  dose_range: any | null;
  species_context: string[] | null;
  mechanism_path: any[] | null;
  relationship_category: string | null;
  synergy_data: any | null;
  // Confidence scores
  extraction_confidence: number;
  kg_match_score: number;
  llm_confidence: number;
}

interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

// Map entity types to Neo4j labels - EXPANDED with biomedical taxonomy
const ENTITY_TYPE_TO_LABEL: Record<string, string> = {
  // Layer 0: Compounds
  'nutraceutical': 'Nutraceutical',
  'drug': 'Drug',
  'chemical_compound': 'ChemicalCompound',
  'compound': 'Compound',
  // Layer 1: Molecular Targets
  'pathway': 'Pathway',
  'receptor': 'Receptor',
  'enzyme': 'Enzyme',
  'gene_protein': 'GeneProtein',
  'geneprotein': 'GeneProtein',
  'protein': 'GeneProtein',
  'cytokine': 'Cytokine',
  'growthfactor': 'GrowthFactor',
  'growth_factor': 'GrowthFactor',
  'target': 'Target',
  // Layer 2: Mechanisms
  'mechanism': 'Mechanism',
  'signaling_cascade': 'SignalingCascade',
  'signalingcascade': 'SignalingCascade',
  // Layer 3: Effects
  'biological_effect': 'BiologicalEffect',
  'biologicaleffect': 'BiologicalEffect',
  'biological_process': 'BiologicalProcess',
  'biologicalprocess': 'BiologicalProcess',
  'effect': 'BiologicalEffect',
  'side_effect': 'SideEffect',
  'sideeffect': 'SideEffect',
  // Layer 4: Outcomes
  'clinical_outcome': 'ClinicalOutcome',
  'clinicaloutcome': 'ClinicalOutcome',
  'condition': 'Condition',
  'disease': 'Disease',
  // Context nodes
  'cell': 'Cell',
  'cell_type': 'Cell',
  'celltype': 'Cell',
  'cellcomponent': 'CellComponent',
  'cell_component': 'CellComponent',
  'breed': 'Breed',
  'species': 'Species',
  'age_group': 'AgeGroup',
  'agegroup': 'AgeGroup',
  'study': 'Study',
  // Fallbacks
  'entity': 'Entity',
  'unknown': 'Entity'
};

/**
 * Execute Cypher query on Neo4j via Query API v2
 */
async function executeCypherQuery(
  cypher: string,
  params: Record<string, any>,
  credentials: Neo4jCredentials
): Promise<any> {
  const authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  
  const httpUri = credentials.uri
    .replace('neo4j+s://', 'https://')
    .replace('neo4j://', 'http://');
  
  console.log(`🔗 Neo4j query: ${cypher.substring(0, 100)}...`);
  
  const response = await fetch(`${httpUri}/db/neo4j/query/v2`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      statement: cypher,
      parameters: params
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neo4j query failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get Neo4j label from entity type
 */
function getNodeLabel(entityType: string): string {
  const normalized = (entityType || 'unknown').toLowerCase().trim();
  return ENTITY_TYPE_TO_LABEL[normalized] || 'Entity';
}

/**
 * Sync hierarchical triplet to Neo4j AuraDB with dynamic labels and enriched properties
 */
async function syncHierarchicalTripletToNeo4j(
  triplet: TripletExtraction,
  credentials: Neo4jCredentials
): Promise<void> {
  console.log(`🔄 Syncing hierarchical triplet ${triplet.id}: ${triplet.subject_name} -[${triplet.predicate}]-> ${triplet.object_name}`);

  const subjectLabel = getNodeLabel(triplet.subject_type);
  const objectLabel = getNodeLabel(triplet.object_type);

  // Build dynamic Cypher query with proper labels
  // Using APOC-free approach for Neo4j AuraDB compatibility
  const cypher = `
    // Create or update subject node with dynamic label
    MERGE (subject:${subjectLabel} {name: $subject_name})
    ON CREATE SET 
      subject.id = coalesce($subject_id, randomUuid()),
      subject.entity_type = $subject_type,
      subject.layer = $subject_layer,
      subject.created_at = datetime(),
      subject.source = 'vetgraphrag_extraction'
    ON MATCH SET
      subject.updated_at = datetime(),
      subject.layer = coalesce(subject.layer, $subject_layer)
    
    // Create or update object node with dynamic label
    MERGE (object:${objectLabel} {name: $object_name})
    ON CREATE SET 
      object.id = coalesce($object_id, randomUuid()),
      object.entity_type = $object_type,
      object.layer = $object_layer,
      object.created_at = datetime(),
      object.source = 'vetgraphrag_extraction'
    ON MATCH SET
      object.updated_at = datetime(),
      object.layer = coalesce(object.layer, $object_layer)
    
    // Create relationship with ALL enriched properties
    MERGE (subject)-[rel:${triplet.predicate}]->(object)
    ON CREATE SET 
      rel.triplet_id = $triplet_id,
      rel.study_id = $study_id,
      rel.extraction_confidence = $extraction_confidence,
      rel.kg_match_score = $kg_match_score,
      rel.llm_confidence = $llm_confidence,
      rel.intensity = $intensity,
      rel.direction = $direction,
      rel.evidence_level = $evidence_level,
      rel.dose_dependent = $dose_dependent,
      rel.dose_range = $dose_range,
      rel.species_validated = $species_context,
      rel.relationship_category = $relationship_category,
      rel.synergy_data = $synergy_data,
      rel.created_at = datetime(),
      rel.curated = true,
      rel.evidence_count = 1
    ON MATCH SET
      rel.updated_at = datetime(),
      rel.evidence_count = coalesce(rel.evidence_count, 0) + 1,
      rel.extraction_confidence = CASE 
        WHEN $extraction_confidence > coalesce(rel.extraction_confidence, 0) 
        THEN $extraction_confidence 
        ELSE rel.extraction_confidence 
      END,
      rel.evidence_level = CASE 
        WHEN $evidence_level IS NOT NULL 
        THEN $evidence_level 
        ELSE rel.evidence_level 
      END
    
    RETURN subject.name AS subject, type(rel) AS relationship, object.name AS object
  `;

  const params = {
    // Subject properties
    subject_name: triplet.subject_name,
    subject_type: triplet.subject_type,
    subject_id: triplet.subject_id,
    subject_layer: triplet.subject_layer || 'unknown',
    // Object properties
    object_name: triplet.object_name,
    object_type: triplet.object_type,
    object_id: triplet.object_id,
    object_layer: triplet.object_layer || 'unknown',
    // Triplet metadata
    triplet_id: triplet.id,
    study_id: triplet.study_id,
    // Confidence scores
    extraction_confidence: triplet.extraction_confidence,
    kg_match_score: triplet.kg_match_score,
    llm_confidence: triplet.llm_confidence,
    // Enriched properties
    intensity: triplet.intensity,
    direction: triplet.direction,
    evidence_level: triplet.evidence_level,
    dose_dependent: triplet.dose_dependent,
    dose_range: triplet.dose_range ? JSON.stringify(triplet.dose_range) : null,
    species_context: triplet.species_context,
    relationship_category: triplet.relationship_category,
    synergy_data: triplet.synergy_data ? JSON.stringify(triplet.synergy_data) : null
  };

  await executeCypherQuery(cypher, params, credentials);
  console.log(`✅ Triplet ${triplet.id} synced with ${subjectLabel} -[${triplet.predicate}]-> ${objectLabel}`);

  // If mechanism_path exists, create intermediate relationships
  if (triplet.mechanism_path && Array.isArray(triplet.mechanism_path) && triplet.mechanism_path.length > 0) {
    await syncMechanismPath(triplet.mechanism_path, triplet, credentials);
  }
}

/**
 * Sync complete mechanism path to Neo4j
 * Creates intermediate nodes and relationships for full chain visualization
 */
async function syncMechanismPath(
  mechanismPath: any[],
  triplet: TripletExtraction,
  credentials: Neo4jCredentials
): Promise<void> {
  console.log(`📊 Syncing mechanism path with ${mechanismPath.length} steps`);

  for (let i = 0; i < mechanismPath.length; i++) {
    const step = mechanismPath[i];
    if (!step.from || !step.to || !step.relation) continue;

    // Infer entity types from position in path
    const fromType = inferEntityType(step.from, i, mechanismPath.length);
    const toType = inferEntityType(step.to, i + 1, mechanismPath.length);
    const fromLabel = getNodeLabel(fromType);
    const toLabel = getNodeLabel(toType);

    const pathCypher = `
      MERGE (from:${fromLabel} {name: $from_name})
      ON CREATE SET 
        from.entity_type = $from_type,
        from.layer = $from_layer,
        from.created_at = datetime(),
        from.source = 'mechanism_path'
      
      MERGE (to:${toLabel} {name: $to_name})
      ON CREATE SET 
        to.entity_type = $to_type,
        to.layer = $to_layer,
        to.created_at = datetime(),
        to.source = 'mechanism_path'
      
      MERGE (from)-[rel:${step.relation}]->(to)
      ON CREATE SET 
        rel.path_step = $step_index,
        rel.parent_triplet_id = $triplet_id,
        rel.study_id = $study_id,
        rel.confidence = $confidence,
        rel.created_at = datetime(),
        rel.is_mechanism_step = true
      
      RETURN from.name, type(rel), to.name
    `;

    const pathParams = {
      from_name: step.from,
      from_type: fromType,
      from_layer: getLayerFromType(fromType),
      to_name: step.to,
      to_type: toType,
      to_layer: getLayerFromType(toType),
      step_index: i,
      triplet_id: triplet.id,
      study_id: triplet.study_id,
      confidence: triplet.extraction_confidence * 0.9 // Slightly lower for inferred path
    };

    try {
      await executeCypherQuery(pathCypher, pathParams, credentials);
    } catch (err) {
      console.warn(`⚠️ Failed to create path step ${i}: ${err}`);
    }
  }
}

/**
 * ROBUST: Infer entity type based on biomedical taxonomy patterns
 * Uses dictionary lookups and pattern matching instead of position-based inference
 */
function inferEntityType(name: string, position: number, totalLength: number): string {
  const nameLower = name.toLowerCase().trim();
  
  // Known enzymes (by suffix or name)
  const enzymePatterns = /(-ase$|kinase|phosphatase|synthase|oxidase|reductase|transferase|hydrolase|catalase|sod|sirt\d|caspase|cox-?\d?|lox|mmp|parp|telomerase|ache)/i;
  if (enzymePatterns.test(nameLower)) {
    return 'enzyme';
  }
  
  // Known receptors
  const receptorPatterns = /(receptor|-r$|channel|ppar|lxr|fxr|vdr|tlr\d?|trpv?\d?|cb[12]|nmda|ampa|gaba)/i;
  if (receptorPatterns.test(nameLower)) {
    return 'receptor';
  }
  
  // Cytokines and interleukins
  const cytokinePatterns = /(^il-?\d+|interleukin|cytokine|chemokine|interferon|tnf-?α?|tgf-?β?)/i;
  if (cytokinePatterns.test(nameLower)) {
    return 'gene_protein';
  }
  
  // Growth factors
  const growthFactorPatterns = /(growth factor|ngf|bdnf|vegf|egf|fgf|igf|pdgf)/i;
  if (growthFactorPatterns.test(nameLower)) {
    return 'gene_protein';
  }
  
  // Pathways
  const pathwayPatterns = /(pathway|signaling|cascade|axis|nf-κb|nf-kb|mapk|jak-stat|pi3k|mtor|ampk|wnt|notch|nrf2)/i;
  if (pathwayPatterns.test(nameLower)) {
    return 'pathway';
  }
  
  // Biological processes
  const processPatterns = /(autophagy|mitophagy|apoptosis|necrosis|senescence|inflammation|neuroinflammation|oxidative stress|metabolism|phosphorylation|acetylation|methylation|ubiquitination|angiogenesis|neurogenesis|synaptic|phagocytosis)/i;
  if (processPatterns.test(nameLower)) {
    return 'biological_process';
  }
  
  // Diseases/Conditions
  const conditionPatterns = /(disease|disorder|syndrome|deficiency|dysfunction|failure|-itis$|-emia$|-pathy$|cancer|tumor|diabetes|hypertension|arthritis|alzheimer|parkinson|dementia)/i;
  if (conditionPatterns.test(nameLower)) {
    return 'condition';
  }
  
  // Cell types
  const cellPatterns = /(cell|cyte$|blast$|clast$|macrophage|neutrophil|lymphocyte|monocyte|neuron|astrocyte|microglia|fibroblast|adipocyte|hepatocyte)/i;
  if (cellPatterns.test(nameLower)) {
    return 'cell';
  }
  
  // Known transcription factors and proteins
  const proteinPatterns = /(^[A-Z]{2,5}\d?$|protein|factor|nf-κb|stat\d?|creb|foxo|p53|p21|bcl-2|bax|ras|raf|erk|akt)/i;
  if (proteinPatterns.test(name)) {
    return 'gene_protein';
  }
  
  // Mechanism-like terms
  if (nameLower.includes('inhibition') || nameLower.includes('activation') || 
      nameLower.includes('modulation') || nameLower.includes('regulation')) {
    return 'mechanism';
  }
  
  // Effect-like terms
  if (nameLower.includes('reduction') || nameLower.includes('improvement') || 
      nameLower.includes('increase') || nameLower.includes('decrease')) {
    return 'biological_effect';
  }
  
  // Fallback: Use position-based inference only as last resort
  console.warn(`⚠️ Could not classify entity: "${name}" - using position-based fallback`);
  const relativePosition = position / (totalLength - 1 || 1);
  if (relativePosition <= 0.2) return 'compound';
  if (relativePosition <= 0.4) return 'pathway';
  if (relativePosition <= 0.6) return 'mechanism';
  if (relativePosition <= 0.8) return 'biological_effect';
  return 'condition';
}

/**
 * Get layer from entity type
 */
function getLayerFromType(entityType: string): string {
  const layerMap: Record<string, string> = {
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
    'condition': 'layer_4_outcome',
    'disease': 'layer_4_outcome',
    'clinical_outcome': 'layer_4_outcome'
  };
  return layerMap[entityType] || 'unknown';
}

/**
 * Fetch Neo4j credentials from ai_configurations table
 */
async function getNeo4jCredentials(supabase: any): Promise<Neo4jCredentials | null> {
  const { data, error } = await supabase
    .from('ai_configurations')
    .select('config_key, config_value')
    .in('config_key', ['neo4j_uri', 'neo4j_username', 'neo4j_password']);
  
  if (error || !data || data.length < 3) {
    console.error('Failed to fetch Neo4j credentials:', error);
    return null;
  }
  
  const config: Record<string, string> = {};
  data.forEach((item: any) => { 
    config[item.config_key] = item.config_value; 
  });
  
  if (!config.neo4j_uri || !config.neo4j_username || !config.neo4j_password) {
    return null;
  }
  
  return {
    uri: config.neo4j_uri,
    username: config.neo4j_username,
    password: config.neo4j_password
  };
}

/**
 * Create Neo4j constraints and indexes if not exists
 */
async function ensureNeo4jSchema(credentials: Neo4jCredentials): Promise<void> {
  const schemaQueries = [
    // Core node constraints
    'CREATE CONSTRAINT nutraceutical_name IF NOT EXISTS FOR (n:Nutraceutical) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT condition_name IF NOT EXISTS FOR (n:Condition) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT pathway_name IF NOT EXISTS FOR (n:Pathway) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT mechanism_name IF NOT EXISTS FOR (n:Mechanism) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT biological_effect_name IF NOT EXISTS FOR (n:BiologicalEffect) REQUIRE n.name IS UNIQUE',
    // Indexes for common queries
    'CREATE INDEX entity_layer IF NOT EXISTS FOR (n:Entity) ON (n.layer)',
    'CREATE INDEX nutraceutical_layer IF NOT EXISTS FOR (n:Nutraceutical) ON (n.layer)'
  ];

  for (const query of schemaQueries) {
    try {
      await executeCypherQuery(query, {}, credentials);
    } catch (err) {
      // Ignore errors for already existing constraints/indexes
      console.log(`Schema query note: ${query.substring(0, 50)}... - ${err}`);
    }
  }
}

/**
 * Main Edge Function
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Neo4j credentials
    const credentials = await getNeo4jCredentials(supabase);
    
    if (!credentials) {
      console.error('Neo4j credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Neo4j credentials not configured',
          message: 'Configure neo4j_uri, neo4j_username, neo4j_password in AI Configuration'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure schema exists (only creates if not exists)
    try {
      await ensureNeo4jSchema(credentials);
    } catch (schemaErr) {
      console.warn('Schema setup warning:', schemaErr);
    }

    // Fetch approved triplets not yet synced - with all hierarchical fields
    const { data: triplets, error: fetchError } = await supabase
      .from('triplet_extractions')
      .select(`
        id, study_id,
        subject_type, subject_name, subject_id, subject_layer,
        predicate,
        object_type, object_name, object_id, object_layer,
        intensity, direction, evidence_level, dose_dependent, dose_range,
        species_context, mechanism_path, relationship_category, synergy_data,
        extraction_confidence, kg_match_score, llm_confidence
      `)
      .eq('curation_status', 'approved')
      .is('synced_to_neo4j', false)
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📦 Found ${triplets?.length || 0} approved triplets to sync`);

    if (!triplets || triplets.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No triplets to sync',
          synced: 0,
          nodeTypes: {},
          relationshipTypes: {}
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track statistics
    const results = {
      total: triplets.length,
      synced: 0,
      failed: 0,
      errors: [] as string[],
      nodeTypes: {} as Record<string, number>,
      relationshipTypes: {} as Record<string, number>,
      mechanismPathsCreated: 0
    };

    // Sync each triplet with hierarchical model
    for (const triplet of triplets) {
      try {
        await syncHierarchicalTripletToNeo4j(triplet as TripletExtraction, credentials);
        
        // Update sync status in Supabase
        await supabase
          .from('triplet_extractions')
          .update({ 
            synced_to_neo4j: true, 
            synced_at: new Date().toISOString() 
          })
          .eq('id', triplet.id);
        
        results.synced++;

        // Track node types
        const subjectLabel = getNodeLabel(triplet.subject_type);
        const objectLabel = getNodeLabel(triplet.object_type);
        results.nodeTypes[subjectLabel] = (results.nodeTypes[subjectLabel] || 0) + 1;
        results.nodeTypes[objectLabel] = (results.nodeTypes[objectLabel] || 0) + 1;

        // Track relationship types
        results.relationshipTypes[triplet.predicate] = 
          (results.relationshipTypes[triplet.predicate] || 0) + 1;

        // Track mechanism paths
        if (triplet.mechanism_path && Array.isArray(triplet.mechanism_path) && triplet.mechanism_path.length > 0) {
          results.mechanismPathsCreated++;
        }

      } catch (error: any) {
        console.error(`❌ Failed to sync triplet ${triplet.id}:`, error);
        results.failed++;
        results.errors.push(`${triplet.id}: ${error.message}`);
      }
    }

    console.log('🎉 VetGraphRAG sync complete:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Synced ${results.synced}/${results.total} hierarchical triplets to Neo4j`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-approved-triplets:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
