import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Sparkles, GitBranch, FlaskConical, Database, FlaskRound } from 'lucide-react';
import {
  POPULATION_INSIGHTS_SEED,
  InsightStage,
  InsightOrigin,
  PopulationInsight,
} from '@/data/populationInsightsSeed';

const STAGES: { id: InsightStage; label: string; color: string; icon: React.ComponentType<any> }[] = [
  { id: 'discovery', label: 'Descobertas', color: 'bg-blue-50 border-blue-200', icon: Sparkles },
  { id: 'hypothesis', label: 'Hipóteses', color: 'bg-amber-50 border-amber-200', icon: GitBranch },
  { id: 'proposed_meta_study', label: 'Meta-estudos propostos', color: 'bg-purple-50 border-purple-200', icon: FlaskConical },
  { id: 'approved', label: 'Aprovados', color: 'bg-emerald-50 border-emerald-200', icon: Database },
];

const ORIGIN_LABEL: Record<InsightOrigin, string> = {
  synthetic_cohort: 'Cohort sintético',
  kg_gap: 'Gap do KG',
  conflict_detection: 'Conflito detectado',
  literature_news: 'Literatura recente',
};

const ORIGIN_COLOR: Record<InsightOrigin, string> = {
  synthetic_cohort: 'bg-blue-100 text-blue-800',
  kg_gap: 'bg-fuchsia-100 text-fuchsia-800',
  conflict_detection: 'bg-red-100 text-red-800',
  literature_news: 'bg-emerald-100 text-emerald-800',
};

const PopulationInsightsV0: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');

  const grouped = useMemo(() => {
    const map: Record<InsightStage, PopulationInsight[]> = {
      discovery: [], hypothesis: [], proposed_meta_study: [], approved: [],
    };
    POPULATION_INSIGHTS_SEED.forEach((i) => map[i.stage].push(i));
    Object.values(map).forEach((arr) => arr.sort((a, b) => b.discovery_score - a.discovery_score));
    return map;
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-amber-300 bg-amber-50/60">
        <CardContent className="p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <b>Population Insights v0 — esqueleto com DADOS DE EXEMPLO.</b> Os 4 cards abaixo são <b>seed manual</b>
            (arquivo <code>populationInsightsSeed.ts</code>), <u>não</u> são insights reais calculados — servem apenas
            para validar o layout e a taxonomia (origem, score, estágio). Quando o cohort histórico real do parceiro
            clínico chegar (card #7 do board), esta página passa a consultar tabelas reais e os scores são calculados
            de fato: <code>prevalence_delta + kg_gap + actionability</code> normalizado 0–100.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const cards = grouped[s.id];
          return (
            <div key={s.id} className={`rounded-lg border ${s.color} p-2 flex flex-col min-h-[300px]`}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </h3>
                <span className="text-[10px] font-mono text-gray-500 bg-white rounded-full px-1.5 py-0.5">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {cards.length === 0 ? (
                  <div className="text-[11px] text-gray-400 italic text-center py-6">—</div>
                ) : cards.map((c) => (
                  <Card key={c.id} className="bg-white">
                    <CardContent className="p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-semibold leading-tight">{isPt ? c.title_pt : c.title_en}</h4>
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0">{c.discovery_score}</Badge>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-snug">{isPt ? c.summary_pt : c.summary_en}</p>
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <Badge variant="outline" className={`text-[10px] ${ORIGIN_COLOR[c.origin]}`}>
                          {ORIGIN_LABEL[c.origin]}
                        </Badge>
                        {c.cohort_hint && (
                          <span className="text-[10px] text-gray-500 truncate" title={c.cohort_hint}>
                            🧬 {c.cohort_hint}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-700 italic flex items-center gap-1 pt-1 border-t">
                        <FlaskRound className="h-2.5 w-2.5" /> Exemplo (seed) — aguardando cohort real
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PopulationInsightsV0;