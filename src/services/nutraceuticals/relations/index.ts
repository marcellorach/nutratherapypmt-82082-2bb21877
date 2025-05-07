
/**
 * Este arquivo exporta todos os serviços de relações
 * para nutracêuticos, para facilitar a importação.
 */

import { BenefitRelationsService } from './benefit-relations';
import { ConditionRelationsService } from './condition-relations';
import { OutcomeRelationsService } from './outcome-relations';
import { StudyRelationsService } from './study-relations';

export const NutraceuticalRelationsService = {
  // Benefícios
  addBenefit: BenefitRelationsService.addBenefit,
  getBenefits: BenefitRelationsService.getBenefits,
  removeBenefit: BenefitRelationsService.removeBenefit,
  
  // Condições/Outcomes
  relateToCondition: ConditionRelationsService.relateToCondition,
  getConditionRelations: ConditionRelationsService.getConditionRelations,
  removeConditionRelation: ConditionRelationsService.removeConditionRelation,
  
  // Estudos
  relateToStudy: StudyRelationsService.relateToStudy,
  getStudyRelations: StudyRelationsService.getStudyRelations,
  removeStudyRelation: StudyRelationsService.removeStudyRelation,
  
  // Outcomes específicos
  relateToOutcome: OutcomeRelationsService.relateToOutcome,
  updateOutcomeRelation: OutcomeRelationsService.updateOutcomeRelation,
  removeOutcomeRelation: OutcomeRelationsService.removeOutcomeRelation,
  getOutcomeRelations: OutcomeRelationsService.getOutcomeRelations
};

// Para manter compatibilidade com código existente
export * from './benefit-relations';
export * from './condition-relations';
export * from './outcome-relations';
export * from './study-relations';
