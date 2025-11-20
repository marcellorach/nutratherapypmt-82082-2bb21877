import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { period = 'daily', startDate, endDate } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se usuário é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar logs de uso da API
    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) {
      throw error;
    }

    // Agregar dados por período
    const aggregated = {
      totalCalls: logs?.length || 0,
      totalCost: logs?.reduce((sum, log) => sum + (Number(log.cost_usd) || 0), 0) || 0,
      byProvider: {} as Record<string, any>,
      byModel: {} as Record<string, any>,
      byDay: {} as Record<string, any>,
      byOperation: {} as Record<string, any>
    };

    logs?.forEach(log => {
      // Por provider
      if (!aggregated.byProvider[log.api_provider]) {
        aggregated.byProvider[log.api_provider] = {
          calls: 0,
          cost: 0,
          tokens_input: 0,
          tokens_output: 0
        };
      }
      aggregated.byProvider[log.api_provider].calls++;
      aggregated.byProvider[log.api_provider].cost += Number(log.cost_usd) || 0;
      aggregated.byProvider[log.api_provider].tokens_input += log.tokens_input || 0;
      aggregated.byProvider[log.api_provider].tokens_output += log.tokens_output || 0;

      // Por modelo
      if (!aggregated.byModel[log.model]) {
        aggregated.byModel[log.model] = {
          calls: 0,
          cost: 0
        };
      }
      aggregated.byModel[log.model].calls++;
      aggregated.byModel[log.model].cost += Number(log.cost_usd) || 0;

      // Por operação
      if (!aggregated.byOperation[log.operation]) {
        aggregated.byOperation[log.operation] = {
          calls: 0,
          cost: 0
        };
      }
      aggregated.byOperation[log.operation].calls++;
      aggregated.byOperation[log.operation].cost += Number(log.cost_usd) || 0;

      // Por dia
      const day = log.created_at.split('T')[0];
      if (!aggregated.byDay[day]) {
        aggregated.byDay[day] = {
          calls: 0,
          cost: 0
        };
      }
      aggregated.byDay[day].calls++;
      aggregated.byDay[day].cost += Number(log.cost_usd) || 0;
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats: aggregated,
        rawLogs: logs?.slice(0, 100) // Retornar últimos 100 logs
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});