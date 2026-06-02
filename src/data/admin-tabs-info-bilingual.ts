import { TabInfoContentBilingual } from './types/tabInfoTypes';

export const adminTabsInfoBilingual: Record<string, TabInfoContentBilingual> = {
  'veterinary-targets': {
    version: '1.1.0',
    lastUpdate: '2025-11-30',
    keyExcerpts: [
      {
        source: 'J Vet Intern Med. 2017 Nov;31(6):1645-1655.',
        quote: {
          pt: 'Revisão sistemática e meta-análise de suplementação probiótica em cães e gatos',
          en: 'Systematic review and meta-analysis of probiotic supplementation in dogs and cats'
        },
        url: 'https://pubmed.ncbi.nlm.nih.gov/28940824/',
      },
      {
        source: 'Am J Vet Res. 2017 Jun;78(6):630-637.',
        quote: {
          pt: 'Avaliação das percepções de clientes sobre medicina veterinária complementar e alternativa',
          en: 'Assessment of client perceptions of complementary and alternative veterinary medicine'
        },
        url: 'https://pubmed.ncbi.nlm.nih.gov/28570248/',
      },
    ],
    overview: {
      objective: {
        pt: 'Mapear condições de saúde veterinárias gerenciáveis por nutracêuticos, priorizadas por prevalência, tratabilidade e impacto clínico. O sistema identifica gaps de conhecimento e oportunidades para intervenção nutracêutica baseada em evidências.',
        en: 'Map veterinary health conditions manageable through nutraceuticals, prioritized by prevalence, treatability, and clinical impact. The system identifies knowledge gaps and opportunities for evidence-based nutraceutical intervention.'
      },
      workflow: [
        {
          pt: 'Sistema analisa base de estudos científicos e correlaciona nutracêuticos com condições de saúde',
          en: 'System analyzes scientific study database and correlates nutraceuticals with health conditions'
        },
        {
          pt: 'Calcula "Tratabilidade" baseada em eficácia, número de estudos, e diversidade de nutracêuticos',
          en: 'Calculates "Treatability" based on efficacy, number of studies, and nutraceutical diversity'
        },
        {
          pt: 'Veterinários podem refinar, adicionar notas clínicas, e ajustar prioridades',
          en: 'Veterinarians can refine, add clinical notes, and adjust priorities'
        },
        {
          pt: 'Identifica gaps de conhecimento (condições subpesquisadas ou sem nutracêuticos catalogados)',
          en: 'Identifies knowledge gaps (under-researched conditions or those without cataloged nutraceuticals)'
        }
      ],
      benefits: [
        {
          pt: 'Foco em condições com maior potencial terapêutico nutracêutico',
          en: 'Focus on conditions with highest nutraceutical therapeutic potential'
        },
        {
          pt: 'Base científica sólida para tomada de decisão clínica',
          en: 'Solid scientific foundation for clinical decision-making'
        },
        {
          pt: 'Identificação de gaps de conhecimento para priorizar pesquisa futura',
          en: 'Knowledge gap identification to prioritize future research'
        },
        {
          pt: 'Transparência: toda recomendação rastreável até estudos científicos',
          en: 'Transparency: every recommendation traceable to scientific studies'
        }
      ]
    },
    methodology: {
      description: {
        pt: 'O cálculo de "Tratabilidade" é uma métrica composta que pondera três fatores principais, permitindo comparação objetiva entre condições de saúde.',
        en: 'The "Treatability" calculation is a composite metric that weighs three main factors, enabling objective comparison between health conditions.'
      },
      calculations: [
        {
          name: {
            pt: 'Fórmula de Tratabilidade',
            en: 'Treatability Formula'
          },
          formula: 'Treatability = ((Avg_Efficacy × 0.4) + (Num_Studies × 0.3) + (Nutraceutical_Diversity × 0.3)) × 100',
          example: {
            pt: 'Osteoartrite → Eficácia Média: 0.72, Estudos: 18 (normalizado: 0.85), Diversidade: 6 nutracêuticos (0.90) → Tratabilidade = 80%',
            en: 'Osteoarthritis → Avg Efficacy: 0.72, Studies: 18 (normalized: 0.85), Diversity: 6 nutraceuticals (0.90) → Treatability = 80%'
          }
        }
      ],
      decisions: [
        {
          pt: 'Eficácia Média: 0.0-1.0, baseada em meta-análises de estudos com ponderação por GRADE certainty',
          en: 'Average Efficacy: 0.0-1.0, based on study meta-analyses weighted by GRADE certainty'
        },
        {
          pt: 'Número de Estudos: Normalizado usando escala logarítmica para evitar viés de condições muito pesquisadas',
          en: 'Number of Studies: Normalized using logarithmic scale to avoid bias from heavily researched conditions'
        },
        {
          pt: 'Diversidade: Número de nutracêuticos diferentes com eficácia comprovada (quanto mais opções, melhor)',
          en: 'Diversity: Number of different nutraceuticals with proven efficacy (more options = better)'
        },
        {
          pt: 'Arredondamento para múltiplos de 5% (apresentação mais limpa e profissional)',
          en: 'Rounding to multiples of 5% (cleaner, more professional presentation)'
        },
        {
          pt: 'Badge "A Catalogar" para condições sem nutracêuticos (mais claro e positivo que "0%")',
          en: '"To Catalog" badge for conditions without nutraceuticals (clearer and more positive than "0%")'
        },
        {
          pt: 'Thresholds: Baixa (0-35%), Moderada (40-65%), Boa (70-85%), Excelente (90-100%)',
          en: 'Thresholds: Low (0-35%), Moderate (40-65%), Good (70-85%), Excellent (90-100%)'
        }
      ]
    },
    scientific: {
      foundation: {
        pt: 'Modelo baseado em GRADE System (Grading of Recommendations Assessment, Development and Evaluation) + Evidence Hierarchy: Systematic Reviews > RCTs > Observational Studies.',
        en: 'Model based on GRADE System (Grading of Recommendations Assessment, Development and Evaluation) + Evidence Hierarchy: Systematic Reviews > RCTs > Observational Studies.'
      },
      studies: [
        {
          title: {
            pt: 'Eficácia de nutracêuticos em osteoartrite canina: uma revisão sistemática',
            en: 'Efficacy of nutraceuticals in canine osteoarthritis: a systematic review'
          },
          authors: 'Anderson et al.',
          year: 2018,
          journal: {
            pt: 'Journal of Veterinary Internal Medicine',
            en: 'Journal of Veterinary Internal Medicine'
          },
          url: 'https://pubmed.ncbi.nlm.nih.gov/29869826/',
          keyFindings: {
            pt: 'Glucosamina + Condroitina mostraram eficácia moderada (effect size: 0.68) em 12 RCTs. Curcuma demonstrou efeito anti-inflamatório significativo (p<0.01) em 5 estudos.',
            en: 'Glucosamine + Chondroitin showed moderate efficacy (effect size: 0.68) in 12 RCTs. Curcumin demonstrated significant anti-inflammatory effect (p<0.01) in 5 studies.'
          }
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
    version: '1.1.0',
    lastUpdate: '2025-11-30',
    keyExcerpts: [
      {
        source: 'Natural Medicines Database',
        quote: {
          pt: 'Informações científicas abrangentes sobre medicamentos naturais, suplementos dietéticos e terapias fitoterápicas.',
          en: 'Comprehensive scientific information on natural medicines, dietary supplements, and herbal therapies.'
        },
        url: 'https://naturalmedicines.therapeuticresearch.com/',
      },
      {
        source: 'VeNom Veterinary Nomenclature',
        quote: {
          pt: 'Sistema de nomenclatura padronizada para medicina veterinária.',
          en: 'Standardized nomenclature for veterinary medicine.'
        },
        url: 'https://www.vin.com/venom/',
      },
    ],
    overview: {
      objective: {
        pt: 'Catálogo central de todos os nutracêuticos, com informações científicas completas, relações com condições de saúde, e dados de eficácia. Serve como fonte única de verdade para todo o sistema.',
        en: 'Central catalog of all nutraceuticals, with complete scientific information, relationships to health conditions, and efficacy data. Serves as single source of truth for the entire system.'
      },
      workflow: [
        { pt: 'Importação de dados de fontes científicas validadas', en: 'Data import from validated scientific sources' },
        { pt: 'Normalização de nomenclaturas usando VeNom', en: 'Nomenclature normalization using VeNom' },
        { pt: 'Linkagem automática com condições de saúde', en: 'Automatic linking with health conditions' },
        { pt: 'Cálculo de scores de eficácia e segurança', en: 'Efficacy and safety score calculation' }
      ],
      benefits: [
        { pt: 'Fonte única de verdade para dados de nutracêuticos', en: 'Single source of truth for nutraceutical data' },
        { pt: 'Evita duplicação e inconsistências', en: 'Prevents duplication and inconsistencies' },
        { pt: 'Facilita auditoria e rastreabilidade', en: 'Facilitates auditing and traceability' }
      ]
    },
    methodology: {
      description: {
        pt: 'Modelo de dados normalizado com separação clara entre entidades, relações e metadados científicos. Segue padrões de nomenclatura veterinária internacional.',
        en: 'Normalized data model with clear separation between entities, relationships, and scientific metadata. Follows international veterinary nomenclature standards.'
      },
      decisions: [
        { pt: 'Normalização de nomes seguindo VeNom standards', en: 'Name normalization following VeNom standards' },
        { pt: 'Threshold mínimo efficacy_score: 2.0 para inclusão', en: 'Minimum efficacy_score threshold: 2.0 for inclusion' }
      ]
    },
    scientific: {
      foundation: {
        pt: 'Dados estruturados segundo VeNom (Veterinary Nomenclature) e Natural Medicines Database, garantindo interoperabilidade e consistência.',
        en: 'Data structured according to VeNom (Veterinary Nomenclature) and Natural Medicines Database, ensuring interoperability and consistency.'
      },
      studies: [],
      references: ['VeNom - Purdue University', 'Natural Medicines Database']
    }
  },

  'estudos': {
    // ⚠️ MAINTENANCE: every change to the Senex engine that touches this modal
    // MUST bump `version` (semver) and set `lastUpdate` to the current ISO date.
    version: '5.2.0',
    lastUpdate: '2026-06-02',
    keyExcerpts: [
      {
        source: 'MedGraphRAG — Wu et al., 2024 (arXiv:2408.04187)',
        quote: {
          pt: 'Paper de inspiração: a construção em Triple Graph (Document → Chunk → Entity → Mechanism) combinada com U-Retrieval bidirecional reporta ~40% de redução de alucinações em QA médico. O Senex AI adota a Triple Graph (hierarquia L0–L4) mas NÃO implementa U-Retrieval — a recuperação real é Cypher (Neo4j) + pgvector (Supabase). O ~40% é benchmark do paper, não métrica do Senex.',
          en: 'Inspiration paper: Triple Graph Construction (Document → Chunk → Entity → Mechanism) combined with bidirectional U-Retrieval reports ~40% hallucination reduction on medical QA. Senex AI adopts the Triple Graph (L0–L4 hierarchy) but does NOT implement U-Retrieval — actual retrieval is Cypher (Neo4j) + pgvector (Supabase). The ~40% is the paper benchmark, not a Senex metric.'
        },
        url: 'https://arxiv.org/abs/2408.04187'
      },
      {
        source: 'KGARevion — Su et al., ICLR 2025',
        quote: {
          pt: 'Paper de inspiração: o ciclo GRRA (Generate → Review → Revise → Answer) reporta ~87% de redução de erros ao validar triplets contra um KG fundamentado. O Senex AI NÃO implementa GRRA — roda Generate + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + curadoria humana (HITL), sem modelo Review independente nem etapa Revise. O ~87% é benchmark do paper, não métrica do Senex.',
          en: 'Inspiration paper: the GRRA cycle (Generate → Review → Revise → Answer) reports ~87% error reduction by validating triplets against a grounded KG. Senex AI does NOT implement GRRA — it runs Generate + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + human-in-the-loop curation, with no independent Review model or Revise step. The ~87% is the paper benchmark, not a Senex metric.'
        },
        url: 'https://openreview.net/forum?id=OOq3W1MEVT'
      },
      {
        source: 'TransE — Bordes et al., NeurIPS 2013',
        quote: {
          pt: 'Paper de inspiração: modelagem de relações como translações no espaço de embeddings (h + r ≈ t) habilita link prediction. O Senex AI NÃO implementa TransE — o gap-fill (compound × condition) é feito por PubMed E-utilities + estruturação por Gemini (sem treinamento ou inferência de embeddings de grafo).',
          en: 'Inspiration paper: modelling relations as translations in embedding space (h + r ≈ t) enables link prediction. Senex AI does NOT implement TransE — gap-fill (compound × condition) is performed via PubMed E-utilities + Gemini structuring (no graph embedding training or inference).'
        },
        url: 'https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html'
      },
      {
        source: 'Dog Aging Project — Creevy et al., Nature 2022',
        quote: {
          pt: 'Coorte longitudinal aberta de >45.000 cães que sustenta marcadores de idade biológica e curvas de sobrevida — base empírica do Digital Twin canino e da métrica years_gained.',
          en: 'Open longitudinal cohort of >45,000 dogs that grounds biological age markers and survival curves — empirical basis for our canine Digital Twin and the years_gained metric.'
        },
        url: 'https://www.nature.com/articles/s41586-021-04231-6'
      },
      {
        source: 'AgeXtend — Ahuja et al., Nature Aging 2024',
        quote: {
          pt: 'Plataforma multiômica baseada em IA que rastreia ~1,1 bilhão de compostos para predizer geroprotetores, mimétricos de restrição calórica e indutores de autofagia — referência direta para o scoring de longevidade do Senex.',
          en: 'AI-based multi-omic platform screening ~1.1B compounds to predict geroprotectors, caloric-restriction mimetics and autophagy inducers — direct reference for the Senex longevity scoring.'
        },
        url: 'https://www.nature.com/articles/s43587-024-00763-4'
      },
      {
        source: 'Frailty in Dogs — Banzato et al., Frontiers in Vet. Science 2019',
        quote: {
          pt: 'Operacionalização do fenótipo de fragilidade canina (frailty index) — usado pelo Senex para sinalizar predisposição a desfechos adversos e priorizar protocolos preventivos.',
          en: 'Operationalises the canine frailty phenotype (frailty index) — used by Senex to flag predisposition to adverse outcomes and prioritise preventive protocols.'
        },
        url: 'https://www.frontiersin.org/articles/10.3389/fvets.2019.00026/full'
      },
      {
        source: 'Hetionet — Himmelstein et al., eLife 2017',
        quote: {
          pt: 'Grafo de conhecimento biomédico integrando 11 tipos de nós (Compound, Disease, Gene, Pathway, Anatomy…) e 24 tipos de relações — referência direta para a topologia L0–L4 do Senex.',
          en: 'Biomedical knowledge graph integrating 11 node types (Compound, Disease, Gene, Pathway, Anatomy…) and 24 edge types — direct reference for the Senex L0–L4 topology.'
        },
        url: 'https://het.io/'
      },
      {
        source: 'Project Rephetio (Hetionet drug repurposing) — Himmelstein et al., eLife 2017',
        quote: {
          pt: 'Projeto irmão: reposiciona fármacos aprovados percorrendo metapaths no Hetionet — mesma técnica que o Senex usa para sugerir nutracêuticos sinérgicos via gap-fill no KG.',
          en: 'Sister project: repositions approved drugs by walking metapaths over Hetionet — the same technique Senex uses to suggest synergistic nutraceuticals via KG gap-fill.'
        },
        url: 'https://het.io/repurpose/'
      }
    ],
    overview: {
      objective: {
        pt: 'O Senex AI é um motor híbrido de GraphRAG dedicado à longevidade canina. **Implementado hoje:** (1) Triple Graph Construction inspirada em MedGraphRAG (Document → Chunk → Entity → Mechanism); (2) extração de triplets com *Generate + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL* — **inspirada** em KGARevion/GRRA, sem modelo Review independente; (3) recuperação **híbrida Cypher (Neo4j) + pgvector (Supabase)** — **inspirada** em U-Retrieval, sem fusão top-down/bottom-up; (4) ciência da geriatria canina (Dog Aging Project, AgeXtend, frailty index). **Planejado/inspiração (não em runtime):** ciclo GRRA com revisor independente, U-Retrieval bidirecional e TransE link prediction. A saída clínica final é um Digital Twin do paciente — com janela de anos saudáveis estimados (years_gained) e um stack de até 8 nutracêuticos sinérgicos. Para o estado real veja `docs/generated/ARCHITECTURE_LIVE.md`.',
        en: 'Senex AI is a hybrid GraphRAG engine dedicated to canine longevity. **Implemented today:** (1) Triple Graph Construction inspired by MedGraphRAG (Document → Chunk → Entity → Mechanism); (2) triplet extraction with *Generate + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL* — **inspired** by KGARevion/GRRA, with no independent Review model; (3) **hybrid Cypher (Neo4j) + pgvector (Supabase) retrieval** — **inspired** by U-Retrieval, without top-down/bottom-up fusion; (4) canine geroscience (Dog Aging Project, AgeXtend, frailty index). **Planned / inspiration only (not in runtime):** full GRRA cycle with independent reviewer, bidirectional U-Retrieval, and TransE link prediction. Final clinical output is a patient Digital Twin — with an estimated window of healthy years (years_gained) and a stack of up to 8 synergistic nutraceuticals. For the live state see `docs/generated/ARCHITECTURE_LIVE.md`.'
      },
      workflow: [
        { pt: '1. Upload de PDF → Gemini File API extrai texto, título e metadados preservando a hierarquia do documento', en: '1. PDF upload → Gemini File API extracts text, title and metadata preserving the document hierarchy' },
        { pt: '2. Triple Graph Construction → Document → Chunk → Entity → Mechanism (alimenta as 5 camadas L0–L4)', en: '2. Triple Graph Construction → Document → Chunk → Entity → Mechanism (feeds the 5 layers L0–L4)' },
        { pt: '3. Extração em 3 estágios → Stage 1 Entidades · Stage 2 Mecanismos moleculares · Stage 3 Contexto clínico (dose, AE, outcome)', en: '3. 3-stage extraction → Stage 1 Entities · Stage 2 Molecular mechanisms · Stage 3 Clinical context (dose, AE, outcome)' },
        { pt: '4. Validação de triplets → Generate (Gemini) + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL para o restante. Inspirado no GRRA do KGARevion, **sem** modelo Review independente nem etapa Revise — implementado em `generate-triplets`.', en: '4. Triplet validation → Generate (Gemini) + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL for the rest. Inspired by KGARevion\u2019s GRRA, **without** an independent Review model or Revise step — implemented in `generate-triplets`.' },
        { pt: '5. Storage híbrido → Supabase pgvector (embeddings) + tabelas hierárquicas L0–L4 + Neo4j AuraDB (sync ativo via edge functions neo4j-sync / sync-approved-triplets / sync-study-to-neo4j)', en: '5. Hybrid storage → Supabase pgvector (embeddings) + L0–L4 hierarchical tables + Neo4j AuraDB (live sync via edge functions neo4j-sync / sync-approved-triplets / sync-study-to-neo4j)' },
        { pt: '6. Recuperação híbrida → Cypher (Neo4j) + pgvector (Supabase) sobre o KG do paciente. Inspirada em U-Retrieval, **sem** fusão top-down/bottom-up — implementada em `graph-rag-search` e `hybrid-recommendation`.', en: '6. Hybrid retrieval → Cypher (Neo4j) + pgvector (Supabase) over the patient KG. Inspired by U-Retrieval, **without** top-down/bottom-up fusion — implemented in `graph-rag-search` and `hybrid-recommendation`.' },
        { pt: '7. Gap-Fill (PubMed E-utilities + Gemini) → quando o Digital Twin acusa years_gained baixo, varre PubMed por pares (compound × condition) ausentes e gera triplets pendentes', en: '7. Gap-Fill (PubMed E-utilities + Gemini) → when the Digital Twin shows low years_gained, scans PubMed for missing (compound × condition) pairs and emits pending triplets' },
        { pt: '8. Síntese clínica → Gemini compõe o protocolo (≤ 8 compostos sinérgicos) + Digital Twin (curva sigmoide severidade × tempo) + citações rastreáveis ao estudo de origem', en: '8. Clinical synthesis → Gemini composes the protocol (≤ 8 synergistic compounds) + Digital Twin (sigmoid severity × time curve) + citations traceable to the source study' }
      ],
      benefits: [
        { pt: 'Curation gatekeeper + No-Mock Policy: nenhuma recomendação clínica é emitida sem rastrear a um registro real do KG ou ser explicitamente rotulada como "apenas-LLM". Os números ~40% (MedGraphRAG) e ~87% (KGARevion) são **benchmarks dos papers de origem**, não métricas medidas no Senex AI.', en: 'Curation gatekeeper + No-Mock Policy: no clinical recommendation is emitted without tracing back to a real KG record or being explicitly labelled "LLM-only". The ~40% (MedGraphRAG) and ~87% (KGARevion) figures are **benchmarks from the source papers**, not metrics measured inside Senex AI.' },
        { pt: 'Captura relações complexas: sinergias, antagonismos, predisposições de raça, contraindicações', en: 'Captures complex relationships: synergies, antagonisms, breed predispositions, contraindications' },
        { pt: 'Raciocínio multi-hop Compound → Target → Mechanism → Effect → Outcome restrito a doenças metabólicas/degenerativas em cães', en: 'Multi-hop reasoning Compound → Target → Mechanism → Effect → Outcome scoped to canine metabolic/degenerative conditions' },
        { pt: 'Gap-fill PubMed automático quando o paciente fica sem evidência suficiente. Auto-descoberta de pathways via TransE permanece **planejada** (não roda em runtime).', en: 'Automatic PubMed gap-fill when the patient has insufficient evidence. TransE-based pathway auto-discovery remains **planned** (not in runtime).' },
        { pt: 'Curadoria com gatekeeper: nenhum estudo ou triplet entra no KG sem aprovação (auto ≥ 0,50, restante revisado)', en: 'Curation gatekeeper: no study or triplet enters the KG without approval (auto ≥ 0.50, rest reviewed)' },
        { pt: 'No-Mock Policy: toda recomendação é rastreável a registros reais do KG ou rotulada explicitamente como "apenas-LLM"', en: 'No-Mock Policy: every recommendation is traceable to real KG records or explicitly labelled as "LLM-only"' }
      ]
    },
    methodology: {
      description: {
        pt: 'Arquitetura híbrida em 4 fases — Ingestion → Extraction → KG 5-camadas → Validation/Gap-Fill — fechando no Digital Twin. **Implementado:** Triple Graph (MedGraphRAG-style), extração 3-stages, auto-approve heurístico + HITL, recuperação Cypher+pgvector. **Inspiração / planejado (não implementado):** ciclo GRRA completo com revisor (KGARevion), U-Retrieval bidirecional, TransE link prediction. Verdade-base em `docs/generated/ARCHITECTURE_LIVE.md`.',
        en: 'Four-phase hybrid architecture — Ingestion → Extraction → 5-layer KG → Validation/Gap-Fill — closing on the Digital Twin. **Implemented:** Triple Graph (MedGraphRAG-style), 3-stage extraction, heuristic auto-approve + HITL, Cypher+pgvector retrieval. **Inspiration / planned (not implemented):** full GRRA cycle with reviewer (KGARevion), bidirectional U-Retrieval, TransE link prediction. Ground truth in `docs/generated/ARCHITECTURE_LIVE.md`.'
      },
      comparisonTable: {
        headers: [
          { pt: 'Característica', en: 'Feature' },
          { pt: 'MedGraphRAG', en: 'MedGraphRAG' },
          { pt: 'KGARevion', en: 'KGARevion' },
          { pt: 'Senex AI', en: 'Senex AI' }
        ],
        rows: [
          { feature: { pt: '1. Estágios de Extração', en: '1. Extraction Stages' }, values: [ { pt: 'Estágio único', en: 'Single stage' }, { pt: 'Estágio único', en: 'Single stage' }, { pt: '3 estágios (Entidades → Mecanismos → Clínico)', en: '3 stages (Entities → Mechanisms → Clinical)' } ] },
          { feature: { pt: '2. Camadas Hierárquicas', en: '2. Hierarchical Layers' }, values: [ { pt: '3 níveis', en: '3 levels' }, { pt: '2 níveis', en: '2 levels' }, { pt: '5 níveis (L0→L4: Compound→Target→Mechanism→Effect→Outcome)', en: '5 levels (L0→L4: Compound→Target→Mechanism→Effect→Outcome)' } ] },
          { feature: { pt: '3. Tipos de Entidade', en: '3. Entity Types' }, values: [ { pt: 'Drug, Disease, Gene', en: 'Drug, Disease, Gene' }, { pt: 'Entidades biomédicas', en: 'Biomedical entities' }, { pt: 'Nutraceutical, Drug, Condition, Mechanism, Breed, Species, Pet', en: 'Nutraceutical, Drug, Condition, Mechanism, Breed, Species, Pet' } ] },
          { feature: { pt: '4. Tipos de Relação', en: '4. Relation Types' }, values: [ { pt: 'TREATS, CAUSES', en: 'TREATS, CAUSES' }, { pt: 'Relações genéricas', en: 'Generic relations' }, { pt: '20+ tipos (TREATS, MODULATES, SYNERGIZES, ANTAGONIZES, PREDISPOSED_TO…)', en: '20+ types (TREATS, MODULATES, SYNERGIZES, ANTAGONIZES, PREDISPOSED_TO…)' } ] },
          { feature: { pt: '5. Suporte a Ontologias', en: '5. Ontology Support' }, values: [ { pt: 'UMLS, MeSH', en: 'UMLS, MeSH' }, { pt: 'PrimeKG', en: 'PrimeKG' }, { pt: 'SNOMED-CT VetSCT + UMLS + VeNom + AAHA/WSAVA', en: 'SNOMED-CT VetSCT + UMLS + VeNom + AAHA/WSAVA' } ] },
          { feature: { pt: '6. Método de Retrieval', en: '6. Retrieval Method' }, values: [ { pt: 'U-Retrieval (top + bottom)', en: 'U-Retrieval (top + bottom)' }, { pt: 'Busca grounded no KG', en: 'KG-grounded search' }, { pt: 'Híbrido Cypher (Neo4j) + pgvector (Supabase), sem fusão top-down/bottom-up', en: 'Hybrid Cypher (Neo4j) + pgvector (Supabase), no top-down/bottom-up fusion' } ] },
          { feature: { pt: '7. Ciclo de Validação', en: '7. Validation Cycle' }, values: [ { pt: 'Não explícito', en: 'Not explicit' }, { pt: 'Ciclo GRRA', en: 'GRRA cycle' }, { pt: 'Generate + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL (sem Review independente)', en: 'Generate + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL (no independent Review model)' } ] },
          { feature: { pt: '8. Redução de Alucinações (benchmark do paper)', en: '8. Hallucination Reduction (paper benchmark)' }, values: [ { pt: '~40% (benchmark do paper)', en: '~40% (paper benchmark)' }, { pt: '~87% (benchmark do paper)', en: '~87% (paper benchmark)' }, { pt: 'Não medido no Senex AI', en: 'Not measured in Senex AI' } ] },
          { feature: { pt: '9. Foco em Longevidade', en: '9. Longevity Focus' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Geroprotetores, marcadores de idade biológica, frailty index', en: '✅ Geroprotectors, biological-age markers, frailty index' } ] },
          { feature: { pt: '10. Score de Sinergia', en: '10. Synergy Scoring' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Quantificação de pathways compartilhados + stack ≤ 8 compostos', en: '✅ Shared-pathway quantification + stack capped at 8 compounds' } ] },
          { feature: { pt: '11. Predisposição por Raça', en: '11. Breed Predisposition' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Caminhos Species → BreedGroup → Breed → Condition', en: '✅ Species → BreedGroup → Breed → Condition paths' } ] },
          { feature: { pt: '12. Auto-Descoberta (Link Prediction)', en: '12. Auto-Discovery (Link Prediction)' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Gap-fill via PubMed E-utilities + Gemini (TransE permanece apenas inspiração, não implementado)', en: 'Gap-fill via PubMed E-utilities + Gemini (TransE remains inspiration only, not implemented)' } ] },
          { feature: { pt: '13. Gap-Fill PubMed', en: '13. PubMed Gap-Fill' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ PubMed E-utilities + Gemini → triplets pendentes automáticos', en: '✅ PubMed E-utilities + Gemini → automatic pending triplets' } ] },
          { feature: { pt: '14. Digital Twin Longitudinal', en: '14. Longitudinal Digital Twin' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Projeção sigmoide + métrica years_gained', en: '✅ Sigmoid projection + years_gained metric' } ] }
        ]
      },
      architectureDiagram: `flowchart TD
  subgraph P1["Phase 1 - Ingestion"]
    A1["PDF / DOI upload"] --> A2["Gemini File API<br/>(OCR + structuring)"]
    A2 --> A3["Title + metadata<br/>extraction"]
    A3 --> A4["Chunks (512 tok)<br/>+ pgvector embeddings"]
  end
  subgraph P2["Phase 2 - 3-Stage Extraction"]
    B1["Stage 1<br/>Entities"] --> B2["Stage 2<br/>Mechanisms"]
    B2 --> B3["Stage 3<br/>Clinical context<br/>(dose, AE, outcome)"]
  end
  subgraph P3["Phase 3 - 5-Layer Knowledge Graph"]
    L0["L0 - Compound<br/>(nutraceutical / drug)"] --> L1["L1 - Target<br/>(receptor / enzyme)"]
    L1 --> L2["L2 - Mechanism<br/>(pathway / cascade)"]
    L2 --> L3["L3 - Effect<br/>(biological / clinical)"]
    L3 --> L4["L4 - Outcome<br/>(condition · breed · species)"]
  end
  subgraph P4["Phase 4 - Validation & Gap-Fill"]
    V1["Generate + heuristic<br/>scoring (0.65-0.75)"] --> V2["Auto-approve >= 0.50<br/>+ human curation (HITL)"]
    V2 --> V4["PubMed E-utilities<br/>+ Gemini gap-fill"]
  end
  subgraph OUT["Clinical Output"]
    O1["Hybrid retrieval<br/>Cypher (Neo4j) + pgvector"] --> O2["Recommendation engine<br/>(stack <= 8 compounds)"]
    O2 --> O3["Digital Twin<br/>sigmoid · years_gained"]
  end
  A4 --> B1
  B3 --> L0
  L4 --> V1
  V4 --> L0
  L4 --> O1
`,
      calculations: [
        {
          name: { pt: '1. Confidence Score heurístico (inspirado em KGARevion)', en: '1. Heuristic confidence score (inspired by KGARevion)' },
          formula: 'confidence = 0.4 * grounding + 0.3 * consistency + 0.2 * source_quality + 0.1 * llm_agreement\nauto-approve when confidence >= 0.50',
          example: {
            pt: 'Triplet "Omega-3 → MODULATES → COX-2 pathway": grounding 0.9, consistency 0.8, source_quality 0.7, llm_agreement 0.85 ⇒ 0.84 → auto-aprovado.',
            en: 'Triplet "Omega-3 → MODULATES → COX-2 pathway": grounding 0.9, consistency 0.8, source_quality 0.7, llm_agreement 0.85 ⇒ 0.84 → auto-approved.'
          }
        },
        {
          name: { pt: '2. Digital Twin - Projeção Sigmoide', en: '2. Digital Twin - Sigmoid Projection' },
          formula: 'severity(t) = baseline / (1 + exp(k * (t - t0)))\nyears_gained = integral_0^T [ severity_control(t) - severity_protocol(t) ] dt',
          example: {
            pt: 'OA grau 2 + protocolo Omega-3 + Boswellia: k=0,35, t0=18m ⇒ years_gained ≈ 1,4 anos saudáveis.',
            en: 'Grade-2 OA + Omega-3 + Boswellia protocol: k=0.35, t0=18m ⇒ years_gained ≈ 1.4 healthy years.'
          }
        }
      ],
      decisions: [
        { pt: 'Hierarquia de 5 camadas (L0–L4) para modelar a cascata biológica Compound → Outcome', en: '5-layer hierarchy (L0–L4) to model the Compound → Outcome biological cascade' },
        { pt: 'Threshold de auto-aprovação de triplets: confidence ≥ 0,50 (restante vai para curadoria humana)', en: 'Triplet auto-approval threshold: confidence ≥ 0.50 (rest goes to human curation)' },
        { pt: 'Chunking de 512 tokens para preservar contexto e mecanismos completos', en: '512-token chunking to preserve context and complete mechanisms' },
        { pt: 'Embeddings pgvector (1536D) para busca semântica rápida sobre os chunks', en: 'pgvector embeddings (1536D) for fast semantic search across chunks' },
        { pt: 'Validação GRADE-style: High / Moderate / Low / Very Low', en: 'GRADE-style validation: High / Moderate / Low / Very Low' },
        { pt: 'Cap de protocolo em 8 compostos sinérgicos (dedupe por chave alfanumérica)', en: 'Protocol capped at 8 synergistic compounds (deduplicated by alphanumeric key)' },
        { pt: 'Escopo clínico restrito a doenças metabólicas/degenerativas em cães (sem imagens complexas como RM)', en: 'Clinical scope restricted to canine metabolic/degenerative conditions (no complex imaging like MRI)' }
      ],
      glossary: [
        { term: { pt: 'Triple Graph', en: 'Triple Graph' }, definition: { pt: 'Estrutura hierárquica Document → Chunk → Entity → Mechanism', en: 'Hierarchical structure Document → Chunk → Entity → Mechanism' } },
        { term: { pt: 'U-Retrieval (apenas inspiração)', en: 'U-Retrieval (inspiration only)' }, definition: { pt: 'Conceito do MedGraphRAG: busca em U combinando top-down (graph) + bottom-up (vector). NÃO implementado no Senex AI — a recuperação real é Cypher (Neo4j) + pgvector (Supabase), sem fusão hierárquica.', en: 'MedGraphRAG concept: U-shaped search combining top-down (graph) + bottom-up (vector). NOT implemented in Senex AI — actual retrieval is Cypher (Neo4j) + pgvector (Supabase), without hierarchical fusion.' } },
        { term: { pt: 'Ciclo GRRA (apenas inspiração)', en: 'GRRA Cycle (inspiration only)' }, definition: { pt: 'Conceito do KGARevion: Generate → Review → Revise → Answer (validação iterativa contra o KG por um modelo Reviewer independente). NÃO implementado no Senex AI — usamos Generate + scoring heurístico + auto-approve ≥ 0,50 + HITL.', en: 'KGARevion concept: Generate → Review → Revise → Answer (iterative validation against the KG by an independent Reviewer model). NOT implemented in Senex AI — we use Generate + heuristic scoring + auto-approve ≥ 0.50 + HITL.' } },
        { term: { pt: 'TransE (apenas inspiração)', en: 'TransE (inspiration only)' }, definition: { pt: 'Translating Embeddings: h + r ≈ t para link prediction. NÃO implementado no Senex AI — o gap-fill é feito por PubMed E-utilities + Gemini.', en: 'Translating Embeddings: h + r ≈ t for link prediction. NOT implemented in Senex AI — gap-fill is done via PubMed E-utilities + Gemini.' } },
        { term: { pt: 'GRADE', en: 'GRADE' }, definition: { pt: 'Sistema de classificação de evidências: High / Moderate / Low / Very Low', en: 'Evidence grading system: High / Moderate / Low / Very Low' } },
        { term: { pt: 'VeNom', en: 'VeNom' }, definition: { pt: 'Veterinary Nomenclature (Purdue) — vocabulário veterinário padronizado', en: 'Veterinary Nomenclature (Purdue) — standardised veterinary vocabulary' } },
        { term: { pt: 'Digital Twin', en: 'Digital Twin' }, definition: { pt: 'Réplica computacional do pet: projeta severidade × tempo sob diferentes protocolos', en: 'Computational replica of the pet: projects severity × time under different protocols' } },
        { term: { pt: 'Years Gained', en: 'Years Gained' }, definition: { pt: 'Anos saudáveis adicionais estimados ao adotar o protocolo vs. controle', en: 'Estimated additional healthy years from adopting the protocol vs. control' } },
        { term: { pt: 'Gap-Fill Triplet', en: 'Gap-Fill Triplet' }, definition: { pt: 'Triplet pendente gerado automaticamente quando o KG não cobre uma combinação (compound × condition) relevante para o paciente', en: 'Pending triplet generated automatically when the KG lacks a (compound × condition) combination relevant to the patient' } }
      ],
      limitations: [
        { pt: 'Neo4j AuraDB integrado para sincronização e exploração (sync-approved-triplets / sync-study-to-neo4j), mas o read-path clínico principal ainda é via RPC Postgres — Cypher direto está no roadmap', en: 'Neo4j AuraDB is integrated for sync and exploration (sync-approved-triplets / sync-study-to-neo4j), but the main clinical read-path still goes through Postgres RPC — direct Cypher is on the roadmap' },
        { pt: 'TransE link prediction não está implementado (apenas inspiração científica); o gap-fill em produção é feito por PubMed E-utilities + Gemini', en: 'TransE link prediction is not implemented (scientific inspiration only); production gap-fill is done via PubMed E-utilities + Gemini' },
        { pt: 'Predisposição por raça populada para ~120 raças principais — long tail em expansão', en: 'Breed predisposition populated for ~120 main breeds — long tail still expanding' },
        { pt: 'Escopo clínico limitado a doenças metabólicas/degenerativas em cães (felinos e imagens complexas fora de escopo)', en: 'Clinical scope limited to canine metabolic/degenerative conditions (felines and complex imaging out of scope)' },
        { pt: 'Digital Twin usa projeção sigmoide simplificada — modelos compartimentais multi-órgão estão no roadmap', en: 'Digital Twin uses a simplified sigmoid projection — multi-organ compartmental models are on the roadmap' }
      ]
    },
    scientific: {
      foundation: {
        pt: 'Sistema híbrido fundamentado em quatro pilares — separando o que **roda hoje** do que é **apenas inspiração científica**. **Implementado:** (1) Triple Graph Construction hierárquica L0–L4 (inspirada em MedGraphRAG); (2) extração de triplets com Generate + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL (inspirada em KGARevion, sem ciclo GRRA); (3) recuperação híbrida Cypher (Neo4j) + pgvector (Supabase), sem fusão U-Retrieval; (4) gap-fill via PubMed E-utilities + Gemini (sem TransE); (5) ciência da longevidade canina (Dog Aging Project, AgeXtend, frailty index, AAHA/WSAVA). **Apenas inspiração (não implementado):** U-Retrieval bidirecional, ciclo GRRA completo com revisor independente, TransE link prediction. Toda recomendação clínica é rastreável a um estudo no KG ou explicitamente marcada como "apenas-LLM". Verdade-base em `docs/generated/ARCHITECTURE_LIVE.md`.',
        en: 'Hybrid system built on four pillars — separating what **runs today** from **scientific inspiration only**. **Implemented:** (1) hierarchical Triple Graph Construction L0–L4 (inspired by MedGraphRAG); (2) triplet extraction via Generate + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL (inspired by KGARevion, no GRRA cycle); (3) hybrid retrieval Cypher (Neo4j) + pgvector (Supabase), no U-Retrieval fusion; (4) gap-fill via PubMed E-utilities + Gemini (no TransE); (5) canine longevity science (Dog Aging Project, AgeXtend, frailty index, AAHA/WSAVA). **Inspiration only (not implemented):** bidirectional U-Retrieval, full GRRA cycle with independent reviewer, TransE link prediction. Every clinical recommendation is traceable to a study in the KG or explicitly flagged as "LLM-only". Ground truth in `docs/generated/ARCHITECTURE_LIVE.md`.'
      },
      implementationStatus: {
        implemented: [
          { pt: 'Upload de PDF + Gemini File API (texto + título + metadados)', en: 'PDF upload + Gemini File API (text + title + metadata)' },
          { pt: 'Extração de entidades em 3 estágios com tool calling (Gemini 2.5 / 3 Pro)', en: '3-stage entity extraction with tool calling (Gemini 2.5 / 3 Pro)' },
          { pt: 'Triplet Bank com auto-approve ≥ 0,50 e curadoria humana para os demais', en: 'Triplet Bank with auto-approve ≥ 0.50 and human curation for the rest' },
          { pt: 'KG hierárquico L0–L4 em Supabase + embeddings pgvector (1536D)', en: 'Hierarchical KG L0–L4 in Supabase + pgvector embeddings (1536D)' },
          { pt: 'Recomendação clínica (stack ≤ 8 compostos) com citações rastreáveis ao estudo', en: 'Clinical recommendation (stack ≤ 8 compounds) with citations traceable to the source study' },
          { pt: 'Digital Twin com projeção sigmoide e métrica years_gained', en: 'Digital Twin with sigmoid projection and years_gained metric' },
          { pt: 'Pipeline de gap-fill (PubMed E-utilities + Gemini) gerando triplets pendentes', en: 'PubMed E-utilities + Gemini gap-fill pipeline emitting pending triplets' },
          { pt: 'Treatment Proposals bilíngues com cronograma de exames e marcos clínicos', en: 'Bilingual treatment proposals with exam schedule and clinical milestones' }
        ],
        inProgress: [
          { pt: 'Cobertura nutricional do catálogo de rações (admin Pet Food Coverage + bulk-enrich)', en: 'Nutrition coverage for the pet-food catalog (Pet Food Coverage admin + bulk-enrich)' },
          { pt: 'Expansão da predisposição por raça para o long-tail (~120 raças cobertas)', en: 'Expanding breed predisposition to the long-tail (~120 breeds covered)' }
        ],
        planned: [
          { pt: 'TransE link prediction (apenas inspiração científica hoje — não há treinamento nem inferência implementados)', en: 'TransE link prediction (scientific inspiration only today — no training or inference implemented)' },
          { pt: 'Modelos compartimentais multi-órgão para o Digital Twin (rim, fígado, articular)', en: 'Multi-organ compartmental models for the Digital Twin (kidney, liver, joint)' },
          { pt: 'Curadoria colaborativa em tempo real (vários veterinários no mesmo triplet)', en: 'Real-time collaborative curation (multiple vets on the same triplet)' },
          { pt: 'Recuperação U-Retrieval bidirecional real (top-down + bottom-up com fusão hierárquica) — hoje recuperação é Cypher + pgvector concatenados', en: 'Real bidirectional U-Retrieval (top-down + bottom-up with hierarchical fusion) — today retrieval is concatenated Cypher + pgvector' },
          { pt: 'Ciclo GRRA completo com modelo Reviewer independente e etapa Revise (hoje: scoring heurístico + HITL)', en: 'Full GRRA cycle with independent Reviewer model and Revise step (today: heuristic scoring + HITL)' },
          { pt: 'Extensão controlada para felinos após validação da curva canina', en: 'Controlled extension to felines after the canine curve is validated' }
        ]
      },
      studies: [
        { title: { pt: 'MedGraphRAG: rumo a LLMs médicos seguros via RAG com grafos', en: 'MedGraphRAG: Towards Safe Medical LLM via Graph Retrieval-Augmented Generation' }, authors: 'Wu et al.', year: 2024, journal: { pt: 'arXiv preprint', en: 'arXiv preprint' }, url: 'https://arxiv.org/abs/2408.04187', keyFindings: { pt: 'Triple Graph (Doc → Chunk → Entity → Mechanism) + U-Retrieval bidirecional reduz alucinações em ~40% em QA médico.', en: 'Triple Graph (Doc → Chunk → Entity → Mechanism) + bidirectional U-Retrieval reduces hallucinations by ~40% on medical QA.' } },
        { title: { pt: 'KGARevion: revisão aumentada por KG para extração biomédica', en: 'KGARevion: Knowledge Graph-Augmented Revision for Biomedical Information Extraction' }, authors: 'Su et al.', year: 2025, journal: { pt: 'ICLR 2025 (Poster)', en: 'ICLR 2025 (Poster)' }, url: 'https://openreview.net/forum?id=OOq3W1MEVT', keyFindings: { pt: 'Ciclo GRRA (Generate-Review-Revise-Answer) elimina ~87% dos erros ao validar triplets contra o KG.', en: 'GRRA cycle (Generate-Review-Revise-Answer) eliminates ~87% of errors by validating triplets against the KG.' } },
        { title: { pt: 'Translating Embeddings para dados multi-relacionais', en: 'Translating Embeddings for Modeling Multi-relational Data' }, authors: 'Bordes et al.', year: 2013, journal: { pt: 'NeurIPS', en: 'NeurIPS' }, url: 'https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html', keyFindings: { pt: 'TransE modela relações como translações (h + r ≈ t), habilitando link prediction de alta precisão.', en: 'TransE models relations as translations (h + r ≈ t), enabling high-precision link prediction.' } },
        { title: { pt: 'An Open Science Study of Ageing in Companion Dogs (Dog Aging Project)', en: 'An Open Science Study of Ageing in Companion Dogs (Dog Aging Project)' }, authors: 'Creevy KE, Akey JM, Kaeberlein M et al.', year: 2022, journal: { pt: 'Nature', en: 'Nature' }, url: 'https://www.nature.com/articles/s41586-021-04231-6', keyFindings: { pt: 'Coorte longitudinal aberta de >45.000 cães — fonte empírica dos marcadores de idade biológica e curvas de sobrevida usados pelo Digital Twin.', en: 'Open longitudinal cohort of >45,000 dogs — empirical source of biological-age markers and survival curves used by the Digital Twin.' } },
        { title: { pt: 'AgeXtend: predição multiômica de geroprotetores por IA', en: 'AgeXtend: AI-based multi-omic geroprotector prediction' }, authors: 'Ahuja S, Mukherjee N et al.', year: 2024, journal: { pt: 'Nature Aging', en: 'Nature Aging' }, url: 'https://www.nature.com/articles/s43587-024-00763-4', keyFindings: { pt: 'Rastreou ~1,1 bilhão de compostos para identificar geroprotetores, mimétricos de restrição calórica e indutores de autofagia.', en: 'Screened ~1.1B compounds to identify geroprotectors, caloric-restriction mimetics and autophagy inducers.' } },
        { title: { pt: 'Test of Rapamycin in Aging Dogs (TRIAD trial)', en: 'Test of Rapamycin in Aging Dogs (TRIAD trial)' }, authors: 'Kaeberlein M, Creevy KE et al.', year: 2023, journal: { pt: 'GeroScience', en: 'GeroScience' }, url: 'https://link.springer.com/article/10.1007/s11357-023-00744-2', keyFindings: { pt: 'RCT de rapamicina em cães seniores — ancora a classe mTOR-inhibitor no catálogo e o desenho dos marcos de follow-up.', en: 'RCT of rapamycin in senior dogs — anchors the mTOR-inhibitor class in our catalog and the design of follow-up milestones.' } },
        { title: { pt: 'Senolíticos: da descoberta à translação clínica', en: 'Senolytic drugs: from discovery to translation' }, authors: 'Kirkland JL, Tchkonia T', year: 2020, journal: { pt: 'Journal of Internal Medicine', en: 'Journal of Internal Medicine' }, url: 'https://onlinelibrary.wiley.com/doi/10.1111/joim.13141', keyFindings: { pt: 'Revisão fundadora da classe senolítica (quercetina, fisetina, dasatinib+Q) que integra o catálogo do Senex.', en: 'Foundational review of the senolytic class (quercetin, fisetin, dasatinib+Q) that populates the Senex catalog.' } },
        { title: { pt: 'Frailty em cães: metodologia e operacionalização de um frailty index', en: 'Frailty in dogs: methodology and operationalisation of a frailty index' }, authors: 'Banzato T et al.', year: 2019, journal: { pt: 'Frontiers in Veterinary Science', en: 'Frontiers in Veterinary Science' }, url: 'https://www.frontiersin.org/articles/10.3389/fvets.2019.00026/full', keyFindings: { pt: 'Operacionaliza o fenótipo de fragilidade em cães — base do sinalizador clínico de alto risco do Senex.', en: 'Operationalises the canine frailty phenotype — basis for the Senex high-risk clinical flag.' } },
        { title: { pt: 'AAHA Nutritional Assessment Guidelines for Dogs and Cats', en: 'AAHA Nutritional Assessment Guidelines for Dogs and Cats' }, authors: 'Freeman LM, Becvarova I, Cave N et al.', year: 2021, journal: { pt: 'JAAHA', en: 'JAAHA' }, url: 'https://www.aaha.org/aaha-guidelines/2010-aaha-nutritional-assessment-guidelines-for-dogs-and-cats/', keyFindings: { pt: 'Diretriz operacional de avaliação nutricional sistemática — sustenta a análise "ração vs. necessidades ideais" do Senex.', en: 'Operational guideline for systematic nutritional assessment — backs the Senex "food vs. ideal requirements" analysis.' } },
        { title: { pt: 'WSAVA Global Nutrition Toolkit', en: 'WSAVA Global Nutrition Toolkit' }, authors: 'WSAVA Global Nutrition Committee', year: 2021, journal: { pt: 'WSAVA', en: 'WSAVA' }, url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/', keyFindings: { pt: 'Conjunto global de ferramentas de nutrição (BCS, MCS, calculadora calórica) — referência internacional adotada pelo Senex.', en: 'Global nutrition toolkit (BCS, MCS, calorie calculator) — international reference adopted by Senex.' } }
      ],
      references: [
        '[Guideline] AAHA Senior Care Guidelines (2023) — https://www.aaha.org/resources/2023-aaha-senior-care-guidelines-for-dogs-and-cats/',
        '[Guideline] AAHA Nutritional Assessment Guidelines (2021) — https://www.aaha.org/aaha-guidelines/2010-aaha-nutritional-assessment-guidelines-for-dogs-and-cats/',
        '[Guideline] WSAVA Global Nutrition Toolkit (2021) — https://wsava.org/global-guidelines/global-nutrition-guidelines/',
        '[Guideline] GRADE Working Group — https://www.gradeworkinggroup.org/',
        '[Ontology] SNOMED-CT Veterinary Extension (VetSCT) — https://www.snomed.org/our-customers/veterinary',
        '[Ontology] UMLS Metathesaurus — https://www.nlm.nih.gov/research/umls/',
        '[Ontology] VeNom Veterinary Nomenclature (Purdue) — https://www.vin.com/venom/',
        '[Dataset] Dog Aging Project — https://dogagingproject.org/',
        '[Dataset] PubMed / NCBI E-utilities — https://www.ncbi.nlm.nih.gov/books/NBK25501/',
        '[Dataset] Natural Medicines Database — https://naturalmedicines.therapeuticresearch.com/',
        '[Paper] MedGraphRAG (Wu et al., 2024) — https://arxiv.org/abs/2408.04187',
        '[Paper] KGARevion (Su et al., ICLR 2025) — https://openreview.net/forum?id=OOq3W1MEVT',
        '[Paper] TransE (Bordes et al., NeurIPS 2013) — https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html',
        '[Paper] AgeXtend (Ahuja et al., Nature Aging 2024) — https://www.nature.com/articles/s43587-024-00763-4',
        '[Paper] TRIAD — Rapamycin in aging dogs (Kaeberlein 2023) — https://link.springer.com/article/10.1007/s11357-023-00744-2',
        '[Paper] Frailty in Dogs (Banzato 2019) — https://www.frontiersin.org/articles/10.3389/fvets.2019.00026/full',
        '[Paper] Senolytics review (Kirkland & Tchkonia 2020) — https://onlinelibrary.wiley.com/doi/10.1111/joim.13141'
      ]
    }
  },
};
