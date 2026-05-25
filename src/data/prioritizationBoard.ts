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
  | 'done';

export type PrioritizationArea =
  | 'patient'
  | 'curation'
  | 'population'
  | 'governance'
  | 'skills'
  | 'infra';

export type StrategicValue = 'PetLove' | 'Stanford' | 'Interno';

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
}

export const PRIORITIZATION_BOARD_LAST_UPDATED = '2026-05-25';

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
    value: ['Interno', 'PetLove'],
    status: 'in_progress',
    rationale_pt: 'Destrava uso real pela vet interna e por convidados sem reescrever auth.',
    rationale_en: 'Unlocks real use by internal vet and guests without rewriting auth.',
  },
  {
    id: 'prioritization-panel',
    order: 2,
    title_pt: 'Painel de Priorizações (esta aba)',
    title_en: 'Prioritization Panel (this tab)',
    description_pt: 'Kanban com 5 colunas como fonte única do roadmap. Substitui na prática docs/STANFORD_DEMO.md.',
    description_en: 'Kanban with 5 columns as single source of the roadmap. Effectively replaces docs/STANFORD_DEMO.md.',
    area: 'governance',
    effort: 'M',
    value: ['Interno', 'PetLove'],
    status: 'in_progress',
    rationale_pt: 'Fonte única para discutir tudo abaixo com PetLove e equipe técnica.',
    rationale_en: 'Single source to discuss everything below with PetLove and tech team.',
  },
  {
    id: 'cohort-request-generator',
    order: 3,
    title_pt: 'Gerador de Sugestões de Cohort',
    title_en: 'Cohort Request Generator',
    description_pt:
      'Formulário guiado que produz documento estruturado (Markdown/PDF) para enviar à PetLove pedindo recortes específicos.',
    description_en:
      'Guided form that produces a structured document (Markdown/PDF) to send to PetLove requesting specific cohorts.',
    area: 'population',
    effort: 'M',
    value: ['PetLove'],
    status: 'in_progress',
    dependsOn: ['prioritization-panel'],
    rationale_pt: 'Acelera a chegada de dados reais — quanto mais cedo, mais Population Insights v1 vira realidade.',
    rationale_en: 'Speeds up arrival of real data — sooner means Population Insights v1 becomes real faster.',
  },
  {
    id: 'population-insights-skeleton',
    order: 4,
    title_pt: 'Population Insights — esqueleto (sem cohort real)',
    title_en: 'Population Insights — skeleton (no real cohort yet)',
    description_pt:
      'Kanban "Descobertas → Hipóteses → Meta-estudos propostos → Aprovados". Reaproveita kg-evidence-gap-fill + syntheticCohort com label "aguardando PetLove".',
    description_en:
      'Kanban "Discoveries → Hypotheses → Proposed meta-studies → Approved". Reuses kg-evidence-gap-fill + syntheticCohort labelled "awaiting PetLove".',
    area: 'population',
    effort: 'L',
    value: ['PetLove', 'Stanford'],
    status: 'next',
    dependsOn: ['prioritization-panel'],
    rationale_pt: 'Pronto para plugar dados PetLove no dia 1 que chegarem.',
    rationale_en: 'Ready to plug PetLove data in on day 1.',
  },
  {
    id: 'real-vet-pilot',
    order: 5,
    title_pt: 'Piloto com 1–2 vets reais',
    title_en: 'Pilot with 1–2 real vets',
    description_pt:
      'Vet interna + 1 convidado usam a plataforma com perfil "Vet — Responsável pelo Pet" em pets reais. Coleta sistemática de fricção.',
    description_en:
      'Internal vet + 1 guest use the platform with "Vet — Pet Caregiver" profile on real pets. Systematic friction collection.',
    area: 'patient',
    effort: 'M',
    value: ['Interno'],
    status: 'next',
    dependsOn: ['role-view-layer'],
    rationale_pt: 'Valida o "view do veterinário" antes de escalar.',
    rationale_en: 'Validates the "vet view" before scaling.',
  },
  {
    id: 'internal-skills-3',
    order: 6,
    title_pt: '3 SKILL.md internas iniciais',
    title_en: '3 initial internal SKILL.md',
    description_pt:
      'curate-study, evaluate-meta-study-reliability, audit-triplet-citation. Transforma código existente em contratos discutíveis com vet-curador.',
    description_en:
      'curate-study, evaluate-meta-study-reliability, audit-triplet-citation. Turns existing code into contracts discussable with vet-curator.',
    area: 'skills',
    effort: 'M',
    value: ['Interno', 'Stanford'],
    status: 'backlog',
    rationale_pt: 'Contrato com o papel "vet-curador" — preparação para curador externo.',
    rationale_en: 'Contract with the "vet-curator" role — preparation for external curator.',
  },
  {
    id: 'population-insights-real',
    order: 7,
    title_pt: 'Population Insights — integração com cohort PetLove real',
    title_en: 'Population Insights — real PetLove cohort integration',
    description_pt:
      'Modela tabelas para cohort histórico, ETL dos dados PetLove, scoring real (prevalence_delta + kg_gap + actionability).',
    description_en:
      'Models tables for historical cohort, ETL of PetLove data, real scoring (prevalence_delta + kg_gap + actionability).',
    area: 'population',
    effort: 'XL',
    value: ['PetLove', 'Stanford'],
    status: 'backlog',
    dependsOn: ['population-insights-skeleton', 'cohort-request-generator'],
    rationale_pt: 'Quando os dados chegarem — esqueleto já estará pronto para receber.',
    rationale_en: 'When data arrives — skeleton will already be ready to receive.',
  },
  {
    id: 'investigate-clinical-question-skill',
    order: 8,
    title_pt: 'Skill investigate-clinical-question (Dr. Claw-style)',
    title_en: 'Skill investigate-clinical-question (Dr. Claw-style)',
    description_pt:
      'Chat investigativo que orquestra relations-auditor + chat-meta-study + KG. Multiplica utilidade do Auditor existente.',
    description_en:
      'Investigative chat orchestrating relations-auditor + chat-meta-study + KG. Multiplies utility of existing Auditor.',
    area: 'skills',
    effort: 'L',
    value: ['Interno', 'PetLove'],
    status: 'backlog',
    dependsOn: ['internal-skills-3'],
  },
  {
    id: 'real-rls-roles',
    order: 9,
    title_pt: 'RLS real + papéis no banco',
    title_en: 'Real RLS + DB roles',
    description_pt:
      'Expande app_role enum (vet_curador, vet_responsavel, rnd_lead, platform_architect), reescreve policies, migra dados.',
    description_en:
      'Expands app_role enum (vet_curador, vet_responsavel, rnd_lead, platform_architect), rewrites policies, migrates data.',
    area: 'infra',
    effort: 'XL',
    value: ['PetLove'],
    status: 'backlog',
    rationale_pt: 'Quando entrar o 1º vet PetLove externo. Hoje é overkill.',
    rationale_en: 'When the 1st external PetLove vet joins. Overkill today.',
  },
  {
    id: 'meta-kg-phase-b',
    order: 10,
    title_pt: 'Fase B do Meta-KG',
    title_en: 'Meta-KG Phase B',
    description_pt:
      'Agentes debatendo hipóteses sobre o Meta-KG. Gatilhos quantitativos já implementados em MetaKgRoadmapCard.',
    description_en:
      'Agents debating hypotheses on the Meta-KG. Quantitative triggers already implemented in MetaKgRoadmapCard.',
    area: 'governance',
    effort: 'XL',
    value: ['Stanford'],
    status: 'backlog',
    dependsOn: ['population-insights-real'],
    rationale_pt: 'Depois que houver descobertas reais no cohort PetLove.',
    rationale_en: 'After real discoveries from the PetLove cohort exist.',
  },
];

export const PRIORITIZATION_STATUSES: PrioritizationStatus[] = [
  'backlog',
  'next',
  'in_progress',
  'in_test',
  'done',
];