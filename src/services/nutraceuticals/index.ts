
import { NutraceuticalBaseService } from './base-service';
import { NutraceuticalMutationService } from './mutation-service';
import { NutraceuticalQueryService } from './query-service';
import { NutraceuticalMetadataService } from './metadata-service';
import { NutraceuticalRelationsService } from './relations-service';

export const NutraceuticalsService = {
  // Operações Básicas
  getById: NutraceuticalQueryService.getById,
  getAll: NutraceuticalQueryService.getAll,
  getByName: NutraceuticalQueryService.getByName,
  create: NutraceuticalMutationService.create,
  update: NutraceuticalMutationService.update,
  delete: NutraceuticalMutationService.delete,
  
  // Operações de Metadados
  getAllOutcomes: NutraceuticalMetadataService.getAllOutcomes,
  getAllCategories: NutraceuticalMetadataService.getAllCategories,
  getAllActiveIngredients: NutraceuticalMetadataService.getAllActiveIngredients,
  getAllConditions: NutraceuticalMetadataService.getAllConditions,
  getAllStudies: NutraceuticalMetadataService.getAllStudies,
  
  // Operações de Relações
  relateToCondition: NutraceuticalRelationsService.relateToCondition,
  relateToStudy: NutraceuticalRelationsService.relateToStudy,
  removeConditionRelation: NutraceuticalRelationsService.removeConditionRelation,
  removeStudyRelation: NutraceuticalRelationsService.removeStudyRelation,
  getConditionRelations: NutraceuticalQueryService.getConditionRelations,
  getStudyRelations: NutraceuticalQueryService.getStudyRelations
};
