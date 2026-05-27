/**
 * Canonicalizes lab flag/exam names so PT/EN/abbrev variants count as one.
 * Used by cohort aggregations (e.g. "HCT" + "Hematócrito" -> "HCT").
 */

const ALIASES: Record<string, string> = {
  // Hematology
  'hct': 'HCT',
  'hematocrito': 'HCT',
  'hematócrito': 'HCT',
  'ht': 'HCT',
  'hgb': 'HGB',
  'hemoglobina': 'HGB',
  'plt': 'PLT',
  'plaquetas': 'PLT',
  'wbc': 'WBC',
  'leucocitos': 'WBC',
  'leucócitos': 'WBC',
  'rbc': 'RBC',
  'hemacias': 'RBC',
  'hemácias': 'RBC',
  'eritrocitos': 'RBC',
  // Biochemistry
  'alt': 'ALT',
  'tgp': 'ALT',
  'ast': 'AST',
  'tgo': 'AST',
  'fa': 'ALP',
  'alp': 'ALP',
  'fosfatase alcalina': 'ALP',
  'ggt': 'GGT',
  'ureia': 'BUN',
  'bun': 'BUN',
  'creatinina': 'Creatinine',
  'creatinine': 'Creatinine',
  'glicose': 'Glucose',
  'glucose': 'Glucose',
  'colesterol': 'Cholesterol',
  'cholesterol': 'Cholesterol',
  'triglicerides': 'Triglycerides',
  'triglicerídeos': 'Triglycerides',
  'triglycerides': 'Triglycerides',
  't4': 'T4',
  'tsh': 'TSH',
};

export function canonicalLabFlag(name: string): string {
  if (!name) return '';
  const key = name.toLowerCase().trim();
  return ALIASES[key] || name.trim();
}