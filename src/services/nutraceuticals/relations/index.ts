
import { ConditionRelationsService } from './condition-relations';
import { OutcomeRelationsService } from './outcome-relations';
import { StudyRelationsService } from './study-relations';
import { BenefitRelationsService } from './benefit-relations';

/**
 * Serviço agregado para gerenciar todos os tipos de relações de nutracêuticos
 */
export const NutraceuticalRelationsService = {
  // Relações com condições de saúde
  relateToCondition: ConditionRelationsService.relateToCondition,
  getConditionRelations: ConditionRelationsService.getConditionRelations,
  removeConditionRelation: ConditionRelationsService.removeConditionRelation,
  
  // Relações com outcomes
  relateToOutcome: OutcomeRelationsService.relateToOutcome,
  updateOutcomeRelation: OutcomeRelationsService.updateOutcomeRelation,
  getOutcomeRelations: OutcomeRelationsService.getOutcomeRelations,
  removeOutcomeRelation: OutcomeRelationsService.removeOutcomeRelation,
  
  // Relações com estudos científicos
  relateToStudy: StudyRelationsService.relateToStudy,
  getStudyRelations: StudyRelationsService.getStudyRelations,
  removeStudyRelation: StudyRelationsService.removeStudyRelation,
  
  // Benefícios
  addBenefit: BenefitRelationsService.addBenefit,
  getBenefits: BenefitRelationsService.getBenefits,
  removeBenefit: BenefitRelationsService.removeBenefit
};
