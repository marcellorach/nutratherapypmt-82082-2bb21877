
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
  
  // Funções específicas que não estão nos outros serviços
  
  /**
   * Relaciona um nutracêutico a um estudo científico
   * @param nutraceuticalId ID do nutracêutico
   * @param studyId ID do estudo científico
   * @param relevanceScore Pontuação de relevância (1-5)
   */
  relateToStudy: NutraceuticalRelationsService.relateToStudy,
  
  /**
   * Remove uma relação entre nutracêutico e estudo
   * @param relationId ID da relação
   */
  removeStudyRelation: NutraceuticalRelationsService.removeStudyRelation
};
