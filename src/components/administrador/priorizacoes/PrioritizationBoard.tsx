import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRIORITIZATION_BOARD,
  PRIORITIZATION_STATUSES,
  PrioritizationStatus,
} from '@/data/prioritizationBoard';
import PrioritizationCardItem from './PrioritizationCard';
import { supabase } from '@/integrations/supabase/client';
import { KanbanDndProvider, DroppableColumn, DraggableCard } from './dnd/KanbanDnd';
import { toast } from '@/components/ui/use-toast';

const STATUS_STYLES: Record<PrioritizationStatus, { bg: string; label: string }> = {
  backlog: { bg: 'bg-gray-50 border-gray-200', label: 'Backlog' },
  next: { bg: 'bg-blue-50 border-blue-200', label: 'Próximo' },
  in_progress: { bg: 'bg-amber-50 border-amber-200', label: 'Em curso' },
  in_test: { bg: 'bg-purple-50 border-purple-200', label: 'Em teste' },
  done: { bg: 'bg-emerald-50 border-emerald-200', label: 'Entregue' },
};

const PrioritizationBoard: React.FC = () => {
  const { t } = useTranslation();
  const [overrides, setOverrides] = useState<Record<string, PrioritizationStatus>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('prioritization_overrides').select('card_id, status');
      if (data) {
        const map: Record<string, PrioritizationStatus> = {};
        data.forEach((o: any) => (map[o.card_id] = o.status));
        setOverrides(map);
      }
    })();
  }, []);

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
      .forEach((card) => {
        const status = overrides[card.id] ?? card.status;
        if (map[status]) map[status].push(card);
      });
    return map;
  }, [overrides]);

  const handleDrop = async (cardId: string, columnId: string) => {
    const newStatus = columnId as PrioritizationStatus;
    if (!PRIORITIZATION_STATUSES.includes(newStatus)) return;
    const card = PRIORITIZATION_BOARD.find((c) => c.id === cardId);
    if (!card) return;
    const current = overrides[cardId] ?? card.status;
    if (current === newStatus) return;
    setOverrides((prev) => ({ ...prev, [cardId]: newStatus }));
    const { error } = await supabase
      .from('prioritization_overrides')
      .upsert(
        { card_id: cardId, status: newStatus, sort_order: card.order },
        { onConflict: 'card_id' },
      );
    if (error) {
      toast({ title: 'Falha ao mover card', description: error.message, variant: 'destructive' });
      setOverrides((prev) => {
        const next = { ...prev };
        if (card.status === newStatus) delete next[cardId];
        else next[cardId] = current;
        return next;
      });
    }
  };

  return (
    <KanbanDndProvider onDrop={handleDrop}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full">
        {PRIORITIZATION_STATUSES.map((status) => {
        const style = STATUS_STYLES[status];
        const cards = grouped[status];
        return (
          <DroppableColumn
            key={status}
            id={status}
            className={`rounded-lg border ${style.bg} p-2 flex flex-col min-h-[200px] min-w-0`}
          >
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
                cards.map((card) => (
                  <DraggableCard key={card.id} id={card.id}>
                    <PrioritizationCardItem card={card} />
                  </DraggableCard>
                ))
              )}
            </div>
          </DroppableColumn>
        );
        })}
      </div>
    </KanbanDndProvider>
  );
};

export default PrioritizationBoard;