
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
    const { studyId, studyContent } = await req.json();
    
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
    
    // Buscar prompts configurados da tabela admin_settings
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('ntai_prompts')
      .single();
    
    if (settingsError) {
      console.warn("Erro ao buscar prompts configurados:", settingsError.message);
      console.warn("Usando prompts padrão");
    }

    const promptConfigs = adminSettings?.ntai_prompts || getDefaultPrompts();
    
    // 1. Processar extração de resumo e informações básicas
    const summaryConfig = promptConfigs.find(p => p.stage === 'summary') || getDefaultPrompts()[0];
    const summaryResponse = await callOpenAI(
      studyContent,
      summaryConfig.prompt,
      summaryConfig.systemPrompt
    );
    const summaryData = extractJsonFromText(summaryResponse);
    
    // 2. Processar extração de nutracêuticos
    const nutraceuticalsConfig = promptConfigs.find(p => p.stage === 'nutraceuticals') || getDefaultPrompts()[1];
    const nutraceuticalsResponse = await callOpenAI(
      studyContent,
      nutraceuticalsConfig.prompt,
      nutraceuticalsConfig.systemPrompt
    );
    const nutraceuticalsData = extractJsonFromText(nutraceuticalsResponse);
    
    // 3. Processar condições de saúde relacionadas
    const conditionsConfig = promptConfigs.find(p => p.stage === 'conditions') || getDefaultPrompts()[2];
    const conditionsResponse = await callOpenAI(
      studyContent,
      conditionsConfig.prompt,
      conditionsConfig.systemPrompt
    );
    const conditionsData = extractJsonFromText(conditionsResponse);
    
    // 4. Processar interações
    const interactionsConfig = promptConfigs.find(p => p.stage === 'interactions') || getDefaultPrompts()[3];
    const interactionsResponse = await callOpenAI(
      studyContent,
      interactionsConfig.prompt,
      interactionsConfig.systemPrompt
    );
    const interactionsData = extractJsonFromText(interactionsResponse);
    
    // 5. Processar informações adicionais
    const additionalConfig = promptConfigs.find(p => p.stage === 'additional') || getDefaultPrompts()[4];
    const additionalResponse = await callOpenAI(
      studyContent,
      additionalConfig.prompt,
      additionalConfig.systemPrompt
    );
    const additionalData = extractJsonFromText(additionalResponse);

    // Verificar se houve erro em alguma extração e simular quando necessário
    const isSimulated = !summaryData || !nutraceuticalsData || !conditionsData || !interactionsData || !additionalData;
    
    // Consolidar todos os resultados
    const analysisResult = {
      studyId,
      // Dados de resumo
      summary: summaryData?.summary || "Resumo não disponível",
      citationScore: summaryData?.citationScore || 3.0,
      
      // Dados de nutracêuticos
      extractedNutraceuticals: nutraceuticalsData?.nutraceuticals || simulateNutraceuticals(),
      
      // Dados de condições
      extractedConditions: conditionsData?.conditions || simulateConditions(),
      
      // Dados de interações
      extractedInteractions: interactionsData?.interactions || simulateInteractions(),
      extractedSideEffects: interactionsData?.sideEffects || simulateSideEffects(),
      
      // Dados de informações adicionais
      studyPopulation: additionalData?.population || simulatePopulation(),
      studyDuration: additionalData?.duration || "12 semanas",
      studyResults: additionalData?.results || "Resultados não disponíveis",
      
      // Scores de qualidade
      qualityScore: summaryData?.qualityScore || 3.5,
      relevanceScore: summaryData?.relevanceScore || 3.5,
      
      // Metadados
      isSimulated: isSimulated,
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

// Função para fazer chamadas à API da OpenAI
async function callOpenAI(content: string, prompt: string, systemPrompt: string = '') {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: systemPrompt || 'Você é um especialista em análise de estudos científicos sobre nutracêuticos para medicina veterinária.'
          },
          { 
            role: 'user', 
            content: `${prompt}\n\nConteúdo do estudo:\n${content}\n\nResposta em formato JSON:`
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro na chamada OpenAI:', error);
    return null;
  }
}

// Função auxiliar para extrair JSON de texto
function extractJsonFromText(text) {
  if (!text) return null;
  
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

// Funções para simular dados quando a IA não conseguir extrair
function simulateNutraceuticals() {
  return [
    { name: "Ômega 3", confidence: 0.94, isSimulated: true },
    { name: "Ômega 6", confidence: 0.92, isSimulated: true },
    { name: "DHA", confidence: 0.89, isSimulated: true },
    { name: "EPA", confidence: 0.85, isSimulated: true }
  ];
}

function simulateConditions() {
  return [
    { name: "Artrite Canina", efficacyScore: 4.2, confidence: 0.95, isSimulated: true },
    { name: "Inflamação Articular", efficacyScore: 3.8, confidence: 0.92, isSimulated: true },
    { name: "Mobilidade Reduzida", efficacyScore: 3.5, confidence: 0.85, isSimulated: true }
  ];
}

function simulateInteractions() {
  return [
    { name: "Glucosamina", score: 4.0, type: 'positive', confidence: 0.92, isSimulated: true },
    { name: "Vitamina E", score: 3.5, type: 'positive', confidence: 0.89, isSimulated: true },
    { name: "Anti-inflamatórios", score: 2.5, type: 'negative', confidence: 0.86, isSimulated: true },
    { name: "Anticoagulantes", score: 3.8, type: 'negative', confidence: 0.94, isSimulated: true }
  ];
}

function simulateSideEffects() {
  return [
    { name: "Sonolência", intensityScore: 2.0, frequency: "raro", confidence: 0.88, isSimulated: true },
    { name: "Alterações Gastrointestinais", intensityScore: 2.5, frequency: "ocasional", confidence: 0.91, isSimulated: true },
    { name: "Alterações no Apetite", intensityScore: 1.5, frequency: "raro", confidence: 0.83, isSimulated: true }
  ];
}

function simulatePopulation() {
  return {
    type: 'canine',
    count: Math.floor(Math.random() * 90) + 30,
    description: "Cães adultos de raças diversas",
  };
}

// Funções para obter prompts padrão
function getDefaultPrompts() {
  return [
    {
      id: "summary-prompt",
      name: "Extração de Resumo",
      description: "Extrai um resumo conciso do estudo com nota de relevância",
      prompt: "Analise este estudo científico e extraia um resumo conciso de no máximo 30 palavras. Avalie também a relevância científica com base em citações, autores e prestígio da revista, fornecendo uma nota de 0 a 5.",
      systemPrompt: "Você é um especialista em análise de literatura científica sobre nutracêuticos em medicina veterinária.",
      stage: "summary",
      active: true
    },
    {
      id: "nutraceuticals-prompt",
      name: "Extração de Nutracêuticos",
      description: "Identifica os nutracêuticos estudados",
      prompt: "Analise este estudo científico e identifique os nutracêuticos mencionados, suas propriedades, dosagens e evidências científicas. Responda no formato JSON com a seguinte estrutura: {\"nutraceuticals\": [{\"name\": \"Nome do Nutracêutico\", \"confidence\": 0.95}]}",
      systemPrompt: "Você é um especialista em nutracêuticos para medicina veterinária.",
      stage: "nutraceuticals",
      active: true
    },
    {
      id: "conditions-prompt",
      name: "Extração de Condições",
      description: "Identifica as condições de saúde e eficácia",
      prompt: "Identifique as condições de saúde mencionadas neste estudo científico e avalie a eficácia para cada condição. Responda no formato JSON com a seguinte estrutura: {\"conditions\": [{\"name\": \"Nome da Condição\", \"efficacyScore\": 4.2, \"confidence\": 0.95}]}",
      systemPrompt: "Você é um especialista em medicina veterinária.",
      stage: "conditions",
      active: true
    },
    {
      id: "interactions-prompt",
      name: "Extração de Interações",
      description: "Identifica interações entre compostos",
      prompt: "Analise este estudo e identifique possíveis interações entre os nutracêuticos mencionados e outros medicamentos ou nutracêuticos. Responda no formato JSON.",
      systemPrompt: "Você é um especialista em farmacologia e nutrição veterinária.",
      stage: "interactions",
      active: true
    },
    {
      id: "additional-prompt",
      name: "Extração de Informações Adicionais",
      description: "Extrai dados sobre população e metodologia",
      prompt: "Extraia as seguintes informações do estudo: tipo de população (humanos, cães, gatos, roedores, etc.), tamanho da amostra, duração do estudo, principais resultados e metodologia utilizada. Responda em formato JSON.",
      systemPrompt: "Você é um especialista em metodologia científica para estudos veterinários.",
      stage: "additional",
      active: true
    }
  ];
}
