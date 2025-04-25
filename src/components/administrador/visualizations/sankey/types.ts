
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
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
