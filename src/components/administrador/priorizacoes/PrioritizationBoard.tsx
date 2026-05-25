import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRIORITIZATION_BOARD,
  PRIORITIZATION_STATUSES,
  PrioritizationStatus,
} from '@/data/prioritizationBoard';
import PrioritizationCardItem from './PrioritizationCard';

const STATUS_STYLES: Record<PrioritizationStatus, { bg: string; label: string }> = {
  backlog: { bg: 'bg-gray-50 border-gray-200', label: 'Backlog' },
  next: { bg: 'bg-blue-50 border-blue-200', label: 'Próximo' },
  in_progress: { bg: 'bg-amber-50 border-amber-200', label: 'Em curso' },
  in_test: { bg: 'bg-purple-50 border-purple-200', label: 'Em teste' },
  done: { bg: 'bg-emerald-50 border-emerald-200', label: 'Entregue' },
};

const PrioritizationBoard: React.FC = () => {
  const { t } = useTranslation();

  const grouped = useMemo(() => {
    const map: Record<PrioritizationStatus, typeof PRIORITIZATION_BOARD> = {
      backlog: [],
      next: [],
      in_progress: [],
      in_test: [],
      done: [],
    };
    [...PRIORITIZATION_BOARD]
      .sort((a, b) => a.order - b.order)
      .forEach((card) => map[card.status].push(card));
    return map;
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
      {PRIORITIZATION_STATUSES.map((status) => {
        const style = STATUS_STYLES[status];
        const cards = grouped[status];
        return (
          <div key={status} className={`rounded-lg border ${style.bg} p-2 flex flex-col min-h-[200px]`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                {t(`prioritization.status.${status}`, style.label)}
              </h3>
              <span className="text-[10px] font-mono text-gray-500 bg-white rounded-full px-1.5 py-0.5">
                {cards.length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {cards.length === 0 ? (
                <div className="text-[11px] text-gray-400 italic text-center py-4">—</div>
              ) : (
                cards.map((card) => <PrioritizationCardItem key={card.id} card={card} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrioritizationBoard;