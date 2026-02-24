import React from 'react';
import { Sparkles } from "lucide-react";
import { Synergy } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

interface NtaiSynergiesTabProps {
  synergies: Synergy[];
}

const NtaiSynergiesTab: React.FC<NtaiSynergiesTabProps> = ({ synergies }) => {
  const { t } = useTranslation();

  const getSynergyTypeColor = (type: string) => {
    switch (type) {
      case 'bioavailability_enhancement': return 'bg-green-100 text-green-700 border-green-300';
      case 'efficacy_enhancement': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'potentiation': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'additive': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'antagonism': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h4 className="text-sm font-medium">{t('ntaiSynergies.title')}</h4>
      </div>
      
      {synergies.length > 0 ? (
        <div className="grid gap-3">
          {synergies.map((syn, idx) => (
            <Card key={idx} className="p-4 border-l-4 border-l-blue-400">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {syn.compound1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">+</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {syn.compound2}
                  </Badge>
                </div>
                
                <Badge variant="outline" className={getSynergyTypeColor(syn.synergy_type)}>
                  {syn.synergy_type.replace(/_/g, ' ')}
                </Badge>
                
                <p className="text-sm text-muted-foreground">{syn.effect}</p>
                
                {syn.magnitude && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{t('ntaiSynergies.magnitude')}:</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-8 rounded ${
                            i < syn.magnitude! ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('ntaiSynergies.noSynergies')}</p>
      )}
    </div>
  );
};

export default NtaiSynergiesTab;
