
import { NutraceuticalQueryService } from './query-service';
import { NutraceuticalMutationService } from './mutation-service';
import { NutraceuticalMetadataService } from './metadata-service';
import { NutraceuticalRelationsService } from './relations-service';

/**
 * Serviço unificado para gerenciar nutracêuticos no Supabase
 */
export const NutraceuticalsService = {
  // Consulta de nutracêuticos
  getAllNutraceuticals: NutraceuticalQueryService.getAllNutraceuticals,
  getNutraceuticalById: NutraceuticalQueryService.getNutraceuticalById,
  
  // Operações de mutação básicas
  createNutraceutical: NutraceuticalMutationService.createNutraceutical,
  updateNutraceutical: NutraceuticalMutationService.updateNutraceutical,
  deleteNutraceutical: NutraceuticalMutationService.deleteNutraceutical,
  
  // Operações de benefícios e metadados
  addBenefit: NutraceuticalMetadataService.addBenefit,
  updateScientificMetadata: NutraceuticalMetadataService.updateScientificMetadata,
  
  // Operações de relações
  relateToCondition: NutraceuticalRelationsService.relateToCondition,
  relateToStudy: NutraceuticalRelationsService.relateToStudy
};
