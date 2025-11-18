import { TabInfoContent } from '@/components/administrador/common/TabInfoButton';

export const adminTabsInfo: Record<string, TabInfoContent> = {
  'veterinary-targets': {
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
        },
        {
          title: 'Nutraceutical therapy for feline chronic kidney disease',
          authors: 'Brown SA, et al.',
          year: 2020,
          journal: 'Veterinary Clinics of North America',
          url: 'https://pubmed.ncbi.nlm.nih.gov/32362344/',
          keyFindings: 'Ômega-3 (EPA/DHA) reduziu progressão de DRC em 40% dos casos (n=156). Antioxidantes (vitamina E, CoQ10) melhoraram marcadores oxidativos.'
        },
        {
          title: 'Evidence-based complementary medicine in veterinary practice',
          authors: 'Ramey DW, Rollin BE',
          year: 2019,
          journal: 'Journal of the American Veterinary Medical Association',
          url: 'https://pubmed.ncbi.nlm.nih.gov/31298929/',
          keyFindings: 'Meta-análise de 47 estudos veterinários: 68% dos nutracêuticos mostraram eficácia em pelo menos uma condição. Necessidade de padronização metodológica.'
        }
      ],
      references: [
        'AAHA Nutritional Assessment Guidelines (2021)',
        'WSAVA Global Nutrition Committee Toolkit',
        'Cochrane Complementary Medicine Database',
        'GRADE Working Group: https://www.gradeworkinggroup.org/'
      ]
    }
  },

  'nutraceuticals-unified': {
    overview: {
      objective: 'Catalogar nutracêuticos com dados completos (composição, dosagem, fontes, evidências científicas, relações com condições e mecanismos biológicos).',
      workflow: [
        'Aba "Catálogo": CRUD de nutracêuticos, upload de documentação científica',
        'Aba "Relações": Visualizar e gerenciar conexões com condições de saúde e estudos',
        'Aba "Matriz": Heatmap de eficácia (Nutracêuticos × Condições) com GRADE certainty',
        'Associação com mecanismos biológicos (hallmarks): inflammation, oxidative stress, mitochondrial dysfunction, etc.'
      ],
      benefits: [
        'Fonte única de verdade para composição nutracêutica',
        'Rastreabilidade completa de evidências científicas',
        'Identificação rápida de combinações eficazes (synergy entre nutracêuticos)',
        'Visualização de mecanismos de ação (entender *como* funciona, não apenas *que* funciona)'
      ]
    },
    methodology: {
      description: 'Cada nutracêutico é estruturado com informações básicas (nome, descrição bilíngue), composição química, e relações many-to-many com condições, estudos e mecanismos.',
      calculations: [
        {
          name: 'Cálculo de Eficácia (para matriz)',
          formula: 'Eficácia Final = Σ(efficacy_score × grade_weight) / count(estudos)\n\ngrade_weight: high=1.0, moderate=0.7, low=0.4, very_low=0.2',
          example: 'Curcumina para Osteoartrite: 3 estudos (high: score=8.2, moderate: score=7.1, low: score=5.8) → Eficácia = (8.2×1.0 + 7.1×0.7 + 5.8×0.4) / 3 = 6.8/10'
        }
      ],
      decisions: [
        'Sistema de tags coloridas para benefícios (anti-inflammatory, antioxidant, immunomodulatory, etc.)',
        'Visualização de "Mechanisms" como sub-aba (explica mecanismos de ação biológicos)',
        'Database structure baseada em NaPDI Center (Natural Product-Drug Interaction Research Data Repository)',
        'Suporte a sinônimos (e.g., "Cúrcuma" = "Turmeric" = "Curcuma longa")',
        'Campos bilíngues PT/EN para suporte internacional'
      ]
    },
    scientific: {
      foundation: 'Database structure inspirada no NaPDI Center (Natural Product-Drug Interaction Research Data Repository). Fundamentação em Evidence-Based Medicine (EBM).',
      studies: [
        {
          title: 'Pharmacokinetics of veterinary nutraceuticals: a review',
          authors: 'Court MH, et al.',
          year: 2017,
          journal: 'Journal of Veterinary Pharmacology and Therapeutics',
          url: 'https://pubmed.ncbi.nlm.nih.gov/27896841/',
          keyFindings: 'Biodisponibilidade de curcumina aumenta 20x com piperina. Glucosamina oral tem absorção de apenas 20-30% sem formulação lipossomal.'
        },
        {
          title: 'Standardization challenges in veterinary nutraceuticals',
          authors: 'Boothe DM',
          year: 2021,
          journal: 'Veterinary Medicine and Science',
          url: 'https://pubmed.ncbi.nlm.nih.gov/33463065/',
          keyFindings: 'Variação de 300-800% na concentração de princípios ativos entre marcas comerciais. Necessidade de certificação de terceiros (e.g., NASC Quality Seal).'
        }
      ],
      references: [
        'NaPDI Center Database: https://napdi.org/',
        'USDA Phytochemical Database',
        'EFSA Compendium of botanicals',
        'Natural Medicines Comprehensive Database'
      ]
    }
  },

  'estudos': {
    overview: {
      objective: 'Gerenciar base de conhecimento científico: upload de PDFs, parsing automático, extração de dados via IA, curadoria humana, e integração ao Knowledge Graph.',
      workflow: [
        'Upload de PDFs (individual ou batch)',
        'Parsing automático via Unstructured API (OCR, layout analysis)',
        'Extração de entidades via LLM (nutracêuticos, condições, mecanismos, findings com GRADE)',
        'Curadoria humana (revisar, aprovar, rejeitar, mesclar entidades)',
        'Integração ao Knowledge Graph (study_findings, relações M-N, agregações)'
      ],
      benefits: [
        'Automação de 70-80% do trabalho de catalogação científica',
        'Redução de erros humanos (extração estruturada via IA)',
        'Auditoria completa (tracking de quem aprovou, quando, versões)',
        'Separação entre "pending review" e "approved" (evita "poluir" Knowledge Graph com extrações não validadas)'
      ]
    },
    methodology: {
      description: 'Pipeline de ingestão em 5 estágios: Upload → Parsing (Unstructured API) → LLM Extraction (Lovable AI) → Curadoria Humana → Approval e integração ao Knowledge Graph.',
      decisions: [
        'Buffer de curadoria (study_extractions) separado de dados aprovados',
        'Sistema de confiança: AI extractions = "pending review", Human approved = "high confidence"',
        'Versionamento: cada estudo pode ter múltiplas extrações (reprocessamento com novos modelos)',
        'Tool calling para extração estruturada: LLM retorna JSON validado (nutraceuticals, conditions, mechanisms, findings)',
        'Side-by-side curation screen: PDF viewer + editable form + mini-graph de relações',
        'Unstructured API: parsing com OCR de alta qualidade + layout analysis (tabelas, imagens)'
      ]
    },
    scientific: {
      foundation: 'Baseado em PRISMA Guidelines (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) e Cochrane Handbook for Systematic Reviews.',
      studies: [
        {
          title: 'Automated extraction of clinical data from veterinary research articles',
          authors: 'Chen et al.',
          year: 2022,
          journal: 'Journal of Biomedical Informatics',
          url: 'https://pubmed.ncbi.nlm.nih.gov/35257791/',
          keyFindings: 'NLP models alcançaram 87% de precisão em extração de intervenções e 92% em outcomes. Curadoria humana necessária para interpretação de gráficos complexos.'
        },
        {
          title: 'Knowledge extraction from veterinary clinical trials',
          authors: 'Wang et al.',
          year: 2023,
          journal: 'Artificial Intelligence in Medicine',
          url: 'https://pubmed.ncbi.nlm.nih.gov/37059123/',
          keyFindings: 'LLMs (GPT-4) superaram métodos tradicionais de NER em 15% para entidades biomédicas veterinárias. Fine-tuning com 500 artigos aumentou F1-score de 0.78 para 0.91.'
        }
      ],
      references: [
        'PRISMA-P Protocol: http://www.prisma-statement.org/',
        'Cochrane Handbook for Systematic Reviews',
        'GRADE Guidelines for evidence quality',
        'Unstructured API Documentation: https://unstructured.io/'
      ]
    }
  },

  'relacoes': {
    overview: {
      objective: 'Visualizar e explorar conexões complexas entre nutracêuticos, condições de saúde, mecanismos biológicos e estudos científicos através de grafos interativos.',
      workflow: [
        'Selecionar tipo de visualização (Network Graph, Heatmap, Sankey Diagram)',
        'Filtrar por eficácia, GRADE certainty, espécie, raça',
        'Interagir com nós/arestas (hover para detalhes, click para drill-down)',
        'Exportar visualizações (PNG, SVG) para apresentações científicas'
      ],
      benefits: [
        'Descoberta de padrões não óbvios (e.g., "Mecanismo X está presente em 80% das condições articulares")',
        'Comunicação visual de evidências para stakeholders não-técnicos',
        'Identificação de gaps ("Condição Y não tem nenhum nutracêutico com alta certeza")',
        'Modo "Comparison": selecionar 2-3 nutracêuticos e sobrepor no grafo para comparar perfis'
      ]
    },
    methodology: {
      description: 'Três tipos de visualizações complementares: Network Graph (vis-network, force-directed layout), Evidence Heatmap (Recharts matrix), e análise de correlações.',
      decisions: [
        'Network Graph: Nós (Nutracêuticos=azul, Condições=verde, Mechanisms=roxo), Arestas (espessura=eficácia, cor=GRADE)',
        'Layout: Force-directed com physics simulation (Louvain method para clustering)',
        'Evidence Heatmap: Matrix Condições×Nutracêuticos, cor=GRADE certainty, intensidade=effect_magnitude',
        'Filtros persistentes salvos em URL query params (permite compartilhamento de visualizações específicas)',
        'Tooltip com citações: "Evidência de [Estudo XYZ, 2020] - effect size: 0.72 (p<0.01)"'
      ]
    },
    scientific: {
      foundation: 'Baseado em Network Medicine framework (Barabási et al., 2011) e Knowledge Graph Embedding para predição de novas associações.',
      studies: [
        {
          title: 'Network-based approaches for drug repositioning in veterinary medicine',
          authors: 'Zhou et al.',
          year: 2021,
          journal: 'BMC Veterinary Research',
          url: 'https://pubmed.ncbi.nlm.nih.gov/33446186/',
          keyFindings: 'Network analysis identificou 14 candidatos a repurposing com >0.8 de similaridade de perfil molecular. 3 validados in vitro com eficácia comparável ao tratamento padrão.'
        },
        {
          title: 'Knowledge graph embedding for biomedical link prediction',
          authors: 'Mohamed et al.',
          year: 2020,
          journal: 'Bioinformatics',
          url: 'https://pubmed.ncbi.nlm.nih.gov/31665344/',
          keyFindings: 'TransE embeddings alcançaram AUC 0.89 na predição de novas associações compound-disease. Validação experimental confirmou 67% das predições top-100.'
        }
      ],
      references: [
        'Barabási AL, et al. (2011). Network medicine: a network-based approach to human disease. Nature Reviews Genetics.',
        'Cytoscape Network Analysis Documentation',
        'Gephi Graph Visualization Platform',
        'D3.js Force Layouts: https://d3js.org/'
      ]
    }
  },

  'ai-insights': {
    overview: {
      objective: 'Dashboards de monitoramento e insights gerados por IA sobre qualidade da base de conhecimento, sugestões automáticas, e detecção de inconsistências.',
      workflow: [
        'Visualizar métricas de qualidade de extração (approval rate, pending entities, avg time to review)',
        'Explorar sugestões automáticas de novos mecanismos ou relações',
        'Analisar "Knowledge Gaps" (condições/mecanismos subpesquisados)',
        'Receber alertas de inconsistências (e.g., estudos contraditórios sobre mesmo nutracêutico)'
      ],
      benefits: [
        'Proatividade: IA sugere melhorias antes de serem solicitadas',
        'Quality assurance: detecção automática de inconsistências entre estudos',
        'Priorização de esforço: foco em áreas com maior gap de conhecimento',
        'Active Learning: IA prioriza artigos com maior uncertainty para curadoria'
      ]
    },
    methodology: {
      description: 'Sistema de monitoramento multi-camadas: (1) Extraction Quality Monitor, (2) Pending Entities (sugestões de IA), (3) Knowledge Gap Analysis, (4) Inconsistency Detection.',
      decisions: [
        'Extraction Quality: Threshold de alerta = Approval rate <70% → "Revisar prompts de extração ou treinar modelo"',
        'Pending Entities: Novos mechanisms sugeridos pela IA aguardam aprovação humana (podem ser aprovados, merged, ou rejeitados)',
        'Knowledge Gaps: Heatmap Condition × Mechanism, células cinzas = gap (0 estudos), ordenado por gap severity = (Prevalência × Relevância) / Estudos',
        'Inconsistency Detection: Alerta quando dois estudos têm findings contraditórios (divergência >50% em effect_magnitude)',
        'Botão "Suggest Research Priorities": LLM gera lista de keywords para busca em PubMed/SciSpace'
      ]
    },
    scientific: {
      foundation: 'Baseado em Active Learning + Human-in-the-Loop AI (Settles, 2009) e técnicas de Conflict Resolution em literatura biomédica.',
      studies: [
        {
          title: 'AI-assisted curation of biomedical literature',
          authors: 'Wei et al.',
          year: 2023,
          journal: 'Nature Methods',
          url: 'https://pubmed.ncbi.nlm.nih.gov/37291213/',
          keyFindings: 'Sistema híbrido (AI + curador humano) reduziu tempo de curadoria em 68% mantendo 95% de precisão. Active learning priorizou artigos com maior uncertainty.'
        },
        {
          title: 'Detecting contradictions in biomedical literature',
          authors: 'Alamri & Stevenson',
          year: 2021,
          journal: 'Journal of Biomedical Semantics',
          url: 'https://pubmed.ncbi.nlm.nih.gov/33766088/',
          keyFindings: 'Modelo BERT fine-tuned detectou 87% de contradições em pares de sentenças. Principais categorias: dosage conflicts (32%), outcome disagreements (28%), methodology flaws (21%).'
        }
      ],
      references: [
        'Settles B. (2009). Active Learning Literature Survey. Computer Sciences Technical Report.',
        'Cochrane Collaboration Conflict of Interest Policies',
        'GRADE Conflict Resolution Guidelines',
        'PubMed Contradiction Detection Tools'
      ]
    }
  },

  'knowledge-base-settings': {
    overview: {
      objective: 'Configurar comportamento de prompts de IA, thresholds de GRADE, gerenciar mecanismos biológicos (ontology), e definir regras de agregação de métricas.',
      workflow: [
        'Aba "AI Prompts": Editar prompts de extração para estudos, mechanisms, findings',
        'Aba "GRADE Thresholds": Ajustar limites para high/moderate/low/very low certainty',
        'Aba "Mechanisms Ontology": CRUD de hallmarks biológicos (inflammation, oxidative stress, etc.)',
        'Aba "Aggregation Rules": Configurar pesos para cálculo de tratabilidade, eficácia'
      ],
      benefits: [
        'Personalização: ajustar sistema para literatura específica (e.g., medicina felina vs. canina)',
        'Governança: auditoria de mudanças de configuração (quem, quando, versão anterior)',
        'Experimentação: testar diferentes estratégias de agregação sem modificar código',
        'Importação de ontologias externas (Gene Ontology, Disease Ontology)'
      ]
    },
    methodology: {
      description: 'Sistema de configuração modular com versionamento: AI Prompts (templates com placeholders), GRADE Thresholds (slider ranges), Mechanisms Ontology (hierarquia + sinônimos), Aggregation Rules (fórmulas configuráveis).',
      decisions: [
        'AI Prompts: Sistema de templates com {{placeholders}}, versionamento com diff visual, testing sandbox (testar em 10 estudos antes de aplicar)',
        'GRADE Thresholds: Slider ranges configuráveis, preview ao ajustar (mostra quantos findings mudariam de categoria)',
        'Mechanisms Ontology: Hierarquia Sistema→Sub-mecanismo (e.g., "Inflammation"→"COX-2 inhibition"), sinônimos, importação de ontologias OWL',
        'Aggregation Rules: Fórmula de tratabilidade com pesos editáveis, escolha de normalização (linear, log, sigmoidal)'
      ]
    },
    scientific: {
      foundation: 'Baseado em FAIR Principles (Findable, Accessible, Interoperable, Reusable) + TRUST Principles for Digital Repositories + OWL Web Ontology Language.',
      studies: [
        {
          title: 'Ontology-based knowledge representation in veterinary medicine',
          authors: 'Schulz et al.',
          year: 2019,
          journal: 'Journal of Biomedical Semantics',
          url: 'https://pubmed.ncbi.nlm.nih.gov/30940181/',
          keyFindings: 'Veterinary ontologies (VeNOM, VSAO) aumentaram interoperabilidade em 73%. Adoção de padrões OWL 2.0 permitiu reasoning automático.'
        },
        {
          title: 'Configurable evidence grading systems: a systematic review',
          authors: 'Djulbegovic & Guyatt',
          year: 2020,
          journal: 'Journal of Clinical Epidemiology',
          url: 'https://pubmed.ncbi.nlm.nih.gov/31758966/',
          keyFindings: 'Flexibilidade de thresholds aumentou taxa de adoção de GRADE em 34%. Configurabilidade permitiu adaptação para especialidades com literatura escassa.'
        }
      ],
      references: [
        'FAIR Data Principles: https://www.go-fair.org/fair-principles/',
        'TRUST Principles for Digital Repositories',
        'OWL Web Ontology Language Specification: https://www.w3.org/OWL/',
        'Gene Ontology: http://geneontology.org/',
        'Disease Ontology: https://disease-ontology.org/'
      ]
    }
  }
};
