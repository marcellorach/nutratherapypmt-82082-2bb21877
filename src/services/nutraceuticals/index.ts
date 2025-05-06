
import { NutraceuticalBaseService } from './base-service';
import { NutraceuticalQueryService } from './query-service';
import { NutraceuticalMutationService } from './mutation-service';
import { NutraceuticalMetadataService } from './metadata-service';
import { NutraceuticalRelationsService } from './relations-service';

/**
 * Serviço agregador para nutracêuticos
 * Exporta todas as funções dos serviços especializados
 */
export const NutraceuticalsService = {
  // Funções básicas CRUD
  ...NutraceuticalQueryService,
  ...NutraceuticalMutationService,
  
  // Funções de metadados
  ...NutraceuticalMetadataService,
  
  // Funções de relações
  ...NutraceuticalRelationsService,
  
  // Helper para lidar com erros
  handleError: NutraceuticalBaseService.handleError,
};
