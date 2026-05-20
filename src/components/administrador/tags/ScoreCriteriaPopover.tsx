import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, X, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizeEnum, localizeDuration } from '@/utils/llmEnumLocalizer';

type ScoreKind = 'quality' | 'relevance' | 'novelty';

interface ScoreCriteriaPopoverProps {
  kind: ScoreKind;
  studyAssessment: any;
  score: number;
  children: React.ReactNode;
}

interface Criterion {
  label: string;
  ok: boolean | null; // null = não informado
  detail?: string;
  weight?: number; // contribution to score, 0-1 (relative within the kind)
  penalty?: string; // human-readable reason if ok=true but partial credit
}

function buildCriteria(kind: ScoreKind, sa: any, t: any, lang: 'pt' | 'en'): Criterion[] {
  if (!sa) return [];
  const present = (v: any) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

  if (kind === 'quality') {
    const meth = sa.methodology_type ? localizeEnum(sa.methodology_type, lang) : null;
    const blinding = sa.blinding && sa.blinding !== 'none' ? localizeEnum(sa.blinding, lang) : null;
    const dur = sa.follow_up_duration ? localizeDuration(sa.follow_up_duration, lang) : null;
    // Heuristic penalty signals
    const n = Number(sa.sample_size) || 0;
    const samplePenalty = n > 0 && n < 100
      ? (lang === 'pt' ? `n<100 → potência estatística limitada` : `n<100 → limited statistical power`)
      : n >= 100 && n < 300
      ? (lang === 'pt' ? `n=${n} → potência moderada` : `n=${n} → moderate power`)
      : undefined;
    const durStr = String(sa.follow_up_duration || '');
    const weeksMatch = durStr.match(/(\d+)\s*(week|semana)/i);
    const monthsMatch = durStr.match(/(\d+)\s*(month|m[eê]s)/i);
    const weeks = weeksMatch ? parseInt(weeksMatch[1]) : (monthsMatch ? parseInt(monthsMatch[1]) * 4 : 0);
    const durPenalty = weeks > 0 && weeks < 24
      ? (lang === 'pt' ? `<6 meses → desfechos crônicos não capturados` : `<6 months → chronic outcomes not captured`)
      : undefined;
    return [
      { label: t('studies.criteria.methodology', 'Metodologia declarada'), ok: !!meth, detail: meth || undefined, weight: 0.20 },
      { label: t('studies.criteria.sampleSize', 'Tamanho amostral (n)'), ok: present(sa.sample_size), detail: sa.sample_size ? `n=${sa.sample_size}` : undefined, weight: 0.20, penalty: samplePenalty },
      { label: t('studies.criteria.randomized', 'Randomização'), ok: !!sa.randomization, weight: 0.15 },
      { label: t('studies.criteria.placebo', 'Controle com placebo'), ok: !!sa.placebo_controlled, weight: 0.10 },
      { label: t('studies.criteria.blinding', 'Cegamento'), ok: !!blinding, detail: blinding || undefined, weight: 0.10 },
      { label: t('studies.criteria.pvalue', 'Significância estatística (p<0,05)'), ok: !!sa.statistical_significance, weight: 0.10 },
      { label: t('studies.criteria.followUp', 'Duração / seguimento'), ok: !!dur, detail: dur || undefined, weight: 0.10, penalty: durPenalty },
      { label: t('studies.criteria.replication', 'Replicação independente'), ok: !!sa.replicated, weight: 0.05,
        penalty: !sa.replicated ? (lang === 'pt' ? 'sem replicação reportada' : 'no replication reported') : undefined },
    ];
  }

  if (kind === 'relevance') {
    const species = Array.isArray(sa.species_tested) ? sa.species_tested.map((s: string) => localizeEnum(s, lang)) : [];
    const isCanine = species.some((s: string) => /cão|canine|dog/i.test(s));
    const isHuman = species.some((s: string) => /humano|human/i.test(s));
    const translational = !!sa.translational_relevance || isHuman;
    const transPenalty = !isCanine && isHuman
      ? (lang === 'pt' ? 'evidência humana → cão tem peso modulado (RC-003)' : 'human → dog evidence is weight-modulated (RC-003)')
      : undefined;
    return [
      { label: t('studies.criteria.speciesTested', 'Espécies testadas'), ok: species.length > 0, detail: species.join(', ') || undefined, weight: 0.15 },
      { label: t('studies.criteria.canine', 'Inclui cães (espécie alvo)'), ok: isCanine, weight: 0.35, penalty: transPenalty },
      { label: t('studies.criteria.clinicalImplication', 'Implicação clínica explícita'), ok: present(sa.clinical_implications) || present(sa.implications), weight: 0.20 },
      { label: t('studies.criteria.translational', 'Relevância translacional (humano→cão)'), ok: translational, detail: translational ? t('studies.criteria.translationalDetail', 'Aplicável com peso modulado') : undefined, weight: 0.15 },
      { label: t('studies.criteria.dosageInfo', 'Posologia/dosagem reportada'), ok: !!sa.dosage_reported, weight: 0.15 },
    ];
  }

  // novelty
  return [
    { label: t('studies.criteria.novelMechanism', 'Novo mecanismo proposto'), ok: !!sa.novel_mechanism, weight: 0.25 },
    { label: t('studies.criteria.novelCompound', 'Composto novo ou pouco estudado'), ok: !!sa.novel_compound, weight: 0.20 },
    { label: t('studies.criteria.recentYear', 'Publicação recente (≤5 anos)'), ok: !!sa.recent_publication, weight: 0.20 },
    { label: t('studies.criteria.contradicts', 'Contradiz consenso anterior'), ok: !!sa.contradicts_prior, weight: 0.15 },
    { label: t('studies.criteria.gapFilling', 'Preenche lacuna na literatura'), ok: !!sa.fills_evidence_gap, weight: 0.20 },
  ];
}

function computeRationale(criteria: Criterion[], score: number, kind: ScoreKind, lang: 'pt' | 'en'): string {
  const penalties = criteria.filter(c => c.penalty).map(c => c.penalty as string);
  const missing = criteria.filter(c => c.ok === false).map(c => c.label);
  const parts: string[] = [];
  if (score >= 4.5) {
    parts.push(lang === 'pt' ? 'Estudo de alto rigor' : 'High-rigor study');
  } else if (score >= 3.5) {
    parts.push(lang === 'pt' ? `Score ${score.toFixed(1)}/5 — teto causado por:` : `Score ${score.toFixed(1)}/5 — ceiling caused by:`);
  } else {
    parts.push(lang === 'pt' ? `Score ${score.toFixed(1)}/5 — limitações relevantes:` : `Score ${score.toFixed(1)}/5 — relevant limitations:`);
  }
  if (penalties.length > 0) parts.push(penalties.join('; '));
  if (missing.length > 0 && score < 4.5) {
    parts.push((lang === 'pt' ? 'critérios ausentes: ' : 'missing criteria: ') + missing.slice(0, 3).join(', '));
  }
  return parts.join(' · ');
}

const ScoreCriteriaPopover: React.FC<ScoreCriteriaPopoverProps> = ({ kind, studyAssessment, score, children }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
  const criteria = buildCriteria(kind, studyAssessment, t, lang as 'pt' | 'en');
  const rationale = criteria.length > 0 ? computeRationale(criteria, score, kind, lang as 'pt' | 'en') : null;
  // Prefer LLM-provided rationale if present in study_assessment
  const llmRationale =
    studyAssessment?.score_rationale?.[kind] ||
    studyAssessment?.[`${kind}_rationale`] ||
    null;
  const titleKey =
    kind === 'quality'
      ? 'studies.criteria.qualityTitle'
      : kind === 'relevance'
      ? 'studies.criteria.relevanceTitle'
      : 'studies.criteria.noveltyTitle';
  const defaultTitle =
    kind === 'quality' ? 'Critérios — Qualidade Metodológica' : kind === 'relevance' ? 'Critérios — Relevância Clínica' : 'Critérios — Novidade Científica';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md">
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-semibold">{t(titleKey, defaultTitle)}</h4>
            <span className="text-xs text-muted-foreground">{score.toFixed(1)}/5</span>
          </div>
          {criteria.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('studies.criteria.empty', 'Nenhum critério estruturado disponível. Score baseado em heurística.')}</p>
          ) : (
            <ul className="space-y-1.5">
              {criteria.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  {c.ok === true ? (
                    <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  ) : c.ok === false ? (
                    <X className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span className="flex-1">
                    <span className={c.ok === false ? 'text-muted-foreground line-through' : 'text-foreground'}>{c.label}</span>
                    {c.detail && <span className="text-muted-foreground"> — {c.detail}</span>}
                    {c.penalty && (
                      <span className="block text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                        ⚠ {c.penalty}
                      </span>
                    )}
                  </span>
                  {typeof c.weight === 'number' && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">
                      {Math.round(c.weight * 100)}%
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {(llmRationale || rationale) && (
            <div className="border-t pt-2 mt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                {t('studies.criteria.rationaleLabel', 'Por que este score?')}
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">{llmRationale || rationale}</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground border-t pt-2">
            {t('studies.criteria.noteV2', 'Coluna % = peso relativo do critério no score. ⚠ indica penalização parcial (critério presente mas abaixo do ideal). Itens com ? não foram extraídos do PDF.')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ScoreCriteriaPopover;