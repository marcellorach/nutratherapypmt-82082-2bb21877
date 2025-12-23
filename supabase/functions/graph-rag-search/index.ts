import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

interface GraphRAGRequest {
  queryType: 'path' | 'cypher' | 'entity' | 'context' | 'byStudy';
  sourceEntity?: string;
  targetEntity?: string;
  entityType?: string;
  cypherQuery?: string;
  parameters?: Record<string, any>;
  maxDepth?: number;
  studyId?: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphRelationship {
  type: string;
  source: string;
  target: string;
  properties: Record<string, any>;
}

interface GraphRAGResult {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  paths: Array<{
    nodes: GraphNode[];
    relationships: GraphRelationship[];
  }>;
  context: string;
  rows?: any[];
  fields?: string[];
}

async function getNeo4jCredentials(supabase: any): Promise<Neo4jCredentials | null> {
  const { data, error } = await supabase
    .from('ai_configurations')
    .select('config_key, config_value')
    .in('config_key', ['neo4j_uri', 'neo4j_username', 'neo4j_password'])
    .eq('is_active', true);

  if (error || !data || data.length === 0) {
    console.error('Failed to get Neo4j credentials:', error);
    return null;
  }

  const credentials: Partial<Neo4jCredentials> = {};
  data.forEach((row: any) => {
    if (row.config_key === 'neo4j_uri') credentials.uri = row.config_value;
    if (row.config_key === 'neo4j_username') credentials.username = row.config_value;
    if (row.config_key === 'neo4j_password') credentials.password = row.config_value;
  });

  if (!credentials.uri || !credentials.username || !credentials.password) {
    console.error('Incomplete Neo4j credentials');
    return null;
  }

  return credentials as Neo4jCredentials;
}

async function executeCypherQuery(
  cypher: string,
  params: Record<string, any>,
  credentials: Neo4jCredentials
): Promise<any> {
  const auth = btoa(`${credentials.username}:${credentials.password}`);
  
  // Converter URI neo4j+s:// para https:// para Query API v2
  const httpUri = credentials.uri
    .replace('neo4j+s://', 'https://')
    .replace('neo4j://', 'http://');
  const queryEndpoint = `${httpUri}/db/neo4j/query/v2`;
  
  console.log(`🔗 Conectando ao Neo4j Query API v2: ${queryEndpoint}`);
  
  const response = await fetch(queryEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      statement: cypher,
      parameters: params
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Neo4j Query API v2 failed (${response.status}):`, error);
    throw new Error(`Neo4j query failed (${response.status}): ${error}`);
  }

  const result = await response.json();
  
  console.log('📦 Neo4j raw response structure:', {
    hasData: !!result.data,
    hasFields: !!result.data?.fields,
    fieldsCount: result.data?.fields?.length || 0,
    valuesCount: result.data?.values?.length || 0,
    hasErrors: result.errors?.length > 0
  });
  
  if (result.data?.values?.length > 0) {
    console.log('📊 First row sample:', JSON.stringify(result.data.values[0]).substring(0, 500));
  }
  
  if (result.errors && result.errors.length > 0) {
    console.error('❌ Neo4j errors:', result.errors);
    throw new Error(`Neo4j errors: ${JSON.stringify(result.errors)}`);
  }

  return {
    fields: result.data?.fields || [],
    values: result.data?.values || []
  };
}

/**
 * Generate a canonical ID for a Neo4j node.
 * Priority: properties.id (uuid from Supabase) > elementId > fallback
 */
function getCanonicalNodeId(element: any, fallback: string): string {
  // Prefer the UUID from properties (matches Supabase records)
  if (element.properties?.id) {
    return String(element.properties.id);
  }
  // Fall back to elementId (Neo4j internal ID)
  if (element.elementId) {
    return String(element.elementId);
  }
  return fallback;
}

function formatGraphData(neo4jResult: any): GraphRAGResult {
  const nodes = new Map<string, GraphNode>();
  const relationships: GraphRelationship[] = [];
  const paths: Array<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> = [];

  const fields = neo4jResult?.fields || [];
  const values = neo4jResult?.values || [];

  console.log(`🔍 formatGraphData: ${fields.length} fields, ${values.length} rows`);

  if (values.length === 0) {
    console.log('⚠️ No data returned from Neo4j');
    return { nodes: [], relationships: [], paths: [], context: '' };
  }

  // First pass: collect all nodes and build ID mapping
  // Key = elementId, Value = canonical ID (we need this to map relationship endpoints)
  const elementIdToCanonicalId = new Map<string, string>();

  values.forEach((row: any[], rowIdx: number) => {
    row.forEach((element: any, colIdx: number) => {
      if (!element) return;
      
      // Detect if it's a node (has labels)
      if (element.labels && Array.isArray(element.labels)) {
        const canonicalId = getCanonicalNodeId(element, `node-${rowIdx}-${colIdx}`);
        
        // Store mapping from elementId to canonical ID
        if (element.elementId) {
          elementIdToCanonicalId.set(element.elementId, canonicalId);
        }
        
        if (!nodes.has(canonicalId)) {
          const props = element.properties || {};
          nodes.set(canonicalId, {
            id: canonicalId,
            label: props.name || props.title || element.labels[0] || 'Unknown',
            type: element.labels[0] || 'Unknown',
            properties: props
          });
          console.log(`  ✅ Node [${canonicalId}]: ${element.labels[0]} - ${props.name || 'unnamed'}`);
        }
      }
    });
  });

  console.log(`📊 Nodes collected: ${nodes.size}, ID mappings: ${elementIdToCanonicalId.size}`);

  // Second pass: process relationships using the ID mapping
  values.forEach((row: any[], rowIdx: number) => {
    row.forEach((element: any, colIdx: number) => {
      if (!element) return;
      
      // Detect if it's a relationship (has type and startNodeElementId)
      if (element.type && (element.startNodeElementId || element.startNode)) {
        const startElementId = element.startNodeElementId || element.startNode;
        const endElementId = element.endNodeElementId || element.endNode;
        
        // Map element IDs to canonical IDs
        const sourceId = elementIdToCanonicalId.get(startElementId) || startElementId;
        const targetId = elementIdToCanonicalId.get(endElementId) || endElementId;
        
        // Only add relationship if both nodes exist
        if (nodes.has(sourceId) && nodes.has(targetId)) {
          relationships.push({
            type: element.type,
            source: sourceId,
            target: targetId,
            properties: element.properties || {}
          });
          console.log(`  🔗 Rel [${sourceId}] -[${element.type}]-> [${targetId}]`);
        } else {
          console.log(`  ⚠️ Skipped rel: source=${sourceId} (exists: ${nodes.has(sourceId)}), target=${targetId} (exists: ${nodes.has(targetId)})`);
        }
      }
    });
  });

  console.log(`📊 Final result: ${nodes.size} nodes, ${relationships.length} relationships`);

  // Generate textual context
  const contextParts: string[] = [];
  nodes.forEach(node => {
    const name = node.properties.name || node.properties.title || node.label;
    contextParts.push(`${node.type}: ${name}`);
  });
  
  relationships.forEach(rel => {
    const source = nodes.get(rel.source);
    const target = nodes.get(rel.target);
    if (source && target) {
      const sourceName = source.properties.name || source.label;
      const targetName = target.properties.name || target.label;
      contextParts.push(`${sourceName} -[${rel.type}]-> ${targetName}`);
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    relationships,
    paths,
    context: contextParts.join('\n'),
    rows: values,
    fields: fields
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const credentials = await getNeo4jCredentials(supabaseClient);
    if (!credentials) {
      return new Response(
        JSON.stringify({ error: 'Neo4j credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request: GraphRAGRequest = await req.json();
    let cypherQuery = '';
    let parameters: Record<string, any> = {};

    // Build query based on type
    switch (request.queryType) {
      case 'path':
        if (!request.sourceEntity || !request.targetEntity) {
          throw new Error('sourceEntity and targetEntity required for path query');
        }
        cypherQuery = `
          MATCH path = shortestPath(
            (source {name: $sourceName})-[*1..${request.maxDepth || 3}]-(target {name: $targetName})
          )
          RETURN path
        `;
        parameters = {
          sourceName: request.sourceEntity,
          targetName: request.targetEntity
        };
        break;

      case 'entity':
        if (!request.sourceEntity) {
          throw new Error('sourceEntity required for entity query');
        }
        cypherQuery = `
          MATCH (n {name: $name})-[r]-(connected)
          RETURN n, r, connected
          LIMIT 50
        `;
        parameters = { name: request.sourceEntity };
        break;

      case 'context':
        cypherQuery = `
          MATCH (n)-[r]->(m)
          WHERE n.name =~ $pattern OR m.name =~ $pattern
          RETURN n, r, m
          LIMIT 100
        `;
        parameters = { pattern: `(?i).*${request.sourceEntity || ''}.*` };
        break;

      case 'byStudy':
        if (!request.studyId) {
          throw new Error('studyId required for byStudy query');
        }
        cypherQuery = `
          MATCH (subject)-[rel {study_id: $studyId}]->(object)
          RETURN subject, rel, object
          LIMIT 200
        `;
        parameters = { studyId: request.studyId };
        break;

      case 'cypher':
        if (!request.cypherQuery) {
          throw new Error('cypherQuery required for cypher query type');
        }
        cypherQuery = request.cypherQuery;
        parameters = request.parameters || {};
        break;

      default:
        throw new Error(`Unknown queryType: ${request.queryType}`);
    }

    console.log('Executing Cypher:', cypherQuery);
    console.log('Parameters:', parameters);

    const result = await executeCypherQuery(cypherQuery, parameters, credentials);
    const graphData = formatGraphData(result);

    return new Response(
      JSON.stringify({
        success: true,
        query: cypherQuery,
        data: graphData,
        metadata: {
          nodeCount: graphData.nodes.length,
          relationshipCount: graphData.relationships.length,
          queryType: request.queryType,
          source: 'neo4j'
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        }
      }
    );

  } catch (error) {
    console.error('Error in graph-rag-search:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        }
      }
    );
  }
});
