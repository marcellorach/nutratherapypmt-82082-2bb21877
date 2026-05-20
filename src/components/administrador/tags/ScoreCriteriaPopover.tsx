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
}

function buildCriteria(kind: ScoreKind, sa: any, t: any, lang: 'pt' | 'en'): Criterion[] {
  if (!sa) return [];
  const present = (v: any) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

  if (kind === 'quality') {
    const meth = sa.methodology_type ? localizeEnum(sa.methodology_type, lang) : null;
    const blinding = sa.blinding && sa.blinding !== 'none' ? localizeEnum(sa.blinding, lang) : null;
    const dur = sa.follow_up_duration ? localizeDuration(sa.follow_up_duration, lang) : null;
    return [
      { label: t('studies.criteria.methodology', 'Metodologia declarada'), ok: !!meth, detail: meth || undefined },
      { label: t('studies.criteria.sampleSize', 'Tamanho amostral (n)'), ok: present(sa.sample_size), detail: sa.sample_size ? `n=${sa.sample_size}` : undefined },
      { label: t('studies.criteria.randomized', 'Randomização'), ok: !!sa.randomization },
      { label: t('studies.criteria.placebo', 'Controle com placebo'), ok: !!sa.placebo_controlled },
      { label: t('studies.criteria.blinding', 'Cegamento'), ok: !!blinding, detail: blinding || undefined },
      { label: t('studies.criteria.pvalue', 'Significância estatística (p<0,05)'), ok: !!sa.statistical_significance },
      { label: t('studies.criteria.followUp', 'Duração / seguimento'), ok: !!dur, detail: dur || undefined },
    ];
  }

  if (kind === 'relevance') {
    const species = Array.isArray(sa.species_tested) ? sa.species_tested.map((s: string) => localizeEnum(s, lang)) : [];
    const isCanine = species.some((s: string) => /cão|canine|dog/i.test(s));
    const isHuman = species.some((s: string) => /humano|human/i.test(s));
    const translational = !!sa.translational_relevance || isHuman;
    return [
      { label: t('studies.criteria.speciesTested', 'Espécies testadas'), ok: species.length > 0, detail: species.join(', ') || undefined },
      { label: t('studies.criteria.canine', 'Inclui cães (espécie alvo)'), ok: isCanine },
      { label: t('studies.criteria.clinicalImplication', 'Implicação clínica explícita'), ok: present(sa.clinical_implications) || present(sa.implications) },
      { label: t('studies.criteria.translational', 'Relevância translacional (humano→cão)'), ok: translational, detail: translational ? t('studies.criteria.translationalDetail', 'Aplicável com peso modulado') : undefined },
      { label: t('studies.criteria.dosageInfo', 'Posologia/dosagem reportada'), ok: !!sa.dosage_reported },
    ];
  }

  // novelty
  return [
    { label: t('studies.criteria.novelMechanism', 'Novo mecanismo proposto'), ok: !!sa.novel_mechanism },
    { label: t('studies.criteria.novelCompound', 'Composto novo ou pouco estudado'), ok: !!sa.novel_compound },
    { label: t('studies.criteria.recentYear', 'Publicação recente (≤5 anos)'), ok: !!sa.recent_publication },
    { label: t('studies.criteria.contradicts', 'Contradiz consenso anterior'), ok: !!sa.contradicts_prior },
    { label: t('studies.criteria.gapFilling', 'Preenche lacuna na literatura'), ok: !!sa.fills_evidence_gap },
  ];
}

const ScoreCriteriaPopover: React.FC<ScoreCriteriaPopoverProps> = ({ kind, studyAssessment, score, children }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
  const criteria = buildCriteria(kind, studyAssessment, t, lang as 'pt' | 'en');
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
      <PopoverContent className="w-80" align="start">
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
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-muted-foreground border-t pt-2">
            {t('studies.criteria.note', 'Critérios derivados de study_assessment. Itens marcados como “não informado” não foram extraídos do PDF.')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ScoreCriteriaPopover;