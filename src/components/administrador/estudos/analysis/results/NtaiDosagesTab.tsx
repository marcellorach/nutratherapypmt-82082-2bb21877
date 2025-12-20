import React from 'react';
import { Pill, Scale } from "lucide-react";
import { ContextualDosage } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

interface NtaiDosagesTabProps {
  dosages: ContextualDosage[];
}

const NtaiDosagesTab: React.FC<NtaiDosagesTabProps> = ({ dosages }) => {
  const { t } = useTranslation();
  
  const getSpeciesColor = (species?: string) => {
    switch (species) {
      case 'canine': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'feline': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'equine': return 'bg-green-100 text-green-700 border-green-300';
      case 'human': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'rodent': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getSpeciesLabel = (species?: string) => {
    switch (species) {
      case 'canine': return t('ntai.species.canine', 'Canine');
      case 'feline': return t('ntai.species.feline', 'Feline');
      case 'equine': return t('ntai.species.equine', 'Equine');
      case 'human': return t('ntai.species.human', 'Human');
      case 'rodent': return t('ntai.species.rodent', 'Rodent');
      default: return t('ntai.species.other', 'Other');
    }
  };

  const getRouteIcon = (route?: string) => {
    switch (route) {
      case 'oral': return '💊';
      case 'topical': return '🧴';
      case 'intravenous': return '💉';
      case 'subcutaneous': return '💉';
      default: return '💊';
    }
  };

  const formatDosageAmount = (dos: ContextualDosage) => {
    // Range format (amount_min and amount_max)
    if (dos.amount_min !== undefined && dos.amount_max !== undefined) {
      return `${dos.amount_min} - ${dos.amount_max}`;
    }
    // Single amount
    if (dos.amount !== undefined) {
      return `${dos.amount}`;
    }
    // Only text available
    if (dos.amount_text) {
      return dos.amount_text;
    }
    return '-';
  };

  const isRange = (dos: ContextualDosage) => {
    return dos.amount_min !== undefined && dos.amount_max !== undefined;
  };

  const hasStructuredAmount = (dos: ContextualDosage) => {
    return dos.amount !== undefined || (dos.amount_min !== undefined && dos.amount_max !== undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-green-600" />
        <h4 className="text-sm font-medium">{t('ntai.clinicalDosages', 'Dosagens Clínicas')}</h4>
      </div>
      
      {dosages.length > 0 ? (
        <div className="grid gap-3">
          {dosages.map((dos, idx) => (
            <Card key={idx} className="p-4 border-l-4 border-l-green-400">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{dos.compound}</h5>
                    
                    {hasStructuredAmount(dos) ? (
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-green-600">
                          {formatDosageAmount(dos)}
                        </span>
                        <span className="text-sm text-muted-foreground">{dos.unit}</span>
                        {dos.per_body_weight && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                            <Scale className="h-3 w-3 mr-1" />
                            {t('ntai.perBodyWeight', 'por peso')}
                          </Badge>
                        )}
                      </div>
                    ) : dos.amount_text ? (
                      <div className="mt-1">
                        <span className="text-sm font-medium text-green-600">{dos.amount_text}</span>
                      </div>
                    ) : null}
                    
                    {isRange(dos) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('ntai.dosageRange', 'Intervalo de dosagem')}
                      </div>
                    )}
                  </div>
                  {dos.route && (
                    <span className="text-2xl">{getRouteIcon(dos.route)}</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {dos.species && (
                    <Badge variant="outline" className={getSpeciesColor(dos.species)}>
                      {getSpeciesLabel(dos.species)}
                    </Badge>
                  )}
                  {dos.route && (
                    <Badge variant="outline" className="bg-gray-50">
                      {dos.route}
                    </Badge>
                  )}
                  {dos.source === 'stage1_fallback' && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {t('ntai.parsedFromText', 'Extraído do texto')}
                    </Badge>
                  )}
                </div>
                
                {dos.frequency && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('ntai.frequency', 'Frequência')}:</span>{' '}
                    <span className="font-medium">{dos.frequency}</span>
                  </div>
                )}
                
                {dos.duration && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('ntai.duration', 'Duração')}:</span>{' '}
                    <span className="font-medium">{dos.duration}</span>
                  </div>
                )}
                
                {dos.condition && (
                  <div className="text-xs text-muted-foreground italic">
                    {t('ntai.for', 'Para')}: {dos.condition}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('ntai.noDosagesIdentified', 'Nenhuma dosagem específica identificada.')}</p>
      )}
    </div>
  );
};

export default NtaiDosagesTab;
