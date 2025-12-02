import { BiologicalNode, BiologicalLink, BiologicalNetworkData, ExtractedData } from './types';

/**
 * Constrói dados hierárquicos para visualização biológica multi-camadas
 * Estrutura: Nutracêuticos → Mecanismos Moleculares → Efeitos Intermediários → Outcomes Clínicos
 */
export function buildBiologicalNetworkData(extractedData: ExtractedData): BiologicalNetworkData {
  const nodes: BiologicalNode[] = [];
  const links: BiologicalLink[] = [];

  const nutraceuticals = extractedData.extractedNutraceuticals || [];
  const mechanisms = extractedData.extractedMechanisms || extractedData.molecularMechanisms || [];
  const effects = extractedData.extractedEffects || [];
  const conditions = extractedData.extractedConditions || [];
  const interactions = extractedData.extractedInteractions || [];
  const sideEffects = extractedData.extractedSideEffects || extractedData.detailedSideEffects || [];
  const hierarchicalRelations = extractedData.hierarchicalRelations || [];
  
  // Helper para encontrar nó por nome (case-insensitive) com null safety
  const findNodeByName = (name?: string): BiologicalNode | undefined => {
    if (!name) return undefined;
    return nodes.find(n => n.label?.toLowerCase() === name.toLowerCase());
  };
  
  // Camada 0: Nutracêuticos (início da cadeia)
  nutraceuticals.forEach((nutra: any, idx: number) => {
    nodes.push({
      id: `nutra-${idx}`,
      label: nutra.name,
      type: 'nutraceutical',
      layer: 0,
      value: Math.round((nutra.confidence || 0.8) * 5),
      confidence: nutra.confidence || 0.8,
      title: `${nutra.name}${nutra.dosage ? `\nDosagem: ${nutra.dosage}` : ''}${nutra.form ? `\nForma: ${nutra.form}` : ''}\nConfiança: ${((nutra.confidence || 0.8) * 100).toFixed(0)}%`
    });
  });
  
  // Camada 1: Mecanismos Moleculares (pathways, enzymes, receptors)
  mechanisms.forEach((mech: any, idx: number) => {
    const mechName = mech.name || mech.mechanism || 'Unknown';
    nodes.push({
      id: `mech-${idx}`,
      label: mechName,
      type: 'mechanism',
      layer: 1,
      value: Math.round((mech.confidence || 0.7) * 5),
      confidence: mech.confidence || 0.7,
      title: `${mechName}${mech.type ? ` (${mech.type})` : ''}\nConfiança: ${((mech.confidence || 0.7) * 100).toFixed(0)}%`,
      metadata: { mechanismType: mech.type, action: mech.action }
    });
    
    // Criar link do nutracêutico target para este mecanismo
    if (mech.target) {
      const targetNode = findNodeByName(mech.target);
      if (targetNode) {
        links.push({
          id: `link-mech-${idx}`,
          from: targetNode.id,
          to: `mech-${idx}`,
          type: mech.action === 'inhibition' ? 'inhibition' : mech.action === 'activation' ? 'stimulation' : 'modulation',
          confidence: mech.confidence || 0.7,
          label: mech.action || '',
          title: `${targetNode.label} → ${mechName}`
        });
      }
    }
  });

  // Camada 2: Efeitos Biológicos Intermediários
  effects.forEach((effect: any, idx: number) => {
    nodes.push({
      id: `effect-${idx}`,
      label: effect.name,
      type: 'effect',
      layer: 2,
      value: Math.round((effect.confidence || 0.7) * 5),
      confidence: effect.confidence || 0.7,
      title: `${effect.name}${effect.type ? ` (${effect.type} effect)` : ''}\nConfiança: ${((effect.confidence || 0.7) * 100).toFixed(0)}%`,
      metadata: { effectType: effect.type }
    });
  });

  // Camada 3: Condições/Outcomes Clínicos Finais
  conditions.forEach((cond: any, idx: number) => {
    nodes.push({
      id: `cond-${idx}`,
      label: cond.name,
      type: 'outcome',
      layer: 3,
      value: Math.round((cond.confidence || 0.8) * 5),
      confidence: cond.confidence || 0.8,
      title: `Outcome: ${cond.name}\nConfiança: ${((cond.confidence || 0.8) * 100).toFixed(0)}%`
    });
  });
  
  // Processar relações hierárquicas do Stage 2 (novo formato)
  hierarchicalRelations.forEach((rel: any, idx: number) => {
    const fromNode = findNodeByName(rel.from);
    const toNode = findNodeByName(rel.to);
    
    if (fromNode && toNode) {
      links.push({
        id: `link-hier-${idx}`,
        from: fromNode.id,
        to: toNode.id,
        type: rel.relation_type?.includes('inhib') ? 'inhibition' : rel.relation_type?.includes('activ') ? 'stimulation' : 'modulation',
        confidence: rel.confidence || 0.75,
        label: rel.relation_type || '',
        title: `${rel.from} ${rel.relation_type} ${rel.to}`
      });
    }
  });
  
  // Criar links diretos: nutracêuticos → condições (se não há mecanismos intermediários)
  if (mechanisms.length === 0 && links.length === 0) {
    nutraceuticals.forEach((nutra: any, nIdx: number) => {
      conditions.forEach((cond: any, cIdx: number) => {
        links.push({
          id: `link-direct-${nIdx}-${cIdx}`,
          from: `nutra-${nIdx}`,
          to: `cond-${cIdx}`,
          type: 'modulation',
          confidence: 0.7,
          label: 'TREATS',
          title: `${nutra.name} → ${cond.name}`
        });
      });
    });
  }
  
  // Criar links baseado em extractedInteractions (suporta formato novo E antigo)
  interactions.forEach((interaction: any, idx: number) => {
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
  sideEffects.forEach((effect: any, idx: number) => {
    const sideEffectId = `side-${idx}`;
    nodes.push({
      id: sideEffectId,
      label: effect.name,
      type: 'side_effect',
      layer: 2, // Mesmo nível que efeitos intermediários
      value: effect.severity === 'severe' || effect.severity === 'high' ? 5 : effect.severity === 'moderate' ? 3 : 1,
      confidence: effect.confidence || 0.6,
      title: `${effect.name}\n${effect.description || ''}\nSeveridade: ${effect.severity || 'unknown'}\nConfiança: ${((effect.confidence || 0.6) * 100).toFixed(0)}%`
    });
    
    // Conectar aos nutracêuticos relacionados
    nutraceuticals.forEach((nutra: any, nIdx: number) => {
      // Conectar se o nome do nutracêutico estiver na descrição do efeito colateral
      if (effect.description?.toLowerCase().includes(nutra.name.toLowerCase())) {
        links.push({
          id: `link-nutra-side-${nIdx}-${idx}`,
          from: `nutra-${nIdx}`,
          to: sideEffectId,
          type: 'modulation',
          confidence: effect.confidence || 0.6,
          label: '',
          title: `Efeito colateral de ${nutra.name}`
        });
      }
    });
  });
  
  return { nodes, links };
}
