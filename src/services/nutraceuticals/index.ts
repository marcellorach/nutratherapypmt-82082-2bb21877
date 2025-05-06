
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
  
  // Exportando getStudyRelations da query service
  getStudyRelations: NutraceuticalQueryService.getStudyRelations,
  
  removeStudyRelation: NutraceuticalRelationsService.removeStudyRelation,
  removeOutcomeRelation: NutraceuticalRelationsService.removeOutcomeRelation,
  removeConditionRelation: NutraceuticalRelationsService.removeOutcomeRelation, // Alias
  
  getOutcomeRelations: NutraceuticalQueryService.getOutcomeRelations,
  getConditionRelations: NutraceuticalQueryService.getOutcomeRelations, // Alias
  
  // Nova função para adicionar benefícios
  addBenefit: async (nutraceuticalId: string, benefit: string) => {
    try {
      // Vamos usar o serviço de metadados para adicionar benefícios
      // Atualizando para usar apenas 2 argumentos conforme a interface esperada
      const metadata = await NutraceuticalQueryService.getById(nutraceuticalId);
      await NutraceuticalMetadataService.updateScientificMetadata(
        nutraceuticalId, 
        metadata?.scientific_metadata?.efficacy_score || 0,
        // Adicionamos o benefício através de outro método ou no updateOutcomeRelation
      );
      
      // Adicionamos o benefício usando o updateOutcomeRelation
      await NutraceuticalRelationsService.updateOutcomeRelation(
        nutraceuticalId,
        `Benefício: ${benefit}`
      );
      
      return { success: true };
    } catch (error) {
      NutraceuticalBaseService.handleError(error, 'adicionar benefício');
      return { success: false, error };
    }
  }
};

export default NutraceuticalsService;
