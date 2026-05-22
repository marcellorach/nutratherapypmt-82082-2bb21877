import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { CohortFilters, DEFAULT_FILTERS } from '@/hooks/useFilteredCohort';
import { SYNTHETIC_CONDITIONS, SYNTHETIC_BREEDS, SYNTHETIC_REGIONS } from '@/utils/syntheticCohort';

interface Props {
  filters: CohortFilters;
  onChange: (f: CohortFilters) => void;
  shown: number;
  total: number;
}

const ClinicalFiltersBar: React.FC<Props> = ({ filters, onChange, shown, total }) => {
  const { t, i18n } = useTranslation();
  const set = <K extends keyof CohortFilters>(k: K, v: CohortFilters[K]) => onChange({ ...filters, [k]: v });
  const hasActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Card className="sticky top-0 z-20 border-primary/20">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{t('clinicalMonitoring.v2.filters.title')}</span>
          <Badge variant="outline" className="ml-auto">
            {t('clinicalMonitoring.v2.filters.showing', { n: shown.toLocaleString(), total: total.toLocaleString() })}
          </Badge>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
              <X className="h-3 w-3 mr-1" /> {t('clinicalMonitoring.v2.filters.clear')}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <Select value={filters.condition} onValueChange={(v) => set('condition', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.condition')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.condition')} · {t('clinicalMonitoring.v2.filters.all')}</SelectItem>
              {SYNTHETIC_CONDITIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>{i18n.language === 'en' ? c.name_en : c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.breed} onValueChange={(v) => set('breed', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.breed')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.breed')} · {t('clinicalMonitoring.v2.filters.all')}</SelectItem>
              {SYNTHETIC_BREEDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.age} onValueChange={(v) => set('age', v as CohortFilters['age'])}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.age')} /></SelectTrigger>
            <SelectContent>
              {(['any', 'adult', 'senior', 'geriatric'] as const).map((k) => (
                <SelectItem key={k} value={k}>{t(`clinicalMonitoring.v2.filters.ageBuckets.${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.region} onValueChange={(v) => set('region', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.region')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.region')} · {t('clinicalMonitoring.v2.filters.all')}</SelectItem>
              {SYNTHETIC_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.adherence} onValueChange={(v) => set('adherence', v as CohortFilters['adherence'])}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.adherence')} /></SelectTrigger>
            <SelectContent>
              {(['any', 'high', 'mid', 'low'] as const).map((k) => (
                <SelectItem key={k} value={k}>{t(`clinicalMonitoring.v2.filters.adherenceBuckets.${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.window} onValueChange={(v) => set('window', v as CohortFilters['window'])}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.window')} /></SelectTrigger>
            <SelectContent>
              {(['any', 'early', 'mid', 'long'] as const).map((k) => (
                <SelectItem key={k} value={k}>{t(`clinicalMonitoring.v2.filters.windowBuckets.${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.response} onValueChange={(v) => set('response', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.response')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.response')} · {t('clinicalMonitoring.v2.filters.all')}</SelectItem>
              <SelectItem value="significant">{t('clinicalMonitoring.status.significant')}</SelectItem>
              <SelectItem value="mild">{t('clinicalMonitoring.status.mild')}</SelectItem>
              <SelectItem value="none">{t('clinicalMonitoring.status.none')}</SelectItem>
              <SelectItem value="insufficient">{t('clinicalMonitoring.status.insufficient')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicalFiltersBar;