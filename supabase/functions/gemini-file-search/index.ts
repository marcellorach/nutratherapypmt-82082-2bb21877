import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, studyId } = await req.json();
    
    // Criar cliente Supabase para buscar a chave da tabela ai_configurations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar chave do Google Gemini da tabela ai_configurations
    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('config_value')
      .eq('config_key', 'googleGeminiKey')
      .single();

    if (configError || !configData?.config_value) {
      throw new Error('GOOGLE_AI_API_KEY não configurada na tabela ai_configurations');
    }

    const GOOGLE_AI_API_KEY = configData.config_value as string;

    console.log('🚀 Iniciando processamento Gemini File Search');
    console.log('📄 File URL:', fileUrl);
    console.log('🆔 Study ID:', studyId);

    // TODO: Implementar upload + query + structured output
    // (será implementado na próxima fase)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'POC setup completo',
        studyId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
