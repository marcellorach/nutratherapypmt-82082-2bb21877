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

// =============================================================================
// ENTITY RECLASSIFICATION - Fix misclassified entities before Neo4j sync
// Uses dictionary + pattern matching from classify-entity taxonomy
// =============================================================================

const RECLASSIFY_ENZYMES = new Set([
  'sirt1', 'sirt2', 'sirt3', 'sirt4', 'sirt5', 'sirt6', 'sirt7', 'sirtuin',
  'catalase', 'superoxide dismutase', 'sod', 'sod1', 'sod2', 'gpx', 'glutathione peroxidase',
  'cox-1', 'cox-2', 'cyclooxygenase', 'lipoxygenase', 'lox', '5-lox',
  'caspase', 'caspase-1', 'caspase-3', 'caspase-9', 'parp', 'telomerase',
  'mmp', 'mmp-2', 'mmp-9', 'mmp-13', 'hmg-coa reductase', 'aromatase',
  'nampt', 'nmnat', 'acetylcholinesterase', 'ache',
]);

const RECLASSIFY_PROTEINS = new Set([
  'nf-κb', 'nf-kappa-b', 'nfkb', 'nuclear factor kappa b', 'nf-kb',
  'ampk', 'mtor', 'mtorc1', 'mtorc2', 'akt', 'pkb',
  'nrf2', 'hif-1α', 'p53', 'tp53', 'p21', 'p16',
  'stat1', 'stat3', 'stat5', 'creb', 'foxo', 'foxo1', 'foxo3', 'foxo4',
  'pgc-1α', 'pgc-1beta', 'pi3k',
  'tnf-α', 'tnf-alpha', 'tumor necrosis factor',
  'il-1', 'il-1β', 'il-6', 'il-10', 'il-17',
  'tgf-β', 'ifn-γ', 'vegf', 'bdnf', 'ngf', 'egf', 'igf', 'igf-1',
  'bcl-2', 'bcl-xl', 'bax', 'bak',
  'ras', 'raf', 'mek', 'erk', 'mapk', 'jnk', 'p38',
  'gsk-3β', 'β-catenin', 'wnt', 'notch', 'smad',
  'hsp90', 'hsp70', 'hsp60', 'hsp27',
]);

const RECLASSIFY_RECEPTORS = new Set([
  'ppar', 'ppar-α', 'ppar-γ', 'ppar-delta',
  'tlr', 'tlr2', 'tlr4', 'tlr7', 'tlr9', 'nlrp3',
  'trpv1', 'cb1', 'cb2', 'nmda receptor', 'gabaa receptor',
  'egfr', 'vegfr', 'igfr', 'insulin receptor',
]);

const RECLASSIFY_PATHWAYS = new Set([
  'nf-κb pathway', 'nf-kb pathway', 'nf-κb signaling pathway',
  'mapk pathway', 'mapk signaling', 'jnk pathway', 'p38 mapk pathway',
  'pi3k/akt pathway', 'pi3k-akt-mtor', 'mtor pathway', 'ampk pathway', 'ampk signaling',
  'nrf2 pathway', 'nrf2-keap1', 'wnt pathway', 'notch pathway',
  'tgf-β pathway', 'jak-stat pathway', 'autophagy pathway',
  'apoptosis pathway', 'myd88 signaling pathway',
  'sirt1 pathway', 'oxidative stress pathway',
]);

const RECLASSIFY_PROCESSES = new Set([
  'autophagy', 'mitophagy', 'apoptosis', 'senescence', 'cellular senescence',
  'inflammation', 'neuroinflammation', 'oxidative stress', 'lipid peroxidation',
  'angiogenesis', 'neurogenesis', 'phagocytosis', 'beta-oxidation', 'β-oxidation',
  'lipid metabolism', 'glucose metabolism', 'lipogenesis', 'lipolysis',
  'sasp', 'senescence-associated secretory phenotype',
  'ros production', 'ros scavenging', 'antioxidant defense',
]);

const RECLASSIFY_CONDITIONS = new Set([
  'obesity', 'diabetes', 'hypertension', 'arthritis', 'osteoarthritis',
  'alzheimer', 'parkinson', 'cancer', 'tumor', 'metabolic syndrome',
  'dyslipidemia', 'hyperlipidemia', 'hepatic dysfunction', 'liver dysfunction',
  'metabolic disorder', 'metabolic disorders', 'canine obesity',
  'hypothyroidism', 'hepatic stress', 'oxidative stress',
]);

/**
 * Reclassify an entity if its current type seems wrong based on taxonomy dictionaries.
 * Returns corrected { type, layer } or null if no correction needed.
 */
function reclassifyEntity(name: string, currentType: string): { type: string; layer: string } | null {
  const normalized = name.toLowerCase().trim();
  const currentNorm = currentType.toLowerCase();
  
  // Only reclassify if current type is likely wrong
  // Skip if already correctly classified as non-nutraceutical with high-confidence types
  if (['enzyme', 'receptor', 'geneprotein', 'gene_protein', 'pathway', 'biologicalprocess', 
       'biological_process', 'condition', 'disease'].includes(currentNorm)) {
    return null;
  }
  
  // Check dictionaries in priority order
  if (RECLASSIFY_ENZYMES.has(normalized)) {
    return { type: 'enzyme', layer: 'layer_1_target' };
  }
  if (RECLASSIFY_RECEPTORS.has(normalized)) {
    return { type: 'receptor', layer: 'layer_1_target' };
  }
  if (RECLASSIFY_PROTEINS.has(normalized)) {
    return { type: 'gene_protein', layer: 'layer_1_target' };
  }
  if (RECLASSIFY_PATHWAYS.has(normalized)) {
    return { type: 'pathway', layer: 'layer_1_target' };
  }
  if (RECLASSIFY_PROCESSES.has(normalized)) {
    return { type: 'biological_process', layer: 'layer_3_effect' };
  }
  if (RECLASSIFY_CONDITIONS.has(normalized)) {
    return { type: 'condition', layer: 'layer_4_outcome' };
  }
  
  // Pattern-based reclassification for entities not in dictionaries
  if (/(-ase$|kinase|phosphatase|synthase|oxidase|reductase|transferase|hydrolase|sirt\d)/i.test(normalized)) {
    return { type: 'enzyme', layer: 'layer_1_target' };
  }
  if (/(receptor|channel)/i.test(normalized) && !/(nutraceutical|compound)/i.test(normalized)) {
    return { type: 'receptor', layer: 'layer_1_target' };
  }
  if (/(pathway|signaling|cascade)/i.test(normalized)) {
    return { type: 'pathway', layer: 'layer_1_target' };
  }
  if (/(autophagy|apoptosis|senescence|inflammation|oxidative stress|metabolism|phosphorylation|acetylation|peroxidation)/i.test(normalized)) {
    return { type: 'biological_process', layer: 'layer_3_effect' };
  }
  if (/(disease|disorder|syndrome|dysfunction|failure|-itis$|-emia$|-pathy$|cancer|tumor|obesity|diabetes|arthritis)/i.test(normalized)) {
    return { type: 'condition', layer: 'layer_4_outcome' };
  }
  
  return null; // No reclassification needed
}

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

  // Sanitize predicate: Neo4j relationship types cannot have spaces or special chars
  const sanitizedPredicate = triplet.predicate.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');

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
    MERGE (subject)-[rel:${sanitizedPredicate}]->(object)
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
      
      MERGE (from)-[rel:${(step.relation || 'RELATED_TO').replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '')}]->(to)
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

    // === FIX EXISTING MISCLASSIFIED NODES IN NEO4J ===
    try {
      console.log('🔧 Running Neo4j misclassification cleanup...');
      
      // Reclassify known proteins/enzymes currently labeled as Nutraceutical
      const reclassifyQueries = [
        // SIRT1, AMPK, NF-κB, mTOR, HSP90 etc. → proper labels
        `MATCH (n:Nutraceutical) WHERE n.name IN ['SIRT1', 'Sirtuin 1', 'SIRT1 Promotion'] 
         REMOVE n:Nutraceutical SET n:Enzyme, n.entity_type = 'Enzyme', n.layer = 'layer_1_target' RETURN count(n) as fixed`,
        `MATCH (n:Nutraceutical) WHERE n.name IN ['AMPK', 'AMP-activated protein kinase', 'NF-κB', 'NF-kB', 'Nuclear Factor kappa-light-chain-enhancer of activated B cells', 'mTOR', 'mTORC1', 'Mechanistic Target of Rapamycin', 'PI3K/Akt', 'HSP90', 'PGC-1α', 'BCL-2 family proteins', 'FOXO4-p53', 'p65 subunit (Ser536) / IKK complex'] 
         REMOVE n:Nutraceutical SET n:GeneProtein, n.entity_type = 'GeneProtein', n.layer = 'layer_1_target' RETURN count(n) as fixed`,
        `MATCH (n:Nutraceutical) WHERE n.name IN ['Receptor', 'TLR4'] 
         REMOVE n:Nutraceutical SET n:Receptor, n.entity_type = 'Receptor', n.layer = 'layer_1_target' RETURN count(n) as fixed`,
        // Pattern-based: anything with "pathway" in name
        `MATCH (n:Nutraceutical) WHERE n.name =~ '(?i).*pathway.*' OR n.name =~ '(?i).*signaling.*'
         REMOVE n:Nutraceutical SET n:Pathway, n.entity_type = 'Pathway', n.layer = 'layer_1_target' RETURN count(n) as fixed`,
        // Pattern-based: known biological processes
        `MATCH (n:Nutraceutical) WHERE n.name IN ['Lipid peroxidation', 'Lipid metabolism', 'Lipid Metabolism', 'Cell membranes', 'Mitochondria', 'Inflammatory mediators', 'Singlet oxygen', 'Singlet oxygen molecules', 'Systemic antioxidant capacity', 'Fatty acids', 'Dietary Fat', 'No nutraceuticals found', 'Cytokine expression', 'pro-inflammatory cytokines', 'SASP factors', 'NAD+-dependent deacetylase', 'Cellular energy', 'Cellular energy sensor', 'autophagy', 'mitochondrial function'] 
         REMOVE n:Nutraceutical SET n:Entity, n.entity_type = 'Entity', n.layer = 'unknown' RETURN count(n) as fixed`,
      ];
      
      let totalFixed = 0;
      for (const query of reclassifyQueries) {
        try {
          const result = await executeCypherQuery(query, {}, credentials);
          const fixed = result?.data?.values?.[0]?.[0] || 0;
          totalFixed += fixed;
        } catch (e) {
          console.warn(`⚠️ Cleanup query failed: ${e}`);
        }
      }
      console.log(`🔧 Neo4j cleanup: fixed ${totalFixed} misclassified nodes`);
    } catch (cleanupErr) {
      console.warn('Neo4j cleanup warning (non-fatal):', cleanupErr);
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
      reclassified: 0,
      errors: [] as string[],
      nodeTypes: {} as Record<string, number>,
      relationshipTypes: {} as Record<string, number>,
      mechanismPathsCreated: 0,
      reclassifications: [] as string[]
    };

    // Sync each triplet with hierarchical model
    for (const triplet of triplets) {
      try {
        // === RECLASSIFICATION STEP ===
        // Fix misclassified entities before syncing to Neo4j
        const subjectFix = reclassifyEntity(triplet.subject_name, triplet.subject_type);
        if (subjectFix) {
          const oldType = triplet.subject_type;
          triplet.subject_type = subjectFix.type;
          triplet.subject_layer = subjectFix.layer;
          results.reclassified++;
          results.reclassifications.push(`${triplet.subject_name}: ${oldType} → ${subjectFix.type}`);
          console.log(`🔄 Reclassified subject "${triplet.subject_name}": ${oldType} → ${subjectFix.type}`);
        }
        
        const objectFix = reclassifyEntity(triplet.object_name, triplet.object_type);
        if (objectFix) {
          const oldType = triplet.object_type;
          triplet.object_type = objectFix.type;
          triplet.object_layer = objectFix.layer;
          results.reclassified++;
          results.reclassifications.push(`${triplet.object_name}: ${oldType} → ${objectFix.type}`);
          console.log(`🔄 Reclassified object "${triplet.object_name}": ${oldType} → ${objectFix.type}`);
        }

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
