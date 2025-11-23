import { BiologicalNode, BiologicalLink, BiologicalNetworkData, ExtractedData } from './types';
import { classifyInteractionType, extractMolecularTarget, truncateLabel } from './utils';

/**
 * Constrói dados hierárquicos para visualização biológica
 */
export function buildBiologicalNetworkData(extractedData: ExtractedData): BiologicalNetworkData {
  const nodes: BiologicalNode[] = [];
  const links: BiologicalLink[] = [];
  
  const nutraceuticals = extractedData.extractedNutraceuticals || [];
  const conditions = extractedData.extractedConditions || [];
  const interactions = extractedData.extractedInteractions || [];
  const sideEffects = extractedData.extractedSideEffects || [];
  
  // Camada 0: Nutracêuticos (início da cadeia)
  nutraceuticals.forEach((nutra, idx) => {
    nodes.push({
      id: `nutra-${idx}`,
      label: nutra.name,
      type: 'nutraceutical',
      layer: 0,
      value: Math.round(nutra.confidence * 5),
      confidence: nutra.confidence,
      title: `${nutra.name}\nConfiança: ${(nutra.confidence * 100).toFixed(0)}%`
    });
  });
  
  // Camada 1: Mecanismos/Pathways (intermediários)
  const mechanismMap = new Map<string, number>(); // target -> nodeIdx
  
  interactions.forEach((interaction, iIdx) => {
    const nutraIdx = nutraceuticals.findIndex(n => 
      n.name.toLowerCase() === interaction.nutraceutical.toLowerCase()
    );
    
    if (nutraIdx === -1) return;
    
    // Extrair alvo molecular
    const target = extractMolecularTarget(interaction.interaction) || 
                   truncateLabel(interaction.interaction, 30);
    
    // Criar ou reusar nó de mecanismo
    let mechNodeId: string;
    if (mechanismMap.has(target)) {
      mechNodeId = `mech-${mechanismMap.get(target)}`;
    } else {
      const mechIdx = mechanismMap.size;
      mechanismMap.set(target, mechIdx);
      mechNodeId = `mech-${mechIdx}`;
      
      nodes.push({
        id: mechNodeId,
        label: target,
        type: 'mechanism',
        layer: 1,
        value: Math.round(interaction.confidence * 5),
        confidence: interaction.confidence,
        title: `${target}\n${truncateLabel(interaction.interaction, 80)}\nConfiança: ${(interaction.confidence * 100).toFixed(0)}%`
      });
    }
    
    // Link nutracêutico → mecanismo
    const linkType = classifyInteractionType(interaction.interaction);
    links.push({
      id: `link-nutra-mech-${iIdx}`,
      from: `nutra-${nutraIdx}`,
      to: mechNodeId,
      type: linkType,
      confidence: interaction.confidence,
      label: '',
      title: truncateLabel(interaction.interaction, 100)
    });
  });
  
  // Camada 2: Efeitos intermediários (se houver descrições detalhadas)
  // Por enquanto vamos pular essa camada e ir direto para outcomes
  
  // Camada 3: Outcomes finais (condições de saúde)
  conditions.forEach((cond, idx) => {
    nodes.push({
      id: `cond-${idx}`,
      label: cond.name,
      type: 'outcome',
      layer: 3,
      value: Math.round(cond.confidence * 5),
      confidence: cond.confidence,
      title: `${cond.name}\nConfiança: ${(cond.confidence * 100).toFixed(0)}%`
    });
    
    // Conectar mecanismos relevantes às condições (baseado em matching de texto)
    const relevantMechs = Array.from(mechanismMap.entries()).filter(([target]) =>
      target.toLowerCase().includes(cond.name.toLowerCase()) ||
      cond.name.toLowerCase().includes(target.toLowerCase())
    );
    
    relevantMechs.forEach(([target, mechIdx]) => {
      links.push({
        id: `link-mech-cond-${mechIdx}-${idx}`,
        from: `mech-${mechIdx}`,
        to: `cond-${idx}`,
        type: 'modulation',
        confidence: cond.confidence,
        label: '',
        title: `${target} → ${cond.name}`
      });
    });
    
    // Se não há conexões, conectar a todos os mecanismos (fallback)
    if (relevantMechs.length === 0 && mechanismMap.size > 0) {
      const firstMechIdx = 0;
      links.push({
        id: `link-mech-cond-fallback-${idx}`,
        from: `mech-${firstMechIdx}`,
        to: `cond-${idx}`,
        type: 'modulation',
        confidence: cond.confidence * 0.8, // Reduzir confiança para links inferidos
        label: '',
        title: `Relação inferida → ${cond.name}`
      });
    }
  });
  
  // Efeitos colaterais (diamantes vermelhos, desconectados ou conectados aos nutracêuticos)
  sideEffects.forEach((effect, idx) => {
    const sideEffectId = `side-${idx}`;
    nodes.push({
      id: sideEffectId,
      label: effect.name,
      type: 'side_effect',
      layer: 2, // Mesmo nível de mecanismos, mas visualmente separado
      value: effect.severity === 'high' ? 5 : effect.severity === 'medium' ? 3 : 1,
      confidence: effect.confidence,
      title: `${effect.name}\n${effect.description}\nSeveridade: ${effect.severity}\nConfiança: ${(effect.confidence * 100).toFixed(0)}%`
    });
    
    // Conectar aos nutracêuticos relacionados
    nutraceuticals.forEach((nutra, nIdx) => {
      if (effect.description?.toLowerCase().includes(nutra.name.toLowerCase())) {
        links.push({
          id: `link-nutra-side-${nIdx}-${idx}`,
          from: `nutra-${nIdx}`,
          to: sideEffectId,
          type: 'modulation',
          confidence: effect.confidence,
          label: '',
          title: `Efeito colateral de ${nutra.name}`
        });
      }
    });
  });
  
  return { nodes, links };
}
