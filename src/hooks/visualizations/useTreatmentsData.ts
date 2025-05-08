
import { useState, useEffect, useMemo } from 'react';

// Dados simulados para pacotes de tratamento
const mockPackages = [
  {
    id: 'p1',
    name: 'Pack Articular Premium',
    type: 'treatment',
    condition: 'Artrite',
    nutraceuticalCount: 6,
    efficacyScore: 87,
    speciesTarget: ['Cães'],
    status: 'approved'
  },
  {
    id: 'p2',
    name: 'Pack Preventivo Articular',
    type: 'prevention',
    condition: 'Artrite',
    nutraceuticalCount: 4,
    efficacyScore: 92,
    speciesTarget: ['Cães', 'Gatos'],
    status: 'approved'
  },
  {
    id: 'p3',
    name: 'Pack Derma Plus',
    type: 'treatment',
    condition: 'Dermatite Atópica',
    nutraceuticalCount: 5,
    efficacyScore: 78,
    speciesTarget: ['Cães'],
    status: 'approved'
  },
  {
    id: 'p4',
    name: 'Pack Digestivo Total',
    type: 'treatment',
    condition: 'Problemas Digestivos',
    nutraceuticalCount: 7,
    efficacyScore: 84,
    speciesTarget: ['Cães', 'Gatos'],
    status: 'pending'
  },
  {
    id: 'p5',
    name: 'Pack Suporte Cardíaco',
    type: 'support',
    condition: 'Problemas Cardíacos',
    nutraceuticalCount: 5,
    efficacyScore: 72,
    speciesTarget: ['Cães'],
    status: 'approved'
  },
  {
    id: 'p6',
    name: 'Pack Preventivo Dental',
    type: 'prevention',
    condition: 'Problemas Dentários',
    nutraceuticalCount: 4,
    efficacyScore: 95,
    speciesTarget: ['Cães', 'Gatos'],
    status: 'approved'
  },
  {
    id: 'p7',
    name: 'Pack Gestão de Peso',
    type: 'treatment',
    condition: 'Obesidade',
    nutraceuticalCount: 6,
    efficacyScore: 88,
    speciesTarget: ['Cães', 'Gatos'],
    status: 'draft'
  }
];

// Detalhes de um pacote específico
const mockPackageDetails = {
  id: 'p1',
  name: 'Pack Articular Premium',
  description: 'Combinação sinérgica de 6 nutracêuticos para tratamento avançado de problemas articulares em cães, especialmente eficaz para artrite e displasia.',
  nutraceuticals: [
    { id: 'n1', name: 'Glucosamina', dosage: '20mg/kg/dia', efficacyScore: 85 },
    { id: 'n2', name: 'Condroitina', dosage: '15mg/kg/dia', efficacyScore: 82 },
    { id: 'n3', name: 'MSM', dosage: '10mg/kg/dia', efficacyScore: 75 },
    { id: 'n4', name: 'Ômega-3', dosage: '30mg/kg/dia', efficacyScore: 78 },
    { id: 'n5', name: 'Curcumina', dosage: '5mg/kg/dia', efficacyScore: 70 },
    { id: 'n6', name: 'Ácido Hialurônico', dosage: '2mg/kg/dia', efficacyScore: 80 }
  ],
  totalEfficacy: 87,
  condition: 'Artrite',
  speciesTarget: ['Cães'],
  administrationInstructions: 'Administrar dividido em duas doses diárias, preferencialmente com alimentos. Para melhores resultados, iniciar com dose de ataque por 10 dias e depois manter dose de manutenção.',
  contraindications: [
    'Pacientes com distúrbios de coagulação ou uso concomitante de anticoagulantes',
    'Hipersensibilidade conhecida a qualquer componente da formulação',
    'Gestantes e lactantes'
  ],
  synergies: [
    { description: 'Glucosamina + Condroitina: Regeneração da cartilagem', score: 20 },
    { description: 'Ômega-3 + Curcumina: Potencialização anti-inflamatória', score: 15 },
    { description: 'MSM + Ácido Hialurônico: Aumento da mobilidade articular', score: 12 }
  ]
};

// Estatísticas para gráficos
const mockPackageStats = {
  averageEfficacy: 82.3,
  averageEfficacyByCondition: [
    { condition: 'Artrite', treatmentEfficacy: 87, preventionEfficacy: 92 },
    { condition: 'Dermatite', treatmentEfficacy: 78, preventionEfficacy: 65 },
    { condition: 'Digestivo', treatmentEfficacy: 84, preventionEfficacy: 88 },
    { condition: 'Cardíaco', treatmentEfficacy: 72, preventionEfficacy: 75 },
    { condition: 'Dental', treatmentEfficacy: 80, preventionEfficacy: 95 },
    { condition: 'Obesidade', treatmentEfficacy: 88, preventionEfficacy: 90 }
  ],
  efficacyTrend: [
    { month: 'Jan', treatmentEfficacy: 75, preventionEfficacy: 80 },
    { month: 'Fev', treatmentEfficacy: 77, preventionEfficacy: 82 },
    { month: 'Mar', treatmentEfficacy: 78, preventionEfficacy: 82 },
    { month: 'Abr', treatmentEfficacy: 79, preventionEfficacy: 83 },
    { month: 'Mai', treatmentEfficacy: 80, preventionEfficacy: 85 },
    { month: 'Jun', treatmentEfficacy: 81, preventionEfficacy: 86 },
    { month: 'Jul', treatmentEfficacy: 82, preventionEfficacy: 88 },
    { month: 'Ago', treatmentEfficacy: 83, preventionEfficacy: 89 },
    { month: 'Set', treatmentEfficacy: 84, preventionEfficacy: 90 },
    { month: 'Out', treatmentEfficacy: 85, preventionEfficacy: 91 },
    { month: 'Nov', treatmentEfficacy: 86, preventionEfficacy: 92 },
    { month: 'Dez', treatmentEfficacy: 87, preventionEfficacy: 93 }
  ]
};

interface UseTreatmentsDataProps {
  searchTerm?: string;
  condition?: string;
  species?: string;
  packageType?: string;
}

export const useTreatmentsData = ({
  searchTerm = '',
  condition = 'all',
  species = 'all',
  packageType = 'all'
}: UseTreatmentsDataProps) => {
  const [packages, setPackages] = useState(mockPackages);
  const [isLoading, setIsLoading] = useState(true);
  const [packageDetails, setPackageDetails] = useState(mockPackageDetails);
  const [packageStats, setPackageStats] = useState(mockPackageStats);
  
  useEffect(() => {
    // Simulando carregamento de dados
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filtragem de dados
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      // Filtro por termo de busca
      if (searchTerm && !pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro por condição
      if (condition !== 'all' && !pkg.condition.toLowerCase().includes(condition.toLowerCase())) {
        return false;
      }
      
      // Filtro por espécie
      if (species !== 'all') {
        const speciesMap: Record<string, string[]> = {
          'canine': ['Cães'],
          'feline': ['Gatos']
        };
        
        const targetSpecies = speciesMap[species] || [];
        
        if (!pkg.speciesTarget.some(s => targetSpecies.includes(s))) {
          return false;
        }
      }
      
      // Filtro por tipo de pacote
      if (packageType !== 'all' && pkg.type !== packageType) {
        return false;
      }
      
      return true;
    });
  }, [packages, searchTerm, condition, species, packageType]);
  
  return {
    packages,
    filteredPackages,
    isLoading,
    packageDetails,
    packageStats
  };
};
