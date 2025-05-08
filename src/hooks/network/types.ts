
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

// Tipos de dados para o grafo de rede
export interface NetworkNode {
  id: string | number;
  label: string;
  title?: string;
  group?: string;
  shape?: string;
  color?: any;
  value?: number;
  [key: string]: any;
}

export interface NetworkLink {
  id?: string | number;
  from: string | number;
  to: string | number;
  title?: string;
  label?: string;
  color?: string;
  width?: number;
  value?: number;
  arrows?: any;
  dashes?: boolean | number[];
  [key: string]: any;
}

// Interface adicional para dar suporte ao formato alternativo de links
export interface SourceTargetLink {
  id?: string | number;
  source: string | number;
  target: string | number;
  title?: string;
  label?: string;
  color?: string;
  width?: number;
  value?: number;
  arrows?: any;
  dashes?: boolean | number[];
  [key: string]: any;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: (NetworkLink | SourceTargetLink)[];
}

export interface NetworkGraphOptions {
  physics?: any;
  nodes?: any;
  edges?: any;
  groups?: Record<string, any>;
}

export interface UseNetworkGraphResult {
  network: Network | null;
  nodes: DataSet<any> | null;
  edges: DataSet<any> | null;
}
