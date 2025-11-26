
// Função Edge do Supabase para manipular configurações de IA de forma segura
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuração de CORS para permitir solicitações do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Definição de tipos para as requisições
interface ConfigRequest {
  action: 'get' | 'set' | 'test-neo4j';
  key?: string;
  value?: string;
}

serve(async (req) => {
  // Tratar solicitação de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase usando as credenciais de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se estamos lidando com GET ou POST
    if (req.method === 'GET') {
      console.log('GET request - fetching all configs');
      // Buscar todas as configurações
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('config_key, config_value');

      if (error) {
        console.error('GET error:', JSON.stringify(error, null, 2));
        throw new Error(`Database error: ${error.message || error.code || JSON.stringify(error)}`);
      }

      // Converter array para objeto para facilitar o uso no frontend
      const configs: Record<string, any> = {};
      data.forEach((item) => {
        configs[item.config_key] = item.config_value;
      });

      return new Response(JSON.stringify(configs), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } else if (req.method === 'POST') {
      // Obter dados da solicitação
      const requestData: ConfigRequest = await req.json();
      const { action, key, value } = requestData;

      // Endpoint de teste de conexão Neo4j
      if (action === 'test-neo4j') {
        console.log('Testing Neo4j connection...');
        
        try {
          // Buscar credenciais Neo4j do banco
          const { data: credentials, error: credError } = await supabase
            .from('ai_configurations')
            .select('config_key, config_value')
            .in('config_key', ['neo4j_uri', 'neo4j_username', 'neo4j_password']);

          if (credError || !credentials || credentials.length < 3) {
            return new Response(JSON.stringify({ 
              success: false,
              error: 'Neo4j credentials not configured. Please configure URI, Username, and Password first.',
              configured: false
            }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }

          const config: Record<string, string> = {};
          credentials.forEach((item) => { config[item.config_key] = item.config_value; });

          if (!config.neo4j_uri || !config.neo4j_username || !config.neo4j_password) {
            return new Response(JSON.stringify({ 
              success: false,
              error: 'Incomplete Neo4j credentials',
              configured: false
            }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }

          // Testar conexão executando query simples usando Query API v2
          const authHeader = 'Basic ' + btoa(`${config.neo4j_username}:${config.neo4j_password}`);
          
          const testResponse = await fetch(`${config.neo4j_uri}/db/neo4j/query/v2`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              statement: 'RETURN 1 as test',
              parameters: {}
            })
          });

          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            return new Response(JSON.stringify({ 
              success: false,
              error: `Connection failed: ${testResponse.status} - ${errorText}`,
              configured: true,
              connected: false
            }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }

          const result = await testResponse.json();
          
          if (result.errors && result.errors.length > 0) {
            return new Response(JSON.stringify({ 
              success: false,
              error: `Neo4j errors: ${JSON.stringify(result.errors)}`,
              configured: true,
              connected: false
            }), { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }

          return new Response(JSON.stringify({ 
            success: true,
            message: 'Successfully connected to Neo4j!',
            configured: true,
            connected: true,
            uri: config.neo4j_uri
          }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
          return new Response(JSON.stringify({ 
            success: false,
            error: `Connection test failed: ${errorMessage}`,
            configured: true,
            connected: false
          }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }

      if (action === 'get' && key) {
        console.log('POST get action - fetching key:', key);
        // Buscar configuração específica
        const { data, error } = await supabase
          .from('ai_configurations')
          .select('config_value')
          .eq('config_key', key)
          .single();

        if (error) {
          console.error('POST get error:', JSON.stringify(error, null, 2));
          throw new Error(`Database error: ${error.message || error.code || JSON.stringify(error)}`);
        }
        
        return new Response(JSON.stringify({ value: data.config_value }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      } else if (action === 'set' && key && value !== undefined) {
        console.log('POST set action - key:', key, 'value:', typeof value);
        // Atualizar ou inserir configuração usando upsert
        const { data, error } = await supabase
          .from('ai_configurations')
          .upsert({ 
            config_key: key, 
            config_value: value,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'config_key' 
          })
          .select();

        if (error) {
          console.error('POST set error:', JSON.stringify(error, null, 2));
          throw new Error(`Database error: ${error.message || error.code || JSON.stringify(error)}`);
        }
        
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Se não cair em nenhum caso acima, retornar erro
      throw new Error('Ação inválida ou parâmetros faltando');
    }

    // Método não suportado
    return new Response(JSON.stringify({ error: 'Método não suportado' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Catch block error:', errorMessage);
    console.error('Full error object:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined 
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
