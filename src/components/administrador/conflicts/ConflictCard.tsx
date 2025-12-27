import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Calendar,
  Beaker,
  FileText,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EvidenceConflict, EvidenceClaimDB } from '@/hooks/useEvidenceConflicts';
import { cn } from '@/lib/utils';

interface ConflictCardProps {
  conflict: EvidenceConflict;
  claims?: EvidenceClaimDB[];
  isLoadingClaims?: boolean;
  onResolve: () => void;
  onDismiss: () => void;
  onViewDetails: () => void;
}

const conflictLevelConfig = {
  none: { color: 'bg-emerald-500', icon: CheckCircle2, label: 'conflicts.level.none' },
  low: { color: 'bg-emerald-500', icon: CheckCircle2, label: 'conflicts.level.low' },
  moderate: { color: 'bg-amber-500', icon: AlertCircle, label: 'conflicts.level.moderate' },
  high: { color: 'bg-destructive', icon: AlertTriangle, label: 'conflicts.level.high' },
};

export function ConflictCard({
  conflict,
  claims = [],
  isLoadingClaims,
  onResolve,
  onDismiss,
  onViewDetails,
}: ConflictCardProps) {
  const { t } = useTranslation();
  const config = conflictLevelConfig[conflict.conflict_level];
  const ConflictIcon = config.icon;

  // Group claims by study year for display
  const claimsByYear = claims.reduce((acc, claim) => {
    const year = claim.study_year || 'Unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(claim);
    return acc;
  }, {} as Record<string | number, EvidenceClaimDB[]>);

  return (
    <Card className={cn(
      "border-l-4 transition-all hover:shadow-md",
      conflict.conflict_level === 'high' && "border-l-destructive",
      conflict.conflict_level === 'moderate' && "border-l-amber-500",
      conflict.conflict_level === 'low' && "border-l-emerald-500",
      conflict.conflict_level === 'none' && "border-l-muted"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ConflictIcon className={cn("h-5 w-5", 
              conflict.conflict_level === 'high' && "text-destructive",
              conflict.conflict_level === 'moderate' && "text-amber-500",
              conflict.conflict_level === 'low' && "text-emerald-500"
            )} />
            <CardTitle className="text-base font-medium">
              {conflict.subject_name} → {conflict.predicate} → {conflict.object_name}
            </CardTitle>
          </div>
          <Badge variant={conflict.conflict_level === 'high' ? 'destructive' : 'secondary'}>
            {t(config.label)}
          </Badge>
        </div>
        
        {conflict.species_context && conflict.species_context.length > 0 && (
          <div className="flex gap-1 mt-1">
            {conflict.species_context.map(species => (
              <Badge key={species} variant="outline" className="text-xs">
                {species}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{t('conflicts.card.studies', { count: conflict.study_count })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Beaker className="h-4 w-4" />
            <span>{t('conflicts.card.claims', { count: conflict.claim_count })}</span>
          </div>
          {conflict.variance_coefficient !== null && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>CV: {(conflict.variance_coefficient * 100).toFixed(1)}%</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('conflicts.card.varianceTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Claims preview */}
        {!isLoadingClaims && claims.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t('conflicts.card.dosageBreakdown')}:
            </p>
            <div className="grid gap-2">
              {claims.slice(0, 3).map(claim => (
                <div 
                  key={claim.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{claim.study_year || '?'}</span>
                    {claim.study_quality_score && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs ml-0.5">{claim.study_quality_score}</span>
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-xs">
                    {claim.dose_min !== null && claim.dose_max !== null ? (
                      <span>{claim.dose_min}-{claim.dose_max} {claim.dose_unit || ''}</span>
                    ) : claim.dose_value !== null ? (
                      <span>{claim.dose_value} {claim.dose_unit || ''}</span>
                    ) : (
                      <span className="text-muted-foreground">{t('conflicts.card.noDose')}</span>
                    )}
                    {claim.dose_frequency && (
                      <span className="text-muted-foreground ml-1">({claim.dose_frequency})</span>
                    )}
                  </div>
                </div>
              ))}
              {claims.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{claims.length - 3} {t('conflicts.card.moreClaims')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {conflict.ai_suggestion && (
          <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1">
              💡 {t('conflicts.card.aiSuggestion')}:
            </p>
            <p className="text-sm text-muted-foreground">
              {conflict.ai_suggestion}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button onClick={onResolve} size="sm" className="flex-1">
            {t('conflicts.card.resolve')}
          </Button>
          <Button onClick={onViewDetails} variant="outline" size="sm">
            {t('conflicts.card.viewDetails')}
          </Button>
          <Button onClick={onDismiss} variant="ghost" size="sm" className="text-muted-foreground">
            {t('conflicts.card.dismiss')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
