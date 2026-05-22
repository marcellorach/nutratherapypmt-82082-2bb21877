import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SYNTHETIC_CONDITIONS, SYNTHETIC_BREEDS, SYNTHETIC_REGIONS } from '@/utils/syntheticCohort';
import { ClinicalCohortFilters, DEFAULT_CLINICAL_FILTERS } from '@/hooks/useFilteredCohort';

interface Props {
  filters: ClinicalCohortFilters;
  onChange: (f: ClinicalCohortFilters) => void;
  resultCount: number;
  totalCount: number;
}

const ClinicalFiltersBar: React.FC<Props> = ({ filters, onChange, resultCount, totalCount }) => {
  const { t, i18n } = useTranslation();
  const set = <K extends keyof ClinicalCohortFilters>(k: K, v: ClinicalCohortFilters[K]) => onChange({ ...filters, [k]: v });
  const clear = () => onChange({ ...DEFAULT_CLINICAL_FILTERS });
  const activeCount = Object.entries(filters).filter(([_, v]) => v && v !== 'all').length;

  return (
    <Card className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('clinicalMonitoring.v2.filters.title')}</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeCount} {t('clinicalMonitoring.v2.filters.active')}</Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {t('clinicalMonitoring.v2.filters.resultSummary', {
              count: resultCount.toLocaleString(),
              total: totalCount.toLocaleString(),
            })}
          </span>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clear} className="h-7">
              <X className="h-3 w-3 mr-1" />{t('clinicalMonitoring.v2.filters.clear')}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <Select value={filters.conditionId ?? 'all'} onValueChange={(v) => set('conditionId', v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.condition')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.allConditions')}</SelectItem>
              {SYNTHETIC_CONDITIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>{i18n.language === 'en' ? c.name_en : c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.breed ?? 'all'} onValueChange={(v) => set('breed', v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.breed')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.allBreeds')}</SelectItem>
              {SYNTHETIC_BREEDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.ageBand ?? 'all'} onValueChange={(v) => set('ageBand', v as any)}>
            <SelectTrigger className="h-9"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.age')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.allAges')}</SelectItem>
              <SelectItem value="adult">{t('clinicalMonitoring.v2.filters.ageAdult')}</SelectItem>
              <SelectItem value="senior">{t('clinicalMonitoring.v2.filters.ageSenior')}</SelectItem>
              <SelectItem value="geriatric">{t('clinicalMonitoring.v2.filters.ageGeriatric')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.region ?? 'all'} onValueChange={(v) => set('region', v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.region')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.allRegions')}</SelectItem>
              {SYNTHETIC_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.adherenceBand ?? 'all'} onValueChange={(v) => set('adherenceBand', v as any)}>
            <SelectTrigger className="h-9"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.adherence')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.allAdherence')}</SelectItem>
              <SelectItem value="high">{t('clinicalMonitoring.v2.filters.adhHigh')}</SelectItem>
              <SelectItem value="medium">{t('clinicalMonitoring.v2.filters.adhMid')}</SelectItem>
              <SelectItem value="low">{t('clinicalMonitoring.v2.filters.adhLow')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.windowBand ?? 'all'} onValueChange={(v) => set('windowBand', v as any)}>
            <SelectTrigger className="h-9"><SelectValue placeholder={t('clinicalMonitoring.v2.filters.window')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('clinicalMonitoring.v2.filters.allWindows')}</SelectItem>
              <SelectItem value="short">{t('clinicalMonitoring.v2.filters.win0to6')}</SelectItem>
              <SelectItem value="mid">{t('clinicalMonitoring.v2.filters.win6to12')}</SelectItem>
              <SelectItem value="long">{t('clinicalMonitoring.v2.filters.win12to24')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicalFiltersBar;