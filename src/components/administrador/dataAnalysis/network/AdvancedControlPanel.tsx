
import React, { useState, useEffect } from 'react';
import { AgentConnection } from '../types';
import { Activity, Cpu, HardDrive, Network, Zap } from 'lucide-react';

interface AdvancedControlPanelProps {
  connections: AgentConnection[];
  activeAgent: string | null;
}

const AdvancedControlPanel: React.FC<AdvancedControlPanelProps> = ({
  connections,
  activeAgent
}) => {
  const [systemMetrics, setSystemMetrics] = useState({
    totalRequests: 0,
    avgLatency: 0,
    throughput: 0,
    errorRate: 0,
    uptime: 0
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
        avgLatency: 45 + Math.random() * 20,
        throughput: 2.1 + Math.random() * 0.8,
        errorRate: Math.random() * 0.5,
        uptime: prev.uptime + 1
      }));

      // Simular alertas ocasionais
      if (Math.random() < 0.1) {
        setAlerts(prev => {
          const newAlerts = [...prev, `Sistema processou ${Math.floor(Math.random() * 100)} registros`];
          return newAlerts.slice(-3); // Manter apenas os 3 últimos
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeConnections = connections.filter(c => c.active);
  const animatingConnections = connections.filter(c => c.animating);

  const formatUptime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200 shadow-lg">
      <div className="p-4 space-y-3">
        {/* Status principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">Sistema Multi-Agente Ativo</span>
            </div>
            <div className="text-sm text-slate-500">
              {activeConnections.length} conexões ativas • {animatingConnections.length} em processamento
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Activity className="w-4 h-4" />
            <span>Uptime: {formatUptime(systemMetrics.uptime)}</span>
          </div>
        </div>

        {/* Métricas de performance */}
        <div className="grid grid-cols-5 gap-4 text-center">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
              <Zap className="w-3 h-3" />
              <span className="text-xs">Requisições</span>
            </div>
            <div className="text-lg font-mono font-semibold text-slate-800">
              {systemMetrics.totalRequests.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
              <Activity className="w-3 h-3" />
              <span className="text-xs">Latência</span>
            </div>
            <div className="text-lg font-mono font-semibold text-slate-800">
              {systemMetrics.avgLatency.toFixed(1)}ms
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
              <Network className="w-3 h-3" />
              <span className="text-xs">Throughput</span>
            </div>
            <div className="text-lg font-mono font-semibold text-slate-800">
              {systemMetrics.throughput.toFixed(1)} Mbps
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
              <HardDrive className="w-3 h-3" />
              <span className="text-xs">Erro Rate</span>
            </div>
            <div className="text-lg font-mono font-semibold text-slate-800">
              {systemMetrics.errorRate.toFixed(2)}%
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
              <Cpu className="w-3 h-3" />
              <span className="text-xs">Agente Ativo</span>
            </div>
            <div className="text-lg font-mono font-semibold text-slate-800">
              {activeAgent ? activeAgent.toUpperCase() : 'NONE'}
            </div>
          </div>
        </div>

        {/* Status dos modelos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {['GPT-4o', 'Claude-3 Opus', 'Gemini Pro', 'Mistral Large'].map(model => {
              const isActive = activeAgent && activeAgent.includes(model.toLowerCase().replace(/[^a-z]/g, ''));
              const statusColor = isActive ? '#10b981' : '#6b7280';
              
              return (
                <div key={model} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                  <span className="text-xs font-mono text-slate-600">{model}</span>
                  <span className="text-xs text-slate-500">
                    {isActive ? 'ATIVO' : 'STANDBY'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas recentes */}
        {alerts.length > 0 && (
          <div className="border-t border-slate-200 pt-2">
            <div className="text-xs text-slate-600 mb-1">Eventos Recentes:</div>
            <div className="space-y-1">
              {alerts.map((alert, index) => (
                <div key={index} className="text-xs text-slate-500 font-mono">
                  • {alert}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedControlPanel;
