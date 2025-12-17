import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OntologyEntity {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_name_en: string | null;
  entity_type: string;
  canonical_name: string;
  synonyms: string[];
  description: string | null;
  description_en: string | null;
  parent_id: string | null;
  layer: string;
  source: string;
  external_ids: Record<string, string>;
  properties: Record<string, any>;
}

interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

// Map entity types to Neo4j labels
const ENTITY_TYPE_TO_LABEL: Record<string, string> = {
  'species': 'Species',
  'breed': 'Breed',
  'condition': 'Condition',
  'compound': 'Compound',
  'mechanism': 'Mechanism',
  'pathway': 'Pathway',
  'effect': 'BiologicalEffect',
};

// Map entity types to layers in the 5-layer model
const ENTITY_TYPE_TO_LAYER: Record<string, string> = {
  'compound': 'layer_0_compound',
  'pathway': 'layer_1_target',
  'mechanism': 'layer_2_mechanism',
  'effect': 'layer_3_effect',
  'condition': 'layer_4_outcome',
  'species': 'context_species',
  'breed': 'context_breed',
};

async function getNeo4jCredentials(supabase: any): Promise<Neo4jCredentials | null> {
  console.log('[Neo4j] Fetching credentials from ai_configurations...');
  
  const { data, error } = await supabase
    .from('ai_configurations')
    .select('config_value')
    .eq('config_key', 'neo4j_credentials')
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    console.error('[Neo4j] Error fetching credentials:', error);
    return null;
  }
  
  const config = data.config_value as Neo4jCredentials;
  
  if (!config.uri || !config.username || !config.password) {
    console.error('[Neo4j] Invalid credentials configuration');
    return null;
  }
  
  console.log('[Neo4j] Credentials loaded successfully');
  return config;
}

async function executeCypherQuery(
  cypher: string, 
  params: Record<string, any>, 
  credentials: Neo4jCredentials
): Promise<any> {
  const txEndpoint = `${credentials.uri}/db/neo4j/tx/commit`;
  
  const response = await fetch(txEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${credentials.username}:${credentials.password}`),
    },
    body: JSON.stringify({
      statements: [{
        statement: cypher,
        parameters: params,
      }],
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Neo4j HTTP error ${response.status}: ${errorText}`);
  }
  
  const result = await response.json();
  
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Neo4j query error: ${JSON.stringify(result.errors)}`);
  }
  
  return result;
}

async function syncEntityToNeo4j(
  entity: OntologyEntity,
  credentials: Neo4jCredentials
): Promise<void> {
  const label = ENTITY_TYPE_TO_LABEL[entity.entity_type] || 'OntologyEntity';
  const layer = ENTITY_TYPE_TO_LAYER[entity.entity_type] || 'ontology_base';
  
  console.log(`[Sync] Creating/updating ${label} node: ${entity.entity_id}`);
  
  // Create or update the entity node with OntologyBase label
  const nodeCypher = `
    MERGE (n:OntologyBase {entity_id: $entity_id})
    SET n:${label}
    SET n += {
      name: $name,
      name_en: $name_en,
      canonical_name: $canonical_name,
      description: $description,
      description_en: $description_en,
      entity_type: $entity_type,
      layer: $layer,
      source: $source,
      synonyms: $synonyms,
      external_ids: $external_ids,
      properties: $properties,
      supabase_id: $supabase_id,
      is_ontology_base: true,
      updated_at: datetime()
    }
    RETURN n
  `;
  
  await executeCypherQuery(nodeCypher, {
    entity_id: entity.entity_id,
    name: entity.entity_name,
    name_en: entity.entity_name_en || entity.entity_name,
    canonical_name: entity.canonical_name,
    description: entity.description,
    description_en: entity.description_en,
    entity_type: entity.entity_type,
    layer: layer,
    source: entity.source,
    synonyms: entity.synonyms || [],
    external_ids: JSON.stringify(entity.external_ids || {}),
    properties: JSON.stringify(entity.properties || {}),
    supabase_id: entity.id,
  }, credentials);
  
  // Create parent relationship if exists (IS_A hierarchy)
  if (entity.parent_id) {
    console.log(`[Sync] Creating IS_A relationship: ${entity.entity_id} -> ${entity.parent_id}`);
    
    const relationCypher = `
      MATCH (child:OntologyBase {entity_id: $child_id})
      MATCH (parent:OntologyBase {entity_id: $parent_id})
      MERGE (child)-[r:IS_A]->(parent)
      SET r.created_at = coalesce(r.created_at, datetime())
      RETURN r
    `;
    
    await executeCypherQuery(relationCypher, {
      child_id: entity.entity_id,
      parent_id: entity.parent_id,
    }, credentials);
  }
  
  // Create synonym nodes and relationships
  if (entity.synonyms && entity.synonyms.length > 0) {
    for (const synonym of entity.synonyms) {
      const synonymCypher = `
        MATCH (n:OntologyBase {entity_id: $entity_id})
        MERGE (s:Synonym {name: $synonym})
        MERGE (n)-[r:HAS_SYNONYM]->(s)
        RETURN s
      `;
      
      await executeCypherQuery(synonymCypher, {
        entity_id: entity.entity_id,
        synonym: synonym,
      }, credentials);
    }
  }
  
  // Create predisposition relationships for breeds
  if (entity.entity_type === 'breed' && entity.properties?.predispositions) {
    const predispositions = entity.properties.predispositions as string[];
    for (const predisposition of predispositions) {
      // Try to find matching condition
      const predispositionCypher = `
        MATCH (breed:OntologyBase {entity_id: $breed_id})
        MATCH (condition:OntologyBase)
        WHERE condition.entity_type = 'condition' 
          AND (condition.entity_id CONTAINS $predisposition 
               OR toLower(condition.name) CONTAINS toLower($predisposition)
               OR any(syn IN condition.synonyms WHERE toLower(syn) CONTAINS toLower($predisposition)))
        MERGE (breed)-[r:PREDISPOSED_TO]->(condition)
        SET r.source = 'ontology_base'
        SET r.created_at = coalesce(r.created_at, datetime())
        RETURN r
      `;
      
      try {
        await executeCypherQuery(predispositionCypher, {
          breed_id: entity.entity_id,
          predisposition: predisposition,
        }, credentials);
      } catch (err) {
        console.log(`[Sync] Could not create predisposition link for ${predisposition}: ${err}`);
      }
    }
  }
}

async function createOntologyIndexes(credentials: Neo4jCredentials): Promise<void> {
  console.log('[Sync] Creating Neo4j indexes for ontology...');
  
  const indexes = [
    'CREATE INDEX ontology_entity_id IF NOT EXISTS FOR (n:OntologyBase) ON (n.entity_id)',
    'CREATE INDEX ontology_entity_type IF NOT EXISTS FOR (n:OntologyBase) ON (n.entity_type)',
    'CREATE INDEX ontology_layer IF NOT EXISTS FOR (n:OntologyBase) ON (n.layer)',
    'CREATE INDEX ontology_canonical_name IF NOT EXISTS FOR (n:OntologyBase) ON (n.canonical_name)',
    'CREATE INDEX compound_entity_id IF NOT EXISTS FOR (n:Compound) ON (n.entity_id)',
    'CREATE INDEX condition_entity_id IF NOT EXISTS FOR (n:Condition) ON (n.entity_id)',
    'CREATE INDEX breed_entity_id IF NOT EXISTS FOR (n:Breed) ON (n.entity_id)',
    'CREATE INDEX mechanism_entity_id IF NOT EXISTS FOR (n:Mechanism) ON (n.entity_id)',
  ];
  
  for (const indexQuery of indexes) {
    try {
      await executeCypherQuery(indexQuery, {}, credentials);
    } catch (err) {
      console.log(`[Sync] Index may already exist: ${err}`);
    }
  }
  
  console.log('[Sync] Indexes created/verified');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('[SyncOntology] Starting ontology sync to Neo4j...');
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { entity_types, force_resync } = body;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Neo4j credentials
    const credentials = await getNeo4jCredentials(supabase);
    if (!credentials) {
      throw new Error('Neo4j credentials not configured. Please add them in AI Configurations.');
    }
    
    // Create indexes first
    await createOntologyIndexes(credentials);
    
    // Build query for ontology entities
    let query = supabase
      .from('veterinary_ontology')
      .select('*')
      .eq('layer', 'ontology_base');
    
    // Filter by entity types if specified
    if (entity_types && Array.isArray(entity_types) && entity_types.length > 0) {
      query = query.in('entity_type', entity_types);
    }
    
    // Fetch ontology entities
    const { data: entities, error: fetchError } = await query;
    
    if (fetchError) {
      throw new Error(`Failed to fetch ontology entities: ${fetchError.message}`);
    }
    
    if (!entities || entities.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No ontology entities found to sync',
        synced_count: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[SyncOntology] Found ${entities.length} entities to sync`);
    
    // Sync entities in order: species first, then breeds (for parent relationships)
    const entityOrder = ['species', 'condition', 'compound', 'mechanism', 'pathway', 'effect', 'breed'];
    const sortedEntities = [...entities].sort((a, b) => {
      const aIndex = entityOrder.indexOf(a.entity_type);
      const bIndex = entityOrder.indexOf(b.entity_type);
      return aIndex - bIndex;
    });
    
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const entity of sortedEntities) {
      try {
        await syncEntityToNeo4j(entity as OntologyEntity, credentials);
        syncedCount++;
      } catch (err) {
        errorCount++;
        const errorMsg = `Failed to sync ${entity.entity_id}: ${err}`;
        console.error(`[SyncOntology] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    // Create cross-layer relationships after all nodes exist
    console.log('[SyncOntology] Creating cross-layer relationships...');
    
    // Example: Compound -> Mechanism relationships (known from ontology)
    const knownRelationships = [
      { compound: 'COMPOUND:glucosamine', mechanism: 'MECHANISM:chondroprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:chondroitin', mechanism: 'MECHANISM:chondroprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:omega3_epa', mechanism: 'MECHANISM:anti_inflammatory', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:omega3_dha', mechanism: 'MECHANISM:anti_inflammatory', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:curcumin', mechanism: 'MECHANISM:anti_inflammatory', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:curcumin', mechanism: 'MECHANISM:antioxidant', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:resveratrol', mechanism: 'MECHANISM:antioxidant', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:resveratrol', mechanism: 'MECHANISM:mitochondrial_support', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:coenzyme_q10', mechanism: 'MECHANISM:mitochondrial_support', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:coenzyme_q10', mechanism: 'MECHANISM:cardioprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:sam_e', mechanism: 'MECHANISM:hepatoprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:sam_e', mechanism: 'MECHANISM:neuroprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:milk_thistle', mechanism: 'MECHANISM:hepatoprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:taurine', mechanism: 'MECHANISM:cardioprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:l_carnitine', mechanism: 'MECHANISM:mitochondrial_support', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:phosphatidylserine', mechanism: 'MECHANISM:neuroprotective', relation: 'ACTIVATES' },
      { compound: 'COMPOUND:msm', mechanism: 'MECHANISM:anti_inflammatory', relation: 'ACTIVATES' },
    ];
    
    for (const rel of knownRelationships) {
      try {
        const relCypher = `
          MATCH (c:OntologyBase {entity_id: $compound_id})
          MATCH (m:OntologyBase {entity_id: $mechanism_id})
          MERGE (c)-[r:${rel.relation}]->(m)
          SET r.source = 'ontology_base'
          SET r.evidence_level = 'established'
          SET r.created_at = coalesce(r.created_at, datetime())
          RETURN r
        `;
        
        await executeCypherQuery(relCypher, {
          compound_id: rel.compound,
          mechanism_id: rel.mechanism,
        }, credentials);
      } catch (err) {
        console.log(`[SyncOntology] Could not create relationship ${rel.compound} -> ${rel.mechanism}: ${err}`);
      }
    }
    
    // Mechanism -> Effect relationships
    const mechanismEffectRelations = [
      { mechanism: 'MECHANISM:anti_inflammatory', effect: 'EFFECT:reduced_inflammation', relation: 'LEADS_TO' },
      { mechanism: 'MECHANISM:anti_inflammatory', effect: 'EFFECT:pain_relief', relation: 'LEADS_TO' },
      { mechanism: 'MECHANISM:chondroprotective', effect: 'EFFECT:improved_mobility', relation: 'LEADS_TO' },
      { mechanism: 'MECHANISM:neuroprotective', effect: 'EFFECT:cognitive_improvement', relation: 'LEADS_TO' },
      { mechanism: 'MECHANISM:cardioprotective', effect: 'EFFECT:cardiac_function_improvement', relation: 'LEADS_TO' },
      { mechanism: 'MECHANISM:hepatoprotective', effect: 'EFFECT:liver_enzyme_normalization', relation: 'LEADS_TO' },
      { mechanism: 'MECHANISM:antioxidant', effect: 'EFFECT:reduced_oxidative_stress', relation: 'LEADS_TO' },
    ];
    
    for (const rel of mechanismEffectRelations) {
      try {
        const relCypher = `
          MATCH (m:OntologyBase {entity_id: $mechanism_id})
          MATCH (e:OntologyBase {entity_id: $effect_id})
          MERGE (m)-[r:${rel.relation}]->(e)
          SET r.source = 'ontology_base'
          SET r.created_at = coalesce(r.created_at, datetime())
          RETURN r
        `;
        
        await executeCypherQuery(relCypher, {
          mechanism_id: rel.mechanism,
          effect_id: rel.effect,
        }, credentials);
      } catch (err) {
        console.log(`[SyncOntology] Could not create relationship ${rel.mechanism} -> ${rel.effect}: ${err}`);
      }
    }
    
    console.log(`[SyncOntology] Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Ontology sync completed`,
      synced_count: syncedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        total_entities: entities.length,
        by_type: entities.reduce((acc, e) => {
          acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[SyncOntology] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
