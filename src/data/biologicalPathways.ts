/**
 * Synthetic biological pathways per condition.
 * Each pathway: compound → molecular mechanism → cellular process → clinical outcome.
 * Edge kind: 'activates' (→), 'inhibits' (⊣), 'modulates' (⇢).
 * Width proportional to `evidence` (synthetic, 0..1).
 */

export type EdgeKind = 'activates' | 'inhibits' | 'modulates';

export interface PathwayNode {
  id: string;
  label: string;
  label_en: string;
  tier: 'compound' | 'mechanism' | 'process' | 'outcome';
}

export interface PathwayEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  evidence: number; // 0..1 → mapped to stroke width
}

export interface BiologicalPathway {
  conditionId: string;
  nodes: PathwayNode[];
  edges: PathwayEdge[];
}

export const BIOLOGICAL_PATHWAYS: BiologicalPathway[] = [
  {
    conditionId: 'oa',
    nodes: [
      { id: 'cur', label: 'Curcumina', label_en: 'Curcumin', tier: 'compound' },
      { id: 'omega3', label: 'Ômega-3', label_en: 'Omega-3', tier: 'compound' },
      { id: 'bosw', label: 'Boswellia', label_en: 'Boswellia', tier: 'compound' },
      { id: 'nfkb', label: 'NF-κB', label_en: 'NF-κB', tier: 'mechanism' },
      { id: 'cox2', label: 'COX-2 / 5-LOX', label_en: 'COX-2 / 5-LOX', tier: 'mechanism' },
      { id: 'inflam', label: 'Inflamação articular', label_en: 'Joint inflammation', tier: 'process' },
      { id: 'cart', label: 'Degradação de cartilagem', label_en: 'Cartilage degradation', tier: 'process' },
      { id: 'mob', label: 'Mobilidade clínica', label_en: 'Clinical mobility', tier: 'outcome' },
    ],
    edges: [
      { from: 'cur', to: 'nfkb', kind: 'inhibits', evidence: 0.85 },
      { from: 'omega3', to: 'cox2', kind: 'inhibits', evidence: 0.78 },
      { from: 'bosw', to: 'cox2', kind: 'inhibits', evidence: 0.62 },
      { from: 'nfkb', to: 'inflam', kind: 'activates', evidence: 0.9 },
      { from: 'cox2', to: 'inflam', kind: 'activates', evidence: 0.85 },
      { from: 'inflam', to: 'cart', kind: 'activates', evidence: 0.7 },
      { from: 'cart', to: 'mob', kind: 'inhibits', evidence: 0.8 },
    ],
  },
  {
    conditionId: 'ckd',
    nodes: [
      { id: 'same', label: 'SAMe', label_en: 'SAMe', tier: 'compound' },
      { id: 'omega3', label: 'Ômega-3', label_en: 'Omega-3', tier: 'compound' },
      { id: 'coq10', label: 'CoQ10', label_en: 'CoQ10', tier: 'compound' },
      { id: 'oxstr', label: 'Estresse oxidativo', label_en: 'Oxidative stress', tier: 'mechanism' },
      { id: 'tgfb', label: 'TGF-β / fibrose', label_en: 'TGF-β / fibrosis', tier: 'mechanism' },
      { id: 'glom', label: 'Lesão glomerular', label_en: 'Glomerular injury', tier: 'process' },
      { id: 'gfr', label: 'Taxa de filtração (TFG)', label_en: 'Glomerular filtration', tier: 'outcome' },
    ],
    edges: [
      { from: 'same', to: 'oxstr', kind: 'inhibits', evidence: 0.72 },
      { from: 'coq10', to: 'oxstr', kind: 'inhibits', evidence: 0.8 },
      { from: 'omega3', to: 'tgfb', kind: 'modulates', evidence: 0.65 },
      { from: 'oxstr', to: 'glom', kind: 'activates', evidence: 0.78 },
      { from: 'tgfb', to: 'glom', kind: 'activates', evidence: 0.82 },
      { from: 'glom', to: 'gfr', kind: 'inhibits', evidence: 0.85 },
    ],
  },
  {
    conditionId: 'cds',
    nodes: [
      { id: 'resv', label: 'Resveratrol', label_en: 'Resveratrol', tier: 'compound' },
      { id: 'nmn', label: 'NMN', label_en: 'NMN', tier: 'compound' },
      { id: 'ps', label: 'Fosfatidilserina', label_en: 'Phosphatidylserine', tier: 'compound' },
      { id: 'sirt', label: 'SIRT1', label_en: 'SIRT1', tier: 'mechanism' },
      { id: 'nad', label: 'NAD+ pool', label_en: 'NAD+ pool', tier: 'mechanism' },
      { id: 'mito', label: 'Função mitocondrial', label_en: 'Mitochondrial function', tier: 'process' },
      { id: 'synap', label: 'Plasticidade sináptica', label_en: 'Synaptic plasticity', tier: 'process' },
      { id: 'cog', label: 'Cognição clínica', label_en: 'Clinical cognition', tier: 'outcome' },
    ],
    edges: [
      { from: 'resv', to: 'sirt', kind: 'activates', evidence: 0.8 },
      { from: 'nmn', to: 'nad', kind: 'activates', evidence: 0.9 },
      { from: 'ps', to: 'synap', kind: 'modulates', evidence: 0.7 },
      { from: 'sirt', to: 'mito', kind: 'activates', evidence: 0.75 },
      { from: 'nad', to: 'mito', kind: 'activates', evidence: 0.85 },
      { from: 'mito', to: 'synap', kind: 'activates', evidence: 0.7 },
      { from: 'synap', to: 'cog', kind: 'activates', evidence: 0.82 },
    ],
  },
  {
    conditionId: 'hepato',
    nodes: [
      { id: 'same', label: 'SAMe', label_en: 'SAMe', tier: 'compound' },
      { id: 'sili', label: 'Silimarina', label_en: 'Silymarin', tier: 'compound' },
      { id: 'vite', label: 'Vitamina E', label_en: 'Vitamin E', tier: 'compound' },
      { id: 'gsh', label: 'Glutationa (GSH)', label_en: 'Glutathione (GSH)', tier: 'mechanism' },
      { id: 'lpx', label: 'Peroxidação lipídica', label_en: 'Lipid peroxidation', tier: 'mechanism' },
      { id: 'hepatoc', label: 'Lesão hepatocítica', label_en: 'Hepatocyte injury', tier: 'process' },
      { id: 'alt', label: 'ALT / GGT séricos', label_en: 'Serum ALT / GGT', tier: 'outcome' },
    ],
    edges: [
      { from: 'same', to: 'gsh', kind: 'activates', evidence: 0.88 },
      { from: 'sili', to: 'lpx', kind: 'inhibits', evidence: 0.78 },
      { from: 'vite', to: 'lpx', kind: 'inhibits', evidence: 0.72 },
      { from: 'gsh', to: 'hepatoc', kind: 'inhibits', evidence: 0.82 },
      { from: 'lpx', to: 'hepatoc', kind: 'activates', evidence: 0.8 },
      { from: 'hepatoc', to: 'alt', kind: 'activates', evidence: 0.85 },
    ],
  },
  {
    conditionId: 'cardio',
    nodes: [
      { id: 'coq10', label: 'CoQ10', label_en: 'CoQ10', tier: 'compound' },
      { id: 'taur', label: 'Taurina', label_en: 'Taurine', tier: 'compound' },
      { id: 'carn', label: 'L-Carnitina', label_en: 'L-Carnitine', tier: 'compound' },
      { id: 'atp', label: 'Produção de ATP', label_en: 'ATP production', tier: 'mechanism' },
      { id: 'ca', label: 'Homeostase de Ca²⁺', label_en: 'Ca²⁺ homeostasis', tier: 'mechanism' },
      { id: 'contract', label: 'Contratilidade miocárdica', label_en: 'Myocardial contractility', tier: 'process' },
      { id: 'ef', label: 'Fração de ejeção', label_en: 'Ejection fraction', tier: 'outcome' },
    ],
    edges: [
      { from: 'coq10', to: 'atp', kind: 'activates', evidence: 0.85 },
      { from: 'carn', to: 'atp', kind: 'activates', evidence: 0.78 },
      { from: 'taur', to: 'ca', kind: 'modulates', evidence: 0.75 },
      { from: 'atp', to: 'contract', kind: 'activates', evidence: 0.82 },
      { from: 'ca', to: 'contract', kind: 'activates', evidence: 0.8 },
      { from: 'contract', to: 'ef', kind: 'activates', evidence: 0.85 },
    ],
  },
  {
    conditionId: 'obesity',
    nodes: [
      { id: 'berb', label: 'Berberina', label_en: 'Berberine', tier: 'compound' },
      { id: 'carn', label: 'L-Carnitina', label_en: 'L-Carnitine', tier: 'compound' },
      { id: 'omega3', label: 'Ômega-3', label_en: 'Omega-3', tier: 'compound' },
      { id: 'ampk', label: 'AMPK', label_en: 'AMPK', tier: 'mechanism' },
      { id: 'lipo', label: 'β-oxidação lipídica', label_en: 'Lipid β-oxidation', tier: 'process' },
      { id: 'adipo', label: 'Inflamação do adipócito', label_en: 'Adipocyte inflammation', tier: 'process' },
      { id: 'ecc', label: 'Escore de condição corporal', label_en: 'Body condition score', tier: 'outcome' },
    ],
    edges: [
      { from: 'berb', to: 'ampk', kind: 'activates', evidence: 0.82 },
      { from: 'carn', to: 'lipo', kind: 'activates', evidence: 0.78 },
      { from: 'omega3', to: 'adipo', kind: 'inhibits', evidence: 0.7 },
      { from: 'ampk', to: 'lipo', kind: 'activates', evidence: 0.85 },
      { from: 'lipo', to: 'ecc', kind: 'inhibits', evidence: 0.8 },
      { from: 'adipo', to: 'ecc', kind: 'activates', evidence: 0.65 },
    ],
  },
  {
    conditionId: 'ibd',
    nodes: [
      { id: 'prob', label: 'Probióticos', label_en: 'Probiotics', tier: 'compound' },
      { id: 'glut', label: 'Glutamina', label_en: 'Glutamine', tier: 'compound' },
      { id: 'cur', label: 'Curcumina', label_en: 'Curcumin', tier: 'compound' },
      { id: 'tj', label: 'Tight junctions', label_en: 'Tight junctions', tier: 'mechanism' },
      { id: 'nfkb', label: 'NF-κB', label_en: 'NF-κB', tier: 'mechanism' },
      { id: 'perm', label: 'Permeabilidade intestinal', label_en: 'Gut permeability', tier: 'process' },
      { id: 'clin', label: 'Sinais clínicos GI', label_en: 'GI clinical signs', tier: 'outcome' },
    ],
    edges: [
      { from: 'prob', to: 'tj', kind: 'activates', evidence: 0.78 },
      { from: 'glut', to: 'tj', kind: 'activates', evidence: 0.82 },
      { from: 'cur', to: 'nfkb', kind: 'inhibits', evidence: 0.8 },
      { from: 'tj', to: 'perm', kind: 'inhibits', evidence: 0.85 },
      { from: 'nfkb', to: 'perm', kind: 'activates', evidence: 0.7 },
      { from: 'perm', to: 'clin', kind: 'activates', evidence: 0.82 },
    ],
  },
  {
    conditionId: 'sarcopenia',
    nodes: [
      { id: 'hmb', label: 'HMB', label_en: 'HMB', tier: 'compound' },
      { id: 'creat', label: 'Creatina', label_en: 'Creatine', tier: 'compound' },
      { id: 'vitd', label: 'Vitamina D', label_en: 'Vitamin D', tier: 'compound' },
      { id: 'mtor', label: 'mTOR', label_en: 'mTOR', tier: 'mechanism' },
      { id: 'proteo', label: 'Proteólise muscular', label_en: 'Muscle proteolysis', tier: 'mechanism' },
      { id: 'fiber', label: 'Síntese de fibra muscular', label_en: 'Muscle fiber synthesis', tier: 'process' },
      { id: 'mass', label: 'Massa magra', label_en: 'Lean mass', tier: 'outcome' },
    ],
    edges: [
      { from: 'hmb', to: 'proteo', kind: 'inhibits', evidence: 0.8 },
      { from: 'creat', to: 'mtor', kind: 'activates', evidence: 0.75 },
      { from: 'vitd', to: 'mtor', kind: 'modulates', evidence: 0.65 },
      { from: 'mtor', to: 'fiber', kind: 'activates', evidence: 0.85 },
      { from: 'fiber', to: 'mass', kind: 'activates', evidence: 0.82 },
      { from: 'proteo', to: 'mass', kind: 'inhibits', evidence: 0.78 },
    ],
  },
];

export function getPathway(conditionId: string): BiologicalPathway | null {
  return BIOLOGICAL_PATHWAYS.find((p) => p.conditionId === conditionId) ?? null;
}