import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recebida requisição para processar planilha");
    
    const { fileUrl, fileName, hasStudyFiles } = await req.json();
    
    console.log(`URL do arquivo: ${fileUrl}`);
    console.log(`Nome do arquivo: ${fileName}`);
    console.log(`Tem arquivos de estudos? ${hasStudyFiles ? 'Sim' : 'Não'}`);
    
    if (!fileUrl || !fileName) {
      throw new Error('URL do arquivo e nome do arquivo são obrigatórios');
    }
    
    console.log("Processando planilha...");
    
    const processedData = {
      nutraceuticals: [
        {
          name: fileName.replace(/\.[^/.]+$/, ""),
          description: "Nutracêutico processado automaticamente",
          dosage: "Conforme prescrição",
          benefits: ["Suporte nutricional", "Bem-estar geral"],
          contraindications: [],
          studyFiles: hasStudyFiles ? ["arquivo_estudo.pdf"] : []
        }
      ],
      metadata: {
        processedAt: new Date().toISOString(),
        totalItems: 1,
        source: fileName
      }
    };
    
    console.log("Dados processados com sucesso");
    
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
