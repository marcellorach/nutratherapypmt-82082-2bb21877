
// Tipos atualizados para suportar o diagrama Sankey aprimorado

// Categorias de nós possíveis
export type NodeCategory = 
  | 'nutraceutico' 
  | 'condicao' 
  | 'outcome' 
  | 'severidade' 
  | 'tratabilidade';

export type RelationshipType =
  | 'prevention'
  | 'treatment'
  | 'support'
  | 'study'
  | string;

// Nó do gráfico Sankey
export interface SankeyNode {
  name: string;
  category: string;
  value?: number;
  color?: string;
  description?: string;
}

// Link do gráfico Sankey
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color?: string;
  labelText?: string;
  studyCount?: number;
  evidenceLevel?: number;
  description?: string;
  relationshipType?: RelationshipType;
  originalRelation?: any; // Dados originais da relação
}

// Dados do gráfico Sankey
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Nó aprimorado com ID para referência
export interface EnhancedSankeyNode extends Omit<SankeyNode, 'category'> {
  id: string | number;
  category: string; // Idealmente seria NodeCategory, mas mantemos string para compatibilidade
  type?: string;
  metadata?: Record<string, any>;
}

// Link aprimorado com suporte a IDs de string
export interface EnhancedSankeyLink extends Omit<SankeyLink, 'source' | 'target'> {
  source: string | number;
  target: string | number;
  sourceName?: string;
  targetName?: string;
  efficacyScore?: number;
  treatabilityScore?: number;
  evidenceStrength?: number;
  metadata?: Record<string, any>;
}

// Dados aprimorados do gráfico Sankey
export interface EnhancedSankeyData {
  nodes: EnhancedSankeyNode[];
  links: EnhancedSankeyLink[];
}

// Configuração de cores por categoria
export interface CategoryColorConfig {
  background: string;
  text: string;
  border: string;
  highlight: string;
}

// Configurações visuais para o diagrama Sankey
export interface SankeyVisualConfig {
  colors: Record<NodeCategory | string, CategoryColorConfig>;
  nodePadding: number;
  nodeWidth: number;
  linkCurvature: number;
}
