import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// BIOMEDICAL TAXONOMY - Based on UMLS, Gene Ontology, and veterinary standards
// =============================================================================

// Layer 0: Compounds (Nutraceuticals, Drugs, Chemical Compounds)
const KNOWN_NUTRACEUTICALS = new Set([
  // Polyphenols & Flavonoids
  'curcumin', 'curcumina', 'quercetin', 'quercetina', 'resveratrol', 'egcg', 'epigallocatechin',
  'anthocyanins', 'antocianinas', 'catechins', 'catequinas', 'kaempferol', 'apigenin',
  'luteolin', 'naringenin', 'hesperidin', 'rutin', 'myricetin', 'fisetin',
  // Omega Fatty Acids
  'omega-3', 'omega-6', 'dha', 'epa', 'ala', 'fish oil', 'óleo de peixe', 'krill oil',
  'flaxseed oil', 'óleo de linhaça', 'gamma-linolenic acid', 'gla',
  // Amino Acids & Derivatives
  'glucosamine', 'glicosamina', 'chondroitin', 'condroitina', 'msm', 'methylsulfonylmethane',
  'l-carnitine', 'carnitina', 'taurine', 'taurina', 'glutamine', 'glutamina',
  'arginine', 'arginina', 'lysine', 'lisina', 'methionine', 'metionina',
  'sam-e', 's-adenosylmethionine', 'n-acetyl cysteine', 'nac', 'glycine', 'glicina',
  // Vitamins
  'vitamin a', 'vitamina a', 'vitamin c', 'vitamina c', 'vitamin d', 'vitamina d',
  'vitamin d3', 'vitamina d3', 'vitamin e', 'vitamina e', 'vitamin k', 'vitamina k',
  'vitamin k2', 'vitamina k2', 'vitamin b12', 'vitamina b12', 'folate', 'folato',
  'biotin', 'biotina', 'niacin', 'niacina', 'riboflavin', 'riboflavina',
  'thiamine', 'tiamina', 'pantothenic acid', 'ácido pantotênico', 'pyridoxine',
  // Minerals
  'zinc', 'zinco', 'selenium', 'selênio', 'magnesium', 'magnésio', 'iron', 'ferro',
  'copper', 'cobre', 'manganese', 'manganês', 'chromium', 'cromo', 'iodine', 'iodo',
  'calcium', 'cálcio', 'phosphorus', 'fósforo', 'potassium', 'potássio',
  // Probiotics & Prebiotics
  'lactobacillus', 'bifidobacterium', 'probiotics', 'probióticos', 'prebiotics', 'prebióticos',
  'inulin', 'inulina', 'fos', 'fructooligosaccharides', 'gos', 'galactooligosaccharides',
  'saccharomyces boulardii', 'enterococcus faecium',
  // Herbal Extracts
  'milk thistle', 'silymarin', 'silimarina', 'ginkgo biloba', 'ashwagandha', 'boswellia',
  'green tea extract', 'extrato de chá verde', 'ginger', 'gengibre', 'turmeric', 'cúrcuma',
  'echinacea', 'valerian', 'valeriana', 'chamomile', 'camomila', 'passionflower',
  'licorice root', 'astragalus', 'rhodiola', 'ginseng', 'cordyceps', 'reishi',
  'lion\'s mane', 'chaga', 'turkey tail',
  // Longevity compounds
  'nmn', 'nicotinamide mononucleotide', 'nad+', 'nicotinamide adenine dinucleotide',
  'nr', 'nicotinamide riboside', 'pterostilbene', 'spermidine', 'fisetin',
  'urolithin a', 'alpha-ketoglutarate', 'akg', 'metformin',
  // Other bioactives
  'coenzyme q10', 'coq10', 'ubiquinol', 'ubiquinona', 'alpha lipoic acid', 'ala',
  'ácido alfa lipóico', 'melatonin', 'melatonina', 'collagen', 'colágeno',
  'hyaluronic acid', 'ácido hialurônico', 'glucomannan', 'psyllium',
  'berberine', 'berberina', 'spirulina', 'chlorella', 'astaxanthin', 'astaxantina',
  'lutein', 'luteína', 'zeaxanthin', 'zeaxantina', 'lycopene', 'licopeno',
  'beta-carotene', 'betacaroteno', 'pqq', 'pyrroloquinoline quinone',
]);

// Layer 1: Molecular Targets (Enzymes, Receptors, Proteins, Pathways)
const KNOWN_ENZYMES = new Set([
  // Oxidoreductases
  'catalase', 'superoxide dismutase', 'sod', 'sod1', 'sod2', 'glutathione peroxidase', 'gpx',
  'cytochrome p450', 'cyp450', 'cyp3a4', 'cyp2d6', 'nadph oxidase', 'nox', 'xanthine oxidase',
  'monoamine oxidase', 'mao', 'mao-a', 'mao-b', 'lipoxygenase', 'lox', '5-lox', '12-lox',
  'cyclooxygenase', 'cox', 'cox-1', 'cox-2', 'prostaglandin synthase',
  // Transferases
  'glutathione s-transferase', 'gst', 'acetyltransferase', 'methyltransferase',
  'kinase', 'phosphatase', 'transaminase', 'alt', 'ast',
  // Hydrolases
  'phospholipase', 'pla2', 'lipase', 'protease', 'peptidase', 'amylase',
  'hyaluronidase', 'collagenase', 'elastase', 'mmp', 'matrix metalloproteinase',
  'mmp-2', 'mmp-9', 'mmp-13', 'adam', 'caspase', 'caspase-1', 'caspase-3', 'caspase-9',
  // Lyases
  'adenylyl cyclase', 'guanylyl cyclase', 'carbonic anhydrase',
  // Isomerases
  'topoisomerase', 'isomerase',
  // Ligases
  'synthetase', 'ligase', 'carboxylase',
  // Sirtuins & NAD-related
  'sirtuin', 'sirt1', 'sirt2', 'sirt3', 'sirt4', 'sirt5', 'sirt6', 'sirt7',
  'nampt', 'nmnat', 'parp', 'poly(adp-ribose) polymerase',
  // Other important enzymes
  'telomerase', 'dna polymerase', 'rna polymerase', 'reverse transcriptase',
  'acetylcholinesterase', 'ache', 'butyrylcholinesterase', 'bche',
  'hmg-coa reductase', 'aromatase', 'phosphodiesterase', 'pde', 'pde4', 'pde5',
]);

const KNOWN_RECEPTORS = new Set([
  // Nuclear receptors
  'ppar', 'ppar-α', 'ppar-γ', 'ppar-delta', 'peroxisome proliferator-activated receptor',
  'lxr', 'liver x receptor', 'fxr', 'farnesoid x receptor', 'rxr', 'retinoid x receptor',
  'rar', 'retinoic acid receptor', 'vdr', 'vitamin d receptor', 'tr', 'thyroid receptor',
  'er', 'estrogen receptor', 'ar', 'androgen receptor', 'gr', 'glucocorticoid receptor',
  'mr', 'mineralocorticoid receptor', 'pr', 'progesterone receptor',
  // GPCRs
  'gpcr', 'g protein-coupled receptor', 'adrenergic receptor', 'α-adrenergic', 'β-adrenergic',
  'dopamine receptor', 'd1', 'd2', 'd3', 'd4', 'd5', 'serotonin receptor', '5-ht',
  '5-ht1a', '5-ht2a', '5-ht3', 'histamine receptor', 'h1', 'h2', 'h3', 'h4',
  'muscarinic receptor', 'm1', 'm2', 'm3', 'nicotinic receptor', 'nachr',
  'opioid receptor', 'μ-opioid', 'κ-opioid', 'δ-opioid', 'cannabinoid receptor', 'cb1', 'cb2',
  'prostaglandin receptor', 'ep1', 'ep2', 'ep3', 'ep4', 'leukotriene receptor',
  // Ion channels
  'trp channel', 'trpv1', 'trpv4', 'trpm8', 'calcium channel', 'sodium channel',
  'potassium channel', 'chloride channel', 'gabaa receptor', 'gaba receptor',
  'nmda receptor', 'ampa receptor', 'kainate receptor', 'glycine receptor',
  // Tyrosine kinase receptors
  'egfr', 'epidermal growth factor receptor', 'vegfr', 'igfr', 'insulin receptor',
  'pdgfr', 'fgfr', 'ngf receptor', 'trka', 'trkb', 'bdnf receptor',
  // Pattern recognition receptors
  'toll-like receptor', 'tlr', 'tlr2', 'tlr4', 'tlr7', 'tlr9', 'nod', 'nlrp3',
  'rig-i', 'mda5', 'sting',
]);

const KNOWN_PROTEINS = new Set([
  // Transcription factors
  'nf-κb', 'nf-kappa-b', 'nfkb', 'nuclear factor kappa b', 'ap-1', 'activator protein 1',
  'nrf2', 'nuclear factor erythroid 2', 'hif-1α', 'hypoxia-inducible factor',
  'stat', 'stat1', 'stat3', 'stat5', 'creb', 'foxo', 'foxo1', 'foxo3',
  'p53', 'tp53', 'p21', 'p16', 'rb', 'retinoblastoma protein', 'e2f',
  'myc', 'c-myc', 'jun', 'c-jun', 'fos', 'c-fos', 'atf', 'sp1',
  'pparγ coactivator', 'pgc-1α', 'pgc-1beta', 'ampk', 'mtor', 'akt', 'pkb',
  // Cytokines & Growth Factors
  'tnf-α', 'tnf-alpha', 'tumor necrosis factor', 'il-1', 'il-1β', 'interleukin-1',
  'il-2', 'interleukin-2', 'il-4', 'il-6', 'interleukin-6', 'il-8', 'il-10', 'il-12',
  'il-17', 'il-18', 'il-23', 'ifn-γ', 'interferon-gamma', 'ifn-α', 'ifn-β',
  'tgf-β', 'transforming growth factor', 'egf', 'epidermal growth factor',
  'vegf', 'vascular endothelial growth factor', 'fgf', 'fibroblast growth factor',
  'ngf', 'nerve growth factor', 'bdnf', 'brain-derived neurotrophic factor',
  'gdnf', 'glial cell-derived neurotrophic factor', 'igf', 'igf-1', 'igf-2',
  'pdgf', 'platelet-derived growth factor', 'csf', 'g-csf', 'gm-csf', 'm-csf',
  // Apoptosis-related
  'bcl-2', 'bcl-xl', 'bax', 'bak', 'bad', 'bid', 'bim', 'puma', 'noxa',
  'apaf-1', 'cytochrome c', 'smac', 'diablo', 'xiap', 'survivin',
  // Signaling proteins
  'ras', 'kras', 'hras', 'nras', 'raf', 'mek', 'erk', 'mapk', 'jnk', 'p38',
  'pi3k', 'phosphoinositide 3-kinase', 'pdk1', 'gsk-3β', 'β-catenin', 'wnt',
  'notch', 'hedgehog', 'shh', 'smad', 'smad2', 'smad3', 'smad4',
  // Structural & Other
  'collagen', 'elastin', 'fibronectin', 'laminin', 'actin', 'tubulin',
  'keratin', 'myosin', 'albumin', 'hemoglobin', 'myoglobin', 'ferritin',
  'transferrin', 'ceruloplasmin', 'haptoglobin', 'α2-macroglobulin',
  'complement', 'c3', 'c5', 'c5a', 'mac', 'crp', 'c-reactive protein',
  'fibrinogen', 'thrombin', 'plasmin', 'factor viii', 'von willebrand factor',
]);

const KNOWN_PATHWAYS = new Set([
  // Inflammatory pathways
  'nf-κb pathway', 'nf-kb pathway', 'nf-kappa-b signaling', 'inflammasome',
  'nlrp3 inflammasome', 'mapk pathway', 'mapk signaling', 'jnk pathway',
  'p38 mapk pathway', 'erk pathway', 'jak-stat pathway', 'jak/stat signaling',
  'arachidonic acid pathway', 'prostaglandin synthesis', 'leukotriene pathway',
  'cox pathway', 'lox pathway', 'inos pathway', 'nos pathway',
  // Metabolic pathways
  'glycolysis', 'gluconeogenesis', 'krebs cycle', 'citric acid cycle', 'tca cycle',
  'oxidative phosphorylation', 'electron transport chain', 'pentose phosphate pathway',
  'fatty acid oxidation', 'β-oxidation', 'lipogenesis', 'lipolysis',
  'cholesterol synthesis', 'mevalonate pathway', 'bile acid synthesis',
  'amino acid metabolism', 'urea cycle', 'glutamine metabolism',
  // Signaling pathways
  'pi3k/akt pathway', 'pi3k-akt-mtor', 'mtor pathway', 'mtorc1', 'mtorc2',
  'ampk pathway', 'ampk signaling', 'wnt pathway', 'wnt/β-catenin signaling',
  'notch pathway', 'notch signaling', 'hedgehog pathway', 'shh signaling',
  'tgf-β pathway', 'tgf-beta signaling', 'bmp signaling', 'smad pathway',
  'hippo pathway', 'yap/taz signaling', 'ras-raf-mek-erk',
  // Stress response pathways
  'nrf2 pathway', 'nrf2-keap1', 'antioxidant response element', 'are',
  'unfolded protein response', 'upr', 'er stress response', 'heat shock response',
  'hsf1 pathway', 'autophagy pathway', 'mitophagy', 'atg pathway',
  'apoptosis pathway', 'intrinsic apoptosis', 'extrinsic apoptosis',
  'necroptosis', 'pyroptosis', 'ferroptosis',
  // DNA repair & cell cycle
  'dna damage response', 'ddr', 'atr pathway', 'atm pathway', 'p53 pathway',
  'cell cycle checkpoint', 'g1/s checkpoint', 'g2/m checkpoint',
  'homologous recombination', 'non-homologous end joining', 'nhej',
  'base excision repair', 'nucleotide excision repair', 'mismatch repair',
  // Immune pathways
  'tlr signaling', 'toll-like receptor signaling', 'nod signaling', 'rig-i signaling',
  'sting pathway', 'type i interferon response', 'complement cascade',
  'antigen presentation', 'mhc pathway', 't cell receptor signaling',
  'b cell receptor signaling', 'fc receptor signaling', 'phagocytosis',
]);

// Layer 3: Biological Processes & Effects
const KNOWN_BIOLOGICAL_PROCESSES = new Set([
  // Cellular processes
  'autophagy', 'mitophagy', 'apoptosis', 'programmed cell death', 'necrosis',
  'necroptosis', 'pyroptosis', 'ferroptosis', 'cell proliferation', 'cell division',
  'cell differentiation', 'cell migration', 'cell adhesion', 'phagocytosis',
  'endocytosis', 'exocytosis', 'pinocytosis', 'vesicle trafficking',
  'protein synthesis', 'protein folding', 'protein degradation', 'proteolysis',
  'ubiquitination', 'sumoylation', 'phosphorylation', 'dephosphorylation',
  'acetylation', 'deacetylation', 'methylation', 'demethylation',
  'glycosylation', 'lipid modification',
  // Aging-related processes
  'cellular senescence', 'senescence', 'replicative senescence', 'sasp',
  'senescence-associated secretory phenotype', 'telomere shortening',
  'telomere maintenance', 'dna repair', 'genomic instability', 'epigenetic drift',
  'mitochondrial dysfunction', 'oxidative stress', 'lipid peroxidation',
  'protein aggregation', 'amyloid formation', 'stem cell exhaustion',
  'intercellular communication', 'nutrient sensing dysregulation',
  // Inflammatory processes
  'inflammation', 'acute inflammation', 'chronic inflammation', 'neuroinflammation',
  'cytokine release', 'cytokine storm', 'chemotaxis', 'leukocyte migration',
  'neutrophil activation', 'macrophage polarization', 'm1 polarization', 'm2 polarization',
  'mast cell degranulation', 'complement activation', 'antibody production',
  // Metabolic processes
  'glucose metabolism', 'insulin signaling', 'insulin resistance', 'gluconeogenesis',
  'glycogenolysis', 'lipid metabolism', 'lipogenesis', 'lipolysis', 'beta-oxidation',
  'cholesterol metabolism', 'bile acid metabolism', 'amino acid metabolism',
  'nitrogen metabolism', 'one-carbon metabolism', 'folate metabolism',
  'purine metabolism', 'pyrimidine metabolism', 'nucleotide synthesis',
  // Redox processes
  'oxidative phosphorylation', 'atp synthesis', 'ros production', 'ros scavenging',
  'antioxidant defense', 'glutathione metabolism', 'thioredoxin system',
  'nadph regeneration', 'electron transport', 'proton gradient',
  // Neural processes
  'neurotransmission', 'synaptic transmission', 'synaptic plasticity',
  'long-term potentiation', 'ltp', 'long-term depression', 'ltd',
  'neurogenesis', 'neuroplasticity', 'axonal transport', 'myelination',
  'neurite outgrowth', 'dendritic arborization', 'synaptogenesis',
  // Cardiovascular processes
  'angiogenesis', 'vasodilation', 'vasoconstriction', 'blood coagulation',
  'fibrinolysis', 'platelet aggregation', 'endothelial function',
  'cardiac contractility', 'heart rate regulation', 'blood pressure regulation',
  // Other biological processes
  'gene expression', 'transcription', 'translation', 'rna splicing',
  'dna replication', 'chromatin remodeling', 'histone modification',
  'circadian rhythm', 'sleep regulation', 'hormone secretion',
  'immune response', 'innate immunity', 'adaptive immunity',
  'wound healing', 'tissue repair', 'fibrosis', 'bone remodeling',
  'muscle contraction', 'calcium signaling',
]);

// Layer 4: Clinical Outcomes & Conditions
const KNOWN_CONDITIONS = new Set([
  // Cardiovascular
  'hypertension', 'hipertensão', 'heart failure', 'insuficiência cardíaca',
  'coronary artery disease', 'doença arterial coronariana', 'atherosclerosis', 'aterosclerose',
  'arrhythmia', 'arritmia', 'cardiomyopathy', 'cardiomiopatia', 'myocardial infarction',
  'stroke', 'avc', 'acidente vascular cerebral', 'thrombosis', 'trombose',
  'peripheral artery disease', 'doença arterial periférica', 'aneurysm',
  // Metabolic
  'diabetes', 'diabetes mellitus', 'type 2 diabetes', 'diabetes tipo 2',
  'insulin resistance', 'resistência à insulina', 'obesity', 'obesidade',
  'metabolic syndrome', 'síndrome metabólica', 'dyslipidemia', 'dislipidemia',
  'hypercholesterolemia', 'hipercolesterolemia', 'hypertriglyceridemia',
  'non-alcoholic fatty liver disease', 'nafld', 'esteatose hepática',
  'gout', 'gota', 'hyperuricemia',
  // Neurological
  'alzheimer', 'alzheimer\'s disease', 'doença de alzheimer', 'dementia', 'demência',
  'parkinson', 'parkinson\'s disease', 'doença de parkinson',
  'multiple sclerosis', 'esclerose múltipla', 'epilepsy', 'epilepsia',
  'migraine', 'enxaqueca', 'neuropathy', 'neuropatia', 'cognitive decline',
  'declínio cognitivo', 'memory loss', 'perda de memória', 'neurodegeneration',
  'neurodegeneração', 'huntington', 'als', 'amyotrophic lateral sclerosis',
  // Musculoskeletal
  'osteoarthritis', 'osteoartrite', 'artrose', 'rheumatoid arthritis', 'artrite reumatoide',
  'osteoporosis', 'osteoporose', 'sarcopenia', 'muscle wasting', 'atrofia muscular',
  'fibromyalgia', 'fibromialgia', 'tendinitis', 'tendinite', 'bursitis', 'bursite',
  'hip dysplasia', 'displasia coxofemoral', 'intervertebral disc disease', 'doença discal',
  // Cancer
  'cancer', 'câncer', 'tumor', 'carcinoma', 'sarcoma', 'lymphoma', 'linfoma',
  'leukemia', 'leucemia', 'melanoma', 'breast cancer', 'câncer de mama',
  'lung cancer', 'câncer de pulmão', 'colon cancer', 'câncer de cólon',
  'prostate cancer', 'câncer de próstata', 'liver cancer', 'hepatocarcinoma',
  'metastasis', 'metástase', 'tumor growth', 'crescimento tumoral',
  // Gastrointestinal
  'inflammatory bowel disease', 'ibd', 'doença inflamatória intestinal',
  'crohn\'s disease', 'doença de crohn', 'ulcerative colitis', 'colite ulcerativa',
  'irritable bowel syndrome', 'ibs', 'síndrome do intestino irritável',
  'gastritis', 'gastrite', 'peptic ulcer', 'úlcera péptica', 'gerd', 'reflux',
  'pancreatitis', 'pancreatite', 'hepatitis', 'hepatite', 'cirrhosis', 'cirrose',
  // Immune/Inflammatory
  'autoimmune disease', 'doença autoimune', 'lupus', 'lúpus', 'psoriasis', 'psoríase',
  'eczema', 'dermatitis', 'dermatite', 'asthma', 'asma', 'allergy', 'alergia',
  'chronic inflammation', 'inflamação crônica', 'sepsis', 'systemic inflammation',
  // Renal
  'chronic kidney disease', 'ckd', 'doença renal crônica', 'kidney failure',
  'insuficiência renal', 'nephropathy', 'nefropatia', 'glomerulonephritis',
  // Respiratory
  'copd', 'dpoc', 'chronic obstructive pulmonary disease', 'pulmonary fibrosis',
  'fibrose pulmonar', 'pneumonia', 'bronchitis', 'bronquite',
  // Endocrine
  'hypothyroidism', 'hipotireoidismo', 'hyperthyroidism', 'hipertireoidismo',
  'adrenal insufficiency', 'cushing syndrome', 'síndrome de cushing',
  // Ophthalmologic
  'macular degeneration', 'degeneração macular', 'cataracts', 'catarata',
  'glaucoma', 'diabetic retinopathy', 'retinopatia diabética',
  // Mental Health
  'depression', 'depressão', 'anxiety', 'ansiedade', 'stress', 'estresse',
  'insomnia', 'insônia', 'cognitive impairment', 'comprometimento cognitivo',
  // Aging-related
  'aging', 'envelhecimento', 'frailty', 'fragilidade', 'longevity', 'longevidade',
  'healthspan', 'lifespan', 'premature aging', 'envelhecimento precoce',
]);

// Context nodes: Cell types, species, etc.
const KNOWN_CELL_TYPES = new Set([
  // Immune cells
  'macrophage', 'macrófago', 'monocyte', 'monócito', 'neutrophil', 'neutrófilo',
  'lymphocyte', 'linfócito', 't cell', 'célula t', 't lymphocyte', 'linfócito t',
  'cd4+ t cell', 'cd8+ t cell', 'regulatory t cell', 'treg', 'th1 cell', 'th2 cell',
  'th17 cell', 'b cell', 'célula b', 'b lymphocyte', 'linfócito b', 'plasma cell',
  'natural killer cell', 'nk cell', 'célula nk', 'dendritic cell', 'célula dendrítica',
  'mast cell', 'mastócito', 'basophil', 'basófilo', 'eosinophil', 'eosinófilo',
  // Neural cells
  'neuron', 'neurônio', 'astrocyte', 'astrócito', 'oligodendrocyte', 'oligodendrócito',
  'microglia', 'micróglia', 'schwann cell', 'célula de schwann',
  'catecholaminergic neurons', 'dopaminergic neurons', 'serotonergic neurons',
  'cholinergic neurons', 'gabaergic neurons', 'glutamatergic neurons',
  // Other cell types
  'epithelial cell', 'célula epitelial', 'endothelial cell', 'célula endotelial',
  'fibroblast', 'fibroblasto', 'adipocyte', 'adipócito', 'hepatocyte', 'hepatócito',
  'cardiomyocyte', 'cardiomiócito', 'myocyte', 'miócito', 'osteoblast', 'osteoblasto',
  'osteoclast', 'osteoclasto', 'chondrocyte', 'condrócito', 'keratinocyte', 'queratinócito',
  'stem cell', 'célula-tronco', 'progenitor cell', 'célula progenitora',
  'mesenchymal stem cell', 'msc', 'hematopoietic stem cell', 'hsc',
  'pancreatic beta cell', 'célula beta pancreática', 'enterocyte', 'enterócito',
  'goblet cell', 'podocyte', 'sertoli cell', 'leydig cell',
]);

const KNOWN_CELL_COMPONENTS = new Set([
  'mitochondria', 'mitocôndria', 'mitochondrion', 'nucleus', 'núcleo',
  'endoplasmic reticulum', 'retículo endoplasmático', 'golgi apparatus', 'aparelho de golgi',
  'lysosome', 'lisossomo', 'peroxisome', 'peroxissomo', 'ribosome', 'ribossomo',
  'cytoplasm', 'citoplasma', 'cell membrane', 'membrana celular', 'plasma membrane',
  'nuclear envelope', 'cytoskeleton', 'citoesqueleto', 'microfilament', 'microtubule',
  'centrosome', 'centriole', 'vacuole', 'vacúolo', 'autophagosome', 'autofagossomo',
  'proteasome', 'proteassomo', 'spliceosome', 'nucleolus', 'nucléolo',
  'mitochondrial membrane', 'inner mitochondrial membrane', 'outer mitochondrial membrane',
  'cristae', 'matrix', 'intermembrane space',
]);

// =============================================================================
// CLASSIFICATION FUNCTION
// =============================================================================

interface ClassificationResult {
  entityName: string;
  entityType: string;
  layer: string;
  confidence: number;
  method: 'dictionary' | 'pattern' | 'llm' | 'default';
  category?: string;
}

function normalizeEntityName(name: string): string {
  return name.toLowerCase().trim().replace(/[\s-]+/g, ' ');
}

function classifyEntity(entityName: string): ClassificationResult {
  const normalized = normalizeEntityName(entityName);
  
  // Check nutraceuticals first (Layer 0)
  if (KNOWN_NUTRACEUTICALS.has(normalized)) {
    return {
      entityName,
      entityType: 'Nutraceutical',
      layer: 'layer_0_compound',
      confidence: 0.95,
      method: 'dictionary',
      category: 'compound'
    };
  }
  
  // Check enzymes (Layer 1)
  if (KNOWN_ENZYMES.has(normalized)) {
    return {
      entityName,
      entityType: 'Enzyme',
      layer: 'layer_1_target',
      confidence: 0.95,
      method: 'dictionary',
      category: 'molecular_target'
    };
  }
  
  // Check receptors (Layer 1)
  if (KNOWN_RECEPTORS.has(normalized)) {
    return {
      entityName,
      entityType: 'Receptor',
      layer: 'layer_1_target',
      confidence: 0.95,
      method: 'dictionary',
      category: 'molecular_target'
    };
  }
  
  // Check proteins (Layer 1)
  if (KNOWN_PROTEINS.has(normalized)) {
    return {
      entityName,
      entityType: 'GeneProtein',
      layer: 'layer_1_target',
      confidence: 0.95,
      method: 'dictionary',
      category: 'molecular_target'
    };
  }
  
  // Check pathways (Layer 1-2)
  if (KNOWN_PATHWAYS.has(normalized)) {
    return {
      entityName,
      entityType: 'Pathway',
      layer: 'layer_1_target',
      confidence: 0.95,
      method: 'dictionary',
      category: 'pathway'
    };
  }
  
  // Check biological processes (Layer 3)
  if (KNOWN_BIOLOGICAL_PROCESSES.has(normalized)) {
    return {
      entityName,
      entityType: 'BiologicalProcess',
      layer: 'layer_3_effect',
      confidence: 0.95,
      method: 'dictionary',
      category: 'biological_process'
    };
  }
  
  // Check conditions (Layer 4)
  if (KNOWN_CONDITIONS.has(normalized)) {
    return {
      entityName,
      entityType: 'Condition',
      layer: 'layer_4_outcome',
      confidence: 0.95,
      method: 'dictionary',
      category: 'clinical_outcome'
    };
  }
  
  // Check cell types (Context)
  if (KNOWN_CELL_TYPES.has(normalized)) {
    return {
      entityName,
      entityType: 'Cell',
      layer: 'context',
      confidence: 0.95,
      method: 'dictionary',
      category: 'cell_type'
    };
  }
  
  // Check cell components (Context)
  if (KNOWN_CELL_COMPONENTS.has(normalized)) {
    return {
      entityName,
      entityType: 'CellComponent',
      layer: 'context',
      confidence: 0.95,
      method: 'dictionary',
      category: 'cell_component'
    };
  }
  
  // Pattern-based classification
  return classifyByPattern(entityName, normalized);
}

function classifyByPattern(entityName: string, normalized: string): ClassificationResult {
  // Enzyme patterns
  if (/-ase$/.test(normalized) || /kinase|phosphatase|synthase|oxidase|reductase|transferase|hydrolase/i.test(normalized)) {
    return {
      entityName,
      entityType: 'Enzyme',
      layer: 'layer_1_target',
      confidence: 0.80,
      method: 'pattern',
      category: 'molecular_target'
    };
  }
  
  // Receptor patterns
  if (/receptor|channel|\-r$/i.test(normalized)) {
    return {
      entityName,
      entityType: 'Receptor',
      layer: 'layer_1_target',
      confidence: 0.75,
      method: 'pattern',
      category: 'molecular_target'
    };
  }
  
  // Pathway patterns
  if (/pathway|signaling|cascade|axis/i.test(normalized)) {
    return {
      entityName,
      entityType: 'Pathway',
      layer: 'layer_1_target',
      confidence: 0.80,
      method: 'pattern',
      category: 'pathway'
    };
  }
  
  // Interleukin/Cytokine patterns
  if (/^il-?\d+|interleukin|cytokine|chemokine|interferon|tnf|tumor necrosis/i.test(normalized)) {
    return {
      entityName,
      entityType: 'Cytokine',
      layer: 'layer_1_target',
      confidence: 0.85,
      method: 'pattern',
      category: 'molecular_target'
    };
  }
  
  // Growth factor patterns
  if (/growth factor|ngf|bdnf|vegf|egf|fgf|igf|pdgf|tgf/i.test(normalized)) {
    return {
      entityName,
      entityType: 'GrowthFactor',
      layer: 'layer_1_target',
      confidence: 0.85,
      method: 'pattern',
      category: 'molecular_target'
    };
  }
  
  // Biological process patterns
  if (/ation$|osis$|genesis$|lysis$|metabolism|response|regulation|activation|inhibition|modulation|reduction|increase|decrease/i.test(normalized)) {
    return {
      entityName,
      entityType: 'BiologicalProcess',
      layer: 'layer_3_effect',
      confidence: 0.70,
      method: 'pattern',
      category: 'biological_process'
    };
  }
  
  // Disease/Condition patterns
  if (/disease|disorder|syndrome|deficiency|dysfunction|failure|itis$|osis$|emia$|pathy$/i.test(normalized)) {
    return {
      entityName,
      entityType: 'Condition',
      layer: 'layer_4_outcome',
      confidence: 0.75,
      method: 'pattern',
      category: 'clinical_outcome'
    };
  }
  
  // Cell patterns
  if (/cell|cyte$|blast$|clast$/i.test(normalized)) {
    return {
      entityName,
      entityType: 'Cell',
      layer: 'context',
      confidence: 0.80,
      method: 'pattern',
      category: 'cell_type'
    };
  }
  
  // Protein/Gene patterns
  if (/^[A-Z]{2,5}\d?$|protein|factor|gene/i.test(entityName)) {
    return {
      entityName,
      entityType: 'GeneProtein',
      layer: 'layer_1_target',
      confidence: 0.60,
      method: 'pattern',
      category: 'molecular_target'
    };
  }
  
  // Default: Unknown entity (NOT Nutraceutical!)
  return {
    entityName,
    entityType: 'Entity',
    layer: 'unknown',
    confidence: 0.30,
    method: 'default',
    category: 'unknown'
  };
}

// Batch classification
function classifyEntities(entities: string[]): ClassificationResult[] {
  return entities.map(entity => classifyEntity(entity));
}

// =============================================================================
// EDGE FUNCTION HANDLER
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entity, entities, includeStats } = await req.json();
    
    // Single entity classification
    if (entity && typeof entity === 'string') {
      const result = classifyEntity(entity);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Batch classification
    if (entities && Array.isArray(entities)) {
      const results = classifyEntities(entities);
      
      // Optionally include stats
      if (includeStats) {
        const stats = {
          total: results.length,
          byType: {} as Record<string, number>,
          byLayer: {} as Record<string, number>,
          byMethod: {} as Record<string, number>,
          lowConfidence: results.filter(r => r.confidence < 0.7).length,
        };
        
        results.forEach(r => {
          stats.byType[r.entityType] = (stats.byType[r.entityType] || 0) + 1;
          stats.byLayer[r.layer] = (stats.byLayer[r.layer] || 0) + 1;
          stats.byMethod[r.method] = (stats.byMethod[r.method] || 0) + 1;
        });
        
        return new Response(JSON.stringify({ results, stats }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Provide either "entity" (string) or "entities" (array of strings)' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Classification error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
