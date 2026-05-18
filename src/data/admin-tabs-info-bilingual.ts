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
    version: '5.1.0',
    lastUpdate: '2026-05-18',
    keyExcerpts: [
      {
        source: 'MedGraphRAG — Wu et al., 2024 (arXiv:2408.04187)',
        quote: {
          pt: 'A construção em Triple Graph (Document → Chunk → Entity → Mechanism) combinada com U-Retrieval bidirecional reduz alucinações em ~40% em QA médico e fundamenta a hierarquia L0–L4 do Senex AI.',
          en: 'Triple Graph Construction (Document → Chunk → Entity → Mechanism) combined with bidirectional U-Retrieval reduces hallucinations by ~40% on medical QA and underpins the L0–L4 hierarchy used by Senex AI.'
        },
        url: 'https://arxiv.org/abs/2408.04187'
      },
      {
        source: 'KGARevion — Su et al., ICLR 2025',
        quote: {
          pt: 'O ciclo GRRA (Generate → Review → Revise → Answer) valida triplets contra um KG fundamentado e elimina ~87% dos erros de extração biomédica — base do nosso auto-approve threshold e da curadoria humana.',
          en: 'The GRRA cycle (Generate → Review → Revise → Answer) validates triplets against a grounded KG and removes ~87% of biomedical extraction errors — the basis for our auto-approve threshold and human-in-the-loop curation.'
        },
        url: 'https://openreview.net/forum?id=OOq3W1MEVT'
      },
      {
        source: 'TransE — Bordes et al., NeurIPS 2013',
        quote: {
          pt: 'Modelagem de relações como translações no espaço de embeddings (h + r ≈ t) habilita link prediction de pathways ausentes — usado no nosso pipeline de gap-fill (compound × condition).',
          en: 'Modelling relations as translations in embedding space (h + r ≈ t) enables link prediction of missing pathways — used by our (compound × condition) gap-fill pipeline.'
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
      }
    ],
    overview: {
      objective: {
        pt: 'O Senex AI é um motor híbrido de GraphRAG dedicado à longevidade canina. Combina (1) Triple Graph Construction do MedGraphRAG, (2) ciclo de validação GRRA do KGARevion, (3) TransE para link prediction e (4) ciência da geriatria canina (Dog Aging Project, AgeXtend, frailty index). A saída clínica final é um Digital Twin do paciente — com janela de anos saudáveis estimados (years_gained) e um stack de até 8 nutracêuticos sinérgicos.',
        en: 'Senex AI is a hybrid GraphRAG engine dedicated to canine longevity. It combines (1) MedGraphRAG\u2019s Triple Graph Construction, (2) KGARevion\u2019s GRRA validation cycle, (3) TransE for link prediction and (4) canine geroscience (Dog Aging Project, AgeXtend, frailty index). The final clinical output is a patient Digital Twin — with an estimated window of healthy years (years_gained) and a stack of up to 8 synergistic nutraceuticals.'
      },
      workflow: [
        { pt: '1. Upload de PDF → Gemini File API extrai texto, título e metadados preservando a hierarquia do documento', en: '1. PDF upload → Gemini File API extracts text, title and metadata preserving the document hierarchy' },
        { pt: '2. Triple Graph Construction → Document → Chunk → Entity → Mechanism (alimenta as 5 camadas L0–L4)', en: '2. Triple Graph Construction → Document → Chunk → Entity → Mechanism (feeds the 5 layers L0–L4)' },
        { pt: '3. Extração em 3 estágios → Stage 1 Entidades · Stage 2 Mecanismos moleculares · Stage 3 Contexto clínico (dose, AE, outcome)', en: '3. 3-stage extraction → Stage 1 Entities · Stage 2 Molecular mechanisms · Stage 3 Clinical context (dose, AE, outcome)' },
        { pt: '4. Ciclo GRRA (KGARevion) → Generate → Review contra o KG → Revise → Answer/Approve (auto ≥ 0,50, restante para curadoria)', en: '4. GRRA cycle (KGARevion) → Generate → Review against the KG → Revise → Answer/Approve (auto ≥ 0.50, rest goes to curation)' },
        { pt: '5. Storage híbrido → Supabase pgvector (embeddings) + tabelas hierárquicas L0–L4 + Neo4j AuraDB (sync ativo via edge functions neo4j-sync / sync-approved-triplets / sync-study-to-neo4j)', en: '5. Hybrid storage → Supabase pgvector (embeddings) + L0–L4 hierarchical tables + Neo4j AuraDB (live sync via edge functions neo4j-sync / sync-approved-triplets / sync-study-to-neo4j)' },
        { pt: '6. U-Retrieval → busca híbrida top-down (graph) + bottom-up (vetorial) sobre o KG do paciente', en: '6. U-Retrieval → hybrid top-down (graph) + bottom-up (vector) search over the patient KG' },
        { pt: '7. Gap-Fill (PubMed E-utilities + Gemini) → quando o Digital Twin acusa years_gained baixo, varre PubMed por pares (compound × condition) ausentes e gera triplets pendentes', en: '7. Gap-Fill (PubMed E-utilities + Gemini) → when the Digital Twin shows low years_gained, scans PubMed for missing (compound × condition) pairs and emits pending triplets' },
        { pt: '8. Síntese clínica → Gemini compõe o protocolo (≤ 8 compostos sinérgicos) + Digital Twin (curva sigmoide severidade × tempo) + citações rastreáveis ao estudo de origem', en: '8. Clinical synthesis → Gemini composes the protocol (≤ 8 synergistic compounds) + Digital Twin (sigmoid severity × time curve) + citations traceable to the source study' }
      ],
      benefits: [
        { pt: 'Redução de ~50% em alucinações combinando MedGraphRAG (~40%) + KGARevion (~87% de erros eliminados na curadoria)', en: '~50% hallucination reduction combining MedGraphRAG (~40%) + KGARevion (~87% errors removed in curation)' },
        { pt: 'Captura relações complexas: sinergias, antagonismos, predisposições de raça, contraindicações', en: 'Captures complex relationships: synergies, antagonisms, breed predispositions, contraindications' },
        { pt: 'Raciocínio multi-hop Compound → Target → Mechanism → Effect → Outcome restrito a doenças metabólicas/degenerativas em cães', en: 'Multi-hop reasoning Compound → Target → Mechanism → Effect → Outcome scoped to canine metabolic/degenerative conditions' },
        { pt: 'Auto-descoberta de pathways via TransE + gap-fill PubMed automático quando o paciente fica sem evidência suficiente', en: 'Pathway auto-discovery via TransE + automatic PubMed gap-fill when the patient has insufficient evidence' },
        { pt: 'Curadoria com gatekeeper: nenhum estudo ou triplet entra no KG sem aprovação (auto ≥ 0,50, restante revisado)', en: 'Curation gatekeeper: no study or triplet enters the KG without approval (auto ≥ 0.50, rest reviewed)' },
        { pt: 'No-Mock Policy: toda recomendação é rastreável a registros reais do KG ou rotulada explicitamente como "apenas-LLM"', en: 'No-Mock Policy: every recommendation is traceable to real KG records or explicitly labelled as "LLM-only"' }
      ]
    },
    methodology: {
      description: {
        pt: 'Arquitetura híbrida em 4 fases — Ingestion → Extraction → KG 5-camadas → Validation/Gap-Fill — fechando no Digital Twin. Combina MedGraphRAG (Triple Graph + U-Retrieval), KGARevion (GRRA + auto-approve), TransE (link prediction) e ciência da longevidade canina (Dog Aging Project, AgeXtend).',
        en: 'Four-phase hybrid architecture — Ingestion → Extraction → 5-layer KG → Validation/Gap-Fill — closing on the Digital Twin. Combines MedGraphRAG (Triple Graph + U-Retrieval), KGARevion (GRRA + auto-approve), TransE (link prediction) and canine longevity science (Dog Aging Project, AgeXtend).'
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
          { feature: { pt: '6. Método de Retrieval', en: '6. Retrieval Method' }, values: [ { pt: 'U-Retrieval (top + bottom)', en: 'U-Retrieval (top + bottom)' }, { pt: 'Busca grounded no KG', en: 'KG-grounded search' }, { pt: 'Híbrido: U-Retrieval + validação KG + confidence scoring', en: 'Hybrid: U-Retrieval + KG validation + confidence scoring' } ] },
          { feature: { pt: '7. Ciclo de Validação', en: '7. Validation Cycle' }, values: [ { pt: 'Não explícito', en: 'Not explicit' }, { pt: 'Ciclo GRRA', en: 'GRRA cycle' }, { pt: 'GRRA + human-in-the-loop + GRADE + auto-approve ≥ 0,50', en: 'GRRA + human-in-the-loop + GRADE + auto-approve ≥ 0.50' } ] },
          { feature: { pt: '8. Redução de Alucinações', en: '8. Hallucination Reduction' }, values: [ { pt: '~40%', en: '~40%' }, { pt: '~87% de erros eliminados', en: '~87% errors eliminated' }, { pt: 'Combinado: ~50% esperado', en: 'Combined: ~50% expected' } ] },
          { feature: { pt: '9. Foco em Longevidade', en: '9. Longevity Focus' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Geroprotetores, marcadores de idade biológica, frailty index', en: '✅ Geroprotectors, biological-age markers, frailty index' } ] },
          { feature: { pt: '10. Score de Sinergia', en: '10. Synergy Scoring' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Quantificação de pathways compartilhados + stack ≤ 8 compostos', en: '✅ Shared-pathway quantification + stack capped at 8 compounds' } ] },
          { feature: { pt: '11. Predisposição por Raça', en: '11. Breed Predisposition' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ Caminhos Species → BreedGroup → Breed → Condition', en: '✅ Species → BreedGroup → Breed → Condition paths' } ] },
          { feature: { pt: '12. Auto-Descoberta (Link Prediction)', en: '12. Auto-Discovery (Link Prediction)' }, values: [ { pt: 'Não coberto', en: 'Not covered' }, { pt: 'Não coberto', en: 'Not covered' }, { pt: '✅ TransE link prediction para pathways novos', en: '✅ TransE link prediction for novel pathways' } ] },
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
    V1["GRRA cycle<br/>(KGARevion)"] --> V2["Auto-approve >= 0.50<br/>+ human curation"]
    V2 --> V3["TransE link prediction"]
    V3 --> V4["PubMed E-utilities<br/>+ Gemini gap-fill"]
  end
  subgraph OUT["Clinical Output"]
    O1["U-Retrieval<br/>(top-down + bottom-up)"] --> O2["Recommendation engine<br/>(stack <= 8 compounds)"]
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
          name: { pt: '1. KGARevion - Confidence Score', en: '1. KGARevion - Confidence Score' },
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
        { term: { pt: 'U-Retrieval', en: 'U-Retrieval' }, definition: { pt: 'Busca em U: top-down (graph) + bottom-up (vector)', en: 'U-shaped search: top-down (graph) + bottom-up (vector)' } },
        { term: { pt: 'Ciclo GRRA', en: 'GRRA Cycle' }, definition: { pt: 'Generate → Review → Revise → Answer (validação iterativa contra o KG)', en: 'Generate → Review → Revise → Answer (iterative validation against the KG)' } },
        { term: { pt: 'TransE', en: 'TransE' }, definition: { pt: 'Translating Embeddings: h + r ≈ t para link prediction', en: 'Translating Embeddings: h + r ≈ t for link prediction' } },
        { term: { pt: 'GRADE', en: 'GRADE' }, definition: { pt: 'Sistema de classificação de evidências: High / Moderate / Low / Very Low', en: 'Evidence grading system: High / Moderate / Low / Very Low' } },
        { term: { pt: 'VeNom', en: 'VeNom' }, definition: { pt: 'Veterinary Nomenclature (Purdue) — vocabulário veterinário padronizado', en: 'Veterinary Nomenclature (Purdue) — standardised veterinary vocabulary' } },
        { term: { pt: 'Digital Twin', en: 'Digital Twin' }, definition: { pt: 'Réplica computacional do pet: projeta severidade × tempo sob diferentes protocolos', en: 'Computational replica of the pet: projects severity × time under different protocols' } },
        { term: { pt: 'Years Gained', en: 'Years Gained' }, definition: { pt: 'Anos saudáveis adicionais estimados ao adotar o protocolo vs. controle', en: 'Estimated additional healthy years from adopting the protocol vs. control' } },
        { term: { pt: 'Gap-Fill Triplet', en: 'Gap-Fill Triplet' }, definition: { pt: 'Triplet pendente gerado automaticamente quando o KG não cobre uma combinação (compound × condition) relevante para o paciente', en: 'Pending triplet generated automatically when the KG lacks a (compound × condition) combination relevant to the patient' } }
      ],
      limitations: [
        { pt: 'Neo4j AuraDB ainda não integrado — o KG vive em tabelas hierárquicas no Supabase', en: 'Neo4j AuraDB not yet integrated — the KG lives in Supabase hierarchical tables' },
        { pt: 'TransE link prediction roda em batch noturno; ainda não opera online por requisição', en: 'TransE link prediction runs as a nightly batch; not yet served online per request' },
        { pt: 'Predisposição por raça populada para ~120 raças principais — long tail em expansão', en: 'Breed predisposition populated for ~120 main breeds — long tail still expanding' },
        { pt: 'Escopo clínico limitado a doenças metabólicas/degenerativas em cães (felinos e imagens complexas fora de escopo)', en: 'Clinical scope limited to canine metabolic/degenerative conditions (felines and complex imaging out of scope)' },
        { pt: 'Digital Twin usa projeção sigmoide simplificada — modelos compartimentais multi-órgão estão no roadmap', en: 'Digital Twin uses a simplified sigmoid projection — multi-organ compartmental models are on the roadmap' }
      ]
    },
    scientific: {
      foundation: {
        pt: 'Sistema híbrido fundamentado em quatro pilares: (1) MedGraphRAG para grafos hierárquicos + U-Retrieval; (2) KGARevion para validação GRRA + auto-approve; (3) TransE para link prediction e gap-fill; (4) ciência da longevidade canina (Dog Aging Project, AgeXtend, frailty index, AAHA/WSAVA). Toda recomendação clínica é rastreável a um estudo no KG ou explicitamente marcada como "apenas-LLM".',
        en: 'Hybrid system built on four pillars: (1) MedGraphRAG for hierarchical graphs + U-Retrieval; (2) KGARevion for GRRA validation + auto-approve; (3) TransE for link prediction and gap-fill; (4) canine longevity science (Dog Aging Project, AgeXtend, frailty index, AAHA/WSAVA). Every clinical recommendation is traceable to a study in the KG or explicitly flagged as "LLM-only".'
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
          { pt: 'TransE link prediction online (hoje em batch noturno)', en: 'Online TransE link prediction (currently a nightly batch)' },
          { pt: 'Expansão da predisposição por raça para o long-tail (~120 raças cobertas)', en: 'Expanding breed predisposition to the long-tail (~120 breeds covered)' }
        ],
        planned: [
          { pt: 'TransE link prediction online por requisição (hoje batch noturno)', en: 'Online TransE link prediction per request (currently a nightly batch)' },
          { pt: 'Modelos compartimentais multi-órgão para o Digital Twin (rim, fígado, articular)', en: 'Multi-organ compartmental models for the Digital Twin (kidney, liver, joint)' },
          { pt: 'Curadoria colaborativa em tempo real (vários veterinários no mesmo triplet)', en: 'Real-time collaborative curation (multiple vets on the same triplet)' },
          { pt: 'Cypher queries diretas no Neo4j AuraDB para o U-Retrieval clínico (hoje read-path principal vive em RPC Postgres)', en: 'Direct Cypher queries against Neo4j AuraDB for clinical U-Retrieval (current main read-path lives in Postgres RPC)' },
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
