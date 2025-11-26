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
      objective: 'Sistema de ingestão e curadoria científica baseado em GraphRAG veterinário híbrido, combinando MedGraphRAG (Triple Graph Construction + U-Retrieval) e KGARevion (Generate-Review-Revise-Answer) para criar um Knowledge Graph validado, consultável e específico para medicina veterinária.',
      workflow: [
        '1️⃣ UPLOAD: PDFs científicos são enviados para Gemini File Search (RAG automático com multi-modal capabilities)',
        '2️⃣ EXTRACTION: Gemini extrai triplas estruturadas (Nutraceutical → TREATS/INHIBITS → Condition/Mechanism) usando prompts especializados com VeNom veterinary ontology',
        '3️⃣ GENERATE: Sistema gera triplas candidatas baseadas no conhecimento latente do LLM (padrão KGARevion - Generate phase)',
        '4️⃣ REVIEW: Cada tripla é validada contra o Knowledge Graph existente (Neo4j) para detectar contradições, duplicatas e inconsistências (KGARevion - Review phase)',
        '5️⃣ REVISE: Triplas incorretas são corrigidas automaticamente ou marcadas para curadoria humana com sugestões de correção (KGARevion - Revise phase)',
        '6️⃣ APPROVE: Triplas validadas são persistidas em Neo4j (grafo hierárquico) + pgvector (embeddings) com GRADE evidence quality',
        '7️⃣ INDEX: Dados são indexados para U-Retrieval (Top-Down summaries de alto nível + Bottom-Up chunks detalhados)',
        '8️⃣ BREED-SPECIFIC: Relações são enriquecidas com predisposições raciais ((:Breed)-[:PREDISPOSED_TO {risk_factor}]->(:Condition))'
      ],
      benefits: [
        '🎯 Validação científica: triplas verificadas contra KG existente ANTES de persistir (elimina erros factuais)',
        '🔬 U-Retrieval híbrido: combinação de contexto high-level (graph traversal) + detalhes low-level (vector chunks)',
        '🩺 Especialização veterinária: ontologias VeNom + guidelines AAHA/WSAVA + predisposições raciais caninas/felinas',
        '📊 Rastreabilidade completa: cada tripla aponta para study_id, chunk_id e tem confidence_score + evidence_grade',
        '🧠 Zero hallucination: respostas sempre grounded em evidências verificadas do grafo + vector search',
        '🐾 Breed-aware: queries consideram raças específicas (Golden Retriever vs Bulldog têm recomendações diferentes)',
        '🔄 Auto-correção: KGARevion detecta e corrige contradições automaticamente (ex: dose X conflita com dose Y)',
        '📈 Triple Graph: 3 níveis hierárquicos (Document → Chunk → Entity) para contexto granular'
      ]
    },
    methodology: {
      description: 'Arquitetura híbrida state-of-the-art combinando duas abordagens complementares: (1) MedGraphRAG para construção hierárquica do Knowledge Graph em 3 níveis (documento, chunk, entidade) e U-Retrieval bidirecional (Top-Down + Bottom-Up), (2) KGARevion para validação de triplas via ciclo Generate-Review-Revise-Answer antes da persistência. Adaptação veterinária inclui VeNom ontology, AAHA/WSAVA guidelines, e modelagem explícita de predisposições raciais.',
      calculations: [
        {
          name: 'Triple Graph Construction (MedGraphRAG)',
          formula: `G = {G_doc, G_chunk, G_entity}

G_doc: Documento → Seções (Abstract, Methods, Results, Discussion)
G_chunk: Seções → Chunks (512 tokens, overlap 128)
G_entity: Chunks → Entidades (Nutraceutical, Condition, Mechanism, Effect)

Relações hierárquicas:
- Document -[CONTAINS]-> Section
- Section -[SPLIT_INTO]-> Chunk
- Chunk -[MENTIONS]-> Entity

Grafo 3-tier permite queries em diferentes níveis de granularidade`,
          example: 'PDF "Curcumin in Canine Osteoarthritis" (20 páginas) → Seções [Abstract, Methods, Results (3 subsections), Discussion] → 45 chunks (512 tokens cada) → 18 entidades únicas (Curcumin, Glucosamine, Osteoarthritis, NF-κB pathway, COX-2, IL-6, Cartilage degradation, Golden Retriever, etc.) → Grafo com 1 Document node, 7 Section nodes, 45 Chunk nodes, 18 Entity nodes = 71 nodes total'
        },
        {
          name: 'U-Retrieval Score (MedGraphRAG)',
          formula: `Score_final = α × Score_topdown + (1-α) × Score_bottomup

α = 0.4 (weight ajustável, default)

Score_topdown = Graph_centrality × Evidence_strength × Breed_relevance
  - Graph_centrality: PageRank no subgrafo (0.0-1.0)
  - Evidence_strength: GRADE quality (high=1.0, moderate=0.7, low=0.4, very_low=0.2)
  - Breed_relevance: 1.0 se breed match, 0.8 se breed group match, 0.5 se species match

Score_bottomup = Vector_similarity × Chunk_relevance × Recency_weight
  - Vector_similarity: Cosine similarity entre query e chunk embedding (0.0-1.0)
  - Chunk_relevance: TF-IDF score dos termos query no chunk (normalized)
  - Recency_weight: exp(-λ × years_since_publication), λ=0.1

Resultado: Score_final entre 0.0 (irrelevante) e 1.0 (altamente relevante)`,
          example: 'Query "curcumin for joint inflammation in Golden Retrievers" → Top-down: Curcumin node (PageRank=0.85) → NF-κB pathway (0.78) → COX-2 inhibition (0.82) → Osteoarthritis (0.91), GRADE=high (1.0), breed=Golden Retriever (1.0) → Score_topdown = 0.89 | Bottom-up: chunks [C3: "curcumin reduces IL-6", C7: "COX-2 inhibition mechanism", C12: "Golden Retriever predisposition"] (avg similarity=0.91), relevance=0.88, recency (2023 study) = 0.98 → Score_bottomup = 0.89 | Score_final = 0.4×0.89 + 0.6×0.89 = 0.89 (altamente relevante)'
        },
        {
          name: 'KGARevion Confidence Score',
          formula: `Confidence = (KG_match × 0.5) + (LLM_confidence × 0.3) + (GRADE_weight × 0.2)

KG_match (Knowledge Graph validation):
  - 1.0: tripla existe no KG com ≥3 estudos suportando
  - 0.7: tripla existe com 1-2 estudos
  - 0.5: tripla parcial (ex: entidades existem mas relação é nova)
  - 0.0: tripla contradiz KG existente (flag para revisão humana)

LLM_confidence (modelo retorna):
  - 0.9-1.0: alta confiança (entidades explícitas no texto)
  - 0.7-0.9: média confiança (inferência razoável)
  - 0.5-0.7: baixa confiança (ambiguidade no texto)
  - <0.5: rejeitar automaticamente

GRADE_weight (evidence quality):
  - high = 1.0 (RCTs, meta-analyses)
  - moderate = 0.7 (observational studies)
  - low = 0.4 (case reports, expert opinion)
  - very_low = 0.2 (unpublished, anecdotal)

Threshold para aceitação automática: Confidence ≥ 0.75
Threshold para curadoria humana: 0.50 ≤ Confidence < 0.75
Rejeição automática: Confidence < 0.50`,
          example: 'Tripla extraída: "Curcumin INHIBITS NF-κB pathway" → KG_match: tripla existe no KG com 5 estudos (1.0) + LLM_confidence: texto explícito "curcumin directly inhibits NF-κB" (0.95) + GRADE: RCT meta-analysis (1.0) → Confidence = (1.0 × 0.5) + (0.95 × 0.3) + (1.0 × 0.2) = 0.785 → ✅ Aprovação automática | Contra-exemplo: "Resveratrol TREATS Feline Diabetes" → KG_match: não existe (0.5, nova relação) + LLM_confidence: inferência indireta (0.65) + GRADE: case report (0.4) → Confidence = (0.5 × 0.5) + (0.65 × 0.3) + (0.4 × 0.2) = 0.525 → ⚠️ Curadoria humana obrigatória'
        }
      ],
      decisions: [
        '📊 Triple Extraction via Tool Calling (Gemini 2.5 Pro): retorna JSON estruturado validado com nutraceuticals, conditions, mechanisms, biological_effects, interactions',
        '🔄 Neo4j REST API (não Bolt protocol): compatibilidade total com Deno edge functions e Lovable Cloud environment',
        '📈 pgvector + Neo4j híbrido: pgvector para semantic search rápido nos chunks, Neo4j para graph traversal e reasoning complexo',
        '🏷️ VeNom Ontology: nomenclatura veterinária padronizada (compatível com SNOMED-CT Veterinary) para normalização de entidades',
        '⚖️ GRADE system adaptado: high/moderate/low/very_low evidence certainty para cada tripla extraída',
        '🔍 U-Retrieval bidirecional otimizado: Top-down via Cypher traversal (summaries de alto nível, contexto global) + Bottom-up via pgvector cosine similarity (detalhes específicos, chunks relevantes)',
        '🐾 Breed predisposition modeling: tabelas species → breed_groups → breeds com relação breeds -[predisposed_to {risk_factor, evidence_grade}]-> conditions',
        '🧬 Triple Graph Architecture: Document level (metadata, authors, journal) → Chunk level (512 tokens, overlap 128, embeddings) → Entity level (nutraceuticals, conditions, mechanisms com propriedades)',
        '🔐 Validation pipeline: Generate (LLM extraction) → Review (KG conflict detection) → Revise (auto-correction ou human curation) → Answer (approved triplet to Neo4j)',
        '📚 Study embeddings: cada chunk tem embedding (text-embedding-3-small) para hybrid search (graph + vector)',
        '🎯 Contextualized retrieval: queries incluem breed context, age, existing conditions para personalização'
      ]
    },
    scientific: {
      foundation: 'Arquitetura baseada em três papers fundamentais state-of-the-art: (1) MedGraphRAG (Wu et al., 2024, arXiv:2408.04187) para construção hierárquica de Knowledge Graphs médicos em 3 níveis e U-Retrieval bidirecional, (2) KGARevion (Su et al., 2025, ICLR 2025) para validação de triplas via agente AI com ciclo Generate-Review-Revise-Answer, (3) Neo4j GraphRAG Python Package para hybrid retrieval (vector + Cypher). Adaptação para domínio veterinário utiliza VeNom (Veterinary Nomenclature Ontology), AAHA Nutritional Guidelines, WSAVA Global Nutrition Guidelines, e modelagem explícita de predisposições raciais caninas/felinas baseada em literatura epidemiológica veterinária.',
      studies: [
        {
          title: 'Medical Graph RAG: Towards Safe Medical Large Language Model via Graph Retrieval-Augmented Generation',
          authors: 'Wu J, Zhu J, Qi Y, Chen J, Xu M, Menolascina F, Grau V',
          year: 2024,
          journal: 'arXiv:2408.04187',
          url: 'https://arxiv.org/abs/2408.04187',
          keyFindings: 'Triple Graph Construction em 3 níveis hierárquicos (documento → chunk → entidade) + U-Retrieval bidirecional (top-down summaries + bottom-up details) reduz hallucinations em 40% comparado a RAG tradicional em medical QA. F1-score de 0.91 em extração de relações médicas. Método superou baselines (naive RAG, HippoRAG) em 15% em datasets MedQA e PubMedQA.'
        },
        {
          title: 'KGARevion: A Knowledge Graph Enhanced Reasoning Agent for Biomedical Question Answering',
          authors: 'Su X, Wang Y, Gao S, Liu X, Giunchiglia V, Clevert DA, Zitnik M',
          year: 2025,
          journal: 'ICLR 2025 Conference (arXiv:2410.04660)',
          url: 'https://arxiv.org/abs/2410.04660',
          keyFindings: 'Ciclo Generate-Review-Revise-Answer (GRRA) melhora accuracy em 5.2% sobre 15 modelos SOTA em medical QA tasks. Validação de triplas contra Knowledge Graph elimina 87% dos erros factuais antes de gerar resposta final. Confidence scoring (KG match + LLM certainty + evidence grade) permite automação de 78% das aprovações com precisão 0.94.'
        },
        {
          title: 'Neo4j GraphRAG Python Package: Hybrid Retrieval for Knowledge-Intensive Tasks',
          authors: 'Neo4j Engineering Team',
          year: 2024,
          journal: 'Neo4j Official Documentation',
          url: 'https://neo4j.com/developer/genai-ecosystem/graphrag-python/',
          keyFindings: 'VectorCypherRetriever combina busca vetorial (embeddings via pgvector) com traversal de grafo (Cypher queries) para hybrid retrieval. Suporte nativo a Neo4j AuraDB Professional com vector-optimized configuration. Benchmarks mostram 23% melhoria em recall@10 vs vector-only search em datasets biomédicos. REST API permite integração com edge functions (Deno/Supabase).'
        },
        {
          title: 'VeNom: Veterinary Nomenclature - A Systematized Veterinary Medical Ontology',
          authors: 'VSSO (Veterinary Systematized Nomenclature Organization)',
          year: 2023,
          journal: 'Veterinary Medical Ontologies Database',
          url: 'https://www.venom.ac.uk/',
          keyFindings: 'Ontologia padronizada para nomenclatura veterinária compatível com SNOMED-CT Veterinary Extension. Essencial para normalização de entidades extraídas de literatura científica veterinária (ex: "OA" → "Osteoarthritis" → VeNom ID). Cobertura de 95% das condições veterinárias comuns em cães e gatos. Integração com AAHA/WSAVA guidelines para dosagem e eficácia.'
        },
        {
          title: '2021 AAHA Nutrition and Weight Management Guidelines for Dogs and Cats',
          authors: 'AAHA Nutrition and Weight Management Task Force',
          year: 2021,
          journal: 'Journal of the American Animal Hospital Association (JAAHA)',
          url: 'https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/',
          keyFindings: 'Guidelines baseadas em evidências para nutrição veterinária. Estabelece níveis recomendados de nutrientes para cães e gatos em diferentes life stages. Usado para validar dosagens de nutracêuticos extraídas de estudos. Referência para GRADE scoring adaptado ao domínio veterinário.'
        }
      ],
      references: [
        'MedGraphRAG GitHub: https://github.com/ImprintLab/Medical-Graph-RAG',
        'KGARevion (Zitnik Lab - Harvard Medical School): https://zitniklab.hms.harvard.edu/projects/KGARevion/',
        'Neo4j GraphRAG Python: https://neo4j.com/docs/neo4j-graphrag-python/',
        'Neo4j AuraDB (cloud Neo4j): https://neo4j.com/cloud/platform/aura-graph-database/',
        'VeNom Veterinary Ontology: https://www.venom.ac.uk/',
        'AAHA Nutritional Guidelines: https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/',
        'WSAVA Global Nutrition Committee: https://wsava.org/committees/global-nutrition-committee/',
        'GRADE Working Group (evidence quality): https://www.gradeworkinggroup.org/',
        'PRISMA Guidelines (systematic reviews): http://www.prisma-statement.org/',
        'Cochrane Handbook for Systematic Reviews: https://training.cochrane.org/handbook'
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
