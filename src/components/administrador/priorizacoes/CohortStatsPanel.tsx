import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { canonicalConditionKey, localizeConditionName } from '@/services/condition-name-localizer';
import { canonicalLabFlag } from '@/services/lab-flag-canonicalizer';

interface Stats {
  total: number;
  demographics?: { avg_age: number; avg_weight: number; male_n: number; female_n: number; neutered_n: number };
  top_breeds?: Array<{ breed: string; n: number }>;
  top_conditions?: Array<{ name: string; n: number; mild: number; moderate: number; severe: number }>;
  coverage?: {
    pets_with_condition: number;
    pets_with_exam: number;
    pets_with_consultation: number;
    avg_exams_per_pet: number;
    avg_consultations_per_pet: number;
    medications_total: number;
  };
  top_flags?: Array<{ flag: string; n: number }>;
}

const Bar: React.FC<{ value: number; total: number; color?: string }> = ({ value, total, color = 'bg-blue-500' }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-gray-200 rounded overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const CohortStatsPanel: React.FC<{ cohortId: string; cohortReady: boolean }> = ({ cohortId, cohortReady }) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!open || stats || !cohortReady) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc('get_cohort_stats', { p_cohort_id: cohortId });
      if (!error) setStats(data as unknown as Stats);
      setLoading(false);
    })();
  }, [open, stats, cohortId, cohortReady]);

  // De-duplicate PT/EN condition variants and lab-flag aliases on the client
  const normalized = useMemo(() => {
    if (!stats) return stats;
    const locale = i18n.language || 'pt';
    const condMap = new Map<string, { name: string; n: number; mild: number; moderate: number; severe: number }>();
    (stats.top_conditions || []).forEach((c) => {
      const key = canonicalConditionKey(c.name);
      const display = localizeConditionName(key, locale);
      const prev = condMap.get(key);
      if (prev) {
        prev.n += c.n;
        prev.mild += c.mild;
        prev.moderate += c.moderate;
        prev.severe += c.severe;
      } else {
        condMap.set(key, { ...c, name: display });
      }
    });
    const flagMap = new Map<string, { flag: string; n: number }>();
    (stats.top_flags || []).forEach((f) => {
      const key = canonicalLabFlag(f.flag);
      const prev = flagMap.get(key);
      if (prev) prev.n += f.n;
      else flagMap.set(key, { flag: key, n: f.n });
    });
    return {
      ...stats,
      top_conditions: Array.from(condMap.values()).sort((a, b) => b.n - a.n).slice(0, 10),
      top_flags: Array.from(flagMap.values()).sort((a, b) => b.n - a.n).slice(0, 12),
    };
  }, [stats, i18n.language]);

  if (!cohortReady) return null;

  return (
    <div className="border rounded-md bg-gray-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md"
      >
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          {t('prioritization.cohortStats.title')}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="p-3 pt-1 space-y-3 text-[11px]">
          {loading && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" /> {t('prioritization.cohortStats.loading')}
            </div>
          )}
          {normalized && normalized.total === 0 && (
            <div className="text-gray-500">{t('prioritization.cohortStats.empty')}</div>
          )}
          {normalized && normalized.total > 0 && (
            <>
              {/* Demografia */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white rounded p-1.5">
                  <div className="text-gray-500">{t('prioritization.cohortStats.avgAge')}</div>
                  <div className="text-sm font-semibold text-gray-900">{stats.demographics?.avg_age ?? '—'}a</div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="text-gray-500">{t('prioritization.cohortStats.avgWeight')}</div>
                  <div className="text-sm font-semibold text-gray-900">{stats.demographics?.avg_weight ?? '—'}kg</div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="text-gray-500">{t('prioritization.cohortStats.sexSplit')}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    ♂ {stats.demographics?.male_n ?? 0} · ♀ {stats.demographics?.female_n ?? 0}
                  </div>
                </div>
                <div className="bg-white rounded p-1.5">
                  <div className="text-gray-500">{t('prioritization.cohortStats.neutered')}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {stats.demographics?.neutered_n ?? 0}/{stats.total}
                  </div>
                </div>
              </div>

              {/* Cobertura */}
              {stats.coverage && (
                <div>
                  <div className="text-gray-600 mb-1 font-medium">{t('prioritization.cohortStats.coverage')}</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    <div>
                      <div className="text-gray-500">{t('prioritization.cohortStats.withCondition')}: {stats.coverage.pets_with_condition}/{stats.total}</div>
                      <Bar value={stats.coverage.pets_with_condition} total={stats.total} color="bg-emerald-500" />
                    </div>
                    <div>
                      <div className="text-gray-500">{t('prioritization.cohortStats.withExam')}: {stats.coverage.pets_with_exam}/{stats.total}</div>
                      <Bar value={stats.coverage.pets_with_exam} total={stats.total} color="bg-blue-500" />
                    </div>
                    <div>
                      <div className="text-gray-500">{t('prioritization.cohortStats.withConsultation')}: {stats.coverage.pets_with_consultation}/{stats.total}</div>
                      <Bar value={stats.coverage.pets_with_consultation} total={stats.total} color="bg-purple-500" />
                    </div>
                  </div>
                  <div className="text-gray-500 mt-1">
                    {t('prioritization.cohortStats.avgPerPet', {
                      exams: stats.coverage.avg_exams_per_pet,
                      cons: stats.coverage.avg_consultations_per_pet,
                      meds: stats.coverage.medications_total,
                    })}
                  </div>
                </div>
              )}

              {/* Top raças */}
              {stats.top_breeds && stats.top_breeds.length > 0 && (
                <div>
                  <div className="text-gray-600 mb-1 font-medium">{t('prioritization.cohortStats.topBreeds')}</div>
                  <div className="space-y-1">
                    {stats.top_breeds.map((b) => (
                      <div key={b.breed}>
                        <div className="flex justify-between text-gray-700"><span className="truncate">{b.breed}</span><span className="font-mono">{b.n}</span></div>
                        <Bar value={b.n} total={stats.total} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top condições */}
              {stats.top_conditions && stats.top_conditions.length > 0 && (
                <div>
                  <div className="text-gray-600 mb-1 font-medium">{t('prioritization.cohortStats.topConditions')}</div>
                  <div className="space-y-1">
                    {stats.top_conditions.map((c) => (
                      <div key={c.name} className="bg-white rounded p-1.5">
                        <div className="flex justify-between text-gray-800"><span className="truncate font-medium">{c.name}</span><span className="font-mono">{c.n}</span></div>
                        <div className="flex gap-1 mt-1 text-[10px] text-gray-500">
                          <span className="px-1 rounded bg-yellow-100 text-yellow-800">mild {c.mild}</span>
                          <span className="px-1 rounded bg-orange-100 text-orange-800">mod {c.moderate}</span>
                          <span className="px-1 rounded bg-red-100 text-red-800">sev {c.severe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flags laboratoriais */}
              {stats.top_flags && stats.top_flags.length > 0 && (
                <div>
                  <div className="text-gray-600 mb-1 font-medium">{t('prioritization.cohortStats.topFlags')}</div>
                  <div className="flex flex-wrap gap-1">
                    {stats.top_flags.map((f) => (
                      <span key={f.flag} className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        {f.flag} <span className="font-mono">({f.n})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CohortStatsPanel;