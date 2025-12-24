// Legacy alias file - re-exports all types from vetgraphrag.ts
// This file exists for backward compatibility only
// All new code should import from '@/types/vetgraphrag' directly

export * from './vetgraphrag';

// Additional explicit exports for common types
export type {
  VetGraphRAGAnalysisResult as NtaiAnalysisResult,
  ProcessingStage,
  ProcessingItem,
  NtaiAnalysisStage,
  NtaiConditionTag,
  NtaiNutraceuticalTag,
  NtaiInteractionTag,
  NtaiSideEffectTag,
  MolecularMechanism,
  Synergy,
  HierarchicalRelation,
  ContextualDosage,
  DetailedSideEffect,
  ClinicalOutcome,
  StudyAssessment,
  SankeyData,
  SankeyNode,
  SankeyLink
} from './vetgraphrag';
