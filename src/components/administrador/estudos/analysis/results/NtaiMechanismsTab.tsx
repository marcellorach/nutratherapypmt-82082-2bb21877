import React from 'react';
import { Atom, ArrowRight } from "lucide-react";
import { MolecularMechanism } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface NtaiMechanismsTabProps {
  mechanisms: MolecularMechanism[];
}

const NtaiMechanismsTab: React.FC<NtaiMechanismsTabProps> = ({ mechanisms }) => {
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'inflammatory': return 'bg-red-100 text-red-700 border-red-300';
      case 'oxidative_stress': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'metabolic': return 'bg-green-100 text-green-700 border-green-300';
      case 'immunomodulatory': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'neuroprotective': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'inhibition': return 'bg-red-50 text-red-600 border-red-200';
      case 'activation': return 'bg-green-50 text-green-600 border-green-200';
      case 'modulation': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Atom className="h-5 w-5 text-purple-600" />
        <h4 className="text-sm font-medium">Mecanismos Moleculares</h4>
      </div>
      
      {mechanisms.length > 0 ? (
        <div className="grid gap-3">
          {mechanisms.map((mech, idx) => (
            <Card key={idx} className="p-4 border-l-4 border-l-purple-400">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{mech.name}</h5>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className={getActionColor(mech.action)}>
                        {mech.action}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50">
                        {mech.type}
                      </Badge>
                      {mech.category && (
                        <Badge variant="outline" className={getCategoryColor(mech.category)}>
                          {mech.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {mech.target && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    <span>Alvo: <span className="font-medium text-foreground">{mech.target}</span></span>
                  </div>
                )}
                
                {mech.downstream_effects && mech.downstream_effects.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium">Efeitos downstream:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {mech.downstream_effects.map((effect, i) => (
                        <li key={i}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nenhum mecanismo molecular identificado.</p>
      )}
    </div>
  );
};

export default NtaiMechanismsTab;
