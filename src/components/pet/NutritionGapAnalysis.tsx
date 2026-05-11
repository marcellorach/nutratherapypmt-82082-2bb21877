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

function statusBadge(g: NutrientGap, lang: 'pt' | 'en') {
  const map: Record<NutrientGap['status'], { variant: any; label: string; icon: React.ReactNode }> = {
    deficient: {
      variant: 'destructive',
      label: lang === 'pt' ? 'Déficit' : 'Deficient',
      icon: <TrendingDown className="h-3 w-3" />,
    },
    excess: {
      variant: 'destructive',
      label: lang === 'pt' ? 'Excesso' : 'Excess',
      icon: <TrendingUp className="h-3 w-3" />,
    },
    adequate: {
      variant: 'default',
      label: lang === 'pt' ? 'Adequado' : 'Adequate',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    unknown: {
      variant: 'outline',
      label: lang === 'pt' ? 'Sem dado' : 'No data',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };
  const cfg = map[g.status];
  return (
    <Badge variant={cfg.variant} className="text-[10px] gap-1">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

const NutritionGapAnalysis: React.FC<Props> = ({
  petId, species, weight_kg, age_years, breed_size, breed_name, active_conditions, life_stage,
}) => {
  const { i18n } = useTranslation();
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
          {lang === 'pt' ? 'Calculando déficits…' : 'Computing gaps…'}
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
          {lang === 'pt' ? 'Análise de déficit nutricional (FEDIAF/AAFCO)' : 'Nutritional gap analysis (FEDIAF/AAFCO)'}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {lang === 'pt'
            ? 'Compara a composição da dieta atual contra os mínimos FEDIAF 2024 e alvos clínicos para o estágio de vida e condições do pet.'
            : 'Compares the current diet composition against FEDIAF 2024 minimums and clinical targets for the pet\'s life stage and conditions.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Energia */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{lang === 'pt' ? 'Estágio' : 'Life stage'}</div>
            <div className="font-medium capitalize">{ctx.life_stage}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{lang === 'pt' ? 'Necessidade' : 'Target'}</div>
            <div className="font-medium">{data.daily_kcal_target} kcal/{lang === 'pt' ? 'dia' : 'day'}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{lang === 'pt' ? 'Consumo' : 'Intake'}</div>
            <div className="font-medium">
              {data.current_daily_kcal != null
                ? `${data.current_daily_kcal} kcal`
                : '—'}
            </div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">{lang === 'pt' ? 'Densidade' : 'Density'}</div>
            <div className="font-medium">
              {data.current_kcal_per_kg ? `${Math.round(data.current_kcal_per_kg)} kcal/kg` : '—'}
            </div>
          </div>
        </div>

        {data.warnings.includes('underfeeding') && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            {lang === 'pt'
              ? 'Subalimentação: consumo < 85% da necessidade calórica estimada.'
              : 'Underfeeding: intake < 85% of estimated caloric need.'}
          </div>
        )}
        {data.warnings.includes('overfeeding') && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            {lang === 'pt'
              ? 'Superalimentação: consumo > 115% da necessidade calórica estimada.'
              : 'Overfeeding: intake > 115% of estimated caloric need.'}
          </div>
        )}

        {noLinked ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            {lang === 'pt'
              ? 'A ração atual não está vinculada ao catálogo nutricional (apenas texto livre). Vincule a marca/produto em "Atual" para habilitar a análise quantitativa de déficits.'
              : 'Current diet is not linked to the nutrition catalog (free text only). Link brand/product under "Current" to enable quantitative gap analysis.'}
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
                        ({g.unit === 'ratio' ? 'razão' : g.unit})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'pt' ? 'Observado' : 'Observed'}:{' '}
                      <span className="font-medium text-foreground">
                        {g.observed != null ? g.observed : '—'}
                      </span>
                      {' · '}
                      {lang === 'pt' ? 'Alvo' : 'Target'}:{' '}
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
                          {lang === 'pt' ? 'Justificativa' : 'Rationale'}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm text-xs">
                        <p>{lang === 'pt' ? g.rationale_pt : g.rationale_en}</p>
                        <p className="mt-1 text-muted-foreground">{lang === 'pt' ? 'Fonte' : 'Source'}: {g.source}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div>{statusBadge(g, lang)}</div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionGapAnalysis;
