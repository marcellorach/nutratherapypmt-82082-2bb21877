import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PRIORITIZATION_BOARD,
  PRIORITIZATION_STATUSES,
  PrioritizationStatus,
} from '@/data/prioritizationBoard';
import PrioritizationCardItem from './PrioritizationCard';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const STATUS_STYLES: Record<PrioritizationStatus, { dot: string; label: string }> = {
  backlog: { dot: 'bg-gray-400', label: 'Backlog' },
  next: { dot: 'bg-blue-500', label: 'Próximo' },
  in_progress: { dot: 'bg-amber-500', label: 'Em curso' },
  in_test: { dot: 'bg-purple-500', label: 'Em teste' },
  done: { dot: 'bg-emerald-500', label: 'Entregue' },
};

const PrioritizationBoard: React.FC = () => {
  const { t } = useTranslation();
  const [overrides, setOverrides] = useState<Record<string, PrioritizationStatus>>({});
  const [history, setHistory] = useState<Record<string, Array<{ from_status: string | null; to_status: string; moved_at: string; note: string | null }>>>({});

  const loadHistory = async () => {
    const { data } = await supabase
      .from('prioritization_history')
      .select('card_id, from_status, to_status, moved_at, note')
      .order('moved_at', { ascending: true });
    if (data) {
      const map: typeof history = {};
      data.forEach((h: any) => {
        if (!map[h.card_id]) map[h.card_id] = [];
        map[h.card_id].push(h);
      });
      setHistory(map);
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('prioritization_overrides').select('card_id, status');
      if (data) {
        const map: Record<string, PrioritizationStatus> = {};
        data.forEach((o: any) => (map[o.card_id] = o.status));
        setOverrides(map);
      }
      loadHistory();
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

  const defaultTab = PRIORITIZATION_STATUSES.find((s) => grouped[s].length > 0) ?? 'backlog';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="flex flex-wrap h-auto bg-gray-100 p-1 gap-1">
        {PRIORITIZATION_STATUSES.map((status) => {
          const style = STATUS_STYLES[status];
          const count = grouped[status].length;
          return (
            <TabsTrigger
              key={status}
              value={status}
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              <span className="text-xs font-medium uppercase tracking-wide">
                {t(`prioritization.status.${status}`, style.label)}
              </span>
              <span className="text-[10px] font-mono text-gray-500 bg-white rounded-full px-1.5 py-0.5 border">
                {count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {PRIORITIZATION_STATUSES.map((status) => {
        const cards = grouped[status];
        return (
          <TabsContent key={status} value={status} className="mt-4">
            {cards.length === 0 ? (
              <div className="text-sm text-gray-400 italic text-center py-12 border border-dashed rounded-lg">
                Nenhum card neste estágio.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <PrioritizationCardItem
                    key={card.id}
                    card={card}
                    history={history[card.id] ?? []}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

export default PrioritizationBoard;