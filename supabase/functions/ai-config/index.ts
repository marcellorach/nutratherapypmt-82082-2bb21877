
// Função Edge do Supabase para manipular configurações de IA de forma segura
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

// SECURITY: chaves cujo valor cru NUNCA deve voltar para o cliente.
// GET retorna apenas máscara "••••XXXX" + metadados (is_set / last4 / updated_at).
const SENSITIVE_KEY_PATTERN = /(_api_key|_password|_secret|_token)$/i;
const isSensitiveKey = (key: string) => SENSITIVE_KEY_PATTERN.test(key);
const maskSensitive = (raw: unknown): string => {
  if (raw === null || raw === undefined) return '';
  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (!str) return '';
  const last4 = str.length >= 4 ? str.slice(-4) : '';
  return `••••••••${last4}`;
};

// SECURITY: exige admin autenticado. Retorna Response de erro ou null.
async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: missing bearer token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub as string;

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleRow, error: roleError } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('Role check error:', roleError);
    return new Response(JSON.stringify({ error: 'Authorization check failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return null;
}

serve(async (req) => {
  // Tratar solicitação de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: toda chamada exige admin autenticado.
    const denied = await requireAdmin(req);
    if (denied) return denied;

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
        .select('config_key, config_value, updated_at');

      if (error) {
        console.error('GET error:', JSON.stringify(error, null, 2));
        throw new Error(`Database error: ${error.message || error.code || JSON.stringify(error)}`);
      }

      // SECURITY: chaves sensíveis só voltam mascaradas; metadados em _meta.
      const configs: Record<string, any> = {};
      const meta: Record<string, { is_set: boolean; last4: string; updated_at: string | null }> = {};
      data.forEach((item) => {
        const k = item.config_key;
        const raw = item.config_value;
        if (isSensitiveKey(k)) {
          const str = raw == null ? '' : (typeof raw === 'string' ? raw : JSON.stringify(raw));
          const isSet = !!str;
          configs[k] = isSet ? maskSensitive(str) : '';
          meta[k] = {
            is_set: isSet,
            last4: isSet && str.length >= 4 ? str.slice(-4) : '',
            updated_at: item.updated_at ?? null,
          };
        } else {
          configs[k] = raw;
        }
      });
      configs._meta = meta;

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
          
          // Converter URI Neo4j Bolt (neo4j+s://) para HTTPS para Query API v2
          const httpUri = config.neo4j_uri.replace('neo4j+s://', 'https://').replace('neo4j://', 'http://');
          
          const testResponse = await fetch(`${httpUri}/db/neo4j/query/v2`, {
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
        // SECURITY: bloquear leitura individual de chave sensível.
        if (isSensitiveKey(key)) {
          return new Response(JSON.stringify({
            error: 'Forbidden: sensitive values cannot be read back. Use GET for masked metadata.',
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
        // SECURITY: nunca logar value (pode ser segredo).
        console.log('POST set action - key:', key, 'value type:', typeof value);
        // SECURITY: rejeitar tentativa de salvar o próprio placeholder mascarado.
        if (
          isSensitiveKey(key) &&
          typeof value === 'string' &&
          value.startsWith('••••')
        ) {
          return new Response(JSON.stringify({
            error: 'Refusing to save masked placeholder. Submit the real value or leave unchanged.',
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
