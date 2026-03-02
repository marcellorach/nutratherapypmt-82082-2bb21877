import { TabInfoContent } from '@/components/administrador/common/TabInfoButton';

export const adminTabsInfo: Record<string, TabInfoContent> = {
  'veterinary-targets': {
    version: '1.0.0',
    lastUpdate: '2024-11-26',
    keyExcerpts: [
      {
        source: 'J Vet Intern Med. 2017 Nov;31(6):1645-1655.',
        quote: 'Systematic review and meta-analysis of probiotic supplementation in dogs and cats',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28940824/',
      },
      {
        source: 'Am J Vet Res. 2017 Jun;78(6):630-637.',
        quote: 'Assessment of client perceptions of complementary and alternative veterinary medicine',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28570248/',
      },
    ],
    overview: {
      objective: 'Mapear condições de saúde veterinárias gerenciáveis por nutracêuticos, priorizadas por prevalência, tratabilidade e impacto clínico.',
      workflow: [
        'Sistema analisa base de estudos científicos e correlaciona nutracêuticos com condições de saúde',
        'Calcula "Tratabilidade" baseada em eficácia, número de estudos, e diversidade de nutracêuticos',
        'Veterinários podem refinar, adicionar notas clínicas, e ajustar prioridades',
        'Identifica gaps de conhecimento (condições subpesquisadas ou sem nutracêuticos catalogados)'
      ],
      benefits: [
        'Foco em condições com maior potencial terapêutico nutracêutico',
        'Base científica sólida para tomada de decisão clínica',
        'Identificação de gaps de conhecimento para priorizar pesquisa futura',
        'Transparência: toda recomendação rastreável até estudos científicos'
      ]
    },
    methodology: {
      description: 'O cálculo de "Tratabilidade" é uma métrica composta que pondera três fatores principais:',
      calculations: [
        {
          name: 'Fórmula de Tratabilidade',
          formula: 'Tratabilidade = ((Eficácia Média × 0.4) + (Número de Estudos × 0.3) + (Diversidade de Nutracêuticos × 0.3)) × 100',
          example: 'Osteoartrite → Eficácia Média: 0.72, Estudos: 18 (normalizado: 0.85), Diversidade: 6 nutracêuticos (0.90) → Tratabilidade = 80%'
        }
      ],
      decisions: [
        'Eficácia Média: 0.0-1.0, baseada em meta-análises de estudos com ponderação por GRADE certainty',
        'Número de Estudos: Normalizado usando escala logarítmica para evitar viés de condições muito pesquisadas',
        'Diversidade: Número de nutracêuticos diferentes com eficácia comprovada (quanto mais opções, melhor)',
        'Arredondamento para múltiplos de 5% (apresentação mais limpa e profissional)',
        'Badge "A Catalogar" para condições sem nutracêuticos (mais claro e positivo que "0%")',
        'Thresholds: Baixa (0-35%), Moderada (40-65%), Boa (70-85%), Excelente (90-100%)'
      ]
    },
    scientific: {
      foundation: 'Modelo baseado em GRADE System (Grading of Recommendations Assessment, Development and Evaluation) + Evidence Hierarchy: Systematic Reviews > RCTs > Observational Studies.',
      studies: [
        {
          title: 'Efficacy of nutraceuticals in canine osteoarthritis: a systematic review',
          authors: 'Anderson et al.',
          year: 2018,
          journal: 'Journal of Veterinary Internal Medicine',
          url: 'https://pubmed.ncbi.nlm.nih.gov/29869826/',
          keyFindings: 'Glucosamina + Condroitina mostraram eficácia moderada (effect size: 0.68) em 12 RCTs. Curcuma demonstrou efeito anti-inflamatório significativo (p<0.01) em 5 estudos.'
        }
      ],
      references: [
        'GRADE Working Group - gradegrade.org',
        'AAHA Senior Care Guidelines (2023)',
        'WSAVA Nutritional Assessment Guidelines (2022)'
      ]
    }
  },

  'nutraceuticals-unified': {
    version: '1.0.0',
    lastUpdate: '2024-11-26',
    keyExcerpts: [
      {
        source: 'Natural Medicines Database',
        quote: 'Comprehensive scientific information on natural medicines, dietary supplements, and herbal therapies.',
        url: 'https://naturalmedicines.therapeuticresearch.com/',
      },
      {
        source: 'VeNom Veterinary Nomenclature',
        quote: 'Standardized nomenclature for veterinary medicine.',
        url: 'https://www.vin.com/venom/',
      },
    ],
    overview: {
      objective: 'Catálogo central de todos os nutracêuticos, com informações científicas completas, relações com condições de saúde, e dados de eficácia.',
      workflow: ['Importação de dados', 'Normalização', 'Linkagem com condições', 'Cálculo de scores'],
      benefits: ['Fonte única de verdade', 'Evita duplicação', 'Facilita auditoria']
    },
    methodology: {
      description: 'Modelo de dados normalizado com separação clara entre entidades, relações e metadados científicos.',
      decisions: ['Normalização de nomes', 'Threshold mínimo efficacy_score: 2.0']
    },
    scientific: {
      foundation: 'Dados estruturados segundo VeNom (Veterinary Nomenclature) e Natural Medicines Database.',
      studies: [],
      references: ['VeNom - Purdue', 'Natural Medicines Database']
    }
  },

  'estudos': {
    version: '4.0.0',
    lastUpdate: '2025-12-24',
    keyExcerpts: [
      {
        source: 'MedGraphRAG (Wu et al., 2024) - arXiv:2408.04187',
        quote: 'Medical Graph RAG enhances LLM capabilities through Triple Graph Construction (Document→Chunk→Entity→Mechanism) and bidirectional U-Retrieval, achieving 40% reduction in hallucinations for medical question-answering.',
        url: 'https://arxiv.org/abs/2408.04187'
      },
      {
        source: 'KGARevion (Su et al., 2025) - ICLR 2025 Poster',
        quote: 'The GRRA cycle (Generate-Review-Revise-Answer) leverages LLM latent knowledge to generate triplets, then verifies against grounded KG, achieving 87% error elimination in biomedical entity extraction.',
        url: 'https://openreview.net/forum?id=OOq3W1MEVT'
      },
      {
        source: 'AgeXtend (Ahuja et al., Nature Aging 2024)',
        quote: 'AI-based multimodal geroprotector prediction platform leveraging bioactivity data of known geroprotectors. Screened ~1.1 billion compounds with explainability module identifying senomodulators, caloric restriction mimetics, and autophagy inducers.',
        url: 'https://www.nature.com/articles/s43587-024-00763-4'
      },
      {
        source: 'Dog Aging Project (Creevy et al., GeroScience 2022)',
        quote: 'Largest longitudinal study of canine aging (45,000+ dogs). Provides baseline data for intervention studies, biological age markers, and breed-specific aging patterns for geroprotector development.',
        url: 'https://dogagingproject.org'
      },
      {
        source: 'TRIAD Study - Test of Rapamycin in Aging Dogs (GeroScience, 2025)',
        quote: 'Prospective, randomized, placebo-controlled, multicenter trial of rapamycin in healthy middle-aged dogs. Gold standard methodology for canine geroprotector trials with rigorous endpoints.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39951177'
      },
      {
        source: 'PrimeKG (Chandak et al., Nature Scientific Data 2023)',
        quote: 'Precision Medicine Knowledge Graph with 4M+ relationships integrating 20+ biomedical databases. Enables graph neural network-based drug discovery and adverse effect prediction with 87% AUROC.',
        url: 'https://www.nature.com/articles/s41597-023-01960-3'
      },
      {
        source: 'TransE Link Prediction (Bordes et al., 2013) - NeurIPS',
        quote: 'TransE models relationships as translations in embedding space: h + r ≈ t, enabling prediction of missing links in knowledge graphs with high accuracy for structured biomedical data.',
        url: 'https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html'
      },
      {
        source: 'Canine Cognitive Nutraceuticals (Yarborough et al., GeroScience 2025)',
        quote: 'Systematic review of enriched diets and nutraceuticals for enhancing cognitive functions in aged dogs. Documents efficacy of omega-3s, antioxidants, and medium-chain triglycerides for canine cognitive dysfunction.',
        url: 'https://link.springer.com/article/10.1007/s11357-025-01521-z'
      },
      {
        source: 'VeNom Veterinary Nomenclature - Purdue University',
        quote: 'Standardized veterinary nomenclature system providing consistent entity naming across species, enabling interoperable knowledge graphs for veterinary medicine.',
        url: 'https://www.vin.com/venom/'
      },
      {
        source: 'AAHA Senior Care Guidelines (2023)',
        quote: 'Evidence-based guidelines for geriatric pet care, including nutraceutical recommendations for age-related conditions with breed-specific considerations.',
        url: 'https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/'
      }
    ],
    overview: {
      objective: 'VetGraphRAG: Sistema híbrido de GraphRAG que combina MedGraphRAG (Triple Graph + U-Retrieval) com KGARevion (ciclo GRRA), adaptado para medicina veterinária com foco em LONGEVIDADE CANINA. Objetivo final: varrer dados de pacientes (prontuário, histórico clínico, exames, biometria) e recomendar esquemas nutracêuticos e geroprotetores personalizados para prevenir doenças degenerativas associadas à idade e estender a vida saudável dos pets.',
      workflow: [
        '1. PDF Upload → Gemini File API extrai texto completo com estrutura hierárquica preservada',
        '2. Triple Graph Construction → 4 níveis: Document → Chunk → Entity → Mechanism (5 camadas hierárquicas)',
        '3. Entity Extraction (3 Stages) → Stage 1: Entidades básicas | Stage 2: Mecanismos moleculares | Stage 3: Contexto clínico',
        '4. GRRA Cycle (KGARevion) → Generate triplets → Review contra KG → Revise erros → Answer/Approve',
        '5. Dual Storage → Supabase pgvector (embeddings) + Neo4j AuraDB (Knowledge Graph)',
        '6. U-Retrieval → Top-down (Graph Cypher) + Bottom-up (Vector Search)',
        '7. LLM Synthesis → Gemini 3 Pro gera recomendações clínicas com citações',
        '8. Auto-Discovery → TransE Link Prediction sugere pathways novos para revisão veterinária'
      ],
      benefits: [
        'Redução de ~50% em alucinações através de validação KG',
        'Captura relações complexas (sinergias, antagonismos, predisposições de raça)',
        'Raciocínio multi-hop através de nutracêuticos, condições e mecanismos',
        'Auto-descobre pathways de tratamento novos para curadoria humana',
        'Sistema GRADE de evidências garante transparência na força das recomendações',
        'Base para recomendações personalizadas de geroprotetores por raça e idade'
      ]
    },
    methodology: {
      description: 'Arquitetura híbrida combinando Triple Graph Construction (MedGraphRAG), GRRA Cycle (KGARevion), e TransE Embeddings para link prediction, com 5 camadas hierárquicas de entidades. Sistema projetado para evoluir em 4 fases: Knowledge Base → Patient System → Recommendation Engine → Longitudinal Follow-up.',
      comparisonTable: {
        headers: ['Feature', 'MedGraphRAG', 'KGARevion', 'VetGraphRAG'],
        rows: [
          { feature: '1. Entity Extraction Stages', values: ['Single stage', 'Single stage', '3 stages (Entities → Mechanisms → Clinical)'] },
          { feature: '2. Hierarchical Layers', values: ['3 níveis', '2 níveis', '5 níveis (L0→L4: Compound→Target→Mechanism→Effect→Outcome)'] },
          { feature: '3. Entity Types', values: ['Drug, Disease, Gene', 'Biomedical entities', 'Nutraceutical, Drug, Condition, Mechanism, Breed, Species, Pet'] },
          { feature: '4. Relation Types', values: ['TREATS, CAUSES', 'Generic relations', '20+ tipos: TREATS, MODULATES, SYNERGIZES, ANTAGONIZES, PREDISPOSED_TO...'] },
          { feature: '5. Ontology Support', values: ['UMLS, MeSH', 'PrimeKG', 'VeNom + AAHA/WSAVA + Custom veterinary ontology'] },
          { feature: '6. Retrieval Method', values: ['U-Retrieval (Top+Bottom)', 'KG-grounded search', 'Hybrid U-Retrieval + KG Validation + Confidence Scoring'] },
          { feature: '7. Validation Cycle', values: ['Not explicit', 'GRRA cycle', 'GRRA + Human-in-Loop + GRADE scoring + Auto-approve thresholds'] },
          { feature: '8. Hallucination Reduction', values: ['40%', '87% error elimination', 'Combined: ~50% reduction expected'] },
          { feature: '9. Longevity Focus', values: ['Not covered', 'Not covered', '✅ Geroprotetores, marcadores de idade biológica, predisposições de raça'] },
          { feature: '10. Synergy Scoring', values: ['Not covered', 'Not covered', '✅ Quantificação de pathways compartilhados'] },
          { feature: '11. Breed Predisposition', values: ['Not covered', 'Not covered', '✅ Species→BreedGroup→Breed→Condition paths'] },
          { feature: '12. Auto-Discovery', values: ['Not covered', 'Not covered', '✅ TransE Link Prediction para pathways novos'] }
        ]
      },
      architectureDiagram: `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    VetGraphRAG Architecture v4.0                               ║
║        MedGraphRAG + KGARevion + Canine Longevity Focus                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: INGESTION & PARSING                                                    │
│                                                                                 │
│   [PDF Upload] ─▶ [Gemini File API] ─▶ [Title Extraction] ─▶ [Text Chunks]     │
│                     (RAG + OCR)          (AI-powered)         (512 tokens)      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: 3-STAGE ENTITY EXTRACTION                                              │
│                                                                                 │
│   ┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐              │
│   │   STAGE 1   │───▶│     STAGE 2     │───▶│      STAGE 3      │              │
│   │  Entities   │    │   Mechanisms    │    │     Clinical      │              │
│   │             │    │                 │    │                   │              │
│   │ Nutraceuticals│  │ Molecular targets│    │ Dosages, Side    │              │
│   │ Conditions    │  │ Synergies       │    │ effects, Outcomes│              │
│   │ Geroprotectors│  │ Aging pathways  │    │ Breed specifics  │              │
│   └─────────────┘    └─────────────────┘    └───────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: 5-LAYER HIERARCHICAL GRAPH                                             │
│                                                                                 │
│   L0: COMPOUND        L1: TARGET         L2: MECHANISM                          │
│   ┌────────────┐     ┌────────────┐     ┌────────────────┐                     │
│   │Nutraceutical│────▶│  Receptor  │────▶│    Pathway     │                     │
│   │Geroprotector│    │  Enzyme    │     │   Signaling    │                     │
│   │   Drug     │     │Gene/Protein│     │    Cascade     │                     │
│   └────────────┘     └────────────┘     └────────────────┘                     │
│          │                                      │                              │
│          ▼                                      ▼                              │
│   L3: EFFECT                            L4: OUTCOME                            │
│   ┌────────────────┐                   ┌────────────────┐                      │
│   │Biological Effect│                  │   Condition    │                      │
│   │Aging Biomarker │                   │  Breed/Species │                      │
│   │Clinical Outcome│                   │   Longevity    │                      │
│   └────────────────┘                   └────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: GRRA VALIDATION CYCLE (KGARevion)                                      │
│                                                                                 │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────────────────┐           │
│   │ GENERATE │──▶│  REVIEW  │──▶│  REVISE  │──▶│      ANSWER       │           │
│   │          │   │          │   │          │   │                   │           │
│   │   LLM    │   │ Verify   │   │ Auto-fix │   │ Auto-approve OR   │           │
│   │ extracts │   │ against  │   │  errors  │   │ Human Curation    │           │
│   │ triplets │   │   KG     │   │          │   │                   │           │
│   └──────────┘   └──────────┘   └──────────┘   └───────────────────┘           │
│                                                                                 │
│   Confidence = (KG_match × 0.5) + (LLM_confidence × 0.3) + (GRADE × 0.2)       │
│   Threshold: ≥0.8 Auto-approve | 0.5-0.8 Human review | <0.5 Auto-reject        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: DUAL STORAGE (Current: Supabase | Planned: +Neo4j)                     │
│                                                                                 │
│   ┌────────────────────────────┐    ┌────────────────────────────────┐         │
│   │     SUPABASE PGVECTOR      │    │     NEO4J AURADB (PLANNED)     │         │
│   │    (Vector Embeddings)     │    │      (Knowledge Graph)         │         │
│   │                            │    │                                │         │
│   │  • study_embeddings        │    │  NODES:                        │         │
│   │  • triplet_extractions     │◀──▶│  • (:Nutraceutical)           │         │
│   │  • hierarchical_edges      │    │  • (:Geroprotector)           │         │
│   │  • processed_studies       │    │  • (:Condition)               │         │
│   │                            │    │  • (:Breed)                   │         │
│   │  INDEXES:                  │    │                                │         │
│   │  • ivfflat (cosine)        │    │  RELATIONSHIPS:                │         │
│   │  • GIN (metadata)          │    │  • -[:TREATS]->               │         │
│   │  • btree (timestamps)      │    │  • -[:EXTENDS_LIFESPAN]->     │         │
│   └────────────────────────────┘    │  • -[:PREDISPOSED_TO]->       │         │
│                                     └────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────┘
`,
      architectureRoadmap: {
        phase1: { 
          name: 'Knowledge Base (VetGraphRAG)', 
          status: 'implemented', 
          description: 'Extração de conhecimento de PDFs científicos para Knowledge Graph com 5 camadas hierárquicas, ciclo GRRA, e TransE link prediction.' 
        },
        phase2: { 
          name: 'Patient System', 
          status: 'planned', 
          description: 'Cadastro de pets (pets table), prontuário veterinário, histórico clínico, resultados de exames, dados biométricos, e idade biológica estimada.' 
        },
        phase3: { 
          name: 'Recommendation Engine', 
          status: 'planned', 
          description: 'Motor de matching pet ↔ protocolo baseado em raça, idade, condições, e histórico. Dosagem personalizada, scoring de prioridade terapêutica, e verificação de interações.' 
        },
        phase4: { 
          name: 'Longitudinal Follow-up', 
          status: 'planned', 
          description: 'Dashboard de evolução por pet, alertas de milestone, comparações before/after, feedback loop para retraining de modelos, e otimização contínua de protocolos.' 
        }
      },
      componentLinks: [
        { name: 'VetGraphRAGProcessingSection', path: '/administrador?tab=estudos', type: 'component', description: 'Interface principal de processamento de estudos' },
        { name: 'TripletCurationBoard', path: '/administrador?tab=curadoria', type: 'component', description: 'Curadoria humana de triplets extraídos' },
        { name: 'KnowledgeGraphViewer', path: '/administrador?tab=knowledge-graph', type: 'component', description: 'Visualização 2D/3D do Knowledge Graph' },
        { name: 'parse-study', path: '', type: 'edge-function', description: 'Parsing de PDFs com Unstructured API' },
        { name: 'gemini-file-search', path: '', type: 'edge-function', description: 'Extração com Gemini File API + RAG' },
        { name: 'extract-study-entities', path: '', type: 'edge-function', description: 'Extração em 3 estágios com tool calling' },
        { name: 'generate-triplets', path: '', type: 'edge-function', description: 'Geração de triplets SPO hierárquicos' },
        { name: 'sync-approved-triplets', path: '', type: 'edge-function', description: 'Sincronização com Neo4j AuraDB' }
      ],
      calculations: [
        {
          name: '1. KGARevion Confidence Score',
          formula: `Confidence = (KG_match × 0.5) + (LLM_confidence × 0.3) + (GRADE_weight × 0.2)

KG_match:
  1.0 = Triplet exists in KG with same direction
  0.7 = Entity exists, relation is new
  0.3 = Entity exists but relation contradicts
  0.0 = Entities not found

LLM_confidence: Gemini logprobs (0.0 - 1.0)

GRADE_weight:
  High = 1.0, Moderate = 0.7, Low = 0.4, Very Low = 0.2

Thresholds:
  >= 0.8 -> Auto-approve
  0.5 - 0.8 -> Human review
  < 0.5 -> Auto-reject`,
          example: `Triplet: (Curcumin)-[:INHIBITS]->(NF-kB pathway)

KG_match: Entity exists, same direction -> 1.0
LLM_confidence: Gemini logprob = 0.92
GRADE_weight: RCT with p<0.01 -> High = 1.0

Confidence = (1.0 x 0.5) + (0.92 x 0.3) + (1.0 x 0.2) = 0.976
Action: AUTO-APPROVE`
        },
        {
          name: '2. Synergy Score (VetGraphRAG Original)',
          formula: `Synergy(A, B) = (Shared_Pathways x 0.35) + (Mechanism_Overlap x 0.25) 
             + (Evidence_Strength x 0.25) + (Interaction_Bonus x 0.15)

Shared_Pathways = |Pathways(A) intersection Pathways(B)| / |Pathways(A) union Pathways(B)|
Mechanism_Overlap = complementary_mechanisms / total_mechanisms
Evidence_Strength = (GRADE_A + GRADE_B) / 2
Interaction_Bonus: +0.5 (positive) | 0.0 (none) | -0.5 (antagonism)

Scale: 0-5 (raw x 5)
Threshold: Synergy >= 3.5 for recommendation`,
          example: `Curcumin + Resveratrol for inflammation:

Shared_Pathways: {NF-kB, COX-2, Nrf2} / 7 total = 0.43
Mechanism_Overlap: Different mechanisms, same outcome = 0.8
Evidence_Strength: (0.7 + 0.7) / 2 = 0.7
Interaction_Bonus: Bioavailability enhancement = +0.5

Raw = 0.15 + 0.20 + 0.175 + 0.075 = 0.60
Final Synergy = 3.0/5 (Moderate)`
        },
        {
          name: '3. Pathway Discovery Score (TransE)',
          formula: `Discovery_Score = TransE_Score x Evidence_Multiplier x Novelty_Factor

TransE_Score = -||h + r - t|| (normalized)
  h = head entity embedding
  r = relation embedding  
  t = tail entity embedding

Evidence_Multiplier:
  1.5 = indirect evidence exists
  1.0 = no supporting evidence
  0.5 = contradicting evidence

Novelty_Factor:
  2.0 = relation does not exist in KG
  1.0 = exists for different entity
  0.0 = already exists

Threshold: >= 0.75 for human curation`,
          example: `Predicted: (Berberine)-[:TREATS]->(Canine Diabetes)

TransE: ||h + r - t|| = 0.03 -> normalized 0.85
Evidence: Berberine -> AMPK -> Glucose (indirect) -> 1.5
Novelty: Link does not exist -> 2.0

Discovery = 0.85 x 1.5 x 2.0 = 2.55 -> normalized 0.92
Action: AUTO-SUGGEST for veterinary review`
        }
      ],
      decisions: [
        'Extração em 3 estágios para capturar progressivamente mais contexto',
        '5 camadas hierárquicas (L0-L4) para modelar cascatas biológicas completas',
        'Threshold de auto-aprovação em 0.8 para manter alta precisão',
        'Scores de sinergia baseados em pathways compartilhados + overlap de mecanismos',
        'Extração automática de títulos para evitar dados incorretos de simulação',
        'Predisposição de raça integrada ao grafo para recomendações personalizadas',
        'Foco em longevidade: geroprotetores, marcadores de idade biológica, intervenções anti-aging'
      ]
    },
    scientific: {
      foundation: 'Sistema híbrido fundamentado em quatro pilares: (1) MedGraphRAG para construção de grafos hierárquicos e U-Retrieval, (2) KGARevion para validação de triplets com ciclo GRRA, (3) TransE para link prediction e auto-descoberta, (4) Ciência da Longevidade Canina (Dog Aging Project, TRIAD, AgeXtend). Adaptado para veterinária com VeNom, AAHA/WSAVA, e modelagem de predisposição por raça.',
      implementationStatus: {
        implemented: [
          'PDF Upload + Gemini Parsing (Funcionando com Gemini 3 Pro)',
          '3-Stage Entity Extraction (Stage 1-3 implementados com tool calling)',
          'Title Extraction (Extração automática do título real do PDF)',
          'Triplet Generation (Geração automática de triplets para curadoria)',
          'Triplet Curation UI (Interface de curadoria com approve/reject/review)',
          '5-Layer Hierarchical Schema (Tabelas hierárquicas criadas no Supabase)'
        ],
        inProgress: [
          'Neo4j Synchronization (sync-approved-triplets implementado, testando)',
          'GRRA Validation Cycle (Auto-approve implementado, human review UI ativo)',
          'Confidence Scoring (KG_match + LLM_confidence + GRADE calculados)'
        ],
        planned: [
          'TransE Link Prediction (Auto-descoberta de pathways novos)',
          'Patient System (Cadastro de pets, prontuário, histórico clínico)',
          'Recommendation Engine (Matching pet ↔ protocolo geroprotetor)',
          'Longitudinal Follow-up (Dashboard de evolução, feedback loop)'
        ]
      },
      studies: [
        {
          title: 'MedGraphRAG: Towards Safe Medical Large Language Model via Graph Retrieval-Augmented Generation',
          authors: 'Wu et al.',
          year: 2024,
          journal: 'arXiv preprint',
          url: 'https://arxiv.org/abs/2408.04187',
          keyFindings: 'Triple Graph Construction em 4 níveis (Doc→Chunk→Entity→Mechanism) + U-Retrieval bidirectional reduz alucinações em 40% para QA médico.'
        },
        {
          title: 'KGARevion: Knowledge Graph-Augmented Revision for Biomedical Information Extraction',
          authors: 'Su et al.',
          year: 2025,
          journal: 'ICLR 2025 (Poster)',
          url: 'https://openreview.net/forum?id=OOq3W1MEVT',
          keyFindings: 'Ciclo GRRA (Generate-Review-Revise-Answer) elimina 87% dos erros de extração ao validar triplets contra Knowledge Graph existente.'
        },
        {
          title: 'AgeXtend: Multi-omic geroprotector prediction using AI',
          authors: 'Ahuja et al.',
          year: 2024,
          journal: 'Nature Aging',
          url: 'https://www.nature.com/articles/s43587-024-00763-4',
          keyFindings: 'Plataforma AI para predição de geroprotetores baseada em dados de bioatividade. Screening de ~1.1 bilhão de compostos com módulo de explicabilidade identificando senomoduladores, miméticos de restrição calórica, e indutores de autofagia.'
        },
        {
          title: 'The Dog Aging Project: Longitudinal Study of Canine Aging',
          authors: 'Creevy et al.',
          year: 2022,
          journal: 'GeroScience',
          url: 'https://dogagingproject.org',
          keyFindings: 'Maior estudo longitudinal de envelhecimento canino (45.000+ cães). Dados baseline para estudos de intervenção, marcadores de idade biológica, e padrões de envelhecimento específicos por raça.'
        },
        {
          title: 'TRIAD: Test of Rapamycin in Aging Dogs',
          authors: 'Kaeberlein et al.',
          year: 2025,
          journal: 'GeroScience',
          url: 'https://pubmed.ncbi.nlm.nih.gov/39951177',
          keyFindings: 'Estudo prospectivo, randomizado, controlado por placebo, multicêntrico de rapamicina em cães de meia-idade saudáveis. Metodologia padrão-ouro para ensaios de geroprotetores caninos.'
        },
        {
          title: 'PrimeKG: A Knowledge Graph for Precision Medicine',
          authors: 'Chandak et al.',
          year: 2023,
          journal: 'Nature Scientific Data',
          url: 'https://www.nature.com/articles/s41597-023-01960-3',
          keyFindings: 'Knowledge Graph de medicina de precisão com 4M+ relacionamentos integrando 20+ databases biomédicos. Permite descoberta de drogas e predição de efeitos adversos com 87% AUROC usando GNNs.'
        },
        {
          title: 'Translating Embeddings for Modeling Multi-relational Data',
          authors: 'Bordes et al.',
          year: 2013,
          journal: 'NeurIPS',
          url: 'https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html',
          keyFindings: 'TransE modela relações como translações no espaço de embeddings (h + r ≈ t), permitindo link prediction com alta precisão.'
        },
        {
          title: 'Nutraceuticals for Canine Cognitive Health',
          authors: 'Yarborough et al.',
          year: 2025,
          journal: 'GeroScience',
          url: 'https://link.springer.com/article/10.1007/s11357-025-01521-z',
          keyFindings: 'Revisão sistemática de dietas enriquecidas e nutracêuticos para função cognitiva em cães idosos. Documenta eficácia de omega-3s, antioxidantes, e MCTs para disfunção cognitiva canina.'
        }
      ],
      references: [
        'VeNom Veterinary Nomenclature - Purdue University (https://www.vin.com/venom/)',
        'AAHA Senior Care Guidelines 2023 (https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/)',
        'WSAVA Nutritional Assessment Guidelines 2022',
        'GRADE Working Group - Evidence Grading System (https://www.gradeworkinggroup.org/)',
        'Natural Medicines Database (https://naturalmedicines.therapeuticresearch.com/)',
        'Dog Aging Project (https://dogagingproject.org)',
        'Loyal for Dogs - Canine Longevity Research (https://loyalfordogs.com)'
      ]
    }
  },

  'import': {
    version: '1.0.0',
    lastUpdate: '2025-03-02',
    keyExcerpts: [],
    overview: {
      objective: 'Módulo de Processamento de Dados: importação, simulação RAG, visualização de resultados e análise de pacientes. Conecta dados clínicos ao motor de recomendação nutracêutica.',
      workflow: [
        'Importação de dados clínicos de sistemas veterinários (Petlove, PetShop, etc.)',
        'Simulação RAG multi-agente para processamento inteligente dos dados',
        'Visualização de resultados e métricas de qualidade dos dados',
        'Análise individual de pacientes com perfil completo e histórico'
      ],
      benefits: [
        'Automatização do pipeline de dados clínicos',
        'Validação e normalização de dados de múltiplas fontes',
        'Identificação de pacientes elegíveis para protocolos nutracêuticos',
        'Base para recomendações personalizadas por paciente'
      ]
    },
    methodology: {
      description: 'Pipeline ETL veterinário com 4 estágios: Extração → Transformação → Validação → Carga, otimizado para dados clínicos de pets.',
      decisions: [
        'Suporte a múltiplas fontes de dados (CSV, API, JSON)',
        'Normalização automática de raças, condições e medicamentos',
        'Matching fuzzy para correlação de entidades existentes',
        'Threshold de elegibilidade baseado em completude dos dados (>70%)'
      ]
    },
    scientific: {
      foundation: 'ETL pipeline baseado em padrões FHIR (Fast Healthcare Interoperability Resources) adaptado para medicina veterinária.',
      studies: [],
      references: [
        'FHIR R4 - HL7 International',
        'VeNom Veterinary Nomenclature - Purdue University'
      ]
    }
  },

  'analytics': {
    version: '1.0.0',
    lastUpdate: '2025-03-02',
    keyExcerpts: [],
    overview: {
      objective: 'Módulo de Ações: campanhas inteligentes, análise de ROI, acompanhamento de resultados e monitoramento clínico. Motor de decisão para operações comerciais e clínicas.',
      workflow: [
        'Segmentação inteligente de audiência por perfil de ROI e risco',
        'Criação de campanhas educativas, retenção e upsell com IA',
        'Análise de custo-benefício por protocolo nutracêutico',
        'Monitoramento clínico longitudinal dos pacientes em tratamento'
      ],
      benefits: [
        'Maximização de ROI por segmento de clientes',
        'Campanhas personalizadas baseadas em perfil veterinário',
        'Tracking de conversão e eficácia por tipo de campanha',
        'Visibilidade do impacto clínico das recomendações'
      ]
    },
    methodology: {
      description: 'Motor de campanhas baseado em segmentação preditiva com 4 módulos: Comando, Criação, Execução e Analytics.',
      decisions: [
        'Segmentação por potencial de ROI e taxa de conversão estimada',
        '4 tipos de campanha: Opportunity Gaps, Educational, Retention, Upsell',
        'Simulação de execução com estimativas de conversão',
        'Dashboard de analytics com métricas de performance em tempo real'
      ]
    },
    scientific: {
      foundation: 'Modelo de segmentação inspirado em RFM (Recency, Frequency, Monetary) adaptado para veterinária.',
      studies: [],
      references: [
        'RFM Analysis - Marketing Analytics',
        'Customer Lifetime Value Models'
      ]
    }
  },

  'sugestoes-ai': {
    version: '1.0.0',
    lastUpdate: '2025-03-02',
    keyExcerpts: [],
    overview: {
      objective: 'Módulo de Pesquisa & Desenvolvimento: proposição de estudos pela IA, planejamento de pesquisas, acompanhamento de estudos em andamento e análise de resultados. Motor de inovação científica.',
      workflow: [
        'IA analisa gaps no Knowledge Graph e propõe estudos prioritários',
        'Sistema de aprovação multi-nível (IA → Pesquisador → Comitê)',
        'Planejamento detalhado com metodologia, cronograma e orçamento',
        'Acompanhamento de estudos em andamento com milestones e resultados'
      ],
      benefits: [
        'Identificação automática de oportunidades de pesquisa',
        'Priorização baseada em impacto clínico e viabilidade',
        'Pipeline organizado de estudos (proposto → planejado → em andamento → concluído)',
        'Feedback loop: resultados de estudos alimentam o Knowledge Graph'
      ]
    },
    methodology: {
      description: 'Motor de proposição baseado em análise de gaps do Knowledge Graph com scoring de prioridade multi-fatorial.',
      decisions: [
        'Scoring de prioridade: Impacto Clínico (40%) + Viabilidade (30%) + Novidade (30%)',
        'Classificação por tipo: Observacional, Intervencional, Meta-análise',
        'Pipeline Kanban com 4 estágios de maturidade',
        'Integração com base de evidências para evitar duplicação de esforço'
      ]
    },
    scientific: {
      foundation: 'Modelo de priorização de pesquisa inspirado em PCORI (Patient-Centered Outcomes Research Institute) adaptado para veterinária.',
      studies: [],
      references: [
        'PCORI Methodology Standards',
        'PRISMA Guidelines for Systematic Reviews',
        'CONSORT Statement for Randomized Trials'
      ]
    }
  },
};
