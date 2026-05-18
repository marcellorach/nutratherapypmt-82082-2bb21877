// Canine nutrient requirements (AAFCO 2024 Dog Food Nutrient Profiles, FEDIAF 2024,
// NRC 2006). Static bilingual reference data used by the Nutrition admin tab.
// Values expressed per kg of dry matter unless noted.

export type LifeStage = 'puppy' | 'adult' | 'gestation_lactation' | 'senior';
export type SizeGroup = 'small' | 'medium' | 'large' | 'giant' | 'all';
export type NutrientSource = 'AAFCO' | 'FEDIAF' | 'NRC';

export interface CanineNutrientRequirement {
  nutrient: string;
  nutrient_en: string;
  stage: LifeStage;
  size: SizeGroup;
  min: number | null;
  max: number | null;
  unit: string;
  source: NutrientSource;
  note?: string;
  note_en?: string;
}

export const LIFE_STAGE_LABEL: Record<LifeStage, { pt: string; en: string }> = {
  puppy: { pt: 'Filhote (crescimento)', en: 'Puppy (growth)' },
  adult: { pt: 'Adulto (manutenção)', en: 'Adult (maintenance)' },
  gestation_lactation: { pt: 'Gestação/Lactação', en: 'Gestation/Lactation' },
  senior: { pt: 'Sênior', en: 'Senior' },
};

export const SIZE_LABEL: Record<SizeGroup, { pt: string; en: string }> = {
  small: { pt: 'Pequeno (<10 kg)', en: 'Small (<10 kg)' },
  medium: { pt: 'Médio (10–25 kg)', en: 'Medium (10–25 kg)' },
  large: { pt: 'Grande (25–45 kg)', en: 'Large (25–45 kg)' },
  giant: { pt: 'Gigante (>45 kg)', en: 'Giant (>45 kg)' },
  all: { pt: 'Todos os portes', en: 'All sizes' },
};

// Base AAFCO/FEDIAF minimums (apply to "all" sizes unless overridden).
const base = (
  stage: LifeStage,
  rows: Array<Omit<CanineNutrientRequirement, 'stage' | 'size'>>,
  size: SizeGroup = 'all',
): CanineNutrientRequirement[] => rows.map((r) => ({ ...r, stage, size }));

export const CANINE_NUTRIENT_REQUIREMENTS: CanineNutrientRequirement[] = [
  // --- ADULT MAINTENANCE (AAFCO 2024) ---
  ...base('adult', [
    { nutrient: 'Proteína bruta', nutrient_en: 'Crude protein', min: 18, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Gordura bruta', nutrient_en: 'Crude fat', min: 5.5, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Ácido linoleico (n-6)', nutrient_en: 'Linoleic acid (n-6)', min: 1.1, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Cálcio', nutrient_en: 'Calcium', min: 0.5, max: 2.5, unit: '%', source: 'AAFCO' },
    { nutrient: 'Fósforo', nutrient_en: 'Phosphorus', min: 0.4, max: 1.6, unit: '%', source: 'AAFCO' },
    { nutrient: 'Razão Ca:P', nutrient_en: 'Ca:P ratio', min: 1, max: 2, unit: ':1', source: 'AAFCO' },
    { nutrient: 'Potássio', nutrient_en: 'Potassium', min: 0.6, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Sódio', nutrient_en: 'Sodium', min: 0.08, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Magnésio', nutrient_en: 'Magnesium', min: 0.06, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Lisina', nutrient_en: 'Lysine', min: 0.63, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Metionina + cistina', nutrient_en: 'Methionine + cystine', min: 0.65, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Vitamina A', nutrient_en: 'Vitamin A', min: 5000, max: 250000, unit: 'UI/kg', source: 'AAFCO' },
    { nutrient: 'Vitamina D3', nutrient_en: 'Vitamin D3', min: 500, max: 3000, unit: 'UI/kg', source: 'AAFCO' },
    { nutrient: 'Vitamina E', nutrient_en: 'Vitamin E', min: 50, max: null, unit: 'UI/kg', source: 'AAFCO' },
    { nutrient: 'EPA + DHA', nutrient_en: 'EPA + DHA', min: null, max: null, unit: '%', source: 'NRC', note: 'Recomendado 0,05–0,1% para suporte cognitivo/articular', note_en: 'Recommended 0.05–0.1% for cognitive/joint support' },
  ]),

  // --- PUPPY GROWTH (AAFCO 2024) ---
  ...base('puppy', [
    { nutrient: 'Proteína bruta', nutrient_en: 'Crude protein', min: 22.5, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Gordura bruta', nutrient_en: 'Crude fat', min: 8.5, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Ácido linoleico (n-6)', nutrient_en: 'Linoleic acid (n-6)', min: 1.3, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'DHA + EPA', nutrient_en: 'DHA + EPA', min: 0.05, max: null, unit: '%', source: 'AAFCO', note: 'Essencial para desenvolvimento neurológico', note_en: 'Essential for neurodevelopment' },
    { nutrient: 'Cálcio', nutrient_en: 'Calcium', min: 1.0, max: 1.8, unit: '%', source: 'AAFCO' },
    { nutrient: 'Fósforo', nutrient_en: 'Phosphorus', min: 0.8, max: 1.6, unit: '%', source: 'AAFCO' },
    { nutrient: 'Razão Ca:P', nutrient_en: 'Ca:P ratio', min: 1, max: 1.8, unit: ':1', source: 'AAFCO' },
    { nutrient: 'Lisina', nutrient_en: 'Lysine', min: 0.9, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Metionina + cistina', nutrient_en: 'Methionine + cystine', min: 0.7, max: null, unit: '%', source: 'AAFCO' },
  ]),
  // Puppy LARGE/GIANT overrides — calcium cap is stricter to prevent OCD/HD.
  ...base('puppy', [
    { nutrient: 'Cálcio (raças grandes)', nutrient_en: 'Calcium (large breed)', min: 1.0, max: 1.6, unit: '%', source: 'FEDIAF', note: 'Limite estrito para prevenir DOD/displasia', note_en: 'Strict cap to prevent DOD/dysplasia' },
    { nutrient: 'Razão Ca:P (raças grandes)', nutrient_en: 'Ca:P ratio (large breed)', min: 1, max: 1.5, unit: ':1', source: 'FEDIAF' },
    { nutrient: 'Energia metabolizável', nutrient_en: 'Metabolizable energy', min: 3500, max: 4000, unit: 'kcal/kg', source: 'FEDIAF', note: 'Densidade calórica moderada para crescimento controlado', note_en: 'Moderate density for controlled growth' },
  ], 'large'),
  ...base('puppy', [
    { nutrient: 'Cálcio (raças gigantes)', nutrient_en: 'Calcium (giant breed)', min: 1.0, max: 1.5, unit: '%', source: 'FEDIAF' },
    { nutrient: 'Energia metabolizável', nutrient_en: 'Metabolizable energy', min: 3400, max: 3900, unit: 'kcal/kg', source: 'FEDIAF' },
  ], 'giant'),

  // --- GESTATION / LACTATION (AAFCO 2024) ---
  ...base('gestation_lactation', [
    { nutrient: 'Proteína bruta', nutrient_en: 'Crude protein', min: 22.5, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Gordura bruta', nutrient_en: 'Crude fat', min: 8.5, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Cálcio', nutrient_en: 'Calcium', min: 1.0, max: 1.7, unit: '%', source: 'AAFCO' },
    { nutrient: 'Fósforo', nutrient_en: 'Phosphorus', min: 0.8, max: 1.6, unit: '%', source: 'AAFCO' },
    { nutrient: 'DHA + EPA', nutrient_en: 'DHA + EPA', min: 0.05, max: null, unit: '%', source: 'AAFCO' },
    { nutrient: 'Energia metabolizável', nutrient_en: 'Metabolizable energy', min: 4000, max: null, unit: 'kcal/kg', source: 'NRC', note: 'Demanda calórica até 3x o basal na lactação', note_en: 'Up to 3× basal energy needs during lactation' },
  ]),

  // --- SENIOR (>7 anos pequenos/médios, >5 grandes/gigantes) ---
  // AAFCO não define perfil "senior" separado — usamos referências NRC/FEDIAF.
  ...base('senior', [
    { nutrient: 'Proteína bruta', nutrient_en: 'Crude protein', min: 25, max: null, unit: '%', source: 'NRC', note: 'Proteína alta preserva massa magra; ↑ vs. adulto', note_en: 'Higher protein preserves lean mass vs. adult' },
    { nutrient: 'Gordura bruta', nutrient_en: 'Crude fat', min: 8, max: 15, unit: '%', source: 'NRC' },
    { nutrient: 'Fósforo', nutrient_en: 'Phosphorus', min: 0.4, max: 0.8, unit: '%', source: 'NRC', note: 'Restringir P em risco renal', note_en: 'Restrict P with renal risk' },
    { nutrient: 'Sódio', nutrient_en: 'Sodium', min: 0.08, max: 0.3, unit: '%', source: 'NRC' },
    { nutrient: 'EPA + DHA', nutrient_en: 'EPA + DHA', min: 0.1, max: null, unit: '%', source: 'NRC', note: 'Suporte cognitivo e articular', note_en: 'Cognitive and joint support' },
    { nutrient: 'Antioxidantes (Vit E)', nutrient_en: 'Antioxidants (Vit E)', min: 100, max: null, unit: 'UI/kg', source: 'NRC' },
    { nutrient: 'L-Carnitina', nutrient_en: 'L-Carnitine', min: 300, max: null, unit: 'mg/kg', source: 'NRC', note: 'Auxilia oxidação de gordura e preservação de massa magra', note_en: 'Supports fat oxidation and lean mass' },
  ]),
];

// ---- Other nutritional considerations (static cards) ----

export interface NutritionTopic {
  id: string;
  title: string;
  title_en: string;
  body: string;
  body_en: string;
}

export const NUTRITION_TOPICS: NutritionTopic[] = [
  {
    id: 'hydration',
    title: 'Hidratação diária',
    title_en: 'Daily hydration',
    body: 'Cães requerem ~50–60 mL/kg/dia de água. Filhotes, lactantes e cães com doença renal podem precisar de 80–100 mL/kg. Ração seca cobre <10% da demanda; sempre disponibilizar água fresca.',
    body_en: 'Dogs need ~50–60 mL/kg/day of water. Puppies, lactating dams and renal patients may need 80–100 mL/kg. Dry kibble covers <10% of needs; fresh water must be available at all times.',
  },
  {
    id: 'meal_frequency',
    title: 'Frequência de refeições',
    title_en: 'Meal frequency',
    body: 'Filhotes <4 meses: 4 refeições/dia. 4–6 meses: 3 refeições. >6 meses e adultos: 2 refeições. Raças grandes/gigantes: nunca uma única refeição (risco de torção gástrica).',
    body_en: 'Puppies <4 mo: 4 meals/day. 4–6 mo: 3 meals. >6 mo and adults: 2 meals. Large/giant breeds: never one single meal (gastric torsion risk).',
  },
  {
    id: 'renal_restriction',
    title: 'Restrição em doença renal',
    title_en: 'Renal disease restriction',
    body: 'Fósforo <0,5% MS, proteína moderada de alto valor biológico (14–18%), sódio <0,3%, suplementação de EPA/DHA (≥0,4%) e antioxidantes. Evitar dietas ricas em P inorgânico.',
    body_en: 'Phosphorus <0.5% DM, moderate high-quality protein (14–18%), sodium <0.3%, EPA/DHA supplementation (≥0.4%) and antioxidants. Avoid diets high in inorganic P.',
  },
  {
    id: 'hepatic_support',
    title: 'Suporte hepático',
    title_en: 'Hepatic support',
    body: 'Proteína moderada de alta digestibilidade, restrição de cobre (<5 mg/kg) em raças predispostas (Bedlington, Labrador, Doberman), zinco suplementar, colina, SAMe e silimarina.',
    body_en: 'Moderate highly digestible protein, copper restriction (<5 mg/kg) in predisposed breeds (Bedlington, Labrador, Doberman), supplemental zinc, choline, SAMe and silymarin.',
  },
  {
    id: 'taurine_dcm',
    title: 'Taurina e DCM',
    title_en: 'Taurine and DCM',
    body: 'Raças predispostas a cardiomiopatia dilatada (Cocker, Golden, Doberman, Boxer) e cães em dietas grain-free com leguminosas devem receber ≥1000 mg/kg de taurina + L-carnitina.',
    body_en: 'Breeds predisposed to dilated cardiomyopathy (Cocker, Golden, Doberman, Boxer) and dogs on grain-free legume-based diets should receive ≥1000 mg/kg taurine + L-carnitine.',
  },
  {
    id: 'omega_ratio',
    title: 'Razão Ômega-6 : Ômega-3',
    title_en: 'Omega-6 : Omega-3 ratio',
    body: 'Alvo terapêutico 5:1 ou menor. Dietas comerciais típicas atingem 10–15:1, favorecendo inflamação. EPA+DHA (óleo de peixe) é a fonte mais eficaz; ALA (linhaça) tem conversão limitada em cães.',
    body_en: 'Therapeutic target ≤5:1. Typical commercial diets sit at 10–15:1, favoring inflammation. EPA+DHA (fish oil) is the most effective source; ALA (flax) has limited conversion in dogs.',
  },
  {
    id: 'deficiency_signs',
    title: 'Sinais clínicos de deficiências comuns',
    title_en: 'Clinical signs of common deficiencies',
    body: 'Zinco: dermatite nasal/digital, pelagem opaca. Vit E/selênio: miopatia, esteatite. Cobre: despigmentação, anemia. Taurina: DCM, déficit visual. Biotina/B-complexo: queda de pelo, dermatite seborreica.',
    body_en: 'Zinc: nasal/digital dermatitis, dull coat. Vit E/selenium: myopathy, steatitis. Copper: depigmentation, anemia. Taurine: DCM, visual deficit. Biotin/B-complex: hair loss, seborrheic dermatitis.',
  },
];