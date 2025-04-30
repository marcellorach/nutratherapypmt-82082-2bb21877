
import { useState } from 'react';

export const useNtaiConfig = () => {
  const [aiConfigs, setAiConfigs] = useState({
    modelName: "GPT-4o",
    temperature: "0.7",
    nutraceuticals_prompt: "Extrair todos os nutracêuticos mencionados no estudo e suas aplicações.",
    conditions_prompt: "Identificar todas as condições de saúde abordadas no estudo."
  });

  const updateAiConfig = (key: string, value: string) => {
    setAiConfigs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return { 
    aiConfigs, 
    updateAiConfig 
  };
};
