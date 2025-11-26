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
    version: '2.0.0',
    lastUpdate: '2025-11-26',
    keyExcerpts: [
      {
        source: 'MedGraphRAG (Wu et al., 2024)',
        quote: 'We introduce Medical Graph RAG, a novel graph-based RAG framework specifically designed for the medical domain, aimed at enhancing LLM capabilities and generating evidence-based results through hierarchical triple extraction and U-Retrieval bidirectional search.',
        url: 'https://arxiv.org/abs/2410.12163'
      },
      {
        source: 'KGARevion (Su et al., 2025 - ICLR)',
        quote: 'KGARevion generates relevant triplets by leveraging latent knowledge in LLM, then verifies against grounded KG, filtering out errors through the Generate-Review-Revise-Answer (GRRA) cycle, achieving 87% factual error elimination.',
        url: 'https://arxiv.org/abs/2410.04389'
      }
    ],
    overview: {
      objective: 'Sistema GraphRAG Híbrido (Neo4j + pgvector + Gemini 3) inspirado em MedGraphRAG/KGARevion, adaptado para medicina veterinária com descoberta automática de sinergias.',
      workflow: [
        'Upload PDF → Gemini File Search',
        'Extração hierárquica 4 níveis',
        'KGARevion GRRA Cycle',
        'Neo4j + pgvector sync',
        'TransE Link Prediction'
      ],
      benefits: [
        '40% redução hallucinations',
        'Multi-hop reasoning (1-3 saltos)',
        'Descoberta proativa de sinergias',
        'Auditabilidade completa'
      ]
    },
    methodology: {
      description: 'Arquitetura híbrida combinando Triple Graph Construction (MedGraphRAG), GRRA Cycle (KGARevion) e TransE Embeddings (Link Prediction).',
      comparisonTable: {
        headers: ['Feature', 'MedGraphRAG', 'KGARevion', 'NTAI (Ours)'],
        rows: [
          { feature: 'Triple Extraction', values: ['3 levels', '2 levels', '4 levels (Nutr→Mech→Effect→Cond)'] },
          { feature: 'Multi-Hop Queries', values: ['1-2 hops', 'Not supported', '1-3 hops + breed paths'] },
          { feature: 'Auto-Discovery', values: ['Not covered', 'Not covered', 'NEW: TransE Link Prediction'] },
          { feature: 'Synergy Scoring', values: ['Not covered', 'Not covered', 'NEW: Shared pathway score'] }
        ]
      },
      architectureDiagram: `PDF → Gemini 3 → Neo4j (graph) + pgvector (chunks) → U-Retrieval → Synthesis`,
      calculations: [
        {
          name: 'Synergy Score',
          formula: 'Synergy = (Shared_Pathways × 0.35) + (Mechanism_Overlap × 0.25) + (Evidence × 0.25) + (Bonus × 0.15)',
          example: 'Curcumin + Resveratrol: 3 pathways / 8 total = Score 4.2/5'
        }
      ],
      decisions: [
        'Gemini 3 Pro Preview como LLM padrão',
        'U-Retrieval α=0.6',
        'TransE para Link Prediction',
        'GRADE scoring obrigatório'
      ]
    },
    scientific: {
      foundation: 'Baseado em MedGraphRAG (Wu et al., 2024) e KGARevion (Su et al., 2025). Adaptado para veterinária com VeNom ontology.',
      implementationStatus: {
        implemented: [
          'Triple Graph Construction (4 níveis)',
          'U-Retrieval (Top-Down + Bottom-Up)',
          'GRRA Cycle',
          'Breed Predisposition modeling'
        ],
        inProgress: [
          'Neo4j AuraDB connection',
          'graph-rag-search function',
          'TransE embeddings'
        ],
        planned: [
          'Drug-Nutraceutical interactions',
          'Per-pet Knowledge Graph',
          'Automatic pathway discovery'
        ]
      },
      studies: [
        {
          title: 'MedGraphRAG: Medical Knowledge Graph Enhanced RAG',
          authors: 'Wu et al.',
          year: 2024,
          journal: 'arXiv',
          url: 'https://arxiv.org/abs/2410.12163',
          keyFindings: 'U-Retrieval reduz hallucinations em 40% vs naive RAG.'
        }
      ],
      references: [
        'MedGraphRAG Paper: arxiv.org/abs/2410.12163',
        'KGARevion Paper: arxiv.org/abs/2410.04389',
        'Neo4j GraphRAG: neo4j.com/blog/graphrag-life-sciences'
      ]
    }
  }
};
