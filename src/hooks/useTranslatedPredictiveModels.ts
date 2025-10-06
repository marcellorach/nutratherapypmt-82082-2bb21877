import { useTranslation } from "react-i18next";
import { predictiveModelsData } from "@/components/administrador/modelosPreditivos/data/predictiveModelsData";
import { PredictiveModel } from "@/components/administrador/modelosPreditivos/types/predictiveModelTypes";

/**
 * Hook customizado para gerenciar traduções de modelos preditivos
 * Seguindo a metodologia persistente do projeto
 */
export const useTranslatedPredictiveModels = (): PredictiveModel[] => {
  const { t } = useTranslation();

  return predictiveModelsData.map((model) => ({
    ...model,
    modelName: t(`predictiveModels.models.${model.modelId}.name`),
    description: t(`predictiveModels.models.${model.modelId}.description`),
    nextMilestone: {
      ...model.nextMilestone,
      description: t(`predictiveModels.models.${model.modelId}.milestone`)
    },
    dataSources: model.dataSources.map((source) => ({
      ...source,
      label: t(`predictiveModels.dataSources.${source.type}.label`),
      description: t(`predictiveModels.dataSources.${source.type}.description`)
    })),
    degenerativeInsights: model.degenerativeInsights.map((insight) => ({
      ...insight,
      title: t(`predictiveModels.insights.discoveries.${insight.id}.title`),
      description: t(`predictiveModels.insights.discoveries.${insight.id}.description`)
    }))
  }));
};
