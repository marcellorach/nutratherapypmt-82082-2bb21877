
export interface SankeyNode {
  name: string;
  category: string;
  value?: number;
  color?: string;
  description?: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color?: string;
  labelText?: string;
  studyCount?: number;
  evidenceLevel?: number;
  description?: string;
  relationshipType?: 'prevention' | 'treatment' | 'support' | string;
  originalRelation?: any; // Dados originais da relação
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
