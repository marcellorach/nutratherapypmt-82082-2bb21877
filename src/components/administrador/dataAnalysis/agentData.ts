
import { Brain, Bot, MessageSquare, CheckCircle, Shield, FileSearch, Database, BarChart3, Search, Filter, Network, GitCompare, Zap } from "lucide-react";
import { Agent, AgentPosition } from "./types";

// Definição dos agentes do sistema com modelos corretos (OpenAI, Anthropic, Gemini, Mistral)
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
    model: 'Claude-3 Opus',
    color: 'bg-emerald-100 border-emerald-300', 
    icon: Database, 
    description: 'Processa e normaliza dados brutos de pets' 
  },
  { 
    id: 'pattern', 
    name: 'Agente de Padrões', 
    model: 'Gemini Pro',
    color: 'bg-amber-100 border-amber-300', 
    icon: Search, 
    description: 'Identifica padrões estatísticos nos dados de saúde' 
  },
  { 
    id: 'correlation', 
    name: 'Agente de Correlação', 
    model: 'Mistral Large',
    color: 'bg-purple-100 border-purple-300', 
    icon: GitCompare, 
    description: 'Analisa relações entre condições e tratamentos' 
  },
  { 
    id: 'recommendation', 
    name: 'Agente de Recomendação', 
    model: 'GPT-4o',
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

// Posições em uma estrutura mais hierárquica e complexa
export const agentPositions: Record<string, AgentPosition> = {
  'supervisor': { x: 50, y: 15 },
  'data': { x: 20, y: 35 },
  'pattern': { x: 80, y: 35 },
  'correlation': { x: 35, y: 55 },
  'recommendation': { x: 65, y: 55 },
  'viz': { x: 50, y: 75 },
};

export const createInitialConnections = () => [
  // Conexões hierárquicas do supervisor
  { from: 'supervisor', to: 'data', active: false, animating: false },
  { from: 'supervisor', to: 'pattern', active: false, animating: false },
  { from: 'supervisor', to: 'correlation', active: false, animating: false },
  { from: 'supervisor', to: 'recommendation', active: false, animating: false },
  { from: 'supervisor', to: 'viz', active: false, animating: false },
  
  // Conexões laterais entre agentes
  { from: 'data', to: 'pattern', active: false, animating: false },
  { from: 'data', to: 'correlation', active: false, animating: false },
  { from: 'pattern', to: 'correlation', active: false, animating: false },
  { from: 'pattern', to: 'recommendation', active: false, animating: false },
  { from: 'correlation', to: 'recommendation', active: false, animating: false },
  { from: 'recommendation', to: 'viz', active: false, animating: false },
  
  // Conexões de feedback
  { from: 'correlation', to: 'data', active: false, animating: false },
  { from: 'viz', to: 'supervisor', active: false, animating: false },
];
