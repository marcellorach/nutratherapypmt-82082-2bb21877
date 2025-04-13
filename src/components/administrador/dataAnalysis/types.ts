
import React from 'react';

export interface Agent {
  id: string;
  name: string;
  model: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  capabilities?: string[];
  version?: string;
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

export interface NutraceuticalRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  appliesTo: string[];
  priority: number;
  formula?: string;
  active: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'clinical' | 'scientific' | 'analytics';
  description: string;
  lastUpdated: Date;
  recordCount: number;
  status: 'online' | 'updating' | 'offline';
}

export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  algorithm: string;
  accuracy: number;
  lastTrained: Date;
  parameters: Record<string, any>;
}
