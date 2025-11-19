import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useGeminiProcessing = () => {
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const processStudy = async (studyId: string, storageUrl: string, fileName: string) => {
    setProcessing(prev => ({ ...prev, [studyId]: true }));
    setProgress(prev => ({ ...prev, [studyId]: 0 }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const current = prev[studyId] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [studyId]: Math.min(current + 10, 90) };
        });
      }, 1000);

      console.log('🚀 Iniciando processamento Gemini:', { studyId, storageUrl, fileName });

      const { data, error } = await supabase.functions.invoke('gemini-file-search', {
        body: {
          studyId,
          fileUrl: storageUrl,
          fileName
        }
      });

      clearInterval(progressInterval);
      setProgress(prev => ({ ...prev, [studyId]: 100 }));

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message || 'Erro ao processar com Gemini');
      }

      if (!data || !data.success) {
        console.error('❌ Resposta inválida:', data);
        throw new Error(data?.error || 'Resposta inválida do Gemini');
      }

      console.log('✅ Processamento concluído:', data);

      toast({
        title: "✅ Processamento Concluído",
        description: `Extraídos ${data.nutraceuticalsCount || 0} nutracêuticos e ${data.conditionsCount || 0} condições`,
      });

      return data;
    } catch (error: any) {
      console.error('❌ Erro no processamento:', error);
      
      let errorMessage = 'Erro ao processar estudo';
      let errorHint = '';

      if (error.message?.includes('API key')) {
        errorMessage = 'Chave API do Gemini não configurada';
        errorHint = 'Configure a chave em Configurações de IA';
      } else if (error.message?.includes('429')) {
        errorMessage = 'Limite de requisições excedido';
        errorHint = 'Aguarde alguns minutos antes de tentar novamente';
      } else if (error.message?.includes('402')) {
        errorMessage = 'Créditos insuficientes';
        errorHint = 'Adicione créditos na sua conta Google AI';
      }

      toast({
        title: "❌ Erro no Processamento",
        description: `${errorMessage}${errorHint ? ': ' + errorHint : ''}`,
        variant: "destructive",
      });

      throw error;
    } finally {
      setProcessing(prev => ({ ...prev, [studyId]: false }));
      setTimeout(() => {
        setProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[studyId];
          return newProgress;
        });
      }, 2000);
    }
  };

  return {
    processStudy,
    processing,
    progress,
  };
};
