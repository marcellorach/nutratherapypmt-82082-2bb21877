import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { PrioritizationCard as Card_, STRATEGIC_VALUE_LABEL } from '@/data/prioritizationBoard';

interface Props {
  card: Card_;
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

const PrioritizationCardItem: React.FC<Props> = ({ card }) => {
  const { i18n, t } = useTranslation();
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
      </CardContent>
    </Card>
  );
};

export default PrioritizationCardItem;