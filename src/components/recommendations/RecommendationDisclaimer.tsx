import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, Stethoscope } from 'lucide-react';
import { DisclaimerType } from '@/types/recommendation-confidence';
import { useTranslation } from 'react-i18next';

interface RecommendationDisclaimerProps {
  disclaimerType: DisclaimerType;
  rationale?: string;
  className?: string;
}

const RecommendationDisclaimer: React.FC<RecommendationDisclaimerProps> = ({
  disclaimerType,
  rationale,
  className = ''
}) => {
  const { t } = useTranslation();

  if (disclaimerType === 'none') {
    return null;
  }

  if (disclaimerType === 'low_confidence') {
    return (
      <Alert 
        variant="default" 
        className={`
          border-yellow-300 dark:border-yellow-700 
          bg-yellow-50 dark:bg-yellow-900/20
          ${className}
        `}
      >
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
          {t('disclaimer.lowConfidence.title', '⚠️ Confiança Limitada')}
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
          <p>
            {t('disclaimer.lowConfidence.description', 
              'Esta recomendação está baseada em dados limitados do Knowledge Graph. ' +
              'Alguns detalhes foram enriquecidos por IA para completude.'
            )}
          </p>
          <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-1.5 text-yellow-800 dark:text-yellow-200 font-medium text-xs">
              <Stethoscope className="h-3 w-3" />
              {t('disclaimer.lowConfidence.recommendation', 'Recomendamos:')}
            </div>
            <ul className="mt-1 space-y-0.5 text-xs">
              <li>• {t('disclaimer.lowConfidence.point1', 'Consultar veterinário antes de iniciar')}</li>
              <li>• {t('disclaimer.lowConfidence.point2', 'Iniciar com doses conservadoras')}</li>
              <li>• {t('disclaimer.lowConfidence.point3', 'Monitorar reações cuidadosamente')}</li>
            </ul>
          </div>
          {rationale && (
            <p className="mt-2 text-xs italic opacity-80">
              {rationale}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (disclaimerType === 'no_kg_data') {
    return (
      <Alert 
        variant="destructive" 
        className={`
          border-red-300 dark:border-red-700 
          bg-red-50 dark:bg-red-900/20
          ${className}
        `}
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium">
          {t('disclaimer.noKgData.title', '🔴 Aviso de Confiança Baixa')}
        </AlertTitle>
        <AlertDescription className="text-xs mt-1">
          <p className="font-medium">
            {t('disclaimer.noKgData.description', 
              'Esta recomendação é baseada em conhecimento geral de IA, ' +
              'NÃO em dados curados do nosso Knowledge Graph científico.'
            )}
          </p>
          <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Stethoscope className="h-3 w-3" />
              {t('disclaimer.noKgData.criticalRecommendation', 'AÇÕES CRÍTICAS RECOMENDADAS:')}
            </div>
            <ul className="mt-1 space-y-1 text-xs">
              <li className="flex items-start gap-1">
                <span className="font-bold">1.</span>
                {t('disclaimer.noKgData.point1', 'OBRIGATÓRIO: Consultar veterinário antes de implementar')}
              </li>
              <li className="flex items-start gap-1">
                <span className="font-bold">2.</span>
                {t('disclaimer.noKgData.point2', 'Iniciar com doses MUITO conservadoras (50% do sugerido)')}
              </li>
              <li className="flex items-start gap-1">
                <span className="font-bold">3.</span>
                {t('disclaimer.noKgData.point3', 'Monitorar reações de perto nas primeiras 48h')}
              </li>
              <li className="flex items-start gap-1">
                <span className="font-bold">4.</span>
                {t('disclaimer.noKgData.point4', 'Interromper imediatamente se houver reações adversas')}
              </li>
            </ul>
          </div>
          {rationale && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <Info className="h-3 w-3 inline mr-1" />
              <span className="italic">{rationale}</span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default RecommendationDisclaimer;
