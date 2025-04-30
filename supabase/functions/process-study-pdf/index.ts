
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Chave da API OpenAI
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Processar o PDF utilizando IA
async function processPdfWithAI(fileUrl: string, fileName: string, nutraceutical?: string, condition?: string) {
  try {
    // Simulação: na versão real, aqui teríamos código para extrair texto do PDF
    console.log(`Processando PDF: ${fileName}, URL: ${fileUrl}`);
    console.log(`Associações: Nutracêutico: ${nutraceutical}, Condição: ${condition}`);
    
    // Extrair informações do nome do arquivo para análise de contexto
    const fileNameWithoutExt = fileName.replace('.pdf', '').replace(/_/g, ' ');
    
    // Para demonstração, simularemos a extração de texto
    const extractedText = `Este é um texto simulado extraído do PDF ${fileNameWithoutExt}. 
      ${nutraceutical ? `O estudo foca no nutracêutico ${nutraceutical}.` : ''}
      ${condition ? `A condição de saúde investigada é ${condition}.` : ''}
      Em um estudo duplo-cego placebo controlado, foram observados efeitos significativos 
      na saúde dos animais submetidos ao tratamento.`;
    
    // Chamar a OpenAI para processar o conteúdo
    if (openAIApiKey) {
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
              content: `Você é um especialista em análise de estudos científicos veterinários relacionados a nutracêuticos.
              Extraia as seguintes informações do texto do estudo:
              1. Nutracêuticos mencionados e sua confiança na identificação (0-1)
              2. Condições de saúde abordadas e sua confiança na identificação (0-1)
              3. Interações identificadas entre nutracêuticos ou com medicamentos
              4. Possíveis efeitos colaterais mencionados
              5. Um resumo conciso do estudo
              6. Pontuação de qualidade do estudo (0-5)
              7. Pontuação de relevância para o uso clínico (0-5)
              8. Nome do periódico, se mencionado
              9. Autores, se mencionados
              10. Ano de publicação, se mencionado
              
              ${nutraceutical ? `Foco especial deve ser dado ao nutracêutico: ${nutraceutical}` : ''}
              ${condition ? `E à condição de saúde: ${condition}` : ''}
              `
            },
            {
              role: 'user',
              content: `Analise o seguinte texto extraído de um estudo científico e forneça as informações estruturadas solicitadas:\n\n${extractedText}\n\nNome do arquivo: ${fileNameWithoutExt}`
            }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Erro na API da OpenAI: ${data.error.message}`);
      }
      
      // Interpretar a resposta da IA
      const analysisResult = JSON.parse(data.choices[0].message.content);
      
      // Formatar resultado para compatibilidade com nosso sistema
      return {
        studyId: crypto.randomUUID(),
        title: analysisResult.title || fileNameWithoutExt,
        fileName: fileName,
        summary: analysisResult.summary || "Resumo não disponível",
        qualityScore: analysisResult.qualityScore || 3.0,
        relevanceScore: analysisResult.relevanceScore || 3.0,
        journal: analysisResult.journal || null,
        authors: analysisResult.authors || [],
        year: analysisResult.year || null,
        extractedNutraceuticals: analysisResult.nutraceuticals?.map((n: any) => ({
          name: n.name || n.nutraceutical,
          confidence: n.confidence || 0.7
        })) || [],
        extractedConditions: analysisResult.conditions?.map((c: any) => ({
          name: c.name || c.condition,
          confidence: c.confidence || 0.7,
          efficacyScore: c.efficacyScore || 3.0
        })) || [],
        extractedInteractions: analysisResult.interactions?.map((i: any) => ({
          nutraceutical: i.nutraceutical || nutraceutical || "Não especificado",
          interaction: i.interaction || i.description || "Interação não especificada",
          confidence: i.confidence || 0.6
        })) || [],
        extractedSideEffects: analysisResult.sideEffects?.map((s: any) => ({
          name: s.name || "Efeito colateral",
          description: s.description || null,
          severity: s.severity || "Moderado",
          confidence: s.confidence || 0.6
        })) || []
      };
    } else {
      console.log('API key não configurada, usando simulação');
      // Se não temos API key, usamos dados simulados para demonstração
      return simulateProcessedStudy(fileName, extractedText, nutraceutical, condition);
    }
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    throw error;
  }
}

// Função para simular dados processados (para demonstração)
function simulateProcessedStudy(fileName: string, extractedText: string, nutraceutical?: string, condition?: string) {
  const nutra = nutraceutical || "Ômega-3";
  const cond = condition || "Inflamação Articular";
  
  return {
    studyId: crypto.randomUUID(),
    title: `Estudo sobre ${nutra} em ${cond}`,
    fileName: fileName,
    summary: `Este estudo examinou os efeitos de ${nutra} em cães com ${cond}. Os resultados mostraram melhoria significativa após 8 semanas de tratamento.`,
    qualityScore: 4.2,
    relevanceScore: 3.8,
    journal: "Journal of Veterinary Nutraceuticals",
    authors: ["Silva, A.", "Santos, M.", "Oliveira, R."],
    year: 2023,
    extractedNutraceuticals: [
      {
        name: nutra,
        confidence: 0.95
      },
      {
        name: "Vitamina E",
        confidence: 0.7
      }
    ],
    extractedConditions: [
      {
        name: cond,
        confidence: 0.9,
        efficacyScore: 4.1
      },
      {
        name: "Mobilidade reduzida",
        confidence: 0.8,
        efficacyScore: 3.8
      }
    ],
    extractedInteractions: [
      {
        nutraceutical: nutra,
        interaction: "Potencializa efeitos anti-inflamatórios quando combinado com condroitina",
        confidence: 0.75
      },
      {
        nutraceutical: "Vitamina E",
        interaction: "Aumenta biodisponibilidade de Ômega-3",
        confidence: 0.68
      }
    ],
    extractedSideEffects: [
      {
        name: "Distúrbios gastrointestinais leves",
        description: "Observada diarreia leve em 3% dos casos",
        severity: "Leve",
        confidence: 0.8
      }
    ]
  };
}

// Servidor da Edge Function
serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recebida requisição para processar PDF");
    
    // Obter dados da requisição
    const { fileUrl, fileName, studyId, nutraceutical, condition } = await req.json();
    
    if (!fileUrl || !fileName) {
      throw new Error('URL do arquivo e nome do arquivo são obrigatórios');
    }
    
    console.log(`Processando: ${fileName}, Nutracêutico: ${nutraceutical || 'não especificado'}, Condição: ${condition || 'não especificada'}`);
    
    // Processar o PDF
    const processedData = await processPdfWithAI(fileUrl, fileName, nutraceutical, condition);
    
    // Retornar os dados processados
    return new Response(
      JSON.stringify(processedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    // Lidar com erros
    console.error('Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar o PDF' 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
