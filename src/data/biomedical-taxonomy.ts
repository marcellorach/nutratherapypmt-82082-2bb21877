/**
 * BIOMEDICAL TAXONOMY - Entity Classification System
 * Based on UMLS (Unified Medical Language System) and Gene Ontology (GO)
 * 
 * This file contains curated dictionaries for accurate classification of
 * biomedical entities in the VetGraphRAG knowledge graph.
 * 
 * HIERARCHY:
 * - Layer 0: Compounds (Nutraceuticals, Drugs, Chemical Compounds)
 * - Layer 1: Molecular Targets (Enzymes, Receptors, Proteins, Pathways)
 * - Layer 2: Mechanisms (Signaling Cascades, Molecular Actions)
 * - Layer 3: Biological Processes/Effects (Functions, Phenotypes)
 * - Layer 4: Clinical Outcomes (Diseases, Conditions)
 * - Context: Species, Breeds, Age Groups, Cell Types
 * 
 * @version 2.0.0 - Complete reformulation based on UMLS/GO standards
 */

// ============================================================================
// LAYER 0: COMPOUNDS
// ============================================================================

/**
 * Known nutraceuticals and natural compounds
 * Source: NIH Office of Dietary Supplements, Natural Medicines Database
 */
export const KNOWN_NUTRACEUTICALS: Set<string> = new Set([
  // Polyphenols & Flavonoids
  'curcumin', 'curcumina', 'resveratrol', 'quercetin', 'quercetina',
  'epigallocatechin gallate', 'egcg', 'catechin', 'anthocyanins',
  'proanthocyanidins', 'hesperidin', 'naringenin', 'kaempferol',
  'apigenin', 'luteolin', 'genistein', 'daidzein', 'silymarin',
  
  // Omega Fatty Acids
  'omega-3', 'omega-6', 'dha', 'epa', 'ala', 'alpha-linolenic acid',
  'docosahexaenoic acid', 'eicosapentaenoic acid', 'fish oil', 'krill oil',
  
  // Vitamins
  'vitamin a', 'vitamin b1', 'vitamin b2', 'vitamin b3', 'vitamin b5',
  'vitamin b6', 'vitamin b7', 'vitamin b9', 'vitamin b12', 'vitamin c',
  'vitamin d', 'vitamin d3', 'cholecalciferol', 'vitamin e', 'tocopherol',
  'vitamin k', 'vitamin k2', 'thiamine', 'riboflavin', 'niacin',
  'pantothenic acid', 'pyridoxine', 'biotin', 'folate', 'folic acid',
  'cobalamin', 'ascorbic acid',
  
  // Minerals
  'zinc', 'selenium', 'magnesium', 'iron', 'calcium', 'potassium',
  'manganese', 'copper', 'chromium', 'iodine', 'molybdenum',
  
  // Amino Acids & Peptides
  'l-carnitine', 'carnitine', 'taurine', 'glutamine', 'l-glutamine',
  'arginine', 'l-arginine', 'glycine', 'lysine', 'methionine',
  'cysteine', 'n-acetyl cysteine', 'nac', 'glutathione', 'gsh',
  'creatine', 'beta-alanine', 'citrulline', 'ornithine', 'bcaa',
  'collagen', 'hydrolyzed collagen', 'collagen peptides',
  
  // Longevity Compounds
  'nmn', 'nicotinamide mononucleotide', 'nr', 'nicotinamide riboside',
  'nad+', 'spermidine', 'fisetin', 'urolithin a', 'pterostilbene',
  'rapamycin', 'metformin', 'berberine', 'sulforaphane',
  
  // Probiotics & Prebiotics
  'lactobacillus', 'bifidobacterium', 'saccharomyces boulardii',
  'inulin', 'fos', 'fructooligosaccharides', 'gos', 'prebiotic fiber',
  
  // Herbal Extracts
  'ashwagandha', 'withania somnifera', 'ginseng', 'panax ginseng',
  'rhodiola rosea', 'bacopa monnieri', 'ginkgo biloba', 'milk thistle',
  'turmeric', 'green tea extract', 'grape seed extract', 'boswellia',
  'astragalus', 'echinacea', 'valerian', 'passionflower',
  
  // Mushrooms
  'lions mane', 'reishi', 'ganoderma lucidum', 'cordyceps',
  'chaga', 'turkey tail', 'shiitake', 'maitake',
  
  // Other Compounds
  'coenzyme q10', 'coq10', 'ubiquinol', 'ubiquinone',
  'alpha lipoic acid', 'ala', 'pqq', 'pyrroloquinoline quinone',
  'phosphatidylserine', 'ps', 'acetyl-l-carnitine', 'alcar',
  'glucosamine', 'chondroitin', 'msm', 'methylsulfonylmethane',
  'hyaluronic acid', 'astaxanthin', 'lycopene', 'lutein', 'zeaxanthin',
  'melatonin', 's-adenosyl methionine', 'same', 'dmae',
]);

/**
 * Known pharmaceutical drugs
 */
export const KNOWN_DRUGS: Set<string> = new Set([
  'aspirin', 'ibuprofen', 'acetaminophen', 'paracetamol', 'naproxen',
  'prednisone', 'prednisolone', 'dexamethasone', 'cortisol',
  'metformin', 'insulin', 'glipizide', 'sitagliptin',
  'atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin',
  'lisinopril', 'enalapril', 'losartan', 'valsartan', 'amlodipine',
  'omeprazole', 'pantoprazole', 'ranitidine', 'famotidine',
  'fluoxetine', 'sertraline', 'escitalopram', 'venlafaxine',
  'gabapentin', 'pregabalin', 'tramadol', 'morphine', 'oxycodone',
  'amoxicillin', 'azithromycin', 'ciprofloxacin', 'metronidazole',
  'levothyroxine', 'carbimazole', 'methimazole',
]);

// ============================================================================
// LAYER 1: MOLECULAR TARGETS
// ============================================================================

/**
 * Known enzymes - proteins that catalyze reactions
 * Source: BRENDA Enzyme Database, UniProt
 */
export const KNOWN_ENZYMES: Set<string> = new Set([
  // Oxidoreductases
  'catalase', 'superoxide dismutase', 'sod', 'sod1', 'sod2', 'sod3',
  'glutathione peroxidase', 'gpx', 'gpx1', 'gpx4',
  'glutathione reductase', 'thioredoxin reductase',
  'cytochrome c oxidase', 'complex iv', 'nadh dehydrogenase',
  'xanthine oxidase', 'monoamine oxidase', 'mao', 'mao-a', 'mao-b',
  'aldehyde dehydrogenase', 'alcohol dehydrogenase',
  'lipoxygenase', 'lox', '5-lox', '12-lox', '15-lox',
  'cyclooxygenase', 'cox', 'cox-1', 'cox-2',
  'cytochrome p450', 'cyp', 'cyp1a1', 'cyp1a2', 'cyp2c9', 'cyp2d6', 'cyp3a4',
  'heme oxygenase', 'ho-1', 'hmox1',
  'nitric oxide synthase', 'nos', 'enos', 'inos', 'nnos',
  
  // Transferases
  'glutathione s-transferase', 'gst', 'acetyltransferase', 'hat',
  'histone deacetylase', 'hdac', 'hdac1', 'hdac2', 'hdac3',
  'kinase', 'protein kinase', 'phosphatase', 'phosphorylase',
  'transaminase', 'alt', 'ast', 'aminotransferase',
  'methyltransferase', 'dna methyltransferase', 'dnmt',
  
  // Hydrolases
  'lipase', 'amylase', 'protease', 'peptidase',
  'phospholipase', 'pla2', 'phospholipase a2',
  'atpase', 'gtpase', 'nuclease', 'rnase', 'dnase',
  'acetylcholinesterase', 'ache', 'butyrylcholinesterase',
  'beta-glucuronidase', 'lysozyme', 'elastase',
  'matrix metalloproteinase', 'mmp', 'mmp-1', 'mmp-2', 'mmp-9',
  'collagenase', 'gelatinase', 'stromelysin',
  
  // Lyases
  'aldolase', 'decarboxylase', 'synthase', 'lyase',
  'atp synthase', 'citrate synthase',
  
  // Isomerases
  'isomerase', 'racemase', 'mutase', 'topoisomerase',
  
  // Ligases
  'ligase', 'synthetase', 'carboxylase', 'ubiquitin ligase',
  
  // Sirtuins
  'sirtuin', 'sirt1', 'sirt2', 'sirt3', 'sirt4', 'sirt5', 'sirt6', 'sirt7',
  
  // Caspases
  'caspase', 'caspase-1', 'caspase-2', 'caspase-3', 'caspase-6', 
  'caspase-7', 'caspase-8', 'caspase-9', 'caspase-12',
  
  // Other enzymes
  'telomerase', 'helicase', 'polymerase', 'reverse transcriptase',
  'renin', 'angiotensin converting enzyme', 'ace', 'ace2',
  'aromatase', 'reductase', '5-alpha reductase',
  'beta-secretase', 'bace1', 'gamma-secretase', 'presenilin',
  'ampk', 'amp-activated protein kinase',
  'mtor', 'mechanistic target of rapamycin',
  'pi3k', 'phosphoinositide 3-kinase',
  'akt', 'protein kinase b',
  'mapk', 'erk', 'jnk', 'p38',
  'jak', 'jak1', 'jak2', 'jak3', 'tyk2',
]);

/**
 * Known receptors - membrane and nuclear proteins that bind ligands
 * Source: IUPHAR/BPS Guide to Pharmacology
 */
export const KNOWN_RECEPTORS: Set<string> = new Set([
  // G-Protein Coupled Receptors
  'gpcr', 'g-protein coupled receptor',
  'adrenergic receptor', 'alpha-adrenergic', 'beta-adrenergic',
  'muscarinic receptor', 'm1', 'm2', 'm3', 'm4', 'm5',
  'nicotinic receptor', 'nachr',
  'dopamine receptor', 'd1', 'd2', 'd3', 'd4', 'd5',
  'serotonin receptor', '5-ht', '5-ht1a', '5-ht2a', '5-ht3',
  'histamine receptor', 'h1', 'h2', 'h3', 'h4',
  'opioid receptor', 'mu-opioid', 'delta-opioid', 'kappa-opioid',
  'cannabinoid receptor', 'cb1', 'cb2',
  'prostaglandin receptor', 'ep1', 'ep2', 'ep3', 'ep4',
  
  // Tyrosine Kinase Receptors
  'egfr', 'epidermal growth factor receptor',
  'igf-1r', 'insulin-like growth factor receptor',
  'vegfr', 'vascular endothelial growth factor receptor',
  'pdgfr', 'platelet-derived growth factor receptor',
  'fgfr', 'fibroblast growth factor receptor',
  'ngfr', 'trka', 'trkb', 'trkc',
  
  // Nuclear Receptors
  'ppar', 'ppar-alpha', 'ppar-gamma', 'ppar-delta',
  'peroxisome proliferator-activated receptor',
  'estrogen receptor', 'er-alpha', 'er-beta',
  'androgen receptor', 'ar',
  'glucocorticoid receptor', 'gr',
  'thyroid receptor', 'tr-alpha', 'tr-beta',
  'vitamin d receptor', 'vdr',
  'retinoic acid receptor', 'rar', 'rxr',
  'lxr', 'liver x receptor', 'fxr', 'farnesoid x receptor',
  
  // Ion Channel Receptors
  'nmda receptor', 'ampa receptor', 'gaba receptor', 'gaba-a', 'gaba-b',
  'glycine receptor', 'glutamate receptor',
  'trp channel', 'trpv1', 'trpv4', 'trpm8', 'trpa1',
  
  // Cytokine Receptors
  'interleukin receptor', 'il-1r', 'il-2r', 'il-6r', 'il-10r',
  'tnf receptor', 'tnfr1', 'tnfr2',
  'interferon receptor', 'ifnar', 'ifngr',
  
  // Toll-like Receptors
  'toll-like receptor', 'tlr', 'tlr1', 'tlr2', 'tlr3', 'tlr4', 'tlr5',
  'tlr6', 'tlr7', 'tlr8', 'tlr9', 'tlr10',
  
  // Other Receptors
  'insulin receptor', 'ir', 'leptin receptor', 'lepr',
  'ldl receptor', 'ldlr', 'scavenger receptor',
  'aryl hydrocarbon receptor', 'ahr',
  'nrf2', 'nuclear factor erythroid 2-related factor 2',
]);

/**
 * Known signaling pathways
 * Source: KEGG, Reactome
 */
export const KNOWN_PATHWAYS: Set<string> = new Set([
  // Inflammatory Pathways
  'nf-κb pathway', 'nf-kappa b', 'nfkb pathway', 'nuclear factor kappa b',
  'jak-stat pathway', 'jak/stat', 'stat3 pathway',
  'mapk pathway', 'erk pathway', 'jnk pathway', 'p38 pathway',
  'pi3k-akt pathway', 'pi3k/akt', 'akt pathway',
  'tnf signaling', 'tnf-alpha pathway',
  'il-6 signaling', 'il-1 signaling', 'inflammasome pathway',
  'nlrp3 inflammasome',
  
  // Metabolic Pathways
  'ampk pathway', 'mtor pathway', 'mtorc1', 'mtorc2',
  'insulin signaling', 'glucose metabolism', 'glycolysis',
  'gluconeogenesis', 'lipid metabolism', 'fatty acid oxidation',
  'beta-oxidation', 'cholesterol biosynthesis', 'mevalonate pathway',
  'tricarboxylic acid cycle', 'tca cycle', 'krebs cycle', 'citric acid cycle',
  'oxidative phosphorylation', 'electron transport chain',
  
  // Antioxidant Pathways
  'nrf2-keap1 pathway', 'keap1-nrf2', 'antioxidant response element', 'are',
  'glutathione metabolism', 'thioredoxin system',
  
  // Cell Death & Survival
  'apoptosis pathway', 'intrinsic apoptosis', 'extrinsic apoptosis',
  'bcl-2 pathway', 'caspase cascade',
  'autophagy pathway', 'atg pathway', 'lc3 pathway',
  'ferroptosis pathway', 'necroptosis pathway', 'pyroptosis pathway',
  'p53 pathway', 'rb pathway', 'cell cycle pathway',
  
  // Growth & Differentiation
  'wnt signaling', 'wnt/beta-catenin', 'beta-catenin pathway',
  'hedgehog signaling', 'shh pathway',
  'notch signaling', 'notch pathway',
  'tgf-beta signaling', 'smad pathway',
  'hippo pathway', 'yap/taz pathway',
  
  // Neurological
  'dopaminergic pathway', 'serotonergic pathway', 'cholinergic pathway',
  'glutamatergic pathway', 'gabaergic pathway',
  'bdnf signaling', 'neurotrophin signaling',
  
  // Cardiac
  'cardiac remodeling pathway', 'hypertrophic signaling',
  'raas pathway', 'renin-angiotensin-aldosterone system',
  
  // Other
  'circadian rhythm pathway', 'clock genes',
  'vitamin d signaling', 'thyroid hormone signaling',
  'eicosanoid pathway', 'prostaglandin synthesis',
  'upr', 'unfolded protein response', 'er stress pathway',
]);

/**
 * Known genes and proteins
 * Source: UniProt, HGNC
 */
export const KNOWN_GENES_PROTEINS: Set<string> = new Set([
  // Transcription Factors
  'nf-κb', 'nfkb', 'nf-kappab', 'rela', 'p65', 'p50',
  'ap-1', 'c-fos', 'c-jun', 'jund',
  'stat1', 'stat2', 'stat3', 'stat4', 'stat5', 'stat6',
  'hif-1α', 'hif-1alpha', 'hif1a', 'hypoxia-inducible factor',
  'nrf2', 'nfe2l2', 'keap1',
  'p53', 'tp53', 'p21', 'cdkn1a',
  'foxo', 'foxo1', 'foxo3', 'foxo4',
  'srebp', 'srebp1', 'srebp2',
  'pparγ', 'pparg', 'ppargc1a', 'pgc-1α', 'pgc-1alpha',
  'creb', 'atf', 'atf4', 'atf6', 'xbp1',
  
  // Growth Factors
  'bdnf', 'brain-derived neurotrophic factor',
  'ngf', 'nerve growth factor',
  'egf', 'epidermal growth factor',
  'vegf', 'vascular endothelial growth factor',
  'igf-1', 'insulin-like growth factor 1',
  'tgf-β', 'tgf-beta', 'transforming growth factor beta',
  'fgf', 'fibroblast growth factor',
  'pdgf', 'platelet-derived growth factor',
  'hgf', 'hepatocyte growth factor',
  
  // Cytokines
  'tnf-α', 'tnf-alpha', 'tnfa', 'tumor necrosis factor alpha',
  'il-1β', 'il-1beta', 'il1b', 'interleukin-1 beta',
  'il-6', 'interleukin-6',
  'il-8', 'cxcl8', 'interleukin-8',
  'il-10', 'interleukin-10',
  'il-17', 'interleukin-17',
  'ifn-γ', 'ifn-gamma', 'interferon gamma',
  'ifn-α', 'ifn-alpha', 'interferon alpha',
  'tgf-β1', 'tgf-beta1',
  
  // Apoptosis Regulators
  'bcl-2', 'bcl2', 'bcl-xl', 'bcl-xL',
  'bax', 'bak', 'bad', 'bid', 'bim', 'puma', 'noxa',
  'survivin', 'xiap', 'iap',
  'cytochrome c', 'apaf-1',
  
  // Cell Cycle Regulators
  'cyclin', 'cyclin d1', 'cyclin e', 'cyclin a', 'cyclin b',
  'cdk', 'cdk1', 'cdk2', 'cdk4', 'cdk6',
  'rb', 'retinoblastoma protein',
  
  // Autophagy Proteins
  'lc3', 'map1lc3', 'beclin-1', 'becn1',
  'atg5', 'atg7', 'atg12', 'atg16l1',
  'p62', 'sqstm1', 'sequestosome',
  'ulk1', 'ambra1',
  
  // Aging & Longevity
  'klotho', 'telomerase', 'tert', 'terc',
  'sirt1', 'sirt3', 'sirt6',
  'foxo3a', 'igf-1r',
  
  // Other Important Proteins
  'albumin', 'hemoglobin', 'myoglobin',
  'actin', 'myosin', 'tubulin',
  'collagen', 'elastin', 'fibronectin', 'laminin',
  'ferritin', 'transferrin', 'ceruloplasmin',
  'c-reactive protein', 'crp',
  'fibrinogen', 'plasminogen', 'thrombin',
  'insulin', 'glucagon', 'leptin', 'adiponectin', 'ghrelin',
  'amyloid beta', 'aβ', 'tau', 'alpha-synuclein',
]);

// ============================================================================
// LAYER 2: MECHANISMS
// ============================================================================

/**
 * Known molecular mechanisms and actions
 */
export const KNOWN_MECHANISMS: Set<string> = new Set([
  // Enzyme Modulation
  'enzyme inhibition', 'enzyme activation', 'enzyme induction',
  'competitive inhibition', 'non-competitive inhibition', 'allosteric modulation',
  'phosphorylation', 'dephosphorylation', 'acetylation', 'deacetylation',
  'methylation', 'demethylation', 'ubiquitination', 'sumoylation',
  'glycosylation', 'deglycosylation',
  
  // Receptor Modulation
  'receptor agonism', 'receptor antagonism', 'partial agonism',
  'receptor activation', 'receptor inhibition', 'receptor downregulation',
  'receptor upregulation', 'receptor sensitization', 'receptor desensitization',
  'ligand binding', 'competitive binding', 'allosteric binding',
  
  // Gene Expression
  'transcriptional activation', 'transcriptional repression',
  'gene expression upregulation', 'gene expression downregulation',
  'mrna stabilization', 'mrna degradation',
  'epigenetic modification', 'chromatin remodeling',
  'histone modification', 'dna methylation', 'dna demethylation',
  
  // Signal Transduction
  'signal transduction', 'second messenger activation',
  'calcium signaling', 'camp signaling', 'cgmp signaling',
  'kinase cascade activation', 'phosphatase activation',
  'protein-protein interaction', 'protein complex formation',
  
  // Cellular Processes
  'membrane transport', 'ion channel modulation', 'ion flux',
  'endocytosis', 'exocytosis', 'phagocytosis', 'pinocytosis',
  'vesicle trafficking', 'membrane fusion',
  'protein synthesis', 'protein degradation', 'proteolysis',
  'protein folding', 'chaperone activity',
  
  // Redox Mechanisms
  'antioxidant activity', 'free radical scavenging', 'ros reduction',
  'lipid peroxidation inhibition', 'metal chelation',
  'glutathione induction', 'phase ii enzyme induction',
  'nrf2 activation', 'ho-1 induction',
  
  // Inflammatory Mechanisms
  'nf-κb inhibition', 'nfkb inhibition', 'cytokine suppression',
  'cox-2 inhibition', 'lox inhibition', 'prostaglandin reduction',
  'inflammasome inhibition', 'nlrp3 inhibition',
  'anti-inflammatory signaling', 'pro-resolution signaling',
  
  // Metabolic Mechanisms
  'ampk activation', 'mtor inhibition', 'glycolysis modulation',
  'mitochondrial biogenesis', 'fatty acid oxidation enhancement',
  'glucose uptake enhancement', 'insulin sensitization',
  'lipogenesis inhibition', 'lipolysis activation',
  
  // Cell Death Mechanisms
  'apoptosis induction', 'apoptosis inhibition', 'caspase activation',
  'autophagy induction', 'autophagy inhibition',
  'ferroptosis inhibition', 'necroptosis inhibition',
  'mitochondrial protection', 'membrane stabilization',
]);

// ============================================================================
// LAYER 3: BIOLOGICAL PROCESSES & EFFECTS
// ============================================================================

/**
 * Known biological processes and functions
 * Source: Gene Ontology (GO) Biological Process
 */
export const KNOWN_BIOLOGICAL_PROCESSES: Set<string> = new Set([
  // Cellular Processes
  'autophagy', 'autophagic flux', 'macroautophagy', 'mitophagy', 'lipophagy',
  'apoptosis', 'programmed cell death', 'cell death', 'necrosis', 'necroptosis',
  'ferroptosis', 'pyroptosis', 'anoikis',
  'cell proliferation', 'cell division', 'mitosis', 'meiosis',
  'cell differentiation', 'cell maturation', 'cell fate determination',
  'cell migration', 'cell motility', 'chemotaxis',
  'cell adhesion', 'cell-cell adhesion', 'cell-matrix adhesion',
  'cellular senescence', 'replicative senescence', 'stress-induced senescence',
  'cell cycle arrest', 'cell cycle progression', 'cell cycle regulation',
  
  // Metabolic Processes
  'lipid metabolism', 'lipid biosynthesis', 'lipid catabolism', 'lipolysis',
  'fatty acid metabolism', 'fatty acid oxidation', 'beta oxidation',
  'cholesterol metabolism', 'cholesterol biosynthesis', 'cholesterol efflux',
  'glucose metabolism', 'glycolysis', 'gluconeogenesis', 'glycogen metabolism',
  'protein metabolism', 'protein synthesis', 'protein degradation', 'proteostasis',
  'amino acid metabolism', 'nitrogen metabolism',
  'nucleotide metabolism', 'purine metabolism', 'pyrimidine metabolism',
  'energy metabolism', 'atp synthesis', 'oxidative phosphorylation',
  'mitochondrial respiration', 'electron transport',
  
  // Homeostatic Processes
  'redox homeostasis', 'oxidative balance', 'ros homeostasis',
  'calcium homeostasis', 'iron homeostasis', 'zinc homeostasis',
  'ph homeostasis', 'osmotic balance', 'fluid balance',
  'glucose homeostasis', 'lipid homeostasis', 'energy homeostasis',
  'protein homeostasis', 'proteostasis',
  
  // Stress Responses
  'oxidative stress response', 'er stress response', 'heat shock response',
  'hypoxia response', 'dna damage response', 'genotoxic stress response',
  'unfolded protein response', 'upr activation',
  'stress adaptation', 'hormesis', 'preconditioning',
  
  // Immune Processes
  'immune response', 'innate immunity', 'adaptive immunity',
  'inflammatory response', 'acute inflammation', 'chronic inflammation',
  'anti-inflammatory response', 'resolution of inflammation',
  'phagocytosis', 'antigen presentation', 'cytokine production',
  'chemokine signaling', 'leukocyte recruitment', 'immune cell activation',
  'immunomodulation', 'immunosuppression', 'immunostimulation',
  
  // Repair & Regeneration
  'wound healing', 'tissue repair', 'tissue regeneration',
  'angiogenesis', 'neovascularization', 'vasculogenesis',
  'neurogenesis', 'synaptogenesis', 'axon regeneration',
  'bone remodeling', 'osteogenesis', 'osteoclastogenesis',
  'muscle regeneration', 'myogenesis', 'satellite cell activation',
  'fibrosis', 'scar formation', 'tissue remodeling',
  
  // Neurological Processes
  'neurotransmission', 'synaptic transmission', 'synaptic plasticity',
  'long-term potentiation', 'ltp', 'long-term depression', 'ltd',
  'neuronal survival', 'neuroprotection', 'neurodegeneration',
  'memory formation', 'memory consolidation', 'learning',
  'cognitive function', 'attention', 'executive function',
  
  // Cardiovascular Processes
  'cardiac contractility', 'vascular tone regulation',
  'blood pressure regulation', 'vasodilation', 'vasoconstriction',
  'endothelial function', 'endothelial protection',
  'platelet aggregation', 'coagulation', 'fibrinolysis',
  'atherosclerosis', 'plaque formation', 'plaque stabilization',
  
  // Aging Processes
  'aging', 'cellular aging', 'organismal aging',
  'longevity', 'lifespan extension', 'healthspan',
  'telomere maintenance', 'telomere shortening',
  'nad+ metabolism', 'sirtuin activation',
]);

/**
 * Known physiological effects and outcomes
 */
export const KNOWN_EFFECTS: Set<string> = new Set([
  // Anti-Inflammatory Effects
  'anti-inflammatory effect', 'inflammation reduction', 'cytokine reduction',
  'cox inhibition', 'prostaglandin reduction', 'leukotriene reduction',
  
  // Antioxidant Effects
  'antioxidant effect', 'oxidative stress reduction', 'ros reduction',
  'lipid peroxidation reduction', 'protein oxidation reduction',
  'dna damage prevention', 'mitochondrial protection',
  
  // Metabolic Effects
  'glucose lowering', 'insulin sensitization', 'lipid lowering',
  'cholesterol reduction', 'triglyceride reduction',
  'weight reduction', 'fat loss', 'appetite suppression',
  'metabolic rate increase', 'thermogenesis',
  
  // Cardiovascular Effects
  'blood pressure reduction', 'vasodilation', 'endothelial improvement',
  'platelet inhibition', 'anticoagulation', 'fibrinolysis enhancement',
  'ldl reduction', 'hdl increase', 'atherosclerosis prevention',
  'cardiac protection', 'cardioprotection',
  
  // Neurological Effects
  'cognitive enhancement', 'memory improvement', 'neuroprotection',
  'mood improvement', 'anxiolytic effect', 'antidepressant effect',
  'sleep improvement', 'sedation', 'relaxation',
  'pain reduction', 'analgesia', 'anti-nociception',
  
  // Immune Effects
  'immune enhancement', 'immunomodulation', 'immunosuppression',
  'anti-allergic effect', 'antihistamine effect',
  'antimicrobial effect', 'antibacterial effect', 'antiviral effect', 'antifungal effect',
  
  // Anti-Aging Effects
  'anti-aging effect', 'longevity enhancement', 'healthspan improvement',
  'telomere protection', 'senolytic effect', 'senostatic effect',
  
  // Tissue-Specific Effects
  'hepatoprotection', 'nephroprotection', 'gastroprotection',
  'muscle protection', 'bone protection', 'skin protection',
  'joint protection', 'cartilage protection',
]);

// ============================================================================
// LAYER 4: CLINICAL OUTCOMES (DISEASES & CONDITIONS)
// ============================================================================

/**
 * Known diseases and health conditions
 * Source: ICD-11, SNOMED-CT, MeSH
 */
export const KNOWN_CONDITIONS: Set<string> = new Set([
  // Cardiovascular Diseases
  'cardiovascular disease', 'heart disease', 'coronary artery disease',
  'atherosclerosis', 'hypertension', 'high blood pressure',
  'heart failure', 'cardiomyopathy', 'arrhythmia', 'atrial fibrillation',
  'myocardial infarction', 'heart attack', 'stroke', 'cerebrovascular disease',
  'peripheral artery disease', 'deep vein thrombosis', 'pulmonary embolism',
  'hyperlipidemia', 'dyslipidemia', 'hypercholesterolemia',
  
  // Metabolic Diseases
  'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes', 'insulin resistance',
  'metabolic syndrome', 'obesity', 'overweight',
  'non-alcoholic fatty liver disease', 'nafld', 'nash', 'fatty liver',
  'hypothyroidism', 'hyperthyroidism', 'thyroid disease',
  'gout', 'hyperuricemia',
  
  // Neurodegenerative Diseases
  'alzheimer disease', "alzheimer's disease", 'dementia',
  'parkinson disease', "parkinson's disease", 'parkinsonism',
  'huntington disease', "huntington's disease",
  'amyotrophic lateral sclerosis', 'als', 'motor neuron disease',
  'multiple sclerosis', 'ms',
  'cognitive decline', 'mild cognitive impairment', 'mci',
  
  // Inflammatory & Autoimmune
  'rheumatoid arthritis', 'osteoarthritis', 'arthritis',
  'inflammatory bowel disease', 'ibd', "crohn's disease", 'ulcerative colitis',
  'lupus', 'systemic lupus erythematosus', 'sle',
  'psoriasis', 'eczema', 'atopic dermatitis', 'dermatitis',
  'asthma', 'allergic rhinitis', 'allergy',
  'multiple sclerosis', 'ms',
  
  // Cancer
  'cancer', 'tumor', 'neoplasm', 'malignancy',
  'breast cancer', 'lung cancer', 'colorectal cancer', 'colon cancer',
  'prostate cancer', 'liver cancer', 'pancreatic cancer', 'gastric cancer',
  'leukemia', 'lymphoma', 'melanoma',
  
  // Gastrointestinal
  'gastritis', 'gastric ulcer', 'peptic ulcer', 'gerd', 'acid reflux',
  'irritable bowel syndrome', 'ibs', 'constipation', 'diarrhea',
  'liver disease', 'cirrhosis', 'hepatitis',
  'pancreatitis', 'gallbladder disease', 'cholecystitis',
  
  // Kidney & Urinary
  'chronic kidney disease', 'ckd', 'renal failure', 'nephropathy',
  'kidney stones', 'nephrolithiasis', 'urinary tract infection', 'uti',
  
  // Respiratory
  'chronic obstructive pulmonary disease', 'copd', 'emphysema',
  'bronchitis', 'pneumonia', 'pulmonary fibrosis',
  'respiratory infection', 'influenza', 'covid-19',
  
  // Musculoskeletal
  'osteoporosis', 'osteopenia', 'bone loss',
  'sarcopenia', 'muscle wasting', 'muscle atrophy', 'frailty',
  'fibromyalgia', 'chronic pain', 'back pain',
  'tendinitis', 'bursitis', 'joint pain',
  
  // Neurological & Psychiatric
  'depression', 'major depressive disorder', 'anxiety', 'anxiety disorder',
  'bipolar disorder', 'schizophrenia', 'ptsd',
  'insomnia', 'sleep disorder', 'sleep apnea',
  'epilepsy', 'seizure', 'migraine', 'headache',
  'neuropathy', 'peripheral neuropathy', 'diabetic neuropathy',
  
  // Eye Diseases
  'macular degeneration', 'amd', 'cataracts', 'glaucoma',
  'diabetic retinopathy', 'dry eye', 'vision loss',
  
  // Skin Conditions
  'wound', 'skin aging', 'wrinkles', 'photo-aging',
  'acne', 'rosacea', 'vitiligo', 'alopecia', 'hair loss',
  
  // Aging & Longevity
  'aging', 'premature aging', 'accelerated aging',
  'age-related decline', 'frailty', 'sarcopenia',
  
  // Veterinary-Specific Conditions
  'hip dysplasia', 'elbow dysplasia', 'degenerative myelopathy',
  'intervertebral disc disease', 'ivdd',
  'canine cognitive dysfunction', 'feline cognitive dysfunction',
  'chronic kidney disease in cats', 'hyperthyroidism in cats',
  'dilated cardiomyopathy', 'dcm', 'hypertrophic cardiomyopathy', 'hcm',
  'inflammatory bowel disease in dogs', 'pancreatitis in dogs',
  'atopic dermatitis in dogs', 'food allergy in dogs',
  'osteoarthritis in dogs', 'osteoarthritis in cats',
  'diabetes in dogs', 'diabetes in cats', 'feline diabetes',
  'hepatic lipidosis', 'cholangiohepatitis',
  'megaesophagus', 'exocrine pancreatic insufficiency', 'epi',
]);

// ============================================================================
// CONTEXT ENTITIES
// ============================================================================

/**
 * Known cell types
 * Source: Cell Ontology
 */
export const KNOWN_CELL_TYPES: Set<string> = new Set([
  // Blood Cells
  'erythrocyte', 'red blood cell', 'leukocyte', 'white blood cell',
  'neutrophil', 'eosinophil', 'basophil', 'monocyte', 'macrophage',
  'lymphocyte', 't cell', 't lymphocyte', 'b cell', 'b lymphocyte',
  'natural killer cell', 'nk cell', 'dendritic cell',
  'platelet', 'thrombocyte', 'megakaryocyte',
  'mast cell', 'plasma cell',
  
  // Immune Cells
  'helper t cell', 'cd4+ t cell', 'th1', 'th2', 'th17', 'treg',
  'cytotoxic t cell', 'cd8+ t cell', 'memory t cell',
  'regulatory t cell', 'gamma delta t cell',
  'm1 macrophage', 'm2 macrophage', 'microglia', 'kupffer cell',
  
  // Neurons & Glia
  'neuron', 'nerve cell', 'motor neuron', 'sensory neuron', 'interneuron',
  'dopaminergic neuron', 'serotonergic neuron', 'cholinergic neuron',
  'glutamatergic neuron', 'gabaergic neuron',
  'catecholaminergic neuron', 'noradrenergic neuron',
  'astrocyte', 'oligodendrocyte', 'schwann cell', 'microglial cell',
  
  // Muscle Cells
  'myocyte', 'muscle cell', 'cardiomyocyte', 'cardiac muscle cell',
  'skeletal muscle cell', 'smooth muscle cell', 'satellite cell',
  
  // Epithelial Cells
  'epithelial cell', 'endothelial cell', 'keratinocyte',
  'hepatocyte', 'liver cell', 'enterocyte', 'intestinal epithelial cell',
  'podocyte', 'tubular cell', 'alveolar cell', 'pneumocyte',
  
  // Connective Tissue
  'fibroblast', 'chondrocyte', 'osteocyte', 'osteoblast', 'osteoclast',
  'adipocyte', 'fat cell', 'brown adipocyte', 'white adipocyte',
  
  // Stem Cells
  'stem cell', 'mesenchymal stem cell', 'msc',
  'hematopoietic stem cell', 'neural stem cell',
  'induced pluripotent stem cell', 'ipsc',
  
  // Other Specialized Cells
  'beta cell', 'pancreatic beta cell', 'alpha cell', 'islet cell',
  'thyroid follicular cell', 'adrenal cell',
  'sertoli cell', 'leydig cell', 'granulosa cell',
]);

/**
 * Known cellular components and organelles
 */
export const KNOWN_CELL_COMPONENTS: Set<string> = new Set([
  // Organelles
  'mitochondria', 'mitochondrion', 'nucleus', 'endoplasmic reticulum', 'er',
  'golgi apparatus', 'golgi complex', 'lysosome', 'peroxisome',
  'ribosome', 'centrosome', 'centriole', 'cytoskeleton',
  
  // Membrane Structures
  'cell membrane', 'plasma membrane', 'nuclear membrane', 'nuclear envelope',
  'mitochondrial membrane', 'inner mitochondrial membrane', 'outer mitochondrial membrane',
  'endosome', 'autophagosome', 'phagosome', 'vesicle',
  
  // Other Components
  'cytoplasm', 'cytosol', 'nucleolus', 'chromatin',
  'sarcomere', 'myofibril', 'synaptic vesicle', 'synapse',
  'lipid droplet', 'glycogen granule',
]);

// ============================================================================
// REGEX PATTERNS FOR AUTOMATIC DETECTION
// ============================================================================

export const ENTITY_DETECTION_PATTERNS = {
  // Enzyme patterns
  enzyme: [
    /\b\w+ase\b/i,          // Words ending in -ase (kinase, lipase, etc.)
    /\bcox-?\d?\b/i,        // COX-1, COX-2
    /\blox\b/i,             // LOX
    /\bsirt\d?\b/i,         // SIRT1-7
    /\bcaspase-?\d+\b/i,    // Caspase-3, etc.
    /\bmmp-?\d+\b/i,        // MMP-1, MMP-9
    /\bcyp\d+\w*\b/i,       // CYP450 isoforms
  ],
  
  // Receptor patterns
  receptor: [
    /\b\w+\s*receptor\b/i,  // X receptor
    /\b\w+-?r\b/i,          // IL-6R, TNF-R
    /\btlr\d+\b/i,          // TLR1-10
    /\bppar-?[αβγ]?\b/i,    // PPAR family
    /\b5-?ht\d*[a-z]?\b/i,  // 5-HT receptors
  ],
  
  // Pathway patterns
  pathway: [
    /\b\w+\s*pathway\b/i,
    /\b\w+\s*signaling\b/i,
    /\b\w+\s*cascade\b/i,
    /\bnf-?κ?b\b/i,         // NF-κB, NFkB
    /\bampk\b/i,
    /\bmtor\b/i,
    /\bpi3k\b/i,
    /\bstat\d?\b/i,
  ],
  
  // Gene/Protein patterns
  gene_protein: [
    /\bil-?\d+\b/i,         // IL-1, IL-6, IL-10
    /\btnf-?α?\b/i,         // TNF-α
    /\bifn-?[αβγ]\b/i,      // IFN-γ
    /\bbdnf\b/i,
    /\bvegf\b/i,
    /\begf\b/i,
    /\bp\d{2,3}\b/i,        // p53, p21
    /\bbcl-?\d?\w?\b/i,     // Bcl-2, Bcl-xL
    /\bfoxo\d?\b/i,
  ],
  
  // Biological process patterns
  biological_process: [
    /\b\w+genesis\b/i,      // angiogenesis, neurogenesis
    /\b\w+lysis\b/i,        // glycolysis, lipolysis
    /\b\w+phagy\b/i,        // autophagy, mitophagy
    /\b\w+ptosis\b/i,       // apoptosis, necroptosis
    /\bsenescence\b/i,
    /\bhomeostasis\b/i,
    /\bmetabolism\b/i,
  ],
  
  // Condition patterns
  condition: [
    /\b\w+itis\b/i,         // arthritis, colitis
    /\b\w+osis\b/i,         // fibrosis, cirrhosis (but not apoptosis)
    /\b\w+pathy\b/i,        // neuropathy, myopathy
    /\b\w+emia\b/i,         // anemia, hyperlipidemia
    /\bdisease\b/i,
    /\bdisorder\b/i,
    /\bsyndrome\b/i,
    /\bcancer\b/i,
    /\btumor\b/i,
    /\bmalignancy\b/i,
  ],
};

// ============================================================================
// CLASSIFICATION HELPER FUNCTIONS
// ============================================================================

export interface EntityClassification {
  type: string;
  layer: string;
  confidence: number;
  matchedPattern?: string;
  matchedDictionary?: string;
}

/**
 * Layer mapping for entity types
 */
export const TYPE_TO_LAYER: Record<string, string> = {
  // Layer 0: Compounds
  'Nutraceutical': 'layer_0_compound',
  'Drug': 'layer_0_compound',
  'ChemicalCompound': 'layer_0_compound',
  'Compound': 'layer_0_compound',
  
  // Layer 1: Molecular Targets
  'Enzyme': 'layer_1_target',
  'Receptor': 'layer_1_target',
  'Pathway': 'layer_1_target',
  'GeneProtein': 'layer_1_target',
  'Target': 'layer_1_target',
  'TranscriptionFactor': 'layer_1_target',
  'Cytokine': 'layer_1_target',
  'GrowthFactor': 'layer_1_target',
  
  // Layer 2: Mechanisms
  'Mechanism': 'layer_2_mechanism',
  'SignalingCascade': 'layer_2_mechanism',
  'MolecularAction': 'layer_2_mechanism',
  
  // Layer 3: Biological Processes/Effects
  'BiologicalProcess': 'layer_3_effect',
  'BiologicalEffect': 'layer_3_effect',
  'PhysiologicalEffect': 'layer_3_effect',
  'Effect': 'layer_3_effect',
  'SideEffect': 'layer_3_effect',
  
  // Layer 4: Clinical Outcomes
  'Condition': 'layer_4_outcome',
  'Disease': 'layer_4_outcome',
  'ClinicalOutcome': 'layer_4_outcome',
  
  // Context
  'Cell': 'context',
  'CellType': 'context',
  'CellComponent': 'context',
  'Organelle': 'context',
  'Species': 'context',
  'Breed': 'context',
  'AgeGroup': 'context',
  'Tissue': 'context',
  'Organ': 'context',
  
  // Fallback
  'Entity': 'unknown',
  'Unknown': 'unknown',
};

/**
 * Classify an entity name using dictionaries and patterns
 */
export function classifyEntity(entityName: string): EntityClassification {
  const nameLower = entityName.toLowerCase().trim();
  const nameNormalized = nameLower.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  
  // 1. Check nutraceuticals dictionary (highest priority for known compounds)
  if (KNOWN_NUTRACEUTICALS.has(nameLower) || KNOWN_NUTRACEUTICALS.has(nameNormalized)) {
    return { type: 'Nutraceutical', layer: 'layer_0_compound', confidence: 0.95, matchedDictionary: 'nutraceuticals' };
  }
  
  // 2. Check drugs
  if (KNOWN_DRUGS.has(nameLower) || KNOWN_DRUGS.has(nameNormalized)) {
    return { type: 'Drug', layer: 'layer_0_compound', confidence: 0.95, matchedDictionary: 'drugs' };
  }
  
  // 3. Check enzymes
  if (KNOWN_ENZYMES.has(nameLower) || KNOWN_ENZYMES.has(nameNormalized)) {
    return { type: 'Enzyme', layer: 'layer_1_target', confidence: 0.95, matchedDictionary: 'enzymes' };
  }
  
  // 4. Check receptors
  if (KNOWN_RECEPTORS.has(nameLower) || KNOWN_RECEPTORS.has(nameNormalized)) {
    return { type: 'Receptor', layer: 'layer_1_target', confidence: 0.95, matchedDictionary: 'receptors' };
  }
  
  // 5. Check pathways
  if (KNOWN_PATHWAYS.has(nameLower) || KNOWN_PATHWAYS.has(nameNormalized)) {
    return { type: 'Pathway', layer: 'layer_1_target', confidence: 0.95, matchedDictionary: 'pathways' };
  }
  
  // 6. Check genes/proteins
  if (KNOWN_GENES_PROTEINS.has(nameLower) || KNOWN_GENES_PROTEINS.has(nameNormalized)) {
    return { type: 'GeneProtein', layer: 'layer_1_target', confidence: 0.95, matchedDictionary: 'genes_proteins' };
  }
  
  // 7. Check mechanisms
  if (KNOWN_MECHANISMS.has(nameLower) || KNOWN_MECHANISMS.has(nameNormalized)) {
    return { type: 'Mechanism', layer: 'layer_2_mechanism', confidence: 0.95, matchedDictionary: 'mechanisms' };
  }
  
  // 8. Check biological processes
  if (KNOWN_BIOLOGICAL_PROCESSES.has(nameLower) || KNOWN_BIOLOGICAL_PROCESSES.has(nameNormalized)) {
    return { type: 'BiologicalProcess', layer: 'layer_3_effect', confidence: 0.95, matchedDictionary: 'biological_processes' };
  }
  
  // 9. Check effects
  if (KNOWN_EFFECTS.has(nameLower) || KNOWN_EFFECTS.has(nameNormalized)) {
    return { type: 'BiologicalEffect', layer: 'layer_3_effect', confidence: 0.95, matchedDictionary: 'effects' };
  }
  
  // 10. Check conditions
  if (KNOWN_CONDITIONS.has(nameLower) || KNOWN_CONDITIONS.has(nameNormalized)) {
    return { type: 'Condition', layer: 'layer_4_outcome', confidence: 0.95, matchedDictionary: 'conditions' };
  }
  
  // 11. Check cell types
  if (KNOWN_CELL_TYPES.has(nameLower) || KNOWN_CELL_TYPES.has(nameNormalized)) {
    return { type: 'CellType', layer: 'context', confidence: 0.95, matchedDictionary: 'cell_types' };
  }
  
  // 12. Check cell components
  if (KNOWN_CELL_COMPONENTS.has(nameLower) || KNOWN_CELL_COMPONENTS.has(nameNormalized)) {
    return { type: 'CellComponent', layer: 'context', confidence: 0.95, matchedDictionary: 'cell_components' };
  }
  
  // 13. Use regex patterns for detection
  for (const [patternType, patterns] of Object.entries(ENTITY_DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(entityName)) {
        // Map pattern type to entity type
        const typeMapping: Record<string, { type: string; layer: string }> = {
          'enzyme': { type: 'Enzyme', layer: 'layer_1_target' },
          'receptor': { type: 'Receptor', layer: 'layer_1_target' },
          'pathway': { type: 'Pathway', layer: 'layer_1_target' },
          'gene_protein': { type: 'GeneProtein', layer: 'layer_1_target' },
          'biological_process': { type: 'BiologicalProcess', layer: 'layer_3_effect' },
          'condition': { type: 'Condition', layer: 'layer_4_outcome' },
        };
        
        // Exclude false positives: apoptosis, autophagy should be processes, not conditions
        if (patternType === 'condition' && /phagy|ptosis/i.test(entityName)) {
          continue; // Skip, let it be caught by biological_process
        }
        
        const mapping = typeMapping[patternType];
        if (mapping) {
          return { 
            type: mapping.type, 
            layer: mapping.layer, 
            confidence: 0.7, 
            matchedPattern: pattern.source 
          };
        }
      }
    }
  }
  
  // 14. Fallback: Unknown entity
  return { type: 'Entity', layer: 'unknown', confidence: 0.3 };
}

/**
 * Get all entities of a specific type for validation
 */
export function getEntitiesOfType(type: string): Set<string> {
  switch (type.toLowerCase()) {
    case 'nutraceutical': return KNOWN_NUTRACEUTICALS;
    case 'drug': return KNOWN_DRUGS;
    case 'enzyme': return KNOWN_ENZYMES;
    case 'receptor': return KNOWN_RECEPTORS;
    case 'pathway': return KNOWN_PATHWAYS;
    case 'geneprotein':
    case 'gene_protein': return KNOWN_GENES_PROTEINS;
    case 'mechanism': return KNOWN_MECHANISMS;
    case 'biologicalprocess':
    case 'biological_process': return KNOWN_BIOLOGICAL_PROCESSES;
    case 'biologicaleffect':
    case 'biological_effect':
    case 'effect': return KNOWN_EFFECTS;
    case 'condition':
    case 'disease': return KNOWN_CONDITIONS;
    case 'celltype':
    case 'cell_type':
    case 'cell': return KNOWN_CELL_TYPES;
    case 'cellcomponent':
    case 'cell_component': return KNOWN_CELL_COMPONENTS;
    default: return new Set();
  }
}

/**
 * Export statistics about the taxonomy
 */
export function getTaxonomyStats() {
  return {
    nutraceuticals: KNOWN_NUTRACEUTICALS.size,
    drugs: KNOWN_DRUGS.size,
    enzymes: KNOWN_ENZYMES.size,
    receptors: KNOWN_RECEPTORS.size,
    pathways: KNOWN_PATHWAYS.size,
    genes_proteins: KNOWN_GENES_PROTEINS.size,
    mechanisms: KNOWN_MECHANISMS.size,
    biological_processes: KNOWN_BIOLOGICAL_PROCESSES.size,
    effects: KNOWN_EFFECTS.size,
    conditions: KNOWN_CONDITIONS.size,
    cell_types: KNOWN_CELL_TYPES.size,
    cell_components: KNOWN_CELL_COMPONENTS.size,
    total: KNOWN_NUTRACEUTICALS.size + KNOWN_DRUGS.size + KNOWN_ENZYMES.size + 
           KNOWN_RECEPTORS.size + KNOWN_PATHWAYS.size + KNOWN_GENES_PROTEINS.size +
           KNOWN_MECHANISMS.size + KNOWN_BIOLOGICAL_PROCESSES.size + KNOWN_EFFECTS.size +
           KNOWN_CONDITIONS.size + KNOWN_CELL_TYPES.size + KNOWN_CELL_COMPONENTS.size,
  };
}
