import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Apple, Loader2 } from 'lucide-react';
import HelpHint from '@/components/ui/help-hint';
import { usePetNutrition } from '@/hooks/usePetConsultations';
import NutritionGapAnalysis from '@/components/pet/NutritionGapAnalysis';
import NutritionGapEvolutionChart from '@/components/pet/NutritionGapEvolutionChart';

interface Props {
  petId: string;
  petContext?: {
    species: 'dog' | 'cat';
    weight_kg: number;
    age_years: number | null;
    breed_size?: 'small' | 'medium' | 'large' | 'giant' | null;
    breed_name?: string | null;
    active_conditions: string[];
  };
}

const PetNutritionPanel: React.FC<Props> = ({ petId, petContext }) => {
  const { t } = useTranslation();
  const { data, isLoading } = usePetNutrition(petId);
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('petNutrition.loading')}
        </CardContent>
      </Card>
    );
  }
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Apple className="h-4 w-4 text-primary" />
            {t('petNutrition.title')}
            <HelpHint title={t('petNutrition.helpTitle')}>{t('petNutrition.helpBody')}</HelpHint>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-6">
          {t('petNutrition.empty')}
        </CardContent>
      </Card>
    );
  }

  const current = data.find((n) => n.is_current) ?? data[0];
  const previous = data.filter((n) => n.id !== current.id);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Apple className="h-4 w-4 text-primary" />
          {t('petNutrition.title')}
          <HelpHint title={t('petNutrition.helpTitle')}>{t('petNutrition.helpBody')}</HelpHint>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('petNutrition.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="default" className="text-[10px]">{t('petNutrition.currentBadge')}</Badge>
            <Badge variant="outline" className="text-[10px]">{t(`petNutrition.dietType.${current.diet_type}`, current.diet_type)}</Badge>
            {current.daily_amount_g != null && (
              <Badge variant="outline" className="text-[10px]">{current.daily_amount_g} g/{t('petNutrition.day')}</Badge>
            )}
            {current.meals_per_day != null && (
              <Badge variant="outline" className="text-[10px]">{current.meals_per_day} {t('petNutrition.mealsPerDay')}</Badge>
            )}
            {current.water_intake && (
              <Badge variant="outline" className="text-[10px]">{t('petNutrition.water')}: {current.water_intake}</Badge>
            )}
          </div>
          {current.items.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">{t('petNutrition.products')}</p>
              <ul className="text-sm list-disc pl-5">
                {current.items.map((it) => (
                  <li key={it.id}>
                    <span className="font-medium">{it.raw_brand_text}</span>
                    {it.raw_product_text ? ` — ${it.raw_product_text}` : ''}
                    {it.share_percent != null ? ` · ${it.share_percent}%` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(current.restrictions) && current.restrictions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">{t('petNutrition.restrictions')}:</span> {current.restrictions.join(', ')}
            </p>
          )}
          {current.notes && <p className="text-xs text-muted-foreground mt-1">{current.notes}</p>}
        </div>
        {previous.length > 0 && (
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">{t('petNutrition.previous')} ({previous.length})</p>
            <ul className="text-xs space-y-1">
              {previous.map((p) => (
                <li key={p.id} className="text-muted-foreground">
                  {p.started_at ?? '—'} · {t(`petNutrition.dietType.${p.diet_type}`, p.diet_type)}
                  {p.items[0]?.raw_brand_text ? ` · ${p.items[0].raw_brand_text}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {petContext && petContext.weight_kg > 0 && (
        <CardContent className="pt-0">
          <NutritionGapAnalysis
            petId={petId}
            species={petContext.species}
            weight_kg={petContext.weight_kg}
            age_years={petContext.age_years}
            breed_size={petContext.breed_size ?? null}
            breed_name={petContext.breed_name ?? null}
            active_conditions={petContext.active_conditions}
          />
        </CardContent>
      )}
      {petContext && petContext.weight_kg > 0 && data.length >= 2 && (
        <CardContent className="pt-0">
          <NutritionGapEvolutionChart
            petId={petId}
            species={petContext.species}
            weight_kg={petContext.weight_kg}
            age_years={petContext.age_years}
            breed_size={petContext.breed_size ?? null}
            breed_name={petContext.breed_name ?? null}
            active_conditions={petContext.active_conditions}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default PetNutritionPanel;