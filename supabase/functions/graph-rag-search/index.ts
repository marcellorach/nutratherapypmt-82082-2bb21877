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
  queryType: 'path' | 'cypher' | 'entity' | 'context';
  sourceEntity?: string;
  targetEntity?: string;
  entityType?: string;
  cypherQuery?: string;
  parameters?: Record<string, any>;
  maxDepth?: number;
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
}

async function getNeo4jCredentials(supabase: any): Promise<Neo4jCredentials | null> {
  const { data, error } = await supabase
    .from('ai_configurations')
    .select('config_value')
    .eq('config_key', 'neo4j_credentials')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Failed to get Neo4j credentials:', error);
    return null;
  }

  return data.config_value as Neo4jCredentials;
}

async function executeCypherQuery(
  cypher: string,
  params: Record<string, any>,
  credentials: Neo4jCredentials
): Promise<any> {
  const auth = btoa(`${credentials.username}:${credentials.password}`);
  
  const response = await fetch(`${credentials.uri}/db/neo4j/tx/commit`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      statements: [{
        statement: cypher,
        parameters: params
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Neo4j query failed: ${error}`);
  }

  const result = await response.json();
  
  if (result.errors && result.errors.length > 0) {
    throw new Error(`Neo4j errors: ${JSON.stringify(result.errors)}`);
  }

  return result.results[0];
}

function formatGraphData(neo4jResult: any): GraphRAGResult {
  const nodes = new Map<string, GraphNode>();
  const relationships: GraphRelationship[] = [];
  const paths: Array<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> = [];

  if (!neo4jResult?.data) {
    return { nodes: [], relationships: [], paths: [], context: '' };
  }

  neo4jResult.data.forEach((row: any) => {
    row.graph?.nodes?.forEach((node: any) => {
      const nodeId = node.id;
      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, {
          id: nodeId,
          label: node.labels[0] || 'Unknown',
          type: node.labels[0] || 'Unknown',
          properties: node.properties || {}
        });
      }
    });

    row.graph?.relationships?.forEach((rel: any) => {
      relationships.push({
        type: rel.type,
        source: rel.startNode,
        target: rel.endNode,
        properties: rel.properties || {}
      });
    });
  });

  // Gerar contexto textual dos dados
  const contextParts: string[] = [];
  nodes.forEach(node => {
    const name = node.properties.name || node.properties.title || node.id;
    contextParts.push(`${node.type}: ${name}`);
  });
  
  relationships.forEach(rel => {
    const source = nodes.get(rel.source);
    const target = nodes.get(rel.target);
    if (source && target) {
      const sourceName = source.properties.name || source.id;
      const targetName = target.properties.name || target.id;
      contextParts.push(`${sourceName} -[${rel.type}]-> ${targetName}`);
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    relationships,
    paths,
    context: contextParts.join('\n')
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

    // Construir query baseado no tipo
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
        // Buscar contexto rico para GraphRAG
        cypherQuery = `
          MATCH (n:Nutraceutical)-[r1:TREATS|PREVENTS|SUPPORTS]->(c:Condition)
          WHERE n.name =~ $pattern OR c.name =~ $pattern
          OPTIONAL MATCH (n)-[r2:HAS_MECHANISM]->(m:Mechanism)
          OPTIONAL MATCH (n)-[r3:CAUSES_EFFECT]->(e:Effect)
          RETURN n, r1, c, r2, m, r3, e
          LIMIT 100
        `;
        parameters = { pattern: `(?i).*${request.sourceEntity || ''}.*` };
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
          queryType: request.queryType
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
