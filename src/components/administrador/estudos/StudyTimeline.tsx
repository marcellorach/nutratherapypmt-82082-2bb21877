import React from 'react';
import { Calendar, FileText, Brain, Layers, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface StudyTimelineProps {
  estudo: any;
  /** Compact = uma linha horizontal. Detalhado = lista vertical com labels. */
  variant?: 'compact' | 'detailed';
  vectorizedAt?: string | null;
  embeddingsCount?: number | null;
}

const StudyTimeline: React.FC<StudyTimelineProps> = ({
  estudo,
  variant = 'compact',
  vectorizedAt,
  embeddingsCount,
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('pt') ? ptBR : enUS;
  const fmt = (d?: string | null, withTime = false) => {
    if (!d) return null;
    try {
      return format(new Date(d), withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale });
    } catch {
      return null;
    }
  };

  // Publication year (study itself)
  const pubYear = estudo.year || (estudo.full_text_metadata as any)?.year;
  const items = [
    {
      key: 'published',
      icon: <Calendar className="h-3 w-3" />,
      label: t('studies.timeline.published', 'Publicação'),
      value: pubYear ? String(pubYear) : null,
      tone: 'text-muted-foreground',
    },
    {
      key: 'ingested',
      icon: <FileText className="h-3 w-3" />,
      label: t('studies.timeline.ingested', 'Ingestão'),
      value: fmt(estudo.created_at),
      tone: 'text-blue-700',
    },
    {
      key: 'processed',
      icon: <Brain className="h-3 w-3" />,
      label: t('studies.timeline.processed', 'Processado pela IA'),
      value: fmt(estudo.processed_at),
      tone: 'text-purple-700',
    },
    {
      key: 'vectorized',
      icon: <Layers className="h-3 w-3" />,
      label: t('studies.timeline.vectorized', 'Vetorizado (RAG)'),
      value:
        embeddingsCount && embeddingsCount > 0
          ? `${embeddingsCount} ${t('studies.timeline.chunks', 'trechos')}`
          : fmt(vectorizedAt),
      tone: 'text-emerald-700',
    },
    {
      key: 'curated',
      icon: <ShieldCheck className="h-3 w-3" />,
      label: t('studies.timeline.curated', 'Curadoria final'),
      value: fmt(estudo.curated_at),
      tone: 'text-green-700',
    },
  ].filter((it) => it.value);

  if (items.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
        title={t('studies.timeline.title', 'Linha do tempo do estudo')}
      >
        {items.map((it, idx) => (
          <React.Fragment key={it.key}>
            {idx > 0 && <span className="text-border">·</span>}
            <span className={`inline-flex items-center gap-1 ${it.tone}`}>
              {it.icon}
              <span className="font-medium">{it.label}:</span>
              <span>{it.value}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('studies.timeline.title', 'Linha do tempo do estudo')}
      </h4>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-2 text-sm">
            <span className={it.tone}>{it.icon}</span>
            <span className="font-medium text-foreground">{it.label}:</span>
            <span className="text-muted-foreground">{it.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudyTimeline;