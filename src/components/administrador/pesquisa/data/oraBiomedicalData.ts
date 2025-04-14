
import { Study } from "../types/oraBiomedical";

// Dados de exemplo
export const ongoingStudies: Study[] = [
  {
    id: "ora-1",
    title: "Análise de flavonoides em longevidade de C. elegans",
    description: "Avaliação de 60 flavonoides naturais e seus efeitos na extensão do tempo de vida de C. elegans",
    startDate: "2025-03-01",
    progress: 68,
    compounds: 60,
    positiveResults: 12,
    status: 'ongoing',
    primaryInvestigator: "Dra. Marina Souza",
    priority: 'high'
  },
  {
    id: "ora-2",
    title: "Efeitos de polifenóis na função mitocondrial",
    description: "Investigação de compostos polifenólicos e seus efeitos na biogênese e função mitocondrial",
    startDate: "2025-02-15",
    progress: 42,
    compounds: 45,
    positiveResults: 8,
    status: 'ongoing',
    primaryInvestigator: "Dr. Felipe Mendes",
    priority: 'medium',
    alerts: 2
  },
  {
    id: "ora-3",
    title: "Avaliação de antibióticos na expressão de genes de longevidade",
    description: "Teste de 32 antibióticos e seus efeitos moduladores na expressão de genes relacionados à longevidade",
    startDate: "2025-03-10",
    progress: 25,
    compounds: 32,
    positiveResults: 3,
    status: 'ongoing',
    primaryInvestigator: "Dra. Carla Batista",
    priority: 'medium'
  },
  {
    id: "ora-4",
    title: "Peptídeos bioativos e resistência ao estresse oxidativo",
    description: "Screening de peptídeos com potencial antioxidante e efeitos na resistência ao estresse celular",
    startDate: "2025-03-20",
    progress: 12,
    compounds: 28,
    positiveResults: 2,
    status: 'ongoing',
    primaryInvestigator: "Dr. Ricardo Torres",
    priority: 'high',
    alerts: 1
  }
];

export const completedStudies: Study[] = [
  {
    id: "ora-c1",
    title: "Impacto de inibidores de mTOR na longevidade",
    description: "Avaliação de análogos de rapamicina na extensão de vida de C. elegans",
    startDate: "2024-09-05",
    endDate: "2025-01-15",
    progress: 100,
    compounds: 22,
    positiveResults: 7,
    status: 'completed',
    primaryInvestigator: "Dr. André Correia",
    priority: 'medium'
  },
  {
    id: "ora-c2",
    title: "Compostos quelantes e acúmulo de metais pesados",
    description: "Análise de agentes quelantes na redução do acúmulo de metais e impacto na longevidade",
    startDate: "2024-07-20",
    endDate: "2024-12-10",
    progress: 100,
    compounds: 18,
    positiveResults: 4,
    status: 'completed',
    primaryInvestigator: "Dra. Paula Vieira",
    priority: 'low'
  },
  {
    id: "ora-c3",
    title: "Extratos vegetais em resistência a radiação UV",
    description: "Screening de extratos botânicos e seus efeitos protetores contra danos por radiação ultravioleta",
    startDate: "2024-10-12",
    endDate: "2025-02-28",
    progress: 100,
    compounds: 42,
    positiveResults: 9,
    status: 'completed',
    primaryInvestigator: "Dra. Marina Souza",
    priority: 'high'
  }
];

export const plannedStudies: Study[] = [
  {
    id: "ora-p1",
    title: "Moduladores da autofagia em modelos de neurodegeneração",
    description: "Investigação de compostos que estimulam a autofagia em modelos de C. elegans para Alzheimer",
    startDate: "2025-05-10",
    progress: 0,
    compounds: 35,
    status: 'planned',
    primaryInvestigator: "Dr. Lucas Martins",
    priority: 'high'
  },
  {
    id: "ora-p2",
    title: "Isoflavonas e metabolismo lipídico",
    description: "Avaliação de isoflavonas derivadas de soja na modulação do metabolismo lipídico e longevidade",
    startDate: "2025-06-01",
    progress: 0,
    compounds: 24,
    status: 'planned',
    primaryInvestigator: "Dra. Júlia Campos",
    priority: 'medium'
  },
  {
    id: "ora-p3",
    title: "Alcaloides naturais e sinalização DAF-16/FOXO",
    description: "Análise de alcaloides vegetais na modulação de vias de sinalização relacionadas à longevidade",
    startDate: "2025-05-15",
    progress: 0,
    compounds: 30,
    status: 'planned',
    primaryInvestigator: "Dr. Mateus Costa",
    priority: 'low'
  }
];
