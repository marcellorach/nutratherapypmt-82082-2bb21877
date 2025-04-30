
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Chave da API OpenAI
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Processar a planilha utilizando IA
async function processSpreadsheetWithAI(fileUrl: string, fileName: string) {
  try {
    // Baixar o arquivo do storage
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error('Não foi possível baixar o arquivo');
    }
    
    // Para CSV, podemos processar o texto diretamente
    // Para Excel, precisaríamos usar um parser específico
    let fileContent = '';
    
    if (fileName.endsWith('.csv')) {
      fileContent = await fileResponse.text();
    } else {
      // Para demonstração, vamos simular um conteúdo para arquivos Excel
      fileContent = `Nome,Descrição,Categoria,Condição,Prevenção,Tratamento,Suporte
Curcumina,Extrato de Cúrcuma com propriedades anti-inflamatórias,Anti-inflamatório,Artrite,3.8,4.2,4.0
Curcumina,Extrato de Cúrcuma com propriedades anti-inflamatórias,Anti-inflamatório,Doenças Inflamatórias Intestinais,3.5,3.8,3.9
Ômega-3,Ácidos graxos essenciais de cadeia longa,Cardíaco,Hipertensão,3.9,3.1,4.0
Ômega-3,Ácidos graxos essenciais de cadeia longa,Cardíaco,Triglicerídeos Elevados,2.8,4.3,3.7
Resveratrol,Composto fenólico encontrado em uvas,Longevidade,Estresse Oxidativo,4.1,3.2,3.5
Glucosamina,Aminomonossacarídeo precursor de glicosaminoglicanos,Articular,Osteoartrite,2.5,3.7,4.2`;
    }
    
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
              content: 'Você é um assistente especializado em extrair e estruturar dados sobre nutracêuticos de planilhas. Extraia os nutracêuticos, suas categorias e relações com condições de saúde (prevenção, tratamento e suporte).'
            },
            {
              role: 'user',
              content: `Analise esta planilha de nutracêuticos e retorne um objeto JSON estruturado com os dados extraídos:\n\n${fileContent}`
            }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Erro na API da OpenAI: ${data.error.message}`);
      }
      
      // Interpretar a resposta da IA e formatar os dados
      const aiOutput = JSON.parse(data.choices[0].message.content);
      
      // Processar e estruturar os dados
      const processedData = processAiOutput(aiOutput, fileName);
      
      return processedData;
    } else {
      // Se não temos API key, usamos dados simulados para demonstração
      return simulateProcessedData(fileContent, fileName);
    }
  } catch (error) {
    console.error('Erro ao processar planilha:', error);
    throw error;
  }
}

// Função para processar a saída da IA
function processAiOutput(aiOutput: any, fileName: string) {
  // Aqui processaríamos a saída da IA
  // Para demonstração, vamos usar dados simulados
  return simulateProcessedData("", fileName);
}

// Função para simular dados processados (para demonstração)
function simulateProcessedData(fileContent: string, fileName: string) {
  // Criar dados simulados para demonstração
  const nutraceuticals = [
    {
      name: "Curcumina",
      description: "Extrato de Cúrcuma com propriedades anti-inflamatórias",
      category: "Anti-inflamatório",
      conditions: [
        {
          name: "Artrite",
          efficacyScores: {
            prevention: 3.8,
            treatment: 4.2,
            support: 4.0
          }
        },
        {
          name: "Doenças Inflamatórias Intestinais",
          efficacyScores: {
            prevention: 3.5,
            treatment: 3.8,
            support: 3.9
          }
        }
      ]
    },
    {
      name: "Ômega-3",
      description: "Ácidos graxos essenciais de cadeia longa EPA e DHA",
      category: "Cardíaco",
      conditions: [
        {
          name: "Hipertensão",
          efficacyScores: {
            prevention: 3.9,
            treatment: 3.1,
            support: 4.0
          }
        },
        {
          name: "Triglicerídeos Elevados",
          efficacyScores: {
            prevention: 2.8,
            treatment: 4.3,
            support: 3.7
          }
        }
      ]
    },
    {
      name: "Resveratrol",
      description: "Composto fenólico encontrado em uvas e vinho tinto",
      category: "Longevidade",
      conditions: [
        {
          name: "Estresse Oxidativo",
          efficacyScores: {
            prevention: 4.1,
            treatment: 3.2,
            support: 3.5
          }
        }
      ]
    },
    {
      name: "Glucosamina",
      description: "Aminomonossacarídeo precursor de glicosaminoglicanos",
      category: "Articular",
      conditions: [
        {
          name: "Osteoartrite",
          efficacyScores: {
            prevention: 2.5,
            treatment: 3.7,
            support: 4.2
          }
        }
      ]
    }
  ];

  // Contadores para estatísticas
  const nutraceuticalsCount = nutraceuticals.length;
  let conditionsCount = 0;
  let relationsCount = 0;
  
  nutraceuticals.forEach(n => {
    conditionsCount += new Set(n.conditions.map(c => c.name)).size;
    relationsCount += n.conditions.length;
  });

  return {
    nutraceuticals,
    originalFileName: fileName,
    processedAt: new Date().toISOString(),
    nutraceuticalsCount,
    conditionsCount,
    relationsCount,
    warnings: [
      "Alguns nutracêuticos podem exigir revisão manual para garantir precisão dos dados.",
      "Considere verificar as pontuações de eficácia com a literatura científica mais recente."
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
    // Obter dados da requisição
    const { fileUrl, fileName } = await req.json();
    
    if (!fileUrl || !fileName) {
      throw new Error('URL do arquivo e nome do arquivo são obrigatórios');
    }
    
    // Processar a planilha
    const processedData = await processSpreadsheetWithAI(fileUrl, fileName);
    
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
  } catch (error) {
    // Lidar com erros
    console.error('Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar a planilha' 
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
