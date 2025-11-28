import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripletExtraction {
  id: string;
  subject_type: string;
  subject_name: string;
  subject_id: string | null;
  predicate: string;
  object_type: string;
  object_name: string;
  object_id: string | null;
  extraction_confidence: number;
  kg_match_score: number;
  llm_confidence: number;
}

interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

/**
 * Executa query Cypher no Neo4j via Query API v2
 */
async function executeCypherQuery(
  cypher: string,
  params: Record<string, any>,
  credentials: Neo4jCredentials
): Promise<any> {
  const authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);
  
  // Converter URI neo4j+s:// para https:// (neo4j:// para http://)
  const httpUri = credentials.uri
    .replace('neo4j+s://', 'https://')
    .replace('neo4j://', 'http://');
  
  console.log(`🔗 Neo4j sync: ${httpUri}/db/neo4j/query/v2`);
  
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
 * Sincroniza triplet aprovado para Neo4j AuraDB
 */
async function syncTripletToNeo4j(
  triplet: TripletExtraction,
  credentials: Neo4jCredentials
): Promise<void> {
  console.log(`Syncing triplet ${triplet.id} to Neo4j...`);

  // Criar nós e relacionamento no Neo4j
  const cypher = `
    // Criar ou atualizar nó subject
    MERGE (subject:Entity {name: $subject_name, type: $subject_type})
    ON CREATE SET 
      subject.id = $subject_id,
      subject.created_at = datetime(),
      subject.source = 'triplet_curation'
    ON MATCH SET
      subject.updated_at = datetime()
    
    // Criar ou atualizar nó object
    MERGE (object:Entity {name: $object_name, type: $object_type})
    ON CREATE SET 
      object.id = $object_id,
      object.created_at = datetime(),
      object.source = 'triplet_curation'
    ON MATCH SET
      object.updated_at = datetime()
    
    // Criar relacionamento com metadata
    MERGE (subject)-[rel:\`${triplet.predicate}\`]->(object)
    ON CREATE SET 
      rel.triplet_id = $triplet_id,
      rel.extraction_confidence = $extraction_confidence,
      rel.kg_match_score = $kg_match_score,
      rel.llm_confidence = $llm_confidence,
      rel.created_at = datetime(),
      rel.approved = true
    ON MATCH SET
      rel.extraction_confidence = $extraction_confidence,
      rel.kg_match_score = $kg_match_score,
      rel.llm_confidence = $llm_confidence,
      rel.updated_at = datetime()
    
    RETURN subject, rel, object
  `;

  const params = {
    subject_name: triplet.subject_name,
    subject_type: triplet.subject_type,
    subject_id: triplet.subject_id || triplet.subject_name,
    object_name: triplet.object_name,
    object_type: triplet.object_type,
    object_id: triplet.object_id || triplet.object_name,
    triplet_id: triplet.id,
    extraction_confidence: triplet.extraction_confidence,
    kg_match_score: triplet.kg_match_score,
    llm_confidence: triplet.llm_confidence
  };

  await executeCypherQuery(cypher, params, credentials);
  console.log(`Triplet ${triplet.id} synced successfully`);
}

/**
 * Busca credenciais Neo4j da tabela ai_configurations
 */
async function getNeo4jCredentials(supabase: any): Promise<Neo4jCredentials | null> {
  const { data, error } = await supabase
    .from('ai_configurations')
    .select('config_key, config_value')
    .in('config_key', ['neo4j_uri', 'neo4j_username', 'neo4j_password']);
  
  if (error || !data || data.length < 3) {
    console.error('Failed to fetch Neo4j credentials from database:', error);
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
 * Edge Function principal
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar credenciais Neo4j da tabela ai_configurations
    const credentials = await getNeo4jCredentials(supabase);
    
    if (!credentials) {
      console.error('Neo4j credentials not configured in database');
      return new Response(
        JSON.stringify({ 
          error: 'Neo4j credentials not configured',
          message: 'Please configure NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in AI Configuration tab'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar triplets aprovados não sincronizados
    const { data: triplets, error: fetchError } = await supabase
      .from('triplet_extractions')
      .select('*')
      .eq('curation_status', 'approved')
      .is('synced_to_neo4j', false)
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${triplets?.length || 0} triplets to sync`);

    if (!triplets || triplets.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No triplets to sync',
          synced: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sincronizar cada triplet
    const results = {
      total: triplets.length,
      synced: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const triplet of triplets) {
      try {
        await syncTripletToNeo4j(triplet as TripletExtraction, credentials);
        
        // Marcar como sincronizado no Supabase
        await supabase
          .from('triplet_extractions')
          .update({ synced_to_neo4j: true, synced_at: new Date().toISOString() })
          .eq('id', triplet.id);
        
        results.synced++;
      } catch (error: any) {
        console.error(`Failed to sync triplet ${triplet.id}:`, error);
        results.failed++;
        results.errors.push(`${triplet.id}: ${error.message}`);
      }
    }

    console.log('Sync complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in sync-approved-triplets:', error);
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
