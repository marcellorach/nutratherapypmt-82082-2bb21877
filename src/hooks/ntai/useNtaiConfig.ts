
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NtaiPromptConfig } from '@/types/ntai';

export const useNtaiConfig = () => {
  const [aiConfigs, setAiConfigs] = useState<Record<string, string>>({});
  const [ntaiPrompts, setNtaiPrompts] = useState<NtaiPromptConfig[]>([]);

  useEffect(() => {
    const loadAiConfigs = async () => {
      try {
        // Tentar carregar do banco de dados
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .single();
        
        if (error) {
          console.warn("Erro ao buscar configurações AI:", error.message);
          // Usar configurações padrão
          const configs = {
            'modelName': 'gpt-4o',
            'temperature': '0.7',
            'nutraceuticals_prompt': 'Analise este estudo científico e identifique os nutracêuticos mencionados, suas propriedades, dosagens e evidências científicas.',
            'conditions_prompt': 'Identifique as condições de saúde relacionadas aos nutracêuticos neste estudo e avalie a eficácia para cada condição.',
          };
          setAiConfigs(configs);
          return;
        }
        
        // Configurações encontradas no banco de dados
        const configs = {
          'modelName': data.model_name || 'gpt-4o',
          'temperature': data.temperature || '0.7',
          'nutraceuticals_prompt': data.nutraceuticals_prompt || '',
          'conditions_prompt': data.chronic_diseases_prompt || '',
          'summary_prompt': data.summary_prompt || '',
          'interactions_prompt': data.interactions_prompt || '',
          'additional_prompt': data.additional_prompt || '',
        };
        
        setAiConfigs(configs);
        
        // Carregar prompts NTAI
        if (data.ntai_prompts) {
          setNtaiPrompts(data.ntai_prompts);
        } else {
          // Usar prompts padrão se não houver no banco
          setNtaiPrompts(getDefaultPrompts());
        }
        
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        // Usar configurações padrão
        setAiConfigs({
          'modelName': 'gpt-4o',
          'temperature': '0.7',
        });
        setNtaiPrompts(getDefaultPrompts());
      }
    };
    
    loadAiConfigs();
  }, []);

  const updatePrompt = async (updatedPrompt: NtaiPromptConfig) => {
    try {
      const updatedPrompts = ntaiPrompts.map(p => 
        p.id === updatedPrompt.id ? updatedPrompt : p
      );
      
      setNtaiPrompts(updatedPrompts);
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          id: 'ntai-settings',
          ntai_prompts: updatedPrompts
        });
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar prompt:", error);
      return { success: false, error };
    }
  };
  
  const saveAiConfig = async (key: string, value: string) => {
    try {
      const newConfigs = { ...aiConfigs, [key]: value };
      setAiConfigs(newConfigs);
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          id: 'ai-settings',
          [key]: value,
          last_updated: new Date().toISOString()
        });
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      return { success: false, error };
    }
  };

  return {
    aiConfigs,
    ntaiPrompts,
    updatePrompt,
    saveAiConfig,
    setAiConfigs,
  };
};

function getDefaultPrompts(): NtaiPromptConfig[] {
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
      prompt: "Analise este estudo científico e identifique os nutracêuticos mencionados, suas propriedades, dosagens e evidências científicas.",
      systemPrompt: "Você é um especialista em nutracêuticos para medicina veterinária.",
      stage: "nutraceuticals",
      active: true
    },
    {
      id: "conditions-prompt",
      name: "Extração de Condições",
      description: "Identifica as condições de saúde e eficácia",
      prompt: "Identifique as condições de saúde mencionadas neste estudo científico e avalie a eficácia para cada condição.",
      systemPrompt: "Você é um especialista em medicina veterinária.",
      stage: "conditions",
      active: true
    },
    {
      id: "interactions-prompt",
      name: "Extração de Interações",
      description: "Identifica interações entre compostos",
      prompt: "Analise este estudo e identifique possíveis interações entre os nutracêuticos mencionados e outros medicamentos ou nutracêuticos.",
      systemPrompt: "Você é um especialista em farmacologia e nutrição veterinária.",
      stage: "interactions",
      active: true
    },
    {
      id: "additional-prompt",
      name: "Extração de Informações Adicionais",
      description: "Extrai dados sobre população e metodologia",
      prompt: "Extraia as seguintes informações do estudo: tipo de população (humanos, cães, gatos, roedores, etc.), tamanho da amostra, duração do estudo, principais resultados e metodologia utilizada.",
      systemPrompt: "Você é um especialista em metodologia científica para estudos veterinários.",
      stage: "additional",
      active: true
    }
  ];
}

export default useNtaiConfig;
