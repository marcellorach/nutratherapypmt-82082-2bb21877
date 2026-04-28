/**
 * Maps PT (or mixed) clinical names to canonical English names used in
 * compound_dosage_reference, medical_knowledge_graph, and external sources.
 * Keeps the resolver waterfall hitting curated rows instead of the fallback.
 */

const COMPOUND_PT_EN: Record<string, string> = {
  'astaxantina': 'Astaxanthin',
  'quercetina': 'Quercetin',
  'curcumina': 'Curcumin',
  'cúrcuma': 'Curcumin',
  'curcuma': 'Curcumin',
  'resveratrol': 'Resveratrol',
  'fisetina': 'Fisetin',
  'glucosamina': 'Glucosamine',
  'glucosamina e sulfato de condroitina': 'Glucosamine',
  'sulfato de glucosamina': 'Glucosamine',
  'sulfato de condroitina': 'Chondroitin Sulfate',
  'condroitina': 'Chondroitin Sulfate',
  'colágeno tipo ii não desnaturado': 'Undenatured Type II Collagen',
  'colágeno tipo ii': 'Undenatured Type II Collagen',
  'colageno tipo ii': 'Undenatured Type II Collagen',
  'ucii': 'Undenatured Type II Collagen',
  'uc-ii': 'Undenatured Type II Collagen',
  'ácidos graxos ômega-3': 'Omega-3 Fatty Acids',
  'ácidos graxos omega-3': 'Omega-3 Fatty Acids',
  'acidos graxos omega-3': 'Omega-3 Fatty Acids',
  'ômega-3': 'Omega-3 Fatty Acids',
  'omega-3': 'Omega-3 Fatty Acids',
  'omega 3': 'Omega-3 Fatty Acids',
  'epa/dha': 'Omega-3 Fatty Acids',
  'epa+dha': 'Omega-3 Fatty Acids',
  'óleo de peixe': 'Omega-3 Fatty Acids',
  'oleo de peixe': 'Omega-3 Fatty Acids',
  'coenzima q10': 'CoQ10',
  'coq10': 'CoQ10',
  'ubiquinol': 'CoQ10',
  'same': 'SAMe',
  's-adenosilmetionina': 'SAMe',
  'silimarina': 'Silymarin',
  'silibina': 'Silymarin',
  'cardo mariano': 'Silymarin',
  'vitamina e': 'Vitamin E',
  'tocoferol': 'Vitamin E',
  'boswellia': 'Boswellia',
  'ácido hialurônico': 'Hyaluronic Acid',
  'acido hialuronico': 'Hyaluronic Acid',
  'l-carnitina': 'L-Carnitine',
  'carnitina': 'L-Carnitine',
  'taurina': 'Taurine',
  'fosfatidilserina': 'Phosphatidylserine',
  'tcm': 'MCT Oil',
  'óleo tcm': 'MCT Oil',
  'oleo tcm': 'MCT Oil',
  'mct': 'MCT Oil',
  'nmn': 'NMN',
  'nicotinamida mononucleotídeo': 'NMN',
  'nicotinamide mononucleotide': 'NMN',
};

const CONDITION_PT_EN: Array<[RegExp, string]> = [
  [/osteoartrite|osteoartrose|displasia coxofemoral/i, 'Osteoarthritis'],
  [/inflama[cç][aã]o sist[eê]mica|inflama[cç][aã]o cr[oô]nica|inflama[cç][aã]o/i, 'Inflammation'],
  [/envelhecimento celular|senesc[eê]ncia celular|aging celular/i, 'Cellular Aging'],
  [/disfun[cç][aã]o cognitiva|s[ií]ndrome cognitiva|cds/i, 'Cognitive Dysfunction'],
  [/cardiomiopatia|insufici[eê]ncia card[ií]aca|doen[cç]a card[ií]aca|dmvd|dcm/i, 'Cardiac Disease'],
  [/hepatop|insufici[eê]ncia hep[aá]tica|doen[cç]a hep[aá]tica/i, 'Hepatic Disease'],
  [/renal|nefropat/i, 'Renal Disease'],
  [/diabet/i, 'Diabetes Mellitus'],
  [/obesidade|controle de peso/i, 'Obesity'],
  [/longevidade|antioxida/i, 'Antioxidant Support'],
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Canonicalize a compound name to English. Strips parentheticals
 * (e.g. "Glucosamina (HCl)" → "Glucosamine"). Returns the original
 * (trimmed) string if no mapping is found.
 */
export function canonicalCompoundName(raw: string): string {
  if (!raw) return raw;
  const cleaned = raw.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const key = normalize(cleaned);
  if (COMPOUND_PT_EN[key]) return COMPOUND_PT_EN[key];
  // Try partial match (first significant word)
  for (const [pt, en] of Object.entries(COMPOUND_PT_EN)) {
    if (key.includes(pt) || pt.includes(key)) return en;
  }
  return cleaned;
}

/**
 * Canonicalize a condition string. Splits on commas / "e" / "and"
 * and returns the first canonical English condition match, or the
 * trimmed first segment if no rule matches.
 */
export function canonicalConditionName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Take first clinical concept from a compound phrase
  const parts = raw.split(/[,;]|\s+e\s+|\s+and\s+/i).map(p => p.trim()).filter(Boolean);
  for (const part of parts) {
    for (const [re, en] of CONDITION_PT_EN) {
      if (re.test(part)) return en;
    }
  }
  return parts[0] || raw.trim();
}