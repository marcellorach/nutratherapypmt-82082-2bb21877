import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  intensity: number | null;
  direction: string | null;
  evidence_level: string | null;
  dose_dependent: boolean | null;
  dose_range: any | null;
  species_context: string[] | null;
  mechanism_path: any[] | null;
  relationship_category: string | null;
  synergy_data: any | null;
  extraction_confidence: number;
  kg_match_score: number;
  llm_confidence: number;
  curation_status: string;
}

interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

const ENTITY_TYPE_TO_LABEL: Record<string, string> = {
  'nutraceutical': 'Nutraceutical',
  'drug': 'Drug',
  'chemical_compound': 'ChemicalCompound',
  'pathway': 'Pathway',
  'receptor': 'Receptor',
  'enzyme': 'Enzyme',
  'gene_protein': 'GeneProtein',
  'mechanism': 'Mechanism',
  'signaling_cascade': 'SignalingCascade',
  'biological_effect': 'BiologicalEffect',
  'side_effect': 'SideEffect',
  'clinical_outcome': 'ClinicalOutcome',
  'condition': 'Condition',
  'disease': 'Disease',
  'breed': 'Breed',
  'species': 'Species',
  'age_group': 'AgeGroup',
  'study': 'Study',
  'target': 'Target',
  'effect': 'BiologicalEffect',
  'unknown': 'Entity'
};

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

function getNodeLabel(entityType: string): string {
  const normalized = (entityType || 'unknown').toLowerCase().trim();
  return ENTITY_TYPE_TO_LABEL[normalized] || 'Entity';
}

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

async function syncTripletToNeo4j(
  triplet: TripletExtraction,
  credentials: Neo4jCredentials
): Promise<void> {
  console.log(`🔄 Syncing triplet ${triplet.id}: ${triplet.subject_name} -[${triplet.predicate}]-> ${triplet.object_name}`);

  const subjectLabel = getNodeLabel(triplet.subject_type);
  const objectLabel = getNodeLabel(triplet.object_type);

  // Include curation_status in the relationship properties
  const cypher = `
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
      rel.curation_status = $curation_status,
      rel.created_at = datetime(),
      rel.curated = CASE WHEN $curation_status = 'approved' THEN true ELSE false END,
      rel.evidence_count = 1
    ON MATCH SET
      rel.updated_at = datetime(),
      rel.evidence_count = coalesce(rel.evidence_count, 0) + 1,
      rel.curation_status = $curation_status,
      rel.curated = CASE WHEN $curation_status = 'approved' THEN true ELSE rel.curated END,
      rel.extraction_confidence = CASE 
        WHEN $extraction_confidence > coalesce(rel.extraction_confidence, 0) 
        THEN $extraction_confidence 
        ELSE rel.extraction_confidence 
      END
    
    RETURN subject.name AS subject, type(rel) AS relationship, object.name AS object
  `;

  const params = {
    subject_name: triplet.subject_name,
    subject_type: triplet.subject_type,
    subject_id: triplet.subject_id,
    subject_layer: triplet.subject_layer || 'unknown',
    object_name: triplet.object_name,
    object_type: triplet.object_type,
    object_id: triplet.object_id,
    object_layer: triplet.object_layer || 'unknown',
    triplet_id: triplet.id,
    study_id: triplet.study_id,
    extraction_confidence: triplet.extraction_confidence,
    kg_match_score: triplet.kg_match_score,
    llm_confidence: triplet.llm_confidence,
    intensity: triplet.intensity,
    direction: triplet.direction,
    evidence_level: triplet.evidence_level,
    dose_dependent: triplet.dose_dependent,
    dose_range: triplet.dose_range ? JSON.stringify(triplet.dose_range) : null,
    species_context: triplet.species_context,
    relationship_category: triplet.relationship_category,
    synergy_data: triplet.synergy_data ? JSON.stringify(triplet.synergy_data) : null,
    curation_status: triplet.curation_status
  };

  await executeCypherQuery(cypher, params, credentials);
  console.log(`✅ Triplet ${triplet.id} synced: ${subjectLabel} -[${triplet.predicate}]-> ${objectLabel}`);
}

async function getNeo4jCredentials(supabase: any): Promise<Neo4jCredentials | null> {
  console.log('🔑 Fetching Neo4j credentials...');
  
  const { data, error } = await supabase
    .from('ai_configurations')
    .select('config_key, config_value')
    .in('config_key', ['neo4j_uri', 'neo4j_username', 'neo4j_password']);
  
  if (error || !data || data.length < 3) {
    console.error('❌ Failed to fetch Neo4j credentials:', error);
    return null;
  }
  
  const config: Record<string, string> = {};
  data.forEach((item: any) => {
    // Handle both JSONB string values (with quotes) and plain strings
    let value = item.config_value;
    if (typeof value === 'string') {
      // Remove surrounding quotes if present
      value = value.replace(/^"(.*)"$/, '$1');
    }
    config[item.config_key] = value;
    console.log(`🔑 ${item.config_key}: ${item.config_key === 'neo4j_password' ? '***' : value}`);
  });
  
  if (!config.neo4j_uri || !config.neo4j_username || !config.neo4j_password) {
    console.error('❌ Missing Neo4j credentials');
    return null;
  }
  
  console.log('✅ Neo4j credentials loaded successfully');
  return {
    uri: config.neo4j_uri,
    username: config.neo4j_username,
    password: config.neo4j_password
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyId } = await req.json();

    if (!studyId) {
      return new Response(
        JSON.stringify({ error: 'studyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 [SYNC-STUDY-TO-NEO4J] Starting sync for study: ${studyId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Fetch ALL triplets for this study (no curation_status filter!)
    const { data: triplets, error: fetchError } = await supabase
      .from('triplet_extractions')
      .select(`
        id, study_id, curation_status,
        subject_type, subject_name, subject_id, subject_layer,
        predicate,
        object_type, object_name, object_id, object_layer,
        intensity, direction, evidence_level, dose_dependent, dose_range,
        species_context, mechanism_path, relationship_category, synergy_data,
        extraction_confidence, kg_match_score, llm_confidence
      `)
      .eq('study_id', studyId)
      .is('synced_to_neo4j', false)
      .limit(500);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📦 Found ${triplets?.length || 0} triplets to sync for study ${studyId}`);

    if (!triplets || triplets.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No triplets to sync for this study',
          studyId,
          synced: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      studyId,
      total: triplets.length,
      synced: 0,
      failed: 0,
      errors: [] as string[],
      byStatus: {} as Record<string, number>
    };

    for (const triplet of triplets) {
      try {
        await syncTripletToNeo4j(triplet as TripletExtraction, credentials);
        
        await supabase
          .from('triplet_extractions')
          .update({ 
            synced_to_neo4j: true, 
            synced_at: new Date().toISOString() 
          })
          .eq('id', triplet.id);
        
        results.synced++;
        
        const status = triplet.curation_status || 'pending';
        results.byStatus[status] = (results.byStatus[status] || 0) + 1;

      } catch (err: any) {
        console.error(`❌ Failed to sync triplet ${triplet.id}:`, err);
        results.failed++;
        results.errors.push(`${triplet.id}: ${err.message}`);
      }
    }

    console.log(`✅ [SYNC-STUDY-TO-NEO4J] Complete: ${results.synced}/${results.total} synced`);
    console.log(`📊 By status:`, results.byStatus);

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [SYNC-STUDY-TO-NEO4J] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
