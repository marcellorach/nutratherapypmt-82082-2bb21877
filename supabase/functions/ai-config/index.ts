
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
  action: 'get' | 'set';
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
      // Buscar todas as configurações
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('name, value');

      if (error) throw error;

      // Converter array para objeto para facilitar o uso no frontend
      const configs: Record<string, any> = {};
      data.forEach((item) => {
        configs[item.name] = item.value;
      });

      return new Response(JSON.stringify(configs), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } else if (req.method === 'POST') {
      // Obter dados da solicitação
      const requestData: ConfigRequest = await req.json();
      const { action, key, value } = requestData;

      if (action === 'get' && key) {
        // Buscar configuração específica
        const { data, error } = await supabase
          .from('ai_configurations')
          .select('value')
          .eq('name', key)
          .single();

        if (error) throw error;
        
        return new Response(JSON.stringify({ value: data.value }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      } else if (action === 'set' && key && value !== undefined) {
        // Atualizar configuração
        const { data, error } = await supabase
          .from('ai_configurations')
          .update({ value })
          .eq('name', key)
          .select();

        if (error) throw error;
        
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
