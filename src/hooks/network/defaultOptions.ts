
import { NetworkGraphOptions } from './types';

// Configuração padrão do grafo
export const defaultNetworkOptions: NetworkGraphOptions = {
  nodes: {
    shape: 'dot',
    scaling: {
      min: 12,
      max: 30,
      label: {
        min: 12,
        max: 30,
        drawThreshold: 12,
        maxVisible: 20
      }
    },
    font: {
      size: 12,
      face: 'Inter, system-ui, sans-serif'
    }
  },
  edges: {
    width: 2,
    color: { inherit: 'from' },
    smooth: {
      enabled: true,
      type: 'continuous',
      forceDirection: 'none',
      roundness: 0.5
    },
    arrows: {
      to: { enabled: true, scaleFactor: 0.5 }
    }
  },
  physics: {
    stabilization: {
      iterations: 100,
      fit: true
    },
    barnesHut: {
      gravitationalConstant: -6000,
      centralGravity: 0.1,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09
    },
    minVelocity: 0.75
  },
  groups: {
    nutraceutico: {
      color: { background: '#3b82f6', border: '#2563eb' },
      shape: 'dot',
      font: { color: '#1e3a8a', size: 14 },
      borderWidth: 2,
      size: 20
    },
    condicao: {
      color: { background: '#10b981', border: '#059669' },
      shape: 'diamond',
      font: { color: '#064e3b', size: 14 },
      borderWidth: 2,
      size: 16
    },
    study: {
      color: { background: '#a855f7', border: '#9333ea' },
      shape: 'triangle',
      font: { color: '#581c87', size: 12 },
      borderWidth: 2,
      size: 14
    }
  }
};
