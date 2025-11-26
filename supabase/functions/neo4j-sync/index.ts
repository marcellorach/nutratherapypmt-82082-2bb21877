import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedStudyData {
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  doi?: string;
  nutraceuticals: Array<{
    name: string;
    dosage?: string;
    effects: string;
    efficacy_score?: number;
  }>;
  mechanisms: Array<{
    name: string;
    type: 'pathway' | 'mediator' | 'enzyme' | 'receptor' | 'gene' | 'protein';
    description: string;
    confidence?: number;
  }>;
  biological_effects: Array<{
    name: string;
    type: 'intermediate' | 'biomarker' | 'physiological';
    description: string;
    confidence?: number;
  }>;
  conditions: Array<{
    name: string;
    relationship_type: string;
    efficacy_description?: string;
    treatability_score?: number;
    severity?: string;
  }>;
  interactions: Array<{
    from: string;
    to: string;
    type: 'inhibition' | 'stimulation' | 'modulation';
    description: string;
    confidence?: number;
  }>;
}

interface Neo4jCredentials {
  uri: string;
  username: string;
  password: string;
}

interface SyncResult {
  success: boolean;
  nodesCreated: number;
  edgesCreated: number;
  graphSummary: {
    nutraceuticals: number;
    mechanisms: number;
    effects: number;
    conditions: number;
    studies: number;
  };
  error?: string;
}

/**
 * Executa Cypher query no Neo4j via REST API
 */
async function executeCypherQuery(
  cypher: string,
  params: Record<string, any>,
  credentials: Neo4jCredentials
): Promise<any> {
  const authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  
  // Usar endpoint HTTP do Neo4j (não bolt)
  const httpUri = credentials.uri.replace('neo4j+s://', 'https://').replace('neo4j://', 'http://');
  const url = `${httpUri}/db/neo4j/tx/commit`;
  
  console.log('🔍 Executando Cypher query...');
  console.log('📋 URL:', url);
  console.log('📋 Query preview:', cypher.substring(0, 100) + '...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
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
    const errorText = await response.text();
    console.error('❌ Cypher query falhou:', response.status, errorText);
    throw new Error(`Neo4j query failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (result.errors && result.errors.length > 0) {
    console.error('❌ Neo4j errors:', result.errors);
    throw new Error(`Neo4j errors: ${JSON.stringify(result.errors)}`);
  }
  
  console.log('✅ Cypher query executada com sucesso');
  return result;
}

/**
 * Sincroniza dados extraídos para o Neo4j
 */
async function syncToNeo4j(
  studyId: string,
  extractedData: ExtractedStudyData,
  credentials: Neo4jCredentials
): Promise<SyncResult> {
  console.log('🔄 Iniciando sincronização com Neo4j...');
  console.log('📋 Study ID:', studyId);
  console.log('📊 Dados extraídos:', {
    title: extractedData.title,
    nutraceuticals: extractedData.nutraceuticals?.length || 0,
    mechanisms: extractedData.mechanisms?.length || 0,
    effects: extractedData.biological_effects?.length || 0,
    conditions: extractedData.conditions?.length || 0,
    interactions: extractedData.interactions?.length || 0
  });
  
  let nodesCreated = 0;
  let edgesCreated = 0;
  
  // 1. Criar/atualizar node :Study
  console.log('📚 Criando node :Study...');
  const studyCypher = `
    MERGE (s:Study {supabase_id: $supabase_id})
    SET s.title = $title,
        s.authors = $authors,
        s.year = $year,
        s.journal = $journal,
        s.doi = $doi,
        s.updated_at = datetime()
    ON CREATE SET s.created_at = datetime()
    RETURN s
  `;
  
  await executeCypherQuery(studyCypher, {
    supabase_id: studyId,
    title: extractedData.title || 'Unknown Study',
    authors: extractedData.authors || [],
    year: extractedData.year || null,
    journal: extractedData.journal || null,
    doi: extractedData.doi || null
  }, credentials);
  nodesCreated++;
  
  // 2. Criar nodes :Nutraceutical
  if (extractedData.nutraceuticals && extractedData.nutraceuticals.length > 0) {
    console.log(`💊 Criando ${extractedData.nutraceuticals.length} nodes :Nutraceutical...`);
    
    for (const nut of extractedData.nutraceuticals) {
      const nutCypher = `
        MERGE (n:Nutraceutical {name: $name})
        SET n.dosage = $dosage,
            n.efficacy_score = $efficacy_score,
            n.updated_at = datetime()
        ON CREATE SET n.created_at = datetime()
        WITH n
        MATCH (s:Study {supabase_id: $study_id})
        MERGE (n)-[r:CITED_IN]->(s)
        SET r.relevance_score = 5.0
        RETURN n
      `;
      
      await executeCypherQuery(nutCypher, {
        name: nut.name,
        dosage: nut.dosage || null,
        efficacy_score: nut.efficacy_score || null,
        study_id: studyId
      }, credentials);
      nodesCreated++;
      edgesCreated++;
    }
  }
  
  // 3. Criar nodes :Mechanism
  if (extractedData.mechanisms && extractedData.mechanisms.length > 0) {
    console.log(`🔬 Criando ${extractedData.mechanisms.length} nodes :Mechanism...`);
    
    for (const mech of extractedData.mechanisms) {
      const mechCypher = `
        MERGE (m:Mechanism {name: $name})
        SET m.type = $type,
            m.description = $description,
            m.confidence = $confidence,
            m.updated_at = datetime()
        ON CREATE SET m.created_at = datetime()
        WITH m
        MATCH (s:Study {supabase_id: $study_id})
        MERGE (m)-[r:CITED_IN]->(s)
        SET r.relevance_score = 5.0
        RETURN m
      `;
      
      await executeCypherQuery(mechCypher, {
        name: mech.name,
        type: mech.type,
        description: mech.description,
        confidence: mech.confidence || null,
        study_id: studyId
      }, credentials);
      nodesCreated++;
      edgesCreated++;
    }
  }
  
  // 4. Criar nodes :Effect (biological_effects)
  if (extractedData.biological_effects && extractedData.biological_effects.length > 0) {
    console.log(`⚡ Criando ${extractedData.biological_effects.length} nodes :Effect...`);
    
    for (const effect of extractedData.biological_effects) {
      const effectCypher = `
        MERGE (e:Effect {name: $name})
        SET e.type = $type,
            e.description = $description,
            e.confidence = $confidence,
            e.updated_at = datetime()
        ON CREATE SET e.created_at = datetime()
        WITH e
        MATCH (s:Study {supabase_id: $study_id})
        MERGE (e)-[r:CITED_IN]->(s)
        SET r.relevance_score = 5.0
        RETURN e
      `;
      
      await executeCypherQuery(effectCypher, {
        name: effect.name,
        type: effect.type,
        description: effect.description,
        confidence: effect.confidence || null,
        study_id: studyId
      }, credentials);
      nodesCreated++;
      edgesCreated++;
    }
  }
  
  // 5. Criar nodes :Condition
  if (extractedData.conditions && extractedData.conditions.length > 0) {
    console.log(`🏥 Criando ${extractedData.conditions.length} nodes :Condition...`);
    
    for (const cond of extractedData.conditions) {
      const condCypher = `
        MERGE (c:Condition {name: $name})
        SET c.severity = $severity,
            c.treatability_score = $treatability_score,
            c.updated_at = datetime()
        ON CREATE SET c.created_at = datetime()
        WITH c
        MATCH (s:Study {supabase_id: $study_id})
        MERGE (c)-[r:CITED_IN]->(s)
        SET r.relevance_score = 5.0
        MERGE (s)-[r2:SUPPORTS]->(c)
        SET r2.grade = 'Moderate',
            r2.outcome_measured = $relationship_type
        RETURN c
      `;
      
      await executeCypherQuery(condCypher, {
        name: cond.name,
        severity: cond.severity || null,
        treatability_score: cond.treatability_score || null,
        relationship_type: cond.relationship_type || 'treatment',
        study_id: studyId
      }, credentials);
      nodesCreated++;
      edgesCreated += 2; // CITED_IN + SUPPORTS
    }
  }
  
  // 6. Criar edges hierárquicos (interactions)
  if (extractedData.interactions && extractedData.interactions.length > 0) {
    console.log(`🔗 Criando ${extractedData.interactions.length} edges hierárquicos...`);
    
    for (const interaction of extractedData.interactions) {
      // Determinar tipo de edge baseado em interaction.type
      let edgeType = 'MODULATES'; // default
      if (interaction.type === 'inhibition') edgeType = 'INHIBITS';
      if (interaction.type === 'stimulation') edgeType = 'STIMULATES';
      
      // Query genérica que funciona para qualquer par de nodes
      const interactionCypher = `
        MATCH (source) WHERE source.name = $from
        MATCH (target) WHERE target.name = $to
        MERGE (source)-[r:${edgeType}]->(target)
        SET r.confidence = $confidence,
            r.description = $description,
            r.study_id = $study_id,
            r.evidence_strength = CASE 
              WHEN $confidence >= 4.0 THEN 'Strong'
              WHEN $confidence >= 2.5 THEN 'Moderate'
              ELSE 'Weak'
            END
        RETURN r
      `;
      
      try {
        await executeCypherQuery(interactionCypher, {
          from: interaction.from,
          to: interaction.to,
          confidence: interaction.confidence || 3.0,
          description: interaction.description,
          study_id: studyId
        }, credentials);
        edgesCreated++;
      } catch (error) {
        console.warn(`⚠️ Falha ao criar edge ${interaction.from} -> ${interaction.to}:`, error);
      }
    }
  }
  
  // 7. Criar edges diretos :Nutraceutical -> :Condition (TREATS)
  if (extractedData.nutraceuticals && extractedData.conditions) {
    console.log('💊➡️🏥 Criando edges diretos :Nutraceutical-[:TREATS]->:Condition...');
    
    for (const nut of extractedData.nutraceuticals) {
      for (const cond of extractedData.conditions) {
        const treatsCypher = `
          MATCH (n:Nutraceutical {name: $nut_name})
          MATCH (c:Condition {name: $cond_name})
          MERGE (n)-[r:TREATS]->(c)
          SET r.relationship_type = $relationship_type,
              r.efficacy_score = $efficacy_score,
              r.study_id = $study_id,
              r.evidence_strength = CASE 
                WHEN $efficacy_score >= 4.0 THEN 'Strong'
                WHEN $efficacy_score >= 2.5 THEN 'Moderate'
                ELSE 'Weak'
              END
          RETURN r
        `;
        
        try {
          await executeCypherQuery(treatsCypher, {
            nut_name: nut.name,
            cond_name: cond.name,
            relationship_type: cond.relationship_type || 'treatment',
            efficacy_score: nut.efficacy_score || cond.treatability_score || 3.0,
            study_id: studyId
          }, credentials);
          edgesCreated++;
        } catch (error) {
          console.warn(`⚠️ Falha ao criar edge TREATS ${nut.name} -> ${cond.name}:`, error);
        }
      }
    }
  }
  
  console.log('✅ Sincronização concluída!');
  console.log('📊 Resumo:', {
    nodesCreated,
    edgesCreated
  });
  
  return {
    success: true,
    nodesCreated,
    edgesCreated,
    graphSummary: {
      nutraceuticals: extractedData.nutraceuticals?.length || 0,
      mechanisms: extractedData.mechanisms?.length || 0,
      effects: extractedData.biological_effects?.length || 0,
      conditions: extractedData.conditions?.length || 0,
      studies: 1
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validar secrets Neo4j
    const NEO4J_URI = Deno.env.get('NEO4J_URI');
    const NEO4J_USERNAME = Deno.env.get('NEO4J_USERNAME');
    const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD');
    
    if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
      console.error('❌ Credenciais Neo4j não configuradas');
      return new Response(
        JSON.stringify({ 
          error: 'Neo4j credentials not configured. Please set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD secrets in Supabase.',
          success: false
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const credentials: Neo4jCredentials = {
      uri: NEO4J_URI,
      username: NEO4J_USERNAME,
      password: NEO4J_PASSWORD
    };
    
    // Parse request body
    const { studyId, extractedData } = await req.json();
    
    if (!studyId || !extractedData) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: studyId and extractedData',
          success: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validar estrutura de extractedData
    if (!extractedData.title) {
      return new Response(
        JSON.stringify({ 
          error: 'extractedData must have at least a title field',
          success: false
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('📥 Recebido request de sincronização');
    console.log('📋 Study ID:', studyId);
    console.log('📋 Title:', extractedData.title);
    
    // Executar sincronização
    const result = await syncToNeo4j(studyId, extractedData, credentials);
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Erro na edge function neo4j-sync:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
