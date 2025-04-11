
import React from 'react';

export interface Agent {
  id: string;
  name: string;
  model: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface AgentMessage {
  agentId: string;
  message: string;
  timestamp: Date;
}

export interface AgentConnection {
  from: string;
  to: string;
  active: boolean;
  animating: boolean;
}

export interface DataPacket {
  fromId: string;
  toId: string;
  startTime: number;
  duration: number;
}

export interface AgentPosition {
  x: number;
  y: number;
}

export type AnalysisStep = 'waiting' | 'processing' | 'completed';
