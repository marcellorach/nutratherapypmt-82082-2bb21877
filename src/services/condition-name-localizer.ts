/**
 * Bidirectional condition name localizer.
 * DB stores English canonical names; this provides PT translations for display.
 */

const EN_TO_PT: Record<string, string> = {
  'osteoarthritis': 'Osteoartrite',
  'hip dysplasia': 'Displasia de Quadril',
  'elbow dysplasia': 'Displasia de Cotovelo',
  'degenerative myelopathy': 'Mielopatia Degenerativa',
  'cognitive dysfunction': 'Disfunção Cognitiva',
  'cardiac disease': 'Doença Cardíaca',
  'cardiomyopathy': 'Cardiomiopatia',
  'mitral valve disease': 'Doença da Válvula Mitral',
  'hepatic disease': 'Doença Hepática',
  'renal disease': 'Doença Renal',
  'chronic kidney disease': 'Doença Renal Crônica',
  'diabetes mellitus': 'Diabetes Mellitus',
  'diabetes': 'Diabetes',
  'obesity': 'Obesidade',
  'hypothyroidism': 'Hipotireoidismo',
  'epilepsy': 'Epilepsia',
  'inflammation': 'Inflamação',
  'chronic inflammation': 'Inflamação Crônica',
  'cellular senescence': 'Senescência Celular',
  'cellular aging': 'Envelhecimento Celular',
  'oxidative stress': 'Estresse Oxidativo',
  'mitochondrial dysfunction': 'Disfunção Mitocondrial',
  'inflammaging': 'Inflammaging',
  'intervertebral disc disease': 'Doença do Disco Intervertebral',
  'spondylosis': 'Espondilose',
  'heart disease': 'Doença Cardíaca',
  'antioxidant support': 'Suporte Antioxidante',
  'immune senescence': 'Imunossenescência',
  'arthritis': 'Artrite',
  'cancer': 'Câncer',
  'lymphoma': 'Linfoma',
  'gastric dilatation-volvulus': 'Dilatação-Vólvulo Gástrica',
  'allergies': 'Alergias',
  'atopic dermatitis': 'Dermatite Atópica',
  'pancreatitis': 'Pancreatite',
  'cushing disease': 'Doença de Cushing',
  'addison disease': 'Doença de Addison',
  'bloat': 'Torção Gástrica',
  'cataracts': 'Cataratas',
  'progressive retinal atrophy': 'Atrofia Progressiva da Retina',
  'von willebrand disease': 'Doença de Von Willebrand',
  'degenerative joint disease': 'Doença Articular Degenerativa',
};

/**
 * Returns the localized condition name based on the active locale.
 * If locale is 'pt' and a PT translation exists, returns PT.
 * Otherwise returns the original (English) name.
 */
export function localizeConditionName(name: string, locale: string): string {
  if (!name) return name;
  if (locale.startsWith('en')) return name;
  const key = name.toLowerCase().trim();
  return EN_TO_PT[key] || name;
}