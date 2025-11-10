
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { processSpreadsheetWithAI } from './aiProcessor.ts';
import { processAiOutput, simulateProcessedData } from './fileProcessor.ts';

// Chave da API OpenAI
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Servidor da Edge Function
serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recebida requisição para processar planilha");
    
    // Obter dados da requisição
    const { fileUrl, fileName, hasStudyFiles } = await req.json();
    
    console.log(`URL do arquivo: ${fileUrl}`);
    console.log(`Nome do arquivo: ${fileName}`);
    console.log(`Tem arquivos de estudos? ${hasStudyFiles ? 'Sim' : 'Não'}`);
    
    if (!fileUrl || !fileName) {
      throw new Error('URL do arquivo e nome do arquivo são obrigatórios');
    }
    
    // Processar a planilha
    const processedData = await processSpreadsheetWithAI(
      fileUrl, 
      fileName,
      openAIApiKey || null,
      processAiOutput,
      simulateProcessedData
    );
    
    console.log("Dados processados com sucesso");
    
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
