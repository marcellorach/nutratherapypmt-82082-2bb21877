
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
        .single();
        
      if (adminSettings) {
        finalNutraceuticalsPrompt = finalNutraceuticalsPrompt || adminSettings.nutraceuticals_prompt;
        finalConditionsPrompt = finalConditionsPrompt || adminSettings.chronic_diseases_prompt;
      }
    }

    // Processar extração de nutracêuticos
    const nutraceuticalsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em análise de estudos científicos sobre nutracêuticos para medicina veterinária.' 
          },
          { 
            role: 'user', 
            content: `${finalNutraceuticalsPrompt || 'Analise este estudo científico e identifique os nutracêuticos mencionados, suas propriedades, dosagens e evidências científicas.'}\n\nConteúdo do estudo:\n${studyContent}\n\nResposta no formato JSON com a seguinte estrutura:\n{\n  "nutraceuticals": [\n    { "name": "Nome do Nutracêutico", "confidence": 0.95 }\n  ]\n}` 
          }
        ],
        temperature: 0.7,
      }),
    });

    const nutraceuticalsData = await nutraceuticalsResponse.json();
    const nutraceuticals = extractJsonFromText(nutraceuticalsData.choices[0].message.content);

    // Processar condições de saúde relacionadas
    const conditionsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em análise de estudos científicos sobre condições de saúde veterinárias.' 
          },
          { 
            role: 'user', 
            content: `${finalConditionsPrompt || 'Identifique as condições de saúde mencionadas neste estudo científico e avalie a eficácia para cada condição.'}\n\nConteúdo do estudo:\n${studyContent}\n\nResposta no formato JSON com a seguinte estrutura:\n{\n  "conditions": [\n    { "name": "Nome da Condição", "efficacyScore": 4.2, "confidence": 0.95 }\n  ]\n}` 
          }
        ],
        temperature: 0.7,
      }),
    });

    const conditionsData = await conditionsResponse.json();
    const conditions = extractJsonFromText(conditionsData.choices[0].message.content);

    // Processamento adicional para interações e efeitos colaterais
    const interactionsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em análise de interações medicamentosas e nutricionais em medicina veterinária.' 
          },
          { 
            role: 'user', 
            content: `Analise este estudo e identifique possíveis interações (positivas e negativas) entre os nutracêuticos mencionados e outros medicamentos ou nutracêuticos.\n\nConteúdo do estudo:\n${studyContent}\n\nResposta no formato JSON com a seguinte estrutura:\n{\n  "interactions": [\n    { "name": "Nome do medicamento/nutracêutico", "score": 4.0, "type": "positive/negative", "confidence": 0.92 }\n  ]\n}` 
          }
        ],
        temperature: 0.7,
      }),
    });

    const interactionsData = await interactionsResponse.json();
    const interactions = extractJsonFromText(interactionsData.choices[0].message.content);

    // Avaliar qualidade do estudo
    const qualityResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em avaliação da qualidade de estudos científicos.' 
          },
          { 
            role: 'user', 
            content: `Avalie a qualidade e relevância deste estudo científico em uma escala de 0 a 5.\n\nConteúdo do estudo:\n${studyContent}\n\nResposta no formato JSON com a seguinte estrutura:\n{\n  "qualityScore": 4.2,\n  "relevanceScore": 4.5,\n  "summary": "Breve resumo da avaliação"\n}` 
          }
        ],
        temperature: 0.7,
      }),
    });

    const qualityData = await qualityResponse.json();
    const quality = extractJsonFromText(qualityData.choices[0].message.content);

    // Consolidar todos os resultados
    const analysisResult = {
      studyId,
      extractedNutraceuticals: nutraceuticals?.nutraceuticals || [],
      extractedConditions: conditions?.conditions || [],
      extractedInteractions: interactions?.interactions || [],
      extractedSideEffects: [], // Em uma implementação completa, seria extraído com outro prompt
      qualityScore: quality?.qualityScore || 3.5,
      relevanceScore: quality?.relevanceScore || 3.5,
      summary: quality?.summary || "Estudo processado com sucesso",
      processedAt: new Date().toISOString()
    };

    // Salvar resultados na tabela de estudos processados
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('processed_studies')
      .upsert({
        study_id: studyId,
        analysis_data: analysisResult,
        created_at: new Date().toISOString(),
        kanban_status: 'new', // Status inicial no kanban: novo
        processed_by: 'ntai' // Processado pelo sistema NTAI
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

// Função auxiliar para extrair JSON de texto
function extractJsonFromText(text) {
  try {
    // Tentar extrair código JSON de bloco de texto se necessário
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || text.match(/{[\s\S]*?}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    // Limpar texto antes de processar
    const cleanedJson = jsonStr.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error('Erro ao extrair JSON:', e);
    try {
      // Tentar encontrar qualquer objeto JSON no texto
      const jsonRegex = /{[\s\S]*?}/;
      const match = text.match(jsonRegex);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (error) {
      console.error('Segunda tentativa falhou:', error);
    }
    return null;
  }
}
