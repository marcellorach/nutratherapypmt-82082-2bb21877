
import { NutraceuticalBaseService } from './base-service';
import { NutraceuticalMutationService } from './mutation-service';
import { NutraceuticalQueryService } from './query-service';
import { NutraceuticalMetadataService } from './metadata-service';
import { NutraceuticalRelationsService } from './relations-service';

export const NutraceuticalsService = {
  // Operações Básicas
  getById: NutraceuticalQueryService.getById,
  getAll: NutraceuticalQueryService.getAll,
  getAllNutraceuticals: NutraceuticalQueryService.getAllNutraceuticals,
  
  // Criação, atualização e exclusão
  createNutraceutical: NutraceuticalMutationService.createNutraceutical,
  updateNutraceutical: NutraceuticalMutationService.updateNutraceutical,
  deleteNutraceutical: NutraceuticalMutationService.deleteNutraceutical,
  
  // Metadados científicos
  updateScientificMetadata: NutraceuticalMetadataService.updateScientificMetadata,
  
  // Relações com outcomes e estudos
  relateToOutcome: NutraceuticalRelationsService.relateToOutcome,
  relateToCondition: NutraceuticalRelationsService.relateToOutcome, // Alias para compatibilidade
  
  relateToStudy: NutraceuticalRelationsService.relateToStudy,
  
  updateOutcomeRelation: NutraceuticalRelationsService.updateOutcomeRelation,
  
  getStudyRelations: NutraceuticalQueryService.getStudyRelations,
  
  removeStudyRelation: NutraceuticalRelationsService.removeStudyRelation,
  removeOutcomeRelation: NutraceuticalRelationsService.removeOutcomeRelation,
  removeConditionRelation: NutraceuticalRelationsService.removeOutcomeRelation, // Alias
  
  getOutcomeRelations: NutraceuticalQueryService.getOutcomeRelations,
  getConditionRelations: NutraceuticalQueryService.getOutcomeRelations, // Alias
};

export default NutraceuticalsService;
