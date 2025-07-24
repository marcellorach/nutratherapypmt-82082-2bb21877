
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
