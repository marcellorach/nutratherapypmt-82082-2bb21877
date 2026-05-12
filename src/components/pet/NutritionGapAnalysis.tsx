import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle2, Loader2, ScaleIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Dna } from 'lucide-react';
import {
  analyzeNutritionGaps,
  inferLifeStage,
  type LifeStage,
  type NutrientGap,
  type PetNutritionContext,
  type BreedPredispositionInput,
} from '@/services/nutrition-gap-analyzer';
import { useBreedPredispositionsForPet } from '@/hooks/useBreedPredispositionsForPet';

interface Props {
  petId: string;
  species: 'dog' | 'cat';
  weight_kg: number;
  age_years: number | null;
  breed_size?: 'small' | 'medium' | 'large' | 'giant' | null;
  breed_name?: string | null;
  /** Nomes (PT ou EN) das condições ativas. */
  active_conditions: string[];
  life_stage?: LifeStage;
}

function statusBadge(g: NutrientGap, t: (k: string) => string) {
  const map: Record<NutrientGap['status'], { variant: any; icon: React.ReactNode }> = {
    deficient: { variant: 'destructive', icon: <TrendingDown className="h-3 w-3" /> },
    excess: { variant: 'destructive', icon: <TrendingUp className="h-3 w-3" /> },
    adequate: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    unknown: { variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const cfg = map[g.status];
  return (
    <Badge variant={cfg.variant} className="text-[10px] gap-1">
      {cfg.icon}
      {t(`nutritionGap.status.${g.status}`)}
    </Badge>
  );
}

const NutritionGapAnalysis: React.FC<Props> = ({
  petId, species, weight_kg, age_years, breed_size, breed_name, active_conditions, life_stage,
}) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'pt').startsWith('en') ? 'en' : 'pt';

  const { data: breedCtx } = useBreedPredispositionsForPet(breed_name ?? undefined);
  const breed_predispositions: BreedPredispositionInput[] | undefined = breedCtx?.predispositions as any;
  const resolved_breed_size = (breedCtx?.breed?.size_category as any) ?? breed_size ?? null;

  const ctx: PetNutritionContext = useMemo(() => ({
    petId,
    species,
    weight_kg,
    age_years,
    life_stage: life_stage ?? inferLifeStage(age_years, resolved_breed_size ?? null),
    breed_size: resolved_breed_size,
    breed_name: breed_name ?? null,
    active_conditions: active_conditions ?? [],
    breed_predispositions,
  }), [petId, species, weight_kg, age_years, life_stage, resolved_breed_size, breed_name, active_conditions, breed_predispositions]);

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-gap', petId, ctx.life_stage, weight_kg, active_conditions.join('|'), (breed_predispositions ?? []).map((p) => p.condition_name).join('|')],
    queryFn: () => analyzeNutritionGaps(ctx),
    // Espera o resultado do hook de predisposições antes de calcular, para evitar
    // duas execuções (uma sem e outra com breed_predispositions).
    enabled: !!petId && weight_kg > 0 && (!breed_name || breedCtx !== undefined),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('nutritionGap.loading')}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const noLinked = data.warnings.includes('no_linked_products') || !data.has_data;

  return (
    <Card className="border-amber-200/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ScaleIcon className="h-4 w-4 text-amber-600" />
          {t('nutritionGap.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('nutritionGap.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Energia */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{t('nutritionGap.lifeStage')}</div>
            <div className="font-medium capitalize">{ctx.life_stage}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{t('nutritionGap.target')}</div>
            <div className="font-medium">{data.daily_kcal_target} kcal/{t('nutritionGap.perDay')}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{t('nutritionGap.intake')}</div>
            <div className="font-medium">
              {data.current_daily_kcal != null
                ? `${data.current_daily_kcal} kcal`
                : '—'}
            </div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{t('nutritionGap.density')}</div>
            <div className="font-medium">
              {data.current_kcal_per_kg ? `${Math.round(data.current_kcal_per_kg)} kcal/kg` : '—'}
            </div>
          </div>
        </div>

        {data.warnings.includes('underfeeding') && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            {t('nutritionGap.underfeeding')}
          </div>
        )}
        {data.warnings.includes('overfeeding') && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            {t('nutritionGap.overfeeding')}
          </div>
        )}

        {noLinked ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            {t('nutritionGap.noLinked')}
          </div>
        ) : (
          <TooltipProvider>
            <div className="space-y-2">
              {data.gaps.map((g) => (
                <div key={g.key} className="flex items-start justify-between gap-3 border rounded p-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {lang === 'pt' ? g.label_pt : g.label_en}
                      <span className="text-xs text-muted-foreground">
                        ({g.unit === 'ratio' ? t('nutritionGap.ratio') : g.unit})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t('nutritionGap.observed')}:{' '}
                      <span className="font-medium text-foreground">
                        {g.observed != null ? g.observed : '—'}
                      </span>
                      {' · '}
                      {t('nutritionGap.targetLabel')}:{' '}
                      <span className="font-medium text-foreground">
                        {g.target_min != null ? `≥ ${g.target_min}` : ''}
                        {g.target_min != null && g.target_max != null ? ' · ' : ''}
                        {g.target_max != null ? `≤ ${g.target_max}` : ''}
                      </span>
                      {g.delta_pct != null && g.status !== 'adequate' && (
                        <span className={`ml-2 ${g.status === 'deficient' ? 'text-destructive' : 'text-amber-700'}`}>
                          ({g.delta_pct > 0 ? '+' : ''}{g.delta_pct}%)
                        </span>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-[11px] text-primary underline mt-1">
                          {t('nutritionGap.rationale')}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm text-xs">
                        <p>{lang === 'pt' ? g.rationale_pt : g.rationale_en}</p>
                        <p className="mt-1 text-muted-foreground">{t('nutritionGap.source')}: {g.source}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div>{statusBadge(g, t)}</div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        )}

        {data.breed_recommendations.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-semibold">
                {t('nutritionGap.breed.title')}{breedCtx?.breed?.name ? ` (${breedCtx.breed.name})` : ''}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{t('nutritionGap.breed.subtitle')}</p>
            <TooltipProvider>
              <div className="space-y-3">
                {data.breed_recommendations.map((rec) => {
                  const condLabel = lang === 'pt' ? rec.condition_name : (rec.condition_name_en || rec.condition_name);
                  return (
                    <div key={condLabel} className="rounded-lg border border-purple-200/60 bg-purple-50/40 p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{condLabel}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {t('nutritionGap.breed.risk')} {rec.risk_factor.toFixed(1)}×
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {t('nutritionGap.breed.evidence')}: {rec.evidence_grade}
                        </Badge>
                        {rec.already_active && (
                          <Badge variant="destructive" className="text-[10px]">
                            {t('nutritionGap.breed.alreadyActive')}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {rec.gaps.map((g) => (
                          <div key={g.key} className="flex items-start justify-between gap-3 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">
                                {lang === 'pt' ? g.label_pt : g.label_en}{' '}
                                <span className="text-muted-foreground">
                                  ({g.unit === 'ratio' ? t('nutritionGap.ratio') : g.unit})
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {t('nutritionGap.observed')}:{' '}
                                <span className="text-foreground font-medium">
                                  {g.observed != null ? g.observed : '—'}
                                </span>
                                {' · '}
                                {t('nutritionGap.targetLabel')}:{' '}
                                <span className="text-foreground font-medium">
                                  {g.target_min != null ? `≥ ${g.target_min}` : ''}
                                  {g.target_min != null && g.target_max != null ? ' · ' : ''}
                                  {g.target_max != null ? `≤ ${g.target_max}` : ''}
                                </span>
                                {g.delta_pct != null && g.status !== 'adequate' && (
                                  <span className={`ml-2 ${g.status === 'deficient' ? 'text-destructive' : 'text-amber-700'}`}>
                                    ({g.delta_pct > 0 ? '+' : ''}{g.delta_pct}%)
                                  </span>
                                )}
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-[11px] text-primary underline mt-0.5">
                                    {t('nutritionGap.rationale')}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm text-xs">
                                  <p>{lang === 'pt' ? g.rationale_pt : g.rationale_en}</p>
                                  <p className="mt-1 text-muted-foreground">
                                    {t('nutritionGap.source')}: {g.source}
                                  </p>
                                  <p className="mt-1 text-muted-foreground">
                                    {t('nutritionGap.breed.predisposition')}: {condLabel} · {rec.risk_factor.toFixed(1)}× · {rec.evidence_grade}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div>{statusBadge(g, t)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionGapAnalysis;
