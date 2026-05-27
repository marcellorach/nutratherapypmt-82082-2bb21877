import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, History, ChevronDown, ChevronRight, Stethoscope } from 'lucide-react';
import { PrioritizationCard as Card_, STRATEGIC_VALUE_LABEL } from '@/data/prioritizationBoard';

export interface HistoryEntry {
  from_status: string | null;
  to_status: string;
  moved_at: string;
  note: string | null;
}

interface Props {
  card: Card_;
  history?: HistoryEntry[];
}

const AREA_COLORS: Record<string, string> = {
  patient: 'bg-blue-50 text-blue-700 border-blue-200',
  curation: 'bg-purple-50 text-purple-700 border-purple-200',
  population: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  governance: 'bg-amber-50 text-amber-700 border-amber-200',
  skills: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  infra: 'bg-gray-100 text-gray-700 border-gray-200',
};

const EFFORT_COLORS: Record<string, string> = {
  S: 'bg-emerald-100 text-emerald-800',
  M: 'bg-amber-100 text-amber-800',
  L: 'bg-orange-100 text-orange-800',
  XL: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  next: 'Próximo',
  in_progress: 'Em curso',
  in_test: 'Em teste',
  done: 'Entregue',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const PrioritizationCardItem: React.FC<Props> = ({ card, history = [] }) => {
  const { i18n, t } = useTranslation();
  const [showHistory, setShowHistory] = React.useState(false);
  const isPt = i18n.language?.startsWith('pt');

  const title = isPt ? card.title_pt : card.title_en;
  const description = isPt ? card.description_pt : card.description_en;
  const rationale = isPt ? card.rationale_pt : card.rationale_en;

  return (
    <Card className="border-l-4 border-l-primary/40 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] font-mono text-gray-400 tabular-nums mt-0.5 shrink-0">#{card.order}</span>
            <h4 className="text-sm font-semibold leading-tight text-gray-800 break-words">{title}</h4>
          </div>
          <Badge className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${EFFORT_COLORS[card.effort]}`} variant="secondary">
            {card.effort}
          </Badge>
        </div>

        <p className="text-xs text-gray-600 leading-snug">{description}</p>

        {rationale && (
          <div className="text-[10px] italic text-gray-500 border-l-2 border-gray-200 pl-2">
            {rationale}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1 pt-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${AREA_COLORS[card.area]}`}>
            {t(`prioritization.area.${card.area}`, card.area)}
          </Badge>
          {card.value.map((v) => (
            <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-white">
              {isPt ? STRATEGIC_VALUE_LABEL[v].pt : STRATEGIC_VALUE_LABEL[v].en}
            </Badge>
          ))}
          {card.requiresVetCuratorValidation && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 bg-rose-50 text-rose-700 border-rose-300 inline-flex items-center gap-1"
              title={isPt
                ? 'Requer validação de um veterinário-curador antes de avançar.'
                : 'Requires vet-curator validation before moving forward.'}
            >
              <Stethoscope className="h-2.5 w-2.5" />
              {isPt ? 'Valida vet-curador' : 'Vet-curator review'}
            </Badge>
          )}
          {card.dependsOn?.length ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500" title={card.dependsOn.join(', ')}>
              <Lock className="h-2.5 w-2.5" />
              {card.dependsOn.length}
            </span>
          ) : null}
        </div>

        {card.deliveredVersion && (
          <div className="text-[10px] text-emerald-600">
            ✓ {t('prioritization.deliveredIn', 'Entregue em')} v{card.deliveredVersion}
          </div>
        )}

        {history.length > 0 && (
          <div className="pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowHistory((v) => !v); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 w-full"
            >
              {showHistory ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
              <History className="h-2.5 w-2.5" />
              <span>Criado {formatDate(history[0].moved_at)}</span>
              {history.length > 1 && <span className="text-gray-400">· {history.length - 1} mov.</span>}
            </button>
            {showHistory && (
              <ul className="mt-1 space-y-0.5 pl-3">
                {history.map((h, i) => (
                  <li key={i} className="text-[10px] text-gray-600 leading-tight">
                    <span className="font-mono text-gray-400">{formatDate(h.moved_at)}</span>
                    {' · '}
                    {h.from_status
                      ? <>{STATUS_LABEL[h.from_status] ?? h.from_status} → <span className="font-medium">{STATUS_LABEL[h.to_status] ?? h.to_status}</span></>
                      : <span className="italic">criado em {STATUS_LABEL[h.to_status] ?? h.to_status}</span>}
                    {h.note && <div className="text-gray-500 italic pl-2">{h.note}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrioritizationCardItem;