// Espelho tipado do CHANGELOG.md, consumido pela aba Organograma → Changelog.
// SEMPRE adicionar a entrada NO TOPO ao mesmo tempo em que se altera o
// CHANGELOG.md, organogramaLastUpdated e (se houver mudança de string)
// I18N_VERSION em src/i18n.ts.
// Ver memory: mem://architecture/organograma-source-of-truth

import type { OrganogramaAreaKey } from "@/data/projectOrganograma";

export type ChangelogStatus = "entregue" | "parcial" | "revertido";
export type ChangelogKind = "added" | "changed" | "fixed" | "removed" | "security";

export interface ChangelogEntry {
  /** ISO date YYYY-MM-DD */
  date: string;
  area: OrganogramaAreaKey | "meta";
  kind: ChangelogKind;
  title: string;
  bullets: string[];
  files?: string[];
  status: ChangelogStatus;
}

/** Mais recentes no topo. */
export const changelog: ChangelogEntry[] = [
  {
    date: "2026-04-29",
    area: "admin",
    kind: "added",
    title: "Organograma do Projeto (4 lentes: Grafo, Diagrama, Cards, Changelog)",
    bullets: [
      "Nova tab admin /administrador?tab=organograma com espelho tipado da arquitetura em src/data/projectOrganograma.ts",
      "Force-graph 2D mostrando áreas como hubs coloridos + componentes como folhas + cross-links",
      "Diagrama Mermaid hierárquico com pan/zoom estilo Figma (useScrollPanZoom)",
      "Changelog visual com filtros por área e status — fonte projectChangelog.ts",
      "Card de Convenções Core extraído da knowledge base do projeto",
    ],
    files: [
      "src/data/projectOrganograma.ts",
      "src/data/projectChangelog.ts",
      "src/data/organogramaAreaMeta.ts",
      "src/pages/administrador/OrganogramaTab.tsx",
      "src/components/administrador/organograma/OrganogramaForceGraph.tsx",
      "src/components/administrador/organograma/OrganogramaDiagram.tsx",
      "src/components/administrador/organograma/OrganogramaCards.tsx",
      "src/components/administrador/organograma/ChangelogTimeline.tsx",
      "src/hooks/useScrollPanZoom.ts",
      "src/config/admin-tabs.ts",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-29",
    area: "vet-ui",
    kind: "added",
    title: "Diagnóstico admin de triplets faltantes no KG (kg-missing-triplets)",
    bullets: [
      "Edge function nova cruza condições do pet × stack recomendado e classifica gaps (no_curated_link / weak_efficacy)",
      "Modal MissingTripletsDialog com matriz de gaps + condições órfãs + atalho para Triplet Bank",
      "Botão visível apenas para admin no banner de Zero Gain do Digital Twin",
    ],
    files: [
      "supabase/functions/kg-missing-triplets/index.ts",
      "src/components/pet/MissingTripletsDialog.tsx",
      "src/hooks/useKgMissingTriplets.ts",
      "src/components/pet/BiologicalTimeline.tsx",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-29",
    area: "vet-ui",
    kind: "changed",
    title: "Pipeline Clínico com contadores ao vivo + Digital Twin destacado",
    bullets: [
      "stageCounts captura metadata de stage-end e ilumina cada estágio assim que termina (não mais zero até o fim)",
      "Aba 'Trajetória' renomeada para 'Digital Twin · Trajetória Biológica' com ícone Dna",
      "I18N_VERSION → 1.37.1",
    ],
    files: [
      "src/pages/veterinario/PetProfilePage.tsx",
      "src/i18n.ts",
      "src/locales/pt/translation.json",
      "src/locales/en/translation.json",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-28",
    area: "clinical-pipeline",
    kind: "changed",
    title: "Pipeline Clínico com Progresso Real + Console ao Vivo",
    bullets: [
      "runClinicalAnalysisPipeline aceita callback onProgress emitindo stage-start/end/log",
      "ClinicalPipelineLogPanel: console com timestamp, ícones por nível, autoscroll, export .log",
      "Logs por consulta KG mostram nome canônico, contagem de nós e relações",
      "I18N_VERSION → 1.30.0",
    ],
    files: [
      "src/services/clinical/runClinicalAnalysisPipeline.ts",
      "src/components/pet/ClinicalPipelineWorkflow.tsx",
      "src/components/pet/ClinicalPipelineLogPanel.tsx",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-28",
    area: "curation",
    kind: "added",
    title: "Painel Admin de Curadoria de Doses",
    bullets: [
      "3 visões: Pendentes (needs_review=true), Curadas, Mais Usadas (via dosage_lookup_log)",
      "Selos de proveniência (Curado / Web Autoritativo / KG Triplet / Estimativa IA / Default)",
      "Aprovação registra curated_by + curated_at e remove needs_review",
    ],
    files: ["src/components/administrador/dosage-curation/DosageCurationPanel.tsx"],
    status: "entregue",
  },
  {
    date: "2026-04-28",
    area: "vet-ui",
    kind: "fixed",
    title: "Links de Estudos Persistindo nos Cards",
    bullets: [
      "VetRecommendationPanel sincroniza com novas análises/atualizações de compounds",
      "CompoundDosageSlider reconstrói URL clicável local de link/doi/pmid/título",
      "I18N_VERSION → 1.26.2",
    ],
    files: [
      "src/components/pet/VetRecommendationPanel.tsx",
      "src/components/pet/CompoundDosageSlider.tsx",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-28",
    area: "vet-ui",
    kind: "added",
    title: "Selo de Fonte do Link + Fallback de Estudos",
    bullets: [
      "Badge derivado da URL final (DOI/PubMed/PMC/Scholar/Externo)",
      "ExternalLink + aria-label nos títulos",
      "Fallback compound-only em attachStudiesToCompounds quando não há triplet exato",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-28",
    area: "vet-ui",
    kind: "changed",
    title: "Knowledge Graph dentro de cada card de composto",
    bullets: [
      "CompoundDosageSlider ganha bloco com triplets reais + contagem de estudos + % confiança",
      "Sinergias por paciente: cruza condições atuais com triplet_extractions aprovados",
      "Abas reduzidas para Recomendações · Caminho Biológico · Projeção",
      "Util compartilhado predicateStyles.ts",
    ],
    status: "entregue",
  },
  {
    date: "2026-04-28",
    area: "vet-ui",
    kind: "removed",
    title: "Aba 'Alertas Clínicos' removida (duplicação)",
    bullets: [
      "Predisposições não-diagnosticadas já aparecem em 'Alvos para Prevenção'",
      "Reordenação: Recomendações (default) → Caminho → Evidência → Projeção → Chat",
    ],
    status: "entregue",
  },
];
