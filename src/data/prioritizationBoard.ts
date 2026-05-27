/**
 * Painel de Priorizações — fonte única do roadmap operacional do Senex AI.
 *
 * Manual (à la projectOrganograma.ts). Ordem do array = ordem sugerida de
 * execução. Ver .lovable/plan.md → Entrega 2.
 */

export type PrioritizationStatus =
  | 'backlog'
  | 'next'
  | 'in_progress'
  | 'in_test'
  | 'done'
  | 'rita';

export type PrioritizationArea =
  | 'patient'
  | 'curation'
  | 'population'
  | 'governance'
  | 'skills'
  | 'infra';

export type StrategicValue = 'ClinicalPartner' | 'AcademicPartner' | 'Internal';

export type EffortSize = 'S' | 'M' | 'L' | 'XL';

export interface PrioritizationCard {
  id: string;
  order: number;
  title_pt: string;
  title_en: string;
  description_pt: string;
  description_en: string;
  area: PrioritizationArea;
  effort: EffortSize;
  value: StrategicValue[];
  status: PrioritizationStatus;
  dependsOn?: string[];
  /** Versão do CHANGELOG quando entregue. */
  deliveredVersion?: string;
  /** Justificativa de ordem — visível no card. */
  rationale_pt?: string;
  rationale_en?: string;
  /**
   * Sinaliza que o card precisa de validação clínica de um veterinário-curador
   * antes de avançar (ex.: revisar `record_requirements`, dosagens, contraindicações).
   * Renderiza badge "Requer validação do vet-curador" no card.
   */
  requiresVetCuratorValidation?: boolean;
}

export const PRIORITIZATION_BOARD_LAST_UPDATED = '2026-05-27';

/** Labels neutras — nunca exibir nomes de parceiros não-oficiais (PetLove, Stanford, etc.) na UI pública. */
export const STRATEGIC_VALUE_LABEL: Record<StrategicValue, { pt: string; en: string }> = {
  ClinicalPartner: { pt: 'Parceiro Clínico', en: 'Clinical Partner' },
  AcademicPartner: { pt: 'Parceiro Acadêmico', en: 'Academic Partner' },
  Internal: { pt: 'Interno', en: 'Internal' },
};

export const PRIORITIZATION_BOARD: PrioritizationCard[] = [
  {
    id: 'role-view-layer',
    order: 1,
    title_pt: 'Camada de visualização de papéis',
    title_en: 'Role visualization layer',
    description_pt:
      'Filtro declarativo (5 perfis) sobre a sidebar e tabs admin. Não é segurança — é redução de ruído. RLS real fica para quando entrar 1º vet PetLove.',
    description_en:
      'Declarative filter (5 profiles) over sidebar and admin tabs. Not security — it reduces cognitive load. Real RLS waits for first PetLove vet.',
    area: 'governance',
    effort: 'S',
    value: ['Internal', 'ClinicalPartner'],
    status: 'in_progress',
    rationale_pt: 'Destrava uso real pela vet interna e por convidados sem reescrever auth.',
    rationale_en: 'Unlocks real use by internal vet and guests without rewriting auth.',
  },
  {
    id: 'cohort-suggester-hardening',
    order: 2,
    title_pt: 'Hardening do gerador de sugestões de cohort',
    title_en: 'Cohort suggester hardening',
    description_pt:
      'Edge function suggest-cohort-ideas com modelo primário gemini-3.1-pro-preview, validação server-side (6 cohorts, 6 modelos distintos, ≥2 deceased/mixed, record_requirements obrigatório), retry com mensagem de correção e fallback automático para gpt-5.4.',
    description_en:
      'Edge function suggest-cohort-ideas with gemini-3.1-pro-preview as primary, server-side validation (6 cohorts, 6 distinct models, ≥2 deceased/mixed, mandatory record_requirements), retry with correction message and automatic fallback to gpt-5.4.',
    area: 'population',
    effort: 'M',
    value: ['Internal', 'ClinicalPartner'],
    status: 'in_test',
    rationale_pt: 'Validado via curl; falta smoke test visual no kanban Priorizações.',
    rationale_en: 'Validated via curl; visual smoke test in Prioritizations kanban still pending.',
  },
  {
    id: 'prioritization-panel',
    order: 3,
    title_pt: 'Painel de Priorizações (esta aba)',
    title_en: 'Prioritization Panel (this tab)',
    description_pt: 'Kanban com 5 colunas como fonte única do roadmap. Substitui na prática docs/STANFORD_DEMO.md.',
    description_en: 'Kanban with 5 columns as single source of the roadmap. Effectively replaces docs/STANFORD_DEMO.md.',
    area: 'governance',
    effort: 'M',
    value: ['Internal', 'ClinicalPartner'],
    status: 'in_progress',
    rationale_pt: 'Fonte única para discutir tudo abaixo com parceiros e equipe técnica.',
    rationale_en: 'Single source to discuss everything below with partners and tech team.',
  },
  {
    id: 'cohort-request-generator',
    order: 4,
    title_pt: 'Gerador de Sugestões de Cohort',
    title_en: 'Cohort Request Generator',
    description_pt:
      'Formulário guiado que produz documento estruturado (Markdown/PDF) para enviar ao parceiro clínico pedindo recortes específicos.',
    description_en:
      'Guided form that produces a structured document (Markdown/PDF) to send to the clinical partner requesting specific cohorts.',
    area: 'population',
    effort: 'M',
    value: ['ClinicalPartner'],
    status: 'in_progress',
    dependsOn: ['prioritization-panel'],
    rationale_pt: 'Acelera a chegada de dados reais — quanto mais cedo, mais Population Insights v1 vira realidade.',
    rationale_en: 'Speeds up arrival of real data — sooner means Population Insights v1 becomes real faster.',
  },
  {
    id: 'population-insights-skeleton',
    order: 5,
    title_pt: 'Population Insights — esqueleto (sem cohort real)',
    title_en: 'Population Insights — skeleton (no real cohort yet)',
    description_pt:
      'Kanban "Descobertas → Hipóteses → Meta-estudos propostos → Aprovados". Reaproveita kg-evidence-gap-fill + syntheticCohort com label "aguardando parceiro clínico".',
    description_en:
      'Kanban "Discoveries → Hypotheses → Proposed meta-studies → Approved". Reuses kg-evidence-gap-fill + syntheticCohort labelled "awaiting clinical partner".',
    area: 'population',
    effort: 'L',
    value: ['ClinicalPartner', 'AcademicPartner'],
    status: 'next',
    dependsOn: ['prioritization-panel'],
    rationale_pt: 'Pronto para plugar dados do parceiro clínico no dia 1 que chegarem.',
    rationale_en: 'Ready to plug clinical-partner data in on day 1.',
  },
  {
    id: 'real-vet-pilot',
    order: 6,
    title_pt: 'Piloto com 1–2 vets reais',
    title_en: 'Pilot with 1–2 real vets',
    description_pt:
      'Vet interna + 1 convidado usam a plataforma com perfil "Vet — Responsável pelo Pet" em pets reais. Coleta sistemática de fricção.',
    description_en:
      'Internal vet + 1 guest use the platform with "Vet — Pet Caregiver" profile on real pets. Systematic friction collection.',
    area: 'patient',
    effort: 'M',
    value: ['Internal'],
    status: 'next',
    dependsOn: ['role-view-layer'],
    rationale_pt: 'Valida o "view do veterinário" antes de escalar.',
    rationale_en: 'Validates the "vet view" before scaling.',
  },
  {
    id: 'cohort-suggestions-clinical-review',
    order: 7,
    title_pt: 'Revisão clínica das 6 sugestões de cohort',
    title_en: 'Clinical review of the 6 cohort suggestions',
    description_pt:
      'Vet-curadora revisa cada uma das 6 sugestões geradas: cobertura dos modelos preditivos, viabilidade dos record_requirements (≥18m pré-morte, causa de morte, hemogramas), e se o split living/deceased/mixed faz sentido clínico.',
    description_en:
      'Vet-curator reviews each of the 6 generated suggestions: predictive model coverage, feasibility of record_requirements (≥18m pre-death, cause of death, CBCs), and whether the living/deceased/mixed split is clinically sound.',
    area: 'curation',
    effort: 'S',
    value: ['ClinicalPartner', 'Internal'],
    status: 'next',
    dependsOn: ['cohort-suggester-hardening'],
    requiresVetCuratorValidation: true,
    rationale_pt: 'Sem validação clínica, o documento gerado para o parceiro perde credibilidade.',
    rationale_en: 'Without clinical validation, the document sent to the partner loses credibility.',
  },
  {
    id: 'vet-curator-insight-validation',
    order: 14,
    title_pt: 'Validação vet-curador de insights de cohort',
    title_en: 'Vet-curator validation of cohort insights',
    description_pt:
      'Cada cohort_insight ganha status de revisão clínica (Pendente / Aprovado / Rejeitado / Requer ajustes), notas e timestamp do revisor. Botão "validar" em cada card abre dialog dedicado com painel de Evidência embutido (suporte populacional N/total, estratificação por raça/idade/severidade, top alterações laboratoriais canonicalizadas, provenance + aviso explícito quando o LLM não forneceu evidência quantitativa estruturada) e atalho para drill-down completo. Aprovação move automaticamente para a coluna Aprovados. Insight só vira regra clínica / meta-estudo após aprovação.',
    description_en:
      'Each cohort_insight gets a clinical review status (Pending / Approved / Rejected / Needs changes), reviewer notes and timestamp. "Validate" button on each card opens a dedicated dialog with embedded Evidence panel (population support N/total, breed/age/severity stratification, top canonicalized lab flags, provenance + explicit warning when the LLM did not provide structured quantitative evidence) and shortcut to full drill-down. Approval auto-moves the insight to the Approved column. Insight only becomes a clinical rule / meta-study after approval.',
    area: 'curation',
    effort: 'S',
    value: ['ClinicalPartner', 'Internal'],
    status: 'done',
    deliveredVersion: 'Unreleased',
    requiresVetCuratorValidation: true,
    rationale_pt: 'Fecha o ciclo de governança clínica: nada vira regra sem assinatura do vet-curador.',
    rationale_en: 'Closes the clinical governance loop: nothing becomes a rule without vet-curator sign-off.',
  },
  {
    id: 'internal-skills-3',
    order: 8,
    title_pt: '3 SKILL.md internas iniciais',
    title_en: '3 initial internal SKILL.md',
    description_pt:
      'curate-study, evaluate-meta-study-reliability, audit-triplet-citation. Transforma código existente em contratos discutíveis com vet-curador.',
    description_en:
      'curate-study, evaluate-meta-study-reliability, audit-triplet-citation. Turns existing code into contracts discussable with vet-curator.',
    area: 'skills',
    effort: 'M',
    value: ['Internal', 'AcademicPartner'],
    status: 'backlog',
    rationale_pt: 'Contrato com o papel "vet-curador" — preparação para curador externo.',
    rationale_en: 'Contract with the "vet-curator" role — preparation for external curator.',
  },
  {
    id: 'population-insights-real',
    order: 9,
    title_pt: 'Population Insights — integração com cohort clínico real',
    title_en: 'Population Insights — real clinical-partner cohort integration',
    description_pt:
      'Modela tabelas para cohort histórico, ETL dos dados do parceiro clínico, scoring real (prevalence_delta + kg_gap + actionability).',
    description_en:
      'Models tables for historical cohort, ETL of clinical-partner data, real scoring (prevalence_delta + kg_gap + actionability).',
    area: 'population',
    effort: 'XL',
    value: ['ClinicalPartner', 'AcademicPartner'],
    status: 'backlog',
    dependsOn: ['population-insights-skeleton', 'cohort-request-generator'],
    rationale_pt: 'Quando os dados chegarem — esqueleto já estará pronto para receber.',
    rationale_en: 'When data arrives — skeleton will already be ready to receive.',
  },
  {
    id: 'investigate-clinical-question-skill',
    order: 10,
    title_pt: 'Skill investigate-clinical-question (Dr. Claw-style)',
    title_en: 'Skill investigate-clinical-question (Dr. Claw-style)',
    description_pt:
      'Chat investigativo que orquestra relations-auditor + chat-meta-study + KG. Multiplica utilidade do Auditor existente.',
    description_en:
      'Investigative chat orchestrating relations-auditor + chat-meta-study + KG. Multiplies utility of existing Auditor.',
    area: 'skills',
    effort: 'L',
    value: ['Internal', 'ClinicalPartner'],
    status: 'backlog',
    dependsOn: ['internal-skills-3'],
  },
  {
    id: 'real-rls-roles',
    order: 11,
    title_pt: 'RLS real + papéis no banco',
    title_en: 'Real RLS + DB roles',
    description_pt:
      'Expande app_role enum (vet_curador, vet_responsavel, rnd_lead, platform_architect), reescreve policies, migra dados.',
    description_en:
      'Expands app_role enum (vet_curador, vet_responsavel, rnd_lead, platform_architect), rewrites policies, migrates data.',
    area: 'infra',
    effort: 'XL',
    value: ['ClinicalPartner'],
    status: 'backlog',
    rationale_pt: 'Quando entrar o 1º vet externo do parceiro clínico. Hoje é overkill.',
    rationale_en: 'When the 1st external clinical-partner vet joins. Overkill today.',
  },
  {
    id: 'meta-kg-phase-b',
    order: 12,
    title_pt: 'Fase B do Meta-KG',
    title_en: 'Meta-KG Phase B',
    description_pt:
      'Agentes debatendo hipóteses sobre o Meta-KG. Gatilhos quantitativos já implementados em MetaKgRoadmapCard.',
    description_en:
      'Agents debating hypotheses on the Meta-KG. Quantitative triggers already implemented in MetaKgRoadmapCard.',
    area: 'governance',
    effort: 'XL',
    value: ['AcademicPartner'],
    status: 'backlog',
    dependsOn: ['population-insights-real'],
    rationale_pt: 'Depois que houver descobertas reais no cohort do parceiro clínico.',
    rationale_en: 'After real discoveries from the clinical-partner cohort exist.',
  },
  {
    id: 'cohort-stats-canonicalization',
    order: 13,
    title_pt: 'Canonicalização PT/EN nas cohort stats',
    title_en: 'PT/EN canonicalization in cohort stats',
    description_pt:
      'Top condições e top flags laboratoriais agora deduplicam variantes PT/EN/abreviaturas (Osteoartrite↔Osteoarthritis, HCT↔Hematócrito, PLT↔Plt) antes de contar. Range de referência não-numérico (citologia) é omitido no drill-down.',
    description_en:
      'Top conditions and lab flags now deduplicate PT/EN/abbrev variants (Osteoartrite↔Osteoarthritis, HCT↔Hematócrito, PLT↔Plt) before counting. Non-numeric reference range (cytology) is omitted in drill-down.',
    area: 'population',
    effort: 'S',
    value: ['Internal', 'AcademicPartner'],
    status: 'done',
    deliveredVersion: 'Unreleased',
    rationale_pt: 'Higiene básica antes de mostrar cohort para parceiro acadêmico — evitar artefato de dupla contagem.',
    rationale_en: 'Basic hygiene before showing cohort to academic partner — avoids double-count artifacts.',
  },
];

export const PRIORITIZATION_STATUSES: PrioritizationStatus[] = [
  'rita',
  'backlog',
  'next',
  'in_progress',
  'in_test',
  'done',
];