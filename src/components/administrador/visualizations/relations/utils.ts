import { SankeyData } from '../sankey/types';

export const prepareNetworkData = (sankeyData: SankeyData) => {
  const nodes = sankeyData.nodes.map((node, index) => ({
    id: index,
    label: node.name,
    title: node.description,
    group: node.category,
    value: node.category === 'nutraceutico' ? 15 : 10,
    shape: node.category === 'nutraceutico' ? 'dot' : 'diamond',
    color: {
      background: node.category === 'nutraceutico' ? '#3b82f6' : 
               node.category === 'condicao' ? '#10b981' : '#f59e0b',
      border: node.category === 'nutraceutico' ? '#2563eb' : 
              node.category === 'condicao' ? '#059669' : '#d97706',
      highlight: {
        background: node.category === 'nutraceutico' ? '#60a5fa' : 
                 node.category === 'condicao' ? '#34d399' : '#fbbf24',
        border: node.category === 'nutraceutico' ? '#3b82f6' : 
                node.category === 'condicao' ? '#10b981' : '#f59e0b'
      }
    }
  }));

  const edges = sankeyData.links.map(link => ({
    from: link.source,
    to: link.target,
    title: link.labelText ? `${link.labelText} (${link.value / 20}/5)` : `Eficácia: ${link.value / 20}/5`,
    value: link.value / 20, // Adaptar a escala
    width: (link.value / 100) * 5,
    label: (link.value / 20).toString(),
    color: link.value >= 80 ? '#10b981' : 
         link.value >= 60 ? '#3b82f6' : 
         link.value >= 40 ? '#f59e0b' : '#9ca3af'
  }));

  return { nodes, edges };
};

export const prepareMatrixData = (sankeyData: SankeyData) => {
  const nutraceuticos = sankeyData.nodes
    .filter(node => node.category === 'nutraceutico')
    .map((node, index) => ({
      id: index,
      name: node.name,
      description: node.description,
      category: 'nutraceutico' as const
    }));

  const condicoes = sankeyData.nodes
    .filter(node => node.category === 'condicao')
    .map((node, index) => ({
      id: index + nutraceuticos.length,
      name: node.name,
      description: node.description,
      category: 'condicao' as const
    }));

  const cells = sankeyData.links.map(link => ({
    nutraceuticoId: link.source,
    condicaoId: link.target,
    efficacyScore: link.value / 20, // Converter de volta para escala 0-5
    evidenceLevel: (link.value / 20).toFixed(1) || '-',
    studyCount: link.originalRelation?.studyCount || 0,
    description: link.description,
    relationshipType: link.relationshipType || 'prevention'
  }));

  return {
    nutraceuticos,
    condicoes,
    cells
  };
};
