
import { EstudoResultado } from '../../PesquisaEstudosTab';

const journals = [
  'Journal of Veterinary Science',
  'Veterinary Research',
  'Journal of Animal Physiology and Animal Nutrition',
  'Veterinary Microbiology',
  'BMC Veterinary Research',
  'Journal of Veterinary Internal Medicine',
  'Frontiers in Veterinary Science',
  'Veterinary Immunology and Immunopathology',
  'Journal of Veterinary Pharmacology and Therapeutics',
  'The Veterinary Journal'
];

const authors = [
  ['Silva, M.', 'Gomez, A.', 'Parker, J.'],
  ['Chen, L.', 'Wilson, K.', 'Thompson, R.'],
  ['Martinez, C.', 'Johnson, B.', 'Williams, S.'],
  ['Patel, N.', 'Turner, E.', 'Brown, M.'],
  ['Schmidt, H.', 'Miller, J.', 'Davis, R.'],
  ['Anderson, L.', 'Harris, T.', 'Garcia, N.'],
  ['Rodriguez, A.', 'Smith, R.', 'Nguyen, V.'],
  ['Lee, S.', 'White, D.', 'Clark, A.'],
  ['Kim, J.', 'Evans, P.', 'Baker, S.'],
  ['Collins, M.', 'Adams, J.', 'Wright, K.']
];

const nutraceuticalTags = [
  'Curcumina', 
  'NMN', 
  'Resveratrol', 
  'Luteína', 
  'Ômega-3', 
  'Probióticos',
  'Coenzima Q10', 
  'Ácido Alfa-Lipoico', 
  'Glucosamina', 
  'Astaxantina',
  'Quercetina', 
  'Colágeno', 
  'MSM', 
  'SAMe', 
  'Spirulina',
  'Condroitina',
  'Berberina',
  'Zingibre'
];

const conditionTags = [
  'Artrite', 
  'Doença Renal', 
  'Função Hepática', 
  'Saúde Cardíaca', 
  'Imunidade', 
  'Inflamação',
  'Função Cognitiva', 
  'Saúde Intestinal', 
  'Condições Dermatológicas', 
  'Doença Periodontal',
  'Alergias', 
  'Diabetes', 
  'Obesidade', 
  'Sarcopenia', 
  'Estresse Oxidativo',
  'Processo de Envelhecimento',
  'Saúde Ocular',
  'Mobilidade'
];

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomDate = (startYear: number, endYear: number): string => {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month - 1, day).toISOString();
};

const getRelevantTags = (searchTerm: string): string[] => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Selecionar tags que podem estar relacionadas ao termo de busca
  let relevantNutraTags = nutraceuticalTags.filter(tag => 
    Math.random() < 0.3 || tag.toLowerCase().includes(lowerSearchTerm)
  );
  
  let relevantConditionTags = conditionTags.filter(tag => 
    Math.random() < 0.3 || tag.toLowerCase().includes(lowerSearchTerm)
  );
  
  // Garantir pelo menos algumas tags
  if (relevantNutraTags.length === 0) {
    relevantNutraTags = nutraceuticalTags.slice(0, 2 + Math.floor(Math.random() * 3));
  }
  
  if (relevantConditionTags.length === 0) {
    relevantConditionTags = conditionTags.slice(0, 2 + Math.floor(Math.random() * 3));
  }
  
  // Combinar e embaralhar
  const combined = [...relevantNutraTags.slice(0, 3), ...relevantConditionTags.slice(0, 4)];
  return combined.sort(() => Math.random() - 0.5);
};

const generateAbstract = (searchTerm: string, tags: string[]): string => {
  const abstractParts = [
    `This study investigates the effects of ${tags[0]} on ${tags[1]} in companion animals.`,
    `We conducted a randomized controlled trial with 50 dogs of various breeds to evaluate the efficacy of supplementation.`,
    `Results demonstrated significant improvements in clinical markers related to ${tags[1].toLowerCase()} after 8 weeks of treatment.`,
    `Additionally, we observed improvements in quality of life metrics and overall health status in the treatment group compared to controls.`,
    `These findings suggest that ${tags[0]} may be an effective nutraceutical intervention for managing ${tags[1].toLowerCase()} in canines, with potential applications in veterinary medicine.`
  ];
  
  return abstractParts.join(' ');
};

const generateStudyTitle = (searchTerm: string, tags: string[]): string => {
  const titleTemplates = [
    `Effects of ${tags[0]} on ${tags[1]} in Companion Animals: A Randomized Controlled Trial`,
    `${tags[0]} Supplementation for Management of ${tags[1]} in Dogs: Clinical Outcomes and Safety Profile`,
    `Evaluation of ${tags[0]} as a Therapeutic Agent for ${tags[1]} in Geriatric Canines`,
    `${tags[0]}: A Novel Approach to Addressing ${tags[1]} in Veterinary Medicine`,
    `Comparative Efficacy of ${tags[0]} and Standard Treatment for ${tags[1]} in Canines`,
    `Long-term Administration of ${tags[0]} in Dogs with ${tags[1]}: A Prospective Study`
  ];
  
  return getRandomElement(titleTemplates);
};

const generateSource = (searchTerm: string): string => {
  const sources = ['PubMed', 'ScienceDirect', 'Google Scholar', 'VetMed Database'];
  return getRandomElement(sources);
};

const getRandomMetrics = (): {
  relevancia: number;
  metodologia: number;
  impacto: number;
  originalidade: number;
} => {
  return {
    relevancia: Math.min(5, Math.max(1, 2 + Math.random() * 3)),
    metodologia: Math.min(5, Math.max(1, 2 + Math.random() * 3)),
    impacto: Math.min(5, Math.max(1, 2 + Math.random() * 3)),
    originalidade: Math.min(5, Math.max(1, 2 + Math.random() * 3))
  };
};

export const simulateEstudoSearch = async (
  searchTerm: string, 
  filtros: Record<string, any>
): Promise<EstudoResultado[]> => {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const resultCount = 5 + Math.floor(Math.random() * 15);
  const results: EstudoResultado[] = [];
  
  for (let i = 0; i < resultCount; i++) {
    const tags = getRelevantTags(searchTerm);
    const publishDate = getRandomDate(2015, 2024);
    const source = generateSource(searchTerm);
    const metrics = getRandomMetrics();
    
    // Aplicar filtros
    // Se houver filtro de nota mínima
    if (filtros.notaMinima && metrics.relevancia < filtros.notaMinima) {
      continue;
    }
    
    // Se houver filtros de base de dados
    if (
      (filtros.pubmed && source !== 'PubMed') ||
      (filtros.scienceDirect && source !== 'ScienceDirect') ||
      (filtros.googleScholar && source !== 'Google Scholar') ||
      (filtros.vetMed && source !== 'VetMed Database')
    ) {
      if (filtros.pubmed || filtros.scienceDirect || filtros.googleScholar || filtros.vetMed) {
        continue;
      }
    }
    
    // Se houver filtros de data
    if (filtros.dataInicio && new Date(publishDate) < new Date(filtros.dataInicio)) {
      continue;
    }
    
    if (filtros.dataFim && new Date(publishDate) > new Date(filtros.dataFim)) {
      continue;
    }
    
    results.push({
      id: `estudo-${Date.now()}-${i}`,
      title: generateStudyTitle(searchTerm, tags),
      authors: getRandomElement(authors),
      journal: getRandomElement(journals),
      publishDate,
      abstract: generateAbstract(searchTerm, tags),
      metrics,
      tags,
      url: `https://example.com/studies/${Date.now()}-${i}`,
      source,
      fullTextAvailable: Math.random() > 0.3
    });
  }
  
  return results;
};

export default simulateEstudoSearch;
