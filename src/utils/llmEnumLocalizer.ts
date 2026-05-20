/**
 * Normaliza/localiza strings que vêm cruas dos LLMs (em inglês ou misturadas).
 * Usado para garantir bilinguismo nos campos onde o modelo escreve livremente:
 * blinding, methodology_type, species, severity, durations etc.
 *
 * NÃO substitui i18n — é uma camada de pós-processamento para dados de IA.
 */

type Lang = 'pt' | 'en';

const DICT: Record<string, { pt: string; en: string }> = {
  // Blinding
  'none': { pt: 'sem cegamento', en: 'no blinding' },
  'single_blind': { pt: 'simples-cego', en: 'single-blind' },
  'single blind': { pt: 'simples-cego', en: 'single-blind' },
  'double_blind': { pt: 'duplo-cego', en: 'double-blind' },
  'double blind': { pt: 'duplo-cego', en: 'double-blind' },
  'triple_blind': { pt: 'triplo-cego', en: 'triple-blind' },
  'open_label': { pt: 'aberto (sem cegamento)', en: 'open-label' },

  // Methodology
  'rct': { pt: 'Ensaio clínico randomizado (RCT)', en: 'Randomized controlled trial (RCT)' },
  'randomized controlled trial': { pt: 'Ensaio clínico randomizado (RCT)', en: 'Randomized controlled trial' },
  'observational': { pt: 'Estudo observacional', en: 'Observational study' },
  'cohort': { pt: 'Coorte', en: 'Cohort' },
  'case_control': { pt: 'Caso-controle', en: 'Case-control' },
  'case-control': { pt: 'Caso-controle', en: 'Case-control' },
  'cross_sectional': { pt: 'Transversal', en: 'Cross-sectional' },
  'cross-sectional': { pt: 'Transversal', en: 'Cross-sectional' },
  'meta_analysis': { pt: 'Meta-análise', en: 'Meta-analysis' },
  'meta-analysis': { pt: 'Meta-análise', en: 'Meta-analysis' },
  'systematic_review': { pt: 'Revisão sistemática', en: 'Systematic review' },
  'systematic review': { pt: 'Revisão sistemática', en: 'Systematic review' },
  'review': { pt: 'Revisão', en: 'Review' },
  'narrative_review': { pt: 'Revisão narrativa', en: 'Narrative review' },
  'in_vitro': { pt: 'In vitro', en: 'In vitro' },
  'in_vivo': { pt: 'In vivo', en: 'In vivo' },
  'preclinical': { pt: 'Pré-clínico', en: 'Preclinical' },
  'clinical_trial': { pt: 'Ensaio clínico', en: 'Clinical trial' },
  'pilot_study': { pt: 'Estudo piloto', en: 'Pilot study' },

  // Species
  'human': { pt: 'Humano', en: 'Human' },
  'humans': { pt: 'Humanos', en: 'Humans' },
  'canine': { pt: 'Cão', en: 'Canine' },
  'canines': { pt: 'Cães', en: 'Canines' },
  'dog': { pt: 'Cão', en: 'Dog' },
  'dogs': { pt: 'Cães', en: 'Dogs' },
  'feline': { pt: 'Gato', en: 'Feline' },
  'felines': { pt: 'Gatos', en: 'Felines' },
  'cat': { pt: 'Gato', en: 'Cat' },
  'cats': { pt: 'Gatos', en: 'Cats' },
  'rat': { pt: 'Rato', en: 'Rat' },
  'rats': { pt: 'Ratos', en: 'Rats' },
  'mouse': { pt: 'Camundongo', en: 'Mouse' },
  'mice': { pt: 'Camundongos', en: 'Mice' },
  'rodent': { pt: 'Roedor', en: 'Rodent' },

  // Severity
  'mild': { pt: 'leve', en: 'mild' },
  'moderate': { pt: 'moderado', en: 'moderate' },
  'severe': { pt: 'grave', en: 'severe' },
  'serious': { pt: 'sério', en: 'serious' },
  'low': { pt: 'baixo', en: 'low' },
  'medium': { pt: 'médio', en: 'medium' },
  'high': { pt: 'alto', en: 'high' },

  // Intensity / quality
  'strong': { pt: 'forte', en: 'strong' },
  'weak': { pt: 'fraco', en: 'weak' },
  'inconclusive': { pt: 'inconclusivo', en: 'inconclusive' },
};

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

/** Localiza um único valor enum vindo do LLM. Se não houver match, retorna o original com primeira letra maiúscula. */
export function localizeEnum(value: string | null | undefined, lang: Lang = 'pt'): string {
  if (!value) return '';
  const hit = DICT[norm(value)];
  if (hit) return hit[lang];
  // Fallback: troca underscores por espaço e capitaliza
  const cleaned = value.replace(/_/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Localiza durações em texto livre: "12 weeks" → "12 semanas". */
export function localizeDuration(value: string | null | undefined, lang: Lang = 'pt'): string {
  if (!value) return '';
  if (lang === 'en') return value;
  return value
    .replace(/\bweeks?\b/gi, (m) => (m.toLowerCase() === 'week' ? 'semana' : 'semanas'))
    .replace(/\bdays?\b/gi, (m) => (m.toLowerCase() === 'day' ? 'dia' : 'dias'))
    .replace(/\bmonths?\b/gi, (m) => (m.toLowerCase() === 'month' ? 'mês' : 'meses'))
    .replace(/\byears?\b/gi, (m) => (m.toLowerCase() === 'year' ? 'ano' : 'anos'))
    .replace(/\bhours?\b/gi, (m) => (m.toLowerCase() === 'hour' ? 'hora' : 'horas'));
}

export function localizeList(values: string[] | null | undefined, lang: Lang = 'pt'): string[] {
  if (!values || !Array.isArray(values)) return [];
  return values.map((v) => localizeEnum(v, lang));
}