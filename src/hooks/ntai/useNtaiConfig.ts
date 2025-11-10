
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNtaiConfig = () => {
  const [aiConfigs, setAiConfigs] = useState({
    modelName: "GPT-4o",
    temperature: "0.7",
    nutraceuticals_prompt: "Extrair todos os nutracêuticos mencionados no estudo e suas aplicações.",
    conditions_prompt: "Identificar todas as condições de saúde abordadas no estudo."
  });
  
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);

  // Carregar configurações do banco de dados
  useEffect(() => {
    const loadConfigsFromDatabase = async () => {
      setIsLoadingConfigs(true);
      try {
        const { data, error } = await supabase
          .from('ai_configurations')
          .select('*');
          
        if (error) {
          console.error('Erro ao carregar configurações:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const configMap = data.reduce((acc: any, item: any) => {
            acc[item.config_key] = typeof item.config_value === 'string' ? item.config_value : JSON.stringify(item.config_value);
            return acc;
          }, {});
          
          setAiConfigs(prev => ({
            ...prev,
            ...configMap
          }));
        }
      } catch (err) {
        console.error('Erro ao processar configurações:', err);
      } finally {
        setIsLoadingConfigs(false);
      }
    };
    
    loadConfigsFromDatabase();
  }, []);

  const updateAiConfig = async (key: string, value: string) => {
    setAiConfigs(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Salvar no banco de dados também
    try {
      // Verificar se a configuração já existe
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('config_key', key)
        .maybeSingle();
        
      if (error) {
        console.error('Erro ao verificar configuração:', error);
        return;
      }
      
      if (data) {
        // Atualizar
        await supabase
          .from('ai_configurations')
          .update({ config_value: value })
          .eq('config_key', key);
      } else {
        // Criar novo
        await supabase
          .from('ai_configurations')
          .insert([{ config_key: key, config_value: value }]);
      }
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
    }
  };

  return { 
    aiConfigs, 
    updateAiConfig,
    isLoadingConfigs
  };
};
