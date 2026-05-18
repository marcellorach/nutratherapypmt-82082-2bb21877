import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIModelConfig {
  extraction: string;
  triplets: string;
  chat: string;
  translate: string;
  embeddings: string;
}

const DEFAULT_CONFIG: AIModelConfig = {
  extraction: 'gemini-3-pro-preview',
  triplets: 'gemini-3-pro-preview',
  chat: 'google/gemini-3-flash-preview',
  translate: 'gemini-3-pro-preview',
  embeddings: 'gemini-embedding-001@768d',
};

export const useAIConfig = () => {
  const [config, setConfig] = useState<AIModelConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_configurations')
        .select('config_key, config_value')
        .like('config_key', 'ai_model_%');

      if (fetchError) throw fetchError;

      const newConfig = { ...DEFAULT_CONFIG };
      data?.forEach(item => {
        const key = item.config_key.replace('ai_model_', '') as keyof AIModelConfig;
        if (key in newConfig) {
          const value = typeof item.config_value === 'string' 
            ? item.config_value.replace(/"/g, '') 
            : String(item.config_value);
          newConfig[key] = value;
        }
      });
      
      setConfig(newConfig);
    } catch (err) {
      console.error('Error loading AI config:', err);
      setError('Failed to load AI configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getModel = useCallback((task: keyof AIModelConfig): string => {
    return config[task] || DEFAULT_CONFIG[task];
  }, [config]);

  const getModelDisplayName = useCallback((modelId: string): string => {
    const modelNames: Record<string, string> = {
      'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
      'google/gemini-3-pro-preview': 'Gemini 3 Pro Preview',
      'google/gemini-3-flash-preview': 'Gemini 3 Flash Preview',
      'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
      'google/gemini-3.1-flash-lite-preview': 'Gemini 3.1 Flash Lite Preview',
      'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash Experimental',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'openai/gpt-5': 'GPT-5',
      'openai/gpt-5-mini': 'GPT-5 Mini',
      'text-embedding-004': 'Text Embedding 004',
      'gemini-embedding-001@768d': 'Gemini Embedding 001 (768d, RETRIEVAL_QUERY)',
    };
    return modelNames[modelId] || modelId;
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    getModel,
    getModelDisplayName,
    refreshConfig: loadConfig,
  };
};

export default useAIConfig;
