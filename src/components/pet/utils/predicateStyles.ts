// Shared visual tokens for KG predicates — reused by ScientificEvidencePanel
// and CompoundDosageSlider to keep biological notation consistent.

export const predicateBadgeColors: Record<string, string> = {
  TREATS: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
  PREVENTS: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  AMELIORATES: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
  INHIBITS: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  MODULATES: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  ACTIVATES: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  CONTRAINDICATES: 'bg-red-200 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-200',
  CAUSES: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  AGGRAVATES: 'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  SUPPORTS: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  ALLEVIATES: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
  BLOCKS: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  STIMULATES: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  REDUCES: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  INCREASES: 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  INTERACTS_WITH: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export const predicateSymbols: Record<string, string> = {
  TREATS: '→',
  PREVENTS: '→',
  AMELIORATES: '→',
  INHIBITS: '⊣',
  MODULATES: '- -→',
  ACTIVATES: '→',
  CONTRAINDICATES: '⊘',
  CAUSES: '→!',
  AGGRAVATES: '↑!',
  SUPPORTS: '→',
  ALLEVIATES: '→',
  BLOCKS: '⊣',
  STIMULATES: '→',
  REDUCES: '↓',
  INCREASES: '↑',
  INTERACTS_WITH: '⟷',
};

export const TREATMENT_PREDICATES = [
  'TREATS', 'AMELIORATES', 'PREVENTS', 'MODULATES', 'INHIBITS', 'ACTIVATES', 'SUPPORTS', 'ALLEVIATES',
];
