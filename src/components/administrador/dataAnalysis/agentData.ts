
import { Brain, Bot, MessageSquare, CheckCircle, Shield, FileSearch, Database, BarChart3, Search, Filter, Network, GitCompare, Zap } from "lucide-react";
import { Agent, AgentPosition } from "./types";

// Definição dos agentes do sistema com seus modelos
export const agents: Agent[] = [
  { 
    id: 'supervisor', 
    name: 'Agente Supervisor', 
    model: 'GPT-4o',
    color: 'bg-blue-100 border-blue-300', 
    icon: Shield, 
    description: 'Coordena todos os agentes e garante a coerência da análise'
  },
  { 
    id: 'data', 
    name: 'Agente de Dados', 
    model: 'Llama-3-70B',
    color: 'bg-emerald-100 border-emerald-300', 
    icon: Database, 
    description: 'Processa e normaliza dados brutos de pets' 
  },
  { 
    id: 'pattern', 
    name: 'Agente de Padrões', 
    model: 'Claude-3 Opus',
    color: 'bg-amber-100 border-amber-300', 
    icon: Search, 
    description: 'Identifica padrões estatísticos nos dados de saúde' 
  },
  { 
    id: 'correlation', 
    name: 'Agente de Correlação', 
    model: 'Claude-3 Opus',
    color: 'bg-purple-100 border-purple-300', 
    icon: GitCompare, 
    description: 'Analisa relações entre condições e tratamentos' 
  },
  { 
    id: 'recommendation', 
    name: 'Agente de Recomendação', 
    model: 'GPT-4-Turbo',
    color: 'bg-rose-100 border-rose-300', 
    icon: FileSearch, 
    description: 'Gera recomendações de nutracêuticos' 
  },
  { 
    id: 'viz', 
    name: 'Agente de Visualização', 
    model: 'Gemini Pro',
    color: 'bg-cyan-100 border-cyan-300', 
    icon: BarChart3, 
    description: 'Prepara visualizações e insights para relatórios' 
  },
];

// Posições de cada agente no fluxo
export const agentPositions: Record<string, AgentPosition> = {
  'supervisor': { x: 50, y: 8 },
  'data': { x: 50, y: 28 },
  'pattern': { x: 25, y: 40 },
  'correlation': { x: 50, y: 52 },
  'recommendation': { x: 25, y: 64 },
  'viz': { x: 75, y: 76 },
};

export const createInitialConnections = () => [
  { from: 'supervisor', to: 'data', active: false, animating: false },
  { from: 'supervisor', to: 'pattern', active: false, animating: false },
  { from: 'supervisor', to: 'correlation', active: false, animating: false },
  { from: 'supervisor', to: 'recommendation', active: false, animating: false },
  { from: 'supervisor', to: 'viz', active: false, animating: false },
  { from: 'data', to: 'pattern', active: false, animating: false },
  { from: 'pattern', to: 'correlation', active: false, animating: false },
  { from: 'correlation', to: 'recommendation', active: false, animating: false },
  { from: 'recommendation', to: 'viz', active: false, animating: false },
];
