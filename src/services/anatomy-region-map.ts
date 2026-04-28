/**
 * Canonical mapping of clinical conditions to anatomical regions on the
 * lateral dog SVG. Used by DogAnatomySVG to highlight the right organs/joints
 * with severity colors and protective halos.
 *
 * Region IDs MUST match `<g id="...">` in DogAnatomySVG.tsx.
 */

export type AnatomyRegionId =
  | 'brain' | 'eyes' | 'ears' | 'mouth' | 'throat'
  | 'spine-cervical' | 'spine-thoracic' | 'spine-lumbar'
  | 'heart' | 'lungs' | 'liver' | 'stomach' | 'pancreas'
  | 'kidneys' | 'adrenal' | 'intestines' | 'bladder' | 'reproductive'
  | 'shoulder' | 'elbow' | 'wrist-front' | 'paw-front'
  | 'hips' | 'knee' | 'hock' | 'paw-hind'
  | 'skin' | 'coat' | 'systemic';

export interface RegionMapping {
  regions: AnatomyRegionId[];
  /** When true, also tints the whole body softly (cancer, inflammation) */
  systemic?: boolean;
}

/**
 * Match by lowercased substring. First match wins.
 * Bilingual aware (PT/EN keywords).
 */
const RAW_MAP: Array<{ keys: string[]; mapping: RegionMapping }> = [
  // === Joints / orthopedic ===
  { keys: ['osteoarthritis', 'osteoartrite', 'arthritis', 'artrite'],
    mapping: { regions: ['knee', 'elbow', 'hips'] } },
  { keys: ['hip dysplasia', 'displasia coxofemoral', 'displasia de quadril'],
    mapping: { regions: ['hips'] } },
  { keys: ['elbow dysplasia', 'displasia de cotovelo'],
    mapping: { regions: ['elbow'] } },
  { keys: ['cruciate', 'cruzado'],
    mapping: { regions: ['knee'] } },
  { keys: ['patellar luxation', 'luxação de patela', 'luxacao de patela'],
    mapping: { regions: ['knee'] } },
  { keys: ['joint mobility', 'mobilidade articular', 'joint problems', 'problemas articulares'],
    mapping: { regions: ['knee', 'elbow', 'hips', 'shoulder'] } },
  { keys: ['bone health', 'saúde óssea', 'saude ossea'],
    mapping: { regions: ['hips', 'spine-lumbar', 'shoulder'] } },

  // === Spine / neuro ===
  { keys: ['intervertebral disc', 'disco intervertebral', 'ivdd'],
    mapping: { regions: ['spine-thoracic', 'spine-lumbar'] } },
  { keys: ['spondylosis', 'espondilose'],
    mapping: { regions: ['spine-lumbar'] } },
  { keys: ['degenerative myelopathy', 'mielopatia'],
    mapping: { regions: ['spine-lumbar', 'paw-hind'] } },

  // === Brain / cognitive ===
  { keys: ['cognitive dysfunction', 'disfunção cognitiva', 'disfuncao cognitiva', 'dementia', 'demência'],
    mapping: { regions: ['brain'] } },
  { keys: ['epilepsy', 'epilepsia', 'seizure'],
    mapping: { regions: ['brain'] } },

  // === Heart / lungs ===
  { keys: ['dilated cardiomyopathy', 'cardiomiopatia dilatada', 'dcm'],
    mapping: { regions: ['heart'] } },
  { keys: ['mitral valve', 'valva mitral', 'valvular'],
    mapping: { regions: ['heart'] } },
  { keys: ['heart disease', 'insuficiência cardíaca', 'cardiac', 'cardiovascular', 'cardíaca', 'cardiaca'],
    mapping: { regions: ['heart'] } },
  { keys: ['brachycephalic', 'braquicefálico', 'braquicefalico'],
    mapping: { regions: ['mouth', 'throat', 'lungs'] } },
  { keys: ['laryngeal paralysis', 'paralisia laríngea'],
    mapping: { regions: ['throat'] } },
  { keys: ['tracheal collapse', 'colapso de traqueia'],
    mapping: { regions: ['throat', 'lungs'] } },

  // === Liver / GI / metabolic ===
  { keys: ['hepatic lipidosis', 'lipidose hepática', 'liver disease', 'doença hepática', 'liver', 'hepatic', 'hepático', 'hepatica'],
    mapping: { regions: ['liver'] } },
  { keys: ['altered lipid metabolism', 'metabolismo lipídico'],
    mapping: { regions: ['liver', 'systemic'], systemic: true } },
  { keys: ['inflammatory bowel disease', 'doença inflamatória intestinal', 'ibd'],
    mapping: { regions: ['intestines'] } },
  { keys: ['pancreatitis', 'pancreatite'],
    mapping: { regions: ['pancreas'] } },
  { keys: ['microbiome dysbiosis', 'disbiose'],
    mapping: { regions: ['intestines'] } },
  { keys: ['digestive health', 'saúde digestiva'],
    mapping: { regions: ['intestines', 'stomach'] } },

  // === Kidney / endocrine ===
  { keys: ['chronic kidney', 'doença renal', 'renal failure', 'kidney', 'renal'],
    mapping: { regions: ['kidneys'] } },
  { keys: ['diabetes'],
    mapping: { regions: ['pancreas'] } },
  { keys: ['hypothyroidism', 'hipotireoidismo'],
    mapping: { regions: ['throat'] } },
  { keys: ["cushing", 'cushing'],
    mapping: { regions: ['adrenal'] } },
  { keys: ['addison'],
    mapping: { regions: ['adrenal'] } },

  // === Skin / coat ===
  { keys: ['atopic dermatitis', 'dermatite atópica', 'dermatite atopica', 'allergies', 'alergias'],
    mapping: { regions: ['skin', 'paw-front', 'paw-hind', 'ears'] } },

  // === Eyes ===
  { keys: ['cataracts', 'catarata'],
    mapping: { regions: ['eyes'] } },
  { keys: ['progressive retinal atrophy', 'atrofia progressiva da retina', 'pra'],
    mapping: { regions: ['eyes'] } },
  { keys: ['ocular health', 'saúde ocular'],
    mapping: { regions: ['eyes'] } },

  // === Immune / systemic / hallmarks of aging ===
  { keys: ['cellular senescence', 'senescência celular', 'senescencia celular'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['oxidative stress', 'estresse oxidativo'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['chronic inflammation', 'inflamação crônica', 'inflammaging'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['mitochondrial dysfunction', 'disfunção mitocondrial'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['genomic instability', 'instabilidade genômica'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['epigenetic alterations', 'alterações epigenéticas'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['telomere', 'telomérico', 'telomerico'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['proteostasis', 'proteostase'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['autophagy', 'autofagia'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['stem cell', 'células-tronco', 'celulas-tronco'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['nutrient sensing', 'sensação de nutrientes'],
    mapping: { regions: ['liver', 'systemic'], systemic: true } },
  { keys: ['intercellular communication', 'comunicação intercelular'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['immune', 'imune', 'imunológico', 'imunologico'],
    mapping: { regions: ['systemic'], systemic: true } },
  { keys: ['cancer', 'câncer', 'cancer canino', 'canine cancer', 'tumor', 'neoplasia'],
    mapping: { regions: ['systemic'], systemic: true } },
];

export function mapConditionToRegions(conditionName: string): RegionMapping {
  const key = conditionName.toLowerCase().trim();
  for (const entry of RAW_MAP) {
    if (entry.keys.some(k => key.includes(k))) {
      return entry.mapping;
    }
  }
  return { regions: ['systemic'], systemic: true };
}

export function regionDisplayKey(region: AnatomyRegionId): string {
  return `petProfile.anatomy.regions.${region}`;
}
