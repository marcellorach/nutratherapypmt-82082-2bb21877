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
  chat: 'gemini-3-pro-preview',
  translate: 'gemini-3-pro-preview',
  embeddings: 'text-embedding-004',
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
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.0-flash-exp': 'Gemini 2.0 Flash Experimental',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'text-embedding-004': 'Text Embedding 004',
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
