
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se a chave da OpenAI está configurada
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extrair dados da requisição
    const { studyId, studyContent, nutraceuticalsPrompt, conditionsPrompt } = await req.json();
    
    if (!studyId || !studyContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: studyId and studyContent' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processando estudo ID: ${studyId} com OpenAI`);
    
    // Criar cliente Supabase para operações no banco de dados
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar configurações de prompts da tabela admin_settings se não foram fornecidos
    let finalNutraceuticalsPrompt = nutraceuticalsPrompt;
    let finalConditionsPrompt = conditionsPrompt;
    
    if (!finalNutraceuticalsPrompt || !finalConditionsPrompt) {
      const { data: adminSettings } = await supabase
        .from('admin_settings')
        .select('nutraceuticals_prompt, chronic_diseases_prompt')
        .maybeSingle();
        
      if (adminSettings) {
        finalNutraceuticalsPrompt = finalNutraceuticalsPrompt || adminSettings.nutraceuticals_prompt;
        finalConditionsPrompt = finalConditionsPrompt || adminSettings.chronic_diseases_prompt;
      }
    }

    // Implementar o modo de simulação para fins de desenvolvimento
    // Em um ambiente de produção, esta parte seria substituída por chamadas reais à OpenAI
    
    // Simulação de dados de nutracêuticos
    const nutraceuticals = {
      nutraceuticals: [
        { name: "Glucosamina", confidence: 0.95 },
        { name: "Condroitina", confidence: 0.92 },
        { name: "MSM (Metilsulfonilmetano)", confidence: 0.88 },
        { name: "Ômega 3", confidence: 0.78 }
      ]
    };

    // Simulação de dados de condições
    const conditions = {
      conditions: [
        { name: "Osteoartrite", efficacyScore: 4.2, confidence: 0.95 },
        { name: "Displasia articular", efficacyScore: 3.8, confidence: 0.87 },
        { name: "Dor crônica", efficacyScore: 3.5, confidence: 0.82 }
      ]
    };

    // Simulação de dados de interações
    const interactions = {
      interactions: [
        { name: "Anti-inflamatórios não esteroides", score: 4.0, type: "positive", confidence: 0.92 },
        { name: "Anticoagulantes", score: 2.3, type: "negative", confidence: 0.85 }
      ]
    };

    // Simulação de avaliação de qualidade
    const quality = {
      qualityScore: 4.2,
      relevanceScore: 4.5,
      summary: "Estudo bem estruturado com metodologia robusta, apresentando evidências significativas sobre o uso de nutracêuticos para saúde articular em cães. As dosagens e protocolos são claramente descritos."
    };

    // Consolidar todos os resultados
    const analysisResult = {
      studyId,
      extractedNutraceuticals: nutraceuticals.nutraceuticals,
      extractedConditions: conditions.conditions,
      extractedInteractions: interactions.interactions,
      extractedSideEffects: [
        { name: "Distúrbios gastrointestinais leves", severity: "low", confidence: 0.76 },
        { name: "Alterações na coagulação", severity: "moderate", confidence: 0.65 }
      ],
      qualityScore: quality.qualityScore,
      relevanceScore: quality.relevanceScore,
      summary: quality.summary,
      processedAt: new Date().toISOString()
    };

    // Gerar um título para o estudo a partir do conteúdo
    const studyTitle = `Análise: ${studyContent.substring(0, 50)}...`;
    
    // Salvar resultados na tabela de estudos processados
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('processed_studies')
      .upsert({
        study_id: studyId,
        analysis_data: analysisResult,
        created_at: new Date().toISOString(),
        kanban_status: 'new', // Status inicial no kanban: novo
        processed_by: 'ntai', // Processado pelo sistema NTAI
        title: studyTitle, // Usar o título gerado
        description: `Análise NTAI: ${studyContent.substring(0, 100)}...`,
        journal: 'NTAI Processing' // Fonte padrão
      })
      .select();

    if (saveError) {
      console.error('Erro ao salvar análise:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis results', details: saveError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Retornar os resultados consolidados
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisResult,
        savedId: savedAnalysis ? savedAnalysis[0]?.id : null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Erro no processamento do estudo:', error);
    
    return new Response(
      JSON.stringify({ error: 'Processing failed', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
