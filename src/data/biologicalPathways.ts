/**
 * Biological Pathways (synthetic mock) — per condition.
 * Bilingual (pt/en). Used by the Clinical Monitoring Observatory.
 *
 * Each pathway is a tiny directed graph:
 *   Compound → Molecular target → Cellular process → Clinical outcome
 *
 * Edge `relation`:
 *   'activate'  →  rendered as solid arrow with ▶
 *   'inhibit'   →  rendered as flat-end "⊣"
 *   'modulate'  →  rendered as dashed arrow with ◇
 */

export type PathwayRelation = 'activate' | 'inhibit' | 'modulate';

export interface PathwayNode {
  id: string;
  label: string;
  label_en: string;
  layer: 'compound' | 'target' | 'process' | 'outcome';
}
export interface PathwayEdge {
  from: string;
  to: string;
  relation: PathwayRelation;
  /** Evidence strength 0..1; scales arrow thickness. */
  weight: number;
}

export interface BiologicalPathway {
  conditionId: string; // matches SYNTHETIC_CONDITIONS.id
  title: string;
  title_en: string;
  summary: string;
  summary_en: string;
  nodes: PathwayNode[];
  edges: PathwayEdge[];
}

export const BIOLOGICAL_PATHWAYS: BiologicalPathway[] = [
  {
    conditionId: 'oa',
    title: 'Osteoartrite — eixo inflamação articular',
    title_en: 'Osteoarthritis — joint inflammation axis',
    summary: 'Compostos anti-inflamatórios modulam NF-κB e COX-2, reduzindo degradação de cartilagem e dor.',
    summary_en: 'Anti-inflammatory compounds modulate NF-κB and COX-2, reducing cartilage degradation and pain.',
    nodes: [
      { id: 'curcumin', label: 'Curcumina', label_en: 'Curcumin', layer: 'compound' },
      { id: 'omega3', label: 'Ômega-3 (EPA/DHA)', label_en: 'Omega-3 (EPA/DHA)', layer: 'compound' },
      { id: 'boswellia', label: 'Boswellia', label_en: 'Boswellia', layer: 'compound' },
      { id: 'nfkb', label: 'NF-κB', label_en: 'NF-κB', layer: 'target' },
      { id: 'cox2', label: 'COX-2', label_en: 'COX-2', layer: 'target' },
      { id: '5lo', label: '5-LOX', label_en: '5-LOX', layer: 'target' },
      { id: 'inflam', label: 'Inflamação sinovial', label_en: 'Synovial inflammation', layer: 'process' },
      { id: 'cartilage', label: 'Degradação de cartilagem', label_en: 'Cartilage degradation', layer: 'process' },
      { id: 'mobility', label: 'Mobilidade articular', label_en: 'Joint mobility', layer: 'outcome' },
      { id: 'pain', label: 'Dor crônica', label_en: 'Chronic pain', layer: 'outcome' },
    ],
    edges: [
      { from: 'curcumin', to: 'nfkb', relation: 'inhibit', weight: 0.85 },
      { from: 'omega3', to: 'cox2', relation: 'inhibit', weight: 0.7 },
      { from: 'boswellia', to: '5lo', relation: 'inhibit', weight: 0.75 },
      { from: 'nfkb', to: 'inflam', relation: 'activate', weight: 0.9 },
      { from: 'cox2', to: 'inflam', relation: 'activate', weight: 0.8 },
      { from: '5lo', to: 'inflam', relation: 'activate', weight: 0.6 },
      { from: 'inflam', to: 'cartilage', relation: 'activate', weight: 0.7 },
      { from: 'cartilage', to: 'mobility', relation: 'inhibit', weight: 0.8 },
      { from: 'inflam', to: 'pain', relation: 'activate', weight: 0.85 },
    ],
  },
  {
    conditionId: 'ckd',
    title: 'DRC — eixo proteção tubular renal',
    title_en: 'CKD — renal tubular protection axis',
    summary: 'SAMe e Ômega-3 modulam estresse oxidativo e TGF-β, retardando fibrose intersticial.',
    summary_en: 'SAMe and Omega-3 modulate oxidative stress and TGF-β, slowing interstitial fibrosis.',
    nodes: [
      { id: 'same', label: 'SAMe', label_en: 'SAMe', layer: 'compound' },
      { id: 'omega3', label: 'Ômega-3', label_en: 'Omega-3', layer: 'compound' },
      { id: 'astax', label: 'Astaxantina', label_en: 'Astaxanthin', layer: 'compound' },
      { id: 'nrf2', label: 'NRF2', label_en: 'NRF2', layer: 'target' },
      { id: 'tgfb', label: 'TGF-β', label_en: 'TGF-β', layer: 'target' },
      { id: 'ros', label: 'Estresse oxidativo', label_en: 'Oxidative stress', layer: 'process' },
      { id: 'fibrosis', label: 'Fibrose tubular', label_en: 'Tubular fibrosis', layer: 'process' },
      { id: 'gfr', label: 'Taxa de filtração glomerular', label_en: 'Glomerular filtration rate', layer: 'outcome' },
    ],
    edges: [
      { from: 'same', to: 'nrf2', relation: 'activate', weight: 0.8 },
      { from: 'astax', to: 'nrf2', relation: 'activate', weight: 0.7 },
      { from: 'omega3', to: 'tgfb', relation: 'inhibit', weight: 0.6 },
      { from: 'nrf2', to: 'ros', relation: 'inhibit', weight: 0.85 },
      { from: 'tgfb', to: 'fibrosis', relation: 'activate', weight: 0.8 },
      { from: 'ros', to: 'fibrosis', relation: 'activate', weight: 0.7 },
      { from: 'fibrosis', to: 'gfr', relation: 'inhibit', weight: 0.9 },
    ],
  },
  {
    conditionId: 'cds',
    title: 'Disfunção cognitiva — eixo neuroplasticidade',
    title_en: 'Cognitive dysfunction — neuroplasticity axis',
    summary: 'NMN e resveratrol ativam SIRT1, modulando inflamação neuronal e função sináptica.',
    summary_en: 'NMN and resveratrol activate SIRT1, modulating neuro-inflammation and synaptic function.',
    nodes: [
      { id: 'nmn', label: 'NMN', label_en: 'NMN', layer: 'compound' },
      { id: 'resv', label: 'Resveratrol', label_en: 'Resveratrol', layer: 'compound' },
      { id: 'mct', label: 'MCT', label_en: 'MCT', layer: 'compound' },
      { id: 'sirt1', label: 'SIRT1', label_en: 'SIRT1', layer: 'target' },
      { id: 'nad', label: 'NAD+', label_en: 'NAD+', layer: 'target' },
      { id: 'bdnf', label: 'BDNF', label_en: 'BDNF', layer: 'target' },
      { id: 'neuroinflam', label: 'Neuroinflamação', label_en: 'Neuroinflammation', layer: 'process' },
      { id: 'synapse', label: 'Plasticidade sináptica', label_en: 'Synaptic plasticity', layer: 'process' },
      { id: 'cognition', label: 'Função cognitiva', label_en: 'Cognitive function', layer: 'outcome' },
    ],
    edges: [
      { from: 'nmn', to: 'nad', relation: 'activate', weight: 0.9 },
      { from: 'nad', to: 'sirt1', relation: 'activate', weight: 0.85 },
      { from: 'resv', to: 'sirt1', relation: 'activate', weight: 0.75 },
      { from: 'sirt1', to: 'neuroinflam', relation: 'inhibit', weight: 0.7 },
      { from: 'mct', to: 'bdnf', relation: 'modulate', weight: 0.55 },
      { from: 'bdnf', to: 'synapse', relation: 'activate', weight: 0.8 },
      { from: 'neuroinflam', to: 'synapse', relation: 'inhibit', weight: 0.6 },
      { from: 'synapse', to: 'cognition', relation: 'activate', weight: 0.85 },
    ],
  },
  {
    conditionId: 'hepato',
    title: 'Hepatopatia — eixo regeneração hepática',
    title_en: 'Hepatopathy — hepatic regeneration axis',
    summary: 'SAMe e silimarina restauram glutationa, protegendo hepatócitos de injúria oxidativa.',
    summary_en: 'SAMe and silymarin restore glutathione, protecting hepatocytes from oxidative injury.',
    nodes: [
      { id: 'same', label: 'SAMe', label_en: 'SAMe', layer: 'compound' },
      { id: 'sily', label: 'Silimarina', label_en: 'Silymarin', layer: 'compound' },
      { id: 'vite', label: 'Vitamina E', label_en: 'Vitamin E', layer: 'compound' },
      { id: 'gsh', label: 'Glutationa (GSH)', label_en: 'Glutathione (GSH)', layer: 'target' },
      { id: 'lipid', label: 'Peroxidação lipídica', label_en: 'Lipid peroxidation', layer: 'process' },
      { id: 'hepato', label: 'Injúria hepatocelular', label_en: 'Hepatocellular injury', layer: 'process' },
      { id: 'alt', label: 'ALT/AST séricos', label_en: 'Serum ALT/AST', layer: 'outcome' },
    ],
    edges: [
      { from: 'same', to: 'gsh', relation: 'activate', weight: 0.9 },
      { from: 'sily', to: 'gsh', relation: 'activate', weight: 0.75 },
      { from: 'vite', to: 'lipid', relation: 'inhibit', weight: 0.7 },
      { from: 'gsh', to: 'lipid', relation: 'inhibit', weight: 0.85 },
      { from: 'lipid', to: 'hepato', relation: 'activate', weight: 0.8 },
      { from: 'hepato', to: 'alt', relation: 'activate', weight: 0.85 },
    ],
  },
  {
    conditionId: 'cardio',
    title: 'Cardiopatia — eixo função mitocondrial',
    title_en: 'Cardiomyopathy — mitochondrial function axis',
    summary: 'CoQ10, taurina e L-carnitina sustentam bioenergética miocárdica e reduzem remodelamento.',
    summary_en: 'CoQ10, taurine and L-carnitine sustain myocardial bioenergetics and reduce remodeling.',
    nodes: [
      { id: 'coq10', label: 'CoQ10', label_en: 'CoQ10', layer: 'compound' },
      { id: 'tau', label: 'Taurina', label_en: 'Taurine', layer: 'compound' },
      { id: 'lcarn', label: 'L-Carnitina', label_en: 'L-Carnitine', layer: 'compound' },
      { id: 'etc', label: 'Cadeia respiratória', label_en: 'Electron transport chain', layer: 'target' },
      { id: 'beta', label: 'β-oxidação', label_en: 'β-oxidation', layer: 'target' },
      { id: 'energy', label: 'Produção de ATP', label_en: 'ATP production', layer: 'process' },
      { id: 'remodel', label: 'Remodelamento ventricular', label_en: 'Ventricular remodeling', layer: 'process' },
      { id: 'ef', label: 'Fração de ejeção', label_en: 'Ejection fraction', layer: 'outcome' },
    ],
    edges: [
      { from: 'coq10', to: 'etc', relation: 'activate', weight: 0.85 },
      { from: 'lcarn', to: 'beta', relation: 'activate', weight: 0.8 },
      { from: 'tau', to: 'remodel', relation: 'inhibit', weight: 0.65 },
      { from: 'etc', to: 'energy', relation: 'activate', weight: 0.9 },
      { from: 'beta', to: 'energy', relation: 'activate', weight: 0.75 },
      { from: 'energy', to: 'ef', relation: 'activate', weight: 0.8 },
      { from: 'remodel', to: 'ef', relation: 'inhibit', weight: 0.75 },
    ],
  },
  {
    conditionId: 'obesity',
    title: 'Obesidade — eixo metabólico',
    title_en: 'Obesity — metabolic axis',
    summary: 'Berberina e L-carnitina ativam AMPK, melhorando sensibilidade insulínica e oxidação lipídica.',
    summary_en: 'Berberine and L-carnitine activate AMPK, improving insulin sensitivity and lipid oxidation.',
    nodes: [
      { id: 'berb', label: 'Berberina', label_en: 'Berberine', layer: 'compound' },
      { id: 'lcarn', label: 'L-Carnitina', label_en: 'L-Carnitine', layer: 'compound' },
      { id: 'omega3', label: 'Ômega-3', label_en: 'Omega-3', layer: 'compound' },
      { id: 'ampk', label: 'AMPK', label_en: 'AMPK', layer: 'target' },
      { id: 'mtor', label: 'mTOR', label_en: 'mTOR', layer: 'target' },
      { id: 'insulin', label: 'Sensibilidade insulínica', label_en: 'Insulin sensitivity', layer: 'process' },
      { id: 'lipox', label: 'Oxidação lipídica', label_en: 'Lipid oxidation', layer: 'process' },
      { id: 'bcs', label: 'ECC / massa gorda', label_en: 'BCS / fat mass', layer: 'outcome' },
    ],
    edges: [
      { from: 'berb', to: 'ampk', relation: 'activate', weight: 0.85 },
      { from: 'lcarn', to: 'lipox', relation: 'activate', weight: 0.7 },
      { from: 'omega3', to: 'insulin', relation: 'activate', weight: 0.6 },
      { from: 'ampk', to: 'mtor', relation: 'inhibit', weight: 0.7 },
      { from: 'ampk', to: 'insulin', relation: 'activate', weight: 0.8 },
      { from: 'mtor', to: 'lipox', relation: 'inhibit', weight: 0.55 },
      { from: 'lipox', to: 'bcs', relation: 'inhibit', weight: 0.85 },
    ],
  },
  {
    conditionId: 'ibd',
    title: 'DII — eixo mucosa intestinal',
    title_en: 'IBD — intestinal mucosa axis',
    summary: 'Probióticos e glutamina restauram barreira intestinal e modulam citocinas pró-inflamatórias.',
    summary_en: 'Probiotics and glutamine restore intestinal barrier and modulate pro-inflammatory cytokines.',
    nodes: [
      { id: 'probio', label: 'Probióticos', label_en: 'Probiotics', layer: 'compound' },
      { id: 'glut', label: 'Glutamina', label_en: 'Glutamine', layer: 'compound' },
      { id: 'curc', label: 'Curcumina', label_en: 'Curcumin', layer: 'compound' },
      { id: 'tj', label: 'Tight junctions', label_en: 'Tight junctions', layer: 'target' },
      { id: 'il6', label: 'IL-6 / TNF-α', label_en: 'IL-6 / TNF-α', layer: 'target' },
      { id: 'barrier', label: 'Permeabilidade intestinal', label_en: 'Intestinal permeability', layer: 'process' },
      { id: 'inflam', label: 'Inflamação mucosa', label_en: 'Mucosal inflammation', layer: 'process' },
      { id: 'stool', label: 'Consistência fecal / apetite', label_en: 'Stool quality / appetite', layer: 'outcome' },
    ],
    edges: [
      { from: 'glut', to: 'tj', relation: 'activate', weight: 0.75 },
      { from: 'probio', to: 'tj', relation: 'activate', weight: 0.65 },
      { from: 'curc', to: 'il6', relation: 'inhibit', weight: 0.7 },
      { from: 'tj', to: 'barrier', relation: 'inhibit', weight: 0.8 },
      { from: 'il6', to: 'inflam', relation: 'activate', weight: 0.85 },
      { from: 'barrier', to: 'inflam', relation: 'activate', weight: 0.7 },
      { from: 'inflam', to: 'stool', relation: 'inhibit', weight: 0.8 },
    ],
  },
  {
    conditionId: 'sarcopenia',
    title: 'Sarcopenia — eixo anabólico muscular',
    title_en: 'Sarcopenia — muscle anabolic axis',
    summary: 'HMB, creatina e proteína ativam mTOR muscular e suportam síntese proteica em pets geriátricos.',
    summary_en: 'HMB, creatine and protein activate muscle mTOR and support protein synthesis in geriatric pets.',
    nodes: [
      { id: 'hmb', label: 'HMB', label_en: 'HMB', layer: 'compound' },
      { id: 'creat', label: 'Creatina', label_en: 'Creatine', layer: 'compound' },
      { id: 'prot', label: 'Proteína', label_en: 'Protein', layer: 'compound' },
      { id: 'vitd', label: 'Vitamina D', label_en: 'Vitamin D', layer: 'compound' },
      { id: 'mtor', label: 'mTOR muscular', label_en: 'Muscle mTOR', layer: 'target' },
      { id: 'pcr', label: 'Fosfocreatina', label_en: 'Phosphocreatine', layer: 'target' },
      { id: 'synth', label: 'Síntese proteica', label_en: 'Protein synthesis', layer: 'process' },
      { id: 'mass', label: 'Massa magra / força', label_en: 'Lean mass / strength', layer: 'outcome' },
    ],
    edges: [
      { from: 'hmb', to: 'mtor', relation: 'activate', weight: 0.8 },
      { from: 'prot', to: 'mtor', relation: 'activate', weight: 0.75 },
      { from: 'creat', to: 'pcr', relation: 'activate', weight: 0.85 },
      { from: 'vitd', to: 'mtor', relation: 'modulate', weight: 0.55 },
      { from: 'mtor', to: 'synth', relation: 'activate', weight: 0.9 },
      { from: 'pcr', to: 'synth', relation: 'modulate', weight: 0.6 },
      { from: 'synth', to: 'mass', relation: 'activate', weight: 0.85 },
    ],
  },
];

export function getPathwayByCondition(conditionId: string): BiologicalPathway | undefined {
  return BIOLOGICAL_PATHWAYS.find((p) => p.conditionId === conditionId);
}