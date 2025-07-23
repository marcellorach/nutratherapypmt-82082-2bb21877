
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

const EvidenceLegendPanel = () => {
  return (
    <Card className="mb-4 bg-slate-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-3">Legenda da Evidência Científica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Convergência de Estudos</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800">≥4.0 Alta</Badge>
                  <Badge className="bg-amber-100 text-amber-800">2.0-3.9 Moderada</Badge>
                  <Badge className="bg-red-100 text-red-800">&lt;2.0 Baixa</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mede o grau de concordância entre diferentes estudos científicos
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Eficácia por Condição</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800">≥4.0 Alta</Badge>
                  <Badge className="bg-amber-100 text-amber-800">2.0-3.9 Moderada</Badge>
                  <Badge className="bg-red-100 text-red-800">&lt;2.0 Baixa</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Eficácia específica para cada condição de saúde nas tags
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvidenceLegendPanel;
