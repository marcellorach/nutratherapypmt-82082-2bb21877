// Confidence Indicator Component - v1.0.1
import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle,
  Info,
  TrendingUp,
  BookOpen,
  Calendar
} from 'lucide-react';
import { RecommendationConfidence, ConfidenceLevel } from '@/types/recommendation-confidence';
import { useTranslation } from 'react-i18next';

interface ConfidenceIndicatorProps {
  confidence: RecommendationConfidence;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const levelConfig: Record<ConfidenceLevel, {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  high: {
    icon: ShieldCheck,
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    borderClass: 'border-green-300 dark:border-green-700'
  },
  medium: {
    icon: ShieldAlert,
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderClass: 'border-yellow-300 dark:border-yellow-700'
  },
  low: {
    icon: AlertTriangle,
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    borderClass: 'border-orange-300 dark:border-orange-700'
  },
  insufficient: {
    icon: AlertCircle,
    colorClass: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    borderClass: 'border-red-300 dark:border-red-700'
  }
};

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showDetails = true,
  size = 'md'
}) => {
  const { t } = useTranslation();
  const config = levelConfig[confidence.confidenceLevel];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const levelLabels: Record<ConfidenceLevel, string> = {
    high: t('confidence.levels.high', 'Alta Confiança'),
    medium: t('confidence.levels.medium', 'Confiança Média'),
    low: t('confidence.levels.low', 'Confiança Baixa'),
    insufficient: t('confidence.levels.insufficient', 'Dados Insuficientes')
  };

  const renderMetricBar = (score: number, label: string, icon: React.ReactNode) => (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            score >= 0.7 ? 'bg-green-500' : 
            score >= 0.5 ? 'bg-yellow-500' : 
            score >= 0.3 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`
              ${config.bgClass} 
              ${config.colorClass} 
              ${config.borderClass}
              ${sizeClasses[size]}
              cursor-help
              flex items-center gap-1.5
              transition-all duration-200
              hover:opacity-80
            `}
          >
            <Icon className={iconSizes[size]} />
            <span>{levelLabels[confidence.confidenceLevel]}</span>
            <span className="opacity-70">
              ({(confidence.overall * 100).toFixed(0)}%)
            </span>
          </Badge>
        </TooltipTrigger>
        {showDetails && (
          <TooltipContent 
            side="bottom" 
            className="w-80 p-4"
            sideOffset={5}
          >
            <div className="space-y-3">
              <div className="font-medium text-sm border-b pb-2">
                {t('confidence.breakdown', 'Detalhamento da Confiança')}
              </div>
              
              <div className="space-y-2">
                {renderMetricBar(
                  confidence.kgCoverage.score, 
                  t('confidence.kgCoverage', 'Cobertura KG'),
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                )}
                {renderMetricBar(
                  confidence.evidenceQuality.score, 
                  t('confidence.evidenceQuality', 'Qualidade'),
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                )}
                {renderMetricBar(
                  confidence.dataFreshness.score, 
                  t('confidence.freshness', 'Atualidade'),
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>
                    {confidence.kgCoverage.tripletCount} {t('confidence.triplets', 'triplets')} | {' '}
                    {confidence.kgCoverage.studyCount} {t('confidence.studies', 'estudos')}
                  </span>
                </div>
                
                {confidence.evidenceQuality.hasMetaAnalysis && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    ✓ {t('confidence.hasMetaAnalysis', 'Suportado por meta-análises')}
                  </div>
                )}
                
                {confidence.evidenceQuality.hasRCT && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    ✓ {t('confidence.hasRCT', 'Suportado por RCTs')}
                  </div>
                )}
                
                {confidence.humanReviewRecommended && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    ⚠ {t('confidence.reviewRecommended', 'Revisão veterinária recomendada')}
                  </div>
                )}
              </div>

              {confidence.warnings.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">
                    {t('confidence.warnings', 'Avisos')}:
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {confidence.warnings.slice(0, 3).map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConfidenceIndicator;
