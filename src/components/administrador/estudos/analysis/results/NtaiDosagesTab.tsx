import React from 'react';
import { Pill } from "lucide-react";
import { ContextualDosage } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface NtaiDosagesTabProps {
  dosages: ContextualDosage[];
}

const NtaiDosagesTab: React.FC<NtaiDosagesTabProps> = ({ dosages }) => {
  const getSpeciesColor = (species?: string) => {
    switch (species) {
      case 'canine': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'feline': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'equine': return 'bg-green-100 text-green-700 border-green-300';
      case 'human': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-green-600" />
        <h4 className="text-sm font-medium">Dosagens Clínicas</h4>
      </div>
      
      {dosages.length > 0 ? (
        <div className="grid gap-3">
          {dosages.map((dos, idx) => (
            <Card key={idx} className="p-4 border-l-4 border-l-green-400">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{dos.compound}</h5>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-green-600">{dos.amount}</span>
                      <span className="text-sm text-muted-foreground">{dos.unit}</span>
                    </div>
                  </div>
                  {dos.route && (
                    <span className="text-2xl">{getRouteIcon(dos.route)}</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {dos.species && (
                    <Badge variant="outline" className={getSpeciesColor(dos.species)}>
                      {dos.species}
                    </Badge>
                  )}
                  {dos.route && (
                    <Badge variant="outline" className="bg-gray-50">
                      {dos.route}
                    </Badge>
                  )}
                </div>
                
                {dos.frequency && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Frequência:</span>{' '}
                    <span className="font-medium">{dos.frequency}</span>
                  </div>
                )}
                
                {dos.duration && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Duração:</span>{' '}
                    <span className="font-medium">{dos.duration}</span>
                  </div>
                )}
                
                {dos.condition && (
                  <div className="text-xs text-muted-foreground italic">
                    Para: {dos.condition}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nenhuma dosagem específica identificada.</p>
      )}
    </div>
  );
};

export default NtaiDosagesTab;
