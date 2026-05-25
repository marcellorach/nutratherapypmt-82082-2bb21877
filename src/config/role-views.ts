/**
 * Role Views — camada de VISUALIZAÇÃO (não é segurança).
 *
 * Declara perfis de trabalho que filtram o que aparece na UI para reduzir
 * ruído cognitivo. Qualquer usuário com `admin` real pode trocar de perfil
 * via RoleViewSwitcher no Header. RLS de verdade fica para quando entrar
 * o primeiro vet externo (ver card "RLS real" no Painel de Priorizações).
 *
 * Ver: .lovable/plan.md → Entrega 1.
 */

export type RoleViewId =
  | 'platform_architect'
  | 'rnd_lead'
  | 'vet_curador'
  | 'vet_responsavel'
  | 'tutor';

export type AdminSidebarGroup =
  | 'knowledge-base'
  | 'data-processing'
  | 'research'
  | 'predictive-analysis'
  | 'configuration'
  | 'governance-ai';

export interface RoleViewConfig {
  id: RoleViewId;
  label_pt: string;
  label_en: string;
  description_pt: string;
  description_en: string;
  /** null = todas. */
  allowedAdminGroups: AdminSidebarGroup[] | null;
  /** Ids específicos a esconder mesmo dentro de grupos permitidos. */
  hiddenAdminTabs?: string[];
  /** Rota inicial sugerida quando o perfil é ativado. */
  defaultRoute: string;
}

export const ROLE_VIEWS: RoleViewConfig[] = [
  {
    id: 'platform_architect',
    label_pt: 'Arquiteto da Plataforma',
    label_en: 'Platform Architect',
    description_pt: 'Visão completa — governança, curadoria, P&D, configuração.',
    description_en: 'Full view — governance, curation, R&D, configuration.',
    allowedAdminGroups: null,
    defaultRoute: '/administrador?tab=priorizacoes',
  },
  {
    id: 'rnd_lead',
    label_pt: 'Líder de P&D',
    label_en: 'R&D Lead',
    description_pt: 'Priorizações, descobertas populacionais, propostas de estudo.',
    description_en: 'Prioritization, population discoveries, study proposals.',
    allowedAdminGroups: ['research', 'governance-ai'],
    defaultRoute: '/administrador?tab=priorizacoes',
  },
  {
    id: 'vet_curador',
    label_pt: 'Vet — Curador Técnico',
    label_en: 'Vet — Technical Curator',
    description_pt: 'Curadoria de estudos, triplets, ontologia e simulações.',
    description_en: 'Curation of studies, triplets, ontology and simulations.',
    allowedAdminGroups: ['knowledge-base', 'data-processing', 'predictive-analysis'],
    hiddenAdminTabs: ['organograma', 'design-conventions', 'translations', 'translation-audit', 'translation-manager'],
    defaultRoute: '/administrador?tab=estudos',
  },
  {
    id: 'vet_responsavel',
    label_pt: 'Vet — Responsável pelo Pet',
    label_en: 'Vet — Pet Caregiver',
    description_pt: 'Foco em pacientes individuais — interface simplificada.',
    description_en: 'Focused on individual patients — simplified interface.',
    allowedAdminGroups: [],
    defaultRoute: '/veterinario',
  },
  {
    id: 'tutor',
    label_pt: 'Tutor',
    label_en: 'Pet Owner',
    description_pt: 'Visão do dono do pet — recomendações e acompanhamento.',
    description_en: 'Pet owner view — recommendations and follow-up.',
    allowedAdminGroups: [],
    defaultRoute: '/tutor',
  },
];

export const getRoleView = (id: RoleViewId): RoleViewConfig =>
  ROLE_VIEWS.find((v) => v.id === id) ?? ROLE_VIEWS[0];

export const DEFAULT_ROLE_VIEW: RoleViewId = 'platform_architect';

export const isAdminGroupAllowed = (view: RoleViewConfig, group: AdminSidebarGroup): boolean => {
  if (view.allowedAdminGroups === null) return true;
  return view.allowedAdminGroups.includes(group);
};

export const isAdminTabAllowed = (view: RoleViewConfig, tabId: string): boolean => {
  return !view.hiddenAdminTabs?.includes(tabId);
};