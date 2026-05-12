import React from 'react';
import { useTranslation } from 'react-i18next';

export type PhysicalExam = {
  general?: {
    posture?: string | null;
    skin_lesions?: string | null;
    behavior?: string | null;
    body_condition_score?: number | null;
  } | null;
  specific?: {
    physiological?: {
      hr_bpm?: number | null;
      rr_rpm?: number | null;
      temp_c?: number | null;
      mucous_membranes?: string | null;
      crt_s?: number | null;
    } | null;
    orthopedic?: string | null;
    cardiovascular?: string | null;
    neurological?: string | null;
    abdominal?: string | null;
    dermatological?: string | null;
  } | null;
} | null;

interface Props {
  exam: PhysicalExam | undefined;
  /** Free-text fallback (legacy `clinical_exam` column) */
  fallbackText?: string | null;
}

const Row: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground min-w-[120px]">{label}</span>
      <span className="text-foreground">{String(value)}</span>
    </div>
  );
};

const PhysicalExamBlock: React.FC<Props> = ({ exam, fallbackText }) => {
  const { t } = useTranslation();

  if (!exam || (typeof exam === 'object' && !exam.general && !exam.specific)) {
    if (fallbackText) {
      return (
        <div>
          <p className="text-xs uppercase text-muted-foreground">
            {t('physicalExam.title')} <span className="opacity-60">({t('physicalExam.freeText')})</span>
          </p>
          <p className="text-sm">{fallbackText}</p>
        </div>
      );
    }
    return null;
  }

  const g = exam.general ?? {};
  const s = exam.specific ?? {};
  const ph = s?.physiological ?? {};

  const hasGeneral = g && Object.values(g).some((v) => v !== null && v !== undefined && v !== '');
  const hasSpecific = s && (
    Object.values(ph).some((v) => v !== null && v !== undefined && v !== '') ||
    s.orthopedic || s.cardiovascular || s.neurological || s.abdominal || s.dermatological
  );

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase text-muted-foreground">{t('physicalExam.title')}</p>
      {hasGeneral && (
        <div className="rounded-md border border-border bg-muted/20 p-2">
          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1">
            {t('physicalExam.general')}
          </p>
          <div className="space-y-0.5">
            <Row label={t('physicalExam.posture')} value={g.posture} />
            <Row label={t('physicalExam.skinLesions')} value={g.skin_lesions} />
            <Row label={t('physicalExam.behavior')} value={g.behavior} />
            <Row label={t('physicalExam.bcs')} value={g.body_condition_score != null ? `${g.body_condition_score}/9` : null} />
          </div>
        </div>
      )}
      {hasSpecific && (
        <div className="rounded-md border border-border bg-muted/20 p-2">
          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1">
            {t('physicalExam.specific')}
          </p>
          <div className="space-y-0.5">
            <Row label={t('physicalExam.hr')} value={ph.hr_bpm != null ? `${ph.hr_bpm} bpm` : null} />
            <Row label={t('physicalExam.rr')} value={ph.rr_rpm != null ? `${ph.rr_rpm} rpm` : null} />
            <Row label={t('physicalExam.temp')} value={ph.temp_c != null ? `${ph.temp_c} °C` : null} />
            <Row label={t('physicalExam.mucous')} value={ph.mucous_membranes} />
            <Row label={t('physicalExam.crt')} value={ph.crt_s != null ? `${ph.crt_s} s` : null} />
            <Row label={t('physicalExam.orthopedic')} value={s.orthopedic} />
            <Row label={t('physicalExam.cardiovascular')} value={s.cardiovascular} />
            <Row label={t('physicalExam.neurological')} value={s.neurological} />
            <Row label={t('physicalExam.abdominal')} value={s.abdominal} />
            <Row label={t('physicalExam.dermatological')} value={s.dermatological} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysicalExamBlock;
