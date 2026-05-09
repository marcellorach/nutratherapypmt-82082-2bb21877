import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pill, AlertCircle } from 'lucide-react';
import { PharmacologyService, type DrugLookupResult } from '@/services/pharmacology-service';
import { useTranslation } from 'react-i18next';

interface DrugLookupBadgeProps {
  medicationName: string;
}

/**
 * Resolve um nome livre de medicamento (marca comercial ou DCI) contra o
 * catálogo `drug_brands`/`drug_substances` e mostra o princípio ativo + classe.
 * Quando não há match exibe um aviso "não reconhecido" para a vet.
 */
const DrugLookupBadge: React.FC<DrugLookupBadgeProps> = ({ medicationName }) => {
  const { t } = useTranslation();
  const [result, setResult] = useState<DrugLookupResult | null>(null);

  useEffect(() => {
    let active = true;
    PharmacologyService.lookup(medicationName).then(r => {
      if (active) setResult(r);
    }).catch(() => active && setResult({ matchType: 'none', query: medicationName }));
    return () => { active = false; };
  }, [medicationName]);

  if (!result) return null;

  if (result.matchType === 'none') {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 bg-amber-50">
              <AlertCircle className="h-3 w-3" />
              {t('pharmacology.lookup.notRecognized', 'Não reconhecido')}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-xs">
            {t('pharmacology.lookup.notRecognizedTooltip', 'Esta medicação não está na Base Farmacológica. Avise um administrador para cadastrá-la.')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const sub = result.substance;
  const className = sub?.drug_class || '';
  const label = result.matchType === 'brand'
    ? `= ${sub?.inn_name ?? '?'}`
    : sub?.inn_name ?? '?';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1">
            <Pill className="h-3 w-3" />
            <span>{label}</span>
            {className && <span className="opacity-70">· {className}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs space-y-1">
          {result.brand && (
            <p><strong>{result.brand.brand_name}</strong>{result.brand.manufacturer ? ` — ${result.brand.manufacturer}` : ''}</p>
          )}
          {sub?.mechanism && <p className="text-muted-foreground">{sub.mechanism}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DrugLookupBadge;