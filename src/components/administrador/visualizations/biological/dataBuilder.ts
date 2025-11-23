import { BiologicalNode, BiologicalLink, BiologicalNetworkData, ExtractedData } from './types';

/**
 * Constrói dados hierárquicos para visualização biológica multi-camadas
 * Estrutura: Nutracêuticos → Mecanismos Moleculares → Efeitos Intermediários → Outcomes Clínicos
 */
export function buildBiologicalNetworkData(extractedData: ExtractedData): BiologicalNetworkData {
  const nodes: BiologicalNode[] = [];
  const links: BiologicalLink[] = [];

  const nutraceuticals = extractedData.extractedNutraceuticals || [];
  const mechanisms = extractedData.extractedMechanisms || [];
  const effects = extractedData.extractedEffects || [];
  const conditions = extractedData.extractedConditions || [];
  const interactions = extractedData.extractedInteractions || [];
  const sideEffects = extractedData.extractedSideEffects || [];
  
  // Helper para encontrar nó por nome (case-insensitive) com null safety
  const findNodeByName = (name?: string): BiologicalNode | undefined => {
    if (!name) return undefined;
    return nodes.find(n => n.label?.toLowerCase() === name.toLowerCase());
  };
  
  // Camada 0: Nutracêuticos (início da cadeia)
  nutraceuticals.forEach((nutra, idx) => {
    nodes.push({
      id: `nutra-${idx}`,
      label: nutra.name,
      type: 'nutraceutical',
      layer: 0,
      value: Math.round(nutra.confidence * 5),
      confidence: nutra.confidence,
      title: `${nutra.name}${nutra.dosage ? `\nDosagem: ${nutra.dosage}` : ''}${nutra.form ? `\nForma: ${nutra.form}` : ''}\nConfiança: ${(nutra.confidence * 100).toFixed(0)}%`
    });
  });
  
  // Camada 1: Mecanismos Moleculares (pathways, enzymes, receptors)
  mechanisms.forEach((mech, idx) => {
    nodes.push({
      id: `mech-${idx}`,
      label: mech.name,
      type: 'mechanism',
      layer: 1,
      value: Math.round(mech.confidence * 5),
      confidence: mech.confidence,
      title: `${mech.name} (${mech.type})\nConfiança: ${(mech.confidence * 100).toFixed(0)}%`,
      metadata: { mechanismType: mech.type }
    });
  });

  // Camada 2: Efeitos Biológicos Intermediários
  effects.forEach((effect, idx) => {
    nodes.push({
      id: `effect-${idx}`,
      label: effect.name,
      type: 'effect',
      layer: 2,
      value: Math.round(effect.confidence * 5),
      confidence: effect.confidence,
      title: `${effect.name} (${effect.type} effect)\nConfiança: ${(effect.confidence * 100).toFixed(0)}%`,
      metadata: { effectType: effect.type }
    });
  });

  // Camada 3: Condições/Outcomes Clínicos Finais
  conditions.forEach((cond, idx) => {
    nodes.push({
      id: `cond-${idx}`,
      label: cond.name,
      type: 'outcome',
      layer: 3,
      value: Math.round(cond.confidence * 5),
      confidence: cond.confidence,
      title: `Outcome: ${cond.name}\nConfiança: ${(cond.confidence * 100).toFixed(0)}%`
    });
  });
  
  // Criar links baseado em extractedInteractions (suporta formato novo E antigo)
  interactions.forEach((interaction: any, idx) => {
    // Suporte para formato NOVO (from/to) E formato ANTIGO (nutraceutical/interaction)
    const fromName = interaction.from || interaction.nutraceutical;
    const toName = interaction.to;
    const interactionType = interaction.type || 'modulation';
    const description = interaction.description || interaction.interaction || '';
    
    // Se formato antigo, não há "to", então não processar via novo método
    if (!toName && interaction.interaction) {
      // Formato antigo: criar lógica legada (simplificada)
      return;
    }
    
    const fromNode = findNodeByName(fromName);
    const toNode = findNodeByName(toName);
    
    if (fromNode && toNode) {
      links.push({
        id: `link-${idx}`,
        from: fromNode.id,
        to: toNode.id,
        type: interactionType as 'inhibition' | 'stimulation' | 'modulation',
        confidence: interaction.confidence || 0.8,
        label: '',
        title: description
      });
    } else {
      // Fallback: Se não encontrar nodes exatos, criar nós virtuais
      if (!fromNode && fromName) {
        const virtualId = `virtual-${idx}`;
        nodes.push({
          id: virtualId,
          label: `${fromName} (ref)`,
          type: 'nutraceutical',
          layer: 0,
          value: Math.round((interaction.confidence || 0.8) * 3),
          confidence: interaction.confidence || 0.8,
          title: `${fromName}\n(Mencionado mas não extraído)\nConfiança: ${((interaction.confidence || 0.8) * 100).toFixed(0)}%`
        });
        
        if (toNode) {
          links.push({
            id: `link-virtual-${idx}`,
            from: virtualId,
            to: toNode.id,
            type: interactionType as 'inhibition' | 'stimulation' | 'modulation',
            confidence: interaction.confidence || 0.8,
            label: '',
            title: description
          });
        }
      }
    }
  });
  
  // Efeitos colaterais (diamantes vermelhos, conectados aos nutracêuticos)
  sideEffects.forEach((effect, idx) => {
    const sideEffectId = `side-${idx}`;
    nodes.push({
      id: sideEffectId,
      label: effect.name,
      type: 'side_effect',
      layer: 2, // Mesmo nível que efeitos intermediários
      value: effect.severity === 'high' ? 5 : effect.severity === 'moderate' ? 3 : 1,
      confidence: effect.confidence,
      title: `${effect.name}\n${effect.description}\nSeveridade: ${effect.severity}\nConfiança: ${(effect.confidence * 100).toFixed(0)}%`
    });
    
    // Conectar aos nutracêuticos relacionados
    nutraceuticals.forEach((nutra, nIdx) => {
      // Conectar se o nome do nutracêutico estiver na descrição do efeito colateral
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
