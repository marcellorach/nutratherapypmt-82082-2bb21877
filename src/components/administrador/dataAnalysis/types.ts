
export interface Agent {
  id: string;
  name: string;
  model: string;
  color: string;
  icon: any;
  description: string;
}

export interface AgentPosition {
  x: number;
  y: number;
}

export interface AgentConnection {
  from: string;
  to: string;
  active: boolean;
  animating: boolean;
  connectionType?: 'normal' | 'warning' | 'error';
}

export interface AgentMessage {
  agentId: string;
  message: string;
  timestamp: Date;
}

export interface DataPacket {
  fromId: string;
  toId: string;
  startTime: number;
  duration: number;
}

export type AnalysisStep = 'waiting' | 'processing' | 'completed';

// Tipos adicionais necessários para outros componentes
export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  recordCount: number;
  lastUpdated: Date | string;
}

export interface PredictionModel {
  id: string;
  name: string;
  accuracy: number;
  status?: string;
  description: string;
  algorithm: string;
  lastTrained: Date | string;
  parameters?: any;
}

export interface NutraceuticalRule {
  id: string;
  name: string;
  condition: string;
  recommendation?: string;
  evidence?: number;
  description: string;
  active: boolean;
  priority: number | string;
  appliesTo?: string[];
  formula?: string;
}
