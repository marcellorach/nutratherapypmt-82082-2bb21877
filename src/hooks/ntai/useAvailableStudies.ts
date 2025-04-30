
import { useState } from 'react';
import { AvailableStudy } from './types/processing';

export const useAvailableStudies = () => {
  const [availableStudies, setAvailableStudies] = useState<AvailableStudy[]>([
    {
      id: "1",
      title: "Efeitos de Glucosamina na Saúde Articular",
      description: "Estudo randomizado sobre glucosamina",
      journal: "Journal of Veterinary Medicine",
      kanban_status: "new",
      import_type: "manual",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Ômega 3 e Saúde Cardiovascular em Cães",
      description: "Meta-análise de estudos sobre ômega 3",
      journal: "Animal Health Research",
      kanban_status: "especial",
      import_type: "scispace",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Curcumina como Anti-inflamatório Natural",
      description: "Revisão sistemática sobre curcumina",
      journal: "Nutraceutical Research",
      kanban_status: "new",
      import_type: "scispace",
      created_at: new Date().toISOString(),
    }
  ]);

  const refreshAvailableStudies = async () => {
    // Aqui seria implementada a lógica para buscar estudos do backend
    console.log("Buscando estudos disponíveis do backend...");
    // Por enquanto mantemos os estudos de exemplo
  };

  return {
    availableStudies,
    setAvailableStudies,
    refreshAvailableStudies
  };
};
