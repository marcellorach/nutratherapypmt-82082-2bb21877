
import { useState, useEffect } from 'react';

export const useNtaiConfig = () => {
  const [aiConfigs, setAiConfigs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadAiConfigs = async () => {
      const configs = {
        'modelName': 'gpt-4o',
        'temperature': '0.7',
        'nutraceuticals_prompt': 'Analise este estudo científico e identifique os nutracêuticos mencionados, suas propriedades, dosagens e evidências científicas.',
        'conditions_prompt': 'Identifique as condições de saúde relacionadas aos nutracêuticos neste estudo e avalie a eficácia para cada condição.',
      };
      
      setAiConfigs(configs);
    };
    
    loadAiConfigs();
  }, []);

  return {
    aiConfigs,
    setAiConfigs,
  };
};
