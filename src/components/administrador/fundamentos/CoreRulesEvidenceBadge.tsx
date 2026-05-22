import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShieldCheck, Loader2, AlertTriangle, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface EvidenceRow {
  relation: 'supports' | 'contradicts' | 'modulates_weight' | string;
  weight: number;
  quote: string | null;
  rule_id: string;
  core_rules?: { title: string; rule_id: string } | null;
}

interface Props {
  metaStudyId: string;
  compact?: boolean;
}

const RELATION_META: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string; labelKey: string; fallback: string }> = {
  supports: { icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-300', labelKey: 'fundamentos.coreRules.supports', fallback: 'Apoia' },
  contradicts: { icon: AlertTriangle, cls: 'bg-red-50 text-red-700 border-red-300', labelKey: 'fundamentos.coreRules.contradicts', fallback: 'Contradiz' },
  modulates_weight: { icon: Scale, cls: 'bg-amber-50 text-amber-700 border-amber-300', labelKey: 'fundamentos.coreRules.modulates', fallback: 'Modula' },
};

const CoreRulesEvidenceBadge: React.FC<Props> = ({ metaStudyId, compact }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<EvidenceRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (rows !== null) return;
    setLoading(true);
    const { data } = await supabase
      .from('core_rule_evidence')
      .select('relation, weight, quote, rule_id, core_rules!inner(title, rule_id)')
      .eq('meta_study_id', metaStudyId);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [metaStudyId]);

  const counts = (rows || []).reduce<Record<string, number>>((acc, r) => {
    acc[r.relation] = (acc[r.relation] || 0) + 1;
    return acc;
  }, {});
  const total = rows?.length || 0;

  if (total === 0 && !loading) {
    return (
      <Badge variant="outline" className="text-[9px] py-0 text-muted-foreground border-dashed">
        {t('fundamentos.coreRules.none', 'sem core rules')}
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className="inline-flex items-center gap-1 text-[10px]">
          {Object.entries(counts).map(([rel, n]) => {
            const meta = RELATION_META[rel] || RELATION_META.supports;
            const Icon = meta.icon;
            return (
              <Badge key={rel} variant="outline" className={`text-[9px] py-0 ${meta.cls}`}>
                <Icon className="h-2.5 w-2.5 mr-0.5" />
                {n} {t(meta.labelKey, meta.fallback)}
              </Badge>
            );
          })}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto p-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-xs font-semibold mb-2 px-1">
          {t('fundamentos.coreRules.popoverTitle', 'Impacto nas Core Rules')} ({total})
        </div>
        <div className="space-y-1.5">
          {(rows || []).map((r, i) => {
            const meta = RELATION_META[r.relation] || RELATION_META.supports;
            const Icon = meta.icon;
            return (
              <div key={i} className="text-xs border rounded p-1.5 space-y-1">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={`text-[9px] py-0 ${meta.cls}`}>
                    <Icon className="h-2.5 w-2.5 mr-0.5" />
                    {t(meta.labelKey, meta.fallback)}
                  </Badge>
                  <span className="font-mono text-[9px] text-muted-foreground">w {Number(r.weight).toFixed(2)}</span>
                  <span className="font-medium text-[11px] truncate">{r.core_rules?.title || r.rule_id}</span>
                </div>
                {r.quote && (
                  <div className="text-[10px] italic text-muted-foreground border-l-2 border-primary/40 pl-1.5 line-clamp-3">
                    "{r.quote}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CoreRulesEvidenceBadge;