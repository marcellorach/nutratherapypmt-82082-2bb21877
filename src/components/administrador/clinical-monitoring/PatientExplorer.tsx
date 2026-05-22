import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SyntheticCohort, SyntheticPet, SYNTHETIC_CONDITIONS } from '@/utils/syntheticCohort';

interface Props {
  cohort: SyntheticCohort;
  onOpenPatient: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  significant: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  mild: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  none: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  insufficient: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

const PatientExplorer: React.FC<Props> = ({ cohort, onOpenPatient }) => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [responseFilter, setResponseFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const filtered = useMemo(() => {
    return cohort.treated.filter((p) => {
      if (search && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (conditionFilter !== 'all' && p.primaryConditionId !== conditionFilter) return false;
      if (responseFilter !== 'all' && p.responseStatus !== responseFilter) return false;
      return true;
    });
  }, [cohort, search, conditionFilter, responseFilter]);

  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const condName = (id: string) => {
    const c = SYNTHETIC_CONDITIONS.find((x) => x.id === id);
    return c ? (i18n.language === 'en' ? c.name_en : c.name) : id;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder={t('clinicalMonitoring.v2.explorer.search')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <Select value={conditionFilter} onValueChange={(v) => { setConditionFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder={t('clinicalMonitoring.v2.explorer.condition')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('clinicalMonitoring.v2.explorer.allConditions')}</SelectItem>
                {SYNTHETIC_CONDITIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{i18n.language === 'en' ? c.name_en : c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={responseFilter} onValueChange={(v) => { setResponseFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder={t('clinicalMonitoring.v2.explorer.response')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('clinicalMonitoring.v2.explorer.allResponses')}</SelectItem>
                <SelectItem value="significant">{t('clinicalMonitoring.status.significant')}</SelectItem>
                <SelectItem value="mild">{t('clinicalMonitoring.status.mild')}</SelectItem>
                <SelectItem value="none">{t('clinicalMonitoring.status.none')}</SelectItem>
                <SelectItem value="insufficient">{t('clinicalMonitoring.status.insufficient')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-end text-sm text-muted-foreground">
              {filtered.length.toLocaleString()} {t('clinicalMonitoring.v2.explorer.matches')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.id')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.condition')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.breed')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.age')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.months')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.adherence')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.response')}</th>
                  <th className="text-left py-2 px-2">{t('clinicalMonitoring.v2.explorer.col.years')}</th>
                  <th className="text-left py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/40 transition-colors">
                    <td className="py-2 px-2 font-mono text-xs">{p.id}</td>
                    <td className="py-2 px-2">{condName(p.primaryConditionId)}</td>
                    <td className="py-2 px-2">{p.breed}</td>
                    <td className="py-2 px-2">{p.ageYears}a</td>
                    <td className="py-2 px-2">{p.monthsOnProtocol}m</td>
                    <td className="py-2 px-2">{p.adherencePct}%</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className={STATUS_COLOR[p.responseStatus]}>
                        {t(`clinicalMonitoring.status.${p.responseStatus}`)}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">+{p.yearsGained}</td>
                    <td className="py-2 px-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenPatient(p.id)}>
                        {t('clinicalMonitoring.v2.explorer.open')} <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">{t('clinicalMonitoring.v2.explorer.page', { current: page + 1, total: totalPages || 1 })}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientExplorer;