
import { NutraceuticalBaseService } from './base-service';
import { NutraceuticalMutationService } from './mutation-service';
import { NutraceuticalQueryService } from './query-service';
import { NutraceuticalMetadataService } from './metadata-service';
import { NutraceuticalRelationsService } from './relations-service';

export const NutraceuticalsService = {
  // Operações Básicas
  getById: NutraceuticalQueryService.getById,
  getAll: NutraceuticalQueryService.getAll,
  getAllNutraceuticals: NutraceuticalQueryService.getAll, // Alias para compatibilidade
  getByName: NutraceuticalQueryService.getByName,
  
  // Aliases para manter compatibilidade com código existente
  create: NutraceuticalMutationService.createNutraceutical,
  update: NutraceuticalMutationService.updateNutraceutical,
  delete: NutraceuticalMutationService.deleteNutraceutical,
  
  // Operações de mutação
  createNutraceutical: NutraceuticalMutationService.createNutraceutical,
  updateNutraceutical: NutraceuticalMutationService.updateNutraceutical,
  deleteNutraceutical: NutraceuticalMutationService.deleteNutraceutical,
  
  // Operações de Metadados
  getAllOutcomes: NutraceuticalMetadataService.getAllOutcomes,
  getAllCategories: NutraceuticalMetadataService.getAllCategories,
  getAllActiveIngredients: NutraceuticalMetadataService.getAllActiveIngredients,
  getAllConditions: NutraceuticalMetadataService.getAllConditions,
  getAllStudies: NutraceuticalMetadataService.getAllStudies,
  addBenefit: NutraceuticalMetadataService.addBenefit,
  updateScientificMetadata: NutraceuticalMetadataService.updateScientificMetadata,
  
  // Operações de Relações
  relateToCondition: NutraceuticalRelationsService.relateToCondition,
  relateToStudy: NutraceuticalRelationsService.relateToStudy,
  removeConditionRelation: NutraceuticalRelationsService.removeConditionRelation,
  removeStudyRelation: NutraceuticalRelationsService.removeStudyRelation,
  getConditionRelations: NutraceuticalQueryService.getConditionRelations,
  getStudyRelations: NutraceuticalQueryService.getStudyRelations,
  
  // Nova operação para adicionar/atualizar relações completas (categoria + estudos + notas)
  updateOutcomeRelation: NutraceuticalRelationsService.updateOutcomeRelation
};
