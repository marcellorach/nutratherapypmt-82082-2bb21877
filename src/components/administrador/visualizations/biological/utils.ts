import { BiologicalLink } from './types';

/**
 * Classifica o tipo de interação baseado em palavras-chave no texto
 */
export function classifyInteractionType(interactionText: string): 'inhibition' | 'stimulation' | 'modulation' {
  const inhibitionKeywords = [
    'reduz', 'inibe', 'bloqueia', 'diminui', 'suprime', 'down-regula',
    'reduces', 'inhibits', 'blocks', 'decreases', 'suppresses', 'down',
    '↓', 'down-regulation', 'downregulation'
  ];
  
  const stimulationKeywords = [
    'aumenta', 'estimula', 'promove', 'eleva', 'induz', 'up-regula',
    'increases', 'stimulates', 'promotes', 'elevates', 'induces', 'up',
    '↑', 'up-regulation', 'upregulation', 'enhances'
  ];
  
  const lowerText = interactionText.toLowerCase();
  
  if (inhibitionKeywords.some(kw => lowerText.includes(kw))) {
    return 'inhibition';
  } else if (stimulationKeywords.some(kw => lowerText.includes(kw))) {
    return 'stimulation';
  }
  return 'modulation';
}

/**
 * Extrai o alvo molecular/pathway da interação (tenta identificar nomes de moléculas/pathways)
 */
export function extractMolecularTarget(interactionText: string): string | null {
  // Padrões comuns de pathways/moléculas
  const patterns = [
    /\b(NF-κB|NF-kB|NFkB)\b/gi,
    /\b(COX-2|COX2)\b/gi,
    /\b(TNF-α|TNF-a|TNF)\b/gi,
    /\b(IL-\d+)\b/gi,
    /\b(BDNF)\b/gi,
    /\b(mTOR)\b/gi,
    /\b([A-Z][A-Z0-9]{2,})\s+(pathway|signaling|expression)/gi,
    /\b(oxidative stress|inflammation|apoptosis)\b/gi
  ];
  
  for (const pattern of patterns) {
    const match = interactionText.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  // Tenta pegar palavras capitalizadas (possíveis nomes de moléculas)
  const capitalizedMatch = interactionText.match(/\b[A-Z][a-z]+(?:-[A-Z][a-z]+)*\b/);
  if (capitalizedMatch) {
    return capitalizedMatch[0];
  }
  
  return null;
}

/**
 * Trunca texto longo para exibição em labels
 */
export function truncateLabel(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Calcula a confiança média de um conjunto de links
 */
export function calculateAverageConfidence(links: BiologicalLink[]): number {
  if (links.length === 0) return 0;
  const sum = links.reduce((acc, link) => acc + (link.confidence || 0), 0);
  return sum / links.length;
}
