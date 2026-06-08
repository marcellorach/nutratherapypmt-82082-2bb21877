import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MermaidBlock from '@/components/shared/MermaidBlock';
import { SENEX_VERSION, SENEX_LAST_UPDATE } from '@/config/senex-version';

const ENGINE_DIAGRAM = `flowchart TB
  %% ============ INGESTION ============
  subgraph ING["1 - INGESTION"]
    direction TB
    U1["PDF / DOI upload<br/>(admin or PubMed gap-fill)"]
    U2["Gemini File API<br/>OCR + structuring"]
    U3["SHA-256 dedupe<br/>+ Levenshtein title check"]
    U4["Chunking 512 tok<br/>+ pgvector 1536D"]
    U1 --> U2 --> U3 --> U4
  end

  %% ============ EXTRACTION ============
  subgraph EXT["2 - 3-STAGE EXTRACTION (Gemini 2.5 / 3 Pro)"]
    direction TB
    E1["Stage 1<br/>Entities<br/>(Compound, Drug, Condition, Breed)"]
    E2["Stage 2<br/>Molecular mechanisms<br/>(target, pathway, cascade)"]
    E3["Stage 3<br/>Clinical context<br/>(dose range, AE, outcome, GRADE)"]
    E1 --> E2 --> E3
  end

  %% ============ KG (5 LAYERS) ============
  subgraph KG["3 - KNOWLEDGE GRAPH (5 layers L0 to L4)"]
    direction LR
    L0["L0 Compound<br/>nutraceutical / drug"]
    L1["L1 Target<br/>receptor / enzyme / gene"]
    L2["L2 Mechanism<br/>pathway / cascade"]
    L3["L3 Effect<br/>biological / clinical"]
    L4["L4 Outcome<br/>condition / breed / species"]
    L0 --> L1 --> L2 --> L3 --> L4
  end

  %% ============ VALIDATION & GAP-FILL ============
  subgraph VAL["4 - VALIDATION + GAP-FILL"]
    direction TB
    V1["Generate (Gemini)<br/>+ heuristic scoring 0.65-0.75<br/>(inspired by GRRA, no independent reviewer)"]
    V2["Auto-approve >= 0.50<br/>+ human-in-the-loop curation"]
    V3["PubMed E-utilities + Gemini<br/>gap-fill (compound x condition)"]
    V4["Planned: independent Reviewer model<br/>+ Revise step + TransE link prediction"]
    V1 --> V2 --> V3
    V2 -.planned.-> V4
  end

  %% ============ STORAGE ============
  subgraph STO["5 - HYBRID STORAGE"]
    direction LR
    S1[("Supabase Postgres<br/>L0-L4 tables<br/>+ pgvector 1536D")]
    S2[("Neo4j AuraDB<br/>live sync via<br/>neo4j-sync / sync-approved-triplets")]
    S1 <--> S2
  end

  %% ============ RETRIEVAL & CLINICAL OUTPUT ============
  subgraph OUT["6 - HYBRID RETRIEVAL + CLINICAL SYNTHESIS"]
    direction TB
    O1["Hybrid retrieval<br/>Cypher (Neo4j) + pgvector (Supabase)<br/>(inspired by U-Retrieval, no top-down/bottom-up fusion)"]
    O2["Patient subgraph<br/>(breed + labs + meds + conditions)"]
    O3["Recommendation engine<br/>stack <= 8 synergistic compounds<br/>(inspired by TxGNN zero-shot + Hetionet DWPC,<br/>not yet in runtime)"]
    O4["Digital Twin<br/>sigmoid severity x time<br/>years_gained metric"]
    O5["Treatment Proposal<br/>bilingual PT/EN + milestones"]
    O1 --> O2 --> O3 --> O4 --> O5
  end

  %% ============ CROSS-LAYER EDGES ============
  U4 --> E1
  E3 --> L0
  L4 --> V1
  V2 --> S1
  V2 --> S2
  V3 --> L0
  S2 --> O1
  S1 --> O1
  L4 --> O1
`;

const PILLARS: Array<{
  pt: string;
  en: string;
  detail_pt: string;
  detail_en: string;
  status: 'implemented' | 'partial' | 'inspiration';
}> = [
  {
    pt: 'MedGraphRAG (Wu et al., 2024)',
    en: 'MedGraphRAG (Wu et al., 2024)',
    detail_pt: 'Triple Graph Construction (Document → Chunk → Entity → Mechanism) — **implementado**. U-Retrieval bidirecional permanece **inspiração**: hoje a recuperação é híbrida Cypher (Neo4j) + pgvector (Supabase), sem fusão top-down/bottom-up. O número ~40% é do paper original, não medido no Senex.',
    detail_en: 'Triple Graph Construction (Document → Chunk → Entity → Mechanism) — **implemented**. Bidirectional U-Retrieval remains **inspiration only**: today retrieval is hybrid Cypher (Neo4j) + pgvector (Supabase), with no top-down/bottom-up fusion. The ~40% figure is from the source paper, not measured inside Senex.',
    status: 'partial'
  },
  {
    pt: 'KGARevion (Su et al., ICLR 2025)',
    en: 'KGARevion (Su et al., ICLR 2025)',
    detail_pt: '**Parcial.** Em runtime, o dicionário de normalização de predicados (RC-014) e a adoção de taxonomia padrão SNOMED-CT VetSCT + UMLS (RC-008) seguem KGARevion como evidência ativa (vide aba Fundamentos Arquiteturais). **Inspiração ainda não implementada:** o ciclo GRRA completo (Review + Revise independentes) — hoje `generate-triplets` roda Generate (Gemini) + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL. O número ~87% é benchmark do paper, não medido no Senex.',
    detail_en: '**Partial.** In runtime, the predicate-normalization dictionary (RC-014) and the SNOMED-CT VetSCT + UMLS standard taxonomy adoption (RC-008) follow KGARevion as active evidence (see Architectural Foundations tab). **Inspiration not yet implemented:** the full GRRA cycle (independent Review + Revise) — today `generate-triplets` runs Generate (Gemini) + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL. The ~87% figure is a paper benchmark, not measured inside Senex.',
    status: 'partial'
  },
  {
    pt: 'TxGNN (Huang et al., Nature Medicine 2024)',
    en: 'TxGNN (Huang et al., Nature Medicine 2024)',
    detail_pt: '**Parcial.** Em runtime, a adoção de taxonomia padrão SNOMED-CT VetSCT + UMLS (RC-008) e a governança tiered por confiança (RC-013, auto-approve ≥ 0,50 + HITL) seguem TxGNN como evidência ativa (vide `core_rule_evidence` na aba Fundamentos Arquiteturais). RC-001 (Exclusão ≠ Contraindicação) é doc-only. **Inspiração ainda não implementada:** zero-shot drug repurposing via metric learning degree-gated e explainer GraphMask multi-hop — o motor atual só recomenda compostos com triplets curados, sem inferência zero-shot. Os ganhos de +46% accuracy / +49% confidence são benchmarks do paper, não medidos no Senex.',
    detail_en: '**Partial.** In runtime, the SNOMED-CT VetSCT + UMLS standard taxonomy adoption (RC-008) and the confidence-tiered governance (RC-013, auto-approve ≥ 0.50 + HITL) follow TxGNN as active evidence (see `core_rule_evidence` in the Architectural Foundations tab). RC-001 (Exclusion ≠ Contraindication) is doc-only. **Inspiration not yet implemented:** zero-shot drug repurposing via degree-gated metric learning and multi-hop GraphMask explainer — the current engine only recommends compounds with curated triplets, with no zero-shot inference. The +46% accuracy / +49% confidence gains are paper benchmarks, not measured inside Senex.',
    status: 'partial'
  },
  {
    pt: 'Hetionet / DWPC (Himmelstein et al., eLife 2017)',
    en: 'Hetionet / DWPC (Himmelstein et al., eLife 2017)',
    detail_pt: '**Parcial.** Em runtime, a adoção de taxonomia padrão SNOMED-CT VetSCT + UMLS (RC-008) e a normalização de predicados via dicionário (RC-014) seguem Hetionet como evidência ativa (vide `core_rule_evidence`). **Inspiração ainda não implementada:** Degree-Weighted Path Count (DWPC) sobre metapaths heterogêneos com baselines de permutação de rede — hoje o ranking de compostos usa scoring heurístico + KG hierárquico L0→L4, sem DWPC nem teste de permutação.',
    detail_en: '**Partial.** In runtime, the SNOMED-CT VetSCT + UMLS standard taxonomy adoption (RC-008) and the dictionary-based predicate normalization (RC-014) follow Hetionet as active evidence (see `core_rule_evidence`). **Inspiration not yet implemented:** Degree-Weighted Path Count (DWPC) over heterogeneous metapaths with permuted-network baselines — today compound ranking uses heuristic scoring + L0→L4 hierarchical KG, with no DWPC and no permutation test.',
    status: 'partial'
  },
  {
    pt: 'TransE (Bordes et al., NeurIPS 2013)',
    en: 'TransE (Bordes et al., NeurIPS 2013)',
    detail_pt: '**Inspiração / planejado** — TransE link prediction **não roda em runtime**. O gap-fill (`kg-evidence-gap-fill`) é feito por PubMed E-utilities + Gemini, sem embeddings TransE.',
    detail_en: '**Inspiration / planned** — TransE link prediction is **not running in runtime**. The gap-fill (`kg-evidence-gap-fill`) uses PubMed E-utilities + Gemini, with no TransE embeddings.',
    status: 'inspiration'
  },
  {
    pt: 'Geriatria canina (Dog Aging Project + AgeXtend + frailty index)',
    en: 'Canine geroscience (Dog Aging Project + AgeXtend + frailty index)',
    detail_pt: 'Coortes longitudinais reais (>45.000 cães), screening de ~1,1B compostos geroprotetores e operacionalização do frailty index canino.',
    detail_en: 'Real longitudinal cohorts (>45,000 dogs), screening of ~1.1B geroprotector compounds and operationalisation of the canine frailty index.',
    status: 'partial'
  }
];

const NUMBERS: Array<{ label_pt: string; label_en: string; value: string }> = [
  { label_pt: 'Camadas do KG (L0→L4)', label_en: 'KG layers (L0→L4)', value: '5' },
  { label_pt: 'Estágios de extração', label_en: 'Extraction stages', value: '3' },
  { label_pt: 'Tipos de relação', label_en: 'Relation types', value: '20+' },
  { label_pt: 'Auto-approve threshold', label_en: 'Auto-approve threshold', value: '≥ 0.50' },
  { label_pt: 'Stack terapêutico (máx)', label_en: 'Therapeutic stack (max)', value: '8' },
  { label_pt: 'Embedding dim', label_en: 'Embedding dim', value: '1536' },
  { label_pt: 'Raças com predisposição', label_en: 'Breeds with predisposition', value: '~120' },
  { label_pt: 'Espécie em escopo', label_en: 'Species in scope', value: 'Canine' }
];

const AboutSenexTab: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
  const isPt = lang === 'pt';

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isPt ? 'Sobre o Senex AI' : 'About Senex AI'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isPt
              ? 'Motor híbrido de GraphRAG dedicado à longevidade canina — visão técnica detalhada.'
              : 'Hybrid GraphRAG engine dedicated to canine longevity — detailed technical view.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">v{SENEX_VERSION}</Badge>
          <Badge variant="secondary" className="font-mono">{SENEX_LAST_UPDATE}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isPt ? 'Arquitetura do motor (6 fases)' : 'Engine architecture (6 phases)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
            {isPt
              ? <><strong>Honestidade arquitetural:</strong> o diagrama abaixo descreve a visão e o que está implementado. <strong>GRRA</strong>, <strong>U-Retrieval bidirecional</strong>, <strong>TransE</strong>, <strong>TxGNN zero-shot</strong> e <strong>Hetionet DWPC</strong> são inspiração/planejado — não estão em runtime (suas contribuições ativas estão listadas nos Pilares Científicos abaixo). Verdade-base em <code>docs/generated/ARCHITECTURE_LIVE.md</code>.</>
              : <><strong>Architectural honesty:</strong> the diagram below describes the vision and what is implemented. <strong>GRRA</strong>, <strong>bidirectional U-Retrieval</strong>, <strong>TransE</strong>, <strong>TxGNN zero-shot</strong> and <strong>Hetionet DWPC</strong> are inspiration/planned — not in runtime (their active contributions are listed in Scientific Pillars below). Ground truth in <code>docs/generated/ARCHITECTURE_LIVE.md</code>.</>}
          </div>
          <MermaidBlock code={ENGINE_DIAGRAM} />
          <p className="text-xs text-muted-foreground mt-4">
            {isPt
              ? 'Fluxo real em produção: ingestion (Gemini File API) → extração em 3 estágios → KG hierárquico L0–L4 → validação por scoring heurístico + auto-approve + HITL + gap-fill PubMed → storage híbrido Supabase pgvector + Neo4j AuraDB → recuperação híbrida Cypher + pgvector → síntese clínica (stack ≤ 8 + Digital Twin).'
              : 'Production flow: ingestion (Gemini File API) → 3-stage extraction → L0–L4 hierarchical KG → heuristic-scoring validation + auto-approve + HITL + PubMed gap-fill → hybrid Supabase pgvector + Neo4j AuraDB storage → hybrid Cypher + pgvector retrieval → clinical synthesis (stack ≤ 8 + Digital Twin).'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {NUMBERS.map((n) => (
          <Card key={n.label_en}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold tabular-nums">{n.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isPt ? n.label_pt : n.label_en}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isPt ? 'Pilares científicos (inspiração × implementação)' : 'Scientific pillars (inspiration × implementation)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PILLARS.map((p) => (
            <div key={p.en} className="border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-semibold">{isPt ? p.pt : p.en}</div>
                <Badge
                  variant={p.status === 'implemented' ? 'default' : p.status === 'partial' ? 'secondary' : 'outline'}
                  className="text-[10px] uppercase tracking-wide"
                >
                  {p.status === 'implemented'
                    ? (isPt ? 'implementado' : 'implemented')
                    : p.status === 'partial'
                      ? (isPt ? 'parcial' : 'partial')
                      : (isPt ? 'inspiração' : 'inspiration')}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {isPt ? p.detail_pt : p.detail_en}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isPt ? 'Princípios operacionais' : 'Operational principles'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 list-disc pl-5">
            <li>
              <strong>No-mock policy</strong> —{' '}
              {isPt
                ? 'toda recomendação clínica é rastreável a registros reais do KG ou explicitamente rotulada como "apenas-LLM".'
                : 'every clinical recommendation traces back to real KG records or is explicitly labelled "LLM-only".'}
            </li>
            <li>
              <strong>Curation gatekeeper</strong> —{' '}
              {isPt
                ? 'nenhum estudo ou triplet entra no KG sem aprovação; threshold de auto-aprovação ≥ 0,50.'
                : 'no study or triplet enters the KG without approval; auto-approval threshold ≥ 0.50.'}
            </li>
            <li>
              <strong>Bilingual</strong> —{' '}
              {isPt
                ? 'paridade PT/EN em UI, banco (name_en) e dados estáticos (_en).'
                : 'PT/EN parity across UI, database (name_en) and static data (_en).'}
            </li>
            <li>
              <strong>Canine scope</strong> —{' '}
              {isPt
                ? 'foco em doenças metabólicas e degenerativas em cães (sem imagem complexa como RM).'
                : 'focus on canine metabolic and degenerative conditions (no complex imaging like MRI).'}
            </li>
            <li>
              <strong>Therapeutic cap</strong> —{' '}
              {isPt
                ? 'máximo 8 compostos sinérgicos por protocolo, deduplicado por chave alfanumérica.'
                : 'max 8 synergistic compounds per protocol, deduped by alphanumeric key.'}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutSenexTab;
